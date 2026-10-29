import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  DATASET_SCHEMA_PATH,
  MERCADO_BRISA_SCHEMA_SUMMARY,
  buildSchemaSummary,
} from './contextBuilder.js';

const schema = JSON.parse(fs.readFileSync(DATASET_SCHEMA_PATH, 'utf8'));
const ROOT = path.resolve(path.dirname(DATASET_SCHEMA_PATH), '..', '..');

// Columnas que el tutor llegó a inventar porque el resumen se escribía a mano.
const INVENTED_COLUMNS = ['order_total_usd', 'shipping_fee_usd', 'item_price_usd', 'refund_usd'];

describe('Esquema de Mercado Brisa que recibe el tutor (server/ai/contextBuilder.js)', () => {
  it('1. el resumen incluye cada tabla y cada columna real de schema.json', () => {
    for (const table of schema.tables) {
      expect(MERCADO_BRISA_SCHEMA_SUMMARY).toContain(`${table.name} [`);
      for (const col of table.columns) {
        expect(MERCADO_BRISA_SCHEMA_SUMMARY).toContain(`${col.name} ${col.type}`);
      }
    }
  });

  it('2. el resumen no menciona columnas inventadas', () => {
    for (const col of INVENTED_COLUMNS) {
      expect(MERCADO_BRISA_SCHEMA_SUMMARY).not.toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it('3. sin schema.json devuelve un aviso en lugar de columnas inventadas', () => {
    const fallback = buildSchemaSummary(path.join(ROOT, 'no-existe.json'));
    expect(fallback).toContain('no inventes nombres de columna');
  });

  it('4. la interfaz y los mocks del tutor no usan columnas inventadas', () => {
    const files = [
      'src/components/TutorPanel.jsx',
      'src/components/LessonVisualizers.jsx',
      'server/ai/agyRunner.js',
    ];
    for (const rel of files) {
      const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      for (const col of INVENTED_COLUMNS) {
        expect(text, `${rel} usa ${col}`).not.toMatch(new RegExp(`\\b${col}\\b`));
      }
    }
  });
});
