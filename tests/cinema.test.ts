import { afterEach, describe, it, expect, vi } from "vitest";
import * as T from "three";
const mock = vi.hoisted(() => ({
  passes: [] as any[],
  render: vi.fn(),
  resize: vi.fn(),
  dispose: vi.fn(),
}));
vi.mock("three/examples/jsm/postprocessing/EffectComposer.js", () => ({
  EffectComposer: class {
    addPass(p: unknown) {
      mock.passes.push(p);
    }
    render = mock.render;
    setSize = mock.resize;
    dispose = mock.dispose;
  },
}));
import { createCinema, looks } from "../src/graphics/cinema";
afterEach(() => {
  mock.passes.length = 0;
  vi.clearAllMocks();
});
describe("Presentation pipeline ownership", () => {
  it("renders low quality directly without creating postprocessing passes", () => {
    const renderer = {
      render: vi.fn(),
      toneMappingExposure: 1,
    } as unknown as T.WebGLRenderer;
    const scene = new T.Scene();
    scene.fog = new T.FogExp2(0x123456);
    const backdrop = new T.Mesh(
      new T.SphereGeometry(1),
      new T.MeshBasicMaterial(),
    );
    backdrop.name = "ocean-backdrop";
    scene.add(backdrop);
    const camera = new T.PerspectiveCamera(),
      cinema = createCinema(renderer, scene, camera, false);
    cinema.render("abyss", 1.5);
    expect(renderer.render).toHaveBeenCalledWith(scene, camera);
    expect(renderer.toneMappingExposure).toBeCloseTo(
      1.5 * looks.abyss.exposure,
    );
    expect(mock.passes).toHaveLength(0);
    for (const look of ["cinema", "natural", "abyss"] as const) {
      cinema.render(look, 1.25);
      expect(backdrop.material.color.equals(scene.fog.color)).toBe(true);
    }
    backdrop.geometry.dispose();
    backdrop.material.dispose();
    cinema.dispose();
  });
  it("orders render/bloom/grade/output, disables natural bloom and releases each pass", () => {
    const renderer = {
      getPixelRatio: () => 1,
      toneMappingExposure: 1,
    } as unknown as T.WebGLRenderer;
    const cinema = createCinema(
      renderer,
      new T.Scene(),
      new T.PerspectiveCamera(),
      true,
    );
    expect(mock.passes.map((p) => p.constructor.name)).toEqual([
      "RenderPass",
      "UnrealBloomPass",
      "ShaderPass",
      "OutputPass",
    ]);
    const disposals = mock.passes.map((p) => vi.spyOn(p, "dispose"));
    cinema.setSize(800, 500);
    expect(mock.resize).toHaveBeenCalledWith(800, 500);
    cinema.render("natural", 1.25);
    expect(mock.passes[1].enabled).toBe(false);
    expect(mock.passes[2].uniforms.uGrade.value).toBe(0);
    cinema.render("cinema", 1.25);
    expect(mock.passes[1].enabled).toBe(true);
    expect(mock.render).toHaveBeenCalledTimes(2);
    cinema.dispose();
    disposals.forEach((d) => expect(d).toHaveBeenCalledTimes(1));
    expect(mock.dispose).toHaveBeenCalledTimes(1);
  });
});
