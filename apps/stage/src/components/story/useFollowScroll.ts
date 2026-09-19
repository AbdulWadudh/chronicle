import { type RefObject, useCallback, useEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 80;

export interface FollowScroll {
  ref: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}

export function useFollowScroll(): FollowScroll {
  const ref = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);

  const onScroll = useCallback(() => {
    const element = ref.current;
    if (element === null) return;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    pinnedToBottom.current = distanceFromBottom <= BOTTOM_THRESHOLD;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    let frame = 0;
    const stick = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (pinnedToBottom.current) element.scrollTop = element.scrollHeight;
      });
    };

    const observer = new MutationObserver(stick);
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    stick();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, onScroll };
}
