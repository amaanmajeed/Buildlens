This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment

Create `.env.local` in this folder with:

```bash
GEMINI_API_KEY=your_key_from_google_ai_studio
```

Optional equivalent: `GOOGLE_GENERATIVE_AI_API_KEY`. Restart `npm run dev` after changes.

## Gemini models

These API ids work with `@google/generative-ai` (`getGenerativeModel({ model })`). Defaults in code are `lib/gemini.ts` and `app/api/ai-select-file/route.ts`; swap the `MODEL` constant to rotate when testing or if a model hits quota.

| Display name | Model id |
| --- | --- |
| Gemini 2.5 Flash         | `gemini-2.5-flash`         |
| Gemini 2.5 Flash‑Lite    | `gemini-2.5-flash-lite`    |
| Gemini 3 Flash           | `gemini-3-flash-preview`   |
| Gemini 3.1 Flash         | `gemini-3.1-flash`         |
| Gemini 3.1 Flash‑Lite    | `gemini-3.1-flash-lite`    |


Confirm availability for your key in [Google AI Studio](https://aistudio.google.com); preview ids can change when models go stable.

## Debugging AI errors

The UI shows a plain-English `error` message. In **development**, failed API responses also include a `code` (e.g. `GEMINI_AUTH`, `GEMINI_PAYLOAD_LIMIT`) and a `debug` object with the upstream status and message—open DevTools → Network → select the failed `POST` → Response.

Check the **terminal** where `npm run dev` runs: routes log `[api/spec-extract] Gemini error <code>` with the full error.

Common causes: wrong or expired API key (401), PDF too large for Gemini in one request (413), rate limits (429), model not enabled for the key (502), safety blocks (422).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
