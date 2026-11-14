import * as T from "three";

// Fictional relief in scene units; shared by the ground and rock placement.
export function seabedHeight(x: number, z: number) {
  return (
    -13 +
    Math.sin(x * 0.085) * 1.4 +
    Math.cos(z * 0.11) * 0.9 +
    Math.sin(x * 0.17 + z * 0.13) * 0.35
  );
}

export function createSeabed(high: boolean) {
  const geometry = new T.PlaneGeometry(
    320,
    320,
    high ? 100 : 40,
    high ? 100 : 40,
  );
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const sand = new T.Color(0x536766),
    ridge = new T.Color(0x293f46);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i);
    const y = seabedHeight(x, z);
    positions.setY(i, y);
    const color = sand
      .clone()
      .lerp(ridge, T.MathUtils.clamp((y + 15) / 4.5, 0, 1));
    color.toArray(colors, i * 3);
  }
  geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });
  // Fine ripples are evaluated in world space, so distant sand does not tile into stripes.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader =
      "varying vec3 vSand;\n" +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSand=(modelMatrix*vec4(transformed,1.)).xyz;",
      );
    shader.fragmentShader =
      "varying vec3 vSand;\n" +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
      float ripple=sin(vSand.x*2.6+sin(vSand.z*.7)*1.4);
      float detailFade=1.-smoothstep(18.,65.,length(vViewPosition));
      diffuseColor.rgb*=1.+ripple*.055*detailFade;`,
      );
  };
  material.customProgramCacheKey = () => "aurora-sand-v1";
  const mesh = new T.Mesh(geometry, material);
  mesh.name = "seabed";
  mesh.receiveShadow = high;
  return mesh;
}
