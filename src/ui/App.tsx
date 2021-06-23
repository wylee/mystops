import * as React from "react";

import { useAppDispatch } from "./hooks";
import { closeContextMenu } from "./map/slice";

import BottomSheet from "./BottomSheet";
import Map from "./map/Map";
import Menu from "./Menu";
import ProgressIndicator from "./ProgressIndicator";
import Search from "./search/Search";

import "./App.scss";

const App = () => {
  const dispatch = useAppDispatch();

  return (
    <div className="App" onClick={() => dispatch(closeContextMenu())}>
      <div className="Header">
        <div className="title">
          <a href="/">MyStops</a>
        </div>
      </div>
      <ProgressIndicator />
      <Menu />
      <Search />
      <Map />
      <BottomSheet />
    </div>
  );
};

export default App;
