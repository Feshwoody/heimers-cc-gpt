import assert from "node:assert/strict";
import test from "node:test";
import { acknowledgeCall,canPerformSessionAction,companionAcknowledgementState } from "./permissions";
const call={id:"call-1",text:"RESET",source:"Commander",sourceMemberId:"owner",timestamp:1,acknowledgedBy:[]};
test("companion can only acknowledge calls",()=>{assert.equal(canPerformSessionAction("heimer","ack_call"),true);assert.equal(canPerformSessionAction("heimer","update_objectives"),false);assert.equal(canPerformSessionAction("heimer","update_summoners"),false);assert.equal(canPerformSessionAction("heimer","send_call"),false)});
test("acknowledgement appends only the companion and preserves the call",()=>{const next=acknowledgeCall(call,"GS");assert.deepEqual(next,{...call,acknowledgedBy:["GS"]});assert.strictEqual(acknowledgeCall(next,"GS"),next)});
test("a new call starts without prior acknowledgement",()=>{assert.deepEqual({...call,id:"call-2",acknowledgedBy:[]}.acknowledgedBy,[])});
test("controlled companion state contains only acknowledgement envelope",()=>{const state=companionAcknowledgementState(call,"GS","member");assert.deepEqual(Object.keys(state).sort(),["call","sourceMemberId","updatedAt"]);assert.deepEqual(state.call?.acknowledgedBy,["GS"])});
