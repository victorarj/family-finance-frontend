import { useEffect, useState } from "react";

export type ViewportMode = "mobile" | "tablet" | "desktop";

const TABLET_QUERY = "(min-width: 768px)";
const DESKTOP_QUERY = "(min-width: 1024px)";

function getViewportMode(): ViewportMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "mobile";
  }

  if (window.matchMedia(DESKTOP_QUERY).matches) {
    return "desktop";
  }

  if (window.matchMedia(TABLET_QUERY).matches) {
    return "tablet";
  }

  return "mobile";
}

export function useViewportMode() {
  const [mode, setMode] = useState<ViewportMode>(() => getViewportMode());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const tabletQuery = window.matchMedia(TABLET_QUERY);
    const desktopQuery = window.matchMedia(DESKTOP_QUERY);
    const updateMode = () => setMode(getViewportMode());

    updateMode();

    tabletQuery.addEventListener("change", updateMode);
    desktopQuery.addEventListener("change", updateMode);

    return () => {
      tabletQuery.removeEventListener("change", updateMode);
      desktopQuery.removeEventListener("change", updateMode);
    };
  }, []);

  return mode;
}
