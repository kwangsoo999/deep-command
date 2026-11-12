import { describe, it, expect } from "vitest";
import {
  act,
  createState,
  goals,
  missions,
  restore,
  serialize,
  SimulationClock,
  step,
  type State,
} from "../src/simulation";
const start = () => {
  const s = createState();
  act(s, { type: "start" });
  return s;
};
const ticks = (s: State, n: number) => {
  for (let i = 0; i < n; i++) step(s);
};
describe("GameClock and deterministic simulation", () => {
  it("freezes every simulation field while paused and planning", () => {
    const s = start();
    act(s, { type: "waypoint", x: 90, y: 90 });
    act(s, { type: "pause" });
    let before = serialize(s);
    ticks(s, 100);
    expect(serialize(s)).toBe(before);
    act(s, { type: "plan" });
    before = serialize(s);
    ticks(s, 100);
    expect(serialize(s)).toBe(before);
  });
  it("resumes from the same time and advances at 1x / 2x / 4x", () => {
    for (const speed of [1, 2, 4] as const) {
      const s = start(),
        c = new SimulationClock();
      act(s, { type: "speed", value: speed });
      for (let i = 0; i < 20; i++) c.advance(s, 0.5);
      expect(s.time).toBe(10 * speed);
      act(s, { type: "pause" });
      c.advance(s, 0.5);
      expect(s.time).toBe(10 * speed);
      act(s, { type: "pause" });
      c.advance(s, 0.5);
      c.advance(s, 0.5);
      expect(s.time).toBe(11 * speed);
    }
  });
  it("does not double elapsed time for different frame sizes", () => {
    const a = start(),
      b = start(),
      ca = new SimulationClock(),
      cb = new SimulationClock();
    for (let i = 0; i < 100; i++) ca.advance(a, 0.2);
    for (let i = 0; i < 40; i++) cb.advance(b, 0.5);
    expect(a.time).toBe(20);
    expect(serialize(a)).toBe(serialize(b));
  });
  it("replays identical seeded events and contacts", () => {
    const a = start(),
      b = start();
    ticks(a, 200);
    ticks(b, 200);
    expect(serialize(a)).toBe(serialize(b));
    expect(a.incident).not.toBeNull();
  });
  it("restores and continues without duplicate events", () => {
    const a = start();
    ticks(a, 99);
    const b = restore(serialize(a));
    expect(b.mode).toBe("paused");
    act(b, { type: "pause" });
    ticks(a, 35);
    ticks(b, 35);
    expect(serialize(a)).toBe(serialize(b));
  });
});
describe("Gameplay loop", () => {
  it("moves to a waypoint without overshooting", () => {
    const s = start();
    act(s, { type: "waypoint", x: 30, y: 65 });
    ticks(s, 10);
    expect(s.position).toEqual({ x: 30, y: 65 });
    expect(s.waypoint).toBeNull();
  });
  it("consumes power to scan, identifies contacts, blocks scan while paused", () => {
    const s = start();
    for (let i = 0; i < 3; i++) act(s, { type: "scan" });
    expect(
      s.contacts.filter((c) => c.status === "Identified").length,
    ).toBeGreaterThan(0);
    expect(s.power).toBe(91);
    act(s, { type: "pause" });
    act(s, { type: "scan" });
    expect(s.scanCount).toBe(3);
  });
  it("verifies reports only once and expires old reports", () => {
    const s = start();
    act(s, { type: "verify", id: "INT-001" });
    act(s, { type: "verify", id: "INT-001" });
    expect(s.verified).toEqual(["INT-001"]);
    ticks(s, 301);
    expect(s.reports.find((r) => r.id === "INT-002")?.status).toBe("Expired");
  });
  it("protects civilian contacts from abstract engagement", () => {
    const s = start();
    for (let i = 0; i < 4; i++) act(s, { type: "scan" });
    act(s, { type: "order", id: "C-02" });
    expect(s.contacts[1].resolved).toBe(false);
    expect(s.orders).toBe(0);
  });
  it("resolves incidents with supplies and prevents repeat costs", () => {
    const s = start();
    ticks(s, 96);
    expect(s.incident).not.toBeNull();
    act(s, { type: "resolve" });
    expect(s.incident).toBeNull();
    expect(s.supplies).toBe(70);
    act(s, { type: "resolve" });
    expect(s.supplies).toBe(70);
  });
  it("purchases upgrades exactly once with persistent benefits", () => {
    const s = start();
    act(s, { type: "upgrade", id: "sonar" });
    act(s, { type: "upgrade", id: "sonar" });
    expect(s.credits).toBe(400);
    expect(s.upgrades).toEqual(["sonar"]);
    act(s, { type: "scan" });
    expect(s.contacts[0].confidence).toBeGreaterThanOrEqual(50);
  });
  it("completes all five missions through actual actions, grants rewards once, unlocks next", () => {
    let s = start();
    for (let mission = 0; mission < 5; mission++) {
      expect(s.mission).toBe(mission);
      act(s, { type: "waypoint", ...missions[mission].target });
      for (let i = 0; i < 4; i++) act(s, { type: "scan" });
      for (const r of s.reports) act(s, { type: "verify", id: r.id });
      for (let t = 0; t < 400 && s.stage === "active"; t++) {
        if (s.incident) act(s, { type: "resolve" });
        if (t % 30 === 0 && t > 0) act(s, { type: "scan" });
        if (mission === 2 && goals(s)[0]) act(s, { type: "order" });
        if (mission === 4) {
          act(s, { type: "order", id: "C-01" });
          act(s, { type: "order", id: "C-03" });
        }
        step(s);
      }
      expect(s.result?.success).toBe(true);
      expect(s.completed).toContain(mission);
      const credits = s.credits;
      ticks(s, 100);
      expect(s.credits).toBe(credits);
      s = restore(serialize(s));
      if (mission < 4) {
        act(s, { type: "next" });
        expect(s.stage).toBe("briefing");
        act(s, { type: "start" });
      }
    }
    expect(s.completed).toEqual([0, 1, 2, 3, 4]);
    expect(s.xp).toBeGreaterThan(0);
  });
  it("fails on resource exhaustion without reward and supports retry", () => {
    const s = start();
    s.power = 0.001;
    step(s);
    expect(s.stage).toBe("debrief");
    expect(s.result?.success).toBe(false);
    expect(s.result?.reward).toBe(0);
    act(s, { type: "retry" });
    expect(s.stage).toBe("briefing");
    expect(s.power).toBe(100);
  });
});
describe("Save validation", () => {
  it("round trips valid save and rejects malformed input safely", () => {
    const s = start();
    expect(restore(serialize(s)).mission).toBe(0);
    expect(() => restore("{}")).toThrow();
    const d = JSON.parse(serialize(s));
    d.state.contacts[0].confidence = "bad";
    expect(() => restore(JSON.stringify(d))).toThrow();
    d.state.contacts = [];
    expect(() => restore(JSON.stringify(d))).toThrow();
  });
});
