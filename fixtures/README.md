# Synthetic demo fixtures

All people/tasks, localities, staff and providers below are invented. Coordinates are constructed points for an **abstract route illustration**, not actual household positions, village boundaries or field travel data.

- [demo-caseload.csv](demo-caseload.csv): exactly 24 distinct tasks; two staff; one patient reference has two legitimate distinct tasks.
- [demo-config.json](demo-config.json): visible frozen date/time, shift/travel assumptions and synthetic rule catalogue.
- [demo-service-offers.json](demo-service-offers.json): exactly three fictional document-help offers; registration/service/catchment/capacity fields separated.
- [demo-scenarios.json](demo-scenarios.json): deterministic starting state and actions for success, decline, expiry, withdrawal and race tests.

The demo clock starts **8 October 2026, 09:00 Asia/Kolkata**. Reset restores it and fixtures. Advance time deliberately for expiry scenarios; do not let old absolute fixture timestamps silently create a broken demonstration later.

Priority labels are synthetic configuration, not a national clinical schedule. The “escalation” and joint-cadre examples require separate handling. One future task illustrates projection without changing due dates.

Provider names must retain “(fictional)” in visible UI. All three offer the same nonclinical document-navigation category; the first has wrong catchment for DEMO-VILLAGE-A, while the second/third can participate in the defined journey. Capacity-full decline is a scenario action after offering; it is not a fake booking success.

Public-pathway content points to official scheme discovery as informational navigation. No eligibility decision, document issuance, live application submission, health rule approval or benefit payment is simulated as genuine.
