// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, it, expect, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act as uiAct,
} from "@testing-library/react";
import App from "../src/App";
import { useGame } from "../src/store";
import { serialize, missions } from "../src/simulation";
beforeEach(() => {
  localStorage.clear();
  useGame.getState().fresh();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("opens preparation from briefing, locks later missions and requires confirmation", () => {
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: "Chiến dịch & chuẩn bị" }),
  );
  expect(
    screen.getByRole("heading", { name: "Bộ chỉ huy chiến dịch" }),
  ).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Khóa" })).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "Chọn" }));
  expect(screen.getByText("Triển khai First Contact?")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Xác nhận triển khai" }));
  expect(
    screen.getByRole("button", { name: /Nhận quyền chỉ huy/ }),
  ).toBeTruthy();
  expect(localStorage.getItem("deep-command-save-v1-backup")).toBeTruthy();
});
it("automatically persists mission completion and reports quota errors without losing results", () => {
  const store = useGame.getState();
  store.dispatch({ type: "start" });
  const g = structuredClone(useGame.getState().game);
  g.position = { ...missions[0].target };
  g.contacts.forEach((c) => (c.confidence = 100));
  g.verified = ["INT-001"];
  store.importSave(serialize(g));
  store.dispatch({ type: "pause" });
  store.advance(0.5);
  store.advance(0.5);
  expect(useGame.getState().game.stage).toBe("debrief");
  expect(
    JSON.parse(localStorage.getItem("deep-command-save-v1")!).state.result
      .success,
  ).toBe(true);
  store.fresh();
  store.dispatch({ type: "start" });
  const failed = structuredClone(useGame.getState().game);
  failed.power = 0.001;
  store.importSave(serialize(failed));
  store.dispatch({ type: "pause" });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("quota");
  });
  store.advance(0.5);
  store.advance(0.5);
  expect(useGame.getState().game.result?.success).toBe(false);
  expect(useGame.getState().saveError).toContain("Không lưu được");
});
it("preserves all five mission completion records through save/load and offers endgame replay", () => {
  const s = structuredClone(useGame.getState().game);
  s.completed = [0, 1, 2, 3, 4];
  s.mission = 4;
  s.stage = "debrief";
  s.result = { mission: 4, score: 90, grade: "S", reward: 990, success: true };
  s.xp = 4000;
  useGame.getState().importSave(serialize(s));
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Lưu & về bộ chỉ huy" }));
  expect(screen.getByText("Northern Horizon hoàn tất")).toBeTruthy();
  expect(screen.getByText("Fleet Commander")).toBeTruthy();
  expect(screen.getAllByRole("button", { name: "Chơi lại" })).toHaveLength(5);
});

it("allows fleet and crew preparation before starting simulation", () => {
  render(<App />);
  fireEvent.click(
    screen.getByRole("button", { name: "Chiến dịch & chuẩn bị" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Nâng cấp hạm đội" }));
  expect(screen.getByText("FLEET MANAGEMENT")).toBeTruthy();
  expect(useGame.getState().game.stage).toBe("briefing");
  expect(useGame.getState().game.time).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Chỉ thị nhiệm vụ" }));
  expect(
    screen.getByRole("button", { name: /Nhận quyền chỉ huy/ }),
  ).toBeTruthy();
});
