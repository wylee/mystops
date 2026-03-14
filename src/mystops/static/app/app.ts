import { html, LitElement } from "lit-element";
import { customElement } from "lit/decorators.js";

import MapService from "./services/map-service";
import { getStyleSheet, iconButton } from "./style";
import "./components/map";
import "./components/menu";

@customElement("mystops-app")
class AppElement extends LitElement {
  static styles = [
    getStyleSheet(document.styleSheets[0]),
    getStyleSheet(document.styleSheets[1]),
    getStyleSheet(document.styleSheets[2]),
    iconButton,
  ];

  private map: MapService = new MapService();

  render() {
    return html`
      <mystops-menu .map="${this.map}"></mystops-menu>
      <!-- SEARCH COMPONENT -->
      <!-- RESULT COMPONENT -->
      <!-- ERROR COMPONENT -->
      <!-- MAP COMPONENT -->
      <mystops-map .map="${this.map}"></mystops-map>
    `;
  }
}
