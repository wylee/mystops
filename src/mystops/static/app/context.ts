import { createContext } from "@lit/context";
import { AppState } from "./interfaces";

export const appStateContext = createContext<AppState>(Symbol.for("appStateContext"));
