import Map from "ol/Map";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";

import OpenLayersMap from "./OpenLayersMap";

export default class OverviewSwitcher {
  map: Map;
  view: View;
  mainMap: OpenLayersMap;
  baseLayers: Array<any>;
  baseLayer: any;
  baseLayerIndex = 0;

  constructor(mainMap, baseLayers) {
    this.mainMap = mainMap;

    let numLayers = baseLayers.length;

    this.baseLayers = baseLayers.map((layer, i) => {
      const previous = i === 0 ? numLayers - 1 : i - 1;
      const visible = baseLayers[previous].getVisible();
      const baseLayer = new TileLayer({
        label: layer.get("label"),
        shortLabel: layer.get("shortLabel"),
        source: layer.getSource(),
        visible,
      });
      if (visible) {
        this.baseLayer = baseLayer;
        this.baseLayerIndex = i;
      }
      return baseLayer;
    });

    this.map = new Map({
      controls: [],
      interactions: [],
      layers: this.baseLayers,
      view: new View(),
    });

    this.view = this.map.getView();
  }

  initialize(target, zoomLevel) {
    const map = this.map;
    const view = this.view;
    const mainMapView = this.mainMap.getView();

    map.setTarget(target);
    view.setZoom(zoomLevel);

    mainMapView.on("change:center", () => {
      view.setCenter(mainMapView.getCenter());
    });
  }

  setBaseLayerByIndex(index) {
    for (let layer of this.baseLayers) {
      layer.setVisible(false);
    }
    this.baseLayer = this.baseLayers[index];
    this.baseLayerIndex = index;
    this.baseLayer.setVisible(true);
  }
}
