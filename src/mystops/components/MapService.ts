import debounce from "lodash/debounce";

import OLMap from "ol/Map";
import View from "ol/View";

import BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";

import OSMSource from "ol/source/OSM";
import TileDebugSource from "ol/source/TileDebug";
import TileSource from "ol/source/Tile";
import VectorSource from "ol/source/Vector";
import XYZSource from "ol/source/XYZ";

import GeoJSONFormat from "ol/format/GeoJSON";

import Collection from "ol/Collection";
import { Coordinate } from "ol/coordinate";
import { EventsKey } from "ol/events";
import BaseEvent from "ol/events/Event";
import { boundingExtent, containsExtent, Extent } from "ol/extent";
import Feature from "ol/Feature";
import Geolocation from "ol/Geolocation";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import { bbox as bboxLoadingStrategy } from "ol/loadingstrategy";
import { unByKey } from "ol/Observable";
import { transformExtent } from "ol/proj";
import { Size } from "ol/size";

import {
  DEBUG,
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  STREET_LEVEL_ZOOM,
  FEATURE_LAYER_MIN_ZOOM,
  GEOGRAPHIC_PROJECTION,
  NATIVE_PROJECTION,
  USER_LOCATION_ACCURACY_THRESHOLD,
} from "../const";

import {
  STOP_STYLE,
  USER_LOCATION_ACCURACY_STYLE,
  USER_LOCATION_STYLE,
} from "./map-styles";

type OnFeatureCallback = (
  map: MapService,
  feature: Feature,
  pixel: number[],
  layer: BaseLayer,
  event: any,
) => any;

type NoFeatureCallback = (event: Event) => any;

export interface UserLocation {
  position: Coordinate | undefined;
  accuracy: number | undefined;
  accuracyGeom: Polygon | null;
  heading: number | undefined;
}

export default class MapService {
  private readonly map: OLMap;
  private readonly view: View;
  private readonly layers: BaseLayer[];
  private readonly baseLayers: TileLayer<TileSource>[];
  public baseLayer = 0;
  private readonly stopsLayer: VectorLayer<VectorSource>;
  private readonly userLocationLayer: VectorLayer<VectorSource>;
  private listenerKeys: EventsKey[] = [];
  private readonly overviewMap: OLMap;
  private readonly overviewMapBaseLayers: BaseLayer[];
  private readonly geolocator: Geolocation;

  constructor(
    private initialCenter: number[] = INITIAL_CENTER,
    private initialZoom: number = INITIAL_ZOOM,
    private minZoom: number = MIN_ZOOM,
    private maxZoom: number = MAX_ZOOM,
    private animationDuration: number = 250,
  ) {
    this.view = new View({
      center: initialCenter,
      zoom: initialZoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      constrainResolution: true,
    });

    this.baseLayers = [
      makeMapboxLayer("clcqrern9000014s1b1q96q7o", "Map", undefined, !DEBUG),
      makeMapboxLayer("clcqrl2gk000215n79g0uf4aw", "Satellite"),
      makeOSMLayer(),
    ];

    if (DEBUG) {
      this.baseLayers.unshift(makeDebugLayer());
    }

    this.stopsLayer = makeGeoJSONLayer("Stops", "stops.geojson", {
      visible: true,
      style: STOP_STYLE,
    });

    this.userLocationLayer = new VectorLayer({
      visible: false,
      source: new VectorSource({
        features: new Collection(),
      }),
    });

    this.layers = [...this.baseLayers, this.stopsLayer, this.userLocationLayer];

    this.map = new OLMap({
      controls: [],
      layers: this.layers,
      view: this.view,
    });

    this.overviewMapBaseLayers = this.baseLayers.map((layer, i) => {
      return new TileLayer({
        source: layer.getSource() as TileSource,
        visible: i === this.baseLayer + 1,
      });
    });

    this.overviewMap = new OLMap({
      controls: [],
      interactions: [],
      layers: this.overviewMapBaseLayers,
      view: new View({
        center: initialCenter,
        zoom: 12,
        minZoom: 12,
        maxZoom: 12,
        constrainResolution: true,
        constrainRotation: true,
      }),
    });

    this.geolocator = new Geolocation({
      projection: this.view.getProjection(),
      tracking: false,
      trackingOptions: {
        maximumAge: 10 * 1000,
        enableHighAccuracy: true,
        timeout: 30 * 1000,
      },
    });

    this.on("moveend", () => {
      this.overviewMap
        .getView()
        .animate({ center: this.getCenter(), duration: 200 });
    });
  }

  on(type: string, listener: (event: BaseEvent) => unknown) {
    const key = this.map.on(type as any, listener);
    this.listenerKeys.push(key);
    return key;
  }

  once(type: string, listener: (event: BaseEvent) => unknown) {
    const key = this.map.once(type as any, listener);
    this.listenerKeys.push(key);
    return key;
  }

  onFeature(
    type: string,
    featureCallback: OnFeatureCallback,
    noFeatureCallback?: NoFeatureCallback,
    onlyLayer?: BaseLayer,
    debounceTime?: number,
  ): EventsKey {
    const map = this.map;
    let listener = (event: any) => {
      const pixel = event.pixel;
      const options = {
        layerFilter: onlyLayer
          ? (layer: any) => layer === onlyLayer
          : undefined,
      };
      const feature = map.forEachFeatureAtPixel(
        pixel,
        (feature: any, layer: any) => {
          featureCallback(this, feature, pixel, layer, event);
          return feature;
        },
        options,
      );
      if (!feature && noFeatureCallback) {
        noFeatureCallback(event);
      }
    };
    if (debounceTime) {
      listener = debounce(listener, debounceTime);
    }
    return this.on(type, listener);
  }

  setTarget(target: string, overviewMapTarget: string): void {
    this.map.setTarget(target);
    this.overviewMap.setTarget(overviewMapTarget);
  }

  cleanup(): void {
    this.map.setTarget(undefined);
    this.overviewMap.setTarget(undefined);
    this.listenerKeys.forEach((key) => {
      unByKey(key);
    });
  }

  getSize(): Size {
    return this.map.getSize() ?? [0, 0];
  }

  getCoordinateFromPixel(pixel: number[]): Coordinate {
    return this.map.getCoordinateFromPixel(pixel);
  }

  getCenter(): Coordinate | undefined {
    return this.view.getCenter();
  }

  setCenter(center: Coordinate): void {
    this.view.animate({ center, duration: this.animationDuration });
  }

  setCenterAndZoom(center: Coordinate, zoom: number): void {
    this.view.animate({ center, zoom, duration: this.animationDuration });
  }

  setInitialCenterAndZoom(): void {
    this.setCenterAndZoom(this.initialCenter, this.initialZoom);
  }

  getZoom(): number {
    return this.view.getZoom() ?? 0;
  }

  setZoom(zoom: number): void {
    this.view.animate({ zoom, duration: this.animationDuration });
  }

  zoomIn(): void {
    const zoom = this.view.getZoom();
    if (typeof zoom !== "undefined") {
      const maxZoom = this.view.getMaxZoom();
      if (zoom < maxZoom) {
        this.setZoom(zoom + 1);
      }
    }
  }

  zoomOut(): void {
    const zoom = this.view.getZoom();
    if (typeof zoom !== "undefined") {
      const minZoom = this.view.getMinZoom();
      if (zoom > minZoom) {
        this.setZoom(zoom - 1);
      }
    }
  }

  getResolution(): number {
    return this.view.getResolution() ?? 0;
  }

  getExtent(): Extent {
    return this.view.calculateExtent(this.getSize());
  }

  setExtent(
    extent: Extent,
    callback?: (completed: boolean) => any,
    padding = [64, 64, 64, 64],
  ): void {
    this.view.fit(extent, {
      callback,
      padding,
      duration: this.animationDuration,
    });
  }

  containsExtent(extent: Extent): boolean {
    return containsExtent(this.getExtent(), extent);
  }

  extentOf(items: { coordinates: number[] }[], transform = false): Extent {
    const extent = boundingExtent(items.map((stop: any) => stop.coordinates));
    if (transform) {
      return transformExtent(extent, GEOGRAPHIC_PROJECTION, NATIVE_PROJECTION);
    }
    return extent;
  }

  getBaseLayers(): BaseLayer[] {
    return this.baseLayers;
  }

  getBaseLayer(): BaseLayer {
    return this.baseLayers[this.baseLayer];
  }

  getNextBaseLayer(): BaseLayer {
    return this.baseLayers[(this.baseLayer + 1) % this.baseLayers.length];
  }

  setBaseLayer(baseLayer: number): void {
    const overviewMapBaseLayer = (baseLayer + 1) % this.baseLayers.length;
    this.baseLayers.forEach((layer, i) => layer.setVisible(i === baseLayer));
    this.baseLayer = baseLayer;
    this.overviewMapBaseLayers.forEach((layer, i) =>
      layer.setVisible(i === overviewMapBaseLayer),
    );
  }

  nextBaseLayer(): void {
    const baseLayer = (this.baseLayer + 1) % this.baseLayers.length;
    this.setBaseLayer(baseLayer);
  }

  getLayer(label: string): BaseLayer {
    const layer = this.layers.find((layer) => layer.get("label") === label);
    if (!layer) {
      throw new Error();
    }
    return layer;
  }

  startTracking(): void {
    this.geolocator.setTracking(true);
  }

  addGeolocatorListener(
    type: string,
    listener: (event: { target: Geolocation; code?: number }) => any,
    once = false,
  ): EventsKey {
    const key = (
      once
        ? this.geolocator.once(type as any, listener)
        : this.geolocator.on(type as any, listener)
    ) as EventsKey;
    this.listenerKeys.push(key);
    return key;
  }

  getUserLocation(): UserLocation {
    const geolocator = this.geolocator;
    const position = geolocator.getPosition();
    const accuracy = geolocator.getAccuracy();
    const accuracyGeom = geolocator.getAccuracyGeometry();
    const heading = geolocator.getHeading() || 0;
    return {
      position,
      accuracy,
      accuracyGeom,
      heading,
    };
  }

  showUserLocation(zoomTo = false): void {
    const userLocation = this.getUserLocation();
    const { position, accuracy, accuracyGeom } = userLocation;
    const layer = this.userLocationLayer;
    const source = layer.getSource() as VectorSource;
    source.clear();
    if (position) {
      const feature = new Feature({
        geometry: new Point(position),
      });
      feature.setStyle(USER_LOCATION_STYLE);
      source.addFeature(feature);
      if (
        accuracy &&
        accuracy > USER_LOCATION_ACCURACY_THRESHOLD &&
        accuracyGeom
      ) {
        const accuracyFeature = new Feature({
          geometry: accuracyGeom,
        });
        accuracyFeature.setStyle(USER_LOCATION_ACCURACY_STYLE);
        source.addFeature(accuracyFeature);
      }
      layer.setVisible(true);
      if (zoomTo) {
        if (this.getZoom() > STREET_LEVEL_ZOOM) {
          this.setCenter(position);
        } else {
          this.setCenterAndZoom(position, STREET_LEVEL_ZOOM);
        }
      }
    } else {
      layer.setVisible(false);
    }
  }
}

function makeMapboxLayer(
  styleId: string,
  label: string,
  shortLabel?: string,
  visible = false,
): TileLayer<XYZSource> {
  const accessToken = DJANGO_MAPBOX_ACCESS_TOKEN;
  const source = new XYZSource({
    url: `https://{a-d}.tiles.mapbox.com/styles/v1/wylee/${styleId}/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`,
  });
  const layer = new TileLayer({ source, visible });
  shortLabel = shortLabel || label;
  layer.set("label", label);
  layer.set("shortLabel", shortLabel);
  return layer;
}

function makeOSMLayer(
  label = "OpenStreetMap",
  shortLabel = "OSM",
  visible = false,
): TileLayer<OSMSource> {
  const source = new OSMSource();
  const layer = new TileLayer({ source, visible });
  layer.set("label", label);
  layer.set("shortLabel", shortLabel);
  return layer;
}

function makeDebugLayer(visible = true): TileLayer<TileDebugSource> {
  const osmSource = new OSMSource();
  const source = new TileDebugSource({
    projection: osmSource.getProjection() ?? NATIVE_PROJECTION,
    tileGrid: osmSource.getTileGrid() ?? undefined,
  });
  const layer = new TileLayer({ source, visible });
  layer.set("label", "Debug");
  layer.set("shortLabel", "Debug");
  return layer;
}

function makeGeoJSONLayer(
  label: string,
  path: string,
  options: any = {},
): VectorLayer<VectorSource> {
  const source = new VectorSource({
    strategy: bboxLoadingStrategy,
    format: new GeoJSONFormat(),
    url: (extent) => {
      const bbox = transformExtent(
        extent,
        NATIVE_PROJECTION,
        GEOGRAPHIC_PROJECTION,
      ).join(",");
      return `${path}?bbox=${bbox}`;
    },
  });
  options.minZoom = options.minZoom || FEATURE_LAYER_MIN_ZOOM;
  options.projection = options.projection || GEOGRAPHIC_PROJECTION;
  const layer = new VectorLayer({ source, ...options });
  layer.set("label", label);
  return layer;
}
