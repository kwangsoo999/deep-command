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
  checkpoint: () => void;
  saveError: string | null;
}>((set, get) => ({
  game: createState(),
  saveError: null,
  dispatch: (a) =>
    set((p) => {
      const game = structuredClone(p.game);
      act(game, a);
      if (
        ["deploy", "next", "retry"].includes(a.type) ||
        game.mode !== p.game.mode
      )
        clock.reset();
      return { game };
    }),
  advance: (dt) => {
    const g = get().game;
    if (g.mode !== "running" || g.stage !== "active") return;
    const game = structuredClone(g);
    clock.advance(game, dt);
    if (game.time !== g.time) {
      let saveError = get().saveError;
      if (game.stage === "debrief") {
        try {
          localStorage.setItem(KEY, serialize(game));
          saveError = null;
        } catch {
          saveError =
            "Không lưu được kết quả nhiệm vụ. Hãy xuất JSON để giữ tiến trình.";
        }
      }
      set({ game, saveError });
    }
  },
  save: () => {
    localStorage.setItem(KEY, serialize(get().game));
    set({ saveError: null });
  },
  load: () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) throw Error("Chưa có bản lưu trên trình duyệt này.");
    clock.reset();
    set({ game: restore(raw) });
  },
  fresh: () => {
    clock.reset();
    set({ game: createState(), saveError: null });
  },
  importSave: (raw) => {
    const game = restore(raw);
    localStorage.setItem(KEY + "-backup", serialize(get().game));
    localStorage.setItem(KEY, serialize(game));
    clock.reset();
    set({ game });
  },
  checkpoint: () => {
    localStorage.setItem(KEY + "-backup", serialize(get().game));
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
