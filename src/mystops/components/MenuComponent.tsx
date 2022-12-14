import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaInfo, FaLink, FaMap, FaTimes } from "react-icons/fa";
import styled from "styled-components";

import { useStateContext } from "../state";

import IconButton from "./IconButton";
import MapContext from "./MapContext";

const Container = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
`;

const ToggleButton = styled(IconButton)`
  position: absolute;
  top: var(--quarter-standard-spacing);
  left: var(--quarter-standard-spacing);
  z-index: 3;

  @media (min-width: 600px) {
    top: var(--standard-spacing);
    left: var(--standard-spacing);
  }
`;

const Backdrop = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  animation: fade-in 0.5s;
  background-color: rgba(0, 0, 0, 0.25);
`;

const MenuContainer = styled.ul`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--menu-width);
  overflow: auto;
  z-index: 2;

  margin: 0;
  padding-left: 0;

  animation: fade-in 0.5s;
  background-color: white;
  border-radius: 2px;
  box-shadow: 2px 2px 4px;
  list-style: none;
`;

const MenuItem = styled.li`
  border-bottom: 1px solid #e0e0e0;

  margin: 0;
  padding: 0;

  &:hover {
    background-color: #f8f8f8;
  }

  &:last-child {
    border-bottom: none;
  }

  // Each menu item must contain a top level wrapper element
  > * {
    color: var(--text-color);

    display: flex;
    flex-direction: row;
    align-items: center;

    line-height: 24px;
    margin: 0;
    padding: var(--standard-spacing);
    text-decoration: none;

    > * {
      margin-right: var(--half-standard-spacing);
      &:last-child {
        margin-right: 0;
      }
    }
  }

  a {
    color: var(--link-color);
  }
`;

const MenuTitle = styled(MenuItem)`
  color: lighten(var(--text-color), 10%);
  font-size: 16px;
  font-weight: normal;
  line-height: 1;
  margin: 0;
  padding: var(--standard-spacing);
  text-shadow: 1px 1px 2px;

  a {
    color: lighten(var(--text-color), 10%);
    text-decoration: none;
  }

  @media (min-width: 600px) {
    font-size: 24px;
    padding: calc(var(--standard-spacing) + var(--half-standard-spacing))
      var(--standard-spacing);
  }

  text-align: right;

  &:hover {
    background-color: white;
  }
`;

const MenuSection = styled(MenuItem)`
  font-weight: bold;
  background-color: #f0f0f0;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const MenuInfo = styled(MenuItem)`
  color: gray;
  font-size: 90%;
  font-style: italic;

  &:hover {
    background-color: white;
  }

  > * {
    flex-direction: column;
    align-items: flex-start;
    line-height: 1.25;
    > * {
      margin: 0 0 var(--standard-spacing) 0;
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
`;

const siteLinks = [
  { path: "/", icon: <FaHome />, text: "Home" },
  { path: "/about", icon: <FaInfo />, text: "About" },
];

export default function MenuComponent() {
  const { state, dispatch } = useStateContext();
  const location = useLocation();
  const map = useContext(MapContext);
  const closeMenu = () => dispatch({ type: "CLOSE_MENU" });
  const toggleMenu = () => dispatch({ type: "TOGGLE_MENU" });
  const { menuOpen } = state;

  return (
    <Container id="main-menu" style={{ right: menuOpen ? 0 : "auto" }}>
      <ToggleButton
        type="button"
        title={menuOpen ? "Close menu" : "Open menu"}
        onClick={toggleMenu}
      >
        {menuOpen ? <FaTimes /> : <FaBars />}
      </ToggleButton>

      {menuOpen ? (
        <>
          <Backdrop onClick={closeMenu} />

          <MenuContainer>
            <MenuTitle>MyStops</MenuTitle>

            {siteLinks.map((link) => {
              return (
                <MenuItem key={link.path}>
                  {location.pathname === link.path ? (
                    <span>
                      {link.icon}
                      <span>{link.text}</span>
                    </span>
                  ) : (
                    <Link to={link.path} onClick={() => closeMenu()}>
                      {link.icon}
                      <span>{link.text}</span>
                    </Link>
                  )}
                </MenuItem>
              );
            })}

            {map ? (
              <MenuSection>
                <span>Map Layers</span>
              </MenuSection>
            ) : null}

            {map?.getBaseLayers().map((layer, i) => {
              return (
                <MenuItem key={i}>
                  {i === map?.baseLayer ? (
                    <div>
                      <FaMap />
                      <span>{layer.get("label")}</span>
                    </div>
                  ) : (
                    <a
                      href={`#set-base-layer`}
                      onClick={(event) => {
                        event.preventDefault();
                        map?.setBaseLayer(i);
                        closeMenu();
                      }}
                    >
                      <FaMap />
                      <span>{layer.get("label")}</span>
                    </a>
                  )}
                </MenuItem>
              );
            })}

            <MenuSection>
              <span>Links</span>
            </MenuSection>

            <MenuItem>
              <a href="https://trimet.org/" className="regular-link">
                <FaLink />
                <span>TriMet</span>
              </a>
            </MenuItem>

            <MenuSection>
              <span>Info</span>
            </MenuSection>

            <MenuInfo>
              <div>
                <p>
                  Arrival data provided by
                  <a href="https://developer.trimet.org/">TriMet</a>
                </p>

                <p>
                  Map data &copy; <a href="https://mapbox.com/">Mapbox</a> and{" "}
                  <a href="https://openstreetmap.org/">OpenStreetMap</a>
                </p>

                <p>
                  This application is currently in the initial stages of
                  development and <i>should not</i> be considered a reliable
                  source for TriMet arrival times or any other information.
                  Arrival times and other information <i>should</i> be verified
                  via{" "}
                  <a href="https://trimet.org/">
                    TriMet&apos;s official TransitTracker™
                  </a>{" "}
                  or by other means.
                </p>
                <p>
                  Contact:{" "}
                  <a href="mailto:contact@mystops.io">contact@mystops.io</a>
                </p>
                <p>&copy; 2018, 2021, 2022 mystops.io</p>
              </div>
            </MenuInfo>
          </MenuContainer>
        </>
      ) : null}
    </Container>
  );
}
