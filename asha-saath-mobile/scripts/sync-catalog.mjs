import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const source=new URL('../../asha-saath-lovable/backend/runtime/fixtures.mjs',import.meta.url);
const {GEOGRAPHIES,PROVIDERS,DEMO_CONFIG}=await import(source.href);
const folder=new URL('../src/lib/',import.meta.url); await mkdir(folder,{recursive:true});
const data={geographies:GEOGRAPHIES,providers:PROVIDERS,config:{demoClock:DEMO_CONFIG.demoClock,shift:DEMO_CONFIG.shift,travel:DEMO_CONFIG.travel,staff:DEMO_CONFIG.staff,publicPathway:DEMO_CONFIG.publicPathway}};
await writeFile(new URL('catalog.json',folder),JSON.stringify(data,null,2));
console.log('Synced fictional service metadata; no caseload, sessions or person records included.');
