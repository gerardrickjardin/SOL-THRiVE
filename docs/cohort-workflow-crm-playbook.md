# THRiVE Cohort CRM, Waiver & Course Launch Playbook

## 1. Vercel Production Environment Variables
Ensure these environment variables are configured in Vercel (`sol-th-ri-ve`) for Production:
- `VISION_CONTROL_WEBHOOK_URL` — Inbound Webhook URL from your Vision Control / GoHighLevel workflow
- `VISION_CONTROL_API_KEY` — Optional Bearer auth token if your webhook validates `Authorization`
- `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Live Stripe checkout & payment webhook verification

---

## 2. Pipeline Architecture (`21-Day THRiVE Sprint — Cohort Pipeline`)
Create one dedicated pipeline in Vision Control with 6 ordered stages:
1. **Lead / Lunch & Learn** (`event_source` = `lunch-and-learn`, `cohort-inquiry`, `support-desk`)
2. **Seat Reserved / Paid** (`event_source` = `stripe-payment`, `amount_usd` = `500`)
3. **Waiver Signed — Onboarding Ready** (`event_source` = `thrive-waiver`, `waiver_signed` = `true`)
4. **Session 0 Pre-Flight Complete** (`event_source` = `thrive-report-complete` & `flow-survey-complete`)
5. **Active in Squad (Week 1–3)** (Assigned to `Squad A`, `Squad B`, or `Squad C` — max 7 seats each)
6. **Sprint Completed — Day 21 Verified** (Eligible for 50% Risk-Split review if `funding_source` = `Direct Self-Pay`)

---

## 3. Inbound Webhook Field Mapping (`/api/event` & `/api/stripe-webhook`)
Every form submission and assessment completion forwards flat top-level fields to `VISION_CONTROL_WEBHOOK_URL`:
- **Identity:** `first_name`, `last_name`, `full_name`, `email`, `phone`, `company_name` (`sponsor_org`)
- **Routing:** `event_source` (`thrive-waiver`, `stripe-payment`, `flow-survey-complete`, `thrive-report-complete`, `hope-index-complete`)
- **Waiver Fields:** `waiver_signed`, `waiver_ref` (`THR-XXXXXX`), `agreement_version` (`SOLab-THRiVE-Method-v1`), `funding_source` (`Direct Self-Pay` or `GoFundMe / Scholarship / Sponsor`), `printed_name`, `signed_date`, `signature_mode`, `typed_signature`, `signature_data_url`, `sms_consent`
- **Assessment Fields:** `assessment_name`, `assessment_score`, `completed_assessments`

---

## 4. CRM Workflow Automation Sequence

### Workflow A — Stripe Payment Confirmed (`event_source == "stripe-payment"`)
1. Create/Update Contact + Tag `paid-direct` (`$500` Opportunity in **Seat Reserved / Paid**).
2. Send Payment Receipt Email + SMS linking straight to `/waiver` pre-filled (`https://www.thrivecoaching.ai/waiver?funding=direct&paid=1`).

### Workflow B — Waiver Signed (`event_source == "thrive-waiver"`)
1. Filter: `event_source` = `thrive-waiver` AND `waiver_signed` = `true`.
2. Create/Update Contact, map `waiver_ref`, `signed_date`, `funding_source`, `agreement_version`, and `signature_data_url`.
3. Add tags: `waiver-signed` + `self-pay` (if `Direct Self-Pay`) or `sponsored-seat`.
4. Move/Create Opportunity -> **Waiver Signed — Onboarding Ready**.
5. Wait 1 minute -> Send **Welcome Email** & **Welcome SMS**:

**Welcome Email:**
- **Subject:** `Welcome to THRiVE — Your Waiver ({{contact.waiver_ref}}) & Next Steps`
- **Body:** Confirm `{{contact.waiver_ref}}`, include the Lunch & Learn Google Meet joining link (`https://meet.google.com/bro-rgxh-rzd`, Tuesday, Nov 24 · 12:00 – 1:00pm America/Denver, Dial `(US) +1 567-331-1188 PIN: 756 129 618#`, More numbers: `https://tel.meet/bro-rgxh-rzd?pin=4024608972368`), and link directly to Session 0 Onboarding Hub (`https://www.thrivecoaching.ai/onboarding`), Day-1 Flow Survey (`https://www.thrivecoaching.ai/survey`), 6-Pillar THRiVE Report (`https://www.thrivecoaching.ai/profile`), and Class Schedule (`https://www.thrivecoaching.ai/classes`).

**Welcome SMS:**
> Welcome to THRiVE, {{contact.first_name}}! Your Waiver ({{contact.waiver_ref}}) is on file. Join our Lunch & Learn (Tue Nov 24, 12–1pm MT): https://meet.google.com/bro-rgxh-rzd (PIN 756 129 618#) & open Onboarding: https://www.thrivecoaching.ai/onboarding

### Workflow C — Session 0 Onboarding Nudge & Readiness (`T + 24 Hours`)
1. Wait 24 hours after `waiver-signed`.
2. If tag `thrive-report-done` OR `flow-survey-done` is missing, send nudge Email + SMS:
   > Quick check-in {{contact.first_name}} — complete your 6-Pillar THRiVE Report (https://www.thrivecoaching.ai/profile) & Flow Survey (https://www.thrivecoaching.ai/survey) before our Weekend Tech Clinic!
3. When both `thrive-report-complete` and `flow-survey-complete` arrive, automatically move Opportunity -> **Session 0 Pre-Flight Complete**.

### Workflow D — Tech Clinics, Squad Placement & Live Class Reminders
- **Weekend Tech Clinics (Dec 5–6):** Send reminder SMS/Email 24h and 1h prior with meeting link + mic & Personos setup link (`https://www.thrivecoaching.ai/personos-prompt`).
- **Squad Placement:** Assign Stage-4 attendees into **Squad A**, **Squad B**, or **Squad C** (7 per squad), open their Squad channel, and pin the `"Nobody Plays Alone"` & zero-screenshot confidentiality rules.
- **Weekly Sessions:** Trigger automated **T-24h** and **T-1h** reminders matching [classes.html](file:///Users/gerardrickjardin/Documents/Documents - Gerard%E2%80%99s%20Mac%20mini/SOL%20THRiVE/classes.html).

---

## 5. Day-21 Risk-Split Verification & Continuity Loop
Track the 4 Section-5 verification milestones inside CRM / Cohort Roster:
1. `Direct Self-Pay` verified on `waiver_ref`
2. Day-1 baseline `flow-survey-complete` + `thrive-report-complete`
3. Session & Squad check-in attendance + 21 daily ActionBoard strides
4. Day-21 Flow Survey re-assessment completed (`flow-survey-complete`)

At Day 21: celebrate completion, collect case-study / testimonial reflection, trigger Conditional 50% (\$500) refund review if eligible, and invite graduates into ongoing **$9/mo Personos ("Pur") Client Seat / Squad continuity**.
