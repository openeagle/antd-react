import { useEffect, useState } from "react";
import type { HistoryNavigation } from "../polyfill/history";
import { HistoryEvent } from "../polyfill/history";

const defaultNavigation = { key: "", index: -1 };

function useNavigation() {
  const [navigation, setNavigation] = useState<HistoryNavigation>(
    history.state?.navigation || defaultNavigation
  );
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setNavigation(event.state);
    };
    const handlePushState = (event: HistoryEvent) => {
      setNavigation(event.state);
    };
    const handleReplaceState = (event: HistoryEvent) => {
      setNavigation(event.state);
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pushstate", handlePushState as any);
    window.addEventListener("replacestate", handleReplaceState as any);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pushstate", handlePushState as any);
      window.removeEventListener("replacestate", handleReplaceState as any);
    };
  }, [setNavigation]);
  return navigation;
}

export default useNavigation;
