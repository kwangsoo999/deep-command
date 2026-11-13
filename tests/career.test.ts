import { describe, it, expect } from "vitest";
import {
  act,
  createState,
  finish,
  restore,
  serialize,
  step,
  missions,
} from "../src/simulation";
import { commandRank, missionUnlocked } from "../src/career";
const ready = () => {
  const s = createState();
  s.stage = "active";
  s.mode = "running";
  s.position = { ...missions[0].target };
  s.contacts.forEach((c) => (c.confidence = 100));
  s.verified = ["INT-001", "INT-002"];
  return s;
};
describe("Career and repeatable campaign", () => {
  it("tracks rank thresholds and locks unreached operations", () => {
    expect(commandRank(0).name).toBe("Cadet");
    expect(commandRank(3600).next).toBeNull();
    expect(commandRank(3600).progress).toBe(100);
    expect(missionUnlocked([], 1)).toBe(false);
    expect(missionUnlocked([0], 1)).toBe(true);
    expect(missionUnlocked([0], 1.5)).toBe(false);
  });
  it("awards first completion once, preserves best and refuses repeat finish", () => {
    const s = ready();
    finish(s, true);
    const credits = s.credits,
      xp = s.xp;
    expect(s.career.attempts).toBe(1);
    expect(s.career.best).toHaveLength(1);
    finish(s, true);
    expect(s.career.attempts).toBe(1);
    act(s, { type: "deploy", mission: 0 });
    s.stage = "active";
    s.mode = "running";
    s.position = { ...missions[0].target };
    s.contacts.forEach((c) => (c.confidence = 100));
    s.verified = ["INT-001", "INT-002"];
    finish(s, true);
    expect(s.result?.reward).toBe(0);
    expect(s.credits).toBe(credits);
    expect(s.xp).toBe(xp);
    expect(s.career.attempts).toBe(2);
    expect(s.career.best).toHaveLength(1);
  });
  it("blocks locked deployment, prepares unlocked missions and retains research", () => {
    const s = createState();
    act(s, { type: "deploy", mission: 4 });
    expect(s.mission).toBe(0);
    s.completed = [0];
    s.career.research = ["routing"];
    s.power = 8;
    act(s, { type: "deploy", mission: 1 });
    expect(s.mission).toBe(1);
    expect(s.stage).toBe("briefing");
    expect(s.power).toBe(60);
    expect(s.career.research).toEqual(["routing"]);
  });
  it("migrates legacy saves without inventing best scores and rejects bad extension", () => {
    const data = JSON.parse(serialize(ready()));
    delete data.state.career;
    const s = restore(JSON.stringify(data));
    expect(s.career).toEqual({ attempts: 0, best: [], research: [] });
    data.state.career = { attempts: 0, best: [], research: ["bad"] };
    expect(() => restore(JSON.stringify(data))).toThrow();
  });
});
describe("Base economy and incident options", () => {
  it("research requires base/resources and cannot be bought twice", () => {
    const s = createState();
    s.research = 50;
    act(s, { type: "research", id: "analysis" });
    act(s, { type: "research", id: "analysis" });
    expect(s.research).toBe(25);
    expect(s.career.research).toEqual(["analysis"]);
    act(s, { type: "start" });
    act(s, { type: "research", id: "routing" });
    expect(s.research).toBe(25);
  });
  it("resupply clamps resource and never charges for full/active supplies", () => {
    const s = createState();
    s.power = 90;
    act(s, { type: "resupply", resource: "power" });
    expect(s.power).toBe(100);
    expect(s.credits).toBe(480);
    act(s, { type: "resupply", resource: "power" });
    expect(s.credits).toBe(480);
    act(s, { type: "start" });
    s.supplies = 10;
    act(s, { type: "resupply", resource: "supplies" });
    expect(s.supplies).toBe(10);
  });
  it("crew repair freezes paused, survives save and finishes after game ticks", () => {
    let s = ready();
    s.position = { x: 0, y: 0 };
    s.incident = {
      id: "test",
      title: "Test",
      description: "Fictional",
      cost: 10,
      damage: 2,
    };
    s.mode = "paused";
    act(s, { type: "resolve", choice: "crew" });
    const remaining = s.incident!.response!.remaining;
    step(s);
    expect(s.incident!.response!.remaining).toBe(remaining);
    s = restore(serialize(s));
    act(s, { type: "pause" });
    for (let i = 0; i < remaining; i++) step(s);
    expect(s.incident).toBeNull();
    expect(s.supplies).toBe(80);
  });
  it("supports emergency stabilization and standard recycling costs", () => {
    const s = ready();
    s.incident = { id: "a", title: "a", description: "a", cost: 10, damage: 2 };
    act(s, { type: "resolve", choice: "stabilize" });
    expect(s.power).toBe(92);
    expect(s.hull).toBe(97);
    expect(s.incident).toBeNull();
    s.career.research = ["recycling"];
    s.incident = { id: "b", title: "b", description: "b", cost: 10, damage: 2 };
    act(s, { type: "resolve" });
    expect(s.supplies).toBe(72);
  });
});

it("rejects inconsistent completion history and malformed repair jobs on import", () => {
  const duplicate = JSON.parse(serialize(createState()));
  duplicate.state.completed = [0, 0];
  expect(() => restore(JSON.stringify(duplicate))).toThrow();
  const inconsistent = JSON.parse(serialize(createState()));
  inconsistent.state.career.best = [
    { mission: 2, score: 80, grade: "A", time: 50 },
  ];
  expect(() => restore(JSON.stringify(inconsistent))).toThrow();
  const job = JSON.parse(serialize(createState()));
  job.state.incident = {
    id: "a",
    title: "a",
    description: "a",
    cost: 10,
    damage: 2,
    response: { kind: "crew", remaining: 0 },
  };
  expect(() => restore(JSON.stringify(job))).toThrow();
});
