import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

export const DEFAULT_CACHE_DIR = path.join(PROJECT_ROOT, '.cache', 'ai');
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
export const CACHEABLE_MODES = new Set(['explain-section', 'glossary']);

/**
 * Determina si una consulta puede almacenarse en caché.
 * Solo se cachean modos deterministas sin datos personales (`explain-section`, `glossary`).
 * Nunca se cachea chat libre (`tutor`), errores propios (`explain-error`), SQL del alumno (`review-sql`),
 * ni modos con selección, código o historial de conversación.
 */
export function isCacheableRequest({
  mode,
  selection,
  code,
  result,
  messages,
} = {}) {
  if (!CACHEABLE_MODES.has(mode)) {
    return false;
  }
  if (selection && String(selection).trim().length > 0) {
    return false;
  }
  if (code && String(code).trim().length > 0) {
    return false;
  }
  if (result && (typeof result === 'string' ? result.trim().length > 0 : true)) {
    return false;
  }
  if (Array.isArray(messages) && messages.length > 1) {
    return false;
  }
  return true;
}

/**
 * Calcula la clave SHA-256 canónica a partir de:
 * modo + lessonId + sectionId + modelo + contentVersion (+ term opcional en glosario).
 */
export function buildCacheKey({
  mode = '',
  lessonId = '',
  sectionId = '',
  model = '',
  contentVersion = 1,
  term = '',
} = {}) {
  const canonical = [
    String(mode).trim(),
    String(lessonId).trim(),
    String(sectionId).trim(),
    String(model).trim(),
    String(contentVersion ?? 1).trim(),
    String(term).trim(),
  ].join('|');

  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Obtiene una respuesta cacheada si existe y no ha expirado (TTL 30 días).
 */
export function getCachedResponse(
  params,
  { cacheDir = DEFAULT_CACHE_DIR, now = Date.now(), ttlMs = CACHE_TTL_MS } = {}
) {
  if (!isCacheableRequest(params)) {
    return null;
  }

  const key = buildCacheKey(params);
  const filePath = path.join(cacheDir, `${key}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const entry = JSON.parse(raw);

    if (!entry || typeof entry.response !== 'string') {
      return null;
    }

    const createdAt = Number(entry.createdAt) || 0;
    const expiresAt = Number(entry.expiresAt) || createdAt + ttlMs;
    if (now > expiresAt) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
      return null;
    }

    return {
      key,
      response: entry.response,
      model: entry.model,
      createdAt,
      expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Guarda en `.cache/ai/<sha256>.json` una respuesta de modo cacheable.
 */
export function setCachedResponse(
  params,
  responseText,
  { cacheDir = DEFAULT_CACHE_DIR, now = Date.now(), ttlMs = CACHE_TTL_MS } = {}
) {
  if (!isCacheableRequest(params)) {
    return null;
  }
  if (typeof responseText !== 'string' || responseText.trim().length === 0) {
    return null;
  }

  const key = buildCacheKey(params);
  const filePath = path.join(cacheDir, `${key}.json`);

  const payload = {
    key,
    mode: params.mode,
    lessonId: params.lessonId || '',
    sectionId: params.sectionId ?? '',
    model: params.model || '',
    contentVersion: params.contentVersion ?? 1,
    createdAt: now,
    expiresAt: now + ttlMs,
    response: responseText,
  };

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return key;
  } catch {
    return null;
  }
}
