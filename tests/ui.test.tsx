// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import App from "../src/App";
import { useGame } from "../src/store";
beforeEach(() => {
  localStorage.clear();
  useGame.getState().fresh();
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("Player interface integration", () => {
  it("starts from briefing, changes stations and freezes with Space", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: /Nhận quyền chỉ huy/ }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Nhận quyền chỉ huy/ }));
    expect(useGame.getState().game.mode).toBe("running");
    fireEvent.keyDown(window, { code: "Space" });
    expect(useGame.getState().game.mode).toBe("paused");
    fireEvent.click(screen.getByRole("button", { name: "Thủy thủ" }));
    expect(screen.getByText("Một con tàu. Một thủy thủ đoàn.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Tình báo" }));
    expect(screen.getByText("Bức tranh chưa hoàn chỉnh.")).toBeTruthy();
  });
  it("scans, verifies and sets navigation waypoint through real UI controls", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Nhận quyền chỉ huy/ }));
    fireEvent.click(screen.getByRole("button", { name: /QUÉT SONAR/ }));
    expect(useGame.getState().game.scanCount).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: /Đến mục tiêu/ }));
    expect(useGame.getState().game.waypoint).toEqual({ x: 43, y: 54 });
    fireEvent.click(screen.getByRole("button", { name: "Tình báo" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: /Xác minh nguồn tin/ })[0],
    );
    expect(useGame.getState().game.verified.length).toBe(1);
  });
  it("saves through menu and restores settings and progress", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Nhận quyền chỉ huy/ }));
    fireEvent.click(screen.getByRole("button", { name: /QUÉT SONAR/ }));
    fireEvent.click(screen.getByRole("button", { name: "Menu chính" }));
    fireEvent.click(screen.getByRole("button", { name: "Lưu tiến trình" }));
    expect(localStorage.getItem("deep-command-save-v1")).toContain(
      "deep-command-v1",
    );
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    fireEvent.click(screen.getByRole("button", { name: /QUÉT SONAR/ }));
    fireEvent.click(screen.getByRole("button", { name: "Menu chính" }));
    fireEvent.click(screen.getByRole("button", { name: "Tiếp tục bản lưu" }));
    expect(useGame.getState().game.scanCount).toBe(1);
    expect(useGame.getState().game.mode).toBe("paused");
  });
});

it("opens cloud access from briefing without starting the mission", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Tài khoản / cloud" }));
  expect(
    screen.getByRole("heading", { name: "Tài khoản & cloud save" }),
  ).toBeTruthy();
  expect(useGame.getState().game.stage).toBe("briefing");
  expect(useGame.getState().game.time).toBe(0);
});

it("selects a contact with Space without pausing the simulation", () => {
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Nhận quyền chỉ huy" }));
  fireEvent.keyDown(screen.getByRole("button", { name: "C-03" }), {
    key: " ",
    code: "Space",
  });
  expect(useGame.getState().game.mode).toBe("running");
  expect(screen.getByText(/SELECTED CONTACT \/ C-03/)).toBeTruthy();
});
