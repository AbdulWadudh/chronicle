import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef } from "react";

const BOTTOM_THRESHOLD = 80;
const TOP_THRESHOLD = 240;

export interface FollowScrollOptions {
  count: number;
  onReachTop: () => void;
}

export interface FollowScroll {
  ref: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  stickToBottom: () => void;
}

export function useFollowScroll({ count, onReachTop }: FollowScrollOptions): FollowScroll {
  const ref = useRef<HTMLDivElement>(null);
  const pinnedToBottom = useRef(true);
  const stuckAt = useRef(0);
  const anchorFromBottom = useRef<number | null>(null);

  const onScroll = useCallback(() => {
    const element = ref.current;
    if (element === null) return;

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const scrolledUp = element.scrollTop < stuckAt.current - 1;
    pinnedToBottom.current = scrolledUp ? false : distanceFromBottom <= BOTTOM_THRESHOLD;
    stuckAt.current = element.scrollTop;

    if (element.scrollTop > TOP_THRESHOLD) return;
    anchorFromBottom.current = element.scrollHeight - element.scrollTop;
    onReachTop();
  }, [onReachTop]);

  useLayoutEffect(() => {
    const element = ref.current;
    const anchor = anchorFromBottom.current;
    if (count === 0 || element === null || anchor === null) return;
    anchorFromBottom.current = null;
    element.scrollTop = element.scrollHeight - anchor;
    stuckAt.current = element.scrollTop;
  }, [count]);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    let frame = 0;
    const stick = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!pinnedToBottom.current || anchorFromBottom.current !== null) return;
        element.scrollTop = element.scrollHeight;
        stuckAt.current = element.scrollTop;
      });
    };

    const observer = new MutationObserver(stick);
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    stick();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const stickToBottom = useCallback(() => {
    const element = ref.current;
    if (element === null) return;
    pinnedToBottom.current = true;
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
      stuckAt.current = element.scrollTop;
    });
  }, []);

  return { ref, onScroll, stickToBottom };
}
