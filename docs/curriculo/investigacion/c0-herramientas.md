# Investigación curricular y diseño del módulo `c0-herramientas`

- **Módulo:** `c0-herramientas` — Herramientas del oficio
- **Área y nivel:** `core` (Tronco común) · Nivel `0` (Cimientos)
- **Objetivo del módulo (`modules.js`):** Ejecutar comandos de terminal, registrar cambios en Git y correr scripts y cuadernos de Python reproducibles.
- **Prerrequisitos del módulo:** Ninguno (`[]`). Asume cero experiencia previa en programación o sistemas Unix.
- **Duración total:** `100` minutos (`[15, 25, 25, 20, 15]`).
- **Fecha de consulta y verificación:** `2026-10-29`.

---

## 1. Investigación de fuentes por lección (Paso 1)

Todas las fuentes listadas en las tablas de cada lección fueron verificadas mediante petición HTTP `GET` con código de estado `200` el `2026-10-29`. Cada lección cuenta con 4 fuentes verificables (al menos 3 primarias).

### Lección 1 · `c0-herramientas-01-terminal-rutas`
- **Título:** La terminal sin miedo: rutas, archivos y tuberías (`15` min)

| Tipo | Título de la fuente | Editorial / Autor | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria | The Open Group Base Specifications Issue 8 (POSIX.1-2024) — Shell Command Language & Pipelines | IEEE / The Open Group | https://pubs.opengroup.org/onlinepubs/9799919799/utilities/V3_chap02.html | `2026-10-29` | Semántica estándar de flujos `stdin`/`stdout`/`stderr`, redirección (`>`, `>>`), variables de entorno y tuberías (`\|`) que conectan procesos concurrentes sin archivos temporales. |
| Primaria | Linux man-pages — `wc(1)` Word, Line, Character, and Byte Count | Linux Kernel Organization / GNU Coreutils | https://man7.org/linux/man-pages/man1/wc.1.html | `2026-10-29` | Comportamiento de `wc -l` para contar saltos de línea de un archivo tabular antes de abrirlo en memoria. |
| Primaria | Linux man-pages — `grep(1)` Print Lines That Match Patterns | Linux Kernel Organization / GNU Project | https://man7.org/linux/man-pages/man1/grep.1.html | `2026-10-29` | Filtrado de líneas mediante patrones de texto con `grep` y conteo directo de coincidencias con `grep -c`. |
| Secundaria | The Unix Shell: Pipes and Filters | The Carpentries (Software Carpentry) | https://swcarpentry.github.io/shell-novice/04-pipefilter.html | `2026-10-29` | Patrón de composición de utilidades pequeñas (`head`, `tail`, `grep`, `wc`) para inspeccionar archivos de datos crudos. |

### Lección 2 · `c0-herramientas-02-git-commits-ramas`
- **Título:** Git en 30 minutos: commits atómicos, ramas y diff (`25` min)

| Tipo | Título de la fuente | Editorial / Autor | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria | Pro Git Book (2nd Edition) — Chapter 2.2: Recording Changes to the Repository | Scott Chacon & Ben Straub (git-scm.com) | https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository | `2026-10-29` | Ciclo de vida de los tres estados en Git (directorio de trabajo, área de preparación o *staging area* y repositorio) más exclusión de archivos de datos y credenciales mediante `.gitignore`. |
| Primaria | Pro Git Book (2nd Edition) — Chapter 3.1: Branches in a Nutshell | Scott Chacon & Ben Straub (git-scm.com) | https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell | `2026-10-29` | Modelo de ramas como punteros móviles ligeros a instantáneas (`commits`), creación y cambio de rama con `git switch -c` y fusión con `git merge`. |
| Primaria | Git Official Reference Manual — `git-diff` Documentation | Git Project | https://git-scm.com/docs/git-diff | `2026-10-29` | Inspección línea por línea de diferencias entre el directorio de trabajo y el área de preparación (`git diff` frente a `git diff --staged`). |
| Primaria | GitHub Docs — About Pull Requests | GitHub / Microsoft | https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests | `2026-10-29` | Flujo de revisión por pares en Pull Requests sobre commits atómicos antes de integrar cambios en la rama `main`. |

### Lección 3 · `c0-herramientas-03-python-inicial-uv`
- **Título:** Python inicial para datos: colecciones y entornos con uv (`25` min)

| Tipo | Título de la fuente | Editorial / Autor | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria | Python 3.14 Official Tutorial — Chapter 5: Data Structures | Python Software Foundation | https://docs.python.org/3/tutorial/datastructures.html | `2026-10-29` | Propiedades y complejidad de listas (`list`), diccionarios (`dict`), conjuntos (`set`) y comprensiones de listas para representar filas y registros clave-valor. |
| Primaria | Astral `uv` Documentation — Working on Projects | Astral (`docs.astral.sh`) | https://docs.astral.sh/uv/guides/projects/ | `2026-10-29` | Gestión reproducible de proyectos Python con `uv init`, `uv add`, `pyproject.toml`, archivo de bloqueo exacto `uv.lock` y ejecución aislada con `uv run`. |
| Primaria | PEP 723 — Inline Script Metadata | Python Enhancement Proposals (PSF) | https://peps.python.org/pep-0723/ | `2026-10-29` | Declaración de dependencias y versión de Python dentro de un script autónomo para ejecutarlo de forma aislada sin contaminar el sistema operativo. |
| Secundaria | Python Packaging User Guide — Managing Dependencies | Python Packaging Authority (PyPA) | https://packaging.python.org/en/latest/tutorials/managing-dependencies/ | `2026-10-29` | Separación entre dependencias declaradas en `pyproject.toml` y versiones exactas fijadas en archivos de bloqueo para evitar el problema de "en mi máquina sí funciona". |

### Lección 4 · `c0-herramientas-04-cuadernos-jupyter-marimo`
- **Título:** Cuadernos interactivos y reactivos (Jupyter y Marimo) (`20` min)

| Tipo | Título de la fuente | Editorial / Autor | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria | Marimo Documentation — Reactive Execution and Reproducible Notebooks | Marimo Team | https://docs.marimo.io/guides/reactivity/ | `2026-10-29` | Modelado del cuaderno como un grafo acíclico dirigido (DAG) basado en las variables que cada celda define y lee, eliminando el estado oculto al reejecutar automáticamente las celdas dependientes. |
| Primaria | Marimo Documentation — Overview & Git-Friendly `.py` File Format | Marimo Team | https://docs.marimo.io/ | `2026-10-29` | Almacenamiento de cuadernos Marimo como scripts `.py` puros versionables en Git, ejecutables tanto como aplicación interactiva (`marimo edit`/`marimo run`) como desde la terminal (`python cuaderno.py`). |
| Primaria | Jupyter Notebook Documentation — Notebook Basics | Project Jupyter | https://jupyter-notebook.readthedocs.io/en/latest/notebook.html | `2026-10-29` | Arquitectura de celdas interactivas sobre un kernel persistente en memoria, contadores `In [n]` y estructura del documento JSON `.ipynb` con salidas incrustadas. |
| Primaria | Project Jupyter Official Documentation — Architecture and Execution Model | Project Jupyter | https://docs.jupyter.org/en/latest/ | `2026-10-29` | Regla de verificación "Restart Kernel and Run All Cells" para comprobar que un cuaderno `.ipynb` tradicional produce el mismo resultado de arriba hacia abajo. |

### Lección 5 · `c0-herramientas-05-trazas-error-documentacion`
- **Título:** Cómo leer trazas de error y buscar en documentación oficial (`15` min)

| Tipo | Título de la fuente | Editorial / Autor | URL verificada (`https://`) | Fecha (`accessed`) | Afirmación técnica que respalda |
|---|---|---|---|---|---|
| Primaria | Python 3.14 Official Tutorial — Chapter 8: Errors and Exceptions | Python Software Foundation | https://docs.python.org/3/tutorial/errors.html | `2026-10-29` | Estructura de una traza de pila (*traceback*) desde la llamada inicial arriba hasta la línea exacta y el tipo de excepción en la última línea (`Most recent call last`). |
| Primaria | Python Standard Library Reference — Built-in Exceptions | Python Software Foundation | https://docs.python.org/3/library/exceptions.html | `2026-10-29` | Causa exacta de `KeyError`, `TypeError`, `ValueError` y `FileNotFoundError` al procesar diccionarios, tipos incompatibles y rutas de archivos. |
| Primaria | DuckDB Documentation — SQL Introduction & Query Error Diagnostics | DuckDB Foundation | https://duckdb.org/docs/sql/introduction | `2026-10-29` | Diagnóstico de errores de catálogo (`Catalog Error`), de enlace de columnas (`Binder Error`) y de sintaxis (`Parser Error`) con indicador visual de posición (`LINE` y cursor `^`). |
| Primaria | Polars User Guide — Getting Started & API Reference | Polars Project | https://docs.pola.rs/user-guide/getting-started/ | `2026-10-29` | Cómo leer firmas de funciones, tipos de parámetros, valores por defecto y tipos de retorno en la documentación técnica oficial antes de copiar código. |

---

## 2. Mapa de conceptos y progresión del módulo (Paso 2)

El módulo `c0-herramientas` está diseñado para una persona en el Nivel `0` que nunca ha usado una interfaz de línea de comandos, Git ni Python. No asume conocimientos de módulos posteriores; únicamente utiliza ejemplos intuitivos de las tablas `stores`, `products`, `customers`, `orders` y `calendar` de Mercado Brisa (empresa ficticia).

| Orden | ID de lección | Qué asume al entrar | Conceptos que introduce | Con qué conecta después |
|---|---|---|---|---|
| 1 | `c0-herramientas-01-terminal-rutas` | Saber qué es una carpeta y un archivo de texto en su computadora. | Directorio de trabajo (`pwd`), **ruta relativa** frente a **ruta absoluta**, inspección segura sin abrir archivos pesados (`ls -lh`, `head`, `tail`, `wc -l`, `grep`), flujos estándar y **tubería Unix** (`\|`). | Necesario para ejecutar Git en la Lección 2 y `uv` en la Lección 3; base de `de2-pipelines`. |
| 2 | `c0-herramientas-02-git-commits-ramas` | Moverse por carpetas y listar archivos desde la terminal (Lección 1). | Los tres estados de Git (directorio de trabajo, **área de preparación** y repositorio), **commit atómico**, inspección con `git diff`, exclusión de datos/credenciales con `.gitignore`, ramas (`git switch -c`) y Pull Requests. | Necesario para versionar proyectos Python en la Lección 3 y cuadernos `.py` en la Lección 4; base de `de3-transformacion` y `bi4-operacion`. |
| 3 | `c0-herramientas-03-python-inicial-uv` | Navegar a la carpeta del proyecto en la terminal (Lección 1) y entender qué archivos se versionan en Git (Lección 2). | Variables, colecciones para datos (`list`, `dict`, `set`), funciones puras, **entorno virtual** aislado y gestión reproducible con `uv` (`pyproject.toml`, **archivo de bloqueo** `uv.lock`, `uv run`). | Necesario para escribir celdas en cuadernos (Lección 4), leer trazas de Python (Lección 5) y abordar `c1-python`. |
| 4 | `c0-herramientas-04-cuadernos-jupyter-marimo` | Sintaxis inicial de variables, listas y funciones en Python más ejecución con `uv` (Lección 3) y `git diff` (Lección 2). | Cuaderno interactivo (`.ipynb`), el antipatrón del **estado oculto** por ejecución desordenada de celdas, **cuaderno reactivo** en Marimo (`.py`) y el grafo acíclico dirigido (DAG) de dependencias entre celdas. | Conecta con el proyecto final del módulo, con `c1-python` y con `de2-formatos` (`de2-formatos-03-duckdb-polars-marimo`). |
| 5 | `c0-herramientas-05-trazas-error-documentacion` | Rutas de archivos (Lección 1), diccionarios y funciones en Python (Lección 3) y ejecución de celdas en cuadernos (Lección 4). | Lectura de una **traza de error** (*traceback*) de abajo hacia arriba, distinción entre `KeyError`, `TypeError`, `ValueError` y `FileNotFoundError`, lectura de errores con cursor `^` en motores SQL y consulta de firmas en documentación oficial. | Habilidad transversal para resolver prácticas en `c1-sql-base`, `c1-python` y el laboratorio DuckDB. |

**Verificación de dependencias curriculares:** Ninguna de las 5 lecciones utiliza conceptos que no hayan sido presentados en la propia lección o en las lecciones anteriores de `c0-herramientas`.

---

## 3. Glosario modular (Paso 5)

Se registran `8` términos nuevos en `docs/curriculo/investigacion/c0-herramientas-glossary.json` (todos validados contra `GlossaryTermSchema`, con definiciones de entre 20 y 60 palabras y fuentes verificadas):

1. `ruta-relativa-absoluta` — Ruta relativa frente a ruta absoluta (`c0-herramientas-01-terminal-rutas`)
2. `tuberia-unix` — Tubería de comandos (Pipe `|`) (`c0-herramientas-01-terminal-rutas`)
3. `commit-atomico` — Commit atómico en Git (`c0-herramientas-02-git-commits-ramas`)
4. `area-preparacion-git` — Área de preparación (Staging Area) (`c0-herramientas-02-git-commits-ramas`)
5. `entorno-virtual-python` — Entorno virtual y archivo de bloqueo (`uv.lock`) (`c0-herramientas-03-python-inicial-uv`)
6. `estado-oculto-cuaderno` — Estado oculto en cuadernos interactivos (`c0-herramientas-04-cuadernos-jupyter-marimo`)
7. `cuaderno-reactivo-dag` — Cuaderno reactivo basado en grafo (DAG) (`c0-herramientas-04-cuadernos-jupyter-marimo`)
8. `traza-error-traceback` — Traza de error (Traceback) (`c0-herramientas-05-trazas-error-documentacion`)

---

## 4. Proyecto del módulo y rúbrica verificable (Paso 6)

### Especificación actual en `src/data/catalog/modules.js`
- **Enunciado (`prompt`):** Configurar un proyecto local versionado en Git con un cuaderno que lea y valide las tiendas de Mercado Brisa.
- **Dataset (`dataset`):** Mercado Brisa (`stores` y `calendar`).
- **Entregable (`deliverable`):** Repositorio Git con al menos 3 commits limpios, archivo `README.md` y cuaderno `.py` ejecutable sin errores.

### Datos de referencia verificados con DuckDB sobre `stores.parquet` y `calendar.parquet`
Al ejecutar el cuaderno del proyecto contra los archivos reales de Mercado Brisa (`public/datasets/stores.parquet` y `public/datasets/calendar.parquet`), el alumno debe obtener y validar estos resultados exactos:
- Total de filas en `stores`: `14` registros únicos (`store_id` del `1` al `14`), repartidos en `7` tiendas `retail` (meta mensual acumulada de `370000` USD), `4` tiendas `flagship` (`302000` USD) y `3` centros `warehouse` (`253000` USD; códigos `WH-MX-01`, `WH-CO-01` y `WH-ES-01`).
- Total de filas en `calendar`: `1095` días naturales (`365` en 2023, `366` en 2024 por año bisiesto y `364` en 2025), con `15` días festivos (`is_holiday = true`, `5` por año).

### Rúbrica de evaluación de 4 criterios verificables (Escala 0–4)

| Criterio | 0–1 (Insuficiente) | 2 (En desarrollo) | 3 (Competente — esperado) | 4 (Excelente) |
|---|---|---|---|---|
| **1. Estructura y reproducibilidad del entorno (`uv`)** | No incluye `pyproject.toml` ni entorno aislado; requiere instalar paquetes manualmente de forma global. | Incluye `pyproject.toml`, pero falta `uv.lock` o las rutas hacia `stores.parquet` y `calendar.parquet` son absolutas de su máquina personal. | El proyecto incluye `pyproject.toml`, `uv.lock` y rutas relativas válidas; `uv run` ejecuta el proyecto a la primera en una carpeta limpia. | Además de ejecutar con `uv run`, documenta en `README.md` los comandos exactos de verificación y separa configuración de datos crudos. |
| **2. Higiene de control de versiones en Git** | Un solo commit masivo ("subo todo") o incluye `.venv/` y archivos de datos pesados dentro del historial de Git. | Tiene 2 o 3 commits, pero mezcla cambios no relacionados o carece de un archivo `.gitignore` que excluya `.venv/` y `__pycache__/`. | Incluye `.gitignore` limpio y al menos 3 commits atómicos con mensajes descriptivos (inicialización de entorno, carga de `stores`, validación de `calendar`). | Historial lineal de commits atómicos, rama de trabajo fusionada limpiamente y diferencias verificables con `git log --stat`. |
| **3. Reactividad y ausencia de estado oculto en el cuaderno (`.py`)** | Entrega un archivo con errores de ejecución (`NameError` o `KeyError`) o con variables redefinidas que cambian según el orden manual. | El cuaderno corre manualmente celda por celda, pero falla al ejecutarlo de principio a fin desde la terminal (`python validar_tiendas.py`). | El cuaderno reactivo (`.py` en Marimo) define un DAG sin variables duplicadas y se ejecuta sin errores tanto en modo interactivo como por terminal. | Separa en celdas reactivas el parámetro de filtro (`store_type` o `region`), el conteo de las 14 tiendas (`7` retail, `4` flagship, `3` warehouse) y el cruce con los `1095` días de `calendar`. |
| **4. Validación defensiva y manejo de errores** | No valida los datos de entrada; mezcla almacenes (`warehouse`) con tiendas físicas sin advertirlo. | Calcula el total de las 14 filas de `stores`, pero no separa los 3 almacenes (`WH-*`) ni comprueba nulos o metas negativas. | Incluye comprobaciones explícitas que verifican 14 tiendas únicas, separan los 3 `warehouse` (`253000` USD) de las 11 tiendas físicas (`672000` USD) y validan los 1095 días de `calendar`. | Añade validaciones con mensajes de error claros si cambia el esquema de columnas o si aparece una meta mensual menor o igual a cero. |
