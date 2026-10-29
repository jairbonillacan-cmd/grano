export const MERCADO_BRISA_TABLES = [
  {
    name: 'customers',
    rowCount: 2400,
    grain: '1 fila = 1 cliente actual (snapshot)',
    columns: [
      { name: 'customer_id', type: 'INTEGER' },
      { name: 'full_name', type: 'VARCHAR' },
      { name: 'email', type: 'VARCHAR' },
      { name: 'country_code', type: 'VARCHAR' },
      { name: 'city', type: 'VARCHAR' },
      { name: 'postal_code', type: 'VARCHAR' },
      { name: 'segment', type: 'VARCHAR' },
      { name: 'acquisition_channel', type: 'VARCHAR' },
      { name: 'signup_date', type: 'DATE' },
      { name: 'is_active', type: 'BOOLEAN' },
      { name: 'current_tier', type: 'VARCHAR' },
    ],
  },
  {
    name: 'customer_changes',
    rowCount: 4100,
    grain: '1 fila = 1 versión histórica SCD2 de cliente (valid_from, valid_to, is_current)',
    columns: [
      { name: 'change_id', type: 'INTEGER' },
      { name: 'customer_id', type: 'INTEGER' },
      { name: 'country_code', type: 'VARCHAR' },
      { name: 'segment', type: 'VARCHAR' },
      { name: 'tier', type: 'VARCHAR' },
      { name: 'valid_from', type: 'TIMESTAMP' },
      { name: 'valid_to', type: 'TIMESTAMP' },
      { name: 'is_current', type: 'BOOLEAN' },
    ],
  },
  {
    name: 'products',
    rowCount: 180,
    grain: '1 fila = 1 SKU con categoría, coste y precio de lista',
    columns: [
      { name: 'product_id', type: 'INTEGER' },
      { name: 'sku', type: 'VARCHAR' },
      { name: 'product_name', type: 'VARCHAR' },
      { name: 'category', type: 'VARCHAR' },
      { name: 'subcategory', type: 'VARCHAR' },
      { name: 'brand', type: 'VARCHAR' },
      { name: 'unit_cost_usd', type: 'DOUBLE' },
      { name: 'list_price_usd', type: 'DOUBLE' },
      { name: 'is_active', type: 'BOOLEAN' },
      { name: 'launch_date', type: 'DATE' },
    ],
  },
  {
    name: 'orders',
    rowCount: 18000,
    grain: '1 fila = 1 pedido con customer_id, order_ts, status, store_id',
    columns: [
      { name: 'order_id', type: 'INTEGER' },
      { name: 'customer_id', type: 'INTEGER' },
      { name: 'store_id', type: 'INTEGER' },
      { name: 'order_ts', type: 'TIMESTAMP' },
      { name: 'order_date', type: 'DATE' },
      { name: 'status', type: 'VARCHAR' },
      { name: 'currency', type: 'VARCHAR' },
      { name: 'subtotal_usd', type: 'DOUBLE' },
      { name: 'discount_usd', type: 'DOUBLE' },
      { name: 'shipping_usd', type: 'DOUBLE' },
      { name: 'tax_usd', type: 'DOUBLE' },
      { name: 'total_usd', type: 'DOUBLE' },
      { name: 'campaign_id', type: 'VARCHAR' },
      { name: 'device_type', type: 'VARCHAR' },
    ],
  },
  {
    name: 'order_items',
    rowCount: 42000,
    grain: '1 fila = 1 línea de pedido (order_id, product_id, qty, unit_price_usd, discount_usd)',
    columns: [
      { name: 'order_item_id', type: 'INTEGER' },
      { name: 'order_id', type: 'INTEGER' },
      { name: 'line_number', type: 'INTEGER' },
      { name: 'product_id', type: 'INTEGER' },
      { name: 'qty', type: 'INTEGER' },
      { name: 'unit_price_usd', type: 'DOUBLE' },
      { name: 'discount_usd', type: 'DOUBLE' },
      { name: 'line_total_usd', type: 'DOUBLE' },
    ],
  },
  {
    name: 'payments',
    rowCount: 19200,
    grain: '1 fila = 1 intento de cobro (incluye reintentos fallidos y duplicados)',
    columns: [
      { name: 'payment_id', type: 'INTEGER' },
      { name: 'order_id', type: 'INTEGER' },
      { name: 'attempt_number', type: 'INTEGER' },
      { name: 'payment_method', type: 'VARCHAR' },
      { name: 'provider', type: 'VARCHAR' },
      { name: 'status', type: 'VARCHAR' },
      { name: 'amount_usd', type: 'DOUBLE' },
      { name: 'payment_ts', type: 'TIMESTAMP' },
      { name: 'idempotency_key', type: 'VARCHAR' },
    ],
  },
  {
    name: 'refunds',
    rowCount: 1450,
    grain: '1 fila = 1 devolución parcial o total asociada a order_id',
    columns: [
      { name: 'refund_id', type: 'INTEGER' },
      { name: 'order_id', type: 'INTEGER' },
      { name: 'refund_ts', type: 'TIMESTAMP' },
      { name: 'refund_date', type: 'DATE' },
      { name: 'reason', type: 'VARCHAR' },
      { name: 'refund_amount_usd', type: 'DOUBLE' },
      { name: 'status', type: 'VARCHAR' },
    ],
  },
  {
    name: 'events',
    rowCount: 65000,
    grain: '1 fila = 1 evento web/app (session_id, user_id, event_type, event_ts, payload_json)',
    columns: [
      { name: 'event_id', type: 'VARCHAR' },
      { name: 'session_id', type: 'VARCHAR' },
      { name: 'customer_id', type: 'INTEGER' },
      { name: 'user_id', type: 'INTEGER' },
      { name: 'event_type', type: 'VARCHAR' },
      { name: 'event_ts', type: 'TIMESTAMP' },
      { name: 'event_ts_raw', type: 'VARCHAR' },
      { name: 'timezone_offset', type: 'VARCHAR' },
      { name: 'device_type', type: 'VARCHAR' },
      { name: 'campaign_id', type: 'VARCHAR' },
      { name: 'product_id', type: 'INTEGER' },
      { name: 'payload_json', type: 'VARCHAR' },
    ],
  },
  {
    name: 'marketing_spend',
    rowCount: 730,
    grain: '1 fila = 1 día × canal con gasto e impresiones',
    columns: [
      { name: 'spend_date', type: 'DATE' },
      { name: 'channel', type: 'VARCHAR' },
      { name: 'campaign_id', type: 'VARCHAR' },
      { name: 'region', type: 'VARCHAR' },
      { name: 'spend_usd', type: 'DOUBLE' },
      { name: 'impressions', type: 'INTEGER' },
      { name: 'clicks', type: 'INTEGER' },
      { name: 'attributed_conversions', type: 'INTEGER' },
    ],
  },
  {
    name: 'experiments',
    rowCount: 6,
    grain: '1 fila = 1 experimento A/B con fechas e hipótesis',
    columns: [
      { name: 'experiment_id', type: 'INTEGER' },
      { name: 'experiment_code', type: 'VARCHAR' },
      { name: 'experiment_name', type: 'VARCHAR' },
      { name: 'hypothesis', type: 'VARCHAR' },
      { name: 'primary_metric', type: 'VARCHAR' },
      { name: 'start_date', type: 'DATE' },
      { name: 'end_date', type: 'DATE' },
      { name: 'status', type: 'VARCHAR' },
      { name: 'target_sample_size', type: 'INTEGER' },
      { name: 'srm_p_value', type: 'DOUBLE' },
    ],
  },
  {
    name: 'experiment_assignments',
    rowCount: 9600,
    grain: '1 fila = 1 usuario asignado a variante (control / treatment)',
    columns: [
      { name: 'assignment_id', type: 'INTEGER' },
      { name: 'experiment_id', type: 'INTEGER' },
      { name: 'customer_id', type: 'INTEGER' },
      { name: 'variant', type: 'VARCHAR' },
      { name: 'assigned_ts', type: 'TIMESTAMP' },
      { name: 'pre_experiment_spend_usd', type: 'DOUBLE' },
      { name: 'post_experiment_spend_usd', type: 'DOUBLE' },
      { name: 'converted', type: 'BOOLEAN' },
    ],
  },
  {
    name: 'stores',
    rowCount: 14,
    grain: '1 fila = 1 tienda física o almacén logístico regional',
    columns: [
      { name: 'store_id', type: 'INTEGER' },
      { name: 'store_code', type: 'VARCHAR' },
      { name: 'store_name', type: 'VARCHAR' },
      { name: 'store_type', type: 'VARCHAR' },
      { name: 'country_code', type: 'VARCHAR' },
      { name: 'region', type: 'VARCHAR' },
      { name: 'city', type: 'VARCHAR' },
      { name: 'opened_date', type: 'DATE' },
      { name: 'monthly_target_usd', type: 'DOUBLE' },
      { name: 'area_sqm', type: 'INTEGER' },
    ],
  },
  {
    name: 'calendar',
    rowCount: 1095,
    grain: '1 fila = 1 día natural con festivos, trimestre fiscal y semana ISO',
    columns: [
      { name: 'calendar_date', type: 'DATE' },
      { name: 'year', type: 'INTEGER' },
      { name: 'quarter', type: 'INTEGER' },
      { name: 'fiscal_quarter', type: 'VARCHAR' },
      { name: 'month', type: 'INTEGER' },
      { name: 'month_name', type: 'VARCHAR' },
      { name: 'iso_week', type: 'INTEGER' },
      { name: 'day_of_week', type: 'INTEGER' },
      { name: 'day_name', type: 'VARCHAR' },
      { name: 'is_weekend', type: 'BOOLEAN' },
      { name: 'is_holiday', type: 'BOOLEAN' },
      { name: 'holiday_name', type: 'VARCHAR' },
      { name: 'season', type: 'VARCHAR' },
    ],
  },
];

export function buildCodeMirrorSchema() {
  const schema = {};
  for (const table of MERCADO_BRISA_TABLES) {
    schema[table.name] = table.columns.map((c) => c.name);
  }
  return schema;
}

let dbInstancePromise = null;
let dbReadyState = {
  status: 'idle', // 'idle' | 'loading' | 'ready' | 'error'
  startedAt: 0,
  readyAt: 0,
  coldInitMs: 0,
  error: null,
};

const listeners = new Set();

function notifyListeners() {
  for (const fn of listeners) {
    try {
      fn({ ...dbReadyState });
    } catch {
      // ignore listener errors
    }
  }
}

export function subscribeDuckDBState(listener) {
  listeners.add(listener);
  listener({ ...dbReadyState });
  return () => listeners.delete(listener);
}

export function getDuckDBState() {
  return { ...dbReadyState };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatUtcDate(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function formatUtcTimestamp(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return String(ms);
  const datePart = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  const timePart = `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
  return timePart === '00:00:00' ? `${datePart} 00:00:00` : `${datePart} ${timePart}`;
}

function normalizeArrowValue(val, fieldTypeStr = '') {
  if (val === null || val === undefined) return null;
  const typeUpper = String(fieldTypeStr).toUpperCase();

  if (typeof val === 'bigint') {
    const asNum = Number(val);
    return Number.isSafeInteger(asNum) ? asNum : String(val);
  }

  if (val instanceof Date) {
    if (typeUpper.includes('DATE') && !typeUpper.includes('TIME')) {
      return formatUtcDate(val.getTime());
    }
    return formatUtcTimestamp(val.getTime());
  }

  if (typeof val === 'number') {
    if (typeUpper.startsWith('DATE')) {
      // Arrow Date32 (days) or Date64 (ms)
      const ms = Math.abs(val) < 1000000 ? val * 86400000 : val;
      return formatUtcDate(ms);
    }
    if (typeUpper.startsWith('TIMESTAMP')) {
      return formatUtcTimestamp(val);
    }
    return val;
  }

  if (typeof val === 'boolean' || typeof val === 'string') {
    return val;
  }

  if (ArrayBuffer.isView(val)) {
    // Decimal or HugeInt typed array in Arrow
    if (val instanceof Int32Array || val instanceof Uint32Array) {
      if (val.length === 4 && typeof val.toString === 'function') {
        // Reconstruct signed 128-bit integer for HUGEINT/DECIMAL if needed
        const b0 = BigInt(val[0] >>> 0);
        const b1 = BigInt(val[1] >>> 0) << 32n;
        const b2 = BigInt(val[2] >>> 0) << 64n;
        const b3 = BigInt(val[3] >>> 0) << 96n;
        let combined = b0 | b1 | b2 | b3;
        if (combined >= 1n << 127n) {
          combined -= 1n << 128n;
        }
        const scaleMatch = typeUpper.match(/DECIMAL\s*\(\s*\d+\s*,\s*(\d+)\s*\)/i);
        if (scaleMatch) {
          const scale = Number(scaleMatch[1]);
          return Number(combined) / Math.pow(10, scale);
        }
        return Number(combined);
      }
    }
    return String(val);
  }

  if (typeof val === 'object') {
    if (typeof val.toJSON === 'function') {
      return val.toJSON();
    }
    return String(val);
  }

  return val;
}

async function initBrowserDuckDB() {
  const [
    duckdb,
    mvpWasmModule,
    mvpWorkerModule,
    ehWasmModule,
    ehWorkerModule,
  ] = await Promise.all([
    import('@duckdb/duckdb-wasm'),
    import('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'),
    import('@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'),
    import('@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'),
    import('@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'),
  ]);

  const MANUAL_BUNDLES = {
    mvp: {
      mainModule: mvpWasmModule.default,
      mainWorker: mvpWorkerModule.default,
    },
    eh: {
      mainModule: ehWasmModule.default,
      mainWorker: ehWorkerModule.default,
    },
  };

  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
  const worker = new Worker(bundle.mainWorker);
  const logger = new duckdb.VoidLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const conn = await db.connect();

  // Fetch and register the 13 Parquet tables of Mercado Brisa into the main schema
  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL.replace(/\/$/, '')
      : '';

  await Promise.all(
    MERCADO_BRISA_TABLES.map(async (table) => {
      const fileName = `${table.name}.parquet`;
      const url = `${baseUrl}/datasets/${fileName}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`No se pudo cargar ${url} (HTTP ${res.status})`);
      }
      const buffer = new Uint8Array(await res.arrayBuffer());
      await db.registerFileBuffer(fileName, buffer);
    })
  );

  for (const table of MERCADO_BRISA_TABLES) {
    const fileName = `${table.name}.parquet`;
    await conn.query(`CREATE OR REPLACE VIEW ${table.name} AS SELECT * FROM read_parquet('${fileName}');`);
  }

  return { db, conn };
}

export async function ensureDuckDB() {
  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
  dbReadyState = {
    status: 'loading',
    startedAt,
    readyAt: 0,
    coldInitMs: 0,
    error: null,
  };
  notifyListeners();

  dbInstancePromise = initBrowserDuckDB()
    .then((handle) => {
      const readyAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      dbReadyState = {
        status: 'ready',
        startedAt,
        readyAt,
        coldInitMs: Math.round(readyAt - startedAt),
        error: null,
      };
      notifyListeners();
      return handle;
    })
    .catch((err) => {
      dbInstancePromise = null;
      dbReadyState = {
        status: 'error',
        startedAt,
        readyAt: 0,
        coldInitMs: 0,
        error: err?.message || String(err),
      };
      notifyListeners();
      throw err;
    });

  return dbInstancePromise;
}

export async function runSqlQuery(sqlText, options = {}) {
  const { maxRows = 200 } = options;
  const trimmed = String(sqlText || '').trim();
  if (!trimmed) {
    throw new Error('Escribe una consulta SQL antes de ejecutar.');
  }

  const { conn } = await ensureDuckDB();
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const arrowTable = await conn.query(trimmed);
  const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const elapsedMs = Math.max(1, Math.round((t1 - t0) * 10) / 10);

  const fields = arrowTable?.schema?.fields || [];
  const columns = fields.map((f) => ({
    name: f.name,
    type: String(f.type),
  }));

  const rawRows = arrowTable.toArray();
  const totalRows = rawRows.length;
  const limit = maxRows ? Math.min(totalRows, maxRows) : totalRows;

  const allNormalizedRows = [];
  for (let i = 0; i < totalRows; i++) {
    const rowObj = rawRows[i];
    const normalizedRow = {};
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      normalizedRow[col.name] = normalizeArrowValue(rowObj[col.name], col.type);
    }
    allNormalizedRows.push(normalizedRow);
  }

  return {
    columns,
    rows: allNormalizedRows.slice(0, limit),
    allRows: allNormalizedRows,
    totalRows,
    truncated: totalRows > limit,
    maxRows: limit,
    elapsedMs,
  };
}
