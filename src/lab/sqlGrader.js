import { runSqlQuery } from './duckdb.js';

const NUMERIC_TOLERANCE = 1e-6;

export function cellsEqual(actualVal, expectedVal, tolerance = NUMERIC_TOLERANCE) {
  if (actualVal === null || actualVal === undefined) {
    return expectedVal === null || expectedVal === undefined;
  }
  if (expectedVal === null || expectedVal === undefined) {
    return false;
  }

  if (typeof actualVal === 'boolean' || typeof expectedVal === 'boolean') {
    return (
      typeof actualVal === 'boolean' &&
      typeof expectedVal === 'boolean' &&
      actualVal === expectedVal
    );
  }

  if (
    (typeof actualVal === 'number' && !Number.isFinite(actualVal)) ||
    (typeof expectedVal === 'number' && !Number.isFinite(expectedVal))
  ) {
    return false;
  }

  const isActualNum = typeof actualVal === 'number' && Number.isFinite(actualVal);
  const isExpectedNum = typeof expectedVal === 'number' && Number.isFinite(expectedVal);

  if (isActualNum || isExpectedNum) {
    const na = Number(actualVal);
    const nb = Number(expectedVal);
    if (Number.isFinite(na) && Number.isFinite(nb)) {
      return Math.abs(na - nb) <= tolerance;
    }
    return false;
  }

  return String(actualVal).trim() === String(expectedVal).trim();
}

export function rowsEqual(actualRow, expectedRow, columnMap, tolerance = NUMERIC_TOLERANCE) {
  for (const { actualCol, expectedCol } of columnMap) {
    if (!cellsEqual(actualRow[actualCol], expectedRow[expectedCol], tolerance)) {
      return false;
    }
  }
  return true;
}

function projectRowToCanonical(row, columnMap, side = 'expected') {
  const projected = {};
  for (const { actualCol, expectedCol } of columnMap) {
    const key = expectedCol;
    projected[key] = side === 'expected' ? row[expectedCol] : row[actualCol];
  }
  return projected;
}

export function compareQueryResults(actualResult, expectedResult, options = {}) {
  const { orderMatters = false, tolerance = NUMERIC_TOLERANCE } = options;

  const actualCols = (actualResult?.columns || []).map((c) => c.name);
  const expectedCols = (expectedResult?.columns || []).map((c) => c.name);

  const actualLowerMap = new Map();
  for (const col of actualCols) {
    actualLowerMap.set(col.toLowerCase(), col);
  }

  const missingColumns = [];
  const columnMap = [];
  for (const expCol of expectedCols) {
    const matchedActual = actualLowerMap.get(expCol.toLowerCase());
    if (!matchedActual) {
      missingColumns.push(expCol);
    } else {
      columnMap.push({ expectedCol: expCol, actualCol: matchedActual });
    }
  }

  const expectedLowerSet = new Set(expectedCols.map((c) => c.toLowerCase()));
  const extraColumns = actualCols.filter((c) => !expectedLowerSet.has(c.toLowerCase()));

  const actualRows = actualResult?.allRows || actualResult?.rows || [];
  const expectedRows = expectedResult?.allRows || expectedResult?.rows || [];

  if (missingColumns.length > 0 || extraColumns.length > 0) {
    const parts = [];
    if (missingColumns.length > 0) {
      parts.push(`Faltan columnas esperadas: ${missingColumns.join(', ')}.`);
    }
    if (extraColumns.length > 0) {
      parts.push(`Sobran columnas no solicitadas: ${extraColumns.join(', ')}.`);
    }
    return {
      passed: false,
      reason: 'columns_mismatch',
      summary: parts.join(' '),
      expectedColumns: expectedCols,
      actualColumns: actualCols,
      missingColumns,
      extraColumns,
      expectedRowCount: expectedRows.length,
      actualRowCount: actualRows.length,
      missingRows: expectedRows.slice(0, 5),
      extraRows: actualRows.slice(0, 5),
      orderMismatch: false,
    };
  }

  // Match rows between actual and expected (up to tolerance 1e-6)
  const matchedActualIndices = new Set();
  const missingRows = [];

  for (let eIdx = 0; eIdx < expectedRows.length; eIdx++) {
    const expRow = expectedRows[eIdx];
    let foundIdx = -1;
    for (let aIdx = 0; aIdx < actualRows.length; aIdx++) {
      if (matchedActualIndices.has(aIdx)) continue;
      if (rowsEqual(actualRows[aIdx], expRow, columnMap, tolerance)) {
        foundIdx = aIdx;
        break;
      }
    }
    if (foundIdx !== -1) {
      matchedActualIndices.add(foundIdx);
    } else {
      missingRows.push(projectRowToCanonical(expRow, columnMap, 'expected'));
    }
  }

  const extraRows = [];
  for (let aIdx = 0; aIdx < actualRows.length; aIdx++) {
    if (!matchedActualIndices.has(aIdx)) {
      extraRows.push(projectRowToCanonical(actualRows[aIdx], columnMap, 'actual'));
    }
  }

  if (missingRows.length > 0 || extraRows.length > 0 || actualRows.length !== expectedRows.length) {
    const details = [];
    if (actualRows.length !== expectedRows.length) {
      details.push(`Filas esperadas: ${expectedRows.length} · Filas obtenidas: ${actualRows.length}.`);
    }
    if (missingRows.length > 0) {
      details.push(`${missingRows.length} fila(s) esperada(s) no aparecen en tu resultado.`);
    }
    if (extraRows.length > 0) {
      details.push(`${extraRows.length} fila(s) de tu resultado no coinciden con la referencia.`);
    }
    return {
      passed: false,
      reason: 'rows_mismatch',
      summary: details.join(' '),
      expectedColumns: expectedCols,
      actualColumns: actualCols,
      missingColumns: [],
      extraColumns: [],
      expectedRowCount: expectedRows.length,
      actualRowCount: actualRows.length,
      missingRows: missingRows.slice(0, 5),
      extraRows: extraRows.slice(0, 5),
      totalMissingCount: missingRows.length,
      totalExtraCount: extraRows.length,
      orderMismatch: false,
    };
  }

  if (orderMatters) {
    for (let i = 0; i < expectedRows.length; i++) {
      if (!rowsEqual(actualRows[i], expectedRows[i], columnMap, tolerance)) {
        return {
          passed: false,
          reason: 'order_mismatch',
          summary: `Las ${expectedRows.length} filas contienen los valores esperados, pero el orden no coincide. Revisa la cláusula ORDER BY.`,
          expectedColumns: expectedCols,
          actualColumns: actualCols,
          missingColumns: [],
          extraColumns: [],
          expectedRowCount: expectedRows.length,
          actualRowCount: actualRows.length,
          missingRows: expectedRows.slice(0, 5).map((r) => projectRowToCanonical(r, columnMap, 'expected')),
          extraRows: actualRows.slice(0, 5).map((r) => projectRowToCanonical(r, columnMap, 'actual')),
          orderMismatch: true,
        };
      }
    }
  }

  return {
    passed: true,
    reason: 'matched',
    summary: `Resultado verificado: ${actualRows.length} fila(s) y ${expectedCols.length} columna(s) coinciden con la referencia.`,
    expectedColumns: expectedCols,
    actualColumns: actualCols,
    missingColumns: [],
    extraColumns: [],
    expectedRowCount: expectedRows.length,
    actualRowCount: actualRows.length,
    missingRows: [],
    extraRows: [],
    orderMismatch: false,
  };
}

export async function gradeSqlPractice(userSql, practice, existingUserResult = null) {
  const referenceSql = practice?.expected || practice?.solution;
  if (!referenceSql) {
    throw new Error('Este ejercicio no define una consulta de referencia.');
  }

  const actualResult = existingUserResult || (await runSqlQuery(userSql, { maxRows: 200 }));
  const expectedResult = await runSqlQuery(referenceSql, { maxRows: 200 });

  const comparison = compareQueryResults(actualResult, expectedResult, {
    orderMatters: Boolean(practice?.orderMatters),
    tolerance: NUMERIC_TOLERANCE,
  });

  return {
    ...comparison,
    actualResult,
    expectedResult,
  };
}
