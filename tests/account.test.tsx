// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import AccountPanel from "../src/AccountPanel";
import { CloudClient, CloudError } from "../src/cloud";
import { useGame } from "../src/store";
import { createState, serialize } from "../src/simulation";
beforeEach(() => {
  localStorage.clear();
  useGame.getState().fresh();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const ready = () => {
  const client = new CloudClient("http://localhost:8000");
  client.profile = { id: "u", username: "captain" };
  return client;
};
const rev = "2026-11-13T10:00:00.000000+00:00";
describe("Account and cloud save UI", () => {
  it("keeps local play available when backend is not configured", () => {
    render(<AccountPanel client={new CloudClient("")} />);
    expect(screen.getByText("Chơi local luôn sẵn sàng.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Đăng nhập" })).toBeNull();
  });
  it("signs in from form and reads the existing cloud slot", async () => {
    const c = new CloudClient("http://localhost:8000");
    const login = vi
      .spyOn(c, "login")
      .mockResolvedValue({ id: "u", username: "captain" });
    vi.spyOn(c, "read").mockResolvedValue(null);
    render(<AccountPanel client={c} />);
    fireEvent.change(screen.getByLabelText("Tên tài khoản"), {
      target: { value: "captain" },
    });
    fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
      target: { value: "strong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await screen.findByText("captain");
    expect(login).toHaveBeenCalledWith("captain", "strong-password");
    expect(
      screen.getByText("Chưa có bản lưu cloud cho tài khoản này."),
    ).toBeTruthy();
  });
  it("requires confirmation before upload and sends the checked revision", async () => {
    const c = ready();
    vi.spyOn(c, "read").mockResolvedValue({
      state: createState(),
      revision: rev,
    });
    const write = vi
      .spyOn(c, "write")
      .mockResolvedValue("2026-11-13T10:01:00.000000+00:00");
    render(<AccountPanel client={c} />);
    await screen.findByText("First Contact");
    fireEvent.click(screen.getByRole("button", { name: "Lưu lên cloud" }));
    expect(write).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await screen.findByText("Đã lưu tiến trình lên cloud.");
    expect(write.mock.calls[0][1]).toBe(rev);
  });
  it("blocks upload after a conflict until the latest cloud slot is checked", async () => {
    const c = ready();
    vi.spyOn(c, "read").mockResolvedValue({
      state: createState(),
      revision: rev,
    });
    vi.spyOn(c, "write").mockRejectedValue(
      new CloudError(409, "Bản lưu cloud đã thay đổi."),
    );
    render(<AccountPanel client={c} />);
    await screen.findByText("First Contact");
    fireEvent.click(screen.getByRole("button", { name: "Lưu lên cloud" }));
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await screen.findByRole("alert");
    expect(
      (
        screen.getByRole("button", {
          name: "Lưu lên cloud",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(useGame.getState().game.mission).toBe(0);
  });
  it("downloads only after confirmation and preserves recoverable local progress", async () => {
    const c = ready();
    const cloud = createState();
    cloud.mission = 1;
    cloud.stage = "active";
    cloud.mode = "running";
    vi.spyOn(c, "read").mockResolvedValue({ state: cloud, revision: rev });
    render(<AccountPanel client={c} />);
    await screen.findByText("Ghost Signal");
    fireEvent.click(screen.getByRole("button", { name: "Tải về game" }));
    expect(useGame.getState().game.mission).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await screen.findByText(/Đã tải bản cloud/);
    expect(useGame.getState().game.mission).toBe(1);
    expect(useGame.getState().game.mode).toBe("paused");
    useGame.getState().restoreBackup();
    expect(useGame.getState().game.mission).toBe(0);
  });
  it("does not replace active game when saving the imported data fails", () => {
    const cloud = createState();
    cloud.mission = 2;
    const before = serialize(useGame.getState().game);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("quota");
    });
    expect(() => useGame.getState().importSave(serialize(cloud))).toThrow(
      "quota",
    );
    expect(serialize(useGame.getState().game)).toBe(before);
  });
});

it("registers from the account form and follows with login", async () => {
  const c = new CloudClient("http://localhost:8000");
  const register = vi.spyOn(c, "register").mockResolvedValue(undefined);
  const login = vi
    .spyOn(c, "login")
    .mockResolvedValue({ id: "new-user", username: "new_captain" });
  vi.spyOn(c, "read").mockResolvedValue(null);
  render(<AccountPanel client={c} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Chưa có tài khoản? Đăng ký" }),
  );
  fireEvent.change(screen.getByLabelText("Tên tài khoản"), {
    target: { value: "new_captain" },
  });
  fireEvent.change(screen.getByLabelText(/Mật khẩu/), {
    target: { value: "strong-password" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Tạo tài khoản & đăng nhập" }),
  );
  await screen.findByText("new_captain");
  expect(register).toHaveBeenCalledWith("new_captain", "strong-password");
  expect(login).toHaveBeenCalledWith("new_captain", "strong-password");
});
