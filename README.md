# Persona Replica Engine 🎭🔐

An enterprise-ready AI Persona Replica Studio built with React 19, TypeScript, Express, Vite, and Google Gemini models. Analyze chat logs, writing samples, tweets, or transcripts to generate behavioral persona blueprints with strict security and data isolation.

---

## 🚀 Build & Deployment Commands

| Command | Action | Description |
|---|---|---|
| `npm run dev` | Development Server | Starts Express + Vite middleware dev server on port 3000 with live HMR |
| `npm run build` | Production Build | Bundles Vite SPA to `dist/` and compiles Express `server.ts` into a self-contained CommonJS `dist/server.cjs` via `esbuild` |
| `npm run start` | Production Start | Runs compiled CommonJS server via `node dist/server.cjs` |
| `npm run lint` | Type Check | Validates TypeScript types across frontend and backend (`tsc --noEmit`) |
| `npm run clean` | Clean Artifacts | Removes build output directories |

---

## 🔒 Enterprise Security Architecture

1. **Zero External Leakage & Local PII Scrubbing**:
   - Client-side & server-side regex scrubber sanitizes emails, phone numbers, API keys, credit cards, SSNs, IP addresses, and passwords before hitting any LLM context.

2. **Client-Side AES-256-GCM Encryption Vault**:
   - Chat logs and persona profiles stored in browser local storage are encrypted at rest using 256-bit AES-GCM WebCrypto keys.

3. **Prompt Injection Guard & XML Delimiter Isolation**:
   - Segregates system instructions inside `<system_directives_immutable>` and untrusted user messages inside `<untrusted_user_input>`. Neutralizes override phrases like *"Ignore previous rules"*.

4. **API Key Shielding & Proxying**:
   - Gemini API keys remain strictly server-side. Frontend requests proxy through `/api/chat-persona` and `/api/analyze-persona`.

5. **Sliding Window Rate Limiting**:
   - Enforces IP-based rate limiting (60 req/min) to defend against scraping and extraction attacks.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, Three.js
- **Backend**: Express, esbuild, `@google/genai`
- **Models**: Gemini 2.5 Flash / Gemini 3.6 Flash with automatic fallback handling
