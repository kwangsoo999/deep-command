import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Anchor, Camera, Compass, Radio, RotateCcw, Waves } from "lucide-react";
import {
  cameraViews,
  advanceVisualTime,
  createAssembly,
  stationNames,
  type CameraView,
  type SceneMode,
} from "./graphics/scenes";
import type { State } from "./simulation";
export default function CommandRoom({
  game,
  onStation,
  onScan,
  onWaypoint,
}: {
  game: State;
  onStation: (station: string) => void;
  onScan: () => void;
  onWaypoint: () => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    live = useRef(game);
  live.current = game;
  const [mode, setMode] = useState<SceneMode>("deck"),
    [view, setView] = useState<CameraView>("bridge"),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const viewRef = useRef<CameraView>(view);
  viewRef.current = view;
  const quality = game.settings.quality;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    setError("");
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: quality === "high",
        powerPreference: quality === "high" ? "high-performance" : "low-power",
      });
    } catch {
      setError(
        "WebGL không khả dụng. Bạn vẫn có thể dùng bản đồ và các trạm bằng nút bên dưới.",
      );
      return;
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.5 : 1),
    );
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = quality === "high";
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    const assembly = createAssembly(mode, quality === "high");
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      mode === "deck"
        ? "Boong chỉ huy Aurora 3D"
        : "Tàu Aurora dưới đại dương 3D",
    );
    const camera = new T.PerspectiveCamera(58, 1, 0.1, 220);
    const initial = cameraViews[mode === "ocean" ? "ocean" : "bridge"];
    camera.position.fromArray(initial.position);
    camera.lookAt(new T.Vector3().fromArray(initial.target));
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.fromArray(initial.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = mode === "ocean" ? 8 : 1.4;
    controls.maxDistance = mode === "ocean" ? 48 : 12;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = mode === "ocean" ? Math.PI * 0.83 : Math.PI * 0.65;
    if (mode === "deck") {
      controls.minAzimuthAngle = -0.85;
      controls.maxAzimuthAngle = 0.85;
    }
    let previousView: CameraView = mode === "ocean" ? "ocean" : "bridge",
      transition = false,
      dragStart: { x: number; y: number } | null = null,
      frame = 0,
      stopped = false,
      last = performance.now(),
      visualTime = live.current.time,
      previousTime = live.current.time;
    const destination = new T.Vector3(),
      target = new T.Vector3(),
      ray = new T.Raycaster(),
      pointer = new T.Vector2();
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragStart = { x: e.clientX, y: e.clientY };
      transition = false;
    };
    const up = (e: PointerEvent) => {
      const start = dragStart;
      dragStart = null;
      if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5)
        return;
      const r = renderer.domElement.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(assembly.targets)[0];
      if (hit) onStation(hit.object.userData.station);
    };
    const cancel = () => {
      dragStart = null;
    };
    const lost = (event: Event) => {
      event.preventDefault();
      stopped = true;
      cancelAnimationFrame(frame);
      setError(
        "Kết nối WebGL đã bị mất. Chọn Nạp lại 3D để khôi phục; tiến trình game vẫn được giữ.",
      );
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", cancel);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const draw = (now: number) => {
      if (stopped) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const g = live.current;
      visualTime = advanceVisualTime(visualTime, previousTime, g, dt);
      previousTime = g.time;
      const currentView = viewRef.current;
      if (currentView !== previousView) {
        const preset = cameraViews[currentView];
        destination.fromArray(preset.position);
        target.fromArray(preset.target);
        previousView = currentView;
        transition = true;
      }
      if (transition) {
        const blend = 1 - Math.exp(-dt * 5);
        camera.position.lerp(destination, blend);
        controls.target.lerp(target, blend);
        if (camera.position.distanceTo(destination) < 0.015) transition = false;
      }
      controls.update();
      if (mode === "deck") {
        camera.position.y = T.MathUtils.clamp(camera.position.y, 0.8, 4.8);
        const maxX = Math.sqrt(9 - (camera.position.y - 2.7) ** 2) * 1.43;
        camera.position.x = T.MathUtils.clamp(camera.position.x, -maxX, maxX);
        camera.position.z = T.MathUtils.clamp(camera.position.z, -3.2, 7);
        camera.lookAt(controls.target);
      }
      assembly.update(g, visualTime);
      renderer.render(assembly.scene, camera);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      assembly.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mode, quality, onStation, retry]);
  const switchMode = (next: SceneMode) => {
    setMode(next);
    setView(next === "ocean" ? "ocean" : "bridge");
  };
  return (
    <div className="visual-deck">
      <div className="scene-toolbar">
        <div className="scene-tabs">
          <button
            className={mode === "deck" ? "active" : ""}
            onClick={() => switchMode("deck")}
          >
            <Anchor size={15} />
            Boong chỉ huy
          </button>
          <button
            className={mode === "ocean" ? "active" : ""}
            onClick={() => switchMode("ocean")}
          >
            <Waves size={15} />
            Đại dương
          </button>
        </div>
        <button
          aria-label="Đặt lại góc nhìn 3D"
          onClick={() => {
            setView(mode === "ocean" ? "ocean" : "bridge");
            setRetry((v) => v + 1);
          }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="scene-viewport">
        <div className="scene-canvas" ref={host} />
        <div className="scene-grain" />
        <div className="scene-topline">
          <span>
            CAM {mode === "ocean" ? "06 / EXTERIOR" : "01 / COMMAND DECK"}
          </span>
          <span>
            {game.mode.toUpperCase()} · {quality === "high" ? "HIGH" : "LOW"}{" "}
            QUALITY
          </span>
        </div>
        <div className="scene-title">
          <span className="eyebrow">
            {mode === "deck"
              ? "DCS AURORA / OPERATIONS"
              : "NORTHERN HORIZON / DEEP WATER"}
          </span>
          <h2>
            {mode === "deck"
              ? "Bên trong vùng im lặng."
              : "Aurora. Dưới tầng sóng."}
          </h2>
          <p>
            {mode === "deck"
              ? "Màn hình trạm hiển thị dữ liệu nhiệm vụ hiện tại."
              : "Ngoại cảnh hư cấu · mọi hiệu ứng chuyển động dừng theo Pause & Plan."}
          </p>
        </div>
        <div className="scene-stats">
          <span>
            HULL <b>{Math.round(game.hull)}%</b>
          </span>
          <span>
            POWER <b>{Math.round(game.power)}%</b>
          </span>
          <span>
            GRID{" "}
            <b>
              {game.position.x.toFixed(1)} / {game.position.y.toFixed(1)}
            </b>
          </span>
          {game.incident && <span className="amber">⚠ SYSTEM ALERT</span>}
        </div>
        {error && (
          <div className="scene-error" role="alert">
            <p>{error}</p>
            <button onClick={() => setRetry((v) => v + 1)}>Nạp lại 3D</button>
          </div>
        )}
      </div>
      <div className="camera-presets">
        <Camera size={15} />
        <span>GÓC NHÌN</span>
        {(mode === "deck" ? ["bridge", ...stationNames] : ["ocean"]).map(
          (id) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id as CameraView)}
            >
              {id === "bridge"
                ? "Toàn boong"
                : id === "ocean"
                  ? "Toàn cảnh"
                  : id}
            </button>
          ),
        )}
      </div>
      <div className="deck-actions">
        <button
          disabled={
            game.stage !== "active" || game.mode !== "running" || game.power < 3
          }
          onClick={onScan}
        >
          <Radio size={15} />
          Quét sonar · 3 PWR
        </button>
        <button disabled={game.stage !== "active"} onClick={onWaypoint}>
          <Compass size={15} />
          Đặt tuyến nhiệm vụ
        </button>
        {mode === "deck" &&
          stationNames.includes(view as (typeof stationNames)[number]) && (
            <button className="primary" onClick={() => onStation(view)}>
              Mở trạm {view}
            </button>
          )}
      </div>
      <p className="scene-instructions">
        Kéo để quan sát · cuộn/pinch để zoom · chọn màn hình để mở trạm. Nút
        trạm vẫn dùng được khi WebGL không khả dụng.
      </p>
      <div className="station-shortcuts">
        {stationNames.map((name) => (
          <button key={name} onClick={() => onStation(name)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
