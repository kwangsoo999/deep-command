import { describe, it, expect } from "vitest";
import * as T from "three";
import {
  createHullGeometry,
  createSailGeometry,
  createBladeGeometry,
  createControlPlane,
} from "../src/graphics/models";
import { createAssembly } from "../src/graphics/scenes";
import { createState, serialize } from "../src/simulation";
const factory = () =>
  ({
    width: 0,
    height: 0,
    getContext: () => null,
  }) as unknown as HTMLCanvasElement;
describe("Authored fictional submarine geometry", () => {
  it("produces finite vertex positions and compact lower quality variants", () => {
    for (const create of [
      createHullGeometry,
      createSailGeometry,
      createBladeGeometry,
      (high: boolean) => createControlPlane(1.75, 1.15, high),
    ]) {
      const hi = create(true),
        lo = create(false);
      expect(lo.attributes.position.count).toBeLessThan(
        hi.attributes.position.count,
      );
      for (const value of hi.attributes.position.array)
        expect(Number.isFinite(value)).toBe(true);
      hi.computeBoundingBox();
      expect(hi.boundingBox!.isEmpty()).toBe(false);
      hi.dispose();
      lo.dispose();
    }
  });
  it("keeps hull tapered and elongated along its construction axis", () => {
    const g = createHullGeometry(true);
    g.computeBoundingBox();
    const box = g.boundingBox!,
      size = box.getSize(new T.Vector3());
    expect(size.y).toBeGreaterThan(size.x * 4);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 8.5 || pos.getY(i) < -8.3)
        expect(Math.hypot(pos.getX(i), pos.getZ(i))).toBeLessThan(0.4);
    }
    g.dispose();
  });
  it("drives analog gauges from live state without changing simulation", () => {
    const a = createAssembly("deck", false, factory);
    const g = createState();
    g.power = 25;
    g.hull = 80;
    const before = serialize(g);
    a.update(g, 0);
    const gauge = a.scene.getObjectByName("status-gauge-power")!;
    const needle = gauge.getObjectByName("gauge-needle")!;
    expect(needle.rotation.z).toBeCloseTo(1.1);
    expect(serialize(g)).toBe(before);
    a.dispose();
  });
});
