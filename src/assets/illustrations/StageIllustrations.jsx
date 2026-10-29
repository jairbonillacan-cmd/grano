import React from 'react';

/**
 * Etapa 1 · Coral: Tablas de datos unidas por conectores precisos (JOIN y cardinalidad 1:N)
 */
export function Stage1Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      {/* Lienzo técnico con retícula sutil */}
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />
      <path
        d="M8 44H232M8 80H232M8 116H232M64 8V152M120 8V152M176 8V152"
        stroke="var(--border)"
        strokeWidth="0.75"
        strokeDasharray="2 3"
      />

      {/* Tabla izquierda: Dimensión / Grano 1 (orders) */}
      <rect
        x="20"
        y="26"
        width="74"
        height="108"
        rx="8"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      <path
        d="M20 34C20 29.5817 23.5817 26 28 26H86C90.4183 26 94 29.5817 94 34V46H20V34Z"
        fill="var(--stage)"
      />
      <circle cx="30" cy="36" r="3" fill="var(--surface)" />
      <rect x="38" y="34" width="34" height="4" rx="2" fill="var(--surface)" />
      <rect x="78" y="32" width="10" height="8" rx="2" fill="var(--stage-deep)" />

      {/* Filas de la tabla izquierda (PK 1) */}
      <rect x="28" y="56" width="16" height="8" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="48" y="58" width="36" height="4" rx="2" fill="var(--stage-deep)" />
      <line x1="20" y1="72" x2="94" y2="72" stroke="var(--border)" strokeWidth="1" />

      <rect x="28" y="80" width="16" height="8" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="48" y="82" width="28" height="4" rx="2" fill="var(--stage)" />
      <line x1="20" y1="96" x2="94" y2="96" stroke="var(--border)" strokeWidth="1" />

      <rect x="28" y="104" width="16" height="8" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="48" y="106" width="32" height="4" rx="2" fill="var(--border)" />

      {/* Sombra isométrica y Tabla derecha: Hechos / Grano N (order_items) */}
      <rect
        x="150"
        y="24"
        width="72"
        height="116"
        rx="8"
        fill="var(--stage-soft)"
        stroke="var(--stage)"
        strokeWidth="1"
      />
      <rect
        x="146"
        y="20"
        width="72"
        height="116"
        rx="8"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.75"
      />
      <path
        d="M146 28C146 23.5817 149.582 20 154 20H210C214.418 20 218 23.5817 218 28V40H146V28Z"
        fill="var(--stage-deep)"
      />
      <circle cx="156" cy="30" r="3" fill="var(--surface)" />
      <rect x="164" y="28" width="38" height="4" rx="2" fill="var(--surface)" />

      {/* 4 filas de cardinalidad N */}
      <rect x="154" y="48" width="14" height="7" rx="2" fill="var(--stage)" />
      <rect x="172" y="50" width="36" height="3.5" rx="1.75" fill="var(--stage-deep)" />
      <line x1="146" y1="62" x2="218" y2="62" stroke="var(--border)" strokeWidth="1" />

      <rect x="154" y="69" width="14" height="7" rx="2" fill="var(--stage)" />
      <rect x="172" y="71" width="30" height="3.5" rx="1.75" fill="var(--stage-deep)" />
      <line x1="146" y1="83" x2="218" y2="83" stroke="var(--border)" strokeWidth="1" />

      <rect x="154" y="90" width="14" height="7" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="172" y="92" width="34" height="3.5" rx="1.75" fill="var(--stage)" />
      <line x1="146" y1="104" x2="218" y2="104" stroke="var(--border)" strokeWidth="1" />

      <rect x="154" y="111" width="14" height="7" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="172" y="113" width="24" height="3.5" rx="1.75" fill="var(--border)" />

      {/* Conectores de JOIN y símbolo de cardinalidad 1:N (pata de gallo técnica) */}
      <path
        d="M94 60C114 60 122 51.5 146 51.5"
        stroke="var(--stage-deep)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M94 60C114 60 122 72.5 146 72.5"
        stroke="var(--stage-deep)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M94 84C116 84 124 93.5 146 93.5"
        stroke="var(--stage)"
        strokeWidth="1.75"
        strokeDasharray="3 2.5"
        strokeLinecap="round"
      />

      {/* Marcas de cardinalidad 1 (izquierda) y N (derecha) */}
      <line x1="99" y1="55" x2="99" y2="65" stroke="var(--stage-deep)" strokeWidth="2" />
      <path d="M139 47L146 51.5L139 56" stroke="var(--stage-deep)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M139 68L146 72.5L139 77" stroke="var(--stage-deep)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />

      {/* Nodo central de intersección JOIN */}
      <rect
        x="107"
        y="50"
        width="26"
        height="22"
        rx="6"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.75"
      />
      <circle cx="117" cy="61" r="4.5" stroke="var(--stage)" strokeWidth="1.75" />
      <circle cx="123" cy="61" r="4.5" stroke="var(--stage-deep)" strokeWidth="1.75" />

      {/* Puntos de puerto */}
      <circle cx="94" cy="60" r="3" fill="var(--stage-deep)" />
      <circle cx="94" cy="84" r="3" fill="var(--stage)" />
      <circle cx="146" cy="51.5" r="3" fill="var(--stage-deep)" />
      <circle cx="146" cy="72.5" r="3" fill="var(--stage-deep)" />
      <circle cx="146" cy="93.5" r="2.75" fill="var(--stage)" />
    </svg>
  );
}

/**
 * Etapa 2 · Ámbar: Estrella central de hechos conectada a nodos dimensionales (star schema)
 */
export function Stage2Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />
      {/* Anillo orbital dimensional */}
      <ellipse
        cx="120"
        cy="80"
        rx="82"
        ry="52"
        stroke="var(--border)"
        strokeWidth="1.25"
        strokeDasharray="4 4"
      />
      <circle cx="120" cy="80" r="38" stroke="var(--stage)" strokeWidth="1" strokeDasharray="2 3" />

      {/* Aristas radiales del esquema en estrella */}
      <path
        d="M66 42L94 62M174 42L146 62M66 118L94 98M174 118L146 98"
        stroke="var(--stage-deep)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M120 26V52M120 108V134" stroke="var(--stage)" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Nodo Dimensional 1 (Arriba Izquierda · dim_date) */}
      <rect
        x="20"
        y="20"
        width="54"
        height="34"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      <rect x="26" y="26" width="18" height="5" rx="2" fill="var(--stage)" />
      <rect x="26" y="35" width="40" height="3.5" rx="1.75" fill="var(--border)" />
      <rect x="26" y="42" width="28" height="3.5" rx="1.75" fill="var(--stage-soft)" />
      <circle cx="68" cy="44" r="3" fill="var(--stage-deep)" />

      {/* Nodo Dimensional 2 (Arriba Derecha · dim_customer SCD2 con historial apilado) */}
      <rect
        x="170"
        y="16"
        width="52"
        height="34"
        rx="7"
        fill="var(--stage-soft)"
        stroke="var(--stage)"
        strokeWidth="1.25"
      />
      <rect
        x="166"
        y="20"
        width="54"
        height="34"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.75"
      />
      <rect x="172" y="26" width="22" height="5" rx="2" fill="var(--stage-deep)" />
      <rect x="198" y="26" width="14" height="5" rx="2" fill="var(--stage)" />
      <rect x="172" y="35" width="40" height="3.5" rx="1.75" fill="var(--border)" />
      <rect x="172" y="42" width="32" height="3.5" rx="1.75" fill="var(--stage)" />
      <circle cx="172" cy="44" r="3" fill="var(--stage-deep)" />

      {/* Nodo Dimensional 3 (Abajo Izquierda · dim_product) */}
      <rect
        x="20"
        y="106"
        width="54"
        height="34"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      <rect x="26" y="112" width="20" height="5" rx="2" fill="var(--stage)" />
      <rect x="26" y="121" width="40" height="3.5" rx="1.75" fill="var(--border)" />
      <rect x="26" y="128" width="30" height="3.5" rx="1.75" fill="var(--stage-soft)" />
      <circle cx="68" cy="116" r="3" fill="var(--stage-deep)" />

      {/* Nodo Dimensional 4 (Abajo Derecha · dim_channel) */}
      <rect
        x="166"
        y="106"
        width="54"
        height="34"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      <rect x="172" y="112" width="20" height="5" rx="2" fill="var(--stage-deep)" />
      <rect x="172" y="121" width="40" height="3.5" rx="1.75" fill="var(--border)" />
      <rect x="172" y="128" width="26" height="3.5" rx="1.75" fill="var(--stage)" />
      <circle cx="172" cy="116" r="3" fill="var(--stage-deep)" />

      {/* Tabla Central de Hechos (Fact Table · Estrella central) */}
      <rect
        x="86"
        y="48"
        width="68"
        height="64"
        rx="10"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="2.25"
      />
      <path
        d="M86 58C86 52.4772 90.4772 48 96 48H144C149.523 48 154 52.4772 154 58V66H86V58Z"
        fill="var(--stage)"
      />
      {/* Estrella geométrica en cabecera de tabla de hechos */}
      <polygon
        points="100,53 102,56.5 106,57 103,59.5 104,63 100,61 96,63 97,59.5 94,57 98,56.5"
        fill="var(--surface)"
      />
      <rect x="110" y="55" width="34" height="4.5" rx="2" fill="var(--surface)" />

      {/* Claves foráneas y métricas aditivas en la tabla de hechos */}
      <rect x="94" y="74" width="14" height="6" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="112" y="75" width="34" height="4" rx="2" fill="var(--stage-deep)" />
      <rect x="94" y="85" width="14" height="6" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="112" y="86" width="26" height="4" rx="2" fill="var(--stage)" />
      <rect x="94" y="96" width="14" height="6" rx="2" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="112" y="97" width="30" height="4" rx="2" fill="var(--stage-deep)" />

      {/* Nodos de unión en los 4 vértices de la tabla de hechos */}
      <circle cx="86" cy="62" r="3.5" fill="var(--stage-deep)" />
      <circle cx="154" cy="62" r="3.5" fill="var(--stage-deep)" />
      <circle cx="86" cy="98" r="3.5" fill="var(--stage-deep)" />
      <circle cx="154" cy="98" r="3.5" fill="var(--stage-deep)" />
    </svg>
  );
}

/**
 * Etapa 3 · Esmeralda: Columnas de bloques comprimidos apilados y filtro de salto (Parquet + zone maps)
 */
export function Stage3Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Arco superior de salto (Zone Map Predicate Pushdown Skip) */}
      <path
        d="M54 34C78 12 162 12 186 34"
        stroke="var(--stage-deep)"
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
      <path
        d="M181 28L187 34.5L179 36"
        stroke="var(--stage-deep)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="96"
        y="14"
        width="48"
        height="14"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.5"
      />
      <rect x="106" y="19.5" width="28" height="3" rx="1.5" fill="var(--stage-deep)" />

      {/* Columna 1: Row Group 01 (Escaneado parcial) */}
      <rect
        x="24"
        y="38"
        width="54"
        height="100"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      {/* Cabecera Zone Map [min..max] */}
      <rect x="30" y="45" width="42" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="34" y="49.5" width="14" height="3" rx="1.5" fill="var(--stage-deep)" />
      <rect x="52" y="49.5" width="16" height="3" rx="1.5" fill="var(--stage)" />
      {/* Bloques columnares comprimidos */}
      <rect x="30" y="63" width="42" height="18" rx="4" fill="var(--stage)" />
      <rect x="35" y="69" width="24" height="3" rx="1.5" fill="var(--surface)" />
      <rect x="35" y="74" width="16" height="2.5" rx="1.25" fill="var(--stage-soft)" />
      <rect x="30" y="86" width="42" height="18" rx="4" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1.25" />
      <rect x="35" y="93.5" width="28" height="3" rx="1.5" fill="var(--stage-deep)" />
      <rect x="30" y="109" width="42" height="20" rx="4" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      <rect x="35" y="117.5" width="22" height="3" rx="1.5" fill="var(--border)" />

      {/* Columna 2: Row Group 02 (PODADO / SKIPPED por Zone Map) */}
      <rect
        x="93"
        y="38"
        width="54"
        height="100"
        rx="7"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <rect x="99" y="45" width="42" height="12" rx="3" fill="var(--stage-soft)" />
      <rect x="104" y="49.5" width="32" height="3" rx="1.5" fill="var(--border)" />
      <rect x="99" y="63" width="42" height="18" rx="4" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      <rect x="99" y="86" width="42" height="18" rx="4" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      <rect x="99" y="109" width="42" height="20" rx="4" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      {/* Marca geométrica de bloque descartado */}
      <circle cx="120" cy="95" r="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <path d="M115 90L125 100M125 90L115 100" stroke="var(--stage)" strokeWidth="1.75" strokeLinecap="round" />

      {/* Columna 3: Row Group 03 (Match de predicado · Vectorizado SIMD) */}
      <rect
        x="162"
        y="38"
        width="54"
        height="100"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="2.25"
      />
      <rect x="168" y="45" width="42" height="12" rx="3" fill="var(--stage-deep)" />
      <rect x="173" y="49.5" width="32" height="3" rx="1.5" fill="var(--surface)" />
      {/* Bloques activos seleccionados */}
      <rect x="168" y="63" width="42" height="18" rx="4" fill="var(--stage)" />
      <rect x="173" y="69" width="28" height="3" rx="1.5" fill="var(--surface)" />
      <rect x="173" y="74" width="18" height="2.5" rx="1.25" fill="var(--stage-soft)" />

      <rect x="168" y="86" width="42" height="18" rx="4" fill="var(--stage-deep)" />
      <rect x="173" y="92" width="30" height="3" rx="1.5" fill="var(--surface)" />
      <rect x="173" y="97" width="20" height="2.5" rx="1.25" fill="var(--stage-soft)" />

      <rect x="168" y="109" width="42" height="20" rx="4" fill="var(--stage)" />
      <rect x="173" y="116" width="26" height="3" rx="1.5" fill="var(--surface)" />
      <rect x="173" y="121" width="16" height="2.5" rx="1.25" fill="var(--stage-soft)" />

      {/* Indicadores de filtro en el borde derecho */}
      <circle cx="51" cy="38" r="3.5" fill="var(--stage)" />
      <circle cx="189" cy="38" r="4" fill="var(--stage-deep)" />
    </svg>
  );
}

/**
 * Etapa 4 · Turquesa: Capas horizontales estructuradas (arquitectura Lakehouse bronce / plata / oro + metadatos)
 */
export function Stage4Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Cabecera de Catálogo / Metadatos Transaccionales (Apache Iceberg Snapshot Tree) */}
      <rect
        x="68"
        y="16"
        width="104"
        height="22"
        rx="6"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.75"
      />
      <circle cx="80" cy="27" r="4" fill="var(--stage-deep)" />
      <rect x="89" y="25" width="48" height="4" rx="2" fill="var(--stage-deep)" />
      <rect x="143" y="23" width="22" height="8" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />

      {/* Punteros de catálogo a las capas */}
      <path d="M96 38L72 48M120 38V48M144 38L168 48" stroke="var(--stage-deep)" strokeWidth="1.5" />

      {/* Capa 1 Superior: ORO / Capa Semántica y Contratos ODCS */}
      <rect
        x="34"
        y="48"
        width="172"
        height="26"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="2"
      />
      <rect x="42" y="54" width="38" height="14" rx="4" fill="var(--stage-deep)" />
      <rect x="48" y="59.5" width="26" height="3" rx="1.5" fill="var(--surface)" />
      <rect x="88" y="55" width="34" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage-deep)" strokeWidth="1.25" />
      <rect x="128" y="55" width="34" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage-deep)" strokeWidth="1.25" />
      <rect x="168" y="55" width="30" height="12" rx="3" fill="var(--stage)" />

      {/* Conectores ascendentes Plata -> Oro */}
      <path d="M76 84V74M120 84V74M164 84V74" stroke="var(--stage-deep)" strokeWidth="1.75" />

      {/* Capa 2 Intermedia: PLATA / Transformación conformada (dbt / SQLMesh) */}
      <rect
        x="26"
        y="84"
        width="188"
        height="26"
        rx="7"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      <rect x="34" y="90" width="38" height="14" rx="4" fill="var(--stage)" />
      <rect x="40" y="95.5" width="26" height="3" rx="1.5" fill="var(--surface)" />
      <rect x="80" y="91" width="38" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1.25" />
      <rect x="124" y="91" width="38" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1.25" />
      <rect x="168" y="91" width="38" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1.25" />

      {/* Conectores ascendentes Bronce -> Plata */}
      <path d="M64 120V110M120 120V110M176 120V110" stroke="var(--stage)" strokeWidth="1.75" />

      {/* Capa 3 Base: BRONCE / Ingesta cruda particionada */}
      <rect
        x="18"
        y="120"
        width="204"
        height="24"
        rx="7"
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <rect x="26" y="126" width="38" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1" />
      <rect x="72" y="126" width="28" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      <rect x="106" y="126" width="28" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      <rect x="140" y="126" width="28" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
      <rect x="174" y="126" width="40" height="12" rx="3" fill="var(--stage-soft)" stroke="var(--border)" strokeWidth="1" />
    </svg>
  );
}

/**
 * Etapa 5 · Azul: Curva de distribución gaussiana / intervalos de confianza combinada con barras limpias (A/B testing + BI)
 */
export function Stage5Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* Panel izquierdo: Distribuciones A/B e Intervalo de Confianza */}
      <rect
        x="18"
        y="20"
        width="136"
        height="120"
        rx="9"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.5"
      />
      {/* Líneas guía minimalistas estilo Tufte */}
      <line x1="28" y1="118" x2="144" y2="118" stroke="var(--border)" strokeWidth="1.5" />
      <line x1="28" y1="62" x2="144" y2="62" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 3" />
      <line x1="28" y1="90" x2="144" y2="90" stroke="var(--border)" strokeWidth="0.75" strokeDasharray="2 3" />

      {/* Bigote de Intervalo de Confianza (95% CI) en la parte superior */}
      <line x1="64" y1="34" x2="116" y2="34" stroke="var(--stage-deep)" strokeWidth="2" />
      <line x1="64" y1="30" x2="64" y2="38" stroke="var(--stage-deep)" strokeWidth="2" />
      <line x1="116" y1="30" x2="116" y2="38" stroke="var(--stage-deep)" strokeWidth="2" />
      <circle cx="96" cy="34" r="3.5" fill="var(--stage)" stroke="var(--stage-deep)" strokeWidth="1.5" />

      {/* Curva Gaussiana Control (A) */}
      <path
        d="M30 118C44 118 52 60 72 60C92 60 100 118 114 118Z"
        fill="var(--stage-soft)"
      />
      <path
        d="M30 118C44 118 52 60 72 60C92 60 100 118 114 118"
        stroke="var(--stage)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="72" y1="54" x2="72" y2="118" stroke="var(--stage)" strokeWidth="1.25" strokeDasharray="3 2" />

      {/* Curva Gaussiana Tratamiento con reducción de varianza CUPED (B) */}
      <path
        d="M62 118C76 118 84 44 102 44C120 44 128 118 142 118"
        stroke="var(--stage-deep)"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <line x1="102" y1="40" x2="102" y2="118" stroke="var(--stage-deep)" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="72" cy="60" r="3" fill="var(--stage)" />
      <circle cx="102" cy="44" r="3.5" fill="var(--stage-deep)" />

      {/* Panel derecho: Barras limpias BI / Árbol de métricas */}
      <rect
        x="162"
        y="20"
        width="60"
        height="120"
        rx="9"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.5"
      />
      <rect x="170" y="30" width="28" height="4" rx="2" fill="var(--stage-deep)" />
      <rect x="170" y="38" width="42" height="3" rx="1.5" fill="var(--border)" />

      {/* Barras verticales comparativas con horquilla de error */}
      <rect x="172" y="86" width="12" height="36" rx="3" fill="var(--stage-soft)" stroke="var(--stage)" strokeWidth="1.25" />
      <rect x="188" y="68" width="12" height="54" rx="3" fill="var(--stage)" />
      <rect x="204" y="52" width="10" height="70" rx="3" fill="var(--stage-deep)" />
      <line x1="168" y1="122" x2="218" y2="122" stroke="var(--border)" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Etapa 6 · Violeta: Flujo continuo de eventos entrando a un nodo gobernado con destello geométrico (Streaming + MCP)
 */
export function Stage6Illustration({ className = 'ui-illustration-svg' }) {
  return (
    <svg viewBox="0 0 240 160" fill="none" className={className} aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="224"
        height="144"
        rx="14"
        fill="var(--stage-soft)"
        stroke="var(--border)"
        strokeWidth="1.25"
      />

      {/* 3 Carriles de Streaming CDC / Kafka / Flink a la izquierda */}
      <path
        d="M20 46H104L126 68M20 80H122M20 114H104L126 92"
        stroke="var(--stage)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Paquetes de eventos en el flujo continuo */}
      <rect x="24" y="40" width="22" height="12" rx="4" fill="var(--surface)" stroke="var(--stage)" strokeWidth="1.5" />
      <rect x="56" y="40" width="26" height="12" rx="4" fill="var(--stage)" />
      <rect x="34" y="74" width="26" height="12" rx="4" fill="var(--stage-deep)" />
      <rect x="68" y="74" width="22" height="12" rx="4" fill="var(--surface)" stroke="var(--stage-deep)" strokeWidth="1.5" />
      <rect x="26" y="108" width="24" height="12" rx="4" fill="var(--stage)" />
      <rect x="58" y="108" width="24" height="12" rx="4" fill="var(--surface)" stroke="var(--stage)" strokeWidth="1.5" />

      {/* Línea vertical de Watermark de ventana temporal (Apache Flink) */}
      <line
        x1="96"
        y1="24"
        x2="96"
        y2="136"
        stroke="var(--stage-deep)"
        strokeWidth="1.75"
        strokeDasharray="4 3"
      />
      <rect x="84" y="18" width="24" height="10" rx="3" fill="var(--stage-deep)" />

      {/* Nodo central gobernado (Servidor MCP / Orquestador semántico) */}
      <circle
        cx="148"
        cy="80"
        r="34"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <polygon
        points="148,50 174,65 174,95 148,110 122,95 122,65"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      {/* Destello geométrico técnico en el núcleo MCP */}
      <path
        d="M148 60L153 75L168 80L153 85L148 100L143 85L128 80L143 75L148 60Z"
        fill="var(--stage)"
        stroke="var(--stage-deep)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="148" cy="80" r="4" fill="var(--surface)" />

      {/* Puertos gobernados de salida hacia herramientas / consultas */}
      <path d="M174 68H198M174 92H198" stroke="var(--stage-deep)" strokeWidth="2" strokeLinecap="round" />
      <rect
        x="198"
        y="56"
        width="24"
        height="22"
        rx="5"
        fill="var(--surface)"
        stroke="var(--stage-deep)"
        strokeWidth="1.75"
      />
      <rect x="204" y="63" width="12" height="3" rx="1.5" fill="var(--stage)" />
      <rect x="204" y="69" width="8" height="3" rx="1.5" fill="var(--stage-deep)" />

      <rect
        x="198"
        y="82"
        width="24"
        height="22"
        rx="5"
        fill="var(--surface)"
        stroke="var(--stage)"
        strokeWidth="1.75"
      />
      <rect x="204" y="89" width="12" height="3" rx="1.5" fill="var(--stage-deep)" />
      <rect x="204" y="95" width="8" height="3" rx="1.5" fill="var(--stage)" />
    </svg>
  );
}

export const STAGE_ILLUSTRATIONS = {
  1: Stage1Illustration,
  2: Stage2Illustration,
  3: Stage3Illustration,
  4: Stage4Illustration,
  5: Stage5Illustration,
  6: Stage6Illustration,
  'stage-1': Stage1Illustration,
  'stage-2': Stage2Illustration,
  'stage-3': Stage3Illustration,
  'stage-4': Stage4Illustration,
  'stage-5': Stage5Illustration,
  'stage-6': Stage6Illustration,
};

export default STAGE_ILLUSTRATIONS;
