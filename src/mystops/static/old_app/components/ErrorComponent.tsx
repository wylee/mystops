import styled from "styled-components";

import { useStateContext } from "../state";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: var(--panel-width);
  z-index: 20;

  animation: fade-in 0.75s;
  background-color: white;
  box-shadow: 1px 1px 2px;
  color: red;
  margin: 0;
  padding: var(--half-standard-spacing);
  padding-top: calc(40px + var(--standard-spacing));

  @media (min-width: 600px) {
    padding: var(--standard-spacing);
    padding-top: calc(40px + var(--twice-standard-spacing));
  }
`;

const Title = styled.div`
  font-size: 20px;
  margin-bottom: var(--standard-spacing);
`;

export default function ErrorComponent() {
  const { state } = useStateContext();
  const { error } = state;

  if (!error) {
    return null;
  }

  return (
    <Container id="error">
      <Title>{error.title}</Title>
      <div>
        <p>{error.explanation}</p>
        {error.detail ? <p>{error.detail}</p> : null}
      </div>
    </Container>
  );
}
