// Servidor de fama.: sirve index.html y hace de proxy a la API de Claude.
// Uso: ANTHROPIC_API_KEY=sk-ant-... node server.js   (Node 18+, sin dependencias)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.FAMA_MODEL || "claude-haiku-5-5";
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
      system: "Responde ÚNICAMENTE con un objeto JSON válido, sin texto antes ni después ni bloques de código.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) throw new Error("API " + r.status + " " + (await r.text()).slice(0, 200));
  const d = await r.json();
  return extractJSON(d.content.map(c => c.text || "").join(""));
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
    if (!KEY) return send(503, { error: "Falta ANTHROPIC_API_KEY" });
    if (limited(req.socket.remoteAddress)) return send(429, { error: "rate_limited" });
    try {
      const { prompt } = JSON.parse(await readBody(req));
      if (typeof prompt !== "string" || !prompt || prompt.length > MAX_PROMPT) return send(400, { error: "prompt inválido" });
      return send(200, await callClaude(prompt));
    } catch (e) { console.error(e.message); return send(502, { error: "fallo de IA" }); }
  }
  send(404, { error: "no encontrado" });
}).listen(PORT, () => console.log("fama. en http://localhost:" + PORT + (KEY ? "" : "  (⚠ falta ANTHROPIC_API_KEY)")));
