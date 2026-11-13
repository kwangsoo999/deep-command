import { useEffect, useState } from "react";
import {
  Cloud,
  Download,
  RefreshCw,
  Save,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cloudClient, CloudClient, CloudError, type CloudSave } from "./cloud";
import { useGame } from "./store";
import { missions, serialize } from "./simulation";
export default function AccountPanel({
  client = cloudClient,
  onRestore,
}: {
  client?: CloudClient;
  onRestore?: () => void;
}) {
  const [profile, setProfile] = useState(client.profile);
  const [register, setRegister] = useState(false),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState("");
  const [remote, setRemote] = useState<CloudSave | null | undefined>();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<"upload" | "download" | null>(null);
  const importSave = useGame((s) => s.importSave);
  async function run(job: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await job();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof CloudError && e.status === 401) {
        setProfile(null);
        setRemote(undefined);
      }
      if (e instanceof CloudError && e.status === 409) setRemote(undefined);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }
  useEffect(() => {
    if (!client.profile) return;
    let cancelled = false;
    setBusy(true);
    client
      .read()
      .then((value) => {
        if (!cancelled) setRemote(value);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setProfile(client.profile);
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);
  if (!client.configured)
    return (
      <div className="account-panel">
        <Cloud size={32} />
        <h3>Chơi local luôn sẵn sàng.</h3>
        <p>
          Cloud save cần backend của bạn đang chạy. Đặt{" "}
          <code>VITE_API_URL</code> trong tệp <code>.env</code>, ví dụ{" "}
          <code>http://localhost:8000</code>, rồi khởi động lại hoặc build lại
          frontend.
        </p>
        <p>
          Xem README để chạy API. Tiến trình hiện tại vẫn lưu trên trình duyệt;
          không có dữ liệu được gửi lên máy chủ.
        </p>
      </div>
    );
  return (
    <div className="account-panel" aria-busy={busy}>
      <div className="account-caption">
        <ShieldCheck size={17} />
        <span>
          BACKEND CỦA BẠN · {profile ? "ĐÃ ĐĂNG NHẬP" : "CHƯA ĐĂNG NHẬP"}
        </span>
      </div>
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="account-success" role="status">
          {message}
        </p>
      )}
      {!profile ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (register) await client.register(username, password);
              const p = await client.login(username, password);
              setProfile(p);
              setPassword("");
              setRemote(await client.read());
              setMessage(
                "Đăng nhập thành công. Cloud chỉ đồng bộ khi bạn chọn lưu hoặc tải.",
              );
            });
          }}
        >
          <label htmlFor="account-username">Tên tài khoản</label>
          <input
            id="account-username"
            autoComplete="username"
            minLength={3}
            maxLength={40}
            pattern="[a-zA-Z0-9_-]+"
            required
            value={username}
            disabled={busy}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="account-password">
            Mật khẩu · tối thiểu 10 ký tự
          </label>
          <input
            id="account-password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={10}
            maxLength={128}
            required
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="primary" disabled={busy} type="submit">
            {busy
              ? "Đang kết nối…"
              : register
                ? "Tạo tài khoản & đăng nhập"
                : "Đăng nhập"}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => {
              setRegister((v) => !v);
              setError("");
            }}
          >
            {register
              ? "Đã có tài khoản? Đăng nhập"
              : "Chưa có tài khoản? Đăng ký"}
          </button>
          <p>
            Phiên đăng nhập chỉ giữ trong bộ nhớ, không lưu mật khẩu hoặc token
            vào tệp lưu/trình duyệt. Mở lại trang cần đăng nhập lại.
          </p>
        </form>
      ) : (
        <>
          <div className="cloud-profile">
            <b>{profile.username}</b>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  try {
                    await client.logout();
                  } finally {
                    setProfile(null);
                    setRemote(undefined);
                  }
                  setMessage("Đã đăng xuất và thu hồi phiên.");
                })
              }
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
          <div className="cloud-summary">
            <span className="eyebrow">CLOUD SAVE / 01 SLOT</span>
            {remote === undefined ? (
              <p>Chưa kiểm tra bản cloud. Hãy kiểm tra trước khi lưu.</p>
            ) : remote === null ? (
              <p>Chưa có bản lưu cloud cho tài khoản này.</p>
            ) : (
              <>
                <h3>{missions[remote.state.mission].name}</h3>
                <p>
                  {remote.state.completed.length}/5 nhiệm vụ ·{" "}
                  {Math.floor(remote.state.time)} giây game
                </p>
                <time>{new Date(remote.revision).toLocaleString("vi-VN")}</time>
              </>
            )}
          </div>
          <div className="cloud-actions">
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  setRemote(await client.read());
                  setMessage(
                    "Đã cập nhật thông tin cloud. Tiến trình local không thay đổi.",
                  );
                })
              }
            >
              <RefreshCw size={15} />
              Kiểm tra cloud
            </button>
            <button
              disabled={busy || remote === undefined}
              onClick={() => setConfirm("upload")}
            >
              <Save size={15} />
              Lưu lên cloud
            </button>
            <button
              disabled={busy || !remote}
              onClick={() => setConfirm("download")}
            >
              <Download size={15} />
              Tải về game
            </button>
          </div>
          {confirm && (
            <div className="cloud-confirm">
              <h3>
                {confirm === "upload"
                  ? "Xác nhận lưu lên cloud?"
                  : "Thay tiến trình hiện tại bằng bản cloud?"}
              </h3>
              <p>
                {confirm === "upload"
                  ? "Bản game hiện tại sẽ thay bản cloud đã kiểm tra. Hệ thống sẽ chặn nếu có thiết bị khác vừa cập nhật."
                  : "Game sẽ khôi phục ở trạng thái tạm dừng. Một bản dự phòng tiến trình hiện tại được giữ trên trình duyệt."}
              </p>
              <div>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      if (confirm === "upload") {
                        const state = structuredClone(useGame.getState().game);
                        const revision = await client.write(
                          state,
                          remote?.revision ?? null,
                        );
                        setRemote({ state, revision });
                        setMessage("Đã lưu tiến trình lên cloud.");
                      } else {
                        const latest = await client.read();
                        if (!latest)
                          throw Error(
                            "Bản cloud không còn tồn tại. Hãy kiểm tra lại.",
                          );
                        importSave(serialize(latest.state));
                        onRestore?.();
                        setRemote(latest);
                        setMessage(
                          "Đã tải bản cloud. Game đang tạm dừng; bản local cũ đã được dự phòng.",
                        );
                      }
                    })
                  }
                >
                  {busy ? "Đang xử lý…" : "Xác nhận"}
                </button>
                <button disabled={busy} onClick={() => setConfirm(null)}>
                  Hủy
                </button>
              </div>
            </div>
          )}
          {busy && <p role="status">Đang liên lạc backend…</p>}
          <p className="cloud-note">
            Cloud save do backend bạn cấu hình lưu giữ. Autosave 15 giây chỉ lưu
            local. Tải cloud không tự tiếp tục thời gian game.
          </p>
        </>
      )}
    </div>
  );
}
