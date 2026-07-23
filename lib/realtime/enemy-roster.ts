import type { LivePlayer, NormalizedGameData } from "./types";

const hasSpell=(player:LivePlayer,spell:string)=>Object.values(player.summonerSpells).includes(spell);
const botCarryScore=(player:LivePlayer)=>["Heal","Barrier","Cleanse","Ghost"].some(spell=>hasSpell(player,spell))?2:0;
const supportScore=(player:LivePlayer)=>["Exhaust","Ignite"].some(spell=>hasSpell(player,spell))?2:0;

export function enemyRoster(game:NormalizedGameData):LivePlayer[]{
  if(game.enemyPlayers?.length)return game.enemyPlayers.slice(0,5);
  return game.players.filter(player=>player.team!==game.activePlayer.team).slice(0,5);
}

export function orderedEnemyRoster(game:NormalizedGameData,botlaneEnemy:string[]=[]):LivePlayer[]{
  const enemies=enemyRoster(game),take=(predicate:(player:LivePlayer)=>boolean)=>{
    const index=enemies.findIndex(predicate);
    return index<0?undefined:enemies.splice(index,1)[0];
  };
  const preferred=botlaneEnemy.map(name=>take(player=>player.championName===name)).filter((player):player is LivePlayer=>Boolean(player));
  const adc=preferred[0]??take(player=>botCarryScore(player)>0&&!hasSpell(player,"Smite"));
  const support=preferred[1]??take(player=>supportScore(player)>0&&!hasSpell(player,"Smite"));
  const jungle=take(player=>hasSpell(player,"Smite"));
  return [adc,support,jungle,...enemies].filter((player):player is LivePlayer=>Boolean(player)).slice(0,5);
}
