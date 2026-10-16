import { LabeledRow } from "~/components/common/FormRow";
import { VoicePicker } from "~/components/common/VoicePicker";
import { useVoices } from "~/hooks/useVoices";

export interface VoiceSelectProps {
  value: string | null;
  label: string;
  blurb: string;
  ariaLabel: string;
  allowInherit?: boolean;
  onValueChange: (value: string | null) => void;
}

export function VoiceSelect({
  value,
  label,
  blurb,
  ariaLabel,
  allowInherit = false,
  onValueChange,
}: VoiceSelectProps) {
  const { byId, loading, error } = useVoices();
  const selected = value === null ? null : (byId.get(value) ?? null);

  const description =
    error !== null
      ? "Kokoro is unreachable, so no voice can be chosen."
      : loading
        ? "Reading Kokoro's installed voices…"
        : selected === null
          ? blurb
          : `${selected.locale}, ${selected.gender.toLowerCase()}${selected.grade === null ? "" : `, graded ${selected.grade}`}. Hover the play icon to hear it.`;

  return (
    <LabeledRow label={label} blurb={description}>
      <VoicePicker
        value={value}
        ariaLabel={ariaLabel}
        allowInherit={allowInherit}
        onValueChange={onValueChange}
      />
    </LabeledRow>
  );
}
