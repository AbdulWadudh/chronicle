import { type RefObject, useEffect, useRef, useState } from "react";

export interface TopLayer<T extends HTMLElement> {
  anchorRef: RefObject<T | null>;
  container: HTMLElement | undefined;
}

export function useTopLayer<T extends HTMLElement>(): TopLayer<T> {
  const anchorRef = useRef<T>(null);
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);

  useEffect(() => {
    setContainer(anchorRef.current?.closest("dialog") ?? undefined);
  }, []);

  return { anchorRef, container };
}
