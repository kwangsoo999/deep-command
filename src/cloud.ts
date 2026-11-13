import { restore, serialize, type State } from "./simulation";
export type Profile = { id: string; username: string };
export type CloudSave = { state: State; revision: string };
export class CloudError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
// Tokens stay in memory only. A refresh requires signing in again.
export class CloudClient {
  private token: string | null = null;
  profile: Profile | null = null;
  readonly base: string;
  constructor(base: string) {
    this.base = base.replace(/\/+$/, "");
  }
  get configured() {
    return /^https?:\/\//.test(this.base);
  }
  private async request(path: string, options: RequestInit = {}): Promise<any> {
    if (!this.configured)
      throw new CloudError(0, "Chưa cấu hình địa chỉ backend.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(this.base + path, {
        ...options,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          this.token = null;
          this.profile = null;
        }
        const messages: Record<number, string> = {
          401: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
          409: "Bản lưu cloud đã thay đổi. Kiểm tra lại bản cloud trước khi lưu tiếp.",
          413: "Bản lưu vượt giới hạn 2 MB.",
          422: "Dữ liệu không hợp lệ. Kiểm tra tên tài khoản và mật khẩu.",
          429: "Quá nhiều lần thử. Vui lòng chờ một phút.",
        };
        throw new CloudError(
          response.status,
          messages[response.status] || "Backend gặp lỗi. Vui lòng thử lại sau.",
        );
      }
      return response.status === 204 ? null : await response.json();
    } catch (error) {
      if (error instanceof CloudError) throw error;
      throw new CloudError(
        0,
        "Không kết nối được backend. Kiểm tra địa chỉ API, CORS và kết nối mạng.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  async register(username: string, password: string) {
    try {
      await this.request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
    } catch (e) {
      if (e instanceof CloudError && e.status === 409)
        throw new CloudError(
          409,
          "Tên tài khoản đã tồn tại. Hãy đăng nhập hoặc chọn tên khác.",
        );
      throw e;
    }
  }
  async login(username: string, password: string) {
    this.token = null;
    this.profile = null;
    const result = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (typeof result.access_token !== "string")
      throw new CloudError(0, "Backend trả về phiên không hợp lệ.");
    this.token = result.access_token;
    try {
      this.profile = await this.request("/api/player/profile");
      return this.profile!;
    } catch (e) {
      this.token = null;
      this.profile = null;
      throw e;
    }
  }
  async read(): Promise<CloudSave | null> {
    let data;
    try {
      data = await this.request("/api/player/save");
    } catch (e) {
      if (e instanceof CloudError && e.status === 404) return null;
      throw e;
    }
    if (typeof data.revision !== "string")
      throw new CloudError(0, "Backend chưa hỗ trợ phiên bản cloud save này.");
    return { state: restore(JSON.stringify(data)), revision: data.revision };
  }
  async write(state: State, expectedRevision: string | null): Promise<string> {
    const data = await this.request("/api/player/save", {
      method: "PUT",
      body: JSON.stringify({
        ...JSON.parse(serialize(state)),
        expected_revision: expectedRevision,
      }),
    });
    if (typeof data.revision !== "string")
      throw new CloudError(0, "Backend không trả về phiên bản bản lưu.");
    return data.revision;
  }
  async logout() {
    try {
      if (this.token)
        await this.request("/api/auth/logout", { method: "DELETE" });
    } finally {
      this.token = null;
      this.profile = null;
    }
  }
}
export const cloudClient = new CloudClient(import.meta.env.VITE_API_URL || "");
