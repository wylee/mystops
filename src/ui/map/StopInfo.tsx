import * as React from "react";

interface Info {
  id: number;
  name: string;
  direction: string | null;
  routes: Array<any>;
  position: Position;
}

interface Position {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

const StopInfo = ({ map, feature }) => {
  const stopInfo = getStopInfo(map, feature);

  return (
    <div className="stop-info" style={{ ...stopInfo?.position }}>
      <div className="stop-info-title">Stop {stopInfo?.id}</div>
      <div>{stopInfo?.name}</div>
      <div>{stopInfo?.direction || "N/A"}</div>
      <div>Routes: {stopInfo?.routes}</div>
    </div>
  );
};

export default StopInfo;

const getStopInfo = (map, feature): Info => {
  const [width, height] = map.getSize();
  const [x, y] = [width / 2, height / 2];
  const buffer = 10;
  const pixel = map.getPixelFromFeature(feature);

  let left: any = pixel[0];
  let top: any = pixel[1];
  let right: any = "auto";
  let bottom: any = "auto";

  if (left > x) {
    [left, right] = ["auto", width - left];
  }

  if (top > y) {
    [top, bottom] = ["auto", height - top];
  }

  [top, right, bottom, left] = [top, right, bottom, left].map((value) => {
    return value === "auto" ? value : `${value + buffer}px`;
  });

  return {
    ...feature.getProperties(),
    position: { top, right, bottom, left },
  };
};
