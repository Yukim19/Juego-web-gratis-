# fama.

Juego gratis de simulación de red social con personajes de IA, en español.
Creas tu persona, escoges un escenario, publicas, ganas seguidores, haces planes con tus personajes y te cuidas de no ser cancelado.

## Cómo continuar en Claude Code
1. Descomprime esta carpeta.
2. Ábrela en Claude Code (terminal: `cd fama && claude`, o desde la app de escritorio).
3. Claude Code lee `CLAUDE.md` automáticamente y ahí tiene todo el contexto.
4. Pídele, por ejemplo: "Separa el código en archivos y añade un backend para que funcione fuera de claude.ai".

## Archivos
- `index.html`: el juego completo
- `CLAUDE.md`: contexto e instrucciones para Claude Code
- `tests/test_ui.py`: prueba automática con la IA simulada

## Correrlo fuera de claude.ai
Necesitas Node 18+. Abre http://localhost:3000 después de arrancar el servidor. Hay tres modos de IA:

**Gratis con Gemini (funciona en cualquier servidor)**
Saca una clave gratis en https://aistudio.google.com/apikey (la cuota gratis alcanza para un jugador).
```
GEMINI_API_KEY=... node server.js
```
Modelo por defecto: `gemini-2.5-flash` (cámbialo con `FAMA_MODEL`).

**Con tu suscripción de Claude (sin clave de API, sin costo extra)**
Requiere tener Claude Code instalado y con sesión iniciada en esa computadora.
```
node server.js
```
Usa el comando `claude -p` (modelo `haiku`), una petición a la vez, y gasta de los límites de tu plan. Solo funciona en la computadora donde corre.

**Con clave de API (se paga por uso)**
```
ANTHROPIC_API_KEY=sk-ant-... node server.js
```
Variables opcionales: `PORT`, `FAMA_MODEL`, `FAMA_BACKEND=gemini|api|cli` (por defecto: `gemini` si hay `GEMINI_API_KEY`, luego `api` si hay clave de Anthropic, si no `cli`).

El servidor reenvía los prompts, así la clave nunca llega al navegador. Límite: 20 peticiones/minuto por IP. La partida se guarda en `localStorage`.
Dentro de claude.ai el juego sigue usando el runtime del artifact.
