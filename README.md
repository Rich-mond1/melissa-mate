# Matemagics v4

App de matemáticas para Melissa (Year 3 → Year 4). Un solo `index.html` offline (GitHub Pages / iPhone).

## Qué hace
- **Explorer's Quest**: diagnóstico adaptativo por áreas (9 mundos, 56 habilidades) para saber dónde está sin aburrirla.
- Por habilidad: **lección** con dibujos y mini-quiz → **truco mágico** → práctica guiada → práctica → reto (🥉🥈🥇).
- **Repaso espaciado** ("Brain boost"): lo aprendido vuelve días después; así se ve si de verdad se ha fijado.
- Pistas, segunda oportunidad con la explicación del error típico, explicación completa si falla.
- **Stickers infinitos** (criatura × accesorio × fondo × rareza), sobres por rondas/medallas o comprados con ⭐. Nunca se acaban.
- Misión diaria, racha, niveles, premios editables, objetivo elegido por ella, insignias.
- **Panel de padres** (en español, tras pregunta de multiplicar): ¿aprende de verdad?, errores típicos, progreso por área, tiempo, premios, exportar/importar/reset.
- Migra automáticamente el progreso de v3 (estrellas, stickers, premios, racha, tema).

## Garantías (por qué no vuelven los bugs antiguos)
Cada pregunta lleva **dos respuestas calculadas por separado** (motor y recomputación independiente) y, si hay dibujo, un **decodificador que lee la respuesta del propio SVG/HTML** (agujas, partes sombreadas, marcas, regla…). Si no coinciden, la pregunta no se genera.

## Desarrollo
```
node tools/build.js          # genera index.html + node --check + auditoría de acciones/pantallas
node tools/audit.js --n 3000 # audita todas las habilidades/niveles (answer, dibujo, opciones, variedad)
node tools/engine-test.js    # simula alumnos de principio a fin
node tools/e2e.js           # Chromium real: clics en preguntas, acepta solo la correcta
node tools/layout-audit.js --n 20 --widths 360,390,430   # Chromium real: textos montados, cortes, contraste, botón 🔊 tapando, visuales ilegibles (preguntas, lecciones y trucos)
```
Todo junto:
```
npm test            # rápido (minutos): build, audit n=300, motor, estado, e2e, layout 360/390/430, toques, seguridad
# Currículo: curriculum/curriculum.json (datos, la app no lo lee); tras editarlo: node tools/curriculum-report.js
npm run test:full   # antes de fusionar con main: audit n=3000, e2e 6/skill, layout n=20
```
Seguridad del progreso: `tools/state-test.js` (carga/migración/exportar-importar con `tools/fixtures/`; añade ahí tu export real como `state-v4-real-*.json`) y `tools/safety-test.js` (aviso si falla el guardado, Exportar, Compartir copia, Importar, estado corrupto). `tools/touch-test.js` simula el clic perdido de iOS; sin WebKit instalado solo cubre Chromium y lo dice. Antes de fusionar con `main`: `docs/IPAD-CHECKLIST.md` en el iPad real.

Habilidades nuevas: ver `docs/SPEC.md`.
