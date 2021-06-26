import * as React from "react";

import { useAppDispatch, useAppSelector } from "../hooks";

import { useGetArrivalsQuery } from "./api";

import {
  selectTerm,
  selectSubmit,
  setTerm,
  setSubmit,
  resetSearchState,
  setResult,
} from "./slice";

import Result from "./Result";
import Error from "./Error";

import "./Search.scss";

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds

const Search = () => {
  const dispatch = useAppDispatch();
  const term = useAppSelector(selectTerm);
  const submit = useAppSelector(selectSubmit);
  const [pollingInterval, setPollingInterval] = React.useState(0);

  const {
    data: result,
    error,
    isLoading,
    isFetching,
    isError,
  } = useGetArrivalsQuery(term, {
    skip: !(submit && term),
    pollingInterval,
  });

  React.useEffect(() => {
    if (!submit) {
      setPollingInterval(0);
    }
  }, [submit]);

  React.useEffect(() => {
    dispatch(setResult(result));
    if (result) {
      setPollingInterval(REFRESH_INTERVAL);
    }
  }, [dispatch, result]);

  React.useEffect(() => {
    if (error) {
      setPollingInterval(0);
    }
  }, [error]);

  return (
    <div className="Search">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          dispatch(setSubmit(true));
        }}
      >
        {isLoading || isFetching ? <div className="progress-indicator" /> : null}

        <input
          type="text"
          title="Enter a stop ID or name"
          placeholder="Enter a stop ID or name"
          value={term}
          onChange={(event) => {
            setPollingInterval(0);
            dispatch(setSubmit(false));
            if (event.target.value.trim()) {
              dispatch(setTerm(event.target.value));
            } else {
              dispatch(setTerm(""));
            }
          }}
        />

        <button type="submit" title="Search" className="material-icons" disabled={!term}>
          search
        </button>

        <button
          type="reset"
          title="Clear"
          className="material-icons"
          disabled={!(term || isError)}
          onClick={() => {
            setPollingInterval(0);
            dispatch(setSubmit(false));
            dispatch(resetSearchState());
          }}
        >
          close
        </button>
      </form>

      {submit && result ? <Result result={result} /> : null}
      {error ? <Error error={error} /> : null}
    </div>
  );
};

export default Search;
