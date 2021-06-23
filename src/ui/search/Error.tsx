import * as React from "react";

import { useAppSelector } from "../hooks";

import { selectError } from "./slice";

const Error = () => {
  const error = useAppSelector(selectError);

  return error ? (
    <div className="results error">
      <div className="error-title">{error.title || "Whoops!"}</div>
      <div className="error-message">
        <p>{error.message}</p>
        <p>{error.detail}</p>
      </div>
    </div>
  ) : null;
};

export default Error;
