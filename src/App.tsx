import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Anchor,
  Activity,
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Download,
  FileText,
  Flag,
  Focus,
  Gauge,
  Layers,
  Menu,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Ship,
  Target,
  Upload,
  Users,
  Waves,
  X,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
} from "lucide-react";
import { useGame } from "./store";
import {
  goals,
  missions,
  serialize,
  upgrades,
  type Contact,
  type State,
} from "./simulation";
const CommandRoom = lazy(() => import("./CommandRoom"));
import "./style.css";
const fmt = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
const nav = [
  ["Command", "Chỉ huy", Anchor],
  ["Navigation", "Hải trình", Compass],
  ["Sonar", "Sonar", Radio],
  ["Intelligence", "Tình báo", FileText],
  ["Engineering", "Kỹ thuật", SlidersHorizontal],
  ["Crew", "Thủy thủ", Users],
  ["Fleet", "Hạm đội", Ship],
] as const;
function Meter({
  label,
  value,
  color = "green",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="meter">
      <div>
        <span>{label}</span>
        <b>
          {Math.round(value)}
          <small>%</small>
        </b>
      </div>
      <div className="track">
        <i
          className={color}
          style={{ width: Math.max(0, Math.min(100, value)) + "%" }}
        />
      </div>
    </div>
  );
}
function TacticalMap({
  g,
  selected,
  onSelect,
}: {
  g: State;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const dispatch = useGame((s) => s.dispatch);
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [layers, setLayers] = useState(true);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const svg = useRef<SVGSVGElement>(null);
  const screenPoint = (e: React.PointerEvent) => {
    const p = svg.current!.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.current!.getScreenCTM()!.inverse());
  };
  const target = missions[g.mission].target;
  return (
    <div className="tactical-map">
      <svg
        ref={svg}
        viewBox="0 0 1000 700"
        role="img"
        aria-label="Bản đồ chiến thuật giả tưởng. Chọn vị trí để đặt waypoint"
        onPointerDown={(e) => {
          const p = screenPoint(e);
          drag.current = { x: p.x, y: p.y, px: pan.x, py: pan.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) {
            const p = screenPoint(e);
            setPan({
              x: drag.current.px + p.x - drag.current.x,
              y: drag.current.py + p.y - drag.current.y,
            });
          }
        }}
        onPointerUp={(e) => {
          if (!drag.current) return;
          const p = screenPoint(e),
            d = drag.current;
          drag.current = null;
          if (Math.hypot(p.x - d.x, p.y - d.y) < 5) {
            const x = (p.x - 500 - pan.x) / zoom + 500,
              y = (p.y - 350 - pan.y) / zoom + 350;
            dispatch({ type: "waypoint", x: x / 10, y: y / 7 });
          }
        }}
      >
        <defs>
          <pattern
            id="grid"
            width="70"
            height="70"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 70 0 L 0 0 0 70"
              fill="none"
              stroke="#173442"
              strokeWidth=".7"
            />
          </pattern>
          <radialGradient id="ocean">
            <stop stopColor="#103143" />
            <stop offset="1" stopColor="#071722" />
          </radialGradient>
          <radialGradient id="range">
            <stop stopColor="#1aa9ac" stopOpacity=".03" />
            <stop offset="1" stopColor="#1aa9ac" stopOpacity=".07" />
          </radialGradient>
          <pattern
            id="land"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 10L10 0" stroke="#2c4c57" strokeWidth=".5" />
          </pattern>
        </defs>
        <rect width="1000" height="700" fill="url(#ocean)" />
        <g
          transform={`translate(${500 + pan.x} ${350 + pan.y}) scale(${zoom}) translate(-500 -350)`}
        >
          <rect
            x="-1000"
            y="-1000"
            width="3000"
            height="3000"
            fill="url(#grid)"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M ${-60 + i * 12} -10 C ${80 + i * 25} ${130 + i * 18}, ${230 + i * 32} 140, ${170 + i * 28} 310 S ${50 + i * 35} 500, ${130 + i * 20} 730`}
              stroke="#204555"
              strokeWidth="1"
              fill="none"
              opacity=".55"
            />
          ))}
          <path
            d="M0 0 H240 L225 42 191 59 208 93 180 123 130 135 113 174 71 191 85 232 40 267 0 280Z"
            fill="#152e38"
            stroke="#43606b"
            strokeWidth="2"
          />
          <path
            d="M0 0 H240 L225 42 191 59 208 93 180 123 130 135 113 174 71 191 85 232 40 267 0 280Z"
            fill="url(#land)"
          />
          <path
            d="M1000 700H861L869 664 831 641 850 607 903 596 917 553 965 541 1000 495Z"
            fill="#152e38"
            stroke="#43606b"
            strokeWidth="2"
          />
          <path
            d="M1000 0H885L900 28 929 39 921 72 960 95 1000 111Z"
            fill="#152e38"
            stroke="#43606b"
          />
          {layers && (
            <>
              <ellipse
                cx="680"
                cy="324"
                rx="155"
                ry="108"
                fill="#ad733a"
                fillOpacity=".025"
                stroke="#b88845"
                strokeDasharray="5 8"
                opacity=".45"
              />
              <text x="620" y="221" className="map-warning">
                RESTRICTED SECTOR
              </text>
              <path
                d="M350 85 Q540 70 560 205T840 470"
                stroke="#3e6471"
                strokeDasharray="3 10"
                fill="none"
              />
              <text x="330" y="635" className="map-region">
                ECHO BASIN
              </text>
              <text x="510" y="120" className="map-region">
                VESPER RIDGE
              </text>
              <text x="774" y="574" className="map-region">
                FROST PASSAGE
              </text>
              <text x="28" y="48" className="map-land">
                NORTHLAND
              </text>
            </>
          )}
          {[80, 160, 240].map((r) => (
            <circle
              key={r}
              cx={g.position.x * 10}
              cy={g.position.y * 7}
              r={r}
              fill={r === 240 ? "url(#range)" : "none"}
              stroke="#2a8d91"
              strokeWidth=".8"
              opacity=".3"
            />
          ))}
          <path
            d={`M${g.position.x * 10} ${g.position.y * 7}L${target.x * 10} ${target.y * 7}`}
            stroke="#4d7c8c"
            strokeDasharray="3 9"
            fill="none"
          />
          <g transform={`translate(${target.x * 10} ${target.y * 7})`}>
            <circle r="24" stroke="#d3b068" fill="none" strokeDasharray="3 5" />
            <path d="M-6-6H6V6H-6Z" fill="none" stroke="#d3b068" />
            <text y="-34" textAnchor="middle" className="map-target">
              MISSION WAYPOINT
            </text>
          </g>
          {g.waypoint && (
            <>
              <path
                d={`M${g.position.x * 10} ${g.position.y * 7}L${g.waypoint.x * 10} ${g.waypoint.y * 7}`}
                stroke="#68d7be"
                strokeDasharray="6 6"
              />
              <circle
                cx={g.waypoint.x * 10}
                cy={g.waypoint.y * 7}
                r="8"
                fill="none"
                stroke="#68d7be"
              />
            </>
          )}
          {g.contacts.map((c) => (
            <g
              key={c.id}
              transform={`translate(${c.x * 10} ${c.y * 7})`}
              className="contact-marker"
              role="button"
              tabIndex={0}
              aria-label={c.id}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => {
                e.stopPropagation();
                onSelect(c.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(c.id);
              }}
              opacity={c.resolved ? 0.35 : 1}
            >
              <circle r="23" fill="transparent" />
              {selected === c.id && (
                <circle
                  r="25"
                  fill="none"
                  stroke="#e5aa42"
                  strokeDasharray="3 4"
                />
              )}
              <path
                d="M0-9L9 0 0 9-9 0Z"
                fill={
                  c.confidence >= 80
                    ? c.hostile
                      ? "#d88362"
                      : "#45c58a"
                    : "#091d28"
                }
                stroke={
                  c.confidence >= 80
                    ? c.hostile
                      ? "#d88362"
                      : "#45c58a"
                    : "#c0a16b"
                }
                strokeWidth="1.5"
              />
              <text x="18" y="-5" className="contact-label">
                {c.id}
              </text>
              <text x="18" y="11" className="contact-value">
                {c.resolved
                  ? "ARCHIVED"
                  : c.confidence >= 80
                    ? c.category
                    : "UNKNOWN"}{" "}
                · {Math.round(c.confidence)}%
              </text>
            </g>
          ))}
          <g transform={`translate(${g.position.x * 10} ${g.position.y * 7})`}>
            <circle
              r="23"
              fill="#39b7c9"
              fillOpacity=".1"
              stroke="#39b7c9"
              strokeOpacity=".4"
            />
            <path d="M0-15L8 11 0 7-8 11Z" fill="#a6f0ef" />
            <text x="27" y="-4" className="own-label">
              DCS AURORA
            </text>
            <text x="27" y="14" className="contact-value">
              {g.position.x.toFixed(1)} / {g.position.y.toFixed(1)}
            </text>
          </g>
        </g>
        <g className="map-axis">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <text key={i} x={i * 100} y="20">
              {String(i * 10).padStart(3, "0")} E
            </text>
          ))}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <text key={i} x="12" y={i * 100}>
              {String(i * 10).padStart(3, "0")}
            </text>
          ))}
        </g>
      </svg>
      <div className="map-badge">
        <span className="dot" /> TACTICAL OVERVIEW{" "}
        <small>GRID / FICTIONAL</small>
      </div>
      <div className="map-tools">
        <button
          aria-label="Phóng to bản đồ"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
        >
          <ZoomIn size={16} />
        </button>
        <button
          aria-label="Thu nhỏ bản đồ"
          onClick={() => setZoom((z) => Math.max(0.65, z - 0.25))}
        >
          <ZoomOut size={16} />
        </button>
        <button
          aria-label="Đặt lại bản đồ"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
        >
          <Focus size={16} />
        </button>
        <button
          aria-label="Bật tắt lớp bản đồ"
          className={layers ? "active" : ""}
          onClick={() => setLayers((v) => !v)}
        >
          <Layers size={16} />
        </button>
      </div>
      <div className="map-legend">
        <span>
          <i className="cyan" />
          Tàu của bạn
        </span>
        <span>
          <i className="amber" />
          Liên lạc
        </span>
        <span>+ Chọn bản đồ để đặt waypoint · kéo để di chuyển</span>
      </div>
      <div className="map-scale">
        0 ━━━ 20 GU <span>N ↑</span>
      </div>
    </div>
  );
}
function Sonar({ g }: { g: State }) {
  return (
    <div className={"sonar " + (g.mode === "running" ? "sweeping" : "")}>
      <svg viewBox="0 0 260 260">
        <defs>
          <radialGradient id="sonar-bg">
            <stop stopColor="#154234" />
            <stop offset="1" stopColor="#081b1b" />
          </radialGradient>
          <linearGradient id="sweep">
            <stop stopColor="#45c58a" stopOpacity="0" />
            <stop offset="1" stopColor="#45c58a" stopOpacity=".45" />
          </linearGradient>
        </defs>
        <circle
          cx="130"
          cy="130"
          r="117"
          fill="url(#sonar-bg)"
          stroke="#275c4b"
        />
        {[29, 58, 87, 116].map((r) => (
          <circle
            key={r}
            cx="130"
            cy="130"
            r={r}
            fill="none"
            stroke="#28604a"
            strokeWidth=".7"
          />
        ))}
        {[0, 30, 60, 90, 120, 150].map((n) => (
          <line
            key={n}
            x1="13"
            y1="130"
            x2="247"
            y2="130"
            stroke="#28604a"
            strokeWidth=".6"
            transform={`rotate(${n} 130 130)`}
          />
        ))}
        <g
          style={{
            transform: `rotate(${(g.time * 9) % 360}deg)`,
            transformOrigin: "130px 130px",
          }}
        >
          <path d="M130 130L247 130A117 117 0 0 0 189 29Z" fill="url(#sweep)" />
          <path d="M130 130L247 130" stroke="#72dd9b" />
        </g>
        {g.contacts
          .filter((c) => !c.resolved)
          .map((c, i) => (
            <g key={c.id} opacity={c.confidence / 100}>
              <circle
                cx={55 + i * 34}
                cy={75 + (i % 3) * 45}
                r="3"
                fill="#8cffa9"
              />
              <circle
                cx={55 + i * 34}
                cy={75 + (i % 3) * 45}
                r="8"
                fill="none"
                stroke="#45c58a"
                strokeOpacity=".4"
              />
            </g>
          ))}
        <circle cx="130" cy="130" r="3" fill="#bcf2cf" />
        <text x="130" y="8" textAnchor="middle">
          000
        </text>
        <text x="250" y="134">
          090
        </text>
        <text x="130" y="258" textAnchor="middle">
          180
        </text>
        <text x="0" y="134">
          270
        </text>
      </svg>
      <div className="sonar-readout">
        <span>PASSIVE ARRAY</span>
        <b>{g.scanCount.toString().padStart(2, "0")} SCANS</b>
      </div>
    </div>
  );
}
export default function App() {
  const {
    game: g,
    dispatch,
    advance,
    save,
    load,
    fresh,
    importSave,
  } = useGame();
  const [view, setView] = useState("Command");
  const [selected, setSelected] = useState("C-01");
  const [modal, setModal] = useState<"menu" | "settings" | "help" | null>(null);
  const [toast, setToast] = useState("");
  const [room, setRoom] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const m = missions[g.mission];
  const done = goals(g);
  const contact = g.contacts.find((c) => c.id === selected)!;
  const notify = useCallback((text: string) => setToast(text), []);
  const station = useCallback((s: string) => {
    setView(s);
    setRoom(false);
  }, []);
  useEffect(() => {
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      advance((now - last) / 1000);
      last = now;
    }, 100);
    return () => clearInterval(interval);
  }, [advance]);
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        save();
      } catch {
        notify("Không thể tự động lưu. Hãy xuất tệp lưu.");
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [save, notify]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLButtonElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: "pause" });
      }
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dispatch]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!modal && g.stage === "active") return;
    const el = document.querySelector<HTMLElement>(".overlay .dialog");
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    el.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const controls = Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a,input,[tabindex="0"]',
        ),
      );
      if (!controls.length) {
        event.preventDefault();
        return;
      }
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === el)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === el)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", trap);
    return () => {
      el.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal, g.stage]);
  const beep = () => {
    if (!g.settings.sound) return;
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
      const ctx = audio.current,
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.025, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch {}
  };
  const manualSave = () => {
    try {
      save();
      notify("Đã lưu tiến trình trên trình duyệt.");
    } catch {
      notify("Không thể lưu. Hãy xuất tệp lưu.");
    }
  };
  const exportSave = () => {
    const blob = new Blob([serialize(g)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deep-command-save.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="app" onClick={beep}>
      <header
        inert={modal !== null || g.stage !== "active"}
        aria-hidden={modal !== null || g.stage !== "active"}
      >
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setModal("menu");
          }}
        >
          <div className="brand-mark">
            <Anchor size={24} />
          </div>
          <div>
            DEEP COMMAND<small>S I L E N T O C E A N</small>
          </div>
        </a>
        <div className="campaign-tag">
          <span>NORTHERN HORIZON</span>
          <b>
            OPERATION {String(g.mission + 1).padStart(2, "0")}{" "}
            <ChevronRight size={12} /> {m.name.toUpperCase()}
          </b>
        </div>
        <div className="header-right">
          <span className="connection">
            <i className="dot" /> LOCAL SIMULATION
          </span>
          <button aria-label="Hướng dẫn" onClick={() => setModal("help")}>
            <BookOpen size={18} />
          </button>
          <button aria-label="Cài đặt" onClick={() => setModal("settings")}>
            <Settings size={18} />
          </button>
          <button aria-label="Menu chính" onClick={() => setModal("menu")}>
            <Menu size={20} />
          </button>
          <div className="avatar">AN</div>
        </div>
      </header>
      <div
        className="workspace"
        inert={modal !== null || g.stage !== "active"}
        aria-hidden={modal !== null || g.stage !== "active"}
      >
        <aside className="sidebar">
          <div className="sidebar-label">STATIONS</div>
          {nav.map(([id, label, Icon]) => (
            <button
              title={label}
              key={id}
              className={view === id ? "nav-item selected" : "nav-item"}
              onClick={() => {
                setView(id);
                setRoom(false);
              }}
            >
              <Icon size={20} />
              <span>{label}</span>
              {view === id && <i />}
            </button>
          ))}
          <div className="sidebar-bottom">
            <button
              className={room ? "selected" : ""}
              onClick={() => {
                setRoom((v) => !v);
                setView("Command");
              }}
            >
              <Ship size={20} />
              <span>Boong 3D</span>
            </button>
            <div className="classification">
              FICTIONAL
              <br />
              SIMULATION
              <br />
              <b>v0.1 / ALPHA</b>
            </div>
          </div>
        </aside>
        <main>
          <div className="command-top">
            <div>
              <span className="eyebrow">
                DCS AURORA <i /> CLASS B · PATROL
              </span>
              <h1>
                {room
                  ? "Command deck"
                  : view === "Command"
                    ? "Trung tâm chỉ huy"
                    : nav.find((n) => n[0] === view)?.[1]}
              </h1>
            </div>
            <div className="clock-status">
              <div className="time">
                <span>MISSION ELAPSED</span>
                <b>{fmt(g.time)}</b>
              </div>
              <div
                className={
                  "status-pill " + (g.mode === "running" ? "green" : "amber")
                }
              >
                <i className="dot" />
                {g.stage === "briefing"
                  ? "AWAITING ORDERS"
                  : g.stage === "debrief"
                    ? "MISSION ENDED"
                    : g.mode === "running"
                      ? "RUNNING"
                      : g.mode === "planning"
                        ? "PLANNING"
                        : "PAUSED"}
              </div>
            </div>
          </div>
          <div className="console-grid">
            <section className="main-column">
              {(view === "Command" || view === "Navigation") && !room && (
                <>
                  <div className="panel map-panel">
                    <div className="panel-head">
                      <span>
                        <Compass size={15} /> TACTICAL NAVIGATION
                      </span>
                      <span className="muted">
                        {m.region} <i className="live-dot" />
                      </span>
                    </div>
                    <TacticalMap
                      g={g}
                      selected={selected}
                      onSelect={setSelected}
                    />
                    <div className="map-footer">
                      <span>
                        <b>POSITION</b> {g.position.x.toFixed(2)} E /{" "}
                        {g.position.y.toFixed(2)} N
                      </span>
                      <span>
                        <b>COURSE</b> {g.waypoint ? "EN ROUTE" : "HOLDING"}
                      </span>
                      <button
                        className="text-button"
                        onClick={() =>
                          dispatch({ type: "waypoint", ...m.target })
                        }
                      >
                        Đến mục tiêu <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="contact-strip">
                    <div>
                      <span className="eyebrow">
                        SELECTED CONTACT / {contact.id}
                      </span>
                      <h3>{contact.name}</h3>
                      <p>
                        {contact.status} · Độ tin cậy{" "}
                        {Math.round(contact.confidence)}% ·{" "}
                        {contact.confidence >= 80
                          ? contact.hostile
                            ? "Đối phương giả lập"
                            : "Dân sự"
                          : "Chưa xác minh"}
                      </p>
                    </div>
                    <button
                      disabled={
                        contact.confidence < 80 ||
                        !contact.hostile ||
                        contact.resolved ||
                        g.stage !== "active"
                      }
                      onClick={() =>
                        dispatch({ type: "order", id: contact.id })
                      }
                    >
                      <Target size={15} /> Lệnh mô phỏng
                    </button>
                  </div>
                </>
              )}
              {room && (
                <div className="panel">
                  <div className="panel-head">
                    <span>
                      <Ship size={15} /> COMMAND CENTER / PROCEDURAL 3D
                    </span>
                    <button
                      className="text-button"
                      onClick={() => setRoom(false)}
                    >
                      Về bản đồ <ArrowRight size={13} />
                    </button>
                  </div>
                  <Suspense
                    fallback={
                      <div className="room-error">Đang nạp boong 3D…</div>
                    }
                  >
                    <CommandRoom
                      quality={g.settings.quality}
                      onStation={station}
                    />
                  </Suspense>
                </div>
              )}
              {view === "Sonar" && (
                <div className="panel content-panel">
                  <div className="panel-head">
                    <span>
                      <Radio size={15} /> SONAR CONTACTS
                    </span>
                    <b>{g.contacts.filter((c) => !c.resolved).length} ACTIVE</b>
                  </div>
                  <div className="big-sonar">
                    <Sonar g={g} />
                    <div>
                      <span className="eyebrow">ACOUSTIC SIMULATION</span>
                      <h2>Lắng nghe vùng sâu.</h2>
                      <p>
                        Mỗi lượt quét tăng độ tin cậy. Đạt 80% để nhận dạng liên
                        lạc. Tất cả tín hiệu và cự ly đều là dữ liệu game hư
                        cấu.
                      </p>
                      <button
                        className="primary"
                        disabled={
                          g.stage !== "active" ||
                          g.mode !== "running" ||
                          g.power < 3
                        }
                        onClick={() => dispatch({ type: "scan" })}
                      >
                        <Radio size={16} /> Quét sonar · 3 năng lượng
                      </button>
                    </div>
                  </div>
                  <ContactTable
                    g={g}
                    onSelect={(id) => {
                      setSelected(id);
                      setView("Command");
                    }}
                  />
                </div>
              )}
              {view === "Intelligence" && (
                <div className="panel content-panel">
                  <div className="panel-head">
                    <span>
                      <FileText size={15} /> INTELLIGENCE ROOM
                    </span>
                    <span>{g.verified.length} VERIFIED</span>
                  </div>
                  <div className="section-intro">
                    <h2>Bức tranh chưa hoàn chỉnh.</h2>
                    <p>
                      Đối chiếu các nguồn tin trước khi ra quyết định. Báo cáo
                      cũ hết hạn theo thời gian mô phỏng.
                    </p>
                  </div>
                  <div className="report-list">
                    {g.reports
                      .slice()
                      .reverse()
                      .map((r) => (
                        <article className="report" key={r.id}>
                          <div className="report-top">
                            <b>{r.id}</b>
                            <span
                              className={
                                r.status === "Verified" ? "green" : "amber"
                              }
                            >
                              {r.status.toUpperCase()}
                            </span>
                          </div>
                          <h3>
                            {r.category} / {r.region}
                          </h3>
                          <p>{r.content}</p>
                          <div className="report-meta">
                            <span>
                              {r.source} · {fmt(r.time)}
                            </span>
                            <span>CONFIDENCE {r.confidence}%</span>
                          </div>
                          <button
                            disabled={
                              r.status !== "Unverified" || g.stage !== "active"
                            }
                            onClick={() =>
                              dispatch({ type: "verify", id: r.id })
                            }
                          >
                            <Check size={14} />
                            {r.status === "Verified"
                              ? "Đã đối chiếu"
                              : "Xác minh nguồn tin"}
                          </button>
                        </article>
                      ))}
                  </div>
                </div>
              )}
              {view === "Engineering" && (
                <div className="panel content-panel">
                  <div className="panel-head">
                    <span>
                      <SlidersHorizontal size={15} /> ENGINEERING
                    </span>
                    <span>INTERNAL SYSTEMS</span>
                  </div>
                  <div className="section-intro">
                    <h2>Giữ Aurora hoạt động.</h2>
                    <p>
                      Theo dõi nguồn điện, thân tàu và vật tư. Sự cố chưa xử lý
                      sẽ gây tổn thất khi thời gian chạy.
                    </p>
                  </div>
                  <div className="engineering-grid">
                    <Meter label="HULL INTEGRITY" value={g.hull} />
                    <Meter
                      label="POWER RESERVES"
                      value={g.power}
                      color="cyan"
                    />
                    <Meter
                      label="MAINTENANCE SUPPLIES"
                      value={g.supplies}
                      color="amber"
                    />
                  </div>
                  <div className="report">
                    <h3>Bảo dưỡng thân tàu</h3>
                    <p>Khôi phục thân tàu về 100%. Chi phí 100 credits.</p>
                    <button
                      disabled={g.credits < 100 || g.hull >= 100}
                      onClick={() => dispatch({ type: "repair" })}
                    >
                      Thực hiện bảo dưỡng
                    </button>
                  </div>
                  {g.incident ? (
                    <div className="incident">
                      <h3>{g.incident.title}</h3>
                      <p>{g.incident.description}</p>
                      <button
                        disabled={g.supplies < g.incident.cost}
                        onClick={() => dispatch({ type: "resolve" })}
                      >
                        Xử lý · {g.incident.cost} vật tư
                      </button>
                    </div>
                  ) : (
                    <div className="all-clear">
                      <Shield size={28} />
                      <h3>Tất cả hệ thống ổn định</h3>
                      <p>Không có sự cố đang diễn ra.</p>
                    </div>
                  )}
                </div>
              )}
              {view === "Crew" && (
                <div className="panel content-panel">
                  <div className="panel-head">
                    <span>
                      <Users size={15} /> CREW MANIFEST
                    </span>
                    <span>6 OFFICERS / ACTIVE</span>
                  </div>
                  <div className="section-intro">
                    <h2>Một con tàu. Một thủy thủ đoàn.</h2>
                    <p>
                      Huấn luyện nâng kỹ năng; nghỉ ngơi giảm mệt mỏi và tăng
                      tinh thần.
                    </p>
                  </div>
                  <div className="crew-grid">
                    {g.crew.map((c) => (
                      <article className="crew-card" key={c.id}>
                        <div className="crew-name">
                          <div className="crew-avatar">
                            {c.name
                              .split(" ")
                              .map((s) => s[0])
                              .join("")}
                          </div>
                          <div>
                            <span className="eyebrow">{c.role}</span>
                            <h3>{c.name}</h3>
                          </div>
                          <span className="green dot" />
                        </div>
                        <Meter label="Kỹ năng" value={c.skill} color="cyan" />
                        <Meter label="Tinh thần" value={c.morale} />
                        <Meter
                          label="Mệt mỏi"
                          value={c.fatigue}
                          color="amber"
                        />
                        <div className="card-actions">
                          <button
                            disabled={g.credits < 75 || c.skill >= 100}
                            onClick={() =>
                              dispatch({ type: "train", id: c.id })
                            }
                          >
                            Huấn luyện · 75 C
                          </button>
                          <button
                            disabled={g.credits < 30 || c.fatigue === 0}
                            onClick={() => dispatch({ type: "rest", id: c.id })}
                          >
                            Nghỉ · 30 C
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {view === "Fleet" && (
                <div className="panel content-panel">
                  <div className="panel-head">
                    <span>
                      <Ship size={15} /> FLEET MANAGEMENT
                    </span>
                    <span>DCS AURORA</span>
                  </div>
                  <div className="fleet-hero">
                    <svg viewBox="0 0 700 180">
                      <path
                        d="M60 97Q80 63 170 66H525Q610 70 650 96 606 128 525 130H170Q75 129 60 97Z"
                        fill="#28414c"
                        stroke="#6e929d"
                      />
                      <path
                        d="M310 67V30Q330 18 353 30L360 67M329 25V9M340 25V0M565 67L595 38 610 44 587 77M565 130L590 155 605 152 585 116"
                        fill="#314e5a"
                        stroke="#6e929d"
                      />
                      <path
                        d="M130 97H580M160 80H260M160 112H480"
                        stroke="#5b7c87"
                        strokeDasharray="5 5"
                      />
                      <circle cx="285" cy="88" r="3" fill="#43c7ad" />
                    </svg>
                    <span className="eyebrow">
                      CLASS B / FICTIONAL PATROL SUBMARINE
                    </span>
                    <h2>
                      DCS AURORA <small>SSN–047</small>
                    </h2>
                  </div>
                  <div className="upgrade-grid">
                    {upgrades.map((u) => (
                      <article className="upgrade" key={u[0]}>
                        <span className="upgrade-icon">
                          <SlidersHorizontal size={20} />
                        </span>
                        <div>
                          <h3>{u[1]}</h3>
                          <p>{u[2]}</p>
                        </div>
                        <button
                          disabled={
                            g.upgrades.includes(u[0]) || g.credits < u[3]
                          }
                          onClick={() =>
                            dispatch({ type: "upgrade", id: u[0] })
                          }
                        >
                          {g.upgrades.includes(u[0]) ? (
                            <>
                              <Check size={14} /> Đã lắp
                            </>
                          ) : (
                            `${u[3]} C`
                          )}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              <div className="panel log-panel">
                <div className="panel-head">
                  <span>
                    <Activity size={14} /> COMMAND LOG
                  </span>
                  <span className="muted">
                    {g.logs.length} ENTRIES · AUTOLOG
                  </span>
                </div>
                <div className="logs" role="log" aria-label="Nhật ký chỉ huy">
                  {g.logs
                    .slice(-4)
                    .reverse()
                    .map((l) => (
                      <div key={l.id}>
                        <time>{fmt(l.time)}</time>
                        <i className={"dot " + l.severity} />
                        <span>{l.text}</span>
                      </div>
                    ))}
                </div>
              </div>
            </section>
            <aside className="right-column">
              <div className="panel mission-panel">
                <div className="panel-head">
                  <span>
                    <Flag size={14} /> ACTIVE MISSION
                  </span>
                  <b>0{g.mission + 1} / 05</b>
                </div>
                <div className="mission-body">
                  <span className="eyebrow amber">NORTHERN HORIZON</span>
                  <h2>{m.name}</h2>
                  <p>
                    {m.type} <span>•</span> {m.region}
                  </p>
                  <div className="mission-progress">
                    <i
                      style={{
                        width: (done.filter(Boolean).length / 3) * 100 + "%",
                      }}
                    />
                  </div>
                  <div className="objectives">
                    {m.goals.map((goal, i) => (
                      <div key={goal} className={done[i] ? "complete" : ""}>
                        <span>
                          {done[i] ? (
                            <Check size={12} />
                          ) : (
                            String(i + 1).padStart(2, "0")
                          )}
                        </span>
                        {goal}
                      </div>
                    ))}
                  </div>
                  <div className="mission-time">
                    <span>TIME REMAINING</span>
                    <b>{fmt(Math.max(0, m.limit - g.time))}</b>
                  </div>
                  {g.mission === 2 && (
                    <button
                      onClick={() => dispatch({ type: "order" })}
                      disabled={g.stage !== "active"}
                    >
                      Điều phối cứu hộ
                    </button>
                  )}
                  <button
                    className="text-button briefing-link"
                    onClick={() => setModal("help")}
                  >
                    Xem chỉ thị nhiệm vụ <ArrowRight size={13} />
                  </button>
                </div>
              </div>
              <div className="panel sonar-panel">
                <div className="panel-head">
                  <span>
                    <Radio size={14} /> SONAR ARRAY
                  </span>
                  <span className="green">ONLINE</span>
                </div>
                <Sonar g={g} />
                <button
                  className="scan-button"
                  disabled={
                    g.stage !== "active" || g.mode !== "running" || g.power < 3
                  }
                  onClick={() => dispatch({ type: "scan" })}
                >
                  <Radio size={14} /> QUÉT SONAR <span>−3 PWR</span>
                </button>
              </div>
              <div className="panel vessel-panel">
                <div className="panel-head">
                  <span>
                    <Shield size={14} /> VESSEL STATUS
                  </span>
                  <span className={g.incident ? "amber" : "green"}>
                    {g.incident ? "WARNING" : "NOMINAL"}
                  </span>
                </div>
                <div className="vessel-meters">
                  <Meter label="Hull integrity" value={g.hull} />
                  <Meter label="Power reserves" value={g.power} color="cyan" />
                  <Meter
                    label="Crew morale"
                    value={
                      g.crew.reduce((a, c) => a + c.morale, 0) / g.crew.length
                    }
                  />
                </div>
                {g.incident && (
                  <button
                    className="incident-link"
                    onClick={() => setView("Engineering")}
                  >
                    <Bell size={14} />
                    {g.incident.title}
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
      <footer
        inert={modal !== null || g.stage !== "active"}
        aria-hidden={modal !== null || g.stage !== "active"}
      >
        <div className="resource">
          <span className="status-light" />
          <b>ALL STATIONS READY</b>
          <span className="footer-divider" />
          <span>
            CREDITS <strong>{g.credits.toLocaleString()}</strong>
          </span>
          <span>
            XP <strong>{g.xp}</strong>
          </span>
          <span>
            SUPPLIES <strong>{g.supplies}</strong>
          </span>
        </div>
        <div className="playback">
          <button
            title="Lập kế hoạch"
            className={g.mode === "planning" ? "active" : ""}
            onClick={() => dispatch({ type: "plan" })}
          >
            <Compass size={15} />
            <span>PLAN</span>
          </button>
          <button
            className="pause-control"
            disabled={g.stage !== "active"}
            onClick={() => dispatch({ type: "pause" })}
          >
            {g.mode === "running" ? <Pause size={16} /> : <Play size={16} />}
            <span>{g.mode === "running" ? "PAUSE" : "RESUME"}</span>
            <kbd>SPACE</kbd>
          </button>
          <div className="speeds">
            {([1, 2, 4] as const).map((value) => (
              <button
                key={value}
                className={g.speed === value ? "active" : ""}
                onClick={() => dispatch({ type: "speed", value })}
              >
                {value}×
              </button>
            ))}
          </div>
          <button title="Lưu tiến trình" onClick={manualSave}>
            <Save size={16} />
          </button>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {g.stage === "briefing" && !modal && (
        <div className="overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Hộp thoại chỉ huy"
            tabIndex={-1}
            className="dialog briefing-dialog"
          >
            <div className="dialog-eyebrow">
              <Anchor size={18} /> HQ / SECURE TRANSMISSION{" "}
              <span>NH–0{g.mission + 1}</span>
            </div>
            <span className="eyebrow amber">
              NORTHERN HORIZON · OPERATION 0{g.mission + 1}
            </span>
            <h2>{m.name}</h2>
            <p className="briefing-description">{m.description}</p>
            <div className="briefing-objectives">
              {m.goals.map((s, i) => (
                <div key={s}>
                  <span>0{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
            <div className="briefing-meta">
              <span>
                <Gauge size={16} /> {m.limit / 60} phút mô phỏng
              </span>
              <span>
                <Flag size={16} /> {m.reward} C + điểm thưởng
              </span>
              <span>
                <Shield size={16} /> {m.type}
              </span>
            </div>
            <button
              className="primary launch"
              onClick={() => dispatch({ type: "start" })}
            >
              Nhận quyền chỉ huy <ArrowRight size={17} />
            </button>
            <div className="briefing-bottom">
              <button
                className="text-button"
                onClick={() => {
                  try {
                    load();
                    notify("Đã tải tiến trình.");
                  } catch (e) {
                    notify((e as Error).message);
                  }
                }}
              >
                Tiếp tục bản lưu
              </button>
              <span>FICTIONAL WORLD · LOCAL ALPHA</span>
            </div>
          </section>
        </div>
      )}
      {g.stage === "debrief" && !modal && g.result && (
        <div className="overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Hộp thoại chỉ huy"
            tabIndex={-1}
            className="dialog debrief-dialog"
          >
            <span className="eyebrow">
              MISSION DEBRIEFING / {m.name.toUpperCase()}
            </span>
            <div className="grade">{g.result.grade}</div>
            <h2>
              {g.result.success ? "Nhiệm vụ hoàn tất." : "Trở về căn cứ."}
            </h2>
            <p>
              {g.result.success
                ? "Sở chỉ huy đã tiếp nhận báo cáo. Aurora sẵn sàng cho chặng tiếp theo."
                : "Đã hết thời gian hoặc tàu không còn đủ khả năng hoạt động. Điều chỉnh kế hoạch và triển khai lại."}
            </p>
            <div className="debrief-stats">
              <div>
                <b>
                  {g.result.score}
                  <small>/100</small>
                </b>
                <span>ĐIỂM CHỈ HUY</span>
              </div>
              <div>
                <b>+{g.result.reward}</b>
                <span>CREDITS</span>
              </div>
              <div>
                <b>{fmt(g.time)}</b>
                <span>THỜI GIAN</span>
              </div>
            </div>
            {g.result.success && g.mission === 4 ? (
              <>
                <h3>Chiến dịch Northern Horizon hoàn tất.</h3>
                <button
                  className="primary"
                  onClick={() => {
                    manualSave();
                    setModal("menu");
                  }}
                >
                  Lưu & về bộ chỉ huy
                </button>
              </>
            ) : (
              <button
                className="primary"
                onClick={() => {
                  dispatch({ type: g.result!.success ? "next" : "retry" });
                  setView("Command");
                }}
              >
                {g.result.success ? "Nhiệm vụ tiếp theo" : "Triển khai lại"}
                <ArrowRight size={16} />
              </button>
            )}
          </section>
        </div>
      )}
      {modal && (
        <div className="overlay">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Hộp thoại chỉ huy"
            tabIndex={-1}
            className="dialog"
          >
            <button
              className="close"
              aria-label="Đóng"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">DEEP COMMAND / SILENT OCEAN</span>
            <h2>
              {modal === "menu"
                ? "Bộ chỉ huy"
                : modal === "settings"
                  ? "Cài đặt"
                  : "Chỉ thị chỉ huy"}
            </h2>
            {modal === "menu" ? (
              <div className="menu-options">
                <button onClick={() => setModal(null)}>
                  <Play size={18} /> Quay lại game <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => {
                    try {
                      load();
                      setModal(null);
                      notify("Đã tải bản lưu.");
                    } catch (e) {
                      notify((e as Error).message);
                    }
                  }}
                >
                  <RotateCcw size={18} /> Tiếp tục bản lưu
                </button>
                <button onClick={manualSave}>
                  <Save size={18} /> Lưu tiến trình
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Bắt đầu chiến dịch mới? Tiến trình hiện tại chưa lưu sẽ bị thay thế.",
                      )
                    ) {
                      fresh();
                      setModal(null);
                      setView("Command");
                    }
                  }}
                >
                  <Flag size={18} /> Chiến dịch mới
                </button>
                <button onClick={exportSave}>
                  <Download size={18} /> Xuất tệp lưu JSON
                </button>
                <button onClick={() => file.current?.click()}>
                  <Upload size={18} /> Nhập tệp lưu
                </button>
              </div>
            ) : modal === "settings" ? (
              <div className="settings">
                <button onClick={() => dispatch({ type: "sound" })}>
                  <AudioLines size={20} /> Âm thanh giao diện{" "}
                  <b>{g.settings.sound ? "BẬT" : "TẮT"}</b>
                </button>
                <button onClick={() => dispatch({ type: "quality" })}>
                  <Settings size={20} /> Chất lượng 3D{" "}
                  <b>{g.settings.quality === "high" ? "CAO" : "THẤP"}</b>
                </button>
                <p>
                  Tiến trình tự động lưu mỗi 15 giây trên trình duyệt. Chế độ 3D
                  dùng mô hình dựng bằng code, chưa phải asset PBR chân thực
                  cuối cùng.
                </p>
                <p>
                  Phiên bản alpha chạy local-first; tài khoản và lưu đám mây
                  thuộc backend tùy chọn, chưa kết nối giao diện.
                </p>
              </div>
            ) : (
              <div className="help">
                <h3>{m.name}</h3>
                <p>{m.description}</p>
                <ol>
                  <li>
                    Bắt đầu nhiệm vụ. Chọn “Đến mục tiêu” để đặt hành trình.
                  </li>
                  <li>Quét sonar nhiều lần để độ tin cậy đạt 80%.</li>
                  <li>Vào Tình báo, chọn xác minh báo cáo còn hiệu lực.</li>
                  <li>
                    Space tạm dừng; PLAN để đặt waypoint và đối chiếu tin khi
                    thời gian đóng băng.
                  </li>
                  <li>
                    Xử lý sự cố tại Kỹ thuật; quản lý nhân sự và nâng cấp để giữ
                    tàu ổn định.
                  </li>
                  <li>
                    Hoàn tất cả 3 mục tiêu trước hạn để mở nhiệm vụ tiếp theo.
                  </li>
                </ol>
                <p>
                  Tọa độ GU, liên lạc, sonar và kết quả giao chiến là cơ chế
                  game hư cấu.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
      <input
        hidden
        type="file"
        accept="application/json,.json"
        ref={file}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            try {
              if (f.size > 2_000_000) throw Error("Tệp lưu quá lớn.");
              importSave(await f.text());
              setModal(null);
              notify("Đã khôi phục tệp lưu.");
            } catch (err) {
              notify((err as Error).message);
            }
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
function ContactTable({
  g,
  onSelect,
}: {
  g: State;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="contact-table">
      {g.contacts.map((c) => (
        <button key={c.id} onClick={() => onSelect(c.id)}>
          <span className="contact-id">
            <Target size={16} />
            {c.id}
          </span>
          <b>{c.name}</b>
          <span>{c.status}</span>
          <span className={c.confidence >= 80 ? "green" : "amber"}>
            {Math.round(c.confidence)}%
          </span>
          <ChevronRight size={15} />
        </button>
      ))}
    </div>
  );
}
