import { useGame } from "./store";
export default function IncidentPanel() {
  const { game: g, dispatch } = useGame();
  const incident = g.incident;
  if (!incident) return null;
  const engineer = g.crew.find((c) => c.role === "Engineering")!;
  return (
    <div className="incident">
      <h3>{incident.title}</h3>
      <p>{incident.description}</p>
      {incident.response ? (
        <p role="status">
          Kíp kỹ thuật đang xử lý · còn {incident.response.remaining} giây game.
          Pause/Plan sẽ dừng bộ đếm.
        </p>
      ) : (
        <>
          <div className="incident-choices">
            <button
              disabled={g.supplies < incident.cost}
              onClick={() => dispatch({ type: "resolve" })}
            >
              Xử lý tiêu chuẩn · {incident.cost} vật tư
            </button>
            <button
              disabled={engineer.fatigue > 85}
              onClick={() => dispatch({ type: "resolve", choice: "crew" })}
            >
              Giao kíp kỹ thuật · +15 mệt mỏi
            </button>
            <button
              disabled={g.power < 8}
              onClick={() => dispatch({ type: "resolve", choice: "stabilize" })}
            >
              Ổn định khẩn · −8 PWR / −3 HULL
            </button>
          </div>
          <p className="incident-hint">
            Kíp kỹ thuật cần 8–14 giây game; sự cố vẫn gây hư hại trong lúc chờ.
            Ổn định khẩn cấp tổn thất ngay 3% thân tàu.
          </p>
        </>
      )}
    </div>
  );
}
