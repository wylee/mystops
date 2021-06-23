import * as React from "react";
import { useAppSelector } from "./hooks";
import { selectProgressCounter } from "./slice";

const ProgressIndicator = () => {
  const progressCounter = useAppSelector(selectProgressCounter);
  return progressCounter > 0 ? <div className="ProgressIndicator" /> : null;
};

export default ProgressIndicator;
