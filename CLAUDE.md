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

- **Plantillas de mundo** (Perfil → 🌎 Plantillas): título, portada (imagen/emoji), fandom, descripción, **meta** y hasta 8 personajes originales. "Jugar este mundo" cambia el escenario, pone la meta y suma los personajes. La IA devuelve `progresoMeta` (-10..25) en posts y planes; al llegar a 100 la meta se cumple (+200 XP, logro).
- Personajes personalizados (crear/editar/borrar, emoji, color, autocompletar con IA) y edición de perfil/escenario.
- Fuera de claude.ai: `server.js` (modos Gemini, API de Claude o CLI de Claude Code; ver README).

- **Varios mundos** (v3): pantalla de inicio con "Seguir jugando" (cada mundo es una partida aparte), 🏠 en el header para volver, borrar mundo desde Perfil. Pestañas del inicio: 🌎 Mundos (crear desde cero, plantillas), 📖 Arcos, 👥 Personajes.
- **Biblioteca de personajes** global (`R.lib`): se crean en Inicio → Personajes, se guardan desde un mundo con 📚 y se traen con 📥 (Seguidores) o desde el editor de plantillas.
- **Arcos**: historias con N escenas (3-8), 3 opciones por escena (o texto libre) y 2-4 finales; la IA escribe cada escena y cierra con el final que corresponde. Se llevan los finales descubiertos.
- Formulario de personaje (como en Status): foto (se recorta a 160px), nombre, usuario, género, bio, personalidad, "descripciones adicionales" (`extra`, influye en la IA), seguidores con atajos 1K–100K o personalizado, emoji y color. Campos del personaje: ver `CAMPOS` en `index.html`.
- Los ejemplos iniciales (2 plantillas y 1 arco) se siembran en `nuevoR()`.

### Estructura del estado
Raíz `R` (guardada en `localStorage["fama_v3"]` y en el doc `juego` del db de artifacts):
```
R={v:3, worlds:{[id]:{id,titulo,emoji,color,portada,creado,t,estado:S}}, lib:[personaje...],
   plantillas:[...], arcos:[{id,titulo,emoji,color,premisa,personajes,escenas,finales:[{titulo,cond}]}],
   arcoProg:{[arcoId]:{vistos:[],jugadas,actual:{nombre,hist:[{n,e,op}],fin}}}, nombre}
```
`migrate()` + `fromAny()` convierten partidas v1/v2 viejas en el primer mundo. `S` = estado del mundo abierto (o `null` en el inicio).

### Estructura del estado `S` (un mundo)
```
{v:2, yo:{name,handle,bio,fandoms[],escenario,locura},
 chars:[{id,nombre,usuario,bio,personalidad,fama,color,afinidad,relacion,memoria[]}],
 feed:[{tipo:"mio"|"npc"|"char", ...}], chats:{[cid]:[{yo,texto}]}, unread:{[cid]:n},
 planes:[{id,cid,actividad,estado:"pendiente"|"hecho",resultado}],
 stats:{seguidores,xp,humor,aura,drama,likesTot,noticias}, logros:[], cancelado,

 meta:{texto,progreso,cumplida,titulo}|null}
```

## Pruebas
(Las plantillas viven en `R.plantillas`: {id,titulo,fandom,descripcion,meta,portada,emoji,color,personajes[]}.)
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
