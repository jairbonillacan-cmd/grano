#!/usr/bin/env node
/**
 * scripts/check-contrast.mjs
 * Verifica el contraste WCAG 2.x (luminancia relativa sRGB) de los pares
 * de color definidos en src/styles/tokens.css para los temas claro y oscuro.
 * Sale con código 1 si algún par no alcanza el mínimo exigido:
 * - >= 4.5:1 para pares de texto normal
 * - >= 3.0:1 para bordes de controles (--line-control) y marcadores gráficos (1.4.11)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(__dirname, '../src/styles/tokens.css');

function parseThemeTokens(cssContent) {
  const mainSection = cssContent.split('/* ALIAS TEMPORALES')[0] || cssContent;

  const lightMatch = mainSection.match(/:root,\s*\[data-theme="light"\]\s*\{([\s\S]*?)\}/);
  const darkMatch = mainSection.match(/\[data-theme="dark"\]\s*\{([\s\S]*?)\}/);

  if (!lightMatch || !darkMatch) {
    throw new Error('No se encontraron los bloques de tema claro y oscuro en src/styles/tokens.css');
  }

  const extractVars = (block) => {
    const map = {};
    const re = /(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g;
    let m;
    while ((m = re.exec(block)) !== null) {
      map[m[1]] = m[2].toUpperCase();
    }
    return map;
  };

  return {
    light: extractVars(lightMatch[1]),
    dark: extractVars(darkMatch[1]),
  };
}

export function srgbRelativeLuminance(hex) {
  const clean = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Color hexadecimal inválido: ${hex}`);
  }
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(hex1, hex2) {
  const l1 = srgbRelativeLuminance(hex1);
  const l2 = srgbRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const PAIR_SPEC = [
  // Texto principal (mínimo 4.5:1)
  { fg: '--ink', bg: '--bg', min: 4.5, use: 'Texto principal sobre fondo de app' },
  { fg: '--ink', bg: '--surface', min: 4.5, use: 'Texto principal sobre tarjeta/panel' },
  { fg: '--ink', bg: '--sunken', min: 4.5, use: 'Texto principal sobre bloque hundido y código inline' },
  { fg: '--ink', bg: '--brand-soft', min: 4.5, use: 'Texto principal sobre selección y paso activo' },

  // Texto secundario (mínimo 4.5:1)
  { fg: '--ink-2', bg: '--bg', min: 4.5, use: 'Texto secundario sobre fondo de app' },
  { fg: '--ink-2', bg: '--surface', min: 4.5, use: 'Texto secundario sobre tarjeta/panel' },
  { fg: '--ink-2', bg: '--sunken', min: 4.5, use: 'Texto secundario sobre bloque hundido' },

  // Metadatos y texto guía (mínimo 4.5:1)
  { fg: '--ink-3', bg: '--bg', min: 4.5, use: 'Metadatos sobre fondo de app' },
  { fg: '--ink-3', bg: '--surface', min: 4.5, use: 'Metadatos y texto guía sobre superficie' },

  // Botón primario (mínimo 4.5:1)
  { fg: '--surface', bg: '--ink', min: 4.5, use: 'Texto de botón primario sobre fondo --ink' },

  // Acento de marca (mínimo 4.5:1)
  { fg: '--brand', bg: '--surface', min: 4.5, use: 'Acento de marca y enlace activo sobre superficie' },
  { fg: '--brand', bg: '--bg', min: 4.5, use: 'Acento de marca sobre fondo de app' },
  { fg: '--brand', bg: '--brand-soft', min: 4.5, use: 'Acento de marca sobre fondo de selección' },

  // Estados semánticos (mínimo 4.5:1)
  { fg: '--ok', bg: '--surface', min: 4.5, use: 'Estado correcto sobre superficie' },
  { fg: '--bad', bg: '--surface', min: 4.5, use: 'Estado de error sobre superficie' },
  { fg: '--warn', bg: '--surface', min: 4.5, use: 'Estado de aviso sobre superficie' },

  // Marcadores de área (mínimo 3.0:1, WCAG 1.4.11)
  { fg: '--track-de', bg: '--surface', min: 3.0, use: 'Marcador Ingeniería de Datos sobre superficie' },
  { fg: '--track-da', bg: '--surface', min: 3.0, use: 'Marcador Análisis de Datos sobre superficie' },
  { fg: '--track-bi', bg: '--surface', min: 3.0, use: 'Marcador Business Intelligence sobre superficie' },

  // Bordes de controles e inputs (mínimo 3.0:1, WCAG 1.4.11)
  { fg: '--line-control', bg: '--surface', min: 3.0, use: 'Borde de control y botón secundario sobre superficie' },
  { fg: '--line-control', bg: '--bg', min: 3.0, use: 'Borde de control sobre fondo de app' },
];

function buildPairs(themes) {
  const pairs = [];
  for (const themeName of ['light', 'dark']) {
    const palette = themes[themeName];
    for (const spec of PAIR_SPEC) {
      pairs.push({
        theme: themeName,
        fgToken: spec.fg,
        bgToken: spec.bg,
        fgHex: palette[spec.fg],
        bgHex: palette[spec.bg],
        min: spec.min,
        use: spec.use,
      });
    }
  }
  return pairs;
}

function main() {
  const cssContent = fs.readFileSync(TOKENS_PATH, 'utf8');
  const themes = parseThemeTokens(cssContent);
  const pairs = buildPairs(themes);

  let failures = 0;

  console.log('Verificación de contraste WCAG 2.x — Grano (src/styles/tokens.css)');
  console.log('----------------------------------------------------------------------------------------------------');
  console.log(
    [
      'Tema'.padEnd(6),
      'Par (fg / bg)'.padEnd(28),
      'Hex (fg / bg)'.padEnd(19),
      'Ratio'.padEnd(9),
      'Mínimo'.padEnd(8),
      'Estado'.padEnd(6),
      'Uso',
    ].join(' | ')
  );
  console.log('----------------------------------------------------------------------------------------------------');

  for (const p of pairs) {
    if (!p.fgHex || !p.bgHex) {
      failures += 1;
      console.error(`FAIL | Falta token en ${p.theme}: ${p.fgToken} (${p.fgHex}) o ${p.bgToken} (${p.bgHex})`);
      continue;
    }
    const ratio = contrastRatio(p.fgHex, p.bgHex);
    const passed = ratio >= p.min;
    if (!passed) failures += 1;

    const status = passed ? 'OK' : 'FAIL';
    console.log(
      [
        p.theme.padEnd(6),
        `${p.fgToken} / ${p.bgToken}`.padEnd(28),
        `${p.fgHex} / ${p.bgHex}`.padEnd(19),
        `${ratio.toFixed(2)}:1`.padEnd(9),
        `${p.min.toFixed(1)}:1`.padEnd(8),
        status.padEnd(6),
        p.use,
      ].join(' | ')
    );
  }

  console.log('----------------------------------------------------------------------------------------------------');
  if (failures > 0) {
    console.error(`ERROR: ${failures} de ${pairs.length} pares incumplen el contraste mínimo WCAG 2.x.`);
    process.exit(1);
  }

  console.log(`OK — ${pairs.length}/${pairs.length} pares cumplen WCAG 2.x (${pairs.length / 2} claro + ${pairs.length / 2} oscuro).`);
}

main();
