import { CSSResultGroup } from "lit";
import { LitElement } from "lit-element";
import { getStyleSheet } from "./style";

export default class MyStopsElement extends LitElement {
  private static _styles?: CSSResultGroup;

  static get styles() {
    if (typeof MyStopsElement._styles === "undefined") {
      MyStopsElement._styles = [
        getStyleSheet(document.styleSheets[0]),
        getStyleSheet(document.styleSheets[1]),
        getStyleSheet(document.styleSheets[2]),
      ];
    }
    return MyStopsElement._styles;
  }

  dispatch(eventName: string, payload: any = undefined): boolean {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      composed: true,
      detail: payload,
    });
    return this.dispatchEvent(event);
  }
}
