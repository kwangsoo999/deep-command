import { create } from "zustand";
import {
  act,
  createState,
  restore,
  serialize,
  SimulationClock,
  type State,
  type Action,
} from "./simulation";
const KEY = "deep-command-save-v1";
const clock = new SimulationClock();
export const useGame = create<{
  game: State;
  dispatch: (a: Action) => void;
  advance: (dt: number) => void;
  save: () => void;
  load: () => void;
  fresh: () => void;
  importSave: (raw: string) => void;
  restoreBackup: () => void;
}>((set, get) => ({
  game: createState(),
  dispatch: (a) =>
    set((p) => {
      const game = structuredClone(p.game);
      act(game, a);
      return { game };
    }),
  advance: (dt) => {
    const g = get().game;
    if (g.mode !== "running" || g.stage !== "active") return;
    const game = structuredClone(g);
    clock.advance(game, dt);
    if (game.time !== g.time) set({ game });
  },
  save: () => {
    localStorage.setItem(KEY, serialize(get().game));
  },
  load: () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw Error("Chưa có bản lưu trên trình duyệt này.");
    clock.reset();
    set({ game: restore(raw) });
  },
  fresh: () => {
    clock.reset();
    set({ game: createState() });
  },
  importSave: (raw) => {
    const game = restore(raw);
    localStorage.setItem(KEY + "-backup", serialize(get().game));
    localStorage.setItem(KEY, serialize(game));
    clock.reset();
    set({ game });
  },
  restoreBackup: () => {
    const raw = localStorage.getItem(KEY + "-backup");
    if (!raw) throw Error("Chưa có bản dự phòng trước khi nhập.");
    const game = restore(raw);
    localStorage.setItem(KEY, serialize(game));
    clock.reset();
    set({ game });
  },
}));
