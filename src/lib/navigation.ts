import { useEffect, useState } from "react";

export const currentPathWithSearch = () =>
  `${window.location.pathname}${window.location.search}`;
export let catalogueReturnPosition: { path: string; scrollY: number } | null =
  null;
export const rememberCataloguePosition = (path: string, scrollY: number) => {
  catalogueReturnPosition = { path, scrollY };
};
export const clearCatalogueReturnPosition = () => {
  catalogueReturnPosition = null;
};

export function navigate(
  path: string,
  state: Record<string, string> = {},
  scroll: "top" | "preserve" = "top",
) {
  window.history.pushState(state, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (scroll === "top") window.scrollTo({ top: 0, behavior: "smooth" });
}

export function usePath() {
  const [path, setPath] = useState(currentPathWithSearch);
  useEffect(() => {
    const update = () => setPath(currentPathWithSearch());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path;
}
