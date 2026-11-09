# LearnWorlds AI Course Creation Prompt & Operational Author Guide
## 5 to THRiVE Practitioner Lab — November 30, 2026 Cohort
**Target Platform**: LearnWorlds LMS (`https://thrive-coaching.learnworlds.com/author/courses`)  
**Program Title**: `5 to THRiVE Practitioner Lab`  
**Target Audience**: Helping Professionals — Licensed Therapists, Life Coaches, Case Managers, and Recovery Specialists  
**Core Clinical Mission**: *"Equipping Therapists, Coaches, and Case Managers to 3x Client Outcomes in the 167 Hours Between Sessions."*  
**Cohort Cadence**: **Session 0 Pre-Flight Onboarding (Nov 28–29)** + **6-Week Live Experiential Lab** (Bi-weekly 90-minute live sessions on **Mondays & Wednesdays, 5:00–6:30 PM MT**, starting **Monday, November 30, 2026**)  
**Cohort Cap & Structure**: Strictly capped at **21 Practitioners**, divided into **3 Squads of 7** (**Squad A**, **Squad B**, **Squad C**)  
**3-Tier Ecosystem**: `thrivecoaching.ai` (The Front Door) → **LearnWorlds** (The Classroom) → **Personos AI** (The Clinical Execution Engine at $9/month per client seat)

---

## Table of Contents
1. [SECTION 1: LearnWorlds Author Operational Guide & Setup Configuration](#section-1-learnworlds-author-operational-guide--setup-configuration)
   - 1.1 Recommended AI Course Creator Settings
   - 1.2 Step-by-Step Workflow in LearnWorlds (`thrive-coaching.learnworlds.com/author/courses`)
   - 1.3 Setting Up the 3 Private Practitioner Squads (Squad A, Squad B, Squad C)
   - 1.4 10-Second DevTools Modal Bypass (If the White Setup Screen Reappears)
2. [SECTION 2: Master Monolithic LearnWorlds AI Course Creation Prompt (Copy-Paste Ready)](#section-2-master-monolithic-learnworlds-ai-course-creation-prompt-copy-paste-ready)
   - Complete Self-Contained Prompt for Module 0 + Modules 1–6 of the **5 to THRiVE Practitioner Lab**
3. [SECTION 3: Modular Prompt Blocks (Module 0 through Module 6 + Squads)](#section-3-modular-prompt-blocks-module-0-through-module-6--squads)
   - 3.0 Module 0 (Nov 28–29): Session 0 — Pre-Flight Onboarding, Dictation Calibration & Drop-In Tech Clinics
   - 3.1 Module 1 (Week 1): The 167-Hour Bottleneck & The Observer Stance (SOL Theory & RellaFit)
   - 3.2 Module 2 (Week 2): The THRiVE Report Protocol (Traits & Hobbies) & The "Safe-Save" Mechanic
   - 3.3 Module 3 (Week 3): Relational Architecture (Relationships & Interests)
   - 3.4 Module 4 (Week 4): Synthesizing the Core (Values & Experiences)
   - 3.5 Module 5 (Week 5): Filling the G.A.P.S. & Action Board Generation
   - 3.6 Module 6 (Week 6): Clinical Hand-Off, Automated DAP Notes & The $9/Month Seat Economics
   - 3.7 Community Space Prompts for Squad A, Squad B & Squad C (7 Seats Each)
4. [SECTION 4: Complete 6-Week Cohort Calendar & Curriculum Matrix](#section-4-complete-6-week-cohort-calendar--curriculum-matrix)

---

# SECTION 1: LearnWorlds Author Operational Guide & Setup Configuration

### 1.1 Recommended AI Course Creator Settings
When you click **`+ Create course` → `Create course with AI`** inside `https://thrive-coaching.learnworlds.com/author/courses`, use these exact clinical B2B parameters:

| Field | Recommended Setting | Why |
| :--- | :--- | :--- |
| **Course Title** | `5 to THRiVE Practitioner Lab` | Matches Steve's official cohort blueprint. |
| **Course Subtitle** | `Equipping Therapists, Coaches, and Case Managers to 3x Client Outcomes in the 167 Hours Between Sessions` | Replaces consumer fairytale hooks with clinical authority. |
| **Primary Topic** | `Clinical Practice Augmentation, Applied Behavioral Health (SOL Theory & RellaFit), and Personos AI Integration` | Positions the course for licensed clinicians, coaches, and case managers. |
| **Target Audience** | `Licensed therapists, life coaches, case managers, and recovery specialists working across addiction recovery, housing stability, workforce development, emotional distress, and interpersonal conflict.` | Ensures LearnWorlds AI writes at a professional practitioner level—zero fairytale/Cinderella/magic wand metaphors. |
| **Course Tone** | `Clinical Authority, Evidence-Based, Experiential, High-Touch, Practical` | Matches the Practitioner Lab tone. |
| **Generation Mode** | **`With Detailed Planning`** | Allows you to verify Module 0 through Module 6 before final generation. |

---

### 1.2 Step-by-Step Workflow in LearnWorlds
1. Go to `https://thrive-coaching.learnworlds.com/author/courses` and click **`+ Create course`**.
2. Choose **`Create course with AI`** (or create a Blank Course and use the AI Assistant per section).
3. Enter the parameters from **Table 1.1** above and select **`With Detailed Planning`**.
4. Copy the entire **[Master Monolithic Prompt](#section-2-master-monolithic-learnworlds-ai-course-creation-prompt-copy-paste-ready)** in Section 2 below and paste it into the AI prompt / course description box.
5. Click **`Generate`** to create the 7-part skeleton (**Module 0** + **Modules 1–6**).
6. Inside each generated module, if you want LearnWorlds AI to flesh out specific lessons, assessments, or homework modules in more detail, paste the matching **Modular Prompt (3.0–3.6)** from Section 3.

---

### 1.3 Setting Up the 3 Private Practitioner Squads (Squad A, Squad B, Squad C)
Steve's blueprint specifies **21 students divided into 3 Squads of 7** for peer review and co-coaching:
1. In the left sidebar of LearnWorlds Admin, click **`Community`** (or **`Communication` → `Community`**).
2. Create a Collection titled: **`5 to THRiVE Practitioner Lab — Squads`**.
3. Inside that Collection, create **3 Private Spaces** (Access: *Private / Invited Users Only*):
   - **`Squad A — Practitioner Co-Coaching Lab (7 Seats)`**
   - **`Squad B — Practitioner Co-Coaching Lab (7 Seats)`**
   - **`Squad C — Practitioner Co-Coaching Lab (7 Seats)`**
4. Paste the **Squad Welcome Post Prompt (Section 3.7)** into each Squad space to seed the initial peer-review and breakout room discussion thread.

---

### 1.4 10-Second DevTools Modal Bypass (If the White Setup Screen Reappears)
If `thrive-coaching.learnworlds.com/author/courses` ever shows the blank white `.wizard-window-wrapper.-school` overlay again, open DevTools (**`Cmd + Option + I` → Console**) and run:
```javascript
document.querySelectorAll('.wizard-window-wrapper, .wizard-wrapper, .modal-backdrop, .v-modal').forEach(el => el.remove()); document.body.style.overflow = 'auto'; document.documentElement.style.overflow = 'auto';
```

---

# SECTION 2: Master Monolithic LearnWorlds AI Course Creation Prompt (Copy-Paste Ready)

> **Instructions for Luke**: Copy everything inside the box below (between `=== START OF MASTER PROMPT ===` and `=== END OF MASTER PROMPT ===`) and paste it directly into the LearnWorlds AI Course Creator.

```text
=== START OF MASTER PROMPT ===
ROLE & CLINICAL DIRECTIVE:
You are an expert Clinical Curriculum Architect and Instructional Designer working with Steve (Curriculum Architecture, SOL Theory & RellaFit Integration, Personos System Prompts), Luke (Web Integration, LearnWorlds Administration & Platform Delivery), and Gerard (Backend Automations, Diagnostic Triage Surveys & Live IT Support).

Design the complete, authoritative 7-module course structure (Module 0 + Modules 1 through 6), learning activities, live lab session placeholders, co-coaching homework assignments, and squad discussion prompts for the "5 to THRiVE Practitioner Lab" hosted on LearnWorlds.

STRICT TONE & MESSAGING GUARDRAILS:
- Target Audience: Helping professionals—licensed therapists, life coaches, case managers, and recovery specialists.
- Tone: Clinical-grade authority, grounded behavioral science, experiential, and high-touch.
- PROHIBITED METAPHORS: Do NOT use consumer fairytale, Cinderella, Fairy Godmother, Harry Potter, or Magic Wand metaphors anywhere in the curriculum. We are training clinical and helping professionals to use Personos AI as a clinical-grade force multiplier.

CORE MISSION & CLINICAL OBJECTIVE:
- Headline Hook: "Equipping Therapists, Coaches, and Case Managers to 3x Client Outcomes in the 167 Hours Between Sessions."
- The Goal: Triple client outcome velocity across five core domains ("5 to THRiVE"):
  1. Addiction recovery
  2. Housing stability
  3. Workforce development
  4. Emotional distress
  5. Interpersonal conflict
- The Clinical Bridge: Traditional care only touches 1 hour a week. Personos AI and the THRiVE framework extend practitioner presence and structured habit accountability across the other 167 hours between sessions, shifting clients from the "reactive character" to the grounded "Observer" (integrating SOL Theory and RellaFit).

COHORT STRUCTURE, SCHEDULE & SQUADS:
- Launch Date: Monday, November 30, 2026 (preceded by Session 0 Pre-Flight Onboarding on Saturday, Nov 28 & Sunday, Nov 29).
- Cohort Cap: Strictly capped at 21 practitioners, divided into 3 private Squads of 7 (Squad A, Squad B, and Squad C) for peer review, breakout lab work, and co-coaching.
- Live Cadence: 6-Week Cohort featuring bi-weekly 90-minute live sessions on Monday and Wednesday evenings from 5:00–6:30 PM Mountain Time (MT).
- Live Session Format: A high-touch experiential blend of:
  1. Conceptual grounding (SOL Theory, RellaFit, and the Observer stance)
  2. Live co-coaching demonstrations
  3. Small-group breakout room lab work (by Squad)
  4. Real-time Personos AI & Action Board configuration

THE 3-TIER TECH ECOSYSTEM:
1. thrivecoaching.ai (The Front Door): Conceptual lecture map, marketing videos, and registration interface.
2. LearnWorlds (The Classroom): Houses the 6-week curriculum, session replays, homework modules, and Squad A/B/C community spaces.
3. Personos AI (The Clinical Execution Engine): The single secure container where client profiles live, featuring voice dictation, persistent client memory profiles, the "Safe-Save" protocol (pressing Enter every 1–2 minutes during dictation), automated clinical DAP note generation, and sustainable $9/month per client seat economics.

THE 3-STEP THRiVE WORKFLOW (CORE METHODOLOGY):
Every practitioner in the lab masters this evidence-based, strengths-first sequence:
- STEP 1: The Flow Survey (Baseline Diagnostic)
  Pinpoints the specific friction ("Ugg") slowing the client down, measuring baseline Agency, Clarity, and Momentum. Used for intake triage prior to session work.
- STEP 2: The THRiVE Report (Strengths Architecture)
  A 20-to-40-minute voice-driven interactive assessment inside Personos AI where the practitioner guides the client to uncover core internal resources across six pillars, enforcing a STRICT 3-TO-5 ITEM QUOTA PER PILLAR:
  * T — Traits (Innate superpowers)
  * H — Hobbies (Flow-state energy generators)
  * R — Relationships (The support cast and accountability mirrors)
  * I — Interests (Intellectual curiosity compass)
  * V — Values (Non-negotiable operating system)
  * E — Experiences (Crucible moments and highlight reels)
- STEP 3: Filling the G.A.P.S. & The Action Board
  Moving from self-awareness directly into Goal Achievement and Problem Solving (G.A.P.S.). Personos AI generates 5 creative next steps tailored through custom client lenses (e.g., philosophy, scripture, or thought leaders), prompting the client to commit to 1–3 concrete micro-actions on their live Action Board for the 167 hours between sessions.

REQUIRED 7-MODULE COURSE SKELETON (GENERATE ALL 7 MODULES WITH DETAILED ACTIVITIES):

MODULE 0 (Nov 28–29): Session 0 — Pre-Flight Onboarding & Tech Calibration
- Learning Objectives: Complete baseline triage via Gerard's Flow Survey, calibrate workstation speech-to-text microphone dictation for Personos AI, verify access to Squad A/B/C community spaces, and attend a weekend drop-in IT tech clinic (Saturday Nov 28 or Sunday Nov 29) to guarantee zero friction on Day 1.
- Required Activities:
  1. Welcome & Lab Orientation Video (Understanding the 3-Tier Ecosystem: thrivecoaching.ai, LearnWorlds, and Personos AI).
  2. Interactive Form/Embed Activity: Complete Gerard's Baseline Flow Survey Triage (measuring Agency, Clarity, and Momentum & identifying the "Ugg" friction point).
  3. Technical Lab Checklist: Workstation Speech-to-Text Dictation Calibration & Testing the "Safe-Save" Protocol in Personos AI.
  4. Live Session Schedule Block: Weekend Drop-In Tech Clinics with Gerard (Saturday Nov 28 & Sunday Nov 29).
  5. Squad Community Activity: Introduce your clinical practice type, primary client domain (Addiction Recovery, Housing Stability, Workforce Development, Emotional Distress, or Interpersonal Conflict), and confirm your Squad assignment (Squad A, B, or C).

MODULE 1 (Week 1 — Mon Nov 30 & Wed Dec 2, 5:00–6:30 PM MT): The 167-Hour Bottleneck & The Observer Stance
- Learning Objectives: Diagnose why traditional 1-hour-per-week care stalls across the other 167 hours; apply SOL Theory and RellaFit to shift clients from the "reactive character" caught in the "Ugg" of friction to the grounded "Observer"; interpret Flow Survey baseline scores (Agency, Clarity, Momentum) across the 5 core clinical domains.
- Required Activities:
  1. Core Concept Video & Reading: The 167-Hour Clinical Bottleneck & Extending Practitioner Presence with Personos AI.
  2. Deep Dive Lesson: SOL Theory & RellaFit — Shifting Clients from the Reactive Character to the Grounded Observer.
  3. Live Lab Session 1A (Monday, Nov 30, 5:00–6:30 PM MT): Conceptual Grounding & Flow Survey Triage Demonstration.
  4. Live Lab Session 1B (Wednesday, Dec 2, 5:00–6:30 PM MT): Co-Coaching Breakout Lab — Facilitating the Observer Shift.
  5. Practitioner Homework Assignment: Administer the Flow Survey to a test case or peer partner, identify their primary "Ugg" friction, and submit a 3-minute reflection on their baseline Agency, Clarity, and Momentum.
  6. Squad Discussion Prompt: Share how the 167-hour gap currently impacts your clients in your specific domain and how the Observer stance reframes intake resistance.

MODULE 2 (Week 2 — Mon Dec 7 & Wed Dec 9, 5:00–6:30 PM MT): The THRiVE Report Protocol (Traits & Hobbies) & The "Safe-Save" Mechanic
- Learning Objectives: Master the 20-to-40-minute voice-driven THRiVE Report assessment in Personos AI; execute the mandatory "Safe-Save" mechanic (pressing Enter every 1–2 minutes during live voice dictation to lock client memory profiles); facilitate the first two pillars—Traits (T: innate superpowers) and Hobbies (H: flow-state energy generators)—enforcing the strict 3-to-5 item quota per pillar.
- Required Activities:
  1. Protocol Walkthrough Video: Mastering Voice Dictation & The "Safe-Save" Mechanic (Pressing Enter Every 1–2 Minutes in Personos).
  2. Clinical Guide: Uncovering Pillar 1 — Traits (Innate Superpowers) & Pillar 2 — Hobbies (Flow-State Energy Generators) with the 3-to-5 Item Quota.
  3. Live Lab Session 2A (Monday, Dec 7, 5:00–6:30 PM MT): Live Voice-Driven Demonstration of Traits & Hobbies Intake.
  4. Live Lab Session 2B (Wednesday, Dec 9, 5:00–6:30 PM MT): Squad Breakout Lab — Co-Coaching Practice on T & H with Real-Time Dictation.
  5. Practitioner Homework Assignment: Conduct a recorded or live voice-dictated T & H session in Personos using the Safe-Save protocol and upload your captured 3–5 Traits and 3–5 Hobbies summary.
  6. Knowledge Check Quiz: Voice Dictation Calibration, Quota Rules (3–5 Items), and Safe-Save Protocol Mastery.

MODULE 3 (Week 3 — Mon Dec 14 & Wed Dec 16, 5:00–6:30 PM MT): Relational Architecture (Relationships & Interests)
- Learning Objectives: Guide clients through Pillar 3 — Relationships (R: mapping the support cast and accountability mirrors) and Pillar 4 — Interests (I: the intellectual curiosity compass); maintain the strict 3-to-5 item quota per pillar; leverage relational scaffolding and curiosity triggers to stabilize clients in housing, recovery, and interpersonal conflict domains.
- Required Activities:
  1. Clinical Lesson: Pillar 3 — Relationships (Mapping the Support Cast & Accountability Mirrors).
  2. Clinical Lesson: Pillar 4 — Interests (Activating the Intellectual Curiosity Compass to Counter Emotional Distress & Apathy).
  3. Live Lab Session 3A (Monday, Dec 14, 5:00–6:30 PM MT): Co-Coaching Demo — Navigating Thin Support Networks & Isolating Friction.
  4. Live Lab Session 3B (Wednesday, Dec 16, 5:00–6:30 PM MT): Squad Breakout Lab — Dictating R & I Pillars in Personos AI.
  5. Practitioner Homework Assignment: Complete the Relationships (3–5 items) and Interests (3–5 items) architecture in Personos for your practice case and submit your co-coaching reflection to the Review Center.
  6. Squad Discussion Prompt: How do we identify authentic "accountability mirrors" when a client in addiction recovery or housing instability believes they have zero support cast?

MODULE 4 (Week 4 — Mon Dec 21 & Wed Dec 23, 5:00–6:30 PM MT): Synthesizing the Core (Values & Experiences)
- Learning Objectives: Facilitate Pillar 5 — Values (V: the non-negotiable operating system) and Pillar 6 — Experiences (E: crucible moments and highlight reels); enforce the 3-to-5 item quota; synthesize all six T-H-R-I-V-E pillars into a completed 20-to-40-minute THRiVE Report inside the client's Personos memory profile.
- Required Activities:
  1. Clinical Lesson: Pillar 5 — Values (Uncovering the Client's Non-Negotiable Operating System).
  2. Clinical Lesson: Pillar 6 — Experiences (Mining Crucible Moments & Highlight Reels for Proven Resilience).
  3. Technical Walkthrough: Auditing & Finalizing the Complete 6-Pillar THRiVE Report in Personos Client Memory Profiles.
  4. Live Lab Session 4A (Monday, Dec 21, 5:00–6:30 PM MT): Live Demonstration — Synthesizing T-H-R-I-V-E into a Unified Strengths Architecture.
  5. Live Lab Session 4B (Wednesday, Dec 23, 5:00–6:30 PM MT): Squad Breakout Lab — Full 6-Pillar Synthesis & Peer Review.
  6. Practitioner Homework Assignment: Submit a completed 6-pillar THRiVE Report (with 3–5 items verified across T, H, R, I, V, and E) generated in Personos.

MODULE 5 (Week 5 — Mon Dec 28 & Wed Dec 30, 5:00–6:30 PM MT): Filling the G.A.P.S. & Action Board Generation
- Learning Objectives: Transition clients from strengths self-awareness directly into Goal Achievement and Problem Solving (Filling the G.A.P.S.); configure Personos AI to generate 5 creative next steps tailored through custom client lenses (philosophy, scripture, or thought leaders); guide the client to select and commit to 1–3 concrete micro-actions on their live Action Board for the 167 hours between sessions.
- Required Activities:
  1. Core Methodology Lesson: Filling the G.A.P.S. (Goal Achievement and Problem Solving) Across the 5 Clinical Domains.
  2. Personos Prompting Guide: Applying Custom Client Lenses (Philosophy, Scripture, Thought Leaders) to Generate 5 Creative Next Steps.
  3. Action Board Configuration Tutorial: Moving from 5 AI Options to 1–3 Committed Client Micro-Actions.
  4. Live Lab Session 5A (Monday, Dec 28, 5:00–6:30 PM MT): Live G.A.P.S. & Action Board Configuration Demo.
  5. Live Lab Session 5B (Wednesday, Dec 30, 5:00–6:30 PM MT): Squad Breakout Lab — Custom Lens Tuning & Action Board Stress-Testing.
  6. Practitioner Homework Assignment: Run a complete G.A.P.S. workflow in Personos using at least two different custom lenses, configure a live Action Board with 1–3 committed micro-actions, and submit the output.

MODULE 6 (Week 6 — Mon Jan 4 & Wed Jan 6, 5:00–6:30 PM MT): Clinical Hand-Off, Automated DAP Notes, and the $9/Month Seat Economics
- Learning Objectives: Generate automated clinical DAP notes (Data, Assessment, Plan) directly from Personos session transcripts and Action Boards; execute the clinical hand-off workflow so clients actively use their Action Board during the 167 hours between sessions; deploy the sustainable $9/month per client seat model (clinic/organization sponsorship vs. client self-pay transition upon graduation).
- Required Activities:
  1. Clinical Documentation Lesson: Automated DAP Note Generation (Data, Assessment, Plan) in Personos AI.
  2. Practice Operations Lesson: The $9/Month Client Seat Model — Clinic Sponsorship, Caseload Scaling, and Client Self-Pay Graduation Transitions.
  3. Live Lab Session 6A (Monday, Jan 4, 5:00–6:30 PM MT): End-to-End Clinical Hand-Off, DAP Note Automation & Caseload Implementation.
  4. Live Lab Session 6B (Wednesday, Jan 6, 5:00–6:30 PM MT): Cohort Capstone Presentations, Squad Reflections & Practitioner Certification.
  5. Capstone Assignment: Submit a complete end-to-end Practitioner Case Packet (1. Baseline Flow Survey Triage, 2. Complete 6-Pillar THRiVE Report with 3–5 items per pillar, 3. G.A.P.S. Custom Lens Output + Live Action Board with 1–3 micro-actions, and 4. Generated Clinical DAP Note).
=== END OF MASTER PROMPT ===
```

---

# SECTION 3: Modular Prompt Blocks (Module 0 through Module 6 + Squads)

If you use LearnWorlds' section-level AI generator to expand individual modules, copy-paste the specific block for that module below:

### 3.0 Modular Prompt — Module 0 (Nov 28–29): Session 0 — Pre-Flight Onboarding
```text
Create "Module 0 (Nov 28–29): Session 0 — Pre-Flight Onboarding & Tech Calibration" for the 5 to THRiVE Practitioner Lab.
Target Audience: Licensed therapists, life coaches, case managers, and recovery specialists (21 practitioners divided into Squad A, Squad B, and Squad C).
Include 5 learning activities:
1. Welcome & Ecosystem Orientation Video: How thrivecoaching.ai (The Front Door), LearnWorlds (The Classroom), and Personos AI (The Clinical Execution Engine) work together to triple client outcome velocity across the 167 hours between sessions.
2. Baseline Diagnostic Triage Activity: Instructions and link to complete Gerard's Flow Survey Triage, pinpointing specific client friction ("Ugg") and measuring baseline Agency, Clarity, and Momentum.
3. Workstation Voice Dictation Calibration Guide: Step-by-step instructions to test microphone speech-to-text input in Personos AI and practice the "Safe-Save" mechanic (pressing Enter every 1–2 minutes).
4. Live Weekend Drop-In Tech Clinic Schedule (Saturday, Nov 28 & Sunday, Nov 29): Live IT breakout room support with Gerard so every practitioner has zero technical friction before Monday's Day 1 session.
5. Squad Assignment & Introduction Checklist: Confirm placement in Squad A, Squad B, or Squad C (7 seats per squad) and post an initial introduction sharing practice type and primary client domain (Addiction Recovery, Housing Stability, Workforce Development, Emotional Distress, or Interpersonal Conflict).
```

### 3.1 Modular Prompt — Module 1 (Week 1): The 167-Hour Bottleneck & The Observer Stance
```text
Create "Module 1: The 167-Hour Bottleneck & The Observer Stance" for Week 1 (Monday, Nov 30 & Wednesday, Dec 2, 5:00–6:30 PM MT) of the 5 to THRiVE Practitioner Lab.
Include:
1. Core Lesson: Why traditional 1-hour-per-week clinical care stalls in the other 167 hours, and how Personos AI acts as a clinical force multiplier across 5 domains: addiction recovery, housing stability, workforce development, emotional distress, and interpersonal conflict.
2. Methodology Lesson: SOL Theory and RellaFit integration—how to shift a client from the "reactive character" stuck in the "Ugg" of friction to the grounded "Observer."
3. Live Session 1A (Monday, Nov 30, 5:00–6:30 PM MT): Conceptual Grounding & Live Flow Survey Triage Demonstration (evaluating baseline Agency, Clarity, and Momentum).
4. Live Session 1B (Wednesday, Dec 2, 5:00–6:30 PM MT): Squad Breakout Lab — Practicing the Reactive Character to Grounded Observer Shift.
5. Homework Assignment: Run the Flow Survey triage with a peer or case study, diagnose the primary friction ("Ugg"), and submit a short diagnostic summary.
```

### 3.2 Modular Prompt — Module 2 (Week 2): The THRiVE Report Protocol (Traits & Hobbies) & The "Safe-Save" Mechanic
```text
Create "Module 2: The THRiVE Report Protocol (Traits & Hobbies) & The 'Safe-Save' Mechanic" for Week 2 (Monday, Dec 7 & Wednesday, Dec 9, 5:00–6:30 PM MT) of the 5 to THRiVE Practitioner Lab.
Include:
1. Technical Protocol Lesson: Facilitating the 20-to-40-minute voice-driven THRiVE Report in Personos AI and enforcing the "Safe-Save" mechanic (pressing Enter every 1–2 minutes during dictation so client memory profiles save reliably).
2. Clinical Pillar Guide: Uncovering Pillar 1 — Traits (T: innate superpowers) and Pillar 2 — Hobbies (H: flow-state energy generators), strictly enforcing the 3-to-5 item quota per pillar.
3. Live Session 2A (Monday, Dec 7, 5:00–6:30 PM MT): Live Co-Coaching Demonstration of Voice Dictation for Traits & Hobbies.
4. Live Session 2B (Wednesday, Dec 9, 5:00–6:30 PM MT): Squad Breakout Lab — Co-Coaching Dictation Practice & Safe-Save Drills.
5. Homework Assignment: Complete a voice-dictated Traits (3–5 items) and Hobbies (3–5 items) intake in Personos AI using the Safe-Save protocol and submit the generated summary.
```

### 3.3 Modular Prompt — Module 3 (Week 3): Relational Architecture (Relationships & Interests)
```text
Create "Module 3: Relational Architecture (Relationships & Interests)" for Week 3 (Monday, Dec 14 & Wednesday, Dec 16, 5:00–6:30 PM MT) of the 5 to THRiVE Practitioner Lab.
Include:
1. Clinical Pillar Guide: Pillar 3 — Relationships (R: mapping the client's support cast and accountability mirrors) with a strict 3-to-5 item quota, including strategies for isolated clients in recovery or housing transitions.
2. Clinical Pillar Guide: Pillar 4 — Interests (I: uncovering the intellectual curiosity compass) with a strict 3-to-5 item quota to reignite intrinsic motivation.
3. Live Session 3A (Monday, Dec 14, 5:00–6:30 PM MT): Live Co-Coaching Demonstration of Relational & Interest Mapping.
4. Live Session 3B (Wednesday, Dec 16, 5:00–6:30 PM MT): Squad Breakout Lab — Co-Coaching R & I Pillars in Personos AI.
5. Homework Assignment: Capture 3–5 Relationships and 3–5 Interests in Personos AI for your active practice case and submit a reflection on how accountability mirrors were identified.
```

### 3.4 Modular Prompt — Module 4 (Week 4): Synthesizing the Core (Values & Experiences)
```text
Create "Module 4: Synthesizing the Core (Values & Experiences)" for Week 4 (Monday, Dec 21 & Wednesday, Dec 23, 5:00–6:30 PM MT) of the 5 to THRiVE Practitioner Lab.
Include:
1. Clinical Pillar Guide: Pillar 5 — Values (V: uncovering the client's non-negotiable operating system) and Pillar 6 — Experiences (E: mining crucible moments and highlight reels for proven resilience), enforcing the strict 3-to-5 item quota per pillar.
2. Synthesis Guide: Auditing all six pillars (T-H-R-I-V-E) inside the Personos client memory profile to finalize the 20-to-40-minute THRiVE Report.
3. Live Session 4A (Monday, Dec 21, 5:00–6:30 PM MT): Live Demonstration — Synthesizing Values & Crucible Experiences.
4. Live Session 4B (Wednesday, Dec 23, 5:00–6:30 PM MT): Squad Breakout Lab — Full 6-Pillar THRiVE Report Peer Audit.
5. Homework Assignment: Submit a complete 6-Pillar THRiVE Report from Personos AI demonstrating 3–5 validated items in each pillar (Traits, Hobbies, Relationships, Interests, Values, Experiences).
```

### 3.5 Modular Prompt — Module 5 (Week 5): Filling the G.A.P.S. & Action Board Generation
```text
Create "Module 5: Filling the G.A.P.S. & Action Board Generation" for Week 5 (Monday, Dec 28 & Wednesday, Dec 30, 5:00–6:30 PM MT) of the 5 to THRiVE Practitioner Lab.
Include:
1. Methodology Lesson: Moving from self-awareness directly into Filling the G.A.P.S. (Goal Achievement and Problem Solving).
2. AI Co-Pilot Lesson: Prompting Personos AI to generate 5 creative next steps tailored through custom client lenses (philosophy, scripture, or thought leaders).
3. Action Board Execution Guide: Guiding the client to select and commit to 1–3 micro-actions on their live Action Board to drive momentum across the 167 hours between sessions.
4. Live Session 5A (Monday, Dec 28, 5:00–6:30 PM MT): Live Demonstration — Custom Lens Prompting & Real-Time Action Board Configuration.
5. Live Session 5B (Wednesday, Dec 30, 5:00–6:30 PM MT): Squad Breakout Lab — Configuring Live Action Boards Across the 5 Core Domains.
6. Homework Assignment: Generate 5 creative next steps in Personos using a custom lens (philosophy, scripture, or thought leader) and lock in 1–3 micro-actions on a live Action Board.
```

### 3.6 Modular Prompt — Module 6 (Week 6): Clinical Hand-Off, Automated DAP Notes & The $9/Month Seat Economics
```text
Create "Module 6: Clinical Hand-Off, Automated DAP Notes, and the $9/Month Seat Economics" for Week 6 (Monday, Jan 4 & Wednesday, Jan 6, 5:00–6:30 PM MT) of the 5 to THRiVE Practitioner Lab.
Include:
1. Clinical Workflow Lesson: Automated DAP Note Generation (Data, Assessment, Plan) inside Personos AI to eliminate clinician documentation burnout.
2. Practice Implementation Lesson: Deploying the sustainable $9/month per client seat model—how clinics and agencies sponsor active client seats and how to transition graduating clients into self-pay continuity.
3. Live Session 6A (Monday, Jan 4, 5:00–6:30 PM MT): Automated DAP Notes & Caseload Rollout Workshop.
4. Live Session 6B (Wednesday, Jan 6, 5:00–6:30 PM MT): Capstone Case Reviews & 5 to THRiVE Practitioner Certification.
5. Capstone Submission: Submit a complete clinical case packet containing (a) Flow Survey Triage, (b) 6-Pillar THRiVE Report, (c) G.A.P.S. + Live Action Board (1–3 micro-actions), and (d) Automated Clinical DAP Note.
```

### 3.7 Community Space Prompt — Squad A, Squad B & Squad C (7 Seats Each)
Paste this into the top pinned post of **Squad A**, **Squad B**, and **Squad C** inside LearnWorlds Community:
```text
Welcome to your private 7-Practitioner Co-Coaching Squad for the 5 to THRiVE Practitioner Lab!

This private space is dedicated to your 7-member squad for breakout room continuity, co-coaching practice between our Monday & Wednesday live labs (5:00–6:30 PM MT), and peer review of your Personos THRiVE Reports and Action Boards.

To kick off Session 0 (Pre-Flight Onboarding), reply to this thread with:
1. Your Name, Credentials / Role (Therapist, Coach, Case Manager, Recovery Specialist), and Location.
2. Which of the 5 Core Domains you touch most frequently (Addiction Recovery, Housing Stability, Workforce Development, Emotional Distress, or Interpersonal Conflict).
3. Confirmation that you have completed Gerard's Flow Survey triage and tested your microphone dictation + "Safe-Save" (Enter key) protocol for our weekend tech clinic.
```

---

# SECTION 4: Complete 6-Week Cohort Calendar & Curriculum Matrix

| Module / Week | Dates | Live Sessions (5:00–6:30 PM MT) | Core Clinical Focus | Key Deliverable / Tool |
| :--- | :--- | :--- | :--- | :--- |
| **Top-of-Funnel Event** | **Thu, Nov 12** | Live 30-Min Thursday Lunch & Learn | Demo of THRiVE Report dictation, automated DAP notes & $9/mo seat model (21-seat cap hook) | 3-Field Capture (`First Name`, `Email`, `Practice Type`) + Auto Calendar Invite |
| **Module 0 (Session 0)** | **Sat, Nov 28 – Sun, Nov 29** | Weekend Drop-In Tech Clinics (with Gerard) | Pre-Flight Onboarding, Flow Survey intake triage, and workstation speech-to-text mic calibration | Baseline Flow Survey + Dictation Calibration |
| **Module 1 (Week 1)** | **Mon, Nov 30 & Wed, Dec 2** | Sessions 1A & 1B (90 mins each) | **The 167-Hour Bottleneck & The Observer Stance** (SOL Theory & RellaFit: shifting from reactive character to grounded Observer) | Flow Survey Triage (Agency, Clarity, Momentum) |
| **Module 2 (Week 2)** | **Mon, Dec 7 & Wed, Dec 9** | Sessions 2A & 2B (90 mins each) | **The THRiVE Report Protocol (`T` & `H`) & The "Safe-Save" Mechanic** (3–5 item quota; `Enter` every 1–2 mins) | Personos Voice Dictation: **Traits** & **Hobbies** |
| **Module 3 (Week 3)** | **Mon, Dec 14 & Wed, Dec 16** | Sessions 3A & 3B (90 mins each) | **Relational Architecture (`R` & `I`)** (Support cast/accountability mirrors & intellectual curiosity compass; 3–5 item quota) | Personos Voice Dictation: **Relationships** & **Interests** |
| **Module 4 (Week 4)** | **Mon, Dec 21 & Wed, Dec 23** | Sessions 4A & 4B (90 mins each) | **Synthesizing the Core (`V` & `E`)** (Non-negotiable operating system & crucible moments/highlight reels; 3–5 item quota) | Completed 6-Pillar **THRiVE Report** in Personos |
| **Module 5 (Week 5)** | **Mon, Dec 28 & Wed, Dec 30** | Sessions 5A & 5B (90 mins each) | **Filling the G.A.P.S. & Action Board Generation** (5 AI next steps via custom lenses → 1–3 committed micro-actions) | Live Client **Action Board** in Personos |
| **Module 6 (Week 6)** | **Mon, Jan 4 & Wed, Jan 6** | Sessions 6A & 6B (90 mins each) | **Clinical Hand-Off, Automated DAP Notes & $9/Mo Seat Economics** (Clinic sponsorship vs. self-pay transition) | Automated **DAP Note** & Practitioner Lab Certification |
