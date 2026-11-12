import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
export default function CommandRoom({
  quality,
  onStation,
}: {
  quality: string;
  onStation: (station: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: quality === "high" });
    } catch {
      setError(
        "WebGL không khả dụng. Các trạm vẫn mở được từ thanh điều hướng.",
      );
      return;
    }
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, quality === "high" ? 1.5 : 1),
    );
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#061018");
    scene.fog = new THREE.FogExp2("#061018", 0.035);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
    camera.position.set(0, 2.7, 7);
    const metal = new THREE.MeshStandardMaterial({
      color: "#21333d",
      metalness: 0.8,
      roughness: 0.4,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#09131a",
      metalness: 0.5,
      roughness: 0.6,
    });
    const meshes: THREE.Mesh[] = [];
    const box = (
      w: number,
      h: number,
      d: number,
      x: number,
      y: number,
      z: number,
      material: THREE.Material,
    ) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      m.position.set(x, y, z);
      scene.add(m);
      return m;
    };
    box(14, 0.2, 20, 0, -0.1, -2, metal);
    box(14, 0.2, 20, 0, 5.2, -2, metal);
    box(0.3, 5.4, 20, -6.5, 2.5, -2, metal);
    box(0.3, 5.4, 20, 6.5, 2.5, -2, metal);
    box(13, 5, 0.4, 0, 2.5, -10, metal);
    for (let z = -9; z < 8; z += 2) {
      box(13, 0.15, 0.15, 0, 5, z, dark);
      box(0.15, 5, 0.15, -6.2, 2.5, z, dark);
      box(0.15, 5, 0.15, 6.2, 2.5, z, dark);
    }
    const stations = ["Sonar", "Navigation", "Engineering", "Intelligence"];
    const colors = ["#45c58a", "#36a9d0", "#e5aa42", "#45c58a"];
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 2.8;
      box(2.4, 1.3, 1.8, x, 0.65, -4, metal);
      const screen = box(
        2.1,
        1.35,
        0.12,
        x,
        2,
        -4.6,
        new THREE.MeshStandardMaterial({
          color: colors[i],
          emissive: colors[i],
          emissiveIntensity: 0.55,
          roughness: 0.25,
        }),
      );
      screen.userData.station = stations[i];
      meshes.push(screen);
      for (let j = 0; j < 5; j++)
        box(
          0.17,
          0.04,
          0.08,
          x - 0.8 + j * 0.38,
          1.33,
          -3.5,
          new THREE.MeshStandardMaterial({
            color: colors[i],
            emissive: colors[i],
            emissiveIntensity: 1,
          }),
        );
      box(0.9, 0.2, 0.8, x, 0.9, -1.5, dark);
      box(0.9, 1, 0.2, x, 1.45, -1.1, dark);
      box(0.15, 0.8, 0.15, x, 0.4, -1.5, metal);
    }
    box(3, 1, 1.6, 0, 0.5, 2, metal);
    box(
      2.6,
      0.08,
      1.3,
      0,
      1.05,
      2,
      new THREE.MeshStandardMaterial({
        color: "#167b8e",
        emissive: "#167b8e",
        emissiveIntensity: 0.5,
      }),
    );
    for (const x of [-5, 5]) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 15, 12),
        metal,
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(x, 4.5, -2);
      scene.add(pipe);
    }
    scene.add(new THREE.HemisphereLight("#8bbed1", "#07111c", 1.5));
    for (const x of [-4, 0, 4]) {
      const light = new THREE.PointLight("#3b9fba", 35, 14);
      light.position.set(x, 4, -3);
      scene.add(light);
      box(
        1.6,
        0.06,
        0.25,
        x,
        5,
        -3,
        new THREE.MeshBasicMaterial({ color: "#a5e4e4" }),
      );
    }
    const red = new THREE.PointLight("#bf3737", 10, 8);
    red.position.set(5, 3, 5);
    scene.add(red);
    let yaw = 0,
      pitch = 0,
      down = false,
      lastX = 0,
      lastY = 0,
      moved = false;
    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const start = (e: PointerEvent) => {
      down = true;
      moved = false;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      yaw -= dx * 0.004;
      pitch = Math.max(-0.45, Math.min(0.45, pitch - dy * 0.003));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const end = (e: PointerEvent) => {
      down = false;
      if (moved) return;
      const r = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(meshes)[0];
      if (hit) onStation(hit.object.userData.station);
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.fov = Math.max(35, Math.min(85, camera.fov + e.deltaY * 0.03));
      camera.updateProjectionMatrix();
    };
    el.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    el.addEventListener("wheel", wheel, { passive: false });
    const resize = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let frame = 0;
    const draw = () => {
      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      el.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      el.removeEventListener("wheel", wheel);
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [quality, onStation]);
  return (
    <div className="room" ref={host}>
      {error && <div className="room-error">{error}</div>}
      <div className="room-caption">
        COMMAND DECK / LIVE 3D{" "}
        <span>
          Kéo chuột để quan sát · cuộn để zoom · chọn màn hình để mở trạm
        </span>
      </div>
    </div>
  );
}
