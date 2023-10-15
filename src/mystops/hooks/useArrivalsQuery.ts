import axios, { CancelToken } from "axios";
import { useEffect, useRef, useState } from "react";

import { ARRIVALS_URL, REFRESH_INTERVAL } from "../const";
import { Result } from "../state";
import { termToStopIds } from "../utils";

export default function useArrivalsQuery(state, dispatch) {
  const [cancelTokenSource, setCancelTokenSource] = useState(
    axios.CancelToken.source(),
  );

  useInterval(
    () => {
      const newCancelTokenSource = axios.CancelToken.source();
      cancelTokenSource.cancel();
      setCancelTokenSource(newCancelTokenSource);
      arrivalsQuery(state.term.trim(), newCancelTokenSource.token)
        .then((result) => {
          dispatch({ type: "SET_RESULT", payload: result });
        })
        .catch((err) => {
          cancelTokenSource.cancel();
          dispatch({ type: "SET_ERROR", payload: err });
        });
    },
    state.term.trim(),
    state.term.trim() && state.doArrivalsQuery,
    REFRESH_INTERVAL,
  );
}

export function useInterval(callback, term, condition, delay) {
  const callbackRef = useRef<() => void>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Run callback right away to avoid delayed start.
  useEffect(() => {
    if (callbackRef.current && condition) {
      callbackRef.current();
    }
  }, [term, condition]);

  // Run callback periodically when condition is set.
  useEffect(() => {
    if (callbackRef.current && condition) {
      const tick = () => {
        if (callbackRef.current && condition) {
          callbackRef.current();
        }
      };
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [term, condition, delay]);
}

/**
 * Do arrivals query with `term` and return result.
 *
 * If the query is canceled, `null` will be returned. Otherwise, the
 * query data will be returned (the result).
 *
 * @param term
 * @param cancelToken
 * @throws Error
 */
async function arrivalsQuery(
  term: string,
  cancelToken: CancelToken,
): Promise<Result | null> {
  let stops: number[];

  try {
    stops = termToStopIds(term);
  } catch (err: any) {
    throw {
      title: err.name,
      explanation: err.message,
      detail: err.detail,
    };
  }

  let response;

  try {
    response = await axios.get(ARRIVALS_URL, {
      cancelToken,
      params: { q: stops.join(",") },
    });
  } catch (err: any) {
    if (axios.isCancel(err)) {
      return null;
    }

    // Depending on the type of error, the response might include error
    // data.
    const data = err.response?.data;

    let title = "Error";
    let explanation = err.message || "An error occurred.";
    let detail = data ? undefined : "Please try again later.";

    if (data) {
      if (data.title) {
        title = data.title;
      }
      if (data.explanation) {
        explanation = data.explanation;
      }
      if (data.detail) {
        detail = data.detail;
      }
    }

    throw { title, explanation, detail };
  }

  const result = response.data;

  if (!result?.count) {
    throw {
      title: "No Arrivals Found",
      explanation: "No arrivals were found for those stop IDs.",
      detail: "Please try again later.",
    };
  }

  return result;
}
