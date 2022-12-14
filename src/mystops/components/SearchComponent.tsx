import { FaSearch, FaTimes } from "react-icons/fa";
import styled from "styled-components";

import { useStateContext } from "../state";

import IconButton from "./IconButton";

const Container = styled.div`
  position: absolute;
  width: var(--panel-width);
  z-index: 30;

  @media (max-width: 599px) {
    width: 100%;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: row;

  position: absolute;
  top: var(--quarter-standard-spacing);
  left: var(--quarter-standard-spacing);
  right: var(--quarter-standard-spacing);
  width: auto;
  z-index: 10;

  margin: 0;
  padding: 0;

  background-color: white;
  border: 1px solid #f0f0f0;
  border-radius: 2px;
  box-shadow: 1px 1px 2px;

  @media (min-width: 600px) {
    top: var(--standard-spacing);
    left: var(--standard-spacing);
    right: auto;
    width: calc(var(--panel-width) - var(--twice-standard-spacing));
  }

  input {
    border: none;
    flex: 1;
    font-size: 14px;
    line-height: 22px;
    height: 40px;
    min-width: 10em;
    outline: 0;
    margin: 0;
    padding: 0 var(--quarter-standard-spacing) 0
      calc(32px + var(--half-standard-spacing));

    @media (min-width: 600px) {
      font-size: 16px;
    }
  }

  span {
    color: gray;
    font-size: 22px;
    line-height: 1;
    margin: 4px 0;
  }
`;

export default function SearchComponent() {
  const { state, dispatch } = useStateContext();
  const { term, error } = state;

  const handleInput = (event) => {
    const newTerm = event.target.value;
    if (newTerm) {
      dispatch({ type: "SET_TERM", payload: newTerm });
      // NOTE: Typing cancels the current query
      dispatch({ type: "DO_ARRIVALS_QUERY", payload: false });
    } else {
      dispatch({ type: "RESET" });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // NOTE: This forces a re-submit
    dispatch({ type: "DO_ARRIVALS_QUERY", payload: false });
    setTimeout(() => dispatch({ type: "DO_ARRIVALS_QUERY", payload: true }), 0);
  };

  const handleReset = () => dispatch({ type: "RESET" });

  return (
    <Container id="search">
      <Form onSubmit={handleSubmit}>
        <input
          name="term"
          type="text"
          title="Enter a stop ID"
          placeholder="Enter a stop ID"
          autoFocus
          value={term}
          onInput={handleInput}
        />

        <IconButton type="submit" title="Search" disabled={!term.trim()}>
          <FaSearch />
        </IconButton>

        <IconButton
          type="reset"
          title="Clear"
          disabled={!(term || error)}
          onClick={handleReset}
        >
          <FaTimes />
        </IconButton>
      </Form>
    </Container>
  );
}
