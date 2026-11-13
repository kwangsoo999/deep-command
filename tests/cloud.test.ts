import { afterEach, describe, it, expect, vi } from "vitest";
import { CloudClient } from "../src/cloud";
import { createState, serialize } from "../src/simulation";
const reply = (data: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(data), { status });
const profile = { id: "captain-id", username: "captain" };
afterEach(() => vi.unstubAllGlobals());
describe("Cloud client API boundary", () => {
  it("logs in, attaches bearer token, and keeps token out of exported saves", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({ access_token: "secret-session" }))
      .mockResolvedValueOnce(reply(profile))
      .mockResolvedValueOnce(
        reply({ revision: "2026-11-13T10:00:00.000000+00:00" }),
      );
    vi.stubGlobal("fetch", fetch);
    const c = new CloudClient("http://localhost:8000/");
    expect(await c.login("captain", "strong-password")).toEqual(profile);
    await c.write(createState(), null);
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe(
      "Bearer secret-session",
    );
    const payload = JSON.parse(fetch.mock.calls[2][1].body);
    expect(payload.expected_revision).toBeNull();
    expect(serialize(createState())).not.toContain("secret-session");
  });
  it("returns no slot for 404, validates downloaded game before exposing it", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({}, 404))
      .mockResolvedValueOnce(
        reply({
          revision: "r",
          schema: "deep-command-v1",
          state: { version: 1 },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const c = new CloudClient("http://localhost:8000");
    expect(await c.read()).toBeNull();
    await expect(c.read()).rejects.toThrow("Tệp lưu không hợp lệ");
  });
  it("reads supported cloud envelopes and always pauses restored state", async () => {
    const s = createState();
    s.stage = "active";
    s.mode = "running";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        reply({
          ...JSON.parse(serialize(s)),
          revision: "2026-11-13T10:00:00.000000+00:00",
        }),
      ),
    );
    const value = await new CloudClient("http://localhost:8000").read();
    expect(value?.state.mode).toBe("paused");
    expect(value?.state.mission).toBe(0);
  });
  it("reports conflicts without retrying or overwriting", async () => {
    const fetch = vi.fn().mockResolvedValue(reply({}, 409));
    vi.stubGlobal("fetch", fetch);
    await expect(
      new CloudClient("http://localhost:8000").write(createState(), "old"),
    ).rejects.toMatchObject({ status: 409 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetch.mock.calls[0][1].body).expected_revision).toBe(
      "old",
    );
  });
  it("clears session when credentials expire and on failed logout", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply({ access_token: "token" }))
      .mockResolvedValueOnce(reply(profile))
      .mockResolvedValueOnce(reply({}, 401));
    vi.stubGlobal("fetch", fetch);
    const c = new CloudClient("http://localhost:8000");
    await c.login("captain", "strong-password");
    await expect(c.read()).rejects.toMatchObject({ status: 401 });
    expect(c.profile).toBeNull();
    fetch
      .mockResolvedValueOnce(reply({ access_token: "next" }))
      .mockResolvedValueOnce(reply(profile))
      .mockRejectedValueOnce(Error("offline"));
    await c.login("captain", "strong-password");
    await expect(c.logout()).rejects.toThrow();
    expect(c.profile).toBeNull();
  });
  it("does not contact a server when API is not configured", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(new CloudClient("").read()).rejects.toThrow("Chưa cấu hình");
    expect(fetch).not.toHaveBeenCalled();
  });
});
