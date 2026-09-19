import { type RefObject, useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from "react-native";

const BOTTOM_THRESHOLD = 80;

export interface FollowScroll {
  ref: RefObject<ScrollView | null>;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onContentSizeChange: () => void;
}

export function useFollowScroll(): FollowScroll {
  const ref = useRef<ScrollView>(null);
  const pinnedToBottom = useRef(true);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    pinnedToBottom.current = distanceFromBottom <= BOTTOM_THRESHOLD;
  }, []);

  const onContentSizeChange = useCallback(() => {
    if (pinnedToBottom.current) ref.current?.scrollToEnd({ animated: false });
  }, []);

  return { ref, onScroll, onContentSizeChange };
}
