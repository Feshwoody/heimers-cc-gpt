import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const css=readFileSync("app/commander.css","utf8");
const priorityCss=readFileSync("app/commander-priority.css","utf8");
test("1920 commander contract uses one viewport without horizontal overflow",()=>{assert.match(css,/\.commander-shell\{height:100dvh;overflow:hidden/);assert.match(css,/grid-template-columns:repeat\(6,1fr\)/)});
test("quick calls retain the required large click target",()=>assert.match(css,/\.commander-calls button\{min-height:78px/));
test("five enemy cards fit the desktop grid and spell cards are fully clickable",()=>{assert.match(priorityCss,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);assert.match(priorityCss,/\.enemy-spell>button\{[^}]*width:100%;min-height:72px/);assert.match(priorityCss,/pointer-events:auto/)});
test("calm mission remains compact below priority controls",()=>assert.match(priorityCss,/\.commander-mission\{height:145px/));
