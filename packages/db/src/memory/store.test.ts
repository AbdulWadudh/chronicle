import { expect, test } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MEMORY } from "@chronicle/config";
import { env, resetEnvironmentCache } from "@chronicle/config/env";
import { connect } from "@lancedb/lancedb";

const scratch = join(tmpdir(), `chronicle-vectors-${Date.now()}`);
process.env.VECTOR_DB_PATH = scratch;
resetEnvironmentCache();

const { recallEpisodes, rememberEpisode } = await import("./store");

test("the test store is the scratch directory, never the real one", () => {
  expect(env().VECTOR_DB_PATH).toBe(scratch);
});

const unit = (hot: number): number[] =>
  Array.from({ length: MEMORY.dimensions }, (_, index) => (index === hot ? 1 : 0));

const episode = (turnId: string, text: string) => ({
  turnId,
  worldId: "w",
  characterId: "c",
  text,
  createdAt: 1,
});

test("a stale table with the wrong width is dropped, not appended to", async () => {
  const connection = await connect(scratch);
  await connection.createTable(MEMORY.table, [{ turnId: "old", text: "x", vector: [1, 2, 3] }]);

  await rememberEpisode(episode("t1", "the harbour bell"), unit(0));
  const table = await connection.openTable(MEMORY.table);
  expect(await table.countRows()).toBe(1);
});

test("recall is limited to the ancestry given and a rewritten turn replaces itself", async () => {
  await rememberEpisode(episode("t2", "the ledger"), unit(1));
  await rememberEpisode(episode("t3", "the sibling branch"), unit(0));
  await rememberEpisode(episode("t1", "the harbour bell, rewritten"), unit(0));

  const hits = await recallEpisodes(["t1", "t2"], unit(0), 5);
  expect(hits.map((hit) => hit.turnId).sort()).toEqual(["t1", "t2"]);
  expect(hits.find((hit) => hit.turnId === "t1")?.text).toBe("the harbour bell, rewritten");
  expect(await recallEpisodes([], unit(0), 5)).toEqual([]);
});
