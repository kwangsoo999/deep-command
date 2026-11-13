import { it, expect } from "vitest";
import { CloudClient } from "../src/cloud";
import { createState } from "../src/simulation";
// Optional real HTTP test: run against a disposable backend/database, never production.
const base = import.meta.env.VITE_TEST_API_URL;
it.skipIf(!base)(
  "real API: register, login, save, detect a second-session conflict, restore and revoke",
  async () => {
    const username = "integration_" + Date.now().toString(36);
    const a = new CloudClient(base!),
      b = new CloudClient(base!);
    await a.register(username, "integration-password-strong");
    await a.login(username, "integration-password-strong");
    expect(await a.read()).toBeNull();
    const first = createState();
    first.stage = "active";
    first.mode = "running";
    first.time = 42;
    const rev = await a.write(first, null);
    await b.login(username, "integration-password-strong");
    const old = await b.read();
    expect(old?.revision).toBe(rev);
    expect(old?.state.time).toBe(42);
    expect(old?.state.mode).toBe("paused");
    const second = createState();
    second.mission = 1;
    await a.write(second, rev);
    await expect(b.write(first, old!.revision)).rejects.toMatchObject({
      status: 409,
    });
    const latest = await b.read();
    expect(latest?.state.mission).toBe(1);
    await b.logout();
    expect(b.profile).toBeNull();
    await expect(b.read()).rejects.toMatchObject({ status: 401 });
    await a.logout();
  },
  15000,
);
