import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import rows from "../../../lib/demo-tasks.json";
import offers from "../../../lib/demo-service-offers.json";
import { seedState, command, projectRole } from "../../../lib/domain.mjs";

export const dynamic = "force-dynamic";
const output = (data: unknown, status = 200) => Response.json(data, {status, headers: {"Cache-Control":"private, no-store"}});
async function owner() { const user=await getChatGPTUser(); if(!user)throw Object.assign(new Error("Sign in to save your synthetic sandbox"),{code:"UNAUTHENTICATED"});return user.userId; }
async function load(id: string) {
  const db=env.DB!;
  await db.prepare("INSERT OR IGNORE INTO sandboxes (owner,state,version) VALUES (?,?,0)").bind(id,JSON.stringify(seedState(rows,offers))).run();
  return await db.prepare("SELECT state,version FROM sandboxes WHERE owner=?").bind(id).first<{state:string;version:number}>();
}
function context(request: Request){
  const q=new URL(request.url).searchParams;
  const role=q.get("role")||"coordinator",provider=q.get("provider")||"ORG-DEMO-C",staff=q.get("staff")||"ASHA-DEMO-01";
  if(!["worker","coordinator","provider"].includes(role)||!["ORG-DEMO-A","ORG-DEMO-B","ORG-DEMO-C"].includes(provider)||!["ASHA-DEMO-01","ASHA-DEMO-02"].includes(staff))throw Object.assign(new Error("Invalid preview role"),{code:"VALIDATION_ERROR"});
  return {role,provider,staff};
}
export async function GET(request: Request){
  try{const id=await owner(),c=context(request),record=(await load(id))!;
    return output({ok:true,state:projectRole(JSON.parse(record.state),c.role,c.provider,c.staff),version:record.version});
  }catch(error){const e=error as Error & {code?:string};return output({ok:false,error:e.code||"SERVER_ERROR",message:e.message},e.code==="UNAUTHENTICATED"?401:400);}
}
export async function POST(request: Request){
  try{
    const id=await owner(),c=context(request);
    if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)throw Object.assign(new Error("Same-origin command required"),{code:"FORBIDDEN"});
    const raw=await request.text();if(raw.length>1050000)throw Object.assign(new Error("Request too large"),{code:"VALIDATION_ERROR"});
    const input=JSON.parse(raw); if(input.payload&&c.role==="worker")input.payload.staff=c.staff;
    // CAS on the entire tiny synthetic sandbox gives atomic state + capacity + idempotency.
    // It is not the normalized production PostgreSQL/RLS design.
    for(let retry=0;retry<8;retry++){
      const record=(await load(id))!;
      const result=input.action==="reset"
        ? (c.role==="coordinator"?{state:seedState(rows,offers),result:{reset:true}}:(()=>{throw Object.assign(new Error("Coordinator preview only"),{code:"FORBIDDEN"});})())
        : command(JSON.parse(record.state),input,c.role,c.provider);
      const update=await env.DB!.prepare("UPDATE sandboxes SET state=?,version=version+1 WHERE owner=? AND version=?").bind(JSON.stringify(result.state),id,record.version).run();
      if(update.meta.changes===1)return output({ok:true,state:projectRole(result.state,c.role,c.provider,c.staff),version:record.version+1,result:result.result});
    }
    return output({ok:false,error:"VERSION_CONFLICT",message:"Concurrent change; please refresh and try again"},409);
  }catch(error){const e=error as Error & {code?:string};return output({ok:false,error:e.code||"SERVER_ERROR",message:e.message},e.code==="UNAUTHENTICATED"?401:e.code==="FORBIDDEN"?403:409);}
}

// Circuit breaker configuration for high-traffic NGO telemetry
export const GATEWAY_CIRCUIT_BREAKER_TIMEOUT_MS = 5000;
