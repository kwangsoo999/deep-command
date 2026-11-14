import { describe, it, expect, vi } from "vitest";
import * as T from "three";
import {
  cameraViews,
  frameScale,
  advanceVisualTime,
  createAssembly,
  disposeScene,
  stationNames,
} from "../src/graphics/scenes";
import { createState, serialize } from "../src/simulation";
const context = () => ({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  arc: vi.fn(),
});
const canvasFactory = () => {
  const ctx = context();
  return {
    width: 0,
    height: 0,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
};
describe("3D assemblies without a WebGL renderer", () => {
  it("creates four individually raycastable deck consoles and a detailed hull", () => {
    const a = createAssembly("deck", true, canvasFactory);
    expect(a.targets.map((m) => m.userData.station)).toEqual([...stationNames]);
    expect(a.scene.getObjectByName("bulkhead-wheel")).toBeTruthy();
    for (const name of stationNames) {
      const preset = cameraViews[name];
      const origin = new T.Vector3().fromArray(preset.position),
        target = new T.Vector3().fromArray(preset.target);
      a.scene.updateMatrixWorld(true);
      const ray = new T.Raycaster(origin, target.sub(origin).normalize());
      const hit = ray.intersectObjects(a.targets)[0];
      expect(hit?.object.userData.station).toBe(name);
    }
    a.dispose();
    expect(a.scene.children).toHaveLength(0);
  });
  it("refreshes console textures for immediate actions as well as clock ticks", () => {
    const contexts: ReturnType<typeof context>[] = [];
    const factory = () => {
      const ctx = context();
      contexts.push(ctx);
      return {
        width: 0,
        height: 0,
        getContext: () => ctx,
      } as unknown as HTMLCanvasElement;
    };
    const a = createAssembly("deck", false, factory);
    const g = createState();
    a.update(g, 0);
    const first = contexts[0].fillRect.mock.calls.length;
    a.update(g, 0);
    expect(contexts[0].fillRect.mock.calls.length).toBe(first);
    const next = structuredClone(g);
    next.scanCount++;
    a.update(next, 0);
    expect(contexts[0].fillRect.mock.calls.length).toBeGreaterThan(first);
    a.dispose();
  });
  it("updates ocean effects from presentation time without mutating gameplay", () => {
    const a = createAssembly("ocean", true, canvasFactory),
      g = createState(),
      before = serialize(g);
    a.update(g, 12);
    const surface = a.scene.getObjectByName("ocean-surface") as T.Mesh<
      T.PlaneGeometry,
      T.ShaderMaterial
    >;
    expect(surface.material.uniforms.uTime.value).toBe(12);
    a.update(g, 12);
    expect(surface.material.uniforms.uTime.value).toBe(12);
    expect(serialize(g)).toBe(before);
    expect(a.scene.getObjectByName("aurora-hull")).toBeTruthy();
    a.dispose();
  });
  it("reduces ocean particles in low quality and releases shared resources once", () => {
    const hi = createAssembly("ocean", true, canvasFactory),
      lo = createAssembly("ocean", false, canvasFactory);
    const count = (s: T.Scene) =>
      (s.children.find((o) => o instanceof T.Points) as T.Points).geometry
        .attributes.position.count;
    expect(count(lo.scene)).toBeLessThan(count(hi.scene));
    hi.dispose();
    lo.dispose();
    const scene = new T.Scene(),
      geo = new T.BoxGeometry(),
      mat = new T.MeshStandardMaterial();
    scene.add(new T.Mesh(geo, mat), new T.Mesh(geo, mat));
    const dg = vi.spyOn(geo, "dispose"),
      dm = vi.spyOn(mat, "dispose");
    disposeScene(scene);
    expect(dg).toHaveBeenCalledTimes(1);
    expect(dm).toHaveBeenCalledTimes(1);
  });
});

it("freezes visual time in pause/planning and resets after loading an older save", () => {
  const g = createState();
  g.stage = "active";
  g.mode = "running";
  g.time = 10;
  expect(advanceVisualTime(10.2, 10, g, 0.1)).toBeCloseTo(10.3);
  g.mode = "paused";
  expect(advanceVisualTime(10.2, 10, g, 0.1)).toBe(10.2);
  g.mode = "planning";
  expect(advanceVisualTime(10.2, 10, g, 0.1)).toBe(10.2);
  g.time = 2;
  expect(advanceVisualTime(10.2, 10, g, 0.1)).toBe(2);
});

it("fits the whole exterior hull into portrait framing rather than cropping its ends", () => {
  const aspect = 390 / 525;
  const preset = cameraViews.ocean;
  const target = new T.Vector3().fromArray(preset.target),
    position = new T.Vector3()
      .fromArray(preset.position)
      .sub(target)
      .multiplyScalar(frameScale(aspect, "ocean"))
      .add(target);
  position.y = Math.min(9.5, position.y);
  const camera = new T.PerspectiveCamera(50, aspect, 0.1, 220);
  camera.position.copy(position);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  for (const z of [-8.5, 9.0])
    for (const x of [-1.5, 1.5]) {
      const p = new T.Vector3(x, 0, z).project(camera);
      expect(Math.abs(p.x)).toBeLessThan(1);
    }
  expect(frameScale(2.5, "ocean")).toBe(1);
  expect(frameScale(aspect, "deck")).toBe(1);
});
