import styled from "styled-components";

export default styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 32px;
  height: 32px;

  margin: var(--quarter-standard-spacing);
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
`;
