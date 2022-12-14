/* Root Error */
import { Link, useRouteError } from "react-router-dom";
import styled from "styled-components";

const Main = styled.main`
  padding: var(--standard-spacing);
`;

export default function Error() {
  const error: any = useRouteError();

  return (
    <>
      <Main>
        <h2>⛔️ Error ⛔️</h2>

        <p className="lead">
          An error was encountered while attempting to load this page.
        </p>

        <p>
          Please return to the previous page using your browser&apos;s back
          button or go to the <Link to="/">home page</Link>.
        </p>

        <hr />

        <p className="small">Technical info: {error.toString()}</p>
      </Main>
    </>
  );
}
