import { useEffect, useState } from "react";
import type { HistoryNavigation } from "history-event";
import { HistoryEvent, getCurrentNavigation } from "history-event";

function useNavigation() {
  const [navigation, setNavigation] = useState<HistoryNavigation>(
    getCurrentNavigation()
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
