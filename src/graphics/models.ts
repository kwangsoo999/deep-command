import * as T from "three";
// Authored fictional silhouettes in arbitrary game units, not engineering plans.
export function createHullGeometry(high: boolean) {
  const curve = new T.SplineCurve(
    [
      [0, -8.5],
      [0.5, -8.15],
      [1.1, -7.2],
      [1.34, -4.5],
      [1.34, 3.5],
      [1.08, 6.2],
      [0.5, 8],
      [0.12, 8.8],
      [0, 8.9],
    ].map(([x, y]) => new T.Vector2(x, y)),
  );
  const points = curve
    .getPoints(high ? 80 : 32)
    .map((p) => new T.Vector2(Math.max(0, p.x), p.y));
  return new T.LatheGeometry(points, high ? 64 : 24);
}
export function createSailGeometry(high: boolean) {
  const s = new T.Shape();
  s.moveTo(-1.5, 0);
  s.lineTo(-1.35, 1.2);
  s.quadraticCurveTo(-1.2, 1.6, -0.7, 1.6);
  s.lineTo(0.6, 1.6);
  s.quadraticCurveTo(1.1, 1.5, 1.4, 0.2);
  s.lineTo(1.5, 0);
  s.closePath();
  const geometry = new T.ExtrudeGeometry(s, {
    depth: 0.6,
    bevelEnabled: true,
    bevelSegments: high ? 3 : 1,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.07,
    curveSegments: high ? 10 : 4,
  });
  geometry.center();
  geometry.rotateY(Math.PI / 2);
  return geometry;
}
export function createBladeGeometry(high: boolean) {
  const s = new T.Shape();
  s.moveTo(-0.12, 0.1);
  s.quadraticCurveTo(-0.12, 0.7, -0.52, 1.25);
  s.quadraticCurveTo(-0.15, 1.7, 0.25, 1.35);
  s.quadraticCurveTo(0.4, 0.7, 0.12, 0.1);
  s.closePath();
  const g = new T.ExtrudeGeometry(s, {
    depth: 0.07,
    bevelEnabled: high,
    bevelSegments: 2,
    bevelSize: 0.02,
    bevelThickness: 0.02,
    curveSegments: high ? 12 : 5,
  });
  g.translate(0, 0, -0.035);
  return g;
}
export function createGauge(material: T.Material) {
  const group = new T.Group();
  const ring = new T.Mesh(new T.TorusGeometry(0.45, 0.055, 8, 32), material);
  group.add(ring);
  const face = new T.Mesh(
    new T.CircleGeometry(0.43, 32),
    new T.MeshStandardMaterial({ color: 0xb1c4bb, roughness: 0.8 }),
  );
  face.position.z = -0.01;
  group.add(face);
  const positions: number[] = [];
  for (let i = 0; i <= 12; i++) {
    const a = -2.2 + (i * 4.4) / 12;
    positions.push(
      Math.sin(a) * 0.34,
      Math.cos(a) * 0.34,
      0.01,
      Math.sin(a) * 0.4,
      Math.cos(a) * 0.4,
      0.01,
    );
  }
  const ticks = new T.BufferGeometry();
  ticks.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  group.add(
    new T.LineSegments(ticks, new T.LineBasicMaterial({ color: 0x172a32 })),
  );
  const needle = new T.Mesh(
    new T.BoxGeometry(0.025, 0.3, 0.015),
    new T.MeshStandardMaterial({ color: 0xb44f36, roughness: 0.65 }),
  );
  needle.geometry.translate(0, 0.13, 0.025);
  needle.name = "gauge-needle";
  group.add(needle);
  return { group, needle };
}
