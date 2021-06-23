import * as React from "react";

import { useAppDispatch, useAppSelector } from "./hooks";
import { setBottomSheetContent, selectBottomSheetContent } from "./slice";
import { DISCLAIMER } from "./const";

const BottomSheet = () => {
  const dispatch = useAppDispatch();
  const content = useAppSelector(selectBottomSheetContent);

  return content ? (
    <div className="BottomSheet">
      <div className="backdrop" onClick={() => dispatch(setBottomSheetContent(null))} />
      <div className="content-wrapper">
        <div className="content">
          <p dangerouslySetInnerHTML={{ __html: content }} />
          <hr />
          <p dangerouslySetInnerHTML={{ __html: DISCLAIMER }} />
        </div>
      </div>
    </div>
  ) : null;
};

export default BottomSheet;
