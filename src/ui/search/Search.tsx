import * as React from "react";

import { useAppDispatch, useAppSelector } from "../hooks";

import {
  selectTerm,
  selectResult,
  selectError,
  setTerm,
  search,
  setResult,
  setError,
  resetSearchState,
  setSelectedStops,
} from "./slice";

import Result from "./Result";
import Error from "./Error";

import "./Search.scss";

const Search = () => {
  const dispatch = useAppDispatch();
  const term = useAppSelector(selectTerm);
  const result = useAppSelector(selectResult);
  const error = useAppSelector(selectError);

  return (
    <div className="Search">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          dispatch(search(term, false));
        }}
      >
        <input
          type="text"
          title="Enter a stop ID or name"
          placeholder="Enter a stop ID or name"
          value={term || ""}
          onChange={(event) => {
            const term = event.target.value;
            if (term.trim()) {
              dispatch(setTerm(event.target.value));
            } else {
              dispatch(resetSearchState());
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
          disabled={!(term || error)}
          onClick={() => dispatch(resetSearchState())}
        >
          close
        </button>
      </form>

      {result ? <Result /> : null}
      {error ? <Error /> : null}
    </div>
  );
};

export default Search;
