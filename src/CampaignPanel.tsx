import { useState } from "react";
import { Award, Check, Lock, Flag, ArrowRight } from "lucide-react";
import { useGame } from "./store";
import { missions } from "./simulation";
import { commandRank, missionUnlocked, technologies } from "./career";
export default function CampaignPanel({
  onDeploy,
  onStation,
}: {
  onDeploy: () => void;
  onStation: (station: string) => void;
}) {
  const { game: g, dispatch, checkpoint } = useGame();
  const [selected, setSelected] = useState<number | null>(null),
    [error, setError] = useState("");
  const rank = commandRank(g.xp);
  const launch = (index: number) => {
    try {
      checkpoint();
      dispatch({ type: "deploy", mission: index });
      onDeploy();
    } catch {
      setError(
        "Không thể tạo điểm dự phòng. Hãy xuất JSON trước khi đổi nhiệm vụ.",
      );
    }
  };
  return (
    <div className="campaign-hq">
      <div className="career-heading">
        <Award size={32} />
        <div>
          <span className="eyebrow">HỒ SƠ CHỈ HUY</span>
          <h3>{rank.name}</h3>
          <p>
            {g.xp} XP ·{" "}
            {rank.next
              ? `Còn ${rank.remaining} XP tới ${rank.next}`
              : "Đã đạt cấp bậc cao nhất"}
          </p>
        </div>
      </div>
      <div className="track rank-track">
        <i style={{ width: rank.progress + "%" }} />
      </div>
      <div className="hq-stats">
        <div>
          <b>{g.completed.length}/5</b>
          <span>NHIỆM VỤ</span>
        </div>
        <div>
          <b>{g.credits}</b>
          <span>CREDITS</span>
        </div>
        <div>
          <b>{g.research}</b>
          <span>RESEARCH</span>
        </div>
        <div>
          <b>{g.career.attempts}</b>
          <span>LƯỢT KẾT THÚC</span>
        </div>
      </div>
      {g.completed.length === 5 && (
        <div className="campaign-complete">
          <Award size={24} />
          <h3>Northern Horizon hoàn tất</h3>
          <p>
            Bạn có thể chơi lại để cải thiện thành tích. Phần thưởng nhiệm vụ
            chỉ cấp một lần.
          </p>
        </div>
      )}
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      <h3>Chọn nhiệm vụ</h3>
      <p className="hq-note">
        Đổi nhiệm vụ sẽ quay về briefing. Tiến trình hiện tại được giữ trong một
        điểm dự phòng local.
      </p>
      <div className="mission-roster">
        {missions.map((m, i) => {
          const unlocked = missionUnlocked(g.completed, i),
            best = g.career.best.find((r) => r.mission === i);
          return (
            <article key={m.name}>
              <span className="mission-number">0{i + 1}</span>
              <div>
                <h3>{m.name}</h3>
                <p>
                  {m.type} ·{" "}
                  {g.completed.includes(i)
                    ? "Đã hoàn thành"
                    : "Thưởng " + m.reward + " C"}
                </p>
                {best && (
                  <small>
                    Tốt nhất: {best.grade} · {best.score}/100 · {best.time}s
                  </small>
                )}
              </div>
              <button
                disabled={!unlocked}
                onClick={() => {
                  setSelected(i);
                  setError("");
                }}
              >
                {!unlocked ? (
                  <>
                    <Lock size={13} />
                    Khóa
                  </>
                ) : g.completed.includes(i) ? (
                  <>
                    <Check size={13} />
                    Chơi lại
                  </>
                ) : (
                  <>
                    <Flag size={13} />
                    Chọn
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
      {selected !== null && (
        <div className="cloud-confirm">
          <h3>Triển khai {missions[selected].name}?</h3>
          <p>
            Hành trình hiện tại sẽ kết thúc. Căn cứ hỗ trợ tối thiểu 80% thân
            tàu, 60 năng lượng/vật tư và kíp mới; tiếp tế thêm để xuất phát tốt
            hơn. Không nhận thưởng lặp nếu đã hoàn thành.
          </p>
          <div>
            <button className="primary" onClick={() => launch(selected)}>
              Xác nhận triển khai <ArrowRight size={14} />
            </button>
            <button onClick={() => setSelected(null)}>Hủy</button>
          </div>
        </div>
      )}
      <h3>Chuẩn bị & tiếp tế</h3>
      <div className="hq-services">
        <button onClick={() => onStation("Fleet")}>Nâng cấp hạm đội</button>
        <button onClick={() => onStation("Crew")}>Chuẩn bị thủy thủ</button>
        <button onClick={() => onStation("Engineering")}>
          Kiểm tra kỹ thuật
        </button>
      </div>
      <p className="hq-note">
        {g.stage === "active"
          ? "Tạm dừng không đưa tàu về căn cứ. Tiếp tế/nghiên cứu chỉ thực hiện ở briefing/debrief."
          : "Dùng credits/research trước khi bắt đầu nhiệm vụ. Không trừ chi phí khi nguồn lực đã đầy."}
      </p>
      <div className="hq-services">
        <button
          disabled={g.stage === "active" || g.credits < 120 || g.power >= 100}
          onClick={() => dispatch({ type: "resupply", resource: "power" })}
        >
          +25 năng lượng · 120 C
        </button>
        <button
          disabled={g.stage === "active" || g.credits < 80 || g.supplies >= 100}
          onClick={() => dispatch({ type: "resupply", resource: "supplies" })}
        >
          +20 vật tư · 80 C
        </button>
        <button
          disabled={g.stage === "active" || g.credits < 100 || g.hull >= 100}
          onClick={() => dispatch({ type: "repair" })}
        >
          Sửa thân tàu · 100 C
        </button>
      </div>
      <div className="research-list">
        {technologies.map((t) => (
          <article key={t.id}>
            <div>
              <h3>{t.name}</h3>
              <p>{t.description}</p>
            </div>
            <button
              disabled={
                g.stage === "active" ||
                g.research < t.cost ||
                g.career.research.includes(t.id)
              }
              onClick={() => dispatch({ type: "research", id: t.id })}
            >
              {g.career.research.includes(t.id)
                ? "Đã nghiên cứu"
                : `${t.cost} RP`}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
