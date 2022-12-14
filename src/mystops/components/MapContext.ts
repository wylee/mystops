import { createContext } from "react";
import { MapService } from "../components";

export default createContext<MapService | null>(null);
