import { html, LitElement } from "lit-element";
import { customElement } from "lit/decorators.js";
import { provide } from "@lit/context";

import { transform } from "ol/proj";

import { getStyleSheet } from "./style";

import { GEOGRAPHIC_PROJECTION, NATIVE_PROJECTION } from "./const";
import { appStateContext } from "./context";
import { AppState } from "./interfaces";

import ArrivalsService from "./services/arrivals-service";
import MapService from "./services/map-service";

import "./components/icon-button";
import "./components/map";
import "./components/menu";

@customElement("mystops-app")
class AppElement extends LitElement {
  static styles = [
    getStyleSheet(document.styleSheets[0]),
    getStyleSheet(document.styleSheets[1]),
    getStyleSheet(document.styleSheets[2]),
  ];

  private arrivals: ArrivalsService = new ArrivalsService();
  private map: MapService = new MapService();

  @provide({ context: appStateContext })
  public appState: AppState = {
    selectedStops: [],
    deselectedStops: [],
    term: undefined,
  };

  connectedCallback() {
    super.connectedCallback();

    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) {
      return;
    }

    shadowRoot.addEventListener("reset", () => {
      this.appState = {
        ...this.appState,
        selectedStops: [],
        deselectedStops: this.appState.selectedStops,
        term: undefined,
      };
    });

    shadowRoot.addEventListener("toggle-stop", (event: CustomEvent) => {
      console.log(event);
      const selectedStops = this.appState.selectedStops;
      const deselectedStops = this.appState.deselectedStops;

      const feature = event.detail.feature;
      const stopId = feature.get("id");
      const geom = feature.getGeometry();
      const coordinates = transform(
        geom.getCoordinates(),
        NATIVE_PROJECTION,
        GEOGRAPHIC_PROJECTION,
      );
      const stop = { id: stopId, name: "", coordinates, routes: [] };

      const index = selectedStops.findIndex((stop) => stop.id === stopId);
      if (index === -1) {
        selectedStops.push(stop);
      } else {
        selectedStops.splice(index, 1);
        deselectedStops.push(stop);
      }

      selectedStops.sort((a, b) => a.id - b.id);
      deselectedStops.sort((a, b) => a.id - b.id);

      const term = selectedStops.length
        ? selectedStops.map((stop) => stop.id).join(", ")
        : undefined;

      this.appState = { ...this.appState, selectedStops, deselectedStops, term };
    });
  }

  render() {
    return html`
      <mystops-menu .map="${this.map}"></mystops-menu>
      <!-- SEARCH COMPONENT -->
      <!-- RESULT COMPONENT -->
      <!-- ERROR COMPONENT -->
      <mystops-map .arrivals="${this.arrivals}" .map="${this.map}"></mystops-map>
    `;
  }
}
