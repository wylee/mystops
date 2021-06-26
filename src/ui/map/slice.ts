import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { RootState } from "../store";

import { DEBUG } from "./const";
import { Center, CenterZoom, Extent, Resolution, MapSize, ZoomLevel, TopLeft } from "./types";

interface UserLocation {
  position: Center | null;
  accuracy: number | null;
  accuracyCoords: number[][] | null;
  heading: number | null;
  error: string | null;
}

export interface MapState {
  baseLayer: string;
  center: Center;
  zoom: ZoomLevel;
  extent: Extent;
  resolution: Resolution;
  size: MapSize;
  userLocation: UserLocation;
  contextMenu: {
    open: boolean;
    top: number;
    left: number;
  };
}

export const initialState: MapState = {
  baseLayer: DEBUG ? "Debug" : "Map",
  center: [-13655274.508685641, 5704240.981993447], // -122.667418, 45.523029
  zoom: process.env.REACT_APP_DEBUG ? 17 : 13,
  extent: [0, 0, 0, 0],
  resolution: 0,
  size: [0, 0],
  userLocation: {
    position: null,
    accuracy: Infinity,
    accuracyCoords: null,
    heading: null,
    error: "",
  },
  contextMenu: {
    open: false,
    top: 0,
    left: 0,
  },
};

export const slice = createSlice({
  name: "map",
  initialState,
  reducers: {
    setBaseLayer: (state, action: PayloadAction<string>) => {
      state.baseLayer = action.payload;
    },
    setCenter: (state, action: PayloadAction<Center>) => {
      state.center = action.payload;
    },
    setZoom: (state, action: PayloadAction<ZoomLevel>) => {
      state.zoom = action.payload;
    },
    setCenterAndZoom: (state, action: PayloadAction<CenterZoom>) => {
      const { center, zoom } = action.payload;
      state.center = center;
      if (typeof zoom !== "undefined") {
        state.zoom = zoom;
      }
    },
    zoomIn: (state) => {
      state.zoom = state.zoom + 1;
    },
    zoomOut: (state) => {
      state.zoom = state.zoom - 1;
    },
    setExtent: (state, action: PayloadAction<Extent>) => {
      state.extent = action.payload;
    },
    setResolution: (state, action: PayloadAction<Resolution>) => {
      state.resolution = action.payload;
    },
    setSize: (state, action: PayloadAction<MapSize>) => {
      state.size = action.payload;
    },
    // User location
    setUserLocation: (state, action: PayloadAction<any>) => {
      state.userLocation = action.payload;
    },
    // Map context menu
    openContextMenu: (state, action: PayloadAction<TopLeft>) => {
      const [top, left] = action.payload;
      state.contextMenu = { open: true, top, left };
    },
    closeContextMenu: (state) => {
      state.contextMenu = { open: false, top: 0, left: 0 };
    },
  },
});

// Actions
export const {
  setCenter,
  setZoom,
  setCenterAndZoom,
  setExtent,
  setResolution,
  setSize,
  zoomIn,
  zoomOut,
  setBaseLayer,
  setUserLocation,
  openContextMenu,
  closeContextMenu,
} = slice.actions;

// Selectors
export const selectBaseLayer = (state: RootState) => state.map.baseLayer;
export const selectCenter = (state: RootState) => state.map.center;
export const selectZoom = (state: RootState) => state.map.zoom;
export const selectExtent = (state: RootState) => state.map.extent;
export const selectResolution = (state: RootState) => state.map.resolution;
export const selectSize = (state: RootState) => state.map.size;
export const selectUserLocation = (state: RootState) => state.map.userLocation;
export const selectContextMenuState = (state: RootState) => state.map.contextMenu;

// Reducer
export default slice.reducer;
