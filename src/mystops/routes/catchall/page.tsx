/* Catchall Page (default 404 page) */
import styled from "styled-components";
import { useHeaderHeight } from "../../hooks";

const Container = styled.div`
  padding: var(--standard-spacing);
`;

export default function Page() {
  const headerHeight = useHeaderHeight();

  return (
    <Container
      style={{
        paddingTop: `calc(${headerHeight}px + var(--standard-spacing))`,
      }}
    >
      <h2>⛔️ Not Found ⛔️</h2>
      <p>The requested page wasn&apos;t found.</p>
      <p>
        Please re-check the address or visit our <a href="/">home page</a>.
      </p>
    </Container>
  );
}
