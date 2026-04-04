import { html, LitElement } from "lit-element";
import { customElement } from "lit/decorators.js";
import { provide } from "@lit/context";

import { getStyleSheet } from "./style";

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
  public appState: AppState = {};

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
