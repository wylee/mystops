import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import axios from "axios";

import { DEBUG } from "../../const";

axios.defaults.headers.common["Accept"] = "application/json";

const Container = styled.div`
  padding: 120px var(--standard-spacing) 0;
`;

export default function Page() {
  const { slug } = useParams();

  const { isLoading, isError, data, error }: any = useQuery({
    retry: !DEBUG,
    queryKey: ["page"],
    queryFn: async () => {
      const response = await axios.get(`/${slug}`);
      const contentType = response.headers["content-type"];
      if (contentType !== "application/json") {
        throw new Error(`Expected a JSON response; got ${contentType}.`);
      }
      return response.data;
    },
  });

  if (isLoading) {
    return <Container>Loading page...</Container>;
  }

  if (isError) {
    return (
      <Container>
        <h2>⛔️ Could not load page ⛔️</h2>
        <p>{error.toString()}</p>
      </Container>
    );
  }

  return (
    <Container>
      <h2>{data.title}</h2>

      {data.lead ? (
        <div className="lead" dangerouslySetInnerHTML={{ __html: data.lead }} />
      ) : null}

      <div dangerouslySetInnerHTML={{ __html: data.content }} />
    </Container>
  );
}
