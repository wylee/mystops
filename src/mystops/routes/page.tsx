/* Main Page */
import { useEffect, useState } from "react";

import {
  ErrorComponent,
  MapComponent,
  MapContext,
  MapService,
  MenuComponent,
  ResultComponent,
  SearchComponent,
} from "../components";

import { useArrivalsQuery } from "../hooks";
import { StateContext, useReducer } from "../state";

export default function Page() {
  const [state, dispatch] = useReducer();
  const [map, setMap] = useState<MapService | null>(null);

  // Create map service on mount
  useEffect(() => setMap(new MapService()), []);

  // Clean up map service on unmount
  useEffect(() => () => map?.cleanup(), [map]);

  useArrivalsQuery(state, dispatch);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      <MapContext.Provider value={map}>
        <MenuComponent />
        <SearchComponent />
        <ResultComponent />
        <ErrorComponent />
        <MapComponent />
      </MapContext.Provider>
    </StateContext.Provider>
  );
}
