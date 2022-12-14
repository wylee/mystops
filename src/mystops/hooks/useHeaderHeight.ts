import { useEffect, useState } from "react";

export default function useHeaderHeight() {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.getElementsByTagName("header")[0];
    setHeaderHeight(header.clientHeight);
  }, []);

  return headerHeight;
}
