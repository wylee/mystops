import * as React from "react";

import { DISCLAIMER } from "./const";
import { useAppDispatch, useAppSelector } from "./hooks";
import { closeMainMenu, selectMainMenuOpen, toggleMainMenu } from "./slice";

import { BASE_LAYER_LABELS } from "./map/const";
import { setBaseLayer, selectBaseLayer } from "./map/slice";

import "./Menu.scss";

const Menu = () => {
  const dispatch = useAppDispatch();
  const menuOpen = useAppSelector(selectMainMenuOpen);
  const baseLayer = useAppSelector(selectBaseLayer);
  const menuRef = React.useRef(null);

  return (
    <div className="Menu" style={{ right: menuOpen ? 0 : "auto" }}>
      <button
        type="button"
        title={menuOpen ? "Hide menu" : "Show menu"}
        className="material-icons"
        onClick={() => dispatch(toggleMainMenu())}
      >
        {menuOpen ? "close" : "menu"}
      </button>

      <div
        className="menu-backdrop"
        onClick={() => dispatch(closeMainMenu())}
        style={{ display: menuOpen ? "block" : "none" }}
      />

      <ul
        className="menu"
        ref={menuRef}
        style={{ display: menuOpen ? "block" : "none" }}
        onClick={(event: any) => {
          let target = event.target;
          while (target.tagName !== "A") {
            target = target.parentNode;
            if (target === null || target === menuRef.current) {
              return false;
            }
          }
          if (!target.classList.contains("regular-link")) {
            event.preventDefault();
          }
          dispatch(closeMainMenu());
          return true;
        }}
      >
        <li className="title">MyStops</li>

        <li>
          <a href="/" className="regular-link">
            <span className="material-icons">home</span>
            <span>Home</span>
          </a>
        </li>

        {BASE_LAYER_LABELS.map((label) => {
          return (
            <li key={label}>
              {label === baseLayer ? (
                <div>
                  <span className="material-icons">layers</span>
                  <span>{label}</span>
                </div>
              ) : (
                <a
                  href="#switch-base-layer"
                  onClick={() => {
                    dispatch(setBaseLayer(label));
                  }}
                >
                  <span className="material-icons">layers</span>
                  <span>{label}</span>
                </a>
              )}
            </li>
          );
        })}

        <li className="section-heading">
          <span>Links</span>
        </li>

        <li>
          <a href="https://trimet.org/" className="regular-link">
            <span className="material-icons">link</span>
            <span>TriMet</span>
          </a>
        </li>

        <li className="section-heading">
          <span>Info</span>
        </li>

        <li className="info">
          <div>
            <p dangerouslySetInnerHTML={{ __html: DISCLAIMER }} />
            <p>&copy; 2018 mystops.io</p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Menu;
