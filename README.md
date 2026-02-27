# BumpLogic — Metal Residue War Room

Package-aware root cause recommendation engine for wafer-level packaging (WLP) and bumping defect excursions.

Built as an engineering decision-support prototype inspired by real fab workflows.

---

## 🚀 What This Project Does

BumpLogic converts defect signatures into:

- Ranked root-cause hypotheses (Top 3, normalized scoring)
- Structured next 8-hour containment plan
- Confirmation matrix (Test → Signal → Means → Next)
- Auto-updating release gate checklist
- STOP / HOLD / RELEASE verdict logic

It is not an AI black box.

It is structured, explainable engineering logic.

---

## 🧠 Engineering Philosophy

This tool reflects:

- Correlation-first thinking
- Deterministic + explainable scoring
- War-room decision framing
- Risk-based containment logic
- Gate-driven release control

The goal is to demonstrate how defect analysis can be structured into a repeatable, scalable framework.

---

## 🏭 Context

Designed around:

- BP (Ball Placement) module contamination risks
- EP (Electroplated bump) bath / particle mechanisms
- Rinse/Dry boundary issues
- Dense-pattern microloading effects
- PR/strip residue masquerading as metal

No confidential fab data is used.

All logic is generalized and abstracted.

---

## 🔐 Release Logic Model

Base Verdict:
- STOP (high metal/bridging risk)
- HOLD (investigation required)

Auto-Upgrade to RELEASE when:
- Required gates pass (AOI monitors, corrective action, post-fix monitors, etc.)

Verdict updates dynamically as gates are completed.

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- Deterministic scoring engine
- Reactive gate logic with auto-refresh

---

## 📸 Key Features

- Futuristic semiconductor-themed UI
- Wafer-inspired background system
- Glass-panel war-room layout
- Structured confirmation matrix UI
- Explainability (debug trigger view)

---

## 🎯 Purpose

This project demonstrates:

- Process engineering thinking
- Root cause structuring
- Risk-based decision modeling
- Fab-containment workflow translation into software

It is an engineering prototype, not a production manufacturing system.

---

## 👨‍🔬 Created By

**Thurkhesan Murugan**  
Process Engineer — Wafer-Level Packaging  
Fab Experience — Taiwan 🇹🇼  

LinkedIn:  
https://www.linkedin.com/in/thurkhesan/

---

## 🧪 Run Locally

```bash
npm install
npm run dev
