// Fictional game-space only. No real navigation, acoustic or weapon models.
export type ContactStatus =
  "Unknown" | "Suspected" | "Identified" | "Lost Contact" | "Archived";
export interface Contact {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  confidence: number;
  status: ContactStatus;
  hostile: boolean;
  resolved: boolean;
  phase: number;
}
export interface Report {
  id: string;
  source: string;
  time: number;
  category: string;
  confidence: number;
  region: string;
  status: string;
  expires: number;
  content: string;
}
export interface Crew {
  id: string;
  name: string;
  role: string;
  skill: number;
  fatigue: number;
  morale: number;
}
export interface Log {
  id: number;
  time: number;
  text: string;
  severity: "info" | "warning" | "success";
}
export interface Incident {
  id: string;
  title: string;
  description: string;
  cost: number;
  damage: number;
}
export interface Result {
  mission: number;
  score: number;
  grade: string;
  reward: number;
  success: boolean;
}
export interface State {
  version: 1;
  seed: number;
  time: number;
  tick: number;
  mode: "running" | "paused" | "planning";
  speed: 1 | 2 | 4;
  stage: "briefing" | "active" | "debrief";
  mission: number;
  completed: number[];
  position: { x: number; y: number };
  waypoint: { x: number; y: number } | null;
  distance: number;
  hull: number;
  power: number;
  supplies: number;
  credits: number;
  xp: number;
  research: number;
  reputation: number;
  contacts: Contact[];
  reports: Report[];
  crew: Crew[];
  logs: Log[];
  incident: Incident | null;
  upgrades: string[];
  scanCount: number;
  verified: string[];
  orders: number;
  result: Result | null;
  settings: { sound: boolean; quality: "high" | "low" };
  logSeq: number;
}
export const missions = [
  {
    name: "First Contact",
    type: "TRAINING",
    region: "ECHO BASIN",
    description:
      "Tín hiệu lạ xuất hiện tại vùng Echo. Đưa tàu tới điểm tập kết, đối chiếu tình báo và nhận dạng liên lạc. Giữ im lặng, ưu tiên xác minh.",
    goals: [
      "Đến điểm tập kết ECHO",
      "Nhận dạng ít nhất 1 liên lạc",
      "Xác minh 1 báo cáo tình báo",
    ],
    target: { x: 43, y: 54 },
    reward: 350,
    limit: 480,
  },
  {
    name: "Ghost Signal",
    type: "INTELLIGENCE",
    region: "VESPER RIDGE",
    description:
      "Một tín hiệu mất dấu liên tục tại Vesper. Thu thập nhiều lượt sonar và kiểm chứng hai nguồn tin trước khi kết luận.",
    goals: [
      "Thực hiện 3 lượt quét sonar",
      "Nhận dạng ít nhất 2 liên lạc",
      "Xác minh 2 báo cáo tình báo",
    ],
    target: { x: 63, y: 33 },
    reward: 450,
    limit: 540,
  },
  {
    name: "Lost Horizon",
    type: "RESCUE",
    region: "FROST PASSAGE",
    description:
      "Một tàu nghiên cứu mất liên lạc. Tiếp cận điểm cứu hộ, xác nhận tàu dân sự và điều phối hỗ trợ qua lệnh nhiệm vụ.",
    goals: [
      "Đến điểm cứu hộ FROST",
      "Nhận dạng liên lạc dân sự",
      "Gửi lệnh hỗ trợ cứu hộ",
    ],
    target: { x: 75, y: 67 },
    reward: 550,
    limit: 600,
  },
  {
    name: "Silent Watch",
    type: "PATROL",
    region: "VESPER RIDGE",
    description:
      "Theo dõi nhóm tàu qua hành lang Vesper. Hoàn tất hành trình, nhận dạng ba liên lạc và giữ thân tàu trên 60%.",
    goals: [
      "Đến điểm tuần tra VESPER",
      "Nhận dạng ít nhất 3 liên lạc",
      "Giữ độ bền thân tàu ≥ 60%",
    ],
    target: { x: 63, y: 33 },
    reward: 650,
    limit: 600,
  },
  {
    name: "Final Order",
    type: "COMMAND",
    region: "FROST PASSAGE",
    description:
      "Hoàn tất chiến dịch Northern Horizon. Xác minh đội hình đối phương, ban hành quyết định mô phỏng với 2 liên lạc thù địch và tới điểm rút lui.",
    goals: [
      "Nhận dạng ít nhất 3 liên lạc",
      "Xử lý 2 liên lạc thù địch đã nhận dạng",
      "Đến điểm rút lui FROST",
    ],
    target: { x: 75, y: 67 },
    reward: 900,
    limit: 720,
  },
];
export const upgrades = [
  ["sonar", "Bộ lọc tín hiệu", "+12 độ tin cậy mỗi lượt quét", 200],
  ["battery", "Pin dự phòng", "Giảm 40% tiêu hao năng lượng", 220],
  ["hull", "Gia cố thân tàu", "Sửa và tăng độ bền thêm 20", 240],
  ["automation", "Điều khiển tự động", "Tăng 30% tốc độ hành trình", 280],
  ["rest", "Khoang nghỉ", "Giảm một nửa tích lũy mệt mỏi", 180],
  ["intel", "Bộ đối chiếu dữ liệu", "Tăng chất lượng tình báo", 250],
  ["workshop", "Xưởng bảo dưỡng", "Giảm chi phí vật tư sự cố", 200],
  ["medical", "Khoang y tế", "Tăng tinh thần thủy thủ đoàn", 180],
  ["generator", "Máy phát phụ", "Hồi 30 năng lượng khi nâng cấp", 250],
  ["training", "Mô phỏng huấn luyện", "Tăng 8 kỹ năng toàn bộ kíp", 300],
] as const;
const initialContacts = (): Contact[] =>
  [
    ["C-01", "UNIDENTIFIED 01", "Destroyer", 53, 43, true],
    ["C-02", "UNIDENTIFIED 02", "Cargo Ship", 66, 62, false],
    ["C-03", "UNIDENTIFIED 03", "Submarine", 72, 27, true],
    ["C-04", "UNIDENTIFIED 04", "Aircraft Carrier", 82, 45, true],
    ["C-05", "UNIDENTIFIED 05", "Patrol Vessel", 40, 26, true],
  ].map((v, i) => ({
    id: v[0] as string,
    name: v[1] as string,
    category: v[2] as string,
    x: v[3] as number,
    y: v[4] as number,
    hostile: v[5] as boolean,
    confidence: 18 + i * 6,
    status: "Unknown",
    resolved: false,
    phase: i,
  }));
export function createState(seed = 1947): State {
  return {
    version: 1,
    seed,
    time: 0,
    tick: 0,
    mode: "paused",
    speed: 1,
    stage: "briefing",
    mission: 0,
    completed: [],
    position: { x: 29, y: 65 },
    waypoint: null,
    distance: 0,
    hull: 100,
    power: 100,
    supplies: 80,
    credits: 600,
    xp: 0,
    research: 0,
    reputation: 0,
    contacts: initialContacts(),
    reports: [
      {
        id: "INT-001",
        source: "HQ / ORION",
        time: 0,
        category: "Surface group",
        confidence: 64,
        region: "ECHO BASIN",
        status: "Unverified",
        expires: 220,
        content:
          "Nguồn ORION ghi nhận đội hình mặt nước phía đông Echo. Chưa xác định ý định; yêu cầu đối chiếu sonar.",
      },
      {
        id: "INT-002",
        source: "RELAY / KESTREL",
        time: 0,
        category: "Civilian",
        confidence: 77,
        region: "FROST PASSAGE",
        status: "Unverified",
        expires: 300,
        content:
          "Tàu nghiên cứu dân sự phát tín hiệu gần Frost. Tránh áp dụng lệnh giao chiến với liên lạc dân sự.",
      },
    ],
    crew: [
      "Command",
      "Navigation",
      "Sonar",
      "Engineering",
      "Intelligence",
      "Medical",
    ].map((role, i) => ({
      id: "crew-" + i,
      name: [
        "An Nguyễn",
        "Linh Trần",
        "Minh Phạm",
        "Hải Lê",
        "Vy Đỗ",
        "Khánh Vũ",
      ][i],
      role,
      skill: 72 + i * 3,
      fatigue: 8 + i * 2,
      morale: 90,
    })),
    logs: [
      {
        id: 1,
        time: 0,
        text: "DCS AURORA • Sẵn sàng nhận lệnh chỉ huy.",
        severity: "info",
      },
    ],
    incident: null,
    upgrades: [],
    scanCount: 0,
    verified: [],
    orders: 0,
    result: null,
    settings: { sound: false, quality: "high" },
    logSeq: 1,
  };
}
export function log(
  s: State,
  text: string,
  severity: Log["severity"] = "info",
) {
  s.logs.push({ id: ++s.logSeq, time: s.time, text, severity });
  s.logs = s.logs.slice(-100);
}
function random(s: State) {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
export function goals(s: State): boolean[] {
  const id = s.contacts.filter((c) => c.confidence >= 80);
  const arrived =
    Math.hypot(
      s.position.x - missions[s.mission].target.x,
      s.position.y - missions[s.mission].target.y,
    ) < 4;
  switch (s.mission) {
    case 0:
      return [arrived, id.length >= 1, s.verified.length >= 1];
    case 1:
      return [s.scanCount >= 3, id.length >= 2, s.verified.length >= 2];
    case 2:
      return [arrived, id.some((c) => !c.hostile), s.orders >= 1];
    case 3:
      return [arrived, id.length >= 3, s.hull >= 60];
    default:
      return [
        id.length >= 3,
        s.contacts.filter((c) => c.hostile && c.resolved).length >= 2,
        arrived,
      ];
  }
}
export function finish(s: State, success: boolean) {
  const m = missions[s.mission];
  const objective = (goals(s).filter(Boolean).length / 3) * 40;
  const intel = Math.min(20, s.verified.length * 10);
  const condition = s.hull * 0.15;
  const crew =
    (s.crew.reduce((a, c) => a + (c.morale - c.fatigue * 0.3), 0) /
      s.crew.length) *
    0.15;
  const efficiency = Math.max(0, 10 * (1 - s.time / m.limit));
  const score = success
    ? Math.round(objective + intel + condition + crew + efficiency)
    : Math.min(49, Math.round(objective + condition));
  const reward = success ? m.reward + score : 0;
  s.result = {
    mission: s.mission,
    score,
    grade: !success
      ? "Failed"
      : score >= 90
        ? "S"
        : score >= 75
          ? "A"
          : score >= 60
            ? "B"
            : "C",
    reward,
    success,
  };
  s.stage = "debrief";
  s.mode = "paused";
  if (success && !s.completed.includes(s.mission)) {
    s.completed.push(s.mission);
    s.credits += reward;
    s.xp += score * 10;
    s.research += 25;
    s.reputation += 10;
  }
  log(
    s,
    success
      ? "Nhiệm vụ hoàn tất. Điện văn kết quả đã gửi sở chỉ huy."
      : "Nhiệm vụ thất bại. Tàu được lệnh quay về căn cứ.",
    success ? "success" : "warning",
  );
}
// Fixed simulation step: one fictional second, called only by SimulationClock.
export function step(s: State) {
  if (s.mode !== "running" || s.stage !== "active") return;
  s.time++;
  s.tick++;
  if (s.waypoint) {
    const dx = s.waypoint.x - s.position.x,
      dy = s.waypoint.y - s.position.y,
      d = Math.hypot(dx, dy),
      v = 0.22 * (s.upgrades.includes("automation") ? 1.3 : 1);
    if (d <= v) {
      s.position = { ...s.waypoint };
      s.waypoint = null;
      log(s, "Navigation • Đã tới waypoint.", "success");
    } else {
      s.position.x += (dx / d) * v;
      s.position.y += (dy / d) * v;
      s.distance += v;
    }
  }
  s.power = Math.max(
    0,
    s.power - (s.upgrades.includes("battery") ? 0.012 : 0.02),
  );
  s.crew.forEach(
    (c) =>
      (c.fatigue = Math.min(
        100,
        c.fatigue + (s.upgrades.includes("rest") ? 0.007 : 0.014),
      )),
  );
  s.contacts.forEach((c) => {
    if (c.resolved) return;
    c.x = Math.max(
      8,
      Math.min(93, c.x + Math.sin(s.time * 0.01 + c.phase) * 0.012),
    );
    if (s.time % 30 === 0 && c.confidence > 20) {
      c.confidence = Math.max(0, c.confidence - 1);
      if (c.confidence < 80 && c.status === "Identified")
        c.status = "Suspected";
    }
  });
  s.reports.forEach((r) => {
    if (r.expires < s.time && r.status === "Unverified") r.status = "Expired";
  });
  if (s.time % 65 === 0) {
    const c = s.contacts[Math.floor(random(s) * s.contacts.length)];
    s.reports.push({
      id: "INT-" + (s.tick + 100),
      source: "SONAR / LIMA",
      time: s.time,
      category: c.category,
      confidence: Math.round(45 + random(s) * 35),
      region: missions[s.mission].region,
      status: "Unverified",
      expires: s.time + 180,
      content: `Tín hiệu liên quan ${c.id}. Phân loại sơ bộ ${c.category}; nguồn độc lập chưa xác nhận.`,
    });
    log(s, "Intelligence • Nhận báo cáo tình báo mới.");
  }
  if (s.time % 95 === 0 && !s.incident) {
    const n = Math.floor(random(s) * 8);
    const names = [
      "Sụt áp bộ nguồn",
      "Hỏng bộ lọc sonar",
      "Mất liên lạc relay",
      "Mệt mỏi kíp trực",
      "Lỗi dữ liệu hành trình",
      "Cảnh báo bơm làm mát",
      "Sự cố y tế",
      "Xung đột tình báo",
    ];
    s.incident = {
      id: "EV-" + s.tick,
      title: names[n],
      description:
        "Bộ phận chuyên trách yêu cầu phân bổ vật tư. Xử lý để tránh tổn thất thân tàu theo thời gian.",
      cost: s.upgrades.includes("workshop") ? 6 : 10,
      damage: 2,
    };
    log(s, "CẢNH BÁO • " + names[n], "warning");
  }
  if (s.incident && s.time % 10 === 0)
    s.hull = Math.max(0, s.hull - s.incident.damage);
  if (s.power <= 0 || s.hull <= 0 || s.time >= missions[s.mission].limit) {
    finish(s, false);
    return;
  }
  if (goals(s).every(Boolean)) finish(s, true);
}
export type Action =
  | { type: "start" }
  | { type: "pause" }
  | { type: "plan" }
  | { type: "speed"; value: 1 | 2 | 4 }
  | { type: "waypoint"; x: number; y: number }
  | { type: "scan" }
  | { type: "verify"; id: string }
  | { type: "resolve" }
  | { type: "order"; id?: string }
  | { type: "train"; id: string }
  | { type: "rest"; id: string }
  | { type: "upgrade"; id: string }
  | { type: "repair" }
  | { type: "next" }
  | { type: "retry" }
  | { type: "sound" }
  | { type: "quality" };
export function act(s: State, a: Action) {
  if (a.type === "sound") {
    s.settings.sound = !s.settings.sound;
    return;
  }
  if (a.type === "quality") {
    s.settings.quality = s.settings.quality === "high" ? "low" : "high";
    return;
  }
  if (a.type === "next" || a.type === "retry") {
    if (a.type === "next" && (!s.result?.success || s.mission >= 4)) return;
    const n = createState(s.seed);
    Object.assign(n, {
      mission: a.type === "next" ? s.mission + 1 : s.mission,
      completed: s.completed,
      credits: s.credits,
      xp: s.xp,
      research: s.research,
      reputation: s.reputation,
      upgrades: s.upgrades,
      settings: s.settings,
      crew: s.crew.map((c) => ({ ...c, fatigue: 10 })),
      hull: Math.max(s.hull, 80),
      power: 100,
      supplies: Math.max(s.supplies, 60),
    });
    Object.assign(s, n);
    return;
  }
  if (a.type === "start") {
    if (s.stage === "briefing") {
      s.stage = "active";
      s.mode = "running";
      log(s, "HQ • Nhiệm vụ " + missions[s.mission].name + " bắt đầu.");
    }
    return;
  }
  if (a.type === "pause") {
    if (s.stage === "active")
      s.mode = s.mode === "running" ? "paused" : "running";
    return;
  }
  if (a.type === "plan") {
    if (s.stage === "active")
      s.mode = s.mode === "planning" ? "running" : "planning";
    return;
  }
  if (a.type === "speed") {
    s.speed = a.value;
    return;
  }
  if (a.type === "upgrade") {
    const u = upgrades.find((u) => u[0] === a.id);
    if (!u || s.upgrades.includes(a.id) || s.credits < u[3]) return;
    s.credits -= u[3];
    s.upgrades.push(a.id);
    if (a.id === "hull") s.hull = Math.min(100, s.hull + 20);
    if (a.id === "generator") s.power = Math.min(100, s.power + 30);
    if (a.id === "training")
      s.crew.forEach((c) => (c.skill = Math.min(100, c.skill + 8)));
    if (a.id === "medical")
      s.crew.forEach((c) => (c.morale = Math.min(100, c.morale + 8)));
    log(s, "Fleet • Đã lắp " + u[1], "success");
    return;
  }
  if (a.type === "repair") {
    if (s.credits < 100 || s.hull >= 100) return;
    s.credits -= 100;
    s.hull = 100;
    log(s, "Engineering • Đã bảo dưỡng thân tàu.", "success");
    return;
  }
  if (a.type === "train" || a.type === "rest") {
    const c = s.crew.find((c) => c.id === a.id);
    const cost = a.type === "train" ? 75 : 30;
    if (!c || s.credits < cost) return;
    s.credits -= cost;
    if (a.type === "train") c.skill = Math.min(100, c.skill + 5);
    else {
      c.fatigue = Math.max(0, c.fatigue - 25);
      c.morale = Math.min(100, c.morale + 5);
    }
    log(
      s,
      `Crew • ${c.name}: ${a.type === "train" ? "hoàn tất huấn luyện" : "đã nghỉ ngơi"}.`,
    );
    return;
  }
  if (s.stage !== "active") return;
  if (a.type === "waypoint") {
    s.waypoint = {
      x: Math.max(0, Math.min(100, a.x)),
      y: Math.max(0, Math.min(100, a.y)),
    };
    log(s, `Navigation • Waypoint ${Math.round(a.x)} / ${Math.round(a.y)}.`);
  }
  if (a.type === "scan") {
    if (s.mode !== "running") {
      log(s, "Sonar • Tiếp tục thời gian để thực hiện quét.", "warning");
      return;
    }
    if (s.power < 3) {
      log(s, "Sonar • Không đủ năng lượng.", "warning");
      return;
    }
    s.power -= 3;
    s.scanCount++;
    const operator = s.crew.find((c) => c.role === "Sonar")!;
    const crewBonus = Math.max(
      -5,
      Math.floor(operator.skill * 0.06 - operator.fatigue * 0.08),
    );
    s.contacts.forEach((c) => {
      if (c.resolved) return;
      c.confidence = Math.min(
        100,
        c.confidence +
          20 +
          crewBonus +
          (s.upgrades.includes("sonar") ? 12 : 0) +
          Math.floor(random(s) * 9),
      );
      c.status = c.confidence >= 80 ? "Identified" : "Suspected";
      if (c.status === "Identified") c.name = c.category.toUpperCase();
    });
    log(
      s,
      `Sonar • Lượt quét ${s.scanCount} hoàn tất. Cập nhật 5 liên lạc.`,
      "success",
    );
  }
  if (a.type === "verify") {
    const r = s.reports.find((r) => r.id === a.id);
    if (!r || r.status !== "Unverified") return;
    r.status = "Verified";
    r.confidence = Math.min(
      100,
      r.confidence + 15 + (s.upgrades.includes("intel") ? 10 : 0),
    );
    s.verified.push(r.id);
    log(s, `Intelligence • Đã đối chiếu ${r.id}.`, "success");
  }
  if (a.type === "resolve" && s.incident) {
    if (s.supplies < s.incident.cost) {
      log(s, "Engineering • Thiếu vật tư xử lý.", "warning");
      return;
    }
    s.supplies -= s.incident.cost;
    log(s, "Engineering • Đã xử lý " + s.incident.title, "success");
    s.incident = null;
  }
  if (a.type === "order") {
    if (s.mode !== "running") {
      log(s, "Command • Tiếp tục thời gian để ban hành lệnh.", "warning");
      return;
    }
    if (s.mission === 2) {
      if (!goals(s)[0] || !goals(s)[1]) {
        log(s, "Command • Cần tiếp cận và nhận dạng tàu dân sự.", "warning");
        return;
      }
      s.orders++;
      log(s, "Command • Đã điều phối cứu hộ dân sự.", "success");
    } else {
      const c = s.contacts.find((c) => c.id === a.id);
      if (!c || c.confidence < 80 || c.resolved) {
        log(s, "Command • Chỉ xử lý liên lạc đã nhận dạng.", "warning");
        return;
      }
      if (!c.hostile) {
        log(
          s,
          "Command • Không cho phép giao chiến với tàu dân sự.",
          "warning",
        );
        return;
      }
      if (s.power < 8) {
        log(s, "Command • Cần 8 năng lượng cho lệnh mô phỏng.", "warning");
        return;
      }
      s.power -= 8;
      c.resolved = true;
      c.status = "Archived";
      s.orders++;
      log(
        s,
        `Command • ${c.id} đã được xử lý bằng cơ chế game trừu tượng.`,
        "success",
      );
    }
  }
}
export class SimulationClock {
  private accumulator = 0;
  advance(state: State, seconds: number) {
    if (state.mode !== "running" || state.stage !== "active") {
      this.accumulator = 0;
      return;
    }
    this.accumulator += Math.max(0, Math.min(seconds, 0.5)) * state.speed;
    while (this.accumulator >= 1) {
      step(state);
      this.accumulator -= 1;
      if (state.stage !== "active") {
        this.accumulator = 0;
        break;
      }
    }
  }
  reset() {
    this.accumulator = 0;
  }
}
export function serialize(s: State) {
  return JSON.stringify({ schema: "deep-command-v1", state: s });
}
export function restore(raw: string): State {
  const data = JSON.parse(raw),
    s = data?.state;
  const fail = () => {
    throw Error("Tệp lưu không hợp lệ hoặc khác phiên bản.");
  };
  const finite = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const str = (v: unknown) => typeof v === "string" && v.length < 5000;
  if (
    data?.schema !== "deep-command-v1" ||
    !s ||
    s.version !== 1 ||
    !Number.isInteger(s.mission) ||
    !finite(s.mission, 0, 4) ||
    !["briefing", "active", "debrief"].includes(s.stage) ||
    ![1, 2, 4].includes(s.speed)
  )
    fail();
  for (const k of [
    "seed",
    "time",
    "tick",
    "distance",
    "credits",
    "xp",
    "research",
    "reputation",
    "scanCount",
    "orders",
    "logSeq",
  ])
    if (!finite(s[k])) fail();
  for (const k of ["hull", "power", "supplies"])
    if (!finite(s[k], 0, 100)) fail();
  const point = (p: any) => p && finite(p.x, 0, 100) && finite(p.y, 0, 100);
  if (!point(s.position) || (s.waypoint !== null && !point(s.waypoint))) fail();
  if (
    !s.settings ||
    typeof s.settings.sound !== "boolean" ||
    !["high", "low"].includes(s.settings.quality)
  )
    fail();
  if (
    !Array.isArray(s.contacts) ||
    s.contacts.length !== 5 ||
    !s.contacts.every(
      (c: any) =>
        str(c.id) &&
        str(c.name) &&
        str(c.category) &&
        point(c) &&
        finite(c.confidence, 0, 100) &&
        [
          "Unknown",
          "Suspected",
          "Identified",
          "Lost Contact",
          "Archived",
        ].includes(c.status) &&
        typeof c.hostile === "boolean" &&
        typeof c.resolved === "boolean" &&
        finite(c.phase),
    )
  )
    fail();
  if (
    new Set(s.contacts.map((c: any) => c.id)).size !== 5 ||
    !initialContacts().every((c) =>
      s.contacts.some((saved: any) => saved.id === c.id),
    )
  )
    fail();
  if (
    !Array.isArray(s.crew) ||
    s.crew.length !== 6 ||
    !s.crew.every(
      (c: any) =>
        str(c.id) &&
        str(c.name) &&
        str(c.role) &&
        finite(c.skill, 0, 100) &&
        finite(c.fatigue, 0, 100) &&
        finite(c.morale, 0, 100),
    )
  )
    fail();
  const expectedCrew = createState().crew;
  if (
    !expectedCrew.every(
      (c) =>
        s.crew.filter(
          (saved: any) => saved.id === c.id && saved.role === c.role,
        ).length === 1,
    )
  )
    fail();
  if (
    !Array.isArray(s.reports) ||
    s.reports.length > 500 ||
    !s.reports.every(
      (r: any) =>
        ["id", "source", "category", "region", "content"].every((k) =>
          str(r[k]),
        ) &&
        finite(r.time) &&
        finite(r.expires) &&
        finite(r.confidence, 0, 100) &&
        ["Unverified", "Verified", "Expired"].includes(r.status),
    )
  )
    fail();
  if (
    !Array.isArray(s.logs) ||
    s.logs.length > 100 ||
    !s.logs.every(
      (l: any) =>
        finite(l.id) &&
        finite(l.time) &&
        str(l.text) &&
        ["info", "warning", "success"].includes(l.severity),
    )
  )
    fail();
  if (
    !Array.isArray(s.completed) ||
    !s.completed.every((v: any) => Number.isInteger(v) && finite(v, 0, 4)) ||
    !Array.isArray(s.verified) ||
    !s.verified.every(str) ||
    !Array.isArray(s.upgrades) ||
    !s.upgrades.every((id: any) => upgrades.some((u) => u[0] === id))
  )
    fail();
  if (
    s.incident !== null &&
    (!s.incident ||
      !str(s.incident.id) ||
      !str(s.incident.title) ||
      !str(s.incident.description) ||
      !finite(s.incident.cost, 0, 100) ||
      !finite(s.incident.damage, 0, 100))
  )
    fail();
  if (
    s.stage === "debrief" &&
    (!s.result ||
      typeof s.result.success !== "boolean" ||
      !finite(s.result.score, 0, 100) ||
      !finite(s.result.reward) ||
      !str(s.result.grade))
  )
    fail();
  return { ...s, mode: "paused" };
}
