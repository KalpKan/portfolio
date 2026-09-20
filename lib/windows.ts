/**
 * The desk's window manager, as a pure reducer so it can be tested without
 * the DOM. Each window has a z value; the highest non-minimised one is on top
 * (focused). Opening an already-open window focuses (and restores) it.
 */
export type WindowId =
  | "projects"
  | "about"
  | "contact"
  | "hobbies"
  | "trash"
  | "music"
  | "terminal"
  | `case:${string}`;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Win {
  id: WindowId;
  z: number;
  minimized: boolean;
  /** The icon or tile the window grew from; the open animation starts there. */
  origin?: Rect;
}

export interface WindowsState {
  windows: Win[];
  nextZ: number;
}

export type WindowsAction =
  | { type: "open"; id: WindowId; origin?: Rect }
  | { type: "close"; id: WindowId }
  | { type: "focus"; id: WindowId }
  | { type: "minimize"; id: WindowId }
  | { type: "restore"; id: WindowId }
  /** Lock Screen / Restart: the desk is cleared; window state never survives them. */
  | { type: "closeAll" };

export const EMPTY_WINDOWS: WindowsState = { windows: [], nextZ: 1 };

export function windowsReducer(state: WindowsState, action: WindowsAction): WindowsState {
  if (action.type === "closeAll") return state.windows.length === 0 ? state : { ...state, windows: [] };
  const existing = state.windows.find((w) => w.id === action.id);
  switch (action.type) {
    case "open": {
      if (existing) {
        return {
          nextZ: state.nextZ + 1,
          windows: state.windows.map((w) =>
            w.id === action.id ? { ...w, z: state.nextZ, minimized: false } : w,
          ),
        };
      }
      return {
        nextZ: state.nextZ + 1,
        windows: [...state.windows, { id: action.id, z: state.nextZ, minimized: false, origin: action.origin }],
      };
    }
    case "close":
      if (!existing) return state;
      return { ...state, windows: state.windows.filter((w) => w.id !== action.id) };
    case "focus":
    case "restore":
      if (!existing) return state;
      return {
        nextZ: state.nextZ + 1,
        windows: state.windows.map((w) =>
          w.id === action.id ? { ...w, z: state.nextZ, minimized: false } : w,
        ),
      };
    case "minimize":
      if (!existing) return state;
      return {
        ...state,
        windows: state.windows.map((w) => (w.id === action.id ? { ...w, minimized: true } : w)),
      };
  }
}

/** The focused window: highest z among the non-minimised ones. */
export function topWindow(state: WindowsState): WindowId | null {
  let top: Win | null = null;
  for (const w of state.windows) {
    if (w.minimized) continue;
    if (!top || w.z > top.z) top = w;
  }
  return top?.id ?? null;
}

export function isOpen(state: WindowsState, id: WindowId): boolean {
  return state.windows.some((w) => w.id === id);
}

export function openWindows(state: WindowsState): WindowId[] {
  return state.windows.map((w) => w.id);
}
