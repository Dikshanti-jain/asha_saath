import http from 'node:http';
import {spawn} from 'node:child_process';
import {access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const entry=path.join(root,'.output/server/index.mjs');
await access(entry);
const origin=process.env.ASHA_PUBLIC_ORIGIN ?? process.env.RENDER_EXTERNAL_URL ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? 'https://'+process.env.RAILWAY_PUBLIC_DOMAIN : null);
if(!origin) throw new Error('Set ASHA_PUBLIC_ORIGIN to the public HTTPS URL before starting.');
const url=new URL(origin);
if(url.protocol!=='https:' && !['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('The public deployment requires HTTPS.');
process.env.ASHA_PUBLIC_ORIGIN=url.origin;
if(!process.env.ASHA_DB_PATH) throw new Error('Set ASHA_DB_PATH to a persistent volume, e.g. /var/data/asha-saath.sqlite.');
const {createBackend}=await import('../backend/server.mjs');
const app=await createBackend();
const api=await app.listen(0);
const ssrPort=Number(process.env.ASHA_SSR_PORT ?? 4319);
const child=spawn(process.execPath,[entry],{cwd:root,stdio:'inherit',env:{...process.env,PORT:String(ssrPort),NITRO_PORT:String(ssrPort),HOST:'127.0.0.1',NITRO_HOST:'127.0.0.1'}});
let stopping=false;
const gateway=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const apiRequest=pathname==='/api'||pathname.startsWith('/api/');
  const target=http.request({hostname:'127.0.0.1',port:apiRequest?api.port:ssrPort,path:req.url,method:req.method,headers:req.headers}, upstream=>{
    res.writeHead(upstream.statusCode??502,{...upstream.headers,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY'});
    upstream.pipe(res);
  });
  target.on('error',()=>{
    if(!res.headersSent) res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    res.end('Service is starting. Please retry.');
  });
  req.on('aborted',()=>target.destroy());
  req.pipe(target);
});
async function stop(code=0) {
  if(stopping)return;
  stopping=true;
  gateway.close();
  child.kill();
  await app.close();
  process.exit(code);
}
child.on('error',e=>{console.error(e.message);void stop(1);});
child.on('exit',code=>{if(!stopping)void stop(code??1);});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void stop());
let ready=false;
for(let i=0;i<60;i++){
  try { const response=await fetch('http://127.0.0.1:'+ssrPort+'/',{signal:AbortSignal.timeout(2000)}); if(response.ok){ready=true;break;} } catch {}
  await new Promise(resolve=>setTimeout(resolve,500));
}
if(!ready) { console.error('Frontend startup failed'); await stop(1); }
gateway.listen(Number(process.env.PORT ?? 3000),process.env.ASHA_BIND_HOST ?? '0.0.0.0',()=>console.log('ASHA Saath ready: one origin, Node SSR + SQLite API. Synthetic demo accounts only.'));

