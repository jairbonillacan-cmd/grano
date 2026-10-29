import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAiRoutes, injectSessionMeta } from './ai/routes.js';
import { fetchAgyModels } from './ai/agyRunner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_DIST_DIR = path.join(PROJECT_ROOT, 'dist');

/**
 * Carga variables desde `.env.local` y `.env` sin sobrescribir `process.env` existente.
 */
function loadLocalEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const filePath = path.join(PROJECT_ROOT, name);
    if (!fs.existsSync(filePath)) continue;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    } catch {}
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.parquet': 'application/octet-stream',
};

function setStaticHeaders(res, contentType, isImmutableAsset = false) {
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Cache-Control',
    isImmutableAsset ? 'public, max-age=31536000, immutable' : 'no-cache'
  );
}

/**
 * Crea el servidor HTTP de producción (`node:http`, sin Express) que sirve `dist/`
 * inyectando `<meta name="grano-session">` en `index.html` y monta `/api/ai/*`.
 */
export function createGranoServer({
  distDir = DEFAULT_DIST_DIR,
  aiOptions = {},
} = {}) {
  const aiMiddleware = createAiRoutes(aiOptions);
  const resolvedDist = path.resolve(distDir);

  const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    const pathname = rawUrl.split('?')[0];

    // 1. Rutas del puente IA (/api/ai/*)
    if (pathname.startsWith('/api/ai/')) {
      const handled = aiMiddleware(req, res);
      if (handled) return;
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Endpoint de IA no encontrado.' }));
      return;
    }

    // 2. Archivos estáticos de dist/ (solo GET y HEAD)
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Method Not Allowed');
      return;
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(pathname);
    } catch {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    const relativeTarget = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
    const candidatePath = path.resolve(resolvedDist, relativeTarget);

    // Prevenir path traversal fuera de dist/
    if (
      candidatePath !== resolvedDist &&
      !candidatePath.startsWith(resolvedDist + path.sep)
    ) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    const serveIndexHtml = () => {
      const indexPath = path.join(resolvedDist, 'index.html');
      if (!fs.existsSync(indexPath)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Compilación no encontrada en dist/. Ejecuta `npm run build` primero.');
        return;
      }
      const rawHtml = fs.readFileSync(indexPath, 'utf8');
      const injected = injectSessionMeta(rawHtml, aiMiddleware.getSessionToken());
      setStaticHeaders(res, MIME_TYPES['.html'], false);
      res.statusCode = 200;
      if (req.method === 'HEAD') {
        res.end();
      } else {
        res.end(injected, 'utf8');
      }
    };

    if (relativeTarget === 'index.html') {
      serveIndexHtml();
      return;
    }

    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      const ext = path.extname(candidatePath).toLowerCase();
      if (ext === '.html') {
        const rawHtml = fs.readFileSync(candidatePath, 'utf8');
        const injected = injectSessionMeta(rawHtml, aiMiddleware.getSessionToken());
        setStaticHeaders(res, MIME_TYPES['.html'], false);
        res.statusCode = 200;
        res.end(req.method === 'HEAD' ? undefined : injected);
        return;
      }

      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const isImmutable = relativeTarget.startsWith('assets/');
      setStaticHeaders(res, contentType, isImmutable);
      res.statusCode = 200;

      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      const stream = fs.createReadStream(candidatePath);
      stream.on('error', () => {
        if (!res.headersSent) {
          res.statusCode = 500;
        }
        res.end();
      });
      stream.pipe(res);
      return;
    }

    // Fallback SPA para rutas sin extensión de archivo
    if (!path.extname(relativeTarget)) {
      serveIndexHtml();
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found');
  });

  server.getSessionToken = aiMiddleware.getSessionToken;
  return server;
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  loadLocalEnvFiles();
  const port = Number(process.env.PORT) || 4173;
  const host = '127.0.0.1';
  const server = createGranoServer();

  fetchAgyModels().catch(() => {});

  server.listen(port, host, () => {
    console.log(`Grano escuchando en http://${host}:${port}`);
  });
}
