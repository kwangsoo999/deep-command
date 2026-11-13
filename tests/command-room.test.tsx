// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CommandRoom from "../src/CommandRoom";
import { createState } from "../src/simulation";
vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  return {
    ...actual,
    WebGLRenderer: class {
      constructor() {
        throw Error("WebGL unavailable");
      }
    },
  };
});
afterEach(cleanup);
describe("3D station controls with WebGL unavailable", () => {
  it("retains station navigation and mission commands via accessible controls", () => {
    const g = createState();
    g.stage = "active";
    g.mode = "running";
    const station = vi.fn(),
      scan = vi.fn(),
      waypoint = vi.fn();
    render(
      <CommandRoom
        game={g}
        onStation={station}
        onScan={scan}
        onWaypoint={waypoint}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Navigation" })[1]);
    expect(station).toHaveBeenCalledWith("Navigation");
    fireEvent.click(screen.getByRole("button", { name: /Quét sonar/ }));
    expect(scan).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Đặt tuyến nhiệm vụ" }));
    expect(waypoint).toHaveBeenCalledTimes(1);
  });
  it("blocks scan while paused, switches ocean mode, and keeps game state unchanged", () => {
    const g = createState(),
      before = JSON.stringify(g);
    render(
      <CommandRoom
        game={g}
        onStation={vi.fn()}
        onScan={vi.fn()}
        onWaypoint={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: /Quét sonar/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Đại dương" }));
    expect(screen.getByText("Aurora. Dưới tầng sóng.")).toBeTruthy();
    expect(JSON.stringify(g)).toBe(before);
  });
});

it("offers close-up exterior cameras and presentation-only exposure/HUD controls", () => {
  const game = createState(),
    before = JSON.stringify(game);
  render(
    <CommandRoom
      game={game}
      onStation={vi.fn()}
      onScan={vi.fn()}
      onWaypoint={vi.fn()}
    />,
  );
  fireEvent.change(screen.getByLabelText("Độ sáng"), {
    target: { value: "1.5" },
  });
  expect(screen.getByText("1.50")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Ẩn HUD" }));
  expect(
    screen
      .getByRole("button", { name: "Hiện HUD" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Đại dương" }));
  fireEvent.click(screen.getByRole("button", { name: "Mũi tàu" }));
  expect(screen.getByRole("button", { name: "Mũi tàu" }).className).toContain(
    "active",
  );
  expect(screen.getByRole("button", { name: "Đuôi tàu" })).toBeTruthy();
  expect(JSON.stringify(game)).toBe(before);
});

it("switches visual looks without touching saved gameplay", () => {
  const game = createState(),
    before = JSON.stringify(game);
  render(
    <CommandRoom
      game={game}
      onStation={vi.fn()}
      onScan={vi.fn()}
      onWaypoint={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Biển sâu" }));
  expect(
    screen
      .getByRole("button", { name: "Biển sâu" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: "Tự nhiên" }));
  expect(
    screen
      .getByRole("button", { name: "Tự nhiên" })
      .getAttribute("aria-pressed"),
  ).toBe("true");
  expect(JSON.stringify(game)).toBe(before);
});

it("opens an immersive dialog and exits it with Escape while keeping gameplay intact", () => {
  const game = createState(),
    before = JSON.stringify(game);
  render(
    <CommandRoom
      game={game}
      onStation={vi.fn()}
      onScan={vi.fn()}
      onWaypoint={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Phóng to 3D" }));
  const dialog = screen.getByRole("dialog", {
    name: "Visualisation Aurora 3D",
  });
  expect(dialog.getAttribute("aria-modal")).toBe("true");
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(JSON.stringify(game)).toBe(before);
});

it("provides a working pause command in the viewer when supplied by the game", () => {
  const game = createState();
  game.stage = "active";
  game.mode = "running";
  const pause = vi.fn();
  render(
    <CommandRoom
      game={game}
      onStation={vi.fn()}
      onScan={vi.fn()}
      onWaypoint={vi.fn()}
      onPause={pause}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Tạm dừng game" }));
  expect(pause).toHaveBeenCalledTimes(1);
});
