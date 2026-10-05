# Government-style design system

Version 1.0 · Our proposed tokens, informed by [government design research](DESIGN_RESEARCH.md).

## 1. Design character

Formal, calm, practical and recognizably Indian public-service oriented. Operational pages should resemble a clear service portal: utility controls, identity, navigation, page title, structured data and ownership/help footer. The worker experience is mobile-first; the coordinator portal supports dense review tasks.

Product identity: **ASHA Saath / आशा साथ**. Subtitle: **Visit Planning & Community Support / दौरा योजना और स्थानीय सहायता**.

Permanent label: **Synthetic demonstration — no live government or NGO connection / काल्पनिक डेमो — सरकारी या NGO सिस्टम से लाइव जुड़ाव नहीं**.

Use an original simple outlined people/route symbol or initials. Do not copy the national emblem, state seal, ministry names as owner or “Government of India” identity strip. References may retain their original marks only inside the research screenshot document.

## 2. Colour tokens

Canonical machine-readable values: [design/tokens.json](../design/tokens.json).

| Token | Hex | Use |
|---|---|---|
| navy-900 | #102A43 | Utility strip, navigation and strong text |
| navy-700 | #1D4E89 | Primary buttons/links and selected navigation |
| saffron-500 | #F29D38 | Decorative rule, active underline and limited emphasis |
| saffron-900 | #7A3E00 | Text in pale warning/accent panels |
| green-800 | #166534 | Confirmed/success text |
| green-50 | #F0FDF4 | Success background |
| red-800 | #991B1B | Escalation/error text |
| red-50 | #FEF2F2 | Error background |
| amber-900 | #78350F | Pending/stale/caution text |
| amber-50 | #FFFBEB | Caution background |
| blue-50 | #EFF6FF | Information/selected row background |
| slate-900 | #172B4D | Body text |
| slate-600 | #475569 | Secondary text |
| slate-200 | #CBD5E1 | Decorative border/divider |
| slate-500 | #64748B | Input/control boundary when contrast matters |
| surface | #FFFFFF | Panels and fields |
| page | #F5F7FA | Page background |

**Saffron is not a white-text button background.** Use navy text on saffron, or keep the button navy with white text. Links are underlined in prose. Decorative light borders cannot substitute for a visible interactive boundary.

Statuses always include a readable label and icon. “High priority” and “clinical escalation” are distinct; a red badge alone is insufficient.

## 3. Typography

- Latin: system sans-serif stack; Devanagari: Noto Sans Devanagari if properly self-hosted/licensed, otherwise an available compatible system fallback.
- Body/fields/buttons: **16px minimum**, line height 1.5; Hindi body 1.6.
- Secondary metadata: 14px where nonessential; never shrink important consent/error/action labels.
- Desktop page title: 28px / 36px; mobile: 24px / 32px.
- Section title: 20px / 28px; card title: 18px / 26px.
- Table/body numbers: 16px tabular numerals when available.
- Weight: 400 body, 500 labels, 600 headings/actions. Avoid all-cap paragraphs and decorative serif body text.
- Do not put Hindi letter spacing or fixed-height clipped text on controls. Labels may wrap to two lines.

## 4. Spacing, grid and dimensions

Base scale: 4, 8, 12, 16, 24, 32, 40, 48, 64px.

| Element | Desktop | Mobile |
|---|---|---|
| Content max width | 1280px, centred | Full width |
| Page gutter | 24–32px | 16px; 12px at 320px |
| Utility bar | 32px preferred; controls can expand | Essential controls only, ≥44px hit targets |
| Identity row | 72px preferred | 64px preferred, text can expand |
| Primary nav | 48px preferred | Drawer or compact role-specific navigation |
| Card padding | 24px | 16px |
| Button/input height | ≥44px | ≥48px for main worker actions |
| Panel radius | 6px | 6px |
| Badge radius | 4px | 4px |
| Modal width | Max 560px | Full-width drawer/dialog with safe margins |

Use one-column worker cards below 768px. At ≥1024px coordinator view may use 240px contextual side navigation plus flexible content. Do not add two persistent navigation sidebars. The app shell itself is consistent across roles.

At 320px no whole-page horizontal scrolling. A genuinely wide table may use a labelled internal scroll container and a mobile card alternative for the core fields/actions.

## 5. Shell specification

Desktop order:

1. Navy utility strip: skip-to-content link, “Hackathon prototype”, Hindi/English, text size/help. No fake helpline.
2. White identity row: original mark/name/subtitle left; current role/user and help right.
3. Navy navigation: role-appropriate links; active link has text emphasis + saffron underline.
4. Pale prototype notice; display on every protected/demo page without a blocking popup.
5. Breadcrumb and contextual title/description; location/date/clock shown where relevant.
6. Main content with data freshness and clear actions.
7. Footer: “ASHA Saath hackathon team”, privacy/accessibility/help links, source-check date where appropriate.

Mobile worker shell: compact identity/language/help, visible prototype notice, page title/date/sync, then tasks. Bottom navigation has **Today / आज**, **Needs / सहायता**, **Help / मदद**. Keep content padding above the fixed footer; no action hidden by it.

## 6. Components and interaction

| Component | Required anatomy and behaviour |
|---|---|
| Page heading | One h1, short purpose, date/area context, one primary action |
| Metric strip | Label, value, denominator/cohort; no fake national impact numbers |
| Task card | Stop/order, synthetic ID/locality, priority reason, due window, estimated time, visit action |
| Data table | Caption, proper header cells, sort state, visible filters, row action labels |
| Filter group | State → district → area type → block/village or ward; dependent reset warning if selections change |
| Status badge | Icon + text + appropriate colour; title explains meaning if needed |
| Stepper | Current step/next action; completed visual only after persisted result |
| Form field | Persistent label, example/hint, required text, inline error; placeholder not sole label |
| Consent panel | Purpose, recipient, exact fields, revocation explanation, unchecked permission control |
| Dialog | Heading, purpose, focus trap, escape, return focus, primary/secondary actions; no auto-open promotion |
| Toast | Supplement only; important errors/actions also remain inline |
| Empty state | Explain why, show next action; no “0 = success” assumption |
| Offline banner | Offline/last-sync/queued count, what can be saved, what must wait |
| Source card | Official title/link, checked date, local approval status and limits |
| Exclusion list | Each offer/task reason; no hidden matching failures |

Buttons use verbs: Generate plan, Record visit, Request document help, Offer to provider, Accept request, Record arrangement, Report delivered, Confirm received, Close case.

“Approved”, “funded”, “verified”, “accepted” and “confirmed” cannot be interchangeable labels.

## 7. Focus, errors and motion

Use a visible dual focus ring (light separation plus navy outer ring) so it works on light and dark surfaces. Focus must not be obscured by sticky elements. Hover state is supplementary, never the sole action cue.

Inline error uses red text, icon and explanatory instruction. Preserve typed input; focus the error summary after failed submission. Version conflicts show the current server state and reload/resolve action.

Motion is limited to brief nonessential feedback. Respect prefers-reduced-motion; no pulsing emergency badge, autoplay video or auto-advancing dashboard.

## 8. Visual review checklist

- Same spacing/type/button rules across all three roles.
- Worker next action visible without a large hero.
- Hindi consent and labels wrap fully.
- Saffron pairing uses sufficient contrast.
- “No match”, “stale capacity”, “offline”, “expired”, “withdrawn” and “disputed” look deliberate.
- Prototype/ownership/source labels remain readable.
- No real government/provider marks in product identity.
- Print output is white, concise and clearly synthetic.
