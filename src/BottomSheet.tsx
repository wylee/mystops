import * as React from 'react';
import { connect } from 'react-redux';

import { IState, setBottomSheetContent } from './store';

interface IProps {
  content: any;
}

interface IDispatchProps {
  setBottomSheetContent: (content) => void;
}

const BottomSheet = ({
  content,
  setBottomSheetContent,
}: IProps & IDispatchProps) => {
  return content ? (
    <div className="BottomSheet">
      <div
        className="backdrop"
        onClick={setBottomSheetContent.bind(null, null)}
      />
      <div className="content-wrapper">
        <div className="header">
          <button
            type="button"
            className="material-icons"
            onClick={setBottomSheetContent.bind(null, null)}
            title="Close"
          >
            close
          </button>
        </div>
        <div className="content">{content}</div>
      </div>
    </div>
  ) : null;
};

export default connect(
  (state: IState) => ({ ...state.main.bottomSheet }),
  dispatch => {
    return {
      setBottomSheetContent: content =>
        dispatch(setBottomSheetContent(content)),
    };
  }
)(BottomSheet);
