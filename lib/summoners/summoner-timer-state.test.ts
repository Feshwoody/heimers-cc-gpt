import assert from "node:assert/strict";
import test from "node:test";
import { correctSummonerTimer,remainingSeconds,startSummonerTimer,summonerTimerId,timerLabel } from "./summoner-timer-state";
test("commander click starts a target-timestamp countdown",()=>{const timer=startSummonerTimer("player-1","Flash","commander",1000);assert.equal(timer.id,summonerTimerId("player-1","Flash"));assert.equal(timer.targetTimestamp,301000);assert.equal(remainingSeconds(timer,1000),300)});
test("running timer supports correction and READY reset",()=>{const timer=startSummonerTimer("p","Ignite","commander",1000);assert.equal(remainingSeconds(correctSummonerTimer(timer,"+30",1000),1000),210);assert.equal(correctSummonerTimer(timer,"ready",1000).running,false)});
test("timer state survives persistence, refresh and reconnect as plain data",()=>{const timer=startSummonerTimer("p","Flash","commander",1000),copy=JSON.parse(JSON.stringify(timer));assert.equal(remainingSeconds(copy,2000),299);assert.equal(timerLabel(copy,2000),"COOLDOWN")});
