import assert from "node:assert/strict";
import test from "node:test";
import { commanderFlashUsers } from "./commander-utils";
import type { NormalizedGameData } from "@/lib/realtime/types";
const player=(championName:string,team:string):NormalizedGameData["players"][number]=>({summonerName:championName,championName,team,isActivePlayer:false,summonerSpells:{spell1:"Flash",spell2:"Heal"},keystone:"",runes:[],level:1,items:[]});
test("flash timers use confirmed botlane champions first",()=>{const game:NormalizedGameData={gameId:"g",gameTime:210,gameMode:"CLASSIC",mapName:"Summoner's Rift",updatedAt:new Date().toISOString(),activePlayer:{summonerName:"Nautilus",championName:"Nautilus",level:1,team:"ORDER"},players:[player("Nautilus","ORDER"),player("Ahri","CHAOS"),player("Jinx","CHAOS"),player("JarvanIV","CHAOS"),player("Leona","CHAOS")],events:[]};assert.deepEqual(commanderFlashUsers(game,["Jinx","Leona"]).map(item=>item.championName),["Jinx","Leona","Ahri","JarvanIV"])});
