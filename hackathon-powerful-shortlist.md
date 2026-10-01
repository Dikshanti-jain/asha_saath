# Revised shortlist: clear stakes and a strong live demonstration

8 October 2026. This replaces the earlier five recommendations after the user's clarification: the project must feel powerful, be easy to understand, and demonstrate a substantial solution. The original [70-option screening](hackathon-shortlist.md) remains a research record. All five below come from the [official problem list](https://hackathon.gitjaipur.com/ps); theme-local numbers identify them.

**First choice: Cybersecurity 02, Cloud IAM Privilege Escalation Path Visualizer.** Best alternative for a more immediately relatable physical workflow: Smart Automation 04, milk collection and sample coordination.

Actual team choices and judging weights are unknown. Competition judgments are tentative. None of these is globally unprecedented. The meaningful differentiation is the demonstrated decision, failure handling, and evidence.

| Priority | Official location | Plain-language project | Decisive moment in the demo | Main difficulty |
|---|---|---|---|---|
| 1 | Cybersecurity 02 | Find hidden routes from limited access to powerful access | A plausible permissions chain appears; a proposed change removes it | Correct permission/trust/deny semantics |
| 2 | Smart Automation 04 | Keep milk samples, farmers and payouts correctly linked | A mismatched sample is rejected before its result affects a farmer's payment | Identifying actual input mismatches, not guessing from unusual values |
| 3 | Agentic AI 04 | Choose mandi and vehicles by net proceeds | The highest quoted-price market loses after costs and losses | Defensible prices, grades and logistics assumptions |
| 4 | Web 3.0 01 | Verify signed academic credentials offline | With networking disabled, original credential passes and changed marks fail | Offline keys, freshness, challenge response and official Merkle/SMS requirements |
| 5 | Robotics and Drones 03 | Turn event footage into per-zone crowd visibility | A growing concentration becomes visible with estimated counts and a staff-facing view | Reliable counting, perspective and zone area calibration |

## 1. Cybersecurity 02 — Cloud IAM Privilege Escalation Path Visualizer

**Pitch:** “An account intended to have limited access can gain more powerful access through a combination of permissions. We show the chain and the precise change that breaks it.”

The technical premise is real. [AWS's PassRole guidance](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html) explains that passing a more privileged role to a service can allow that service to act with powers the original user lacks. Role trust, service permissions, conditions, explicit denies, boundaries and relevant organization policies can alter whether a proposed path is actually possible.

Keep the hackathon implementation to a documented subset of mock IAM data, at least five roles and twenty permissions as required by the brief. Demonstrate at least two paths and explain each edge. Add a “try this permission change” view, re-evaluate the graph, and show which modeled legitimate tasks survive. Do not interpret every role-to-role link as an executable escalation.

This can feel powerful because the output reveals a hidden relationship. Correctness matters more than a graph's appearance. [AWS Access Analyzer already exists](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html), so pitch the educational explanation and constrained remediation comparison rather than a claim of being the first cloud analyzer.

Measure path correctness against manually specified fixtures, unsupported cases disclosed, and legitimate tasks preserved after a proposed change. The product direction is a policy-review tool for development teams and cloud learners. Live exploitation or changes to a real account are unnecessary.

## 2. Smart Automation 04 — Milk-Collection Center Weighbridge + Quality-Sampling Coordinator

**Pitch:** “The wrong sample result should never determine the wrong farmer's payout. We link the farmer, can, sample and test result before calculating payment.”

[NDDB describes quality-based milk payment](https://www.nddb.org/about/genesis/pattern), and [existing AMCU systems](https://sapplpp.nddb.coop/services/qa/technological-interventions) already combine weighing, testing and transaction slips. The useful hackathon contribution is traceable identity and exception handling in the sample workflow.

Use mock farmer identities, QR-tagged containers, unique sample IDs, manually entered simulated weight and fat/SNF results, and a disclosed rate table. Support the official payout calculation, running totals, quality view and daily settlement. Test duplicate sample IDs and mismatched sample-can associations. Show two tagged containers on stage, attempt to submit the wrong result, stop the transaction, correct it and produce an itemized receipt.

The system can catch inconsistent IDs; it cannot establish that someone physically poured the correct milk into a tagged tube. Do not claim to detect adulteration using a camera, ordinary water sensor, or payout software. Actual fat/SNF readings need appropriate testing equipment. Hardware is optional for the official simulated 30-farmer demo.

Measure known mismatch cases caught, incorrect duplicate payouts prevented, and daily settlement arithmetic. Future users could be smaller collection centers and cooperative operators. This is the strongest simple human story in the revised shortlist.

## 3. Agentic AI 04 — Agricultural Market Mandi Price Arbitrage & Logistics Agent for Farmer Cooperatives

**Pitch:** “The mandi with the biggest price on the screen is not necessarily the one that puts the most money in the farmer's pocket.”

[eNAM already supports price discovery](https://www.enam.gov.in/web/) and provides [FPO/logistics-related services](https://www.enam.gov.in/web/pop-dashboard/trading-platforms/platforms). Build the concrete allocation decision over inventory, vehicle capacity, fees, distance, saleable quantity and price freshness.

Scope the demo to one commodity and grade, three mandi options, and two vehicles. Show a batch-level allocation and schedule. Delay a vehicle or change a capacity constraint and demonstrate the recalculated plan. Separate observed prices from assumed quality loss and fees; reported prices are not guaranteed bids.

Illustrative arithmetic only: for a 5,000 kg batch, market A at INR 20/kg with 2% loss, INR 3,000 transport and INR 1,000 fees yields INR 94,000. Market B at INR 24/kg with 10% loss, INR 14,000 transport and INR 2,000 fees yields INR 92,000. These are invented scenario inputs, not current market quotes or validated loss rates. Sensitivity to the assumed losses should be visible.

Measure net proceeds in the stated scenario and constraint violations. A freshness indicator, source timestamps, and uncertainty ranges make the result more credible. A potential pilot is an FPO dispatcher. The project should not promise a fixed income increase or guarantee that a mandi will accept a batch.

## 4. Web 3.0 01 — Offline-First Verifiable Academic Credential Wallet for Unconnected Students

**Pitch:** “A trusted issuer's signed credential can be checked without contacting its server for every verification, even when both devices are offline.”

Build issuer, holder and verifier personas. Preload trusted issuer keys and necessary verification material. Issue a signed mock credential; generate a verifier QR challenge; return a holder-signed response bound to that challenge. Meet the brief's Merkle-inclusion check and signed-root refresh through the SMS demonstration. The official statement explicitly permits a signed Merkle root instead of a real blockchain.

The decisive demonstration is to disable networking, successfully verify the original credential, change a protected field and watch verification fail, then try a reused response to a fresh challenge. Show status-data freshness separately: offline cryptographic authenticity cannot establish that no revocation occurred after the cached status was created. A stale status should not silently become “currently valid.”

[W3C VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/) supplies the issuer-holder-verifier model, but a data format alone does not implement signatures or trust. Arbitrarily uploaded certificate photos are not authenticated by this system. Use a clearly identified mock issuer during the hackathon.

Measure changed-content rejection, replay handling, and behavior with expired/stale material. This fits disconnected recruitment/training verification. The hard part is correct offline trust and freshness, not a certificate-display website.

## 5. Robotics and Drones 03 — Campus Event Crowd-Density Heatmap Drone (Pre-Recorded Footage + Pipeline)

**Pitch:** “A venue can look acceptable overall while one entrance is becoming crowded. We show estimates for individual zones so the event team can inspect and respond.”

The official problem allows prerecorded footage, so a live drone is not necessary. Use permissioned or appropriately licensed footage. Define three zones and show per-zone estimated counts, trends, frame timestamps and uncertain frames. Density in people per square metre requires area/perspective calibration; otherwise label the output as relative concentration or estimated counts.

The [DroneCrowd benchmark paper](https://openaccess.thecvf.com/content/CVPR2021/html/Wen_Detection_Tracking_and_Counting_Meets_Drones_in_Crowds_A_Benchmark_CVPR_2021_paper.html) demonstrates that this is an established research task involving detection, tracking and counting. Dataset/model availability, license and suitability must be checked before building around them. A generic detector can miss small or occluded people.

Select a short clip where concentration changes between zones. Compare a sample of estimated counts with manually counted frames, show errors, and provide a staff-facing notification/acknowledgment view. No automatic routing instruction or claim of predicting a stampede is needed. This is a decision-support prototype, not a certified crowd-safety system.

Measure per-zone count error on annotated sample frames, processing latency and stale-frame handling. The opportunity is event staff and venue operations, subject to actual counting performance. Its visual impact is strong, but data readiness is more uncertain than the first two options.

## Why beehive audio did not enter the final five

IoT 03 is a plausible niche project. However, its brief requests normal, queenless, swarming and pest-disturbance acoustic detection. [Bee Together](https://pmc.ncbi.nlm.nih.gov/articles/PMC11435449/) discusses heterogeneous queen-status datasets and the scarcity of annotated swarming data. Merely playing four recordings with hardcoded labels would not show a detector. Without credible labels and validation for the required states, its novelty is less useful than a complete demonstration of one of the chosen workflows.

## Final selection

Choose Cybersecurity 02 if the team can explain its modeled permission semantics confidently. Choose Smart Automation 04 if the priority is that every judge immediately understands a concrete loss and sees it prevented on stage. For any choice, implement the official core requirements first, then one decisive extension. None needs a generic chat interface to communicate its value.
