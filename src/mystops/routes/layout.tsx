/* Root Layout */
import { Link, Outlet } from "react-router-dom";
import styled from "styled-components";

const Header = styled.header`
  position: absolute;

  top: auto;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.75);

  h1 {
    font-size: 20px;
    font-weight: normal;
    line-height: 1;
    margin: 0;
    padding: var(--half-standard-spacing);
    > a {
      color: #4a4a4a;
      font-size: 20px;
      line-height: 1;
      text-decoration: none;
      text-shadow: 1px 1px 2px;
    }
  }

  @media (max-width: 240px) {
    display: none;
  }

  @media (min-width: 600px) {
    top: 0;
    bottom: auto;
    justify-content: flex-end;
    h1 {
      font-size: 24px;
      padding: 24px 16px;
      > a {
        font-size: 24px;
      }
    }
  }
`;

const Main = styled.main`
  width: 100%;
  height: 100%;
`;

export default function Layout() {
  return (
    <>
      <Header>
        <h1>
          <Link to="/">MyStops</Link>
        </h1>
      </Header>

      <Main>
        <Outlet />
      </Main>
    </>
  );
}
