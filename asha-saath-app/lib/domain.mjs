// Pure synthetic-demo domain. No clinical scoring, browser APIs or database access.
export const ACTIVE = ["OFFERED","ACCEPTED","ARRANGED","DELIVERY_REPORTED","CONFIRMED","DISPUTED"];
export function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
export function normalizeRows(rows) {
  const seen = new Set(), errors = [], tasks = [];
  for (let i=0;i<rows.length;i++) {
    const r=rows[i], id=r.source_task_id, key=r.source_dataset_id+":"+id;
    const error=(message)=>errors.push({row:i+2,task:id||"Missing ID",message});
    if (!id || !r.source_dataset_id || !r.patient_id) { error("Dataset, task and patient reference required"); continue; }
    if (seen.has(key)) { error("Duplicate dataset/task identity"); continue; } seen.add(key);
    if (!["ASHA-DEMO-01","ASHA-DEMO-02"].includes(r.staff_id)) { error("Unknown demo staff assignment"); continue; }
    if (!["DEMO-ROUTINE","DEMO-JOINT","DEMO-ESCALATION"].includes(r.rule_id)||Number(r.rule_version)!==1) {error("Rule/version needs review");continue;}
    if (!["P1","P2","P3"].includes(r.priority)) {error("Priority needs review");continue;}
    const lat=Number(r.latitude),lon=Number(r.longitude),duration=Number(r.visit_minutes);
    if (!r.latitude||!r.longitude||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180) {error("Valid confirmed coordinates required");continue;}
    if (!r.locality_id?.startsWith("DEMO-")||r.location_confidence!=="SYNTHETIC_CONFIRMED") {error("Confirmed synthetic locality required");continue;}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.due_date)||!Number.isFinite(Date.parse(r.due_date))) {error("Invalid due date");continue;}
    if (!/^\d{2}:\d{2}$/.test(r.earliest_time)||!/^\d{2}:\d{2}$/.test(r.latest_time)||minutes(r.earliest_time)>minutes(r.latest_time)) {error("Invalid visit time window");continue;}
    if (!(duration>0&&duration<=240)||Number(r.defer_count)<0) {error("Invalid visit duration or deferral count");continue;}
    if (r.synthetic!=="true"||!r.patient_id.startsWith("PERSON-DEMO-")) {error("Only supplied-format synthetic references allowed");continue;}
    tasks.push({id,dataset:r.source_dataset_id,patient:r.patient_id,staff:r.staff_id,locality:r.locality_id,lat,lon,priority:r.priority,due:r.due_date,
      earliest:r.earliest_time,latest:r.latest_time,duration,cadre:r.required_cadre,rule:r.rule_id,defer:Number(r.defer_count),
      flags:r.risk_flags||"",status:r.status||"PENDING",synthetic:true});
  }
  if (rows.length>200) errors.push({row:0,message:"Maximum 200 rows per demo import"});
  return {tasks,errors};
}
export function parseCSV(text) {
  if (text.length>1000000) fail("VALIDATION_ERROR","CSV exceeds 1 MB");
  const rows=[], row=[]; let field="",quoted=false;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field="";}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(Boolean))rows.push([...row]);row.length=0;field="";}
    else field+=c;
  }
  if(quoted)fail("VALIDATION_ERROR","Unclosed CSV quote");
  row.push(field);if(row.some(Boolean))rows.push(row);
  const headers=rows.shift()?.map(x=>x.trim().replace(/^\uFEFF/,""))||[];
  return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,(values[i]||"").trim()])));
}
export const minutes=(s)=>Number(s.split(":")[0])*60+Number(s.split(":")[1]);
export const clock=(m)=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(Math.round(m%60)).padStart(2,"0");
export function distance(a,b){const rad=x=>x*Math.PI/180;const dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);
  return 6371*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2)));}
export function planDay(all, config, strategy="priority") {
  const {staff="ASHA-DEMO-01",date="2026-10-08",start="09:00",end="15:00",speed=12,multiplier=1.4,buffer=20,breakAt="12:00",breakMinutes=30}=config;
  if(!(Number(speed)>0&&Number(speed)<=100)||minutes(end)<=minutes(start)||Number(buffer)<0||Number(breakMinutes)<0)fail("VALIDATION_ERROR","Review shift, speed, break and buffer");
  const origin={lat:26.9,lon:75.7}, travel=(a,b)=>Math.ceil(distance(a,b)*multiplier/speed*60);
  const unserved=[],future=[],review=[],escalation=[],eligible=[],done=[];
  for(const t of all.filter(t=>t.staff===staff)){
    if(["COMPLETED","CANCELLED"].includes(t.status)){done.push(t);continue;}
    if(t.status==="ESCALATION_REQUIRED"||t.rule==="DEMO-ESCALATION"){escalation.push({...t,reason:"Clinical escalation required"});continue;}
    if(t.cadre==="JOINT"){review.push({...t,reason:"Joint-cadre coordination required"});continue;}
    if(t.status==="NOT_AVAILABLE"&&t.unavailableDate===date){unserved.push({...t,reason:"Household unavailable today"});continue;}
    if(t.due>date){future.push({...t,reason:"Future due date"});continue;}
    eligible.push(t);
  }
  const tier=t=>t.priority+"|"+t.due+"|"+String(999-t.defer).padStart(4,"0");
  let ordered=[];
  if(strategy==="input")ordered=[...eligible];
  else {
    const tiers=[...new Set(eligible.map(tier))].sort();
    let position=origin;
    for(const group of tiers){let pending=eligible.filter(t=>tier(t)===group);while(pending.length){
      pending.sort((a,b)=>distance(position,a)-distance(position,b)||a.id.localeCompare(b.id));
      const next=pending.shift();ordered.push({...next,seedRank:ordered.length+1});position=next;
    }}
  }
  let now=minutes(start),position=origin,travelTotal=0,visitTotal=0,waitTotal=0,breakTaken=false;const stops=[];
  for(const t of ordered){
    let leg=travel(position,t),arrival=now+leg,breakAdded=0;
    if(!breakTaken&&arrival+t.duration>=minutes(breakAt)){arrival+=Number(breakMinutes);breakAdded=Number(breakMinutes);}
    const wait=Math.max(0,minutes(t.earliest)-arrival);arrival+=wait;const departure=arrival+t.duration;
    const returnMin=travel(t,origin);
    // Even an early finishing route budgets the fixed break.
    const pendingBreak=(!breakTaken&&!breakAdded)?Number(breakMinutes):0;
    if(departure>minutes(t.latest)){unserved.push({...t,reason:"Visit window cannot be met"});continue;}
    if(departure+returnMin+Number(buffer)+pendingBreak>minutes(end)){unserved.push({...t,reason:"Shift, return travel and buffer cannot fit"});continue;}
    if(breakAdded)breakTaken=true;
    stops.push({...t,order:stops.length+1,arrival:clock(arrival),departure:clock(departure),travel:leg,wait,group:t.locality,
      reason:t.priority+" supplied priority · due "+t.due+(t.defer?" · "+t.defer+" prior deferrals":"")});
    now=departure;position=t;travelTotal+=leg;waitTotal+=wait;visitTotal+=t.duration;
  }
  const returnTravel=travel(position,origin);travelTotal+=returnTravel;
  const total=travelTotal+visitTotal+waitTotal+Number(breakMinutes)+Number(buffer);
  return {staff,date,config,stops,unserved,future,review,escalation,done,due:eligible.length+unserved.filter(t=>t.reason==="Household unavailable today").length,
    travel:travelTotal,visits:visitTotal,wait:waitTotal,returnTravel,total,endAt:clock(now+returnTravel+Number(buffer)+(!breakTaken?Number(breakMinutes):0)),
    groups:[...new Set(eligible.map(t=>t.locality))],priorityCounts:Object.fromEntries(["P1","P2","P3"].map(p=>[p,{due:eligible.filter(t=>t.priority===p).length,planned:stops.filter(t=>t.priority===p).length}]))};
}
export function projectDays(tasks,config,days=3){
  const remaining=structuredClone(tasks),out=[];
  for(let i=0;i<days;i++){const d=new Date(config.date+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+i);const p=planDay(remaining,{...config,date:d.toISOString().slice(0,10)});out.push(p);
    const scheduled=new Set(p.stops.map(t=>t.id));for(const t of remaining)if(scheduled.has(t.id))t.status="COMPLETED";}
  return out;
}
export function seedState(rows,offers){return {tasks:normalizeRows(rows).tasks,offers:structuredClone(offers.providers),needs:[],plans:[],audit:[],operations:{},clock:"2026-10-08T09:00:00+05:30"};}
export function freeSlots(provider){const c=provider.offer.capacity;return c.totalUnits-c.reservedUnits-c.committedUnits-c.reconciliationUnits;}
export function offerReason(state,need,provider){
  const o=provider.offer;
  if(!o.catchments.includes(need.locality))return "Outside this service's catchment";
  if(o.verificationStatus!=="SYNTHETIC_SERVICE_VERIFIED")return "Service verification required";
  if(new Date(o.expiresAt)<=new Date(state.clock))return "Service offer expired";
  if(new Date(o.capacity.freshUntil)<=new Date(state.clock))return "Capacity needs reconfirmation";
  if(freeSlots(provider)<o.unitsPerCase)return "No current free capacity";
  return null;
}
function allowed(role,roles){if(!roles.includes(role))fail("FORBIDDEN","Action is not available in this preview role");}
function event(s,n,text,role){const e={time:s.clock,text,role};n?.timeline.push(e);s.audit.unshift({...e,entity:n?.id||"PLAN"});s.audit=s.audit.slice(0,100);}
export function command(state,input,role,providerId="ORG-DEMO-C"){
  const s=structuredClone(state), {action,payload:p={},key}=input;
  if(!key)fail("VALIDATION_ERROR","Operation identity required");
  const signature=JSON.stringify({action,p,role,providerId});
  if(s.operations[key]){if(s.operations[key].signature!==signature)fail("IDEMPOTENCY_CONFLICT","Operation key reused for a different request");return {state:s,result:s.operations[key].result,replayed:true};}
  let result={};const n=p.needId?s.needs.find(n=>n.id===p.needId):null;
  const currentProvider=n?.attempt?s.offers.find(o=>o.organizationId===n.attempt.providerId):null;
  const requireNeed=()=>{if(!n)fail("VALIDATION_ERROR","Request not found");if(n.status==="WITHDRAWN"||n.status==="CLOSED")fail("INVALID_TRANSITION","Request is withdrawn or closed");};
  const providerCheck=()=>{allowed(role,["provider"]);requireNeed();if(n.attempt?.providerId!==providerId)fail("FORBIDDEN","Request belongs to a different provider");if(!n.consent?.active)fail("CONSENT_WITHDRAWN","Sharing permission is not active");};
  switch(action){
    case "import": {
      allowed(role,["coordinator"]);const parsed=normalizeRows(parseCSV(p.csv));if(parsed.errors.length)fail("VALIDATION_ERROR",parsed.errors.map(e=>"Row "+e.row+": "+e.message).join("; "));
      let added=0,unchanged=0;for(const t of parsed.tasks){const old=s.tasks.find(o=>o.id===t.id&&o.dataset===t.dataset);if(old){const {status,unavailableDate,...clinical}=old;const {status:nextStatus,...next}=t;
        if(JSON.stringify(clinical)!==JSON.stringify(next))fail("RULE_REVIEW","Existing task changes require review; unchanged imports are supported");unchanged++;}else{s.tasks.push(t);added++;}}
      result={added,unchanged};event(s,null,"CSV imported: "+added+" added, "+unchanged+" unchanged",role);break;
    }
    case "savePlan":allowed(role,["coordinator"]);{
      const plan=planDay(s.tasks,p.config);s.plans=s.plans.filter(x=>!(x.staff===plan.staff&&x.date===plan.date));s.plans.push({...plan,savedAt:s.clock});
      for(const t of s.tasks)if(plan.stops.some(x=>x.id===t.id))t.status="PLANNED";
      result={planned:plan.stops.length};event(s,null,"Saved daily plan for "+plan.staff,role);break;}
    case "visit":allowed(role,["worker","coordinator"]);{
      const t=s.tasks.find(t=>t.id===p.taskId);if(!t)fail("VALIDATION_ERROR","Task not found");
      if(role==="worker"&&t.staff!==(p.staff||"ASHA-DEMO-01"))fail("FORBIDDEN","Task is not assigned to this worker");
      if(!["COMPLETED","NOT_AVAILABLE","DEFERRED"].includes(p.outcome)||t.cadre==="JOINT"||t.status==="ESCALATION_REQUIRED")fail("INVALID_TRANSITION","This task needs authorized coordination/escalation");
      t.status=p.outcome;t.unavailableDate=p.outcome==="NOT_AVAILABLE"?p.date:undefined;event(s,null,t.id+" visit "+p.outcome,role);break;}
    case "createNeed":allowed(role,["worker","coordinator"]);{
      const t=s.tasks.find(t=>t.id===p.taskId);if(!t||t.status!=="COMPLETED")fail("INVALID_TRANSITION","Record a completed visit first");
      if(role==="worker"&&t.staff!==(p.staff||"ASHA-DEMO-01"))fail("FORBIDDEN","Task not assigned");
      if(s.needs.some(n=>n.taskId===t.id&&!["CLOSED","WITHDRAWN"].includes(n.status)))fail("INVALID_TRANSITION","An active document-help need already exists");
      const id="NEED-"+String(s.needs.length+1).padStart(3,"0");const next={id,taskId:t.id,staff:t.staff,locality:t.locality,category:"DOCUMENT_NAVIGATION",
        status:"CONSENT_REQUIRED",owner:"COORD-DEMO-01",nextAction:"Review public pathway and sharing permission",preference:p.preference||"Either help mode",timeline:[],consent:null,attempt:null,pastAttempts:[]};
      s.needs.unshift(next);event(s,next,"Document-navigation need recorded after visit",role);result={needId:id};break;}
    case "offer":allowed(role,["coordinator"]);requireNeed();{
      if(n.attempt&&ACTIVE.includes(n.attempt.status))fail("INVALID_TRANSITION","One active offer already exists");
      const provider=s.offers.find(o=>o.organizationId===p.providerId);if(!provider)fail("VALIDATION_ERROR","Provider not found");
      const reason=offerReason(s,n,provider);if(reason)fail("ELIGIBILITY_REVIEW",reason);
      if(p.consent!==true)fail("CONSENT_REQUIRED","Permission for this provider and listed fields required");
      n.consent={active:true,recipient:p.providerId,purpose:"DOCUMENT_NAVIGATION",fields:["requestReference","category","locality","helpPreference"],recordedAt:s.clock};
      n.attempt={providerId:p.providerId,status:"OFFERED",expires:new Date(new Date(s.clock).getTime()+3600000).toISOString(),allocation:null};
      n.status="OFFERED";n.nextAction="Provider response; coordinator follows up";event(s,n,"Permission recorded; request offered to "+provider.name,role);break;}
    case "accept":providerCheck();{
      if(n.attempt.status!=="OFFERED")fail("INVALID_TRANSITION","Only an offered request can be accepted");
      if(new Date(n.attempt.expires)<=new Date(s.clock))fail("OFFER_EXPIRED","Acceptance deadline passed");
      const reason=offerReason(s,n,currentProvider);if(reason)fail("CAPACITY_CHANGED",reason);
      currentProvider.offer.capacity.reservedUnits++;n.attempt.allocation="RESERVED";n.attempt.status=n.status="ACCEPTED";
      n.nextAction="Agree assistance time and method";event(s,n,"Provider accepted; one slot reserved",role);break;}
    case "decline":providerCheck();if(n.attempt.status!=="OFFERED")fail("INVALID_TRANSITION","Only an offered request can be declined");{
      n.attempt.status="DECLINED";n.pastAttempts.push(n.attempt);n.attempt=null;n.status="UNRESOLVED";n.nextAction="Coordinator: select another permitted provider";
      n.reason=p.reason||"Provider unable to assist";event(s,n,"Provider declined: "+n.reason,role);break;}
    case "arrange":providerCheck();if(n.status!=="ACCEPTED")fail("INVALID_TRANSITION","Accept request first");{
      if(!p.arrangement?.trim())fail("VALIDATION_ERROR","Assistance time/method required");
      n.arrangement=p.arrangement.trim().slice(0,160);n.attempt.status=n.status="ARRANGED";n.nextAction="Provider supplies agreed document help";event(s,n,"Arrangement: "+n.arrangement,role);break;}
    case "deliver":providerCheck();if(n.status!=="ARRANGED")fail("INVALID_TRANSITION","Record arrangement first");n.attempt.status=n.status="DELIVERY_REPORTED";n.nextAction="Worker/person confirmation required";event(s,n,"Provider reports document help delivered; awaiting confirmation",role);break;
    case "confirm":allowed(role,["worker","coordinator"]);requireNeed();if(n.status!=="DELIVERY_REPORTED")fail("INVALID_TRANSITION","No delivery report to confirm");{
      if(role==="worker"&&n.staff!==(p.staff||"ASHA-DEMO-01"))fail("FORBIDDEN","Need not assigned to this worker");
      if(p.received){n.attempt.status=n.status="CONFIRMED";n.attempt.allocation="COMMITTED";currentProvider.offer.capacity.reservedUnits--;currentProvider.offer.capacity.committedUnits++;n.nextAction="Coordinator: close confirmed support";}
      else {n.attempt.status=n.status="DISPUTED";n.attempt.allocation="RECONCILIATION_REQUIRED";currentProvider.offer.capacity.reservedUnits--;currentProvider.offer.capacity.reconciliationUnits++;n.nextAction="Coordinator: resolve delivery disagreement";}
      event(s,n,p.received?"Person's receipt confirmed by assisted recorder":"Recipient disputes delivery; coordinator reconciliation required",role);break;}
    case "close":allowed(role,["coordinator"]);requireNeed();if(n.status!=="CONFIRMED")fail("INVALID_TRANSITION","Positive recipient confirmation required");n.attempt.status=n.status="CLOSED";n.nextAction="Document-navigation help confirmed; public benefit not approved";event(s,n,"Coordinator closed confirmed document-help request",role);break;
    case "withdraw":allowed(role,["worker","coordinator"]);requireNeed();{
      if(role==="worker"&&n.staff!==(p.staff||"ASHA-DEMO-01"))fail("FORBIDDEN","Need not assigned");
      if(n.consent)n.consent.active=false;
      if(n.attempt){if(n.attempt.allocation==="RESERVED"){
        currentProvider.offer.capacity.reservedUnits--;
        if(n.status==="DELIVERY_REPORTED"){currentProvider.offer.capacity.reconciliationUnits++;n.attempt.allocation="RECONCILIATION_REQUIRED";}
        else n.attempt.allocation="RELEASED";
      }n.attempt.status="CANCELLED";}
      n.status="WITHDRAWN";n.nextAction="Sharing stopped; coordinator handles any resource reconciliation";event(s,n,"Sharing permission withdrawn; provider access revoked",role);break;}
    case "expire":allowed(role,["coordinator"]);for(const need of s.needs)if(need.attempt?.status==="OFFERED"&&new Date(need.attempt.expires)<=new Date(s.clock)){
      need.attempt.status="EXPIRED";need.pastAttempts.push(need.attempt);need.attempt=null;need.status="UNRESOLVED";need.nextAction="Coordinator: refresh permission and choose alternative";event(s,need,"Offer expired without acceptance",role);}break;
    case "advanceClock":allowed(role,["coordinator"]);s.clock=new Date(new Date(s.clock).getTime()+3600000*Number(p.hours||1)).toISOString();break;
    case "refreshCapacity":allowed(role,["provider"]);{
      const provider=s.offers.find(o=>o.organizationId===providerId),c=provider.offer.capacity;
      if(!Number.isInteger(Number(p.total))||Number(p.total)<c.reservedUnits+c.committedUnits+c.reconciliationUnits)fail("VALIDATION_ERROR","Total cannot be below reserved/consumed units");
      c.totalUnits=Number(p.total);c.confirmedAt=s.clock;c.freshUntil=new Date(new Date(s.clock).getTime()+3*3600000).toISOString();event(s,null,"Provider reconfirmed service capacity",role);break;}
    default:fail("VALIDATION_ERROR","Unknown command");
  }
  s.operations[key]={signature,result};if(Object.keys(s.operations).length>1000)delete s.operations[Object.keys(s.operations)[0]];
  return {state:s,result,replayed:false};
}
export function projectRole(s,role,providerId,staff){
  if(role==="provider"){
    const needs=s.needs.filter(n=>n.attempt?.providerId===providerId&&n.consent?.active&&!["WITHDRAWN","UNRESOLVED"].includes(n.status))
      .map(n=>{const {taskId,staff,...minimal}=n;return minimal;});
    return {...s,tasks:[],plans:[],audit:[],operations:undefined,needs,offers:s.offers.filter(o=>o.organizationId===providerId)};
  }
  return {...s,operations:undefined,tasks:role==="worker"?s.tasks.filter(t=>t.staff===staff):s.tasks,
    needs:role==="worker"?s.needs.filter(n=>n.staff===staff):s.needs};
}
