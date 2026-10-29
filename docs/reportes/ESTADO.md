# Estado de ejecución — Plan maestro Grano

| Fase | Tarea | Subagente | Estado | Commit de fusión | Pendientes |
|---|---|---|---|---|---|
| Fase 0 | `F0` · Preparación y línea base | Orquestador | Completada | `HEAD` (en `main`) | Ninguno |
| Fase 1 | `T1` · Marca y tokens | Pendiente de lanzar | En curso | — | Lanzar en paralelo Fase 1 |
| Fase 1 | `T2` · Puente IA v2 (servidor) | Pendiente de lanzar | En curso | — | Lanzar en paralelo Fase 1 |
| Fase 1 | `T3` · Arquitecto curricular | Pendiente de lanzar | En curso | — | Lanzar en paralelo Fase 1 |
| Fase 1 | `T4` · Esquema, validadores y migración | Pendiente de lanzar | En curso | — | Lanzar en paralelo Fase 1 |
| Fase 1 | `T5` · Estado, persistencia y FSRS | Pendiente de lanzar | En curso | — | Lanzar en paralelo Fase 1 |
| Fase 1 | `T6` · Componentes base y movimiento | Pendiente (`T1`) | Pendiente | — | Espera fusión de `T1` |
| Fase 2 | `T7` · Shell, navegación, densidad y escala | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T4`, `T5`, `T6` |
| Fase 2 | `T8` · Onboarding, selección de área y Ruta | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T3`, `T4`, `T5`, `T6` |
| Fase 2 | `T9` · Reproductor de lección v2 | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T4`, `T5`, `T6` |
| Fase 2 | `T10` · Laboratorio SQL real (DuckDB-Wasm) | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T4`, `T5`, `T6` |
| Fase 2 | `T11` · Tutor IA (interfaz) y funciones IA | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T2`, `T4`, `T5`, `T6` |
| Fase 2 | `T12` · Vistas secundarias | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T4`, `T5`, `T6` |
| Fase 2 | `T13` · Simuladores: consolidación visual | Pendiente (Fase 1) | Pendiente | — | Espera `T1`, `T4`, `T5`, `T6` |
| Fase 3 | `W-*` (Ola A, Ola B, Ola C), `F1`, `E1` | Pendiente (Fase 2) | Pendiente | — | Espera cierre de Fase 2 |
| Fase 4 | `Q1`, `Q2`, `Q3`, `FINAL` | Pendiente (Fase 3) | Pendiente | — | Espera cierre de Fase 3 |
