import "./Map.scss";
import * as React from "react";
import { renderToString } from "react-dom/server";

import { useAppDispatch, useAppSelector } from "../hooks";
import { closeMainMenu, setBottomSheetContent } from "../slice";
import { resetSearchState, search, selectSelectedStops, setError } from "../search/slice";

import { MAPBOX_WORDMARK_IMAGE_DATA } from "./const";

import {
  initialState,
  openContextMenu,
  selectCenter,
  selectZoom,
  selectBaseLayer,
  zoomIn,
  zoomOut,
  setBaseLayer,
  setCenter,
  setZoom,
  setExtent,
  setResolution,
  selectExtent,
  setSize,
  setUserLocation,
  selectUserLocation,
} from "./slice";

import Attributions from "./Attributions";
import ContextMenu from "./ContextMenu";
import StopInfo from "./StopInfo";
import OpenLayersMap from "./OpenLayersMap";

const Map = () => {
  const mapRef = React.useRef<OpenLayersMap | null>(null);
  const mapElRef = React.useRef(null);
  const overviewMapRef = React.useRef(null);

  const dispatch = useAppDispatch();

  const baseLayer = useAppSelector(selectBaseLayer);
  const center = useAppSelector(selectCenter);
  const zoom = useAppSelector(selectZoom);
  const extent = useAppSelector(selectExtent);
  const userLocation = useAppSelector(selectUserLocation);
  const selectedStops = useAppSelector(selectSelectedStops);

  const [stopFeature, setStopFeature] = React.useState<any>(null);

  // These send dispatched signals to the OL map
  React.useEffect((): any => mapRef.current?.setBaseLayer(baseLayer), [baseLayer]);
  React.useEffect((): any => mapRef.current?.setCenter(center, zoom), [center, zoom]);
  React.useEffect((): any => mapRef.current?.fitExtent(extent), [extent]);
  React.useEffect((): any => mapRef.current?.setSelectedStops(selectedStops), [selectedStops]);
  React.useEffect((): any => mapRef.current?.showUserLocation(userLocation), [userLocation]);

  React.useEffect(() => {
    if (mapRef.current) {
      return;
    }
    mapRef.current = new OpenLayersMap();
  }, [mapRef.current]);

  React.useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const stopsLayer = map.getFeatureLayer("Stops");

    map.initialize(mapElRef.current, overviewMapRef.current);

    map.setCenter(center, zoom).then(() => {
      map.addListener("moveend", () => {
        dispatch(setCenter(map.getCenter()));
        dispatch(setZoom(map.getZoom()));
        dispatch(setExtent(map.getExtent()));
        dispatch(setResolution(map.getResolution()));
        dispatch(setSize(map.getSize()));
      });

      map.addFeatureListener(
        "singleclick",
        (feature) => dispatch(search(feature.get("id").toString(), true, true)),
        () => dispatch(resetSearchState()),
        stopsLayer
      );

      map.addListener("movestart", () => {
        if (stopFeature) {
          setStopFeature(null);
        }
      });

      map.addFeatureListener(
        "pointermove",
        (feature) => {
          if (feature !== stopFeature) {
            setStopFeature(feature);
          }
        },
        () => setStopFeature(null),
        stopsLayer,
        10
      );

      map.addGeolocatorListener("change", () => {
        const position = map.geolocator.getPosition();
        const accuracy = map.geolocator.getAccuracy();
        const accuracyCoords = map.geolocator.getAccuracyGeometry().getCoordinates();
        const heading = map.geolocator.getHeading() || 0;
        dispatch(setUserLocation({ position, accuracy, accuracyCoords, heading, error: null }));
      });

      map.addGeolocatorListener(
        "change",
        () => dispatch(setCenter({ center: map.geolocator.getPosition(), zoom: 18 })),
        true
      );

      map.addGeolocatorListener("error", (error) => {
        let errorMessage;

        switch (error.code) {
          case 1:
            errorMessage =
              "Access to location services have been disabled for this site. Check " +
              "your browser location settings and try again.";
            break;
          case 3:
            errorMessage = "Could not find location after 30 seconds.";
            break;
          default:
            errorMessage = "Could not determine location.";
        }

        dispatch(
          setError({
            title: "Could not access your location",
            message: errorMessage,
          })
        );

        dispatch(
          setUserLocation({
            position: null,
            accuracy: Infinity,
            accuracyCoords: null,
            heading: null,
            error: errorMessage,
          })
        );
      });
    });

    return () => map.dispose();
  }, [mapRef.current]);

  return (
    <div
      className="Map"
      ref={mapElRef}
      onContextMenu={(event) => {
        event.preventDefault();
        const top = event.pageY;
        const left = event.pageX;
        setStopFeature(null);
        dispatch(closeMainMenu());
        dispatch(openContextMenu([top, left]));
      }}
    >
      <div
        className="controls bottom-right column"
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          title="Find my location"
          className="material-icons"
          onClick={() => {
            const center = userLocation.position;
            if (center) {
              dispatch(setCenter({ center }));
            }
          }}
        >
          my_location
        </button>

        <button
          title="Zoom to full extent"
          className="material-icons hidden-xs"
          onClick={() =>
            dispatch(setCenter({ center: initialState.center, zoom: initialState.zoom }))
          }
        >
          public
        </button>

        <button title="Zoom in" className="material-icons" onClick={() => dispatch(zoomIn())}>
          add
        </button>

        <button title="Zoom out" className="material-icons" onClick={() => dispatch(zoomOut())}>
          remove
        </button>

        <button
          title="Map info"
          className="material-icons visible-sm"
          onClick={() => {
            const attributions = renderToString(Attributions({ title: "Map data and tiles" }));
            dispatch(
              setBottomSheetContent(`
                  <div style={{ textAlign: "center" }}>
                    <div>${attributions}</div>
                    <div>Site © 2018 mystops.io</div>
                </div>
            `)
            );
          }}
        >
          info
        </button>
      </div>
      <div
        className="controls bottom-left column"
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <div className="mapbox-wordmark">
          <a
            href="https://www.mapbox.com/about/maps/"
            title="Map tiles and styling provided by Mapbox"
          >
            <img src={MAPBOX_WORDMARK_IMAGE_DATA} height="18" />
          </a>
        </div>

        <div
          ref={overviewMapRef}
          className="overview-map"
          onClick={() => {
            dispatch(setBaseLayer(mapRef.current?.nextBaseLayer));
          }}
        >
          <div className="label">Layer</div>
        </div>
      </div>

      <Attributions />

      {mapRef.current && <ContextMenu map={mapRef.current} />}
      {mapRef.current && stopFeature && <StopInfo map={mapRef.current} feature={stopFeature} />}
    </div>
  );
};

export default Map;
