# Team Communication: LearnWorlds 30-Day Trial Status & Launch Activation Notice

**Author**: Luke Huff  
**Recipients**: Steve & Gerard Rick Jardin  
**Subject**: 5 to THRiVE Practitioner Lab — LearnWorlds 30-Day Trial Expiration, Billing Activation & Launch Timeline  
**Status**: Ready-to-Send  

---

## Executive Context

- **LMS Instance**: `https://thrive-coaching.learnworlds.com`
- **Trial Expiration**: Tuesday, December 8, 2026
- **Critical Risk**: Letting the 30-day trial lapse would cause school expiration during Module 2 of the live cohort, locking out 21 enrolled practitioners, breaking custom domains, and severing private Squad community spaces.
- **Hard Billing Deadline**: **Friday, November 27, 2026** (prior to Session 0 Pre-Flight on Saturday, November 28).
- **Cohort Cap**: Strictly 21 seats across Squad A (Seats 1–7), Squad B (Seats 8–14), and Squad C (Seats 15–21).

---

## Format A: Crisp Slack / Teams Message (Ready to Send)

```markdown
Hey @Steve @Gerard — Quick operational sync on the 5 to THRiVE Practitioner Lab:

1. **LearnWorlds 30-Day Trial & Billing**:
   Our LearnWorlds trial expires on **Tuesday, December 8, 2026**. Because our live cohort launches **Monday, Nov 30** (with Session 0 Pre-Flight on **Nov 28–29**), the trial would expire during Week 2! To prevent student lockouts or LMS interruptions across Squads A, B, and C, **we must activate the paid LearnWorlds subscription by Friday, November 27 at the latest**.

2. **Key Launch Milestones**:
   - **Thu, Nov 12 @ 12:00 PM MT (2:00 PM ET)**: Top-of-funnel Lunch & Learn live demo (THRiVE voice dictation, automated DAP notes, $9/mo seat economics).
   - **Fri, Nov 27**: Hard deadline for LearnWorlds paid subscription activation under Admin -> Settings -> School Billing.
   - **Sat Nov 28 – Sun Nov 29**: Session 0 Pre-Flight Onboarding & Weekend Drop-In Tech Clinics (Gerard on deck for mic calibration & squad verification).
   - **Mon, Nov 30 @ 5:00 PM MT**: Cohort Day 1 Live Launch (Sessions 1A/1B, strictly 21 seats capped across Squads A/B/C).
   - **Wed, Jan 6, 2027**: Module 6 Capstone, DAP note automation review, and Practitioner Lab Certification.

3. **Team Action Items**:
   - **Steve**: Final pass on the 7-module structure generated from `learnworlds_course_prompt.md`, and confirm the 3 private Community spaces (Squad A, B, C; 7 seats each).
   - **Gerard**: Confirm availability for the weekend drop-in tech clinic hours (Nov 28–29) and keep an eye on `/api/event` telemetry for incoming registrations and IT tickets.
   - **Luke**: Production deployment of `onboarding.html`, `how-to-use.html`, and synced $297 funnel checkout; calendar sync (.ics) verified.

Let me know if anyone needs adjustments to dates or setup steps before Thursday’s Lunch & Learn!
```

---

## Format B: Formal Executive Email Memo

```text
Subject: ACTION REQUIRED: LearnWorlds 30-Day Trial Expiration, Billing Activation & 5 to THRiVE Practitioner Lab Launch Timeline

Hi Steve and Gerard,

Ahead of our upcoming launch sequence, here is a concise briefing on our LearnWorlds LMS operational status, billing requirements, and key deadlines for the 5 to THRiVE Practitioner Lab:

1. LearnWorlds 30-Day Trial Status & Billing Activation Deadline
Our LearnWorlds LMS trial (active at https://thrive-coaching.learnworlds.com) expires on Tuesday, December 8, 2026. 
Because our live cohort officially begins on Monday, November 30 (preceded by Session 0 Pre-Flight on Saturday, November 28), letting the trial run to its natural end would cause our school to expire in the middle of Module 2. 

To eliminate any risk of student lockout, custom domain disruption, or squad permission lapses for our 21 enrolled practitioners:
• BILLING ACTIVATION DEADLINE: Friday, November 27, 2026
• Action: Add payment method under LearnWorlds Admin -> Settings -> School Billing.

2. Launch Sequence Calendar
• Thursday, November 12 (12:00–12:30 PM MT / 2:00 PM ET): 
  Live 30-Minute Lunch & Learn Briefing — Live demonstration of the THRiVE Report voice dictation protocol, automated DAP note generation, and $9/mo client seat model.
• Friday, November 27:
  LearnWorlds billing activation deadline.
• Saturday, November 28 – Sunday, November 29:
  Session 0 Pre-Flight Onboarding Hub live at thrivecoaching.ai/onboarding.html. Weekend Drop-In Tech Clinics hosted by Gerard for workstation mic calibration and Safe-Save cadence training.
• Monday, November 30 (5:00–6:30 PM MT):
  Official Day 1 Cohort Launch. Bi-weekly live labs begin on Mondays & Wednesdays, strictly capped at 21 practitioners across Squads A, B, and C (7 seats each).
• Wednesday, January 6, 2027:
  Module 6 Capstone, DAP note automation review, and Practitioner Lab Certification.

3. Role Assignments
• Steve: Review course modules in LearnWorlds AI Assistant against learnworlds_course_prompt.md, and confirm the 3 private spaces under Community -> "5 to THRiVE Practitioner Lab — Squads".
• Gerard: Lead Session 0 Weekend Drop-In Tech Clinics (Nov 28–29) and monitor /api/event webhook telemetry.
• Luke: Complete production build of onboarding.html, how-to-use.html (with 3-Tier guide & IT help desk), and synced $297 funnel checkout.

Please reply to confirm these dates and your availability for the November 28–29 weekend clinics.

Best,
Luke
```
