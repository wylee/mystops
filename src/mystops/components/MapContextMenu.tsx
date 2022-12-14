import { useContext, useEffect } from "react";
import styled from "styled-components";

import { STREET_LEVEL_ZOOM } from "../const";
import MapContext from "./MapContext";

interface State {
  x: number;
  y: number;
  open: boolean;
}

interface Props {
  state: State;
  setState: ({ x, y, open }: State) => void;
}

const MenuContainer = styled.ul`
  position: absolute;
  z-index: 13;

  margin: 0;
  padding: 0;

  animation: fade-in 0.5s;
  background-color: white;
  border-radius: 2px;
  box-shadow: 2px 2px 4px;
  list-style: none;
`;

const MenuItem = styled.li`
  padding: var(--half-standard-spacing);

  &:hover {
    background-color: #f8f8f8;
    color: var(--link-color-hover);
    cursor: pointer;
  }
`;

export default function MapContextMenu({
  state: { x, y, open },
  setState,
}: Props) {
  const map = useContext(MapContext);

  // This will cause the menu to be closed on *any* click.
  useEffect(() => {
    const listener = () => setState({ x: 0, y: 0, open: false });
    document.addEventListener("click", listener);
    document.addEventListener("contextmenu", listener);
    return () => {
      document.removeEventListener("click", listener);
      document.removeEventListener("contextmenu", listener);
    };
  });

  if (!(map && open)) {
    return null;
  }

  const coord = map?.getCoordinateFromPixel([x, y]);
  const style = getStyle(map, x, y);

  const setCenter = (event) => {
    event.preventDefault();
    map.setCenter(coord);
  };

  const setCenterAndZoom = (event) => {
    event.preventDefault();
    if (map.getZoom() > STREET_LEVEL_ZOOM) {
      map.setCenter(coord);
    } else {
      map.setCenterAndZoom(coord, STREET_LEVEL_ZOOM);
    }
  };

  return (
    <MenuContainer id="map-context-menu" style={{ ...style }}>
      <MenuItem onClick={setCenter}>Center map here</MenuItem>
      <MenuItem onClick={setCenterAndZoom}>Zoom in here</MenuItem>
    </MenuContainer>
  );
}

const getStyle = (map, x: number, y: number) => {
  if (!open) {
    return {
      display: "none",
      top: "auto",
      right: 0,
      bottom: 0,
      left: "auto",
    };
  }

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
