import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { useSentenceReveal } from "./useSentenceReveal";

export interface NarrativeStreamProps {
  text: string;
  cinemaMode: boolean;
  playingSentenceIndex: number | null;
  onSkip?: () => void;
}

export function NarrativeStream({
  text,
  cinemaMode,
  playingSentenceIndex,
  onSkip,
}: NarrativeStreamProps) {
  const reduceMotion = useReducedMotion();
  const reveal = useSentenceReveal(text, cinemaMode, playingSentenceIndex);

  function skip(): void {
    reveal.revealAll();
    onSkip?.();
  }

  return (
    <Pressable
      onPress={skip}
      disabled={reveal.isComplete}
      accessibilityRole="button"
      accessibilityLabel="Reveal the full passage"
      accessibilityHint="Shows all remaining text immediately"
    >
      <View className="gap-2 rounded-2xl border border-card-border bg-card p-5">
        {reveal.sentences.slice(0, reveal.revealedCount).map((sentence, index) => (
          <Animated.View
            key={sentence.key}
            entering={reduceMotion ? undefined : FadeIn.duration(220)}
          >
            <Text
              className={
                cinemaMode && index === playingSentenceIndex
                  ? "text-base leading-7 text-text-primary"
                  : "text-base leading-7 text-text-secondary"
              }
            >
              {sentence.text}
            </Text>
          </Animated.View>
        ))}

        {!reveal.isComplete ? (
          <Text className="pt-1 text-xs text-text-muted">Tap to reveal the rest</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
