import * as T from "three";
import {
  createSurfaceMaps,
  createReflectionMap,
  addWaterLight,
  createBubbleTexture,
} from "./appearance";
import {
  createHullGeometry,
  createSailGeometry,
  createBladeGeometry,
  createGauge,
} from "./models";
import type { State } from "../simulation";
export const stationNames = [
  "Sonar",
  "Navigation",
  "Engineering",
  "Intelligence",
] as const;
export type SceneMode = "deck" | "ocean";
export const cameraViews = {
  bridge: { position: [0, 2.3, 6.4], target: [0, 1.9, -4] },
  Sonar: { position: [-3.6, 2.15, -1.7], target: [-3.6, 1.9, -5.4] },
  Navigation: { position: [-1.2, 2.15, -1.7], target: [-1.2, 1.9, -5.4] },
  Engineering: { position: [1.2, 2.15, -1.7], target: [1.2, 1.9, -5.4] },
  Intelligence: { position: [3.6, 2.15, -1.7], target: [3.6, 1.9, -5.4] },
  ocean: { position: [17, 9, 21], target: [0, 0, 0] },
  bow: { position: [9, 3, -13], target: [0, 0, -3] },
  sail: { position: [6, 4, 2], target: [0, 1.6, -1] },
  stern: { position: [7, 2, 16], target: [0, 0, 6] },
} as const;
export type CameraView = keyof typeof cameraViews;
export interface Assembly {
  scene: T.Scene;
  targets: T.Mesh[];
  update: (g: State, time: number) => void;
  dispose: () => void;
}
// Presentation time never advances gameplay and freezes under Pause & Plan.
export function advanceVisualTime(
  current: number,
  anchor: number,
  g: State,
  dt: number,
) {
  if (g.time !== anchor) return g.time;
  if (g.mode !== "running" || g.stage !== "active") return current;
  return Math.min(
    g.time + 0.99,
    current + Math.max(0, Math.min(dt, 0.1)) * g.speed,
  );
}
export function disposeScene(scene: T.Scene) {
  const geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Set<T.Texture>();
  scene.traverse((o) => {
    if (
      o instanceof T.Mesh ||
      o instanceof T.Points ||
      o instanceof T.LineSegments
    ) {
      if (o instanceof T.InstancedMesh) o.dispose();
      geometries.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        materials.add(m);
        for (const value of Object.values(m))
          if (value instanceof T.Texture) textures.add(value);
      }
    }
  });
  if (scene.environment instanceof T.Texture) textures.add(scene.environment);
  if (scene.background instanceof T.Texture) textures.add(scene.background);
  textures.forEach((t) => t.dispose());
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  scene.traverse((o) => {
    if (
      o instanceof T.SpotLight ||
      o instanceof T.DirectionalLight ||
      o instanceof T.PointLight
    )
      o.shadow.dispose();
  });
  scene.clear();
}
export function createAssembly(
  mode: SceneMode,
  high: boolean,
  makeCanvas: () => HTMLCanvasElement = () => document.createElement("canvas"),
): Assembly {
  const scene = new T.Scene(),
    targets: T.Mesh[] = [];
  scene.environment = createReflectionMap(high);
  scene.environmentIntensity = mode === "deck" ? 0.55 : 0.8;
  const steel = new T.MeshStandardMaterial({
    ...createSurfaceMaps(high, "steel"),
    color: 0x34454b,
    metalness: 0.65,
    roughness: 0.56,
  });
  const dark = new T.MeshStandardMaterial({
    color: 0x101b22,
    metalness: 0.45,
    roughness: 0.7,
  });
  const rubber = new T.MeshStandardMaterial({
    color: 0x071118,
    roughness: 0.95,
  });
  const brass = new T.MeshStandardMaterial({
    color: 0x9d8661,
    metalness: 0.7,
    roughness: 0.4,
  });
  const cyan = new T.MeshStandardMaterial({
    color: 0x59bac7,
    emissive: 0x3597ad,
    emissiveIntensity: 1.2,
  });
  const warm = new T.MeshStandardMaterial({
    color: 0xe6d8a6,
    emissive: 0xe8c783,
    emissiveIntensity: 1.5,
  });
  const mesh = (
    geometry: T.BufferGeometry,
    material: T.Material,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = high;
    m.receiveShadow = high;
    scene.add(m);
    return m;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = steel,
  ) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z);
  const tube = (
    r: number,
    length: number,
    x: number,
    y: number,
    z: number,
    mat: T.Material = steel,
  ) => {
    const m = mesh(new T.CylinderGeometry(r, r, length, 12), mat, x, y, z);
    m.rotation.x = Math.PI / 2;
    return m;
  };
  const screens: {
    texture: T.CanvasTexture;
    canvas: HTMLCanvasElement;
    station: string;
  }[] = [];
  let ocean: T.ShaderMaterial | undefined,
    particles: T.Points | undefined,
    propeller: T.Group | undefined,
    wake: T.Points | undefined;
  const waterClock = { value: 0 };
  const alertLights: T.PointLight[] = [];
  const gauges: { needle: T.Mesh; stat: "power" | "hull" }[] = [];
  if (mode === "deck") {
    scene.background = new T.Color("#060e14");
    scene.fog = new T.FogExp2("#0a1922", 0.027);
    const shell = mesh(
      new T.CylinderGeometry(3.3, 3.3, 18, 48, 1, true),
      new T.MeshStandardMaterial({
        color: 0x26343c,
        metalness: 0.45,
        roughness: 0.8,
        side: T.BackSide,
      }),
      0,
      2.7,
      -0.8,
    );
    shell.rotation.x = Math.PI / 2;
    shell.scale.x = 1.48;
    box(8.4, 0.16, 17, 0, -0.13, -0.6, dark);
    for (let x = -4; x <= 4; x += 0.4)
      box(0.025, 0.015, 16, x, -0.035, -0.5, steel);
    for (let z = -8; z <= 7; z += 1.8) {
      const rib = mesh(
        new T.TorusGeometry(3.2, 0.085, 6, 48),
        steel,
        0,
        2.7,
        z,
      );
      rib.scale.x = 1.48;
      box(7.8, 0.07, 0.08, 0, 0.012, z, brass);
    }
    const bulkhead = mesh(new T.CircleGeometry(3.22, 48), steel, 0, 2.7, -8.4);
    bulkhead.scale.x = 1.48;
    box(1.7, 3.4, 0.15, 0, 1.7, -8.25, dark);
    box(1.4, 2.9, 0.1, 0, 1.7, -8.12, steel);
    for (const [x, stat] of [
      [-2.7, "power"],
      [2.7, "hull"],
    ] as const) {
      const gauge = createGauge(brass);
      gauge.group.position.set(x, 2.8, -8.1);
      gauge.group.name = "status-gauge-" + stat;
      scene.add(gauge.group);
      gauges.push({ needle: gauge.needle, stat });
    }
    const wheel = mesh(
      new T.TorusGeometry(0.33, 0.035, 8, 24),
      brass,
      0,
      1.7,
      -8.02,
    );
    for (let i = 0; i < 4; i++) {
      const spoke = box(0.65, 0.04, 0.04, 0, 1.7, -8.01, brass);
      spoke.rotation.z = (i * Math.PI) / 4;
    }
    wheel.name = "bulkhead-wheel";
    for (const side of [-1, 1]) {
      tube(0.08, 16, side * 3.7, 4.9, -0.4);
      tube(0.045, 16, side * 3.5, 5.05, -0.4, brass);
      for (let z = -7; z < 7; z += 3) {
        box(0.12, 0.12, 0.8, side * 3.7, 4.9, z, dark);
        box(0.8, 1.25, 0.25, side * 4.35, 2, z);
        for (let j = 0; j < 8; j++)
          box(0.6, 0.025, 0.05, side * 4.35, 1.5 + j * 0.12, z + 0.15, dark);
      }
    }
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 2.4,
        station = stationNames[i];
      box(2.2, 1.05, 1.5, x, 0.53, -5.5);
      const lip = box(2.24, 0.17, 1.6, x, 1.14, -5.37, dark);
      lip.rotation.x = 0.05;
      box(2.2, 1.55, 0.2, x, 2, -5.96, rubber);
      const canvas = makeCanvas();
      canvas.width = 512;
      canvas.height = 320;
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      texture.minFilter = T.LinearFilter;
      const screen = mesh(
        new T.PlaneGeometry(1.98, 1.25),
        new T.MeshBasicMaterial({ map: texture, toneMapped: false }),
        x,
        2.02,
        -5.84,
      );
      screen.userData.station = station;
      screen.name = "station-" + station;
      targets.push(screen);
      screens.push({ canvas, texture, station });
      for (let j = 0; j < 6; j++) {
        box(
          0.17,
          0.035,
          0.12,
          x - 0.8 + j * 0.32,
          1.25,
          -5.12,
          j === 5 ? warm : cyan,
        );
        box(0.15, 0.045, 0.12, x - 0.8 + j * 0.32, 1.25, -4.86, rubber);
      }
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 10; k++)
          box(
            0.07,
            0.018,
            0.045,
            x - 0.38 + k * 0.08,
            1.25,
            -5.28 + row * 0.065,
            steel,
          );
      tube(0.1, 0.28, x + 0.8, 1.34, -5.2, brass);
      box(0.7, 0.16, 0.7, x, 0.8, -3.7, rubber);
      box(0.72, 0.8, 0.16, x, 1.22, -3.35, rubber);
      tube(0.065, 0.6, x, 0.35, -3.7);
      box(0.75, 0.05, 0.75, x, 0.12, -3.7, steel);
    }
    // Central plotting table, periscope mast, cable trays and labeled fixtures.
    box(2.7, 0.8, 2, 0, 0.4, 0.4);
    box(2.95, 0.14, 2.2, 0, 0.9, 0.4, rubber);
    const tableCanvas = makeCanvas();
    tableCanvas.width = 512;
    tableCanvas.height = 320;
    const tableTexture = new T.CanvasTexture(tableCanvas);
    tableTexture.colorSpace = T.SRGBColorSpace;
    const table = mesh(
      new T.PlaneGeometry(2.65, 1.9),
      new T.MeshBasicMaterial({ map: tableTexture, toneMapped: false }),
      0,
      0.98,
      0.4,
    );
    table.rotation.x = -Math.PI / 2;
    screens.push({
      canvas: tableCanvas,
      texture: tableTexture,
      station: "Navigation",
    });
    const mast = mesh(
      new T.CylinderGeometry(0.09, 0.12, 3.8, 16),
      steel,
      2.6,
      3.5,
      2.5,
    );
    mast.name = "observation-mast";
    box(0.5, 0.25, 0.25, 2.4, 1.8, 2.5, rubber);
    scene.add(new T.HemisphereLight(0x9bb6c1, 0x18232d, 1.35));
    for (const z of [-5, 0, 5]) {
      box(1.6, 0.05, 0.22, 0, 5.68, z, warm);
      const light = new T.PointLight(0xffdcac, 24, 10, 2);
      light.position.set(0, 4.8, z);
      scene.add(light);
    }
    for (const side of [-1, 1]) {
      box(0.05, 0.06, 14, side * 3.9, 0.16, -0.5, cyan);
      const light = new T.PointLight(0x2ca9c5, 18, 10, 2);
      light.position.set(side * 3.7, 2.7, -3);
      scene.add(light);
      const red = new T.PointLight(0xff593b, 0, 9, 2);
      red.position.set(side * 3.7, 3.5, 2);
      scene.add(red);
      alertLights.push(red);
    }
    if (high) {
      const key = new T.SpotLight(0xbfe8ed, 70, 14, 0.8, 0.5, 1.5);
      key.position.set(0, 5, 2);
      key.target.position.set(0, 0, -4);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.bias = -0.001;
      scene.add(key, key.target);
    }
  } else {
    scene.background = new T.Color("#042335");
    scene.fog = new T.FogExp2("#042335", 0.023);
    scene.add(new T.HemisphereLight(0x71bed0, 0x061321, 2));
    const sun = new T.DirectionalLight(0xa5e7ef, 3);
    sun.position.set(-12, 18, 5);
    scene.add(sun);
    const hull = new T.MeshStandardMaterial({
      ...createSurfaceMaps(high, "acoustic"),
      color: 0x607c86,
      metalness: 0.18,
      roughness: 0.88,
    });
    addWaterLight(hull, waterClock);
    const main = mesh(createHullGeometry(high), hull, 0, 0, 0);
    main.rotation.x = Math.PI / 2;
    main.scale.x = 1.13;
    main.name = "aurora-hull";
    for (let z = -6; z <= 6; z += 1.2) {
      const seam = mesh(
        new T.TorusGeometry(1.305, 0.014, 4, 32),
        dark,
        0,
        0,
        z,
      );
      seam.scale.x = 1.13;
    }
    mesh(createSailGeometry(high), hull, 0, 1.85, -1);
    box(0.7, 0.12, 3, 0, 2.7, -1, dark);
    for (const x of [-0.24, 0.2]) {
      const mast = mesh(
        new T.CylinderGeometry(0.035, 0.05, 1.5, 8),
        steel,
        x,
        3.35,
        -1,
      );
      mast.name = "mast";
    }
    for (const side of [-1, 1]) {
      const fin = box(1.7, 0.09, 0.85, side * 1.9, 0.1, -4, hull);
      fin.rotation.y = side * 0.18;
      box(1.5, 0.1, 0.9, side * 1.4, 0, 7.2, hull);
      for (let i = 0; i < 5; i++)
        box(0.04, 0.13, 0.36, side * 1.42, 0.4, -2 + i * 0.55, rubber);
    }
    box(0.13, 2.1, 1.1, 0, 0.4, 7.3, hull);
    propeller = new T.Group();
    propeller.position.set(0, 0, 8.7);
    scene.add(propeller);
    const hub = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.65, 16), brass);
    hub.rotation.x = Math.PI / 2;
    propeller.add(hub);
    const bladeGeometry = createBladeGeometry(high);
    for (let i = 0; i < 7; i++) {
      const blade = new T.Mesh(bladeGeometry, brass);
      blade.rotation.z = (i * Math.PI * 2) / 7;
      propeller.add(blade);
    }
    // Stylized terrain establishes distance without using real geography.
    const terrainGeometry = new T.PlaneGeometry(
      160,
      160,
      high ? 64 : 24,
      high ? 64 : 24,
    );
    const terrainPositions = terrainGeometry.attributes.position;
    for (let i = 0; i < terrainPositions.count; i++)
      terrainPositions.setZ(
        i,
        Math.sin(terrainPositions.getX(i) * 0.12) * 1.2 +
          Math.cos(terrainPositions.getY(i) * 0.17) * 0.8,
      );
    terrainGeometry.computeVertexNormals();
    const seabed = mesh(
      terrainGeometry,
      new T.MeshStandardMaterial({ color: 0x36494b, roughness: 1 }),
      0,
      -13,
      0,
    );
    seabed.rotation.x = -Math.PI / 2;
    seabed.name = "seabed";
    const rocks = new T.InstancedMesh(
      new T.IcosahedronGeometry(1, 0),
      new T.MeshStandardMaterial({ color: 0x263b40, roughness: 0.95 }),
      high ? 48 : 16,
    );
    const dummy = new T.Object3D();
    for (let i = 0; i < rocks.count; i++) {
      const x = Math.sin(i * 23.7) * 45,
        z = Math.cos(i * 17.9) * 45;
      dummy.position.set(x, -12.5, z);
      dummy.scale.set(
        1 + Math.abs(Math.sin(i)) * 2,
        0.4 + Math.abs(Math.cos(i)),
        1 + Math.abs(Math.sin(i * 2)),
      );
      dummy.rotation.set(i * 0.3, i, 0);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.name = "seabed-rocks";
    scene.add(rocks);
    const bubbles = createBubbleTexture();
    const wakeGeometry = new T.BufferGeometry();
    const wakePositions = new Float32Array((high ? 120 : 40) * 3);
    for (let i = 0; i < wakePositions.length / 3; i++) {
      const t = i / (wakePositions.length / 3);
      wakePositions[i * 3] = Math.sin(i * 2.4) * t * 1.5;
      wakePositions[i * 3 + 1] = Math.cos(i * 3.7) * t * 0.6;
      wakePositions[i * 3 + 2] = t * 12;
    }
    wakeGeometry.setAttribute(
      "position",
      new T.BufferAttribute(wakePositions, 3),
    );
    wake = new T.Points(
      wakeGeometry,
      new T.PointsMaterial({
        map: bubbles,
        size: 0.3,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    wake.position.z = 9;
    wake.name = "propeller-wake";
    scene.add(wake);
    ocean = new T.ShaderMaterial({
      side: T.DoubleSide,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `uniform float uTime; varying vec3 vP; void main(){vec3 p=position; p.z+=sin(p.x*.16+uTime*.35)*.5+cos(p.y*.2+uTime*.2)*.35;vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `uniform float uTime; varying vec3 vP; void main(){float c=sin(vP.x*.5+sin(vP.y*.3+uTime*.15))*cos(vP.y*.6+uTime*.2);gl_FragColor=vec4(vec3(.06,.26,.34)+c*.055,.34);}`,
    });
    const surface = mesh(
      new T.PlaneGeometry(150, 150, high ? 64 : 24, high ? 64 : 24),
      ocean,
      0,
      11,
      0,
    );
    surface.rotation.x = -Math.PI / 2;
    surface.name = "ocean-surface";
    const positions = new Float32Array((high ? 650 : 180) * 3);
    for (let i = 0; i < positions.length; i++)
      positions[i] = ((Math.sin(i * 127.1 + 31.7) * 43758.5453) % 1) * 40;
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(positions, 3));
    particles = new T.Points(
      geo,
      new T.PointsMaterial({
        map: bubbles,
        color: 0x86ced7,
        size: 0.055,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    );
    scene.add(particles);
    const rays = new T.MeshBasicMaterial({
      color: 0x8bd3d7,
      transparent: true,
      opacity: 0.025,
      depthWrite: false,
      side: T.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const ray = mesh(
        new T.CylinderGeometry(0.4, 3.5, 40, 12, 1, true),
        rays,
        -15 + i * 9,
        -3,
        -8 + i * 4,
      );
      ray.rotation.z = -0.28;
    }
  }
  let lastScreenState: State | undefined;
  return {
    scene,
    targets,
    update(g, time) {
      if (mode === "deck" && g !== lastScreenState) {
        for (const s of screens) {
          paintConsole(s.canvas, s.station, g);
          s.texture.needsUpdate = true;
        }
        lastScreenState = g;
      }
      for (const light of alertLights)
        light.intensity = g.incident ? 12 + Math.sin(time * 4) * 4 : 0;
      for (const gauge of gauges)
        gauge.needle.rotation.z = 2.2 - (g[gauge.stat] / 100) * 4.4;
      waterClock.value = time;
      if (wake) {
        wake.visible = Boolean(g.waypoint);
        wake.position.z = 9 + ((time * 0.3) % 1.5);
        wake.rotation.z = Math.sin(time * 0.2) * 0.08;
      }
      if (ocean) ocean.uniforms.uTime.value = time;
      if (particles) particles.position.z = (time * 0.12) % 10;
      if (propeller) propeller.rotation.z = g.waypoint ? time * 1.2 : 0;
    },
    dispose() {
      disposeScene(scene);
    },
  };
}
export function paintConsole(
  canvas: HTMLCanvasElement,
  station: string,
  g: State,
) {
  const c = canvas.getContext("2d");
  if (!c) return;
  const w = canvas.width,
    h = canvas.height;
  c.fillStyle = "#06151d";
  c.fillRect(0, 0, w, h);
  c.strokeStyle = "#163b46";
  c.lineWidth = 1;
  for (let x = 0; x < w; x += 32) {
    c.beginPath();
    c.moveTo(x, 38);
    c.lineTo(x, h);
    c.stroke();
  }
  for (let y = 38; y < h; y += 32) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  c.font = "bold 17px monospace";
  c.fillStyle = "#88d4cf";
  c.fillText("AURORA / " + station.toUpperCase(), 20, 26);
  c.font = "12px monospace";
  c.fillStyle = "#709bab";
  c.fillText(`${g.mode.toUpperCase()}  |  T+${g.time}s`, 20, h - 16);
  if (station === "Sonar") {
    const x = w * 0.5,
      y = h * 0.53,
      r = 108;
    c.strokeStyle = "#286b54";
    for (let n = 1; n <= 4; n++) {
      c.beginPath();
      c.arc(x, y, (r * n) / 4, 0, Math.PI * 2);
      c.stroke();
    }
    const a = g.time * 0.25;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    c.strokeStyle = "#8ee2ac";
    c.stroke();
    g.contacts
      .filter((t) => !t.resolved)
      .forEach((t, i) => {
        c.fillStyle = t.confidence >= 80 ? "#93e3b0" : "#ba9b60";
        c.fillRect(
          x + Math.sin(i * 1.8) * r * 0.7,
          y + Math.cos(i * 2) * r * 0.7,
          5,
          5,
        );
      });
  } else if (station === "Navigation") {
    c.strokeStyle = "#5cc4cc";
    c.beginPath();
    c.moveTo((g.position.x / 100) * w, (g.position.y / 100) * (h - 75) + 40);
    if (g.waypoint)
      c.lineTo((g.waypoint.x / 100) * w, (g.waypoint.y / 100) * (h - 75) + 40);
    c.stroke();
    c.fillStyle = "#a9e6d4";
    c.fillRect(
      (g.position.x / 100) * w - 4,
      (g.position.y / 100) * (h - 75) + 36,
      8,
      8,
    );
    c.fillText(
      `GRID ${g.position.x.toFixed(1)} / ${g.position.y.toFixed(1)}`,
      20,
      62,
    );
  } else if (station === "Engineering") {
    [
      ["HULL", g.hull],
      ["POWER", g.power],
      ["SUPPLIES", g.supplies],
    ].forEach(([label, value], i) => {
      c.fillStyle = "#83b6bc";
      c.fillText(String(label), 24, 78 + i * 55);
      c.fillStyle = "#163742";
      c.fillRect(130, 65 + i * 55, 330, 16);
      c.fillStyle = Number(value) < 30 ? "#d18d60" : "#5db8b0";
      c.fillRect(130, 65 + i * 55, Number(value) * 3.3, 16);
    });
    c.fillStyle = g.incident ? "#edb26b" : "#68b68a";
    c.fillText(g.incident ? "SYSTEM ALERT" : "ALL SYSTEMS NOMINAL", 24, 258);
  } else {
    g.reports
      .slice(-4)
      .reverse()
      .forEach((r, i) => {
        c.fillStyle = r.status === "Verified" ? "#80d7a5" : "#a9af9e";
        c.fillText(`${r.id}  ${r.category}`.slice(0, 48), 20, 78 + i * 43);
        c.fillStyle = "#587d8c";
        c.fillText(`${r.status} / CONF ${r.confidence}%`, 20, 94 + i * 43);
      });
  }
}
