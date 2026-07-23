import assert from "node:assert/strict";
import test from "node:test";
import { viewForRole } from "./session-role";
test("support refresh routes to commander",()=>assert.equal(viewForRole("support"),"commander"));
test("heimer refresh and direct membership route to companion",()=>assert.equal(viewForRole("heimer"),"companion"));
test("spectator and unknown roles route to full",()=>{assert.equal(viewForRole("spectator"),"full");assert.equal(viewForRole(null),"full")});
