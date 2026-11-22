<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

Status: BLOCKED — the configured [Vercel homepage](https://v0-3-d-galaxy-page-kappa.vercel.app) returned HTTP 200 but rendered an empty React root on 2026-11-22; next human action: redeploy the audited branch after merge and verify the production UI.

This contains everything you need to run your app locally.

This is a local simulation, not live Solana/Helius monitoring or MEV enforcement. Transactions, signatures, CU values and statuses are randomly generated in `App.tsx`; lane capacity is simulated by `services/laneState.ts`. The displayed webhook ID does not connect to a feed. The Gemini analysis service is not imported by the current UI.

View your app in AI Studio: https://ai.studio/apps/drive/1XEa8K45VQtsimpgzz2Mnuz5J6kpljE9V

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. No API key is required for the current simulation. `GEMINI_API_KEY` is only referenced by the unused Gemini service; setting it does not enable a UI analysis flow.
3. Run the app:
   `npm run dev`
