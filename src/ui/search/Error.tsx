import * as React from "react";

const Error = ({ error }) => {
  return error ? (
    <div className="results error">
      <div className="error-title">{error.data.title || "Whoops!"}</div>
      <div className="error-message">
        <p>{error.data.explanation}</p>
        {error.data.detail ? <p>{error.data.detail}</p> : null}
      </div>
    </div>
  ) : null;
};

export default Error;
