const lesson = {
  id: 'c1-python-05-cuaderno-a-script-cli',
  moduleId: 'c1-python',
  tracks: ['core'],
  level: 1,
  order: 5,
  title: 'Del cuaderno interactivo al script modular con pruebas',
  minutes: 20,
  prerequisites: ['c1-python-04-limpieza-texto-fechas-tz'],
  contentVersion: 1,

  hook: 'En Mercado Brisa (empresa ficticia), el cálculo diario de margen por tienda nació en un cuaderno `.ipynb` de 38 celdas. Cuando intentaron programarlo cada mañana a las 06:00 en un servidor, falló porque tenía la ruta fija `"C:/Users/carlos/Downloads/orders.parquet"`, dependía de una variable definida en la celda 29 que se usaba en la celda 12 y no tenía ninguna prueba que impidiera publicar márgenes negativos. ¿Cómo conviertes un análisis interactivo en un script CLI reproducible y probado con `pytest`?',

  objectives: [
    'Extraer la lógica de negocio de un cuaderno hacia funciones puras tipadas que reciben y devuelven tablas sin efectos secundarios.',
    'Parametrizar rutas de entrada, filtros y archivo de salida desde la terminal usando `argparse`, `pathlib.Path` y `logging`.',
    'Verificar el comportamiento ante datos anómalos mediante pruebas unitarias con `pytest` y `polars.testing.assert_frame_equal`.'
  ],

  sections: [
    {
      id: 'de-celdas-sueltas-a-funciones-puras',
      heading: 'Por qué separar las funciones puras de la lectura y escritura',
      body: 'Un cuaderno interactivo mezcla en un mismo flujo tres cosas distintas: leer archivos de disco, transformar tablas en memoria y mostrar gráficos por pantalla. Si intentas probar esa lógica en bloque, cada test necesita los archivos reales de producción en una ruta exacta.\n\nEl primer paso de refactorización consiste en aislar una **función pura de transformación tabular**. Es una función con anotaciones de tipos que recibe objetos `pl.LazyFrame` (o `pl.DataFrame`) en memoria y devuelve la tabla transformada. Nunca llama internamente a `read_parquet` ni a `write_parquet`.\n\nCuando la transformación es pura, el mismo código sirve para tres usos. Puedes importarlo dentro de un cuaderno reactivo Marimo para explorar. También puedes invocarlo desde un script de línea de comandos sobre los archivos reales. Y además puedes ejecutarlo en milisegundos dentro de `pytest` pasándole un `DataFrame` diminuto de 3 filas creado en memoria.',
      example: {
        language: 'python',
        code: `import polars as pl

def calcular_margen_tienda(
    lf_orders: pl.LazyFrame,
    lf_items: pl.LazyFrame,
    lf_products: pl.LazyFrame,
    lf_stores: pl.LazyFrame,
) -> pl.DataFrame:
    items_limpios = (
        lf_items.join(
            lf_products.filter(pl.col("list_price_usd") > 0),
            on="product_id",
            how="inner",
            validate="m:1",
        )
        .group_by("order_id")
        .agg(
            pl.col("qty").sum().alias("units_sold"),
            pl.col("line_total_usd").sum().alias("revenue_usd"),
            (pl.col("qty") * pl.col("unit_cost_usd")).sum().alias("cost_usd"),
        )
    )
    return (
        lf_orders.filter(pl.col("status") == "completed")
        .join(items_limpios, on="order_id", how="inner", validate="1:1")
        .join(lf_stores, on="store_id", how="inner", validate="m:1")
        .group_by(["store_code", "city"])
        .agg(
            pl.len().alias("completed_orders"),
            pl.col("units_sold").sum().alias("units_sold"),
            pl.col("revenue_usd").sum().round(2).alias("revenue_usd"),
            (pl.col("revenue_usd") - pl.col("cost_usd")).sum().round(2).alias("margin_usd"),
        )
        .with_columns((pl.col("margin_usd") * 100.0 / pl.col("revenue_usd")).round(2).alias("margin_pct"))
        .sort("margin_usd", descending=True)
        .head(5)
        .collect()
    )`,
        expectedOutput: [
          { store_code: 'STR-AR-01', city: 'Buenos Aires', completed_orders: 2811, units_sold: 12600, revenue_usd: 966754.24, margin_usd: 463356.09, margin_pct: 47.93 },
          { store_code: 'STR-PE-01', city: 'Lima', completed_orders: 2109, units_sold: 9916, revenue_usd: 769447.66, margin_usd: 368106.89, margin_pct: 47.84 },
          { store_code: 'WH-ES-01', city: 'Madrid', completed_orders: 1405, units_sold: 8885, revenue_usd: 684417.83, margin_usd: 327936.77, margin_pct: 47.91 },
          { store_code: 'STR-CL-02', city: 'Santiago', completed_orders: 1029, units_sold: 5974, revenue_usd: 452081.54, margin_usd: 217133.77, margin_pct: 48.03 },
          { store_code: 'STR-CO-01', city: 'Bogotá', completed_orders: 1406, units_sold: 5542, revenue_usd: 426853.75, margin_usd: 204262.2, margin_pct: 47.85 }
        ]
      }
    },
    {
      id: 'interfaz-cli-argparse-y-pathlib',
      heading: 'Cómo parametrizar rutas y fechas con argparse y pathlib.Path',
      body: 'Ningún script automatizable debe contener rutas absolutas del portátil de su autor ni fechas escritas a fuego. El módulo estándar `argparse` de Python permite definir argumentos de línea de comandos documentados (`--input-dir`, `--order-date`, `--output`). También valida esos parámetros al arrancar.\n\nCombina siempre `argparse` con `pathlib.Path` en lugar de concatenar cadenas con barras. Un objeto `Path("public/datasets") / "orders.parquet"` resuelve separadores de carpetas de forma idéntica en Windows, Linux y contenedores Docker.\n\nSustituye además los `print()` de depuración por el módulo `logging` (`logging.info(...)` y `logging.error(...)`). Incluye siempre el bloque de entrada `if __name__ == "__main__":`. Así el archivo puede ejecutarse con `uv run python resumen_ventas.py` sin disparar el proceso cuando otro archivo lo importe.'
    },
    {
      id: 'aserciones-calidad-antes-de-publicar',
      heading: 'Barreras de calidad bloqueantes antes de escribir el Parquet',
      body: 'Un archivo de entrada puede llegar vacío o un cambio aguas arriba puede corromper los precios. Lo peor que puede hacer tu script es sobrescribir el archivo Parquet de salida con datos rotos y terminar con código `0`.\n\nAntes de llamar a `.write_parquet()`, ejecuta comprobaciones invariantes sobre el `DataFrame` en memoria:\n\n1. Que el resultado no esté vacío (`if df.is_empty(): raise ValueError(...)`).\n2. Que ninguna columna clave (`store_code`, `order_date`) contenga valores nulos.\n3. Que las métricas cumplan sus límites de dominio (por ejemplo, `revenue_usd >= 0`).\n\nSi falla cualquiera de estas reglas, lanzar una excepción hace que Python devuelva un código de salida distinto de cero (`exit code != 0`). Eso detiene el orquestador antes de contaminar los reportes.'
    },
    {
      id: 'pruebas-unitarias-pytest-assert-frame-equal',
      heading: 'Pruebas unitarias deterministas con pytest y assert_frame_equal',
      body: 'Para probar una función tabular no debes comparar cadenas impresas por consola ni conectar con una base externa. En un archivo `test_resumen_ventas.py`, construye un `DataFrame` mínimo en memoria. Incluye tanto un caso válido como los casos borde de Mercado Brisa:\n\n- Un producto con precio negativo (`SKU-TEST-NEG`, `list_price_usd = -9.99`) que debe quedar excluido.\n- Un pedido con estado `"cancelled"` que no debe sumarse a las ventas completadas.\n\nLuego invoca tu función pura y compara el resultado contra el `DataFrame` esperado usando `from polars.testing import assert_frame_equal`. Esta función comprueba nombres de columnas, tipos exactos de Arrow (`Int64`, `Float64`, `String`) y valores numéricos con tolerancia decimal en menos de 20 milisegundos.',
      example: {
        language: 'python',
        code: `import polars as pl

# Ejecución parametrizada del script para el corte diario 2025-10-15
corte_diario = (
    pl.scan_parquet("public/datasets/orders.parquet")
    .filter((pl.col("status") == "completed") & (pl.col("order_date") == pl.date(2025, 10, 15)))
    .join(pl.scan_parquet("public/datasets/order_items.parquet"), on="order_id", how="inner")
    .join(
        pl.scan_parquet("public/datasets/products.parquet").filter(pl.col("list_price_usd") > 0),
        on="product_id",
        how="inner",
    )
    .join(pl.scan_parquet("public/datasets/stores.parquet"), on="store_id", how="inner")
    .group_by(["order_date", "store_code", "country_code"])
    .agg(
        pl.col("order_id").n_unique().alias("completed_orders"),
        pl.col("qty").sum().alias("total_units"),
        pl.col("line_total_usd").sum().round(2).alias("net_sales_usd"),
        (pl.col("line_total_usd") - (pl.col("qty") * pl.col("unit_cost_usd")))
        .sum()
        .round(2)
        .alias("gross_margin_usd"),
    )
    .sort("gross_margin_usd", descending=True)
    .head(5)
    .collect()
)`,
        expectedOutput: [
          { order_date: '2025-10-15', store_code: 'STR-PE-01', country_code: 'PE', completed_orders: 5, total_units: 27, net_sales_usd: 2068.26, gross_margin_usd: 987.62 },
          { order_date: '2025-10-15', store_code: 'STR-ES-01', country_code: 'ES', completed_orders: 3, total_units: 12, net_sales_usd: 1360.15, gross_margin_usd: 593.59 },
          { order_date: '2025-10-15', store_code: 'STR-MX-03', country_code: 'MX', completed_orders: 2, total_units: 14, net_sales_usd: 1232.05, gross_margin_usd: 582.86 },
          { order_date: '2025-10-15', store_code: 'STR-MX-02', country_code: 'MX', completed_orders: 2, total_units: 10, net_sales_usd: 1006.73, gross_margin_usd: 443.2 },
          { order_date: '2025-10-15', store_code: 'STR-CL-01', country_code: 'CL', completed_orders: 1, total_units: 6, net_sales_usd: 850.32, gross_margin_usd: 409.83 }
        ]
      }
    }
  ],

  workedExample: {
    title: 'Refactorización de cuaderno a script CLI con prueba en pytest',
    description: 'Observa el paso de un bloque monolítico acoplado a rutas locales hacia una función pura verificada con `assert_frame_equal` sobre el margen por tienda de Mercado Brisa.',
    audit: 'La prueba unitaria confirma que el producto `SKU-TEST-NEG` (-9.99 USD) y los pedidos cancelados se descartan antes de escribir el archivo Parquet.',
    steps: [
      {
        label: '1. Antipatrón: código de cuaderno con rutas fijas y sin validación',
        explanation: 'Este código solo funciona en la máquina de quien lo escribió, mezcla lectura y cálculo, y no falla con código de error si `SKU-TEST-NEG` contamina el resultado.',
        code: `# MAL: ruta local fija, sin argumentos CLI, sin funciones importables para pytest
import polars as pl

df1 = pl.read_parquet("C:/Users/carlos/Downloads/orders.parquet")
df2 = pl.read_parquet("C:/Users/carlos/Downloads/order_items.parquet")
df3 = pl.read_parquet("C:/Users/carlos/Downloads/products.parquet")
# No filtra list_price_usd > 0 ni valida que el resultado no esté vacío
res = df1.join(df2, on="order_id").join(df3, on="product_id")
print(res.head())`,
        expectedOutput: [
          {
            ejecucion_en_servidor: 'FileNotFoundError: C:/Users/carlos/Downloads/orders.parquet',
            testable_con_pytest: false,
            filtra_sku_negativo: false
          }
        ]
      },
      {
        label: '2. Solución verificada: CLI con argparse + función pura + test con assert_frame_equal',
        explanation: 'Separamos la función pura `resumir_tiendas()`, leemos rutas con `argparse` y `Path`, validamos que no haya ingresos negativos y verificamos el top 5 de tiendas de Mercado Brisa.',
        code: `from pathlib import Path
import argparse
import polars as pl
from polars.testing import assert_frame_equal

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Calcula margen por tienda de Mercado Brisa")
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()

def test_excluye_sku_negativo() -> None:
    df_prod = pl.DataFrame({
        "product_id": [1, 180],
        "sku": ["MB-CAF-001", "SKU-TEST-NEG"],
        "list_price_usd": [39.76, -9.99],
        "unit_cost_usd": [16.88, 0.0],
    })
    filtrado = df_prod.filter(pl.col("list_price_usd") > 0).select(["product_id", "sku"])
    esperado = pl.DataFrame({"product_id": [1], "sku": ["MB-CAF-001"]})
    assert_frame_equal(filtrado, esperado)`,
        expectedOutput: [
          { store_code: 'STR-AR-01', city: 'Buenos Aires', completed_orders: 2811, revenue_usd: 966754.24, margin_usd: 463356.09 },
          { store_code: 'STR-PE-01', city: 'Lima', completed_orders: 2109, revenue_usd: 769447.66, margin_usd: 368106.89 },
          { store_code: 'WH-ES-01', city: 'Madrid', completed_orders: 1405, revenue_usd: 684417.83, margin_usd: 327936.77 },
          { store_code: 'STR-CL-02', city: 'Santiago', completed_orders: 1029, revenue_usd: 452081.54, margin_usd: 217133.77 },
          { store_code: 'STR-CO-01', city: 'Bogotá', completed_orders: 1406, revenue_usd: 426853.75, margin_usd: 204262.2 }
        ]
      }
    ]
  },

  checks: [
    {
      id: 'c1',
      type: 'mcq',
      prompt: '¿Por qué conviene que tu función `calcular_margen(lf_orders, lf_items, lf_products)` reciba objetos `LazyFrame` o `DataFrame` en lugar de rutas de archivos en disco?',
      options: [
        {
          id: 'a',
          text: 'Porque permite probar la lógica en milisegundos con `pytest` pasándole tablas pequeñas en memoria sin depender de archivos externos.',
          correct: true,
          feedback: 'Exacto. Separar la entrada/salida (I/O) de la transformación pura hace que las pruebas unitarias sean rápidas, deterministas y sin efectos secundarios.'
        },
        {
          id: 'b',
          text: 'Porque Python prohíbe pasar objetos `pathlib.Path` como argumentos de una función.',
          correct: false,
          feedback: 'Incorrecto. Python permite pasar `Path` a cualquier función; la separación se hace para desacoplar el cálculo del sistema de archivos.'
        },
        {
          id: 'c',
          text: 'Porque un archivo `.py` no puede llamar a `pl.scan_parquet()`.',
          correct: false,
          feedback: 'Incorrecto. La función `main()` del script sí llama a `pl.scan_parquet()` y le pasa esos `LazyFrame` a la función pura.'
        }
      ],
      explanation: 'El patrón de núcleo funcional y cáscara imperativa coloca `scan_parquet` y `write_parquet` en `main()` y mantiene toda la lógica de negocio en funciones puras.'
    },
    {
      id: 'c2',
      type: 'mcq',
      prompt: 'En una prueba con `pytest`, quieres verificar que el `DataFrame` devuelto por tu función coincida en nombres de columna, tipos de datos Arrow y valores con la tabla `esperado`. ¿Qué función debes usar?',
      options: [
        {
          id: 'a',
          text: 'polars.testing.assert_frame_equal(resultado, esperado)',
          correct: true,
          feedback: 'Correcto. `assert_frame_equal` verifica el esquema completo, el orden y los valores numéricos mostrando exactamente qué celda o tipo difiere si falla.'
        },
        {
          id: 'b',
          text: 'assert str(resultado) == str(esperado)',
          correct: false,
          feedback: 'Incorrecto. Comparar la representación en texto depende del ancho de terminal, trunca filas y no valida tipos ni tolerancia decimal.'
        },
        {
          id: 'c',
          text: 'assert len(resultado) > 0',
          correct: false,
          feedback: 'Incorrecto. Comprobar que haya al menos una fila no detecta si los importes están multiplicados o los tipos son erróneos.'
        }
      ],
      explanation: '`polars.testing.assert_frame_equal` (y `pandas.testing.assert_frame_equal` en pandas) es la herramienta estándar para pruebas unitarias sobre tablas, ya que compara tanto los tipos columnares de Arrow como los valores numéricos.'
    },
    {
      id: 'c3',
      type: 'mcq',
      prompt: '¿Para qué se incluye la guarda `if __name__ == "__main__":` al final de `resumen_ventas.py`?',
      options: [
        {
          id: 'a',
          text: 'Para que el parseo de argumentos CLI y la lectura de archivos solo se ejecuten al correr el script desde la terminal, y no cuando `pytest` importe sus funciones.',
          correct: true,
          feedback: 'Exacto. Cuando `pytest` hace `from resumen_ventas import calcular_margen`, `__name__` no es `"__main__"` y no intenta leer argumentos de la línea de comandos.'
        },
        {
          id: 'b',
          text: 'Para activar el motor `streaming` de Polars 2.0.',
          correct: false,
          feedback: 'Incorrecto. El motor de Polars depende de `.collect()`, no del nombre del módulo en Python.'
        },
        {
          id: 'c',
          text: 'Para borrar automáticamente los archivos de entrada al terminar.',
          correct: false,
          feedback: 'Incorrecto. Esa condición solo controla si el archivo fue invocado como programa principal o importado como módulo.'
        }
      ],
      explanation: 'Sin la guarda `if __name__ == "__main__":`, importar cualquier función desde `test_resumen_ventas.py` ejecutaría inmediatamente `parser.parse_args()` y fallaría durante la recolección automática de pruebas en `pytest`.'
    },
    {
      id: 'c4',
      type: 'predict-output',
      prompt: 'Tu script CLI detecta que el DataFrame resultante quedó con `0` filas tras filtrar la fecha pedida y lanza `raise ValueError("Sin ventas completadas para la fecha")`. ¿Qué código de salida devuelve el proceso al sistema operativo?',
      options: [
        {
          id: 'a',
          text: 'Un código distinto de cero (por defecto `1`), lo que indica al orquestador o al CI/CD que la tarea falló y evita dar por bueno un archivo vacío.',
          correct: true,
          feedback: 'Correcto. En cualquier sistema operativo y orquestador (Airflow, Dagster, GitHub Actions), un código de salida distinto de `0` señala un fallo bloqueante.'
        },
        {
          id: 'b',
          text: 'El código `0`, porque Python siempre devuelve `0` aunque ocurra una excepción no capturada.',
          correct: false,
          feedback: 'Incorrecto. Una excepción no capturada termina el proceso con código de salida `1`.'
        },
        {
          id: 'c',
          text: 'Escribe igualmente el archivo Parquet vacío y continúa con la línea siguiente.',
          correct: false,
          feedback: 'Incorrecto. `raise ValueError` interrumpe la ejecución antes de llegar a `write_parquet`.'
        }
      ],
      explanation: 'Colocar validaciones bloqueantes antes de `write_parquet` impide publicar tablas vacías o corruptas y notifica al orquestador mediante un código de salida distinto de cero.'
    }
  ],

  practice: {
    type: 'fill-blanks',
    title: 'Script CLI reproducible con argparse y prueba unitaria en Polars',
    language: 'python',
    prompt: 'Completa el script modular `resumen_ventas.py` y su prueba unitaria para: 1) Recibir `--input-dir` como `Path` con `argparse`, 2) Verificar con `assert_frame_equal` el filtrado de `SKU-TEST-NEG`, y 3) Exportar el corte diario del `2025-10-15`.',
    starterCode: `from pathlib import Path
import argparse
import polars as pl
from polars.testing import {{blank_1}}

def filtrar_productos_validos(lf_products: pl.LazyFrame) -> pl.LazyFrame:
    return lf_products.filter(pl.col("list_price_usd") > 0)

def construir_parser() -> argparse.ArgumentParser:
    parser = argparse.{{blank_2}}(description="Margen diario por tienda de Mercado Brisa")
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser

def test_filtra_sku_negativo() -> None:
    df_crudo = pl.LazyFrame({
        "product_id": [1, 180],
        "sku": ["MB-CAF-001", "SKU-TEST-NEG"],
        "list_price_usd": [39.76, -9.99],
    })
    resultado = filtrar_productos_validos(df_crudo).{{blank_3}}()
    esperado = pl.DataFrame({
        "product_id": [1],
        "sku": ["MB-CAF-001"],
        "list_price_usd": [39.76],
    })
    assert_frame_equal(resultado, esperado)`,
    expected: `from pathlib import Path
import argparse
import polars as pl
from polars.testing import assert_frame_equal

def filtrar_productos_validos(lf_products: pl.LazyFrame) -> pl.LazyFrame:
    return lf_products.filter(pl.col("list_price_usd") > 0)

def construir_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Margen diario por tienda de Mercado Brisa")
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser

def test_filtra_sku_negativo() -> None:
    df_crudo = pl.LazyFrame({
        "product_id": [1, 180],
        "sku": ["MB-CAF-001", "SKU-TEST-NEG"],
        "list_price_usd": [39.76, -9.99],
    })
    resultado = filtrar_productos_validos(df_crudo).collect()
    esperado = pl.DataFrame({
        "product_id": [1],
        "sku": ["MB-CAF-001"],
        "list_price_usd": [39.76],
    })
    assert_frame_equal(resultado, esperado)`,
    orderMatters: true,
    hints: [
      'La función oficial de `polars.testing` para comparar dos DataFrames en una prueba unitaria es `assert_frame_equal`.',
      'En el módulo estándar `argparse`, la clase que define los argumentos de terminal es `ArgumentParser`.',
      'Como `filtrar_productos_validos` devuelve un `LazyFrame`, necesitas llamar a `.collect()` antes de pasarlo a `assert_frame_equal`.'
    ],
    solution: `from pathlib import Path
import argparse
import polars as pl
from polars.testing import assert_frame_equal

def filtrar_productos_validos(lf_products: pl.LazyFrame) -> pl.LazyFrame:
    return lf_products.filter(pl.col("list_price_usd") > 0)

def construir_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Margen diario por tienda de Mercado Brisa")
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    return parser

def test_filtra_sku_negativo() -> None:
    df_crudo = pl.LazyFrame({
        "product_id": [1, 180],
        "sku": ["MB-CAF-001", "SKU-TEST-NEG"],
        "list_price_usd": [39.76, -9.99],
    })
    resultado = filtrar_productos_validos(df_crudo).collect()
    esperado = pl.DataFrame({
        "product_id": [1],
        "sku": ["MB-CAF-001"],
        "list_price_usd": [39.76],
    })
    assert_frame_equal(resultado, esperado)`,
    solutionExplanation: 'Importa `assert_frame_equal` desde `polars.testing`, construye la CLI con `argparse.ArgumentParser` y materializa el `LazyFrame` de prueba con `.collect()`.',
    blanks: [
      {
        id: 'blank_1',
        label: 'Aserción de igualdad de DataFrames en Polars',
        correct: 'assert_frame_equal',
        options: ['assert_frame_equal', 'check_dict_match', 'print_diff'],
        hint: 'Función de polars.testing que compara esquemas, tipos y valores de dos DataFrames.'
      },
      {
        id: 'blank_2',
        label: 'Constructor del analizador de argumentos CLI',
        correct: 'ArgumentParser',
        options: ['ArgumentParser', 'CliReader', 'SysArgv'],
        hint: 'Clase principal del módulo estándar argparse de Python.'
      },
      {
        id: 'blank_3',
        label: 'Materializar LazyFrame para comparar en el test',
        correct: 'collect',
        options: ['collect', 'scan', 'write_csv'],
        hint: 'Ejecuta el LazyFrame en memoria y devuelve el DataFrame que recibe assert_frame_equal.'
      }
    ],
    expectedOutputTable: [
      { order_date: '2025-10-15', store_code: 'STR-PE-01', country_code: 'PE', completed_orders: 5, total_units: 27, net_sales_usd: 2068.26, gross_margin_usd: 987.62 },
      { order_date: '2025-10-15', store_code: 'STR-ES-01', country_code: 'ES', completed_orders: 3, total_units: 12, net_sales_usd: 1360.15, gross_margin_usd: 593.59 },
      { order_date: '2025-10-15', store_code: 'STR-MX-03', country_code: 'MX', completed_orders: 2, total_units: 14, net_sales_usd: 1232.05, gross_margin_usd: 582.86 },
      { order_date: '2025-10-15', store_code: 'STR-MX-02', country_code: 'MX', completed_orders: 2, total_units: 10, net_sales_usd: 1006.73, gross_margin_usd: 443.2 },
      { order_date: '2025-10-15', store_code: 'STR-CL-01', country_code: 'CL', completed_orders: 1, total_units: 6, net_sales_usd: 850.32, gross_margin_usd: 409.83 }
    ]
  },

  roleNotes: {
    de: 'Empaqueta cada proceso en funciones puras probadas en CI con `uv run pytest` antes de construir la imagen Docker o registrarlo como activo en Airflow 3 o Dagster. Exige que el script valide conteos y dominios antes de escribir el Parquet de salida.',
    da: 'Usa cuadernos reactivos como Marimo (que ya guardan archivos `.py` puros) para explorar y mueve las transformaciones estables a un módulo `transformaciones.py`. Así no tendrás que copiar y pegar celdas entre distintos análisis del equipo.',
    bi: 'Cuando un reporte ejecutivo dependa de un script previo en Python, exige que dicho script tenga pruebas automatizadas para los casos borde del catálogo (como `SKU-TEST-NEG`) y que registre en el log cuántas filas e ingresos totales exportó en cada corrida.'
  },

  summary: [
    'Separa las funciones puras de transformación tabular de la lectura y escritura de archivos en disco.',
    'Parametriza rutas y fechas desde la terminal con argparse y pathlib.Path dentro de if __name__ == "__main__":.',
    'Valida que el DataFrame resultante no esté vacío ni tenga nulos en claves antes de llamar a write_parquet.',
    'Prueba los casos borde en milisegundos con pytest y polars.testing.assert_frame_equal sobre datos en memoria.'
  ],

  flashcards: [
    {
      id: 'fc-c1-py-05-a',
      front: '¿Qué es una función pura de transformación tabular y por qué facilita las pruebas?',
      back: 'Es una función que recibe DataFrames/LazyFrames y devuelve otro sin hacer I/O en disco ni mutar variables globales, lo que permite probarla en RAM con pytest.'
    },
    {
      id: 'fc-c1-py-05-b',
      front: '¿Por qué debes usar `pathlib.Path` en lugar de concatenar rutas con `"\\"` o `"/"`?',
      back: 'Porque `Path` construye rutas multiplataforma que funcionan igual en Windows local y en contenedores Linux de producción.'
    },
    {
      id: 'fc-c1-py-05-c',
      front: '¿Qué ventaja tiene `polars.testing.assert_frame_equal` frente a un `assert` común en `pytest`?',
      back: 'Verifica nombres de columnas, tipos exactos de Arrow (`Int64`, `Float64`, `String`) y tolerancia numérica, detallando la diferencia exacta si falla.'
    },
    {
      id: 'fc-c1-py-05-d',
      front: '¿Por qué un script de datos debe lanzar una excepción (`exit code != 0`) si el resultado queda vacío antes de escribir el Parquet?',
      back: 'Para impedir que sobrescriba silenciosamente la tabla buena con un archivo vacío y para que el orquestador detecte y alerte el fallo.'
    }
  ],

  glossaryTerms: [
    'funcion-pura-transformacion',
    'polars-lazyframe',
    'validacion-cardinalidad-join'
  ],

  sources: [
    {
      title: 'Python 3.13 Standard Library — argparse: Parser for Command-Line Options and Arguments',
      url: 'https://docs.python.org/3/library/argparse.html',
      publisher: 'Python Software Foundation',
      accessed: '2026-10-29',
      supports: 'Definición de argumentos tipados por línea de comandos con ArgumentParser y pathlib.Path.'
    },
    {
      title: 'pytest Documentation — Good Integration Practices and Test Structure',
      url: 'https://docs.pytest.org/en/stable/explanation/goodpractices.html',
      publisher: 'pytest-dev',
      accessed: '2026-10-29',
      supports: 'Organización modular de funciones importables y ejecución automatizada de pruebas unitarias.'
    },
    {
      title: 'Polars API Reference — polars.testing.assert_frame_equal',
      url: 'https://docs.pola.rs/api/python/stable/reference/testing.html',
      publisher: 'Polars Project',
      accessed: '2026-10-29',
      supports: 'Comparación exacta de esquemas y valores entre DataFrames en pruebas automatizadas.'
    },
    {
      title: 'Marimo Documentation — Running Notebooks as Scripts and Reactive DAGs',
      url: 'https://docs.marimo.io/guides/scripts/',
      publisher: 'Marimo Team',
      accessed: '2026-10-29',
      supports: 'Transición directa entre exploración reactiva y ejecución por línea de comandos en archivos .py.'
    }
  ],

  aiNotes: 'Las personas que empiezan suelen meter `pl.read_parquet("ruta_fija")` dentro de la función que quieren probar con `pytest`, y luego no saben cómo pasarle datos de prueba. Guíalas siempre a pasar el `DataFrame` o `LazyFrame` como parámetro de la función.'
};

export default lesson;
