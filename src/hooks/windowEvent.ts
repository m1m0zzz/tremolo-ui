import { DependencyList, useEffect } from "react";

export const useWindowEvent = <K extends keyof WindowEventMap>(
  type: K,
  listener: (this: Window, event: WindowEventMap[K]) => any,
  deps?: DependencyList,
  options?: boolean | AddEventListenerOptions
) => {
  return useEffect(() => {
    if (window) {
      window.addEventListener(type, listener, options);
      return () => {
        window.removeEventListener(type, listener, options);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
