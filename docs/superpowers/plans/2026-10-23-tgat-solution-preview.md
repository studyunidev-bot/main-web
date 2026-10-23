# TGAT Learner Solution Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Manage TGAT video solution media in the Webb Admin `สื่อเฉลย` tab and show published videos on the Client solution page.

**Architecture:** Reuse `WebBAdminDemo`'s existing media manager in the TGAT catalog page. Extend `StudentSolutions` to read published video records from the same browser mock store and filter by eligible purchase and exam set. Keep answer saving and existing Preview behavior intact.

**Tech Stack:** Next.js client components, React, existing mock localStorage store, Tailwind.

**Spec:** `docs/superpowers/specs/2026-10-23-tgat-solution-preview-design.md`

## Global Constraints

- Follow Webb Admin UI conventions and preserve existing mock data flows.
- New video records are Draft until explicitly published.
- Uploaded file bytes are not persisted; the UI uses the existing sample video player.
- Do not alter Preview behavior.
- Do not add or run tests; verify with TypeScript and diff checks.

## Review Focus

- The embedded media manager opens on `สื่อเฉลย` and allows choosing TGAT products.
- Only active Video records with a matching product and set appear in Client solutions.
- Unpublished media remains hidden from Client.
- Existing solution display and Preview behavior remain intact.

## Files

- Modify `src/components/webb/WebBExamCatalog.tsx`: embed the existing media manager in the TGAT set's `สื่อเฉลย` tab.
- Modify `src/components/webb/WebBAdminDemo.tsx`: allow the embedded section to initialize at `solutions`, default new media to Video, and clarify Client publication behavior.
- Modify `src/components/webb/WebBStudentArea.tsx`: read published mock video records and display them in Client solutions.

## Tasks

### Task 1: Put the existing media manager in the TGAT tab

- [x] Render embedded `WebBAdminDemo` with `activeScreen="exam-management"`, `initialExamTab="solutions"`, and a TGAT default product.
- [x] Ensure the existing product selector remains available to manage TGAT1, TGAT2, and TGAT3.
- [x] Remove the mistaken per-part answer-key publish cards; keep the separate `เผยแพร่ชุดนี้` action removed from answer-key management.

### Task 2: Show published videos on Client

- [x] Read `mock-solutions` from the browser store and refresh on the existing admin mock update event.
- [x] Display active Video items to submitted purchases whose product and set match.
- [x] Use the existing learner-facing sample video player and its current metadata fields.

### Task 3: Verify

- [x] Run `npx tsc --noEmit` and `git diff --check`.
- [x] Confirm Preview code was not changed in this correction.
