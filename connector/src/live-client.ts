import https from "node:https";
import type { RawGameData } from "./types.js";
const agent=new https.Agent({rejectUnauthorized:false});
export function getLiveGame():Promise<RawGameData>{
  return new Promise((resolve,reject)=>{const req=https.get("https://127.0.0.1:2999/liveclientdata/allgamedata",{agent,timeout:1600},res=>{let body="";res.setEncoding("utf8");res.on("data",c=>{body+=c;if(body.length>2_000_000)req.destroy(new Error("response_too_large"))});res.on("end",()=>{if(res.statusCode!==200)return reject(new Error(`live_client_${res.statusCode}`));try{resolve(JSON.parse(body))}catch{reject(new Error("invalid_live_client_json"))}})});req.on("timeout",()=>req.destroy(new Error("timeout")));req.on("error",reject)});
}
