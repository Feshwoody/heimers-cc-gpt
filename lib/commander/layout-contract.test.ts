import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const css=readFileSync("app/commander.css","utf8");
test("1920 commander contract uses one viewport without horizontal overflow",()=>{assert.match(css,/\.commander-shell\{height:100dvh;overflow:hidden/);assert.match(css,/grid-template-columns:repeat\(6,1fr\)/)});
test("quick calls retain the required large click target",()=>assert.match(css,/\.commander-calls button\{min-height:78px/));
