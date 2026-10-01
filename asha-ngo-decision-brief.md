# ASHA + NGO platform: decision brief

Research cutoff: **8 October 2026**. Proposed working name: **ASHA Saath**. Brand uniqueness is unverified. The detailed report and research notes contain the scheme/platform comparison, source dates, limitations and design proposals.

## Best direction

**ASHA ka daily visit planner + government-service navigation + participating NGOs se actual help milne ka follow-up.**

Seedha example: ASHA visit mein pata chala ki family ko documents ya transport access mein help chahiye. App applicable public pathway dikhata hai, person ki permission leta hai, us locality mein service dene wale participating provider ko request bhejta hai, aur acceptance se delivery confirmation tak status rakhta hai. Help nahi mili toh reason aur next action supervisor/coordinator ko dikhta hai.

Is idea ko practical banane ka sabse important part NGO list ki size nahi, **current local services aur follow-up ki responsibility** hai. National discovery useful hai; real fulfillment local partners karenge.

## Research ne kya change kiya

1. **ASHA sirf data-entry worker nahi hai.** Woh community aur public health services ke beech trained interface hai. ANM/CHO/doctor ki clinical authority alag hai. ASHA ko har donor ka follow-up karne wali unpaid case manager mat banao; NGO/district coordinator ko support case ka owner banao. [NHSRC ASHA framework](https://nhsrcindia.org/practice-areas/cpc-phc/community-process-asha).
2. **Current child-care framework update hua hai.** SSBSK 29 June 2026 ko launch hua, HBNC/HBYC ko birth–36 months continuum mein integrate karta hai, with risk-differentiated and joint visits. Purane visit calendars ko bina verification current universal schedule mat bolo. [MoHFW launch](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2279075&lang=1&reg=3).
3. **Scheduling/referral features already exist.** Shaishav ki August 2026 description mein scheduling/tracking, referral follow-up aur supervision hain; universal district deployment verify nahi hui. [Government workshop](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2303141&lang=2&reg=48).
4. **NGO support linkage ka Indian precedent bhi hai.** Ni-kshay's community-support guidance has consent, donor/NGO linkage and district follow-up. Apna TB workflow usko duplicate karke first-ever claim mat karo. [Official TB community-support guidance](https://tbcindia.mohfw.gov.in/wp-content/uploads/2023/05/1583929709Guidance-Booklet_02-08-2022.pdf).
5. **Internationally full support-referral products exist.** Unite Us aur Findhelp provider response aur outcomes track karte hain. Hamari opportunity Indian ASHA workflow aur a locally verified network ka useful adaptation hai. [Unite Us](https://uniteus.com/products/closed-loop-referral-system/), [Findhelp](https://company.findhelp.com/products/platform/).
6. **Registration is not readiness.** Darpan ID government endorsement nahi hai; usse service capacity verify nahi hoti. [NPO Darpan disclaimer](https://ngodarpan.gov.in/?lang=de).

## Feature priorities

| Feature | Real value | When |
|---|---|---|
| CSV caseload, due dates and staff-supplied priority | Original Healthcare 03 input and transparent reasons | Hackathon core |
| Geographic grouping/nearest-neighbour and feasible daily route | Visit durations/availability ke saath working day mein kya fit hoga | Hackathon core |
| Replan and unserved queue | Ghar unavailable ya time short ho toh missed work hidden na ho | Hackathon core |
| Small consented support card | Visit mein identified need ko next action mile | Hackathon core |
| Actual service catchment + eligibility + fresh capacity | Nearby office ko wrong eligible service samajhne se bache | Hackathon core |
| Provider accept/decline + service-specific closure | Request bhejna aur help milna separately track ho | Hackathon core |
| Coordinator ownership and recovery | Failed request ka alternative / next action ho | Hackathon core |
| Offline plan and queued completion | Low connectivity mein aaj ka plan usable ho | Core ke baad |
| Versioned scheme navigator | State-specific eligibility aur documentary barriers manage ho | Small demo; broader pilot |
| Restricted funding/in-kind request with approval | Funded service ka honest status aur accountable reconciliation | Later; simulated demo only |
| Multi-worker/joint-visit planning | ANM/CHO schedules ke saath authorized coordination | Later pilot |
| Hindi voice draft/readout | Usability support; uniqueness claim nahi | Optional |

Clinical priority staff/approved rules se aayegi. AI diagnosis ya final government eligibility decide nahi karega. Urgent clinical escalation NGO matching se pehle existing clinical route follow karegi.

## NGO network ka useful structure

**Organization -> branch -> specific service offer -> area -> eligibility -> slots/resources -> expiry -> referral -> outcome.**

Ek NGO Jaipur office mein hai, iska matlab nahi ki woh har Jaipur village ko transport deta hai. Ho sakta hai ek offer sirf do rural blocks mein ho, counselling remote ho, aur device camp ek fixed date par ho. Har service ka alag catchment aur capacity chahiye.

Rural: hamlet/village/block, travel access and outreach days. Urban: ward, informal settlement, mobility and safe contact. State/national: discovery, program rules and permitted aggregate reporting. Named household records automatically har level par shared nahi honge.

Government entitlement pehle check hoga. NGO backup arranged ho bhi jaye toh public-service access barrier erase nahi hoga; supervisor usko dekh sakega. Assistance beneficiary ki preference aur provider ke approval se hogi, compulsory matching se nahi.

## Network kahan break ho sakta hai

Yeh hypotheses local interviews se verify karni hain; har NGO ya district par proven failure claim nahi hai.

- Need identify hui, lekin next action ka owner nahi.
- Organization listed hai, par woh exact service/locality cover nahi karti.
- Eligibility/documents unclear hain, recipient repeatedly referred hota hai.
- Provider full hai ya capacity information stale hai.
- Referral sent hai, par accepted slot nahi.
- Service reported complete hai, par person ko help nahi mili / outcome disputed hai.
- ASHA ko another app aur follow-up burden mila, isliye adoption weak ho sakta hai.
- Donor budget restricted hai; transport/nutrition ka requested expense fundable nahi.
- Rural distance ya migrant address difficult hai; easy cases optimize karte hue hard cases keep getting deferred.

In sab ka answer “aur AI add karo” nahi hai. Named coordinator, correct service metadata, explicit provider decisions, assisted intake aur truthful outcomes essential hain.

## Funding ka practical version

First use case **in-kind services** rakho: document-help hours, approved transport slots or locally agreed family-support inventory. Funding request ke states alag hon: requested, reviewed, approved, externally disbursed/service supplied, reconciled.

Historic CSR expenditure available fund balance nahi hai. Corporate approval ko app guarantee nahi karega. CSR Exchange already companies aur eligible implementing agencies ke projects connect karta hai. Real project funding partner approvals ke baad hi ho sakti hai. [Official CSR Exchange FAQ](https://www.csrxchange.gov.in/Frontend/faq).

Hackathon mein wallet/donation custody ki zaroorat nahi. Synthetic request aur NGO approval screens enough hain if the required visit planner and service flow work.

## Demo jo mentor ko samajh aaye

Use **20–30 synthetic visit tasks**, one declared shift aur document-navigation ki same service ke three fictional provider offers. Ye authoritative MVP hai; 60–80 households ka larger stress demo core ke baad optional hai. All data labels visible hon.

1. Daily route banao; priority coverage, estimated travel and unserved households show karo.
2. Ek remote due household ko include karne ka tradeoff explain karo.
3. Ghar unavailable karo, route replan karo.
4. Completed visit se consented support request banao.
5. Nearby NGO reject ho kyunki actual service catchment match nahi karta.
6. Eligible NGO capacity-full decline kare; coordinator permitted alternative choose kare.
7. Alternative accept kare, delivery recorded ho, person/worker confirmation ke baad service close ho.

Ek successful journey ke saath ek unresolved case bhi show karo. Mentor ko pata chale ki system difficult cases hide nahi karta.

## What to measure

Compare routing baselines on identical inputs: due/priority coverage, unserved backlog, modeled travel and shift feasibility. Referral metrics separately: offered, accepted, delivered, confirmed and unresolved with reason. Field pilot mein extra ASHA time, stale offers, provider response and beneficiary experience measure karo.

Simulation se lives saved, health improved, real NGO funding raised ya fixed percent travel savings claim mat karo. Remote priority cover karte waqt travel increase bhi ho sakta hai; that can be the right decision.

## Start small, scale with evidence

Recommended pilot hypothesis: one willing health catchment, one coordinator, three to five willing providers and three well-defined support categories. Rural and urban operation independently validate karo. RCH/U-WIN/Shaishav/ABDM connection tab claim karo jab approved, working integration ho; hackathon mein permitted synthetic CSV is enough.

**Pitch:** “ASHA ghar tak pahunchti hai. ASHA Saath uska din plan karta hai aur visit mein nikli support need ko government service ya participating local NGO tak le jaata hai. Hum dikhate hain kisne request accept ki, kya help delivered hui, aur jo case unresolved hai uska next action kya hai.”

Winning chance ka reliable percentage public research se nahi nikal sakta. Strong submission ka basis working PS core, understandable complete journey, honest market comparison and practical partner operations hoga.
