import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGameData } from "./normalize-game-data.js";

const player=(index:number,team:"ORDER"|"CHAOS")=>({
  summonerName:`Player ${index}`,championName:`Champion${index}`,championID:100+index,team,level:index,
  summonerSpells:{summonerSpellOne:{displayName:index===7?"Smite":"Flash"},summonerSpellTwo:{displayName:index%2?"Teleport":"Ignite"}},
  items:[{itemID:1000+index,displayName:`Item ${index}`}],
});
test("normalization preserves all ten players and exactly five enemies with both spells",()=>{
  const normalized=normalizeGameData({activePlayer:{summonerName:"Player 0",championName:"Champion0",level:1},allPlayers:[0,1,2,3,4].map(i=>player(i,"ORDER")).concat([5,6,7,8,9].map(i=>player(i,"CHAOS"))),gameData:{gameId:"live-1",gameTime:210,gameMode:"CLASSIC",mapName:"Summoner's Rift"}});
  assert.equal(normalized.players.length,10);
  assert.equal(normalized.enemyPlayers.length,5);
  assert.deepEqual(normalized.enemyPlayers.map(item=>item.summonerName),["Player 5","Player 6","Player 7","Player 8","Player 9"]);
  assert.ok(normalized.enemyPlayers.every(item=>item.playerId&&item.dataDragonKey&&item.summonerSpells.spell1&&item.summonerSpells.spell2));
});
