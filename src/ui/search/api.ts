import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { termToStopIDs } from "./util";

const API_URL = process.env.REACT_APP_API_URL;
const ARRIVALS_URL = `${API_URL}/arrivals`;

export const arrivalsAPI = createApi({
  reducerPath: "arrivalsAPI",
  baseQuery: fetchBaseQuery({ baseUrl: ARRIVALS_URL }),
  endpoints: (build) => ({
    getArrivals: build.query<any, string>({
      query: (term) => {
        const stopIDs = termToStopIDs(term);
        const q = stopIDs.join(",");
        return { url: "", params: { q } };
      },
    }),
  }),
});

export const { useGetArrivalsQuery } = arrivalsAPI;
