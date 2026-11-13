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
Necesitas Node 18+ y una clave de la API de Claude (la API se paga por uso).
```
ANTHROPIC_API_KEY=sk-ant-... node server.js
```
Abre http://localhost:3000. El servidor (`server.js`) sirve el juego y reenvía los prompts a la API, así la clave nunca llega al navegador. Variables opcionales: `PORT`, `FAMA_MODEL` (por defecto `claude-haiku-5-5`). Límite: 20 peticiones/minuto por IP. La partida se guarda en `localStorage`.
Dentro de claude.ai el juego sigue usando el runtime del artifact.
