# fama – contexto del proyecto para Claude Code

## Qué es
**fama.** es un juego de simulación de red social con personajes de IA, en español (tono boricua/latino).
Está inspirado en las *mecánicas* de la app "status – sims but social media" (WishRoll Inc.),
pero es 100% gratis: no tiene energía, gemas, anuncios ni suscripción.

**Regla importante:** no copiar el nombre, logo, arte, textos ni código de Status. Solo se replican
mecánicas de juego (eso no tiene derechos de autor). Todos los personajes que genera la IA deben ser
originales: nada de personas reales ni personajes con copyright. El contenido es apto para 13+, sin
romance ni contenido sexual.

## Dueño
Juan M. Cardona Montañez, estudiante de la Universidad Interamericana de Puerto Rico, Recinto de Fajardo.
Habla español; responde siempre en español.

## Estado actual (v2)
Todo vive en un solo archivo, `index.html` (HTML + CSS + JS vanilla, sin build).
Está publicado como un artifact de claude.ai. Las funciones de IA y de guardado dependen del runtime de artifacts:

- `await claude.use("sample")` → `sample.json(prompt, {modelTier:"quick", cache:false})` devuelve el JSON que genera Claude.
  **Esto solo funciona dentro del artifact publicado en claude.ai.**
- `await claude.use("db")` y `claude.use("user")` → guardan la partida en `data/users/<id>/juego` (`{json, t}`).
- `localStorage` (`estado_juego_v2`) se usa como respaldo.

### Funciones que ya existen
- Onboarding en 3 pasos: escenario (10 predefinidos o uno propio) → persona, fandoms y nivel de locura (1-5) → escoger el primer seguidor (la IA genera 6 candidatos). Al terminar, la IA genera el primer post.
- Feed: posts del jugador (se puede "postear con" un personaje para tener más alcance), comentarios de personajes y NPCs, posts de cuentas de noticias o chisme, botón "Dame una idea".
- Stats: seguidores, XP/nivel (`nivel = floor(sqrt(xp/40))+1`), humor, aura y drama (0-100). Si el drama llega a 100, el jugador queda **cancelado** (pierde 20% de seguidores) hasta que la IA marque `perdonado`.
- Personajes: afinidad (0-100), relación editable (amigos, rivales, mentor, némesis…), memoria (últimos 8 recuerdos que se pasan en los prompts).
- Mensajes directos: los personajes pueden escribir primero (después de un post, o con el botón "🔔 ¿Alguien me escribió?"). Hay contador de no leídos.
- Planes: agendar o hacer actividades con un personaje. La IA narra lo que pasó y el personaje publica sobre el plan.
- 14 logros. El estado viejo de v1 se migra solo con `migrate()`.

### Estructura del estado `S`
```
{v:2, yo:{name,handle,bio,fandoms[],escenario,locura},
 chars:[{id,nombre,usuario,bio,personalidad,fama,color,afinidad,relacion,memoria[]}],
 feed:[{tipo:"mio"|"npc"|"char", ...}], chats:{[cid]:[{yo,texto}]}, unread:{[cid]:n},
 planes:[{id,cid,actividad,estado:"pendiente"|"hecho",resultado}],
 stats:{seguidores,xp,humor,aura,drama,likesTot,noticias}, logros:[], cancelado}
```

## Pruebas
`tests/test_ui.py` abre el juego en Chromium con un `window.claude` simulado (mock) y recorre todo:
onboarding, post, DM, plan y perfil. Guarda capturas en `tests/screenshots/`.
```
pip install playwright && playwright install chromium
python tests/test_ui.py
```
Después de cualquier cambio, córrela y asegúrate de que salga `errors []`.

## Ideas para mejorarlo (próximos pasos)
1. **Separar el código** en `index.html`, `styles.css` y `js/` (estado, ia, vistas) o migrar a un framework (Vite + React/Svelte).
2. **Correr fuera de claude.ai:** crear un backend pequeño (Node/Express o FastAPI) que llame a la API de Claude con la clave en una variable de entorno (`ANTHROPIC_API_KEY`), y cambiar `ai()` para que llame a ese backend. Nunca poner la clave en el frontend. Ojo: la API se paga por uso.
3. **App móvil:** envolverlo con Capacitor o rehacerlo en React Native/Expo.
4. **Voz:** los personajes leen sus mensajes (TTS).
5. **Imágenes/avatares** generados o seleccionables; posts con foto.
6. **Historias** (stories) de 24h de los personajes.
7. **Cuentas NPC que publican solas** cada cierto tiempo (feed vivo aunque no publiques).
8. Mejor balance de números (seguidores, XP) y más logros.
9. Posible cambio de nombre a algo más boricua (candidatos: Bochinche, Pegao, Revolú, Corillo, Wepa).
