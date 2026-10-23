# Dynamic TGAT3 Scoring & Answer Key Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Overview
Implement an adaptive, dynamic answer key and scoring rule management system for TGAT3 in the Webb Admin backend (`WebBAdminDemo.tsx`). The system allows administrators to add, delete, customize, and evaluate any number of exam questions dynamically across all 4 official myTCAS scoring types:
1. **Single Choice** (1.00 pt full, 0 pt wrong)
2. **Weighted Single Choice** (Per-choice partial scores: 0.25, 0.50, 0.75, 1.00)
3. **Multiple Response** (Evaluate all 4 choices, 0.25 pt per choice correct, 0 if completely unanswered)
4. **Linked Questions** (Pair relationship between two questions, full 2.00 pts if matching an accepted pair, 0 pt if mismatched or incomplete)

Provides a one-click **"🪄 โหลดเทมเพลตมาตรฐาน TGAT3 (60 ข้อตาม Blueprint)"** preset button and live calculation of raw score vs scaled section score (25 pts per section, total 100 pts).

Strict constraint: **NO modifications to User Client files** (`WebBExam.tsx`, `WebBStudentArea.tsx`, `WebBCheckout.tsx`).

---

## Proposed Changes

### 1. New Module: `src/components/webb/tgat3-scoring.ts`
- Data models for `TGAT3ScoringType` and `TGAT3AnswerRule`.
- Scoring engine functions:
  - `gradeSingleChoice(rule, answer): number`
  - `gradeWeightedChoice(rule, answer): number`
  - `gradeMultipleResponse(rule, answers): number`
  - `gradeLinkedQuestions(rule, q1Answer, q2Answer): number`
  - `gradeQuestion(rule, studentAnswer, pairedAnswer?): number`
  - `calculateTGAT3Summary(rules, studentAnswers): TGAT3ScoreSummary`
- Blueprint preset generator:
  - `getTGAT3BlueprintPreset(): TGAT3AnswerRule[]` (Official 60 questions structure across 4 sections).

### 2. Unit Verification Script: `scripts/test-tgat3-scoring.mjs`
- Automated test script validating the 4 scoring models with the exact examples from myTCAS Blueprint:
  - Example 1: Single choice correct=1, wrong=0
  - Example 2: Weighted choice choice 1=0.25, 2=0.50, 3=0.75, 4=1.00
  - Example 3: Multiple response (1 & 3 correct):
    - [1, 3] -> 1.00
    - [1] -> 0.75
    - [1, 2, 3] -> 0.75
    - [1, 2, 3, 4] -> 0.50
    - [] (unanswered) -> 0.00
  - Example 4: Linked questions:
    - Accepted pairs: 1-1, 2-3, 3-2, 4-4 -> 2.00
    - Mismatched pair (e.g. 1-3, 2-2) -> 0.00

### 3. Integrated Dynamic UI in Webb Admin: `src/components/webb/WebBTGAT3AnswerKeyManager.tsx`
- Adaptive table where each row dynamically renders inputs based on selected `responseType`.
- Actions: Add question (`+ เพิ่มข้อใหม่`), Delete question (`🗑️`), Duplicate question (`📋`), Reset to TGAT3 Blueprint (`🪄 โหลดเทมเพลต TGAT3`).
- Score summary banner displaying total questions, raw score total, and 25-point scaled section projections.
- Clean integration into `WebBAdminDemo.tsx` under the "เฉลยรายข้อ" tab for TGAT3.

---

## Tasks

- [x] **Task 1: Core Scoring Engine & Types (`tgat3-scoring.ts`)**
  - [x] Create `src/components/webb/tgat3-scoring.ts` with TypeScript interfaces and scoring functions.
  - [x] Implement `getTGAT3BlueprintPreset()` generating 60 standard questions.
  - [x] Create `scripts/test-tgat3-scoring.mjs` to run and verify all 4 grading modes against myTCAS rules.
  - [x] Run test script: `node scripts/test-tgat3-scoring.mjs` and ensure all tests pass.

- [x] **Task 2: Dynamic Answer Key Manager Component (`WebBTGAT3AnswerKeyManager.tsx`)**
  - [x] Build `src/components/webb/WebBTGAT3AnswerKeyManager.tsx` with adaptive rows and inputs.
  - [x] Implement context-aware input fields for Single, Weighted, Multiple, and Linked question types.
  - [x] Add controls: Add Question, Remove Question, Duplicate Question, and Load TGAT3 Blueprint.
  - [x] Add Live Score Summary header showing raw and scaled points.

- [x] **Task 3: Integration into Webb Admin (`WebBAdminDemo.tsx`)**
  - [x] Connect `WebBTGAT3AnswerKeyManager` into the TGAT3 answer key tab in `WebBAdminDemo.tsx`.
  - [x] Ensure persistence in localStorage under `answer-key:tgat3:*` and `answer-scoring:tgat3:*`.
  - [x] Keep backward compatibility for non-TGAT3 products (TGAT1, TGAT2).

- [x] **Task 4: Quality & Regression Verification**
  - [x] Run `npx tsc --noEmit` to verify type safety.
  - [x] Run `npm run build` to verify production build.
  - [x] Verify `git status` to guarantee NO user client files were modified.
