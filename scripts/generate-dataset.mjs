import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DuckDBInstance } from '@duckdb/node-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'public', 'datasets');

const SEED = 19870315;

function createRng(seed) {
  let state = seed >>> 0;
  return function nextFloat() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sqlStr(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function sqlNum(val) {
  if (val === null || val === undefined || Number.isNaN(val)) return 'NULL';
  return String(val);
}

function sqlBool(val) {
  if (val === null || val === undefined) return 'NULL';
  return val ? 'TRUE' : 'FALSE';
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDateFromMs(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function formatTsFromMs(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

const DAY_MS = 86400 * 1000;
const BASE_START_MS = Date.UTC(2023, 0, 1, 0, 0, 0);

async function runBatchInsert(conn, tableName, rowsSql, batchSize = 1000) {
  for (let i = 0; i < rowsSql.length; i += batchSize) {
    const slice = rowsSql.slice(i, i + batchSize);
    await conn.run(`INSERT INTO ${tableName} VALUES ${slice.join(',\n')};`);
  }
}

async function generateMercadoBrisa() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rng = createRng(SEED);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const randInt = (min, max) => min + Math.floor(rng() * (max - min + 1));
  const round2 = (n) => Math.round(n * 100) / 100;

  const instance = await DuckDBInstance.create(':memory:');
  const conn = await instance.connect();
  await conn.run('SET threads = 1;');

  // 1. stores (14 rows)
  const storesData = [
    [1, 'STR-MX-01', 'Tienda Reforma Norte', 'flagship', 'MX', 'Norteamérica', 'Ciudad de México', '2021-03-15', 85000.0, 620],
    [2, 'STR-MX-02', 'Tienda Polanco Sur', 'retail', 'MX', 'Norteamérica', 'Ciudad de México', '2021-07-10', 64000.0, 380],
    [3, 'STR-MX-03', 'Tienda Chapultepec', 'retail', 'MX', 'Norteamérica', 'Guadalajara', '2022-02-01', 52000.0, 340],
    [4, 'STR-CO-01', 'Tienda Chapinero Alto', 'flagship', 'CO', 'Andina', 'Bogotá', '2021-05-20', 71000.0, 510],
    [5, 'STR-CO-02', 'Tienda El Poblado', 'retail', 'CO', 'Andina', 'Medellín', '2022-04-12', 49000.0, 320],
    [6, 'STR-CL-01', 'Tienda Providencia', 'flagship', 'CL', 'Cono Sur', 'Santiago', '2021-09-01', 68000.0, 460],
    [7, 'STR-CL-02', 'Tienda Las Condes', 'retail', 'CL', 'Cono Sur', 'Santiago', '2022-08-18', 54000.0, 350],
    [8, 'STR-AR-01', 'Tienda Palermo Soho', 'retail', 'AR', 'Cono Sur', 'Buenos Aires', '2022-01-20', 46000.0, 390],
    [9, 'STR-PE-01', 'Tienda Miraflores', 'retail', 'PE', 'Andina', 'Lima', '2022-06-15', 44000.0, 330],
    [10, 'STR-ES-01', 'Tienda Salamanca', 'flagship', 'ES', 'Iberia', 'Madrid', '2021-11-05', 78000.0, 540],
    [11, 'STR-ES-02', 'Tienda Eixample', 'retail', 'ES', 'Iberia', 'Barcelona', '2022-10-01', 61000.0, 410],
    [12, 'WH-MX-01', 'Almacén Central Vallejo', 'warehouse', 'MX', 'Norteamérica', 'Ciudad de México', '2021-01-10', 95000.0, 4200],
    [13, 'WH-CO-01', 'Almacén Logístico Sabana', 'warehouse', 'CO', 'Andina', 'Bogotá', '2021-04-01', 76000.0, 3100],
    [14, 'WH-ES-01', 'Almacén Logístico Coslada', 'warehouse', 'ES', 'Iberia', 'Madrid', '2021-10-15', 82000.0, 3500],
  ];

  await conn.run(`
    CREATE TABLE stores (
      store_id INTEGER,
      store_code VARCHAR,
      store_name VARCHAR,
      store_type VARCHAR,
      country_code VARCHAR,
      region VARCHAR,
      city VARCHAR,
      opened_date DATE,
      monthly_target_usd DOUBLE,
      area_sqm INTEGER
    );
  `);
  await runBatchInsert(
    conn,
    'stores',
    storesData.map(
      (r) =>
        `(${sqlNum(r[0])}, ${sqlStr(r[1])}, ${sqlStr(r[2])}, ${sqlStr(r[3])}, ${sqlStr(r[4])}, ${sqlStr(r[5])}, ${sqlStr(r[6])}, ${sqlStr(r[7])}, ${sqlNum(r[8])}, ${sqlNum(r[9])})`
    )
  );

  // 2. calendar (1,095 rows: 2023-01-01 to 2025-12-30)
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const fixedHolidays = {
    '01-01': 'Año Nuevo',
    '05-01': 'Día del Trabajo',
    '09-16': 'Día de la Independencia',
    '11-24': 'Viernes de Descuento',
    '12-25': 'Navidad',
  };

  await conn.run(`
    CREATE TABLE calendar (
      calendar_date DATE,
      year INTEGER,
      quarter INTEGER,
      fiscal_quarter VARCHAR,
      month INTEGER,
      month_name VARCHAR,
      iso_week INTEGER,
      day_of_week INTEGER,
      day_name VARCHAR,
      is_weekend BOOLEAN,
      is_holiday BOOLEAN,
      holiday_name VARCHAR,
      season VARCHAR
    );
  `);

  const calendarRows = [];
  for (let dIdx = 0; dIdx < 1095; dIdx++) {
    const ms = BASE_START_MS + dIdx * DAY_MS;
    const dt = new Date(ms);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const day = dt.getUTCDate();
    const q = Math.floor((m - 1) / 3) + 1;
    const fq = `FY${String(y).slice(2)}-Q${q}`;
    const jsDow = dt.getUTCDay(); // 0=Sun..6=Sat
    const isoDow = jsDow === 0 ? 7 : jsDow;
    const isWeekend = isoDow >= 6;
    const mmdd = `${pad2(m)}-${pad2(day)}`;
    const holidayName = fixedHolidays[mmdd] || null;
    const isHoliday = holidayName !== null;
    const isoWeek = Math.min(53, Math.floor((dIdx % 365) / 7) + 1);
    const season =
      m <= 2 || m === 12 ? 'Invierno' : m <= 5 ? 'Primavera' : m <= 8 ? 'Verano' : 'Otoño';
    const dateStr = `${y}-${pad2(m)}-${pad2(day)}`;

    calendarRows.push(
      `(${sqlStr(dateStr)}, ${y}, ${q}, ${sqlStr(fq)}, ${m}, ${sqlStr(monthNames[m - 1])}, ${isoWeek}, ${isoDow}, ${sqlStr(dayNames[jsDow])}, ${sqlBool(isWeekend)}, ${sqlBool(isHoliday)}, ${sqlStr(holidayName)}, ${sqlStr(season)})`
    );
  }
  await runBatchInsert(conn, 'calendar', calendarRows);

  // 3. products (180 rows, including 1 intentional test SKU with negative price -9.99)
  const categories = [
    { cat: 'Café en grano', sub: ['Origen único', 'Mezcla casa', 'Descafeinado de altura'], minPrice: 14, maxPrice: 42, costRatio: 0.44 },
    { cat: 'Molinos', sub: ['Muelas cónicas', 'Muelas planas', 'Manual portátil'], minPrice: 65, maxPrice: 240, costRatio: 0.56 },
    { cat: 'Cafeteras', sub: ['Prensa y vertido', 'Espresso doméstico', 'Inmersión térmica'], minPrice: 32, maxPrice: 195, costRatio: 0.52 },
    { cat: 'Accesorios', sub: ['Básculas de precisión', 'Termos y tazas', 'Filtros de papel'], minPrice: 9, maxPrice: 68, costRatio: 0.41 },
    { cat: 'Suscripciones', sub: ['Plan mensual 500g', 'Plan quincenal 1kg', 'Lote experimental'], minPrice: 24, maxPrice: 76, costRatio: 0.48 },
  ];
  const brands = ['Brisa Origen', 'Brisa Taller', 'Andes Roast', 'Kona Lab', 'Viento Sur'];
  const origins = ['Huila', 'Chiapas', 'Antigua', 'Cusco', 'Tarrazú', 'Nariño', 'Oaxaca', 'Veracruz', 'Quindío', 'Sierra Nevada'];

  await conn.run(`
    CREATE TABLE products (
      product_id INTEGER,
      sku VARCHAR,
      product_name VARCHAR,
      category VARCHAR,
      subcategory VARCHAR,
      brand VARCHAR,
      unit_cost_usd DOUBLE,
      list_price_usd DOUBLE,
      is_active BOOLEAN,
      launch_date DATE
    );
  `);

  const productsMeta = [];
  const productRows = [];
  for (let pid = 1; pid <= 180; pid++) {
    if (pid === 180) {
      // Intentional anomaly: 1 test product with negative price (-9.99)
      const pObj = {
        product_id: 180,
        sku: 'SKU-TEST-NEG',
        product_name: 'Producto de prueba calibración POS (no vender)',
        category: 'Accesorios',
        subcategory: 'Filtros de papel',
        brand: 'Brisa Taller',
        unit_cost_usd: 0.0,
        list_price_usd: -9.99,
        is_active: false,
        launch_date: '2023-01-15',
      };
      productsMeta.push(pObj);
      productRows.push(
        `(${pObj.product_id}, ${sqlStr(pObj.sku)}, ${sqlStr(pObj.product_name)}, ${sqlStr(pObj.category)}, ${sqlStr(pObj.subcategory)}, ${sqlStr(pObj.brand)}, ${sqlNum(pObj.unit_cost_usd)}, ${sqlNum(pObj.list_price_usd)}, ${sqlBool(pObj.is_active)}, ${sqlStr(pObj.launch_date)})`
      );
      continue;
    }

    const catSpec = categories[(pid - 1) % categories.length];
    const subcat = catSpec.sub[(pid - 1) % catSpec.sub.length];
    const brand = brands[(pid * 3) % brands.length];
    const origin = origins[pid % origins.length];
    const rawPrice = catSpec.minPrice + rng() * (catSpec.maxPrice - catSpec.minPrice);
    const listPrice = round2(rawPrice);
    const unitCost = round2(listPrice * (catSpec.costRatio + (rng() - 0.5) * 0.08));
    const skuPrefix = catSpec.cat.slice(0, 3).toUpperCase().replace('É', 'E');
    const sku = `MB-${skuPrefix}-${String(pid).padStart(3, '0')}`;
    const name = `${catSpec.cat} ${origin} Serie ${pid}`;
    const launchOffset = randInt(0, 650);
    const launchDate = formatDateFromMs(BASE_START_MS + launchOffset * DAY_MS);
    const isActive = pid % 19 !== 0;

    const pObj = {
      product_id: pid,
      sku,
      product_name: name,
      category: catSpec.cat,
      subcategory: subcat,
      brand,
      unit_cost_usd: unitCost,
      list_price_usd: listPrice,
      is_active: isActive,
      launch_date: launchDate,
    };
    productsMeta.push(pObj);
    productRows.push(
      `(${pObj.product_id}, ${sqlStr(pObj.sku)}, ${sqlStr(pObj.product_name)}, ${sqlStr(pObj.category)}, ${sqlStr(pObj.subcategory)}, ${sqlStr(pObj.brand)}, ${sqlNum(pObj.unit_cost_usd)}, ${sqlNum(pObj.list_price_usd)}, ${sqlBool(pObj.is_active)}, ${sqlStr(pObj.launch_date)})`
    );
  }
  await runBatchInsert(conn, 'products', productRows);

  // 4. customers (2,400 rows) & 5. customer_changes (4,100 rows)
  const firstNames = [
    'Mateo', 'Sofía', 'Lucas', 'Valentina', 'Santiago', 'Camila', 'Nicolás', 'Martina',
    'Sebastián', 'Lucía', 'Alejandro', 'Paula', 'Diego', 'Elena', 'Daniel', 'Valeria',
    'Gabriel', 'Mariana', 'Andrés', 'Clara', 'Joaquín', 'Natalia', 'Tomás', 'Inés',
  ];
  const lastNames = [
    'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez',
    'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales',
    'Cruz', 'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos', 'Vargas', 'Castillo', 'Mendoza',
  ];
  const countrySpecs = [
    { code: 'MX', cities: ['Ciudad de México', 'Guadalajara', 'Monterrey'], postalPrefix: '06' },
    { code: 'CO', cities: ['Bogotá', 'Medellín', 'Cali'], postalPrefix: '11' },
    { code: 'CL', cities: ['Santiago', 'Valparaíso', 'Concepción'], postalPrefix: '75' },
    { code: 'AR', cities: ['Buenos Aires', 'Córdoba', 'Rosario'], postalPrefix: 'C1' },
    { code: 'PE', cities: ['Lima', 'Arequipa', 'Cusco'], postalPrefix: '15' },
    { code: 'ES', cities: ['Madrid', 'Barcelona', 'Valencia'], postalPrefix: '28' },
  ];
  const segments = ['retail', 'pro_barista', 'cafeteria_b2b'];
  const channels = ['organic_search', 'paid_social', 'referral', 'direct', 'email_campaign'];
  const tiers = ['bronce', 'plata', 'oro', 'platino'];

  await conn.run(`
    CREATE TABLE customers (
      customer_id INTEGER,
      full_name VARCHAR,
      email VARCHAR,
      country_code VARCHAR,
      city VARCHAR,
      postal_code VARCHAR,
      segment VARCHAR,
      acquisition_channel VARCHAR,
      signup_date DATE,
      is_active BOOLEAN,
      current_tier VARCHAR
    );
  `);

  await conn.run(`
    CREATE TABLE customer_changes (
      change_id INTEGER,
      customer_id INTEGER,
      country_code VARCHAR,
      segment VARCHAR,
      tier VARCHAR,
      valid_from TIMESTAMP,
      valid_to TIMESTAMP,
      is_current BOOLEAN
    );
  `);

  const customersMeta = [];
  const customerRows = [];
  const changeRows = [];
  let changeIdCounter = 1;

  // To get exact 4,100 rows in customer_changes across 2,400 customers:
  // - Customers 1..400 have 3 versions (1,200 rows)
  // - Customers 401..1,300 (900 customers) have 2 versions (1,800 rows)
  // - Customers 1,301..2,400 (1,100 customers) have 1 version (1,100 rows)
  // Total = 1,200 + 1,800 + 1,100 = 4,100 rows!
  for (let cid = 1; cid <= 2400; cid++) {
    const fn = firstNames[cid % firstNames.length];
    const ln = lastNames[(cid * 7) % lastNames.length];
    const fullName = `${fn} ${ln}`;
    const email = `cliente${cid}@mercadobrisa.example`;
    const cSpec = countrySpecs[cid % countrySpecs.length];
    const city = cSpec.cities[cid % cSpec.cities.length];
    // Intentional NULL or incomplete postal codes
    let postalCode = `${cSpec.postalPrefix}${String((cid * 17) % 1000).padStart(3, '0')}`;
    if (cid % 11 === 0) {
      postalCode = null;
    } else if (cid % 17 === 0) {
      postalCode = cSpec.postalPrefix; // incomplete postal code
    }

    const acqChannel = channels[(cid * 5) % channels.length];
    const signupDayOffset = randInt(0, 520); // between 2023-01-01 and mid-2024
    const signupMs = BASE_START_MS + signupDayOffset * DAY_MS;
    const signupDate = formatDateFromMs(signupMs);
    const isActive = cid % 15 !== 0;

    let versionCount = 1;
    if (cid <= 400) versionCount = 3;
    else if (cid <= 1300) versionCount = 2;

    const baseSegment = segments[cid % segments.length];
    const v1FromMs = signupMs + 8 * 3600 * 1000;

    if (versionCount === 1) {
      const tier = tiers[cid % 3];
      customersMeta.push({
        customer_id: cid,
        country_code: cSpec.code,
        segment: baseSegment,
        current_tier: tier,
        signupMs: v1FromMs,
      });
      customerRows.push(
        `(${cid}, ${sqlStr(fullName)}, ${sqlStr(email)}, ${sqlStr(cSpec.code)}, ${sqlStr(city)}, ${sqlStr(postalCode)}, ${sqlStr(baseSegment)}, ${sqlStr(acqChannel)}, ${sqlStr(signupDate)}, ${sqlBool(isActive)}, ${sqlStr(tier)})`
      );
      changeRows.push(
        `(${changeIdCounter++}, ${cid}, ${sqlStr(cSpec.code)}, ${sqlStr(baseSegment)}, ${sqlStr(tier)}, ${sqlStr(formatTsFromMs(v1FromMs))}, NULL, TRUE)`
      );
    } else if (versionCount === 2) {
      const v2FromMs = v1FromMs + randInt(90, 240) * DAY_MS;
      const tier1 = 'bronce';
      const tier2 = cid % 2 === 0 ? 'plata' : 'oro';
      const seg1 = 'retail';
      const seg2 = cid % 3 === 0 ? 'pro_barista' : 'retail';

      customersMeta.push({
        customer_id: cid,
        country_code: cSpec.code,
        segment: seg2,
        current_tier: tier2,
        signupMs: v1FromMs,
      });
      customerRows.push(
        `(${cid}, ${sqlStr(fullName)}, ${sqlStr(email)}, ${sqlStr(cSpec.code)}, ${sqlStr(city)}, ${sqlStr(postalCode)}, ${sqlStr(seg2)}, ${sqlStr(acqChannel)}, ${sqlStr(signupDate)}, ${sqlBool(isActive)}, ${sqlStr(tier2)})`
      );
      changeRows.push(
        `(${changeIdCounter++}, ${cid}, ${sqlStr(cSpec.code)}, ${sqlStr(seg1)}, ${sqlStr(tier1)}, ${sqlStr(formatTsFromMs(v1FromMs))}, ${sqlStr(formatTsFromMs(v2FromMs))}, FALSE)`
      );
      changeRows.push(
        `(${changeIdCounter++}, ${cid}, ${sqlStr(cSpec.code)}, ${sqlStr(seg2)}, ${sqlStr(tier2)}, ${sqlStr(formatTsFromMs(v2FromMs))}, NULL, TRUE)`
      );
    } else {
      const v2FromMs = v1FromMs + randInt(60, 150) * DAY_MS;
      const v3FromMs = v2FromMs + randInt(90, 200) * DAY_MS;
      const tier1 = 'bronce';
      const tier2 = 'plata';
      const tier3 = cid % 2 === 0 ? 'oro' : 'platino';
      const seg1 = 'retail';
      const seg2 = 'pro_barista';
      const seg3 = cid % 4 === 0 ? 'cafeteria_b2b' : 'pro_barista';

      customersMeta.push({
        customer_id: cid,
        country_code: cSpec.code,
        segment: seg3,
        current_tier: tier3,
        signupMs: v1FromMs,
      });
      customerRows.push(
        `(${cid}, ${sqlStr(fullName)}, ${sqlStr(email)}, ${sqlStr(cSpec.code)}, ${sqlStr(city)}, ${sqlStr(postalCode)}, ${sqlStr(seg3)}, ${sqlStr(acqChannel)}, ${sqlStr(signupDate)}, ${sqlBool(isActive)}, ${sqlStr(tier3)})`
      );
      changeRows.push(
        `(${changeIdCounter++}, ${cid}, ${sqlStr(cSpec.code)}, ${sqlStr(seg1)}, ${sqlStr(tier1)}, ${sqlStr(formatTsFromMs(v1FromMs))}, ${sqlStr(formatTsFromMs(v2FromMs))}, FALSE)`
      );
      changeRows.push(
        `(${changeIdCounter++}, ${cid}, ${sqlStr(cSpec.code)}, ${sqlStr(seg2)}, ${sqlStr(tier2)}, ${sqlStr(formatTsFromMs(v2FromMs))}, ${sqlStr(formatTsFromMs(v3FromMs))}, FALSE)`
      );
      changeRows.push(
        `(${changeIdCounter++}, ${cid}, ${sqlStr(cSpec.code)}, ${sqlStr(seg3)}, ${sqlStr(tier3)}, ${sqlStr(formatTsFromMs(v3FromMs))}, NULL, TRUE)`
      );
    }
  }

  await runBatchInsert(conn, 'customers', customerRows);
  await runBatchInsert(conn, 'customer_changes', changeRows);

  // 6. orders (18,000 rows) & 7. order_items (42,000 rows)
  // To guarantee exact 42,000 order_items across 18,000 orders:
  // Average is 42,000 / 18,000 = 2.3333 items per order:
  // - 6,000 orders with 1 item  =  6,000
  // - 3,000 orders with 2 items =  6,000
  // - 6,000 orders with 3 items = 18,000
  // - 3,000 orders with 4 items = 12,000
  // Sum = 18,000 orders and 42,000 order_items!
  await conn.run(`
    CREATE TABLE orders (
      order_id INTEGER,
      customer_id INTEGER,
      store_id INTEGER,
      order_ts TIMESTAMP,
      order_date DATE,
      status VARCHAR,
      currency VARCHAR,
      subtotal_usd DOUBLE,
      discount_usd DOUBLE,
      shipping_usd DOUBLE,
      tax_usd DOUBLE,
      total_usd DOUBLE,
      campaign_id VARCHAR,
      device_type VARCHAR
    );
  `);

  await conn.run(`
    CREATE TABLE order_items (
      order_item_id INTEGER,
      order_id INTEGER,
      line_number INTEGER,
      product_id INTEGER,
      qty INTEGER,
      unit_price_usd DOUBLE,
      discount_usd DOUBLE,
      line_total_usd DOUBLE
    );
  `);

  const campaigns = ['CMP-VERANO', 'CMP-ORIGEN', 'CMP-BARISTA', 'CMP-RETENCION', null, null];
  const devices = ['mobile', 'desktop', 'pos_tienda'];
  const storesByCountry = {
    MX: [1, 2, 3, 12],
    CO: [4, 5, 13],
    CL: [6, 7],
    AR: [8],
    PE: [9],
    ES: [10, 11, 14],
  };

  const ordersMeta = [];
  const orderRows = [];
  const orderItemRows = [];
  let orderItemIdCounter = 1;

  for (let idx = 0; idx < 18000; idx++) {
    const orderId = 10001 + idx;
    const cust = customersMeta[(idx * 13 + Math.floor(idx / 7)) % customersMeta.length];
    const countryStores = storesByCountry[cust.country_code] || [1];
    const storeId = countryStores[idx % countryStores.length];

    // Order timestamp after customer signup, within 2023-2025
    const maxOffsetDays = Math.max(10, Math.floor((BASE_START_MS + 1060 * DAY_MS - cust.signupMs) / DAY_MS));
    const orderOffsetDays = randInt(1, maxOffsetDays);
    const orderSecondsInDay = randInt(6 * 3600, 22 * 3600);
    const orderMs = cust.signupMs + orderOffsetDays * DAY_MS + orderSecondsInDay * 1000;
    const orderTs = formatTsFromMs(orderMs);
    const orderDate = formatDateFromMs(orderMs);

    let status = 'completed';
    const stRoll = idx % 50;
    if (stRoll >= 41 && stRoll <= 44) status = 'refunded';
    else if (stRoll >= 45 && stRoll <= 47) status = 'cancelled';
    else if (stRoll >= 48) status = 'pending';

    let itemCount = 1;
    const bucket = idx % 6;
    if (bucket === 0 || bucket === 1) itemCount = 1;
    else if (bucket === 2) itemCount = 2;
    else if (bucket === 3 || bucket === 4) itemCount = 3;
    else itemCount = 4;

    let subtotal = 0;
    for (let line = 1; line <= itemCount; line++) {
      // Include test product 180 on 15 cancelled test orders so it is visible in order_items too
      let prod;
      if (idx < 15 && line === 1 && status === 'cancelled') {
        prod = productsMeta[179]; // product_id = 180 (-9.99)
      } else {
        const pidIdx = (idx * 11 + line * 29) % 179; // 0..178 (valid products 1..179)
        prod = productsMeta[pidIdx];
      }

      const qty = line === 1 && cust.segment === 'cafeteria_b2b' ? randInt(2, 4) : randInt(1, 3);
      const unitPrice = prod.list_price_usd;
      const lineDisc = unitPrice > 0 && (idx + line) % 5 === 0 ? round2(unitPrice * qty * 0.05) : 0.0;
      const lineTotal = round2(qty * unitPrice - lineDisc);
      subtotal = round2(subtotal + lineTotal);

      orderItemRows.push(
        `(${orderItemIdCounter++}, ${orderId}, ${line}, ${prod.product_id}, ${qty}, ${sqlNum(unitPrice)}, ${sqlNum(lineDisc)}, ${sqlNum(lineTotal)})`
      );
    }

    const orderDisc = subtotal > 80 && idx % 4 === 0 ? round2(subtotal * 0.05) : 0.0;
    const shipping = subtotal >= 60 || storeId <= 11 ? 0.0 : 6.5;
    const tax = subtotal > 0 ? round2((subtotal - orderDisc) * 0.16) : 0.0;
    const total = round2(subtotal - orderDisc + shipping + tax);
    const campaign = campaigns[idx % campaigns.length];
    const device = devices[(idx + storeId) % devices.length];

    ordersMeta.push({
      order_id: orderId,
      customer_id: cust.customer_id,
      store_id: storeId,
      orderMs,
      orderTs,
      orderDate,
      status,
      total_usd: total,
      campaign_id: campaign,
      device_type: device,
    });

    orderRows.push(
      `(${orderId}, ${cust.customer_id}, ${storeId}, ${sqlStr(orderTs)}, ${sqlStr(orderDate)}, ${sqlStr(status)}, 'USD', ${sqlNum(subtotal)}, ${sqlNum(orderDisc)}, ${sqlNum(shipping)}, ${sqlNum(tax)}, ${sqlNum(total)}, ${sqlStr(campaign)}, ${sqlStr(device)})`
    );
  }

  await runBatchInsert(conn, 'orders', orderRows);
  await runBatchInsert(conn, 'order_items', orderItemRows);

  // 8. payments (19,200 rows: 18,000 initial + 750 retries + 450 duplicate webhook records)
  await conn.run(`
    CREATE TABLE payments (
      payment_id INTEGER,
      order_id INTEGER,
      attempt_number INTEGER,
      payment_method VARCHAR,
      provider VARCHAR,
      status VARCHAR,
      amount_usd DOUBLE,
      payment_ts TIMESTAMP,
      idempotency_key VARCHAR
    );
  `);

  const paymentMethods = ['card', 'transferencia_spei', 'billetera_digital', 'efectivo_tienda'];
  const providers = ['stripe_latam', 'conekta', 'mercadopago', 'adyen_iberia'];
  const paymentRows = [];
  let paymentIdCounter = 1;

  for (let idx = 0; idx < 18000; idx++) {
    const ord = ordersMeta[idx];
    const pm = paymentMethods[idx % paymentMethods.length];
    const prov = providers[idx % providers.length];
    const idemKey1 = `idem-ord-${ord.order_id}-a1`;
    const payMs1 = ord.orderMs + 15 * 1000;

    if (idx < 750) {
      // Orders 0..749 had a failed attempt 1 followed by a second attempt 2
      paymentRows.push(
        `(${paymentIdCounter++}, ${ord.order_id}, 1, ${sqlStr(pm)}, ${sqlStr(prov)}, 'failed', ${sqlNum(ord.total_usd)}, ${sqlStr(formatTsFromMs(payMs1))}, ${sqlStr(idemKey1)})`
      );
      const idemKey2 = `idem-ord-${ord.order_id}-a2`;
      const payMs2 = payMs1 + 95 * 1000;
      const finalStatus = ord.status === 'cancelled' ? 'failed' : ord.status === 'pending' ? 'pending' : 'captured';
      paymentRows.push(
        `(${paymentIdCounter++}, ${ord.order_id}, 2, ${sqlStr(pm)}, ${sqlStr(prov)}, ${sqlStr(finalStatus)}, ${sqlNum(ord.total_usd)}, ${sqlStr(formatTsFromMs(payMs2))}, ${sqlStr(idemKey2)})`
      );
    } else {
      const finalStatus = ord.status === 'cancelled' ? 'failed' : ord.status === 'pending' ? 'pending' : 'captured';
      paymentRows.push(
        `(${paymentIdCounter++}, ${ord.order_id}, 1, ${sqlStr(pm)}, ${sqlStr(prov)}, ${sqlStr(finalStatus)}, ${sqlNum(ord.total_usd)}, ${sqlStr(formatTsFromMs(payMs1))}, ${sqlStr(idemKey1)})`
      );
      // Intentional webhook duplicates for idx 750..1199 (450 duplicate rows sharing idempotency_key)
      if (idx >= 750 && idx < 1200) {
        const dupMs = payMs1 + 4 * 1000;
        paymentRows.push(
          `(${paymentIdCounter++}, ${ord.order_id}, 1, ${sqlStr(pm)}, ${sqlStr(prov)}, ${sqlStr(finalStatus)}, ${sqlNum(ord.total_usd)}, ${sqlStr(formatTsFromMs(dupMs))}, ${sqlStr(idemKey1)})`
        );
      }
    }
  }
  await runBatchInsert(conn, 'payments', paymentRows);

  // 9. refunds (1,450 rows across refunded and partially refunded completed orders)
  await conn.run(`
    CREATE TABLE refunds (
      refund_id INTEGER,
      order_id INTEGER,
      refund_ts TIMESTAMP,
      refund_date DATE,
      reason VARCHAR,
      refund_amount_usd DOUBLE,
      status VARCHAR
    );
  `);

  const refundReasons = [
    'empaque_danado',
    'tueste_incorrecto',
    'retraso_envio',
    'cambio_opinion',
    'defecto_molino',
  ];
  const refundRows = [];
  let refundIdCounter = 1;

  // Pick 1,150 distinct orders to have at least 1 refund, and the first 300 of them have a 2nd partial refund = 1,450 rows
  for (let rIdx = 0; rIdx < 1150; rIdx++) {
    const ord = ordersMeta[(rIdx * 15) % ordersMeta.length];
    const hasTwoRefunds = rIdx < 300;
    const refMs1 = ord.orderMs + randInt(2, 12) * DAY_MS;
    const reason1 = refundReasons[rIdx % refundReasons.length];
    const amount1 = hasTwoRefunds
      ? round2(Math.max(2.5, ord.total_usd * 0.35))
      : round2(Math.max(4.0, ord.total_usd * 0.8));

    refundRows.push(
      `(${refundIdCounter++}, ${ord.order_id}, ${sqlStr(formatTsFromMs(refMs1))}, ${sqlStr(formatDateFromMs(refMs1))}, ${sqlStr(reason1)}, ${sqlNum(amount1)}, 'processed')`
    );

    if (hasTwoRefunds) {
      const refMs2 = refMs1 + randInt(1, 5) * DAY_MS;
      const reason2 = refundReasons[(rIdx + 2) % refundReasons.length];
      const amount2 = round2(Math.max(2.0, ord.total_usd * 0.25));
      refundRows.push(
        `(${refundIdCounter++}, ${ord.order_id}, ${sqlStr(formatTsFromMs(refMs2))}, ${sqlStr(formatDateFromMs(refMs2))}, ${sqlStr(reason2)}, ${sqlNum(amount2)}, 'processed')`
      );
    }
  }
  await runBatchInsert(conn, 'refunds', refundRows);

  // 10. events (65,000 rows)
  // Includes:
  // - 18,000 pre-order attribution events (10 to 90 min before each order_ts, for ASOF JOIN in L3)
  // - 45,800 funnel/session browse events (with NULLs in optional fields and mixed UTC/local raw timestamps)
  // - 1,200 duplicate retry events (exact duplicate event_id/session_id from mobile retries)
  // Total = 65,000 rows!
  await conn.run(`
    CREATE TABLE events (
      event_id VARCHAR,
      session_id VARCHAR,
      customer_id INTEGER,
      user_id INTEGER,
      event_type VARCHAR,
      event_ts TIMESTAMP,
      event_ts_raw VARCHAR,
      timezone_offset VARCHAR,
      device_type VARCHAR,
      campaign_id VARCHAR,
      product_id INTEGER,
      payload_json VARCHAR
    );
  `);

  const tzOffsets = ['Z', '-06:00', '-05:00', '-03:00', '+01:00'];
  const browseEventTypes = [
    'page_view',
    'product_view',
    'add_to_cart',
    'checkout_started',
    'checkout_completed',
  ];
  const eventRows = [];

  // Part A: 18,000 pre-order touchpoints
  for (let idx = 0; idx < 18000; idx++) {
    const ord = ordersMeta[idx];
    const evId = `evt-ord-${idx + 1}`;
    const sessId = `sess-ord-${idx + 1}`;
    const leadSeconds = randInt(300, 5400); // 5 to 90 mins prior to order_ts
    const evMs = ord.orderMs - leadSeconds * 1000;
    const evTs = formatTsFromMs(evMs);
    const tz = tzOffsets[idx % tzOffsets.length];
    const evRaw = tz === 'Z' ? `${evTs.replace(' ', 'T')}Z` : `${evTs.replace(' ', 'T')}${tz}`;
    const evType = idx % 3 === 0 ? 'checkout_completed' : idx % 3 === 1 ? 'checkout_started' : 'add_to_cart';
    const prodId = (idx % 179) + 1;
    const cmp = ord.campaign_id || 'CMP-DIRECT';
    const payload = `{"source":"web","campaign":"${cmp}","step":"${evType}"}`;

    eventRows.push(
      `(${sqlStr(evId)}, ${sqlStr(sessId)}, ${ord.customer_id}, ${ord.customer_id}, ${sqlStr(evType)}, ${sqlStr(evTs)}, ${sqlStr(evRaw)}, ${sqlStr(tz)}, ${sqlStr(ord.device_type)}, ${sqlStr(ord.campaign_id)}, ${prodId}, ${sqlStr(payload)})`
    );
  }

  // Part B: 45,800 general funnel events + 1,200 duplicate retry events = 47,000 rows
  for (let idx = 0; idx < 45800; idx++) {
    const evId = `evt-web-${idx + 1}`;
    const sessId = `sess-web-${Math.floor(idx / 3) + 1}`;
    // 15% anonymous sessions (customer_id IS NULL)
    const isAnon = idx % 7 === 0;
    const custId = isAnon ? null : ((idx * 19) % 2400) + 1;
    const evType = browseEventTypes[idx % browseEventTypes.length];
    const evMs = BASE_START_MS + randInt(0, 1050) * DAY_MS + randInt(0, 86399) * 1000;
    const evTs = formatTsFromMs(evMs);
    const tz = tzOffsets[(idx * 3) % tzOffsets.length];
    const evRaw = tz === 'Z' ? `${evTs.replace(' ', 'T')}Z` : `${evTs.replace(' ', 'T')}${tz}`;
    const dev = devices[idx % devices.length];
    const cmp = idx % 4 === 0 ? null : campaigns[idx % 4];
    const prodId = evType === 'page_view' ? null : (idx % 179) + 1;
    const payload = `{"event":"${evType}","tz":"${tz}"}`;

    const rowSql = `(${sqlStr(evId)}, ${sqlStr(sessId)}, ${sqlNum(custId)}, ${sqlNum(custId)}, ${sqlStr(evType)}, ${sqlStr(evTs)}, ${sqlStr(evRaw)}, ${sqlStr(tz)}, ${sqlStr(dev)}, ${sqlStr(cmp)}, ${sqlNum(prodId)}, ${sqlStr(payload)})`;
    eventRows.push(rowSql);

    // First 1,200 funnel events also emit a duplicate retry row
    if (idx < 1200) {
      eventRows.push(rowSql);
    }
  }
  await runBatchInsert(conn, 'events', eventRows);

  // 11. marketing_spend (730 rows: 146 days * 5 channels)
  await conn.run(`
    CREATE TABLE marketing_spend (
      spend_date DATE,
      channel VARCHAR,
      campaign_id VARCHAR,
      region VARCHAR,
      spend_usd DOUBLE,
      impressions INTEGER,
      clicks INTEGER,
      attributed_conversions INTEGER
    );
  `);

  const mktChannels = [
    { ch: 'paid_social', cmp: 'CMP-VERANO', reg: 'Norteamérica', baseSpend: 420 },
    { ch: 'organic_search', cmp: 'CMP-ORIGEN', reg: 'Andina', baseSpend: 180 },
    { ch: 'email_campaign', cmp: 'CMP-RETENCION', reg: 'Cono Sur', baseSpend: 95 },
    { ch: 'referral', cmp: 'CMP-BARISTA', reg: 'Iberia', baseSpend: 150 },
    { ch: 'display_video', cmp: 'CMP-VERANO', reg: 'Norteamérica', baseSpend: 310 },
  ];
  const spendRows = [];
  for (let d = 0; d < 146; d++) {
    const spendDate = formatDateFromMs(BASE_START_MS + (365 + d * 2) * DAY_MS);
    for (let cIdx = 0; cIdx < mktChannels.length; cIdx++) {
      const spec = mktChannels[cIdx];
      const spend = round2(spec.baseSpend * (0.75 + rng() * 0.55));
      const impressions = Math.round(spend * (42 + rng() * 18));
      const clicks = Math.round(impressions * (0.018 + rng() * 0.014));
      const conv = Math.max(1, Math.round(clicks * (0.045 + rng() * 0.025)));
      spendRows.push(
        `(${sqlStr(spendDate)}, ${sqlStr(spec.ch)}, ${sqlStr(spec.cmp)}, ${sqlStr(spec.reg)}, ${sqlNum(spend)}, ${impressions}, ${clicks}, ${conv})`
      );
    }
  }
  await runBatchInsert(conn, 'marketing_spend', spendRows);

  // 12. experiments (6 rows)
  await conn.run(`
    CREATE TABLE experiments (
      experiment_id INTEGER,
      experiment_code VARCHAR,
      experiment_name VARCHAR,
      hypothesis VARCHAR,
      primary_metric VARCHAR,
      start_date DATE,
      end_date DATE,
      status VARCHAR,
      target_sample_size INTEGER,
      srm_p_value DOUBLE
    );
  `);

  const expData = [
    [1, 'EXP-CHECKOUT-1STEP', 'Checkout expres en un paso', 'Reducir campos de direccion eleva el gasto post-asignacion por usuario', 'post_experiment_spend_usd', '2024-03-01', '2024-03-29', 'completed', 1600, 0.8421],
    [2, 'EXP-FREE-SHIP-45', 'Umbral de envio gratis a 45 USD', 'Bajar el umbral de envio gratis incrementa el ticket medio sin erosionar margen', 'post_experiment_spend_usd', '2024-05-01', '2024-05-29', 'completed', 1600, 0.6194],
    [3, 'EXP-SUB-BUNDLE', 'Paquete de bienvenida suscripcion + filtro', 'Incluir filtros sin cargo mejora la conversion a suscripcion mensual', 'conversion_rate', '2024-07-10', '2024-08-07', 'completed', 1600, 0.5102],
    [4, 'EXP-QUIZ-ORIGEN', 'Cuestionario interactivo de perfil de tueste', 'Guiar la recomendacion por acidez reduce devoluciones por tueste incorrecto', 'conversion_rate', '2024-09-15', '2024-10-13', 'completed', 1600, 0.7315],
    [5, 'EXP-UPSELL-MOLINO', 'Descuento cruzado en molino al comprar grano', 'Ofrecer 15% en molinos manuales en el carrito eleva el ingreso neto por sesion', 'post_experiment_spend_usd', '2025-01-10', '2025-02-07', 'running', 1600, 0.4889],
    [6, 'EXP-PUSH-CART', 'Recordatorio push de carrito en 30 minutos', 'Enviar notificacion temprana recupera carritos, pero presenta sesgo SRM en Android', 'conversion_rate', '2025-02-15', '2025-03-01', 'stopped_srm', 1600, 0.0001],
  ];
  await runBatchInsert(
    conn,
    'experiments',
    expData.map(
      (r) =>
        `(${r[0]}, ${sqlStr(r[1])}, ${sqlStr(r[2])}, ${sqlStr(r[3])}, ${sqlStr(r[4])}, ${sqlStr(r[5])}, ${sqlStr(r[6])}, ${sqlStr(r[7])}, ${r[8]}, ${r[9]})`
    )
  );

  // 13. experiment_assignments (9,600 rows: 1,600 per experiment * 6 experiments)
  await conn.run(`
    CREATE TABLE experiment_assignments (
      assignment_id INTEGER,
      experiment_id INTEGER,
      customer_id INTEGER,
      variant VARCHAR,
      assigned_ts TIMESTAMP,
      pre_experiment_spend_usd DOUBLE,
      post_experiment_spend_usd DOUBLE,
      converted BOOLEAN
    );
  `);

  const assignRows = [];
  let assignIdCounter = 1;
  for (let expId = 1; expId <= 6; expId++) {
    const expStartMs = Date.UTC(2024, expId * 2 - 1, 1, 9, 0, 0);
    for (let u = 0; u < 1600; u++) {
      const custId = ((u + expId * 137) % 2400) + 1;
      // Experiment 6 has intentional SRM (980 control vs 620 treatment); experiments 1..5 are balanced 800/800
      let variant = u % 2 === 0 ? 'control' : 'treatment';
      if (expId === 6) {
        variant = u < 980 ? 'control' : 'treatment';
      }
      const assignMs = expStartMs + randInt(0, 14) * DAY_MS + (u * 37) * 1000;
      const preSpend = round2(22.0 + ((u * 19 + expId * 7) % 95) + rng() * 12.0);
      const lift = variant === 'treatment' ? 5.8 + (expId === 1 ? 1.4 : 0.6) : 0.0;
      // Correlated post_experiment_spend_usd = 0.65 * preSpend + base + lift + noise (ideal for CUPED!)
      const postSpend = round2(Math.max(0, 0.65 * preSpend + 14.0 + lift + (rng() - 0.5) * 16.0));
      const converted = postSpend > 28.0;

      assignRows.push(
        `(${assignIdCounter++}, ${expId}, ${custId}, ${sqlStr(variant)}, ${sqlStr(formatTsFromMs(assignMs))}, ${sqlNum(preSpend)}, ${sqlNum(postSpend)}, ${sqlBool(converted)})`
      );
    }
  }
  await runBatchInsert(conn, 'experiment_assignments', assignRows);

  // Export all 13 tables to Parquet and build schema metadata
  const tableSpecs = [
    { name: 'customers', grain: '1 fila = 1 cliente actual (snapshot)', orderBy: 'customer_id' },
    { name: 'customer_changes', grain: '1 fila = 1 versión histórica SCD2 de cliente (valid_from, valid_to, is_current)', orderBy: 'change_id' },
    { name: 'products', grain: '1 fila = 1 SKU con categoría, coste y precio de lista', orderBy: 'product_id' },
    { name: 'orders', grain: '1 fila = 1 pedido con customer_id, order_ts, status, store_id', orderBy: 'order_id' },
    { name: 'order_items', grain: '1 fila = 1 línea de pedido (order_id, product_id, qty, unit_price_usd, discount_usd)', orderBy: 'order_item_id' },
    { name: 'payments', grain: '1 fila = 1 intento de cobro (incluye reintentos fallidos y duplicados)', orderBy: 'payment_id' },
    { name: 'refunds', grain: '1 fila = 1 devolución parcial o total asociada a order_id', orderBy: 'refund_id' },
    { name: 'events', grain: '1 fila = 1 evento web/app (session_id, user_id, event_type, event_ts, payload_json)', orderBy: 'event_id, event_ts' },
    { name: 'marketing_spend', grain: '1 fila = 1 día × canal con gasto e impresiones', orderBy: 'spend_date, channel' },
    { name: 'experiments', grain: '1 fila = 1 experimento A/B con fechas e hipótesis', orderBy: 'experiment_id' },
    { name: 'experiment_assignments', grain: '1 fila = 1 usuario asignado a variante (control / treatment)', orderBy: 'assignment_id' },
    { name: 'stores', grain: '1 fila = 1 tienda física o almacén logístico regional', orderBy: 'store_id' },
    { name: 'calendar', grain: '1 fila = 1 día natural con festivos, trimestre fiscal y semana ISO', orderBy: 'calendar_date' },
  ];

  const schemaManifest = {
    dataset: 'Mercado Brisa',
    domain: 'Comercio electrónico e inventario regional omnicanal (café de especialidad y equipamiento)',
    seed: SEED,
    tables: [],
  };

  let totalBytes = 0;
  for (const t of tableSpecs) {
    const outPath = path.join(OUT_DIR, `${t.name}.parquet`).replace(/\\/g, '/');
    if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

    await conn.run(
      `COPY (SELECT * FROM ${t.name} ORDER BY ${t.orderBy}) TO '${outPath}' (FORMAT PARQUET, COMPRESSION ZSTD, ROW_GROUP_SIZE 100000);`
    );

    const countReader = await conn.runAndReadAll(`SELECT COUNT(*)::INTEGER AS cnt FROM ${t.name};`);
    const rowCount = countReader.getRows()[0][0];

    const colsReader = await conn.runAndReadAll(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${t.name}' ORDER BY ordinal_position;`
    );
    const columns = colsReader.getRows().map((r) => ({
      name: String(r[0]),
      type: String(r[1]),
    }));

    const stat = fs.statSync(outPath);
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(outPath)).digest('hex');
    totalBytes += stat.size;

    schemaManifest.tables.push({
      name: t.name,
      grain: t.grain,
      rowCount: Number(rowCount),
      sizeBytes: stat.size,
      sha256,
      columns,
    });
  }

  schemaManifest.totalSizeBytes = totalBytes;

  const schemaPath = path.join(OUT_DIR, 'schema.json');
  fs.writeFileSync(schemaPath, JSON.stringify(schemaManifest, null, 2) + '\n', 'utf8');

  const readmeLines = [
    '# Dataset Mercado Brisa',
    '',
    'Dataset sintético determinista para el laboratorio SQL de **Grano**. Modela la operación omnicanal de **Mercado Brisa** (tostadores de café de especialidad, equipamiento para baristas, suscripciones y tiendas físicas en Latinoamérica e Iberia).',
    '',
    `- **Semilla PRNG fija**: \`${SEED}\``,
    `- **Tamaño total en Parquet (ZSTD)**: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${totalBytes.toLocaleString('es-ES')} bytes)`,
    `- **Total de tablas**: ${schemaManifest.tables.length}`,
    '',
    '## Catálogo de tablas y grano declarado',
    '',
    '| Tabla | Filas | Tamaño (KB) | Grano (1 fila = ...) | Columnas principales |',
    '| --- | ---: | ---: | --- | --- |',
    ...schemaManifest.tables.map(
      (t) =>
        `| \`${t.name}\` | ${t.rowCount.toLocaleString('es-ES')} | ${(t.sizeBytes / 1024).toFixed(1)} | ${t.grain} | ${t.columns.map((c) => `\`${c.name}\` (${c.type})`).join(', ')} |`
    ),
    '',
    '## Anomalías e imperfecciones intencionales para ejercicios',
    '',
    'El dataset incluye errores realistas diseñados para las prácticas de modelado, calidad de datos, deduplicación y aislamiento de grano:',
    '',
    '1. **Fan-out `1:N` entre cabecera y detalle (`orders` -> `order_items` y `orders` -> `refunds`)**: Un pedido tiene entre 1 y 4 líneas en `order_items` (42.000 líneas para 18.000 pedidos) y existen 300 pedidos con múltiples devoluciones parciales en `refunds` (1.450 filas). Hacer un `JOIN` directo sin preagregar en CTEs infla `SUM(total_usd)` y `SUM(refund_amount_usd)`.',
    '2. **Duplicados por reintento de red y webhooks (`payments` y `events`)**:',
    '   - En `payments` (19.200 filas para 18.000 pedidos) existen 750 reintentos legítimos (`attempt_number = 2` tras un intento `failed`) y **450 filas duplicadas por reenvío de webhook** que comparten exactamente el mismo `idempotency_key` y `order_id` con apenas 4 segundos de diferencia.',
    '   - En `events` (65.000 filas) las primeras 1.200 sesiones web emitieron un evento duplicado idéntico (`event_id`, `session_id`, `event_type`).',
    '3. **Valores `NULL` y códigos postales incompletos (`customers`, `orders`, `events`)**:',
    '   - En `customers`, ~9% de los registros tienen `postal_code IS NULL` y ~6% tienen un prefijo postal truncado de 2 caracteres.',
    '   - En `events`, el 15% de los eventos corresponden a navegación anónima (`customer_id IS NULL` y `user_id IS NULL`), y los eventos `page_view` tienen `product_id IS NULL`.',
    '   - En `orders`, un tercio de los pedidos orgánicos tienen `campaign_id IS NULL`.',
    '4. **Timestamps con mezcla de zonas horarias (`events.event_ts_raw` y `timezone_offset`)**: Mientras `event_ts` está normalizado en UTC, `event_ts_raw` conserva la cadena cruda emitida por el cliente con mezcla de sufijos `Z`, `-06:00`, `-05:00`, `-03:00` y `+01:00`.',
    '5. **SKU de prueba con precio negativo (`products` y `order_items`)**: El producto `product_id = 180` (`sku = \'SKU-TEST-NEG\'`, *"Producto de prueba calibración POS (no vender)"*) tiene `list_price_usd = -9.99` y aparece en 15 pedidos cancelados de calibración.',
    '6. **Desbalance de muestreo SRM (`experiments` y `experiment_assignments`)**: Los experimentos 1 a 5 tienen reparto equilibrado 50/50 (800 `control` / 800 `treatment`), mientras que el experimento 6 (`EXP-PUSH-CART`) presenta un sesgo SRM severo (980 `control` vs 620 `treatment`, `srm_p_value = 0.0001`).',
    '',
  ];

  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), readmeLines.join('\n'), 'utf8');
  console.log(`Dataset Mercado Brisa generado en ${OUT_DIR}`);
  console.log(`Tamaño total Parquet: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  for (const t of schemaManifest.tables) {
    console.log(` - ${t.name.padEnd(24)} ${String(t.rowCount).padStart(7)} filas | ${(t.sizeBytes / 1024).toFixed(1).padStart(7)} KB | sha256: ${t.sha256.slice(0, 16)}...`);
  }
}

generateMercadoBrisa().catch((err) => {
  console.error(err);
  process.exit(1);
});
