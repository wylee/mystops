import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaHome, FaInfo, FaLink, FaMap, FaTimes } from "react-icons/fa";
import styled from "styled-components";

import { useStateContext } from "../state";

import MapContext from "./MapContext";

const MenuItem = styled.li``;

const MenuTitle = styled(MenuItem)``;

const MenuSection = styled(MenuItem)``;

const MenuInfo = styled(MenuItem)``;

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

            <MenuItem></MenuItem>

            <MenuSection>
              <span>Info</span>
            </MenuSection>

            <MenuInfo></MenuInfo>
          </MenuContainer>
        </>
      ) : null}
    </Container>
  );
}
