# Prompt de rediseño — Manual de Datos 2026

> Pega todo lo que está debajo de la línea en Antigravity.

---

## Rol y objetivo

Eres un diseñador de producto + ingeniero frontend senior. Vas a rediseñar la interfaz de este proyecto (React 19 + Vite, `src/App.jsx`, `src/components/*`, `src/styles.css`, `src/styles/editorialStudio.css`) para que deje de parecer generada por IA y se sienta como **un manual técnico de referencia hecho por una persona con criterio**, al estilo de un libro de O'Reilly / la documentación de Stripe / el sitio de Julia Evans: sobrio, denso en información, con personalidad tipográfica y cero relleno.

**No cambies la lógica** (motores en `src/engine/`, estado, rutas, simuladores, quiz). **No borres contenido técnico** de `src/data/`; solo puedes reescribir títulos, subtítulos y textos de interfaz según las reglas de copy de abajo.

## Diagnóstico actual (lo que está mal, verificado en http://127.0.0.1:5174/ a 1366×850)

1. **Header roto**: la marca "Manual de Datos 2026" se parte en 2 líneas; el subtítulo de marca es diminuto e ilegible; los links de navegación quedan cortados por arriba; "Progreso (0/18)" cae a una segunda fila; el botón "Consultar Google AI Ultra" se parte en 2 líneas.
2. **Identidad inconsistente**: el `<title>` dice "DATA TRIAD STUDIO — Oct 2026", el header dice "Manual de Datos 2026", `DESIGN.md` dice "Academia de Datos 2026" y menciona 12 lecciones cuando hay 18. Debe haber **un solo nombre**: "Manual de Datos".
3. **Paleta Tailwind por defecto** (`#1D4ED8`, `#047857`, `#B45309`, `#EFF6FF`, `#FEF2F2`...). Es la firma más obvia de "hecho por IA".
4. **Escala tipográfica sin jerarquía**: 13 tamaños entre 0.75rem y 0.96rem. Todo se ve del mismo tamaño.
5. **Copy inflado**: Title Case en español (incorrecto: en español se usa mayúscula solo al inicio), títulos de 15+ palabras con 4 anglicismos cada uno, "Oct 2026" / "octubre de 2026" sellado en todas partes, promesas tipo "0% de alucinaciones", "erradicar", "para siempre", "reducir a la mitad", "de principio a fin".
6. **Índice monótono**: 18 filas idénticas, cada una con un "Leer" repetido que no aporta nada; descripciones de etapa son párrafos largos en una columna estrecha.
7. **Lección = muro de texto**: h3 numerados "1. 2. 3. 4."; enumeraciones escritas como "1) ... 2) ... 3)" dentro de párrafos en vez de listas; la sección DE/DA/BI son 3 columnas de bullets idénticas (patrón genérico de "tres tarjetas"); el botón final negro es igual al del hero.
8. **CSS duplicado**: dos hojas (`styles.css` 1148 líneas + `editorialStudio.css` 1612 líneas) que se pisan entre sí.

## Dirección visual (obligatoria, no la reinterpretes)

**Concepto: "manual técnico impreso".** Papel, tinta, una sola tinta de acento, márgenes generosos, tipografía como protagonista. Nada de gradientes, glassmorphism, sombras difusas, emojis, íconos decorativos, tarjetas flotantes ni "badges" de colores pastel.

### Tipografía
- Títulos: **Newsreader** (serif, Google Fonts) peso 500–600. Texto corrido: **Source Serif 4** o mantener **Atkinson Hyperlegible**, 17–18px, `line-height: 1.65`, ancho máximo de línea **68ch**. UI (nav, metadatos, botones): **Inter Tight** o **IBM Plex Sans**, 13–14px. Código: **JetBrains Mono** 14px.
- Escala fija de **6 tamaños** y nada más: 13 / 15 / 18 / 22 / 30 / 44 px. Elimina cualquier otro tamaño.
- Español en **sentence case** en todos los títulos ("El peligro oculto de los JOINs", no "El Peligro Oculto De Los JOINs").
- Metadatos (etapa, minutos, número de capítulo) en `font-variant-numeric: tabular-nums` y mayúsculas pequeñas con `letter-spacing: 0.06em`.

### Color (tokens en `:root`, borra los demás)
```
--paper:      #F6F3EC   /* fondo */
--paper-2:    #EDE8DD   /* bloques de contexto, cabeceras de tabla */
--ink:        #1B1A17   /* texto principal */
--ink-2:      #57534A   /* secundario */
--rule:       #D8D1C2   /* líneas de 1px */
--accent:     #B3361E   /* una sola tinta: bermellón de imprenta */
--code-bg:    #1E1D1A
--ok:         #2F6B3A   /* solo para "solución correcta" en simuladores */
```
- Los roles DE / DA / BI **no** llevan cada uno un color. Se distinguen por etiqueta tipográfica (`DE`, `DA`, `BI` en mayúscula pequeña, mono) y, si hace falta, por un ícono de 1 trazo. El rojo `--accent` se usa para: link activo, número de capítulo, antipatrón en simuladores. Nada más.
- Implementa modo oscuro con los mismos tokens invertidos bajo `prefers-color-scheme: dark`.

### Forma
- `border-radius`: 0 en contenedores, 2px en botones e inputs. Sin `box-shadow` en ningún lado.
- Separación entre bloques con **reglas de 1px** (`--rule`) y espacio, no con tarjetas con fondo.
- Espaciado en múltiplos de 8px: 8 / 16 / 24 / 40 / 64 / 96.

## Cambios por pantalla

### 1. Header (arreglar primero)
- Una sola línea de 56px de alto a ≥1024px. Izquierda: "Manual de Datos" en Newsreader 18px (sin "2026", sin subtítulo). Centro/izquierda: navegación en una fila sin cortes. Derecha: progreso como texto `3 / 18` con una barra de 2px de 80px de ancho, y el botón del tutor con texto corto: **"Tutor"**.
- Por debajo de 1024px: la nav pasa a un menú desplegable. Nada se parte en dos líneas nunca; usa `white-space: nowrap` y verifica.
- Sticky, fondo `--paper`, regla inferior de 1px.

### 2. Portada / índice
- Hero sin botones a la derecha. Un título grande (44px) de máximo 8 palabras, un párrafo de máximo 2 líneas, y **un** enlace primario ("Empezar por el capítulo 1 →"). El diagnóstico de nivel queda como enlace de texto secundario debajo.
- Índice como **tabla de contenidos de libro**: número de capítulo grande en `--accent` (Newsreader, 30px) en la columna izquierda, título + subtítulo en el centro, minutos alineados a la derecha con tabular-nums. **Elimina la palabra "Leer"**: toda la fila es el enlace, con hover que subraya el título.
- Cada etapa: encabezado "Etapa 1 · 6 h" en mayúscula pequeña + título de etapa en 22px + descripción de **máximo 25 palabras**. Muestra el progreso de etapa solo si es > 0.
- Capítulos completados: marca ✓ sutil en lugar del número, no cambiar fondo de la fila.

### 3. Vista de capítulo
- Sidebar izquierda: ok la estructura, pero títulos cortos (usa el título corto definido abajo), capítulo actual marcado con barra de 2px `--accent` a la izquierda, no con fondo gris.
- Columna de lectura centrada a 68ch. Títulos de sección **sin numeración "1. 2. 3."**.
- Todo texto con patrón "1) ... 2) ... 3)" dentro de un párrafo debe convertirse en `<ol>` real. Revisa `src/utils/formatText.jsx` y los datos.
- Tablas de ejemplo: sin caja contenedora, reglas horizontales de 1px, cabecera en `--paper-2`, números alineados a la derecha.
- Callout de error ("Resultado del JOIN directo..."): borde izquierdo de 3px `--accent`, fondo transparente, sin ícono de alerta.
- Sección DE / DA / BI: en lugar de 3 columnas de bullets iguales, usa **una tabla de 3 filas** (rol | qué hace | herramienta/test concreto) o tres bloques apilados con la etiqueta de rol en el margen izquierdo, estilo nota al margen.
- Al final: navegación "← Capítulo anterior | Siguiente capítulo →" estilo libro, y el laboratorio de código como enlace de texto, no como botón negro gigante.

### 4. Resto de vistas (Glosario, Repaso, Proyectos, Diagnóstico, Analytics)
Aplica los mismos tokens, escala y reglas. Ninguna vista puede introducir colores, radios o sombras fuera de los tokens.

## Reglas de copy (aplícalas a `src/data/` y a la UI)
- Cada capítulo debe tener `title` (máx. **7 palabras**) y `subtitle` (máx. **18 palabras**). Ejemplo: título "Granularidad y el fan-out en JOINs", subtítulo "Por qué una consulta correcta puede duplicar los ingresos de un dashboard."
- Prohibido: "Oct 2026"/"octubre de 2026" fuera del footer, "erradicar", "para siempre", "de principio a fin", "0% de alucinaciones", "a la mitad", "360°", "profesional(es)" como adorno, "espagueti", signos de exclamación.
- Términos técnicos en inglés se quedan en inglés pero en minúscula salvo nombres propios (fan-out, window functions, Apache Iceberg, DuckDB).
- Nombre de producto en todas partes: **Manual de Datos**. Actualiza `<title>` en `index.html`, `package.json` (`description`), y reescribe `DESIGN.md` para que documente el sistema nuevo (18 capítulos, tokens nuevos).

## Limpieza técnica
- Fusiona `styles.css` y `editorialStudio.css` en **un solo archivo** con secciones: tokens, base, layout, componentes, vistas. Borra reglas muertas (verifica con búsqueda de clases en JSX). Cero `!important`.
- Carga las fuentes con `<link rel="preconnect">` + Google Fonts en `index.html`, `font-display: swap`.

## Proceso (síguelo en orden, no hagas todo de golpe)
1. Tokens + tipografía + fusión de CSS. Captura de pantalla de portada y capítulo 1.
2. Header. Captura a 1366, 1024, 768 y 390 px de ancho.
3. Portada/índice. Captura.
4. Vista de capítulo. Captura de capítulos 1, 7 y 14 (tienen simuladores distintos).
5. Copy en `src/data/`. Lista en una tabla los 18 títulos viejos → nuevos antes de aplicar.
6. Resto de vistas.
7. Corre `npm run build` y confirma que no hay errores ni warnings.

Después de cada paso, muéstrame la captura y espera mi OK antes de seguir.

## Criterios de aceptación (verifícalos tú mismo con el navegador)
- [ ] Ningún elemento del header ocupa más de una línea a 1366 y 1024 px.
- [ ] Sin scroll horizontal a 390 px.
- [ ] `grep` de `#1D4ED8|#047857|#B45309|#EFF6FF|box-shadow|!important` en `src/` devuelve 0 resultados.
- [ ] Solo existen los 6 tamaños de fuente definidos (`grep font-size`).
- [ ] La palabra "Leer" no aparece en el índice.
- [ ] Ningún título de capítulo supera 7 palabras.
- [ ] Contraste de texto ≥ 4.5:1 en claro y oscuro.
- [ ] Todos los simuladores y el quiz siguen funcionando (prueba al menos capítulos 1, 7, 14 y 18).
- [ ] `npm run build` limpio.
