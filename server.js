// Servidor de fama.: sirve index.html y hace de proxy a la API de Claude.
// Tres modos de IA:
//  - Gemini (gratis): GEMINI_API_KEY=... node server.js   (clave gratis en https://aistudio.google.com/apikey)
//  - API:  ANTHROPIC_API_KEY=sk-ant-... node server.js   (se paga por uso)
//  - CLI:  node server.js   (sin clave: usa tu Claude Code con sesión iniciada, gasta de tu suscripción)
// Fuerza uno con FAMA_BACKEND=gemini|api|cli. Node 18+, sin dependencias.
const http = require("http");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");
const path = require("path");

const PORT = process.env.PORT || 3000;
const KEY = process.env.ANTHROPIC_API_KEY;
const GKEY = process.env.GEMINI_API_KEY;
const BACKEND = process.env.FAMA_BACKEND || (GKEY ? "gemini" : KEY ? "api" : "cli");
const MODEL = process.env.FAMA_MODEL || { cli: "haiku", gemini: "gemini-2.5-flash", api: "claude-haiku-5-5" }[BACKEND];
const SYSTEM = "Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después ni bloques de código.";
const MAX_PROMPT = 12000;          // caracteres
const LIMIT = 20, WINDOW = 60000;  // 20 peticiones por minuto por IP

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW);
  arr.push(now); hits.set(ip, arr);
  return arr.length > LIMIT;
}

function extractJSON(text) {
  const t = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try { return JSON.parse(t); } catch {}
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error("JSON inválido");
}

async function callClaude(prompt) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error("API " + r.status + " " + (await r.text()).slice(0, 200));
  const d = await r.json();
  return extractJSON(d.content.map(c => c.text || "").join(""));
}

async function callGemini(prompt) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
    method: "POST",
    headers: { "x-goog-api-key": GKEY, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 2000 },
    }),
  });
  if (r.status === 429) { const e = new Error("cuota de Gemini agotada"); e.rate = true; throw e; }
  if (!r.ok) throw new Error("Gemini " + r.status + " " + (await r.text()).slice(0, 200));
  const d = await r.json();
  const parts = d.candidates?.[0]?.content?.parts || [];
  return extractJSON(parts.map(p => p.text || "").join(""));
}

// Modo CLI: una petición a la vez (cada una abre un proceso de claude).
let cola = Promise.resolve();
function callCLI(prompt) {
  const run = () => new Promise((res, rej) => {
    const p = spawn("claude", ["-p", "--model", MODEL, "--tools", "", "--disable-slash-commands",
      "--no-session-persistence", "--system-prompt", SYSTEM], { cwd: os.tmpdir() });
    let out = "", err = "";
    const timer = setTimeout(() => { p.kill(); rej(new Error("timeout")); }, 90000);
    p.stdout.on("data", d => out += d);
    p.stderr.on("data", d => err += d);
    p.on("error", e => { clearTimeout(timer); rej(new Error("no se pudo ejecutar 'claude': " + e.message)); });
    p.on("close", code => {
      clearTimeout(timer);
      if (code !== 0) return rej(new Error("claude salió con " + code + " " + err.slice(0, 200)));
      try { res(extractJSON(out)); } catch (e) { rej(e); }
    });
    p.stdin.end(prompt);
  });
  const r = cola.then(run, run);
  cola = r.catch(() => {});
  return r;
}

function readBody(req) {
  return new Promise((res, rej) => {
    let b = "";
    req.on("data", c => { b += c; if (b.length > 50000) { rej(new Error("grande")); req.destroy(); } });
    req.on("end", () => res(b));
  });
}

http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(fs.readFileSync(path.join(__dirname, "index.html")));
  }
  if (req.method === "POST" && req.url === "/api/ai") {
    if (BACKEND === "api" && !KEY) return send(503, { error: "Falta ANTHROPIC_API_KEY" });
    if (BACKEND === "gemini" && !GKEY) return send(503, { error: "Falta GEMINI_API_KEY" });
    if (limited(req.socket.remoteAddress)) return send(429, { error: "rate_limited" });
    try {
      const { prompt } = JSON.parse(await readBody(req));
      if (typeof prompt !== "string" || !prompt || prompt.length > MAX_PROMPT) return send(400, { error: "prompt inválido" });
      return send(200, await (BACKEND === "cli" ? callCLI(prompt) : BACKEND === "gemini" ? callGemini(prompt) : callClaude(prompt)));
    } catch (e) { console.error(e.message); if (e.rate) return send(429, { error: "rate_limited" }); return send(502, { error: "fallo de IA" }); }
  }
  send(404, { error: "no encontrado" });
}).listen(PORT, () => console.log("fama. en http://localhost:" + PORT + "  [IA: " + (BACKEND === "cli" ? "Claude Code" : BACKEND === "gemini" ? "Gemini" : "API Claude") + " (" + MODEL + ")" + ((BACKEND === "api" && !KEY) || (BACKEND === "gemini" && !GKEY) ? " ⚠ falta la clave" : "") + "]"));
