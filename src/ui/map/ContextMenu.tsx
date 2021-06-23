import * as React from "react";

import { useAppDispatch, useAppSelector } from "../hooks";

import { STREET_LEVEL_ZOOM } from "./const";
import { closeContextMenu, selectContextMenuState, setCenter } from "./slice";

const ContextMenu = ({ map }) => {
  const dispatch = useAppDispatch();
  const contextMenuState = useAppSelector(selectContextMenuState);

  return (
    <ul
      className="ContextMenu"
      style={getStyle(map, contextMenuState)}
      onClick={(event: any) => {
        if (!event.target.classList.contains("regular-link")) {
          event.preventDefault();
        }
        dispatch(closeContextMenu());
      }}
      onContextMenu={(event) => event.preventDefault()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <li>
        <a
          href="#center-map"
          onClick={() => {
            const { left: x, top: y } = contextMenuState;
            const center = map.getCoordinateFromPixel([x, y]);
            dispatch(setCenter({ center }));
          }}
        >
          {" "}
          Center map here
        </a>
      </li>
      <li>
        <a
          href="#zoom-in"
          onClick={() => {
            const { left: x, top: y } = contextMenuState;
            const center = map.getCoordinateFromPixel([x, y]);
            const currentZoom = map.getZoom();
            const zoom = currentZoom < STREET_LEVEL_ZOOM ? STREET_LEVEL_ZOOM : undefined;
            dispatch(setCenter({ center, zoom }));
          }}
        >
          Zoom in here
        </a>
      </li>
    </ul>
  );
};

const getStyle = (map, state) => {
  if (!state.open) {
    return {
      display: "none",
      top: "auto",
      right: 0,
      bottom: 0,
      left: "auto",
    };
  }

  const { left: x, top: y } = state;
  const [containerWidth, containerHeight] = map.getSize() || [0, 0];
  const threshold = 200;

  let top = `${y}px`;
  let right = "auto";
  let bottom = "auto";
  let left = `${x}px`;

  if (containerWidth - x < threshold) {
    left = "auto";
    right = `${containerWidth - x}px`;
  }

  if (containerHeight - y < threshold) {
    top = "auto";
    bottom = `${containerHeight - y}px`;
  }

  return { display: "block", top, right, bottom, left };
};

export default ContextMenu;
