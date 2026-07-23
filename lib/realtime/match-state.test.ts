import assert from "node:assert/strict";
import test from "node:test";
import type { AuthoritativeMatchState, NormalizedGameData } from "./types";
import { activeMatchState, changedGame, companionIsLive, effectiveMatchState, endedMatchState, gameFromMatchState, waitingMatchState } from "./match-state";

const game = (gameId = "game-1", gameTime = 210, updatedAt = new Date(1_700_000_000_000).toISOString()): NormalizedGameData => ({
  gameId, gameTime, updatedAt, gameMode: "CLASSIC", mapName: "Summoner's Rift",
  activePlayer: { summonerName: "Support", championName: "Nautilus", level: 4, team: "ORDER" },
  players: [], events: [],
});

test("companion before match remains waiting", () => assert.equal(companionIsLive(waitingMatchState()), false));
test("companion waiting before match becomes live when the shared snapshot arrives", () => {
  const before = waitingMatchState();
  const after = activeMatchState(game());
  assert.equal(companionIsLive(before), false);
  assert.equal(companionIsLive(after), true);
});
test("persisted match is sufficient for a late join", () => assert.equal(companionIsLive(activeMatchState(game())), true));
test("refresh restores live data from the persisted snapshot", () => assert.equal(gameFromMatchState(activeMatchState(game()))?.gameId, "game-1"));
test("reconnect remains live with the same snapshot", () => assert.equal(companionIsLive(activeMatchState(game("game-1", 240))), true));
test("gameId and finite gameTime activate companion live mode", () => assert.equal(companionIsLive(activeMatchState(game("game-1", 0))), true));
test("missing gameId remains waiting", () => assert.equal(companionIsLive({ ...activeMatchState(game()), gameId: null }), false));
test("active data becomes stale after ten seconds", () => assert.equal(effectiveMatchState(activeMatchState(game()), 1_700_000_010_001).phase, "stale"));
test("match end produces ended and stops live mode", () => {
  const ended = endedMatchState(activeMatchState(game()), new Date(1_700_000_020_000).toISOString());
  assert.equal(ended.phase, "ended");
  assert.equal(companionIsLive(ended), false);
});
test("new game id is detected so old match UI can reset", () => assert.equal(changedGame(activeMatchState(game()), activeMatchState(game("game-2"))), true));
test("commander and companion share canonical camelCase fields", () => {
  const state: AuthoritativeMatchState = activeMatchState(game());
  assert.deepEqual(Object.keys(state), ["gameId", "gameTime", "phase", "connectorStatus", "updatedAt", "liveMatchData", "activeCall", "summonerTimers"]);
});
