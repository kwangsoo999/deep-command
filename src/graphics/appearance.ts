import * as T from "three";
// Original deterministic procedural textures; no downloads or external assets.
export function createSurfaceMaps(high: boolean, kind: "steel" | "acoustic") {
  const size = high ? 256 : 128,
    albedo = new Uint8Array(size * size * 4),
    normal = new Uint8Array(size * size * 4),
    roughness = new Uint8Array(size * size * 4);
  const height = (x: number, y: number) => {
    if (kind === "acoustic") {
      const u = (x / size) * 12,
        v = (y / size) * 28;
      const row = Math.floor(v);
      const px = (((u + (row % 2) * 0.5) % 1) + 1) % 1;
      const py = ((v % 1) + 1) % 1;
      return px < 0.07 || py < 0.07 ? -0.035 : 0;
    }
    const px = ((x % 32) + 32) % 32,
      py = ((y % 16) + 16) % 16;
    return px < 1 || py < 1 ? -0.4 : 0.02 * Math.sin(x * 3.1 + y * 7.7);
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4,
        h = height(x, y),
        noise = Math.sin(x * 127.1 + y * 311.7) * 0.5 + 0.5,
        seam = h < 0;
      const value =
        kind === "steel"
          ? seam
            ? 80
            : 178 + noise * 18
          : seam
            ? 136
            : 150 + noise * 5;
      albedo.set([value, value, value, 255], i);
      const n = new T.Vector3(
        (height(x - 1, y) - height(x + 1, y)) * 0.8,
        (height(x, y - 1) - height(x, y + 1)) * 0.8,
        1,
      ).normalize();
      normal.set(
        [
          (n.x * 0.5 + 0.5) * 255,
          (n.y * 0.5 + 0.5) * 255,
          (n.z * 0.5 + 0.5) * 255,
          255,
        ],
        i,
      );
      const r = kind === "steel" ? 130 + noise * 45 : 195 + noise * 25;
      roughness.set([r, r, r, 255], i);
    }
  const texture = (data: Uint8Array, color = false) => {
    const t = new T.DataTexture(data, size, size, T.RGBAFormat);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(kind === "acoustic" ? 1 : 2, kind === "acoustic" ? 1 : 2);
    t.magFilter = T.LinearFilter;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    if (color) t.colorSpace = T.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return {
    map: texture(albedo, true),
    normalMap: texture(normal),
    roughnessMap: texture(roughness),
  };
}
export function createReflectionMap(
  high: boolean,
  mode: "deck" | "ocean" = "deck",
) {
  const width = high ? 256 : 128,
    height = width / 2,
    data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = x / width,
        v = y / height,
        strip =
          Math.exp(-(((v - 0.35) * 18) ** 2)) *
          Math.pow(Math.max(0, Math.cos(u * Math.PI * 8)), 20) *
          (mode === "ocean" ? 0.12 : 1),
        sky = Math.max(0, 1 - v),
        i = (y * width + x) * 4;
      data.set(
        [
          18 + sky * 45 + strip * 165,
          29 + sky * 62 + strip * 160,
          37 + sky * 75 + strip * 145,
          255,
        ],
        i,
      );
    }
  const texture = new T.DataTexture(data, width, height, T.RGBAFormat);
  texture.colorSpace = T.SRGBColorSpace;
  texture.mapping = T.EquirectangularReflectionMapping;
  texture.magFilter = texture.minFilter = T.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
export function addWaterLight(
  material: T.MeshStandardMaterial,
  clock: { value: number },
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = clock;
    shader.vertexShader =
      "varying vec3 vWaterWorld;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWaterWorld=(modelMatrix*vec4(transformed,1.0)).xyz;",
      );
    shader.fragmentShader =
      "uniform float uWaterTime; varying vec3 vWaterWorld;\n" +
      shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
 float waterPattern=sin(vWaterWorld.x*.8+sin(vWaterWorld.z*.6+uWaterTime*.25))*sin(vWaterWorld.z*1.1-uWaterTime*.3);
 float waterLight=pow(abs(waterPattern),8.0)*.065;
 totalEmissiveRadiance+=vec3(.08,.5,.55)*waterLight;`,
      );
  };
  material.customProgramCacheKey = () => "aurora-water-light-v1";
}
export function createBubbleTexture() {
  const size = 32,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5) / 15.5,
        i = (y * size + x) * 4;
      const alpha = Math.max(0, 1 - d * d);
      data.set([185, 225, 235, Math.round(alpha * alpha * 180)], i);
    }
  const t = new T.DataTexture(data, size, size, T.RGBAFormat);
  t.magFilter = t.minFilter = T.LinearFilter;
  t.needsUpdate = true;
  return t;
}
