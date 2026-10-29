import {
  detectAgy,
  getAgyVersion,
  fetchAgyModels,
  getDefaultModels,
  runAgyPrompt,
  classifyCliError,
} from './agyRunner.js';

async function main() {
  console.log('=== Grano · Diagnóstico del puente IA (agy) ===');

  const detected = detectAgy();
  const defaults = getDefaultModels();

  console.log(`Ejecutable disponible : ${detected.hasAgy ? 'SÍ' : 'NO'}`);
  console.log(`Ruta detectada        : ${detected.agyBinPath || '(no encontrado)'}`);
  if (detected.configuredPath) {
    console.log(`GRANO_AGY_PATH        : ${detected.configuredPath}`);
  }

  if (!detected.hasAgy) {
    const info = classifyCliError({ code: 'AGY_NOT_FOUND' });
    console.error(`Error [${info.code}]: ${info.message}`);
    console.error(`Solución: ${info.fix}`);
    process.exitCode = 1;
    return;
  }

  const version = getAgyVersion(detected.agyBinPath);
  console.log(`Versión de agy        : ${version || 'desconocida'}`);
  console.log(`Modelo rápido (fast)  : ${defaults.fast}`);
  console.log(`Modelo profundo (deep): ${defaults.deep}`);

  try {
    const { models } = await fetchAgyModels({
      agyBinPath: detected.agyBinPath,
      force: true,
    });
    console.log(`\nModelos disponibles (${models.length}):`);
    for (const m of models) {
      console.log(`  - ${m.id.padEnd(26)} ${m.label}`);
    }
  } catch (err) {
    const info = classifyCliError(err);
    console.error(`\nNo se pudo obtener la lista de modelos [${info.code}]: ${info.message}`);
    console.error(`Solución: ${info.fix}`);
    process.exitCode = 1;
    return;
  }

  const testQuestion =
    'Responde en una sola frase breve en español: ¿qué es el grano (grain) de una tabla?';
  console.log(`\nEjecutando consulta de prueba con ${defaults.fast}...`);

  try {
    const result = await runAgyPrompt({
      prompt: testQuestion,
      model: defaults.fast,
      agyBinPath: detected.agyBinPath,
    });
    console.log(`Tiempo al primer token: ${result.firstTokenMs} ms (${(result.firstTokenMs / 1000).toFixed(2)} s)`);
    console.log(`Tiempo total          : ${result.durationMs} ms (${(result.durationMs / 1000).toFixed(2)} s)`);
    console.log(`Caracteres recibidos  : ${result.chars}`);
    console.log(`Respuesta             : ${result.text}`);
    console.log('\nResultado: OK');
  } catch (err) {
    const info = classifyCliError(err);
    console.error(`\nFallo en la consulta [${info.code}]: ${info.message}`);
    console.error(`Solución: ${info.fix}`);
    process.exitCode = 1;
  }
}

main();
