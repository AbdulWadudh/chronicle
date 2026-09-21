import { AtSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { CSSProperties } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { CharacterSummary } from "~/lib/entities";

export interface MentionMenuProps {
  characters: readonly CharacterSummary[];
  query: string;
  selectedIndex: number;
  onSelect: (character: CharacterSummary) => void;
}

export function MentionMenu({ characters, query, selectedIndex, onSelect }: MentionMenuProps) {
  const filtered = characters.filter((character) =>
    character.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Mention a character"
      className="flex flex-col gap-1.5 rounded-card border-(length:--border-width-card) border-primary/35 bg-raised/95 p-2.5 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-1.5 px-1 py-0.5 text-[0.6875rem] font-medium text-text-accent">
        <HugeiconsIcon icon={AtSignIcon} size={11} strokeWidth={2} />
        <span>Characters in this world</span>
      </div>
      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {filtered.map((character, index) => {
          const selected = index === selectedIndex;
          const initials = character.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2);

          return (
            <button
              key={character.id}
              type="button"
              role="option"
              aria-selected={selected}
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(character);
              }}
              style={{ "--rise-index": index } as CSSProperties}
              className={`pressable flex items-center gap-2 rounded-control border-(length:--border-width-card) px-2 py-1 text-left transition-colors motion-reduce:transition-none ${
                selected
                  ? "border-primary/60 bg-linear-to-r from-primary/20 via-accent/12 to-primary/5 text-text-primary"
                  : "border-primary/15 bg-linear-to-r from-primary/8 via-accent/4 to-transparent text-text-secondary hover:border-primary/45 hover:text-text-primary"
              }`}
            >
              <Avatar className="size-6.5 shrink-0 rounded-control border-hairline">
                <AvatarImage
                  src={character.portraitUrl ?? undefined}
                  alt={character.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-[0.625rem] font-bold">{initials}</AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[0.8125rem] font-medium text-text-primary">
                  {character.name}
                </span>
                {character.bio.length > 0 ? (
                  <span className="truncate text-[0.6875rem] text-text-muted">{character.bio}</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
