import { customElement, property } from "lit/decorators.js";
import { css, html, LitElement } from "lit-element";
import { getStyleSheet } from "../style";

@customElement("icon-button")
class IconButton extends LitElement {
  static styles = [
    getStyleSheet(document.styleSheets[0]),
    getStyleSheet(document.styleSheets[1]),
    getStyleSheet(document.styleSheets[2]),

    css`
      button {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        width: 32px;
        height: 32px;

        margin: 0;
        padding: 0;

        background-color: white;
        color: var(--link-color);

        border: 1px solid white;
        border-radius: 1px;

        font-size: 16px;
        line-height: 1;

        &:hover {
          border: 1px solid #f0f0f0;
          box-shadow: 1px 1px 2px;
          cursor: pointer;
        }

        &:disabled {
          color: gray;
          cursor: auto;
          border: none;
          box-shadow: none;
          cursor: auto;
        }
      }
    `,
  ];

  @property() icon: string;
  @property() type: string = "button";
  @property() text?: string;

  render() {
    return html`
      <button type="${this.type}">
        <i class="bi bi-${this.icon}"></i>
        ${this.text ? this.text : null}
      </button>
    `;
  }
}
