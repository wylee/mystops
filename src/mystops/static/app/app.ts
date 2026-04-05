import { html } from "lit-element";
import { customElement } from "lit/decorators.js";
import { provide } from "@lit/context";

import { transform } from "ol/proj";

import { GEOGRAPHIC_PROJECTION, NATIVE_PROJECTION } from "./const";
import { appStateContext } from "./context";
import { AppState } from "./interfaces";

import ArrivalsService from "./services/arrivals-service";
import MapService from "./services/map-service";

import MyStopsElement from "./element";

import "./components/map";
import "./components/menu";
import "./components/result";
import "./components/search";

@customElement("mystops-app")
class AppElement extends MyStopsElement {
  private arrivals: ArrivalsService = new ArrivalsService(this);
  private map: MapService = new MapService();

  @provide({ context: appStateContext })
  public appState: AppState = {
    selectedStops: [],
    deselectedStops: [],
    term: "",
    result: undefined,
  };

  constructor() {
    super();

    this.addEventListener("set-term", (event: CustomEvent) => {
      const oldTerm = this.appState.term;
      const newTerm = event.detail.trim();
      if (newTerm !== oldTerm) {
        this.appState = { ...this.appState, term: newTerm };
      }
    });

    this.addEventListener("query-arrivals", (event: CustomEvent) => {
      console.log("query-arrivals");
      this.arrivals.start(this.appState.term);
    });

    this.addEventListener("set-result", (event: CustomEvent) => {
      this.appState = { ...this.appState, result: event.detail };
    });

    this.addEventListener("set-error", (event: CustomEvent) => {
      this.appState = { ...this.appState, result: event.detail, error: event.detail };
    });

    this.addEventListener("reset", () => {
      this.appState = {
        ...this.appState,
        selectedStops: [],
        deselectedStops: this.appState.selectedStops,
        term: "",
        result: undefined,
        error: undefined,
      };
      this.arrivals.reset();
      this.map.reset();
    });

    this.addEventListener("toggle-stop", (event: CustomEvent) => {
      const selectedStops = this.appState.selectedStops;
      const deselectedStops = this.appState.deselectedStops;

      const feature = event.detail;
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

      const term = selectedStops.map((stop) => stop.id).join(", ");

      this.appState = { ...this.appState, selectedStops, deselectedStops };
      this.dispatch("set-term", term);
      this.dispatch("query-arrivals");
    });
  }

  render() {
    return html`
      <mystops-menu .map="${this.map}"></mystops-menu>
      <mystops-search></mystops-search>
      <mystops-result></mystops-result>
      <!-- ERROR COMPONENT -->
      <mystops-map .map="${this.map}"></mystops-map>
    `;
  }
}
