# TGAT Learner Solution Media Design

## Intent

Use the TGAT `สื่อเฉลย` tab to manage PDF/video media for the learner-facing solution page. The user clarified that this tab is for adding and publishing videos to Client, not for publishing answer-key files.

## Goals

- Reuse the existing Webb Admin solution-media form and table, including product/set selection, video metadata, and publish status.
- Show published TGAT videos in the learner's solution page for matching purchased products and sets.
- Keep adding/editing mock media in browser storage, consistent with the current presentation phase.
- Remove the answer-key panel's `เผยแพร่ชุดนี้` action while keeping `บันทึกเฉลย`.
- Preserve existing exam Preview behavior without changes.

## Non-goals

- No new video hosting, database, or persistent binary upload service.
- No redesign of the learner's solution page or exam Preview.
- No changes to non-TGAT solution workflows.

## Approach

Embed the existing `WebBAdminDemo` solution-management section in the TGAT catalog's `สื่อเฉลย` tab. The existing manager writes records to the browser mock store. Extend `StudentSolutions` to read active video records from that same store and display them to eligible submitted purchases when product and set match.

## Constraints and calls

- Only Webb Admin TGAT and Client solution display are in scope.
- Newly added videos start as Draft and appear on Client only after the existing publish action is used.
- The file selector remains mock-only: the browser stores media details and the learner UI presents its existing sample player.
- The user's correction replaces the earlier interpretation of `สื่อเฉลย` as per-part answer-key publishing.
- Preview is already correct per user and must not be altered.
