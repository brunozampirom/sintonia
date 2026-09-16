// Public surface of @sintonia/game-core. Mobile and backend pull
// what they need from this barrel; nothing else in the package is
// considered stable.

export * from "./colors";
export * from "./pickers";
export * from "./protocol";
export {
  createInitialState,
  gameReducer,
  getClueGiverName,
  getGuesserName,
} from "./reducer";
export * from "./scoring";
export * from "./types";
