import React, { useState } from "react";
import { renderToString } from "react-dom/server";

import { buffer as bufferExtent, containsExtent } from "ol/extent";

import { useAppDispatch, useAppSelector } from "../hooks";
import { closeMainMenu, setBottomSheetContent } from "../slice";

import { toggleTerm, setSubmit, resetSearchState, selectResult } from "../search/slice";

import { FEATURE_LAYER_MAX_RESOLUTION, MAPBOX_WORDMARK_IMAGE_DATA } from "./const";

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
  setCenterAndZoom,
} from "./slice";

import Attributions from "./Attributions";
import ContextMenu from "./ContextMenu";
import StopInfo from "./StopInfo";
import OpenLayersMap from "./OpenLayersMap";

import { getExtentOfCoordinates } from "./utils";

import "./Map.scss";
import { Center } from "./types";

const Map = () => {
  const [map, setMap] = useState<OpenLayersMap | null>(null);
  const mapRef = React.useRef<OpenLayersMap | null>(null);
  const mapElRef = React.useRef(null);
  const overviewMapRef = React.useRef(null);

  const [stopFeature, setStopFeature] = React.useState<any>(null);
  const [geolocatorError, setGeolocatorError] = React.useState<string | null>(null);

  const dispatch = useAppDispatch();

  const baseLayer = useAppSelector(selectBaseLayer);
  const center = useAppSelector(selectCenter);
  const zoom = useAppSelector(selectZoom);
  const extent = useAppSelector(selectExtent);
  const userLocation = useAppSelector(selectUserLocation);

  const result = useAppSelector(selectResult);

  mapRef.current = map;

  // These send dispatched signals to the OL map
  React.useEffect((): any => map?.setBaseLayer(baseLayer), [map, baseLayer]);
  React.useEffect(
    (): any => map?.setCenterAndZoom(center, zoom).catch(() => {}),
    [map, center, zoom]
  );
  React.useEffect((): any => map?.fitExtent(extent), [map, extent]);
  React.useEffect((): any => map?.showUserLocation(userLocation), [map, userLocation]);

  React.useEffect(() => {
    const map = new OpenLayersMap(mapElRef.current, overviewMapRef.current, center, zoom);
    const stopsLayer = map.getFeatureLayer("Stops");

    // map
    //   .setCenterAndZoom(center, zoom)
    //   .then(() => {
    //     map.addListener("moveend", () => {
    //       dispatch(setCenter(map.getCenter() as Center));
    //       dispatch(setZoom(map.getZoom()));
    //       dispatch(setExtent(map.getExtent()));
    //       dispatch(setResolution(map.getResolution()));
    //       dispatch(setSize(map.getSize()));
    //     });
    //
    //     map.addFeatureListener(
    //       "singleclick",
    //       (feature) => {
    //         dispatch(toggleTerm(feature.get("id").toString()));
    //         dispatch(setSubmit(true));
    //       },
    //       () => dispatch(resetSearchState()),
    //       stopsLayer
    //     );
    //
    //     map.addListener("movestart", () => {
    //       if (stopFeature) {
    //         setStopFeature(null);
    //       }
    //     });
    //
    //     map.addFeatureListener(
    //       "pointermove",
    //       (feature) => {
    //         if (feature !== stopFeature) {
    //           setStopFeature(feature);
    //         }
    //       },
    //       () => setStopFeature(null),
    //       stopsLayer,
    //       10
    //     );
    //
    //     map.addGeolocatorListener("change", () => {
    //       const position = map.geolocator.getPosition();
    //       const accuracy = map.geolocator.getAccuracy();
    //       const accuracyCoords = map.geolocator.getAccuracyGeometry().getCoordinates();
    //       const heading = map.geolocator.getHeading() || 0;
    //       dispatch(setUserLocation({ position, accuracy, accuracyCoords, heading, error: null }));
    //     });
    //
    //     map.addGeolocatorListener(
    //       "change",
    //       () => dispatch(setCenterAndZoom({ center: map.geolocator.getPosition(), zoom: 18 })),
    //       true
    //     );
    //
    //     map.addGeolocatorListener("error", (error) => {
    //       let errorMessage;
    //
    //       switch (error.code) {
    //         case 1:
    //           errorMessage =
    //             "Access to location services have been disabled for this site. Check " +
    //             "your browser location settings and try again.";
    //           break;
    //         case 3:
    //           errorMessage = "Could not find location after 30 seconds.";
    //           break;
    //         default:
    //           errorMessage = "Could not determine location.";
    //       }
    //
    //       setGeolocatorError(errorMessage);
    //
    //       dispatch(
    //         setUserLocation({
    //           position: null,
    //           accuracy: Infinity,
    //           accuracyCoords: null,
    //           heading: null,
    //           error: errorMessage,
    //         })
    //       );
    //     });
    //   })
    //   .catch(() => {});

    setMap(map);

    return () => map.cleanup();
  }, []);

  // Update extent and highlighted stops when results are updated
  React.useEffect(() => {
    if (!map) {
      return;
    }

    if (!result) {
      map.setSelectedStops([]);
      return;
    }

    const view = map.getView();
    const extent = map.getExtent();
    const resolution = map.getResolution();

    const stops = result.stops;
    const stopIDs = stops.map((stop) => stop.id);
    const coordinates = stops.map((stop) => stop.coordinates);
    const newExtent = getExtentOfCoordinates(coordinates, false);
    const doSetExtent =
      !containsExtent(extent, newExtent) || resolution > FEATURE_LAYER_MAX_RESOLUTION;

    map.setSelectedStops(stopIDs);

    if (doSetExtent) {
      const size = map.getSize();
      const newResolution = view.getResolutionForExtent(newExtent, size);
      const buffer = newResolution * 46;
      const bufferedExtent = bufferExtent(newExtent, buffer);
      dispatch(setExtent(bufferedExtent));
    }
  }, [dispatch, map, result]);

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
      {geolocatorError ? (
        <div className="geolocator-error">
          <p>{geolocatorError}</p>
          <p>
            <button
              title="Dismiss this notification"
              type="button"
              className="material-icons"
              onClick={() => {
                setGeolocatorError(null);
              }}
            >
              clear
            </button>
          </p>
        </div>
      ) : null}

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
              dispatch(setCenter(center));
            }
          }}
        >
          my_location
        </button>

        <button
          title="Zoom to full extent"
          className="material-icons hidden-xs"
          onClick={() =>
            dispatch(setCenterAndZoom({ center: initialState.center, zoom: initialState.zoom }))
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
            <img src={MAPBOX_WORDMARK_IMAGE_DATA} height="18" alt="Mapbox" />
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
