# Security Best Practices Audit Report — DATA TRIAD STUDIO (Oct 2026)

## Executive Summary

This security review audited the **DATA TRIAD STUDIO (Academia de Datos 2026)** web application, covering both the **React 19 frontend** (`src/App.jsx`, `src/components/LessonVisualizers.jsx`, `index.html`) and the **Node.js / Vite local Google AI Ultra CLI bridge** (`vite.config.js` and the hardened module `server/aiUltraBridge.js`).

The primary security risk area in local AI educational studios is the **HTTP-to-CLI bridge** (`/api/ai/status` and `/api/ai/query`), where browser-supplied prompts and SQL snippets cross a trust boundary into a local Node.js process that invokes `gemini` or `agy` CLI binaries. To eliminate command injection, denial-of-service (DoS), cross-origin local daemon abuse, and information disclosure risks, a hardened middleware module (`server/aiUltraBridge.js`) was implemented enforcing `shell: false` execution, `stdin` prompt piping, a strict 16 KB body limit (`MAX_BODY_BYTES = 16384`), schema/length validation (`MAX_PROMPT_CHARS = 2000`), origin verification, defensive HTTP headers (`X-Content-Type-Options: nosniff`, `Cache-Control: no-store`), and error message sanitization.

On the React frontend, the application adheres well to React's default JSX auto-escaping (`REACT-XSS-002`) with zero occurrences of `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. Minor defense-in-depth recommendations are noted for `localStorage` schema validation and Content Security Policy (CSP) headers.

---

## 1. Critical Findings & Mitigations Implemented

### Finding #1 — Shell Command Interpolation in Local CLI Subprocess Execution
- **Rule ID:** `EXPRESS-CMD-001` (Prevent OS Command Injection in `child_process`)
- **Severity:** Critical
- **Impact Statement:** Passing user-influenced prompt text into `powershell.exe -Command` via string interpolation can allow arbitrary OS command or PowerShell subexpression execution under the local developer's user account if quoting is bypassed.
- **Location:**
  - Legacy inline plugin: `vite.config.js` (`detectCliTools` lines `8-15`, `runCliPrompt` lines `29-38`)
  - Hardened implementation: `server/aiUltraBridge.js` (`detectCliTools` lines `62-149`, `runCliPrompt` lines `156-237`)
- **Evidence (Legacy pattern in `vite.config.js` lines `29-32`):**
  ```javascript
  cmd = isWin ? 'powershell.exe' : 'gemini';
  args = isWin
    ? ['-NoProfile', '-NonInteractive', '-Command', `gemini -p ${JSON.stringify(fullPrompt)} -o text`]
    : ['-p', fullPrompt, '-o', 'text'];
  ```
  Although `JSON.stringify(fullPrompt)` wraps the string in double quotes, PowerShell interprets double-quoted strings as expandable strings where `$()` subexpressions, `$env:` variables, and backtick escapes (`` ` ``) can be evaluated by the shell parser. Additionally, `execSync('where.exe gemini')` (`vite.config.js` lines `9, 13`) spawns a command shell unnecessarily.
- **Mitigation Implemented in `server/aiUltraBridge.js`:**
  1. **Zero Shell Execution (`shell: false`):** `detectCliTools()` uses `execFileSync` with `shell: false` and explicit argument arrays (`server/aiUltraBridge.js` lines `71-145`).
  2. **Direct Node/Binary Invocation + `stdin` Piping:** On Windows, `detectCliTools()` resolves the underlying `@google/gemini-cli/bundle/gemini.js` entrypoint (`server/aiUltraBridge.js` lines `83-94`) and invokes `process.execPath` (`node.exe`) directly with `shell: false`. The untrusted `fullPrompt` is never placed in a command string; instead, it is piped exclusively via `child.stdin.end(fullPrompt, 'utf8')` (`server/aiUltraBridge.js` lines `166-207`). For `agy.exe`, the native binary is invoked directly with `shell: false` and `--` argument termination (`args = ['--print', '--', fullPrompt]`, line `164`).

---

## 2. High Severity Findings & Mitigations Implemented

### Finding #2 — Unbounded Request Body Accumulation and Missing Input Schema Validation on `/api/ai/query`
- **Rule ID:** `EXPRESS-BODY-001` & `EXPRESS-INPUT-001` (Enforce Request Body Size Limits & Validate Untrusted Input)
- **Severity:** High
- **Location:**
  - Legacy inline plugin: `vite.config.js` (`middlewares.use('/api/ai/query', ...)` lines `135-153`)
  - Hardened implementation: `server/aiUltraBridge.js` (`MAX_BODY_BYTES` line `8`, `validateQueryPayload` lines `281-359`, `handleQuery` lines `413-453`)
- **Evidence (Legacy pattern in `vite.config.js` lines `135-152`):**
  ```javascript
  let body = '';
  req.on('data', (chunk) => {
    body += chunk.toString('utf8');
  });
  req.on('end', async () => {
    const payload = JSON.parse(body || '{}');
    const { prompt = '', moduleTitle = '', ... } = payload;
  ```
- **Impact:** Without a byte limit on the incoming stream, a local client or malicious script can stream multi-megabyte payloads to `/api/ai/query`, exhausting Node.js heap memory or passing oversized context strings into the CLI subprocess. Furthermore, non-string types (e.g., objects or arrays passed as `prompt` or `activeLens`) were not rejected at the route boundary.
- **Mitigation Implemented in `server/aiUltraBridge.js`:**
  1. **Strict 16 KB Body Limit (`MAX_BODY_BYTES = 16384`):** `handleQuery` counts incoming `Buffer` bytes (`server/aiUltraBridge.js` lines `417-434`). If `receivedBytes > 16384`, it responds immediately with `413 Payload Too Large` and destroys the request stream (`req.destroy()`).
  2. **Strict Type, Length, and Allowlist Validation (`validateQueryPayload`):**
     - Verifies `prompt` is a non-empty string `<= 2000` characters (`MAX_PROMPT_CHARS = 2000`, lines `286-299`).
     - Strips control characters and null bytes (`cleanControlChars`, lines `20-23`).
     - Restricts `activeLens` and `engineMode` against strict `Set` allowlists (`ALLOWED_LENSES`, `ALLOWED_ENGINE_MODES`, lines `14-15, 306-310`).
     - Bounds `sqlCode` (`<= 4000` chars), `moduleTitle` (`<= 200` chars), `simulatorState` JSON (`<= 2000` chars), and `relatedNodes` (`<= 10` items).
     - Caps CLI `stdout` buffer collection at 64 KB (`MAX_CLI_STDOUT_BYTES = 65536`, lines `13, 210-214`).

---

### Finding #3 — Cross-Origin Local Daemon Request Risk on `/api/ai/query`
- **Rule ID:** `EXPRESS-CORS-001` / `EXPRESS-CSRF-001` (Protect Local HTTP Bridge Against Cross-Origin Browser Calls)
- **Severity:** High
- **Location:**
  - Legacy inline plugin: `vite.config.js` (lines `128-134`)
  - Hardened implementation: `server/aiUltraBridge.js` (`ALLOWED_ORIGIN_RE` line `16`, `handleQuery` lines `399-411`)
- **Evidence:** The dev/preview server binds strictly to loopback (`--host 127.0.0.1` in `package.json` lines `8, 10`), which prevents LAN exposure. However, any external webpage open in the user's browser could attempt a cross-origin `POST` request (`fetch('http://127.0.0.1:5173/api/ai/query', { mode: 'no-cors', ... })`) to trigger local CLI executions if `Origin` and `Content-Type` headers are not verified.
- **Mitigation Implemented in `server/aiUltraBridge.js`:**
  1. **Origin Allowlist Check:** `handleQuery` inspects `req.headers['origin']` and rejects any request whose origin does not match `^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$` with `403 Forbidden` (`server/aiUltraBridge.js` lines `400-404`).
  2. **Strict `Content-Type: application/json` Enforcement:** Rejects `text/plain`, `application/x-www-form-urlencoded`, and `multipart/form-data` simple CORS requests with `415 Unsupported Media Type` (`server/aiUltraBridge.js` lines `406-410`), ensuring browsers must preflight cross-origin requests.

---

## 3. Medium Severity Findings & Mitigations Implemented

### Finding #4 — Internal Error Message & System Path Leakage in API Responses
- **Rule ID:** `EXPRESS-FINGERPRINT-001` (Control Error Responses and Prevent Internal Information Leakage)
- **Severity:** Medium
- **Location:**
  - Legacy inline plugin: `vite.config.js` (lines `191, 217`)
  - Hardened implementation: `server/aiUltraBridge.js` (`sanitizeErrorMessage` lines `29-46`, used at lines `499, 524`)
- **Evidence (Legacy pattern in `vite.config.js` lines `191, 217`):**
  ```javascript
  cliNotice: cliErr.message,
  // ...
  res.end(JSON.stringify({ ok: false, error: err.message }));
  ```
- **Impact:** Raw `child_process` or `stderr` errors on Windows/POSIX frequently include full local user paths (e.g., `C:\Users\<username>\AppData\...`), internal command flags, or stack traces.
- **Mitigation Implemented in `server/aiUltraBridge.js`:**
  - Implemented `sanitizeErrorMessage(err)` (`server/aiUltraBridge.js` lines `29-46`), which detects and strips any Windows (`[A-Za-z]:\`) or POSIX (`/Users/`, `/home/`, `/var/`, `/etc/`) paths, `spawn`/`ENOENT` diagnostics, and stack frames before returning a generic Spanish message to the client.

---

### Finding #5 — Missing Defensive HTTP Security Headers on API Responses (`nosniff`, `no-store`)
- **Rule ID:** `EXPRESS-HEADERS-001` (Set Essential Security Headers)
- **Severity:** Medium
- **Location:**
  - Legacy inline plugin: `vite.config.js` (lines `113, 141`)
  - Hardened implementation: `server/aiUltraBridge.js` (`setSecurityHeaders` lines `51-57`, applied in `handleStatus` line `368` and `handleQuery` line `391`)
- **Evidence:** Legacy endpoints only set `Content-Type: application/json` without `X-Content-Type-Options: nosniff` or `Cache-Control: no-store`.
- **Mitigation Implemented in `server/aiUltraBridge.js`:**
  - `setSecurityHeaders(res)` sets:
    - `Content-Type: application/json; charset=utf-8`
    - `X-Content-Type-Options: nosniff`
    - `Cache-Control: no-store`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: no-referrer`

---

## 4. Low / Informational Findings (Frontend React & HTML Review)

### Finding #6 — Untrusted Deserialization of `localStorage` Progress Array in `src/App.jsx`
- **Rule ID:** `JS-STORAGE-001` / `REACT-AUTH-001` (Treat Values Read from Web Storage as Untrusted Input)
- **Severity:** Low
- **Location:** `src/App.jsx` (lines `22-29`)
- **Evidence (`src/App.jsx` lines `22-29`):**
  ```javascript
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('ruta_datos_2026_completed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  ```
- **Impact:** No secrets or authentication tokens are stored in `localStorage` (compliant with `REACT-AUTH-001`). However, if `localStorage.getItem('ruta_datos_2026_completed')` is manually modified to a non-array JSON value (e.g., `{}` or `null`), `completedIds.includes(...)` (`src/App.jsx` line `71`) could throw a runtime `TypeError`.
- **Recommended Hardening (Informational):** Validate `Array.isArray(parsed)` when hydrating from `localStorage`.

---

### Finding #7 — Frontend XSS Posture and External Font Stylesheet in `index.html`
- **Rule ID:** `REACT-XSS-002`, `JS-CSP-001`, `JS-SRI-001`
- **Severity:** Low / Informational
- **Location:**
  - `src/App.jsx` (lines `687-697` — AI Tutor message rendering)
  - `src/components/LessonVisualizers.jsx` (lines `1-921` — interactive visualizers)
  - `index.html` (lines `6-12`)
- **Audit Verification:**
  - **Safe JSX Escaping (`REACT-XSS-002`):** Audited `src/App.jsx` and `src/components/LessonVisualizers.jsx`. All dynamic values, including AI Tutor responses (`{m.answer}` at `src/App.jsx` line `694`) and SQL code blocks (`<pre className="code-block-dark tabular">` at `src/App.jsx` line `491`), are rendered exclusively as React text children. There are **zero** uses of `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `document.write`, or `eval`.
  - **External Resources (`JS-SRI-001` / `JS-CSP-001`):** `index.html` (lines `6-12`) loads only Google Fonts stylesheets (`https://fonts.googleapis.com/css2?...`) and executes no third-party scripts. For production deployments, serving a `Content-Security-Policy` header (`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'`) at the edge or preview server provides defense-in-depth.

---

## Summary of Security Controls in `server/aiUltraBridge.js`

| Control | Specification / Limit | Location in `server/aiUltraBridge.js` |
| :--- | :--- | :--- |
| **No Shell Interpolation** | `spawn(..., { shell: false, windowsHide: true })` + `stdin` piping | Lines `156-237` |
| **Safe Binary Discovery** | `execFileSync('where.exe', ..., { shell: false })` | Lines `62-149` |
| **Request Body Size Limit** | `MAX_BODY_BYTES = 16384` (16 KB) with stream termination | Lines `8, 413-436` |
| **Prompt Length & Type Check** | `MAX_PROMPT_CHARS = 2000`, string validation & control-char stripping | Lines `9, 20-23, 281-359` |
| **Cross-Origin Protection** | Localhost `Origin` verification + `application/json` enforcement | Lines `16, 400-410` |
| **Defensive Headers** | `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, `X-Frame-Options: DENY` | Lines `51-57` |
| **Error Sanitization** | Strips file paths (`C:\...`, `/Users/...`), stack traces, and spawn internals | Lines `29-46` |
