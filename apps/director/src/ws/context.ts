import type { ChronicleDatabase } from "@chronicle/db";
import type { Character, TurnNode, World, WorldState } from "@chronicle/utils";

export interface TurnContext {
  db: ChronicleDatabase;
  world: World;
  character: Character;
  state: WorldState;
  ancestry: readonly TurnNode[];
  branchIndex: number;
}
