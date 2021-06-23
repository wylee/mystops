export type Center = [number, number];
export type Extent = [number, number, number, number];
export type Resolution = number;
export type ZoomLevel = number;
export type MapSize = [number, number];
export type TopLeft = [number, number];
export type CenterZoom = {
  center: Center;
  zoom?: ZoomLevel;
};
