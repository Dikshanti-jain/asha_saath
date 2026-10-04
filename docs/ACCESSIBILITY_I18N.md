# Accessibility and Hindi/English implementation

Version 1.0. Target: complete core flows meet WCAG 2.2 AA; test results pending.

## 1. Baseline and claims

[GIGW 3.0](https://guidelines.india.gov.in/scope-and-objective/) references WCAG 2.1. This project targets [WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA and government-service usability patterns. No STQC/GIGW certificate is claimed.

## 2. Required checks

| Area | Requirement / observable check |
|---|---|
| Semantics | Landmark header/nav/main/footer, one h1, logical headings, buttons for actions and links for navigation |
| Keyboard | All core flows without mouse; no trapped focus; visible focus; dialogs restore focus |
| Colour | Text + icon status; normal text ≥4.5:1, large text ≥3:1; relevant non-text contrast ≥3:1 |
| Reflow/zoom | 320 CSS-pixel reflow, 200% text enlargement; essential text/actions not clipped |
| Targets | Product prefers 44–48px field actions; WCAG 2.2 AA minimum/exception rules assessed separately |
| Forms | Persistent labels, instructions, required status, inline errors and focusable error summary |
| Status updates | Polite live region for sync/save; urgent error announced without repeated disruptive alerts |
| Tables/maps | Caption/headers/sort semantics; list alternative for abstract route; no map-only directions |
| Motion | Reduced motion supported; no autoplay/carousel dependencies |
| Authentication | Accessible labels/autofill and no unnecessary puzzle/cognitive-only challenge |

Automated auditing catches only part of the requirements. Manually test keyboard, a screen reader, Hindi reading order and mobile text resize.

## 3. Language implementation

Persist language preference without storing case data. Set html lang=en or hi correctly; mark embedded phrases of a different language where appropriate. Use a visible हिन्दी / English control, not a flag.

Maintain shared translation keys with the same placeholders in en/hi. Dates are displayed with locale-appropriate formatting and an explicit day/date when ambiguity matters; persisted dates remain ISO, time zone Asia/Kolkata. Numbers in the first demo may use familiar Latin digits consistently; validate alternatives with workers.

Hindi buttons grow/wrap; do not fix their width to English text. Devanagari requires adequate line height and compatible fonts. Do not add Latin letter-spacing styles to Hindi.

## 4. Comprehension

Use plain verbs and specific outcomes. Explain “reported delivered” as awaiting confirmation, not “success.” Consent lists actual fields and provider. Scheme cards explain provisional applicability and authority approval in short language.

Do not require voice interaction to complete any task. Optional voice draft later requires explicit confirmation and does not infer clinical risk from speech.

## 5. Test set

Use 320/390/768/1440 widths, Hindi and English, long locality/provider labels, screen zoom, system font fallback, keyboard-only, offline state, table sorting and consent withdrawal. Run checks on completed flows rather than an isolated component gallery.
