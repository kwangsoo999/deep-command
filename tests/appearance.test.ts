import { describe, it, expect, vi } from "vitest";
import * as T from "three";
import {
  createSurfaceMaps,
  createReflectionMap,
  createBubbleTexture,
  addWaterLight,
} from "../src/graphics/appearance";
import { createAssembly, disposeScene } from "../src/graphics/scenes";
import { createState, serialize } from "../src/simulation";
describe("Procedural surface assets", () => {
  it("creates deterministic, color-managed maps with valid tangent normals", () => {
    const a = createSurfaceMaps(false, "steel"),
      b = createSurfaceMaps(false, "steel");
    expect(a.map.image.data).toEqual(b.map.image.data);
    expect(a.map.colorSpace).toBe(T.SRGBColorSpace);
    expect(a.normalMap.colorSpace).toBe(T.NoColorSpace);
    const data = a.normalMap.image.data!;
    for (let i = 0; i < data.length; i += 4) {
      const len = Math.hypot(
        (data[i] / 255) * 2 - 1,
        (data[i + 1] / 255) * 2 - 1,
        (data[i + 2] / 255) * 2 - 1,
      );
      expect(len).toBeCloseTo(1, 1);
    }
    Object.values(a).forEach((t) => t.dispose());
    Object.values(b).forEach((t) => t.dispose());
  });
  it("uses smaller maps for low quality and differentiates hull from metal", () => {
    const hi = createSurfaceMaps(true, "steel"),
      lo = createSurfaceMaps(false, "acoustic");
    expect(lo.map.image.width).toBeLessThan(hi.map.image.width);
    expect(lo.roughnessMap.image.data![1]).toBeGreaterThan(
      hi.roughnessMap.image.data![1],
    );
    Object.values(hi).forEach((t) => t.dispose());
    Object.values(lo).forEach((t) => t.dispose());
    const env = createReflectionMap(false);
    expect(env.image.width).toBe(env.image.height * 2);
    expect(env.mapping).toBe(T.EquirectangularReflectionMapping);
    env.dispose();
  });
  it("has transparent bubble edges and injects water light using the standard shader anchors", () => {
    const bubble = createBubbleTexture();
    expect(bubble.image.data![3]).toBe(0);
    expect(bubble.image.data![(16 * 32 + 16) * 4 + 3]).toBeGreaterThan(150);
    bubble.dispose();
    const material = new T.MeshStandardMaterial(),
      clock = { value: 3 };
    addWaterLight(material, clock);
    const shader = {
      uniforms: {},
      vertexShader: T.ShaderLib.standard.vertexShader,
      fragmentShader: T.ShaderLib.standard.fragmentShader,
    };
    material.onBeforeCompile(shader as any, {} as T.WebGLRenderer);
    expect(shader.vertexShader).toContain("vWaterWorld=(modelMatrix");
    expect(shader.fragmentShader).toContain("float waterPattern");
    expect((shader.uniforms as any).uWaterTime).toBe(clock);
    material.dispose();
  });
});
describe("Underwater dressing lifecycle", () => {
  it("adds terrain/instanced rocks, responds to navigation without changing gameplay and disposes reflection map", () => {
    const a = createAssembly("ocean", false);
    const g = createState(),
      before = serialize(g);
    expect(a.scene.getObjectByName("seabed")).toBeTruthy();
    const rocks = a.scene.getObjectByName("seabed-rocks") as T.InstancedMesh;
    expect(rocks.count).toBe(16);
    const wake = a.scene.getObjectByName("propeller-wake")!;
    a.update(g, 10);
    expect(wake.visible).toBe(false);
    expect(serialize(g)).toBe(before);
    g.waypoint = { x: 50, y: 60 };
    a.update(g, 11);
    expect(wake.visible).toBe(true);
    const env = a.scene.environment as T.Texture,
      dispose = vi.spyOn(env, "dispose"),
      instances = vi.spyOn(rocks, "dispose");
    a.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(instances).toHaveBeenCalledTimes(1);
  });
});
