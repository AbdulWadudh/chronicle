import type { KeyboardEvent, RefObject } from "react";
import { useState } from "react";
import type { CharacterSummary } from "~/lib/entities";

export interface ComposerMentionState {
  mentionQuery: string | null;
  mentionIndex: number;
  mentionedIds: readonly string[];
  detectMention: (text: string, cursor: number) => void;
  insertMention: (
    character: CharacterSummary,
    draft: string,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
  ) => string;
  handleKeyDown: (
    event: KeyboardEvent<HTMLTextAreaElement>,
    filtered: readonly CharacterSummary[],
    onSelect: (character: CharacterSummary) => void,
  ) => boolean;
  clearMention: () => void;
}

export function useComposerMention(): ComposerMentionState {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);

  function detectMention(text: string, cursor: number): void {
    const textBefore = text.slice(0, cursor);
    const match = /(?:^|\s)@([a-zA-Z0-9_ ]*)$/u.exec(textBefore);
    if (match !== null && match[1] !== undefined) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(
    character: CharacterSummary,
    draft: string,
    textareaRef: RefObject<HTMLTextAreaElement | null>,
  ): string {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? draft.length;
    const textBefore = draft.slice(0, cursor);
    const textAfter = draft.slice(cursor);
    const match = /(?:^|\s)@([a-zA-Z0-9_ ]*)$/u.exec(textBefore);
    if (match === null) return draft;

    const startIdx = match.index + (match[0].startsWith(" ") ? 1 : 0);
    const inserted = `@${character.name} `;
    const updated = textBefore.slice(0, startIdx) + inserted + textAfter;
    setMentionQuery(null);
    setMentionedIds((prev) => (prev.includes(character.id) ? prev : [...prev, character.id]));

    const nextPos = startIdx + inserted.length;
    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(nextPos, nextPos);
      }
    });

    return updated;
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    filtered: readonly CharacterSummary[],
    onSelect: (character: CharacterSummary) => void,
  ): boolean {
    if (mentionQuery === null || filtered.length === 0) return false;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMentionIndex((index) => (index + 1) % filtered.length);
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMentionIndex((index) => (index - 1 + filtered.length) % filtered.length);
      return true;
    }
    if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey) {
      event.preventDefault();
      const selected = filtered[mentionIndex] ?? filtered[0];
      if (selected) onSelect(selected);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMentionQuery(null);
      return true;
    }
    return false;
  }

  function clearMention(): void {
    setMentionQuery(null);
    setMentionIndex(0);
    setMentionedIds([]);
  }

  return {
    mentionQuery,
    mentionIndex,
    mentionedIds,
    detectMention,
    insertMention,
    handleKeyDown,
    clearMention,
  };
}
