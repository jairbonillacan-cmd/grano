# Dataset Mercado Brisa

Dataset sintético determinista para el laboratorio SQL de **Grano**. Modela la operación omnicanal de **Mercado Brisa** (tostadores de café de especialidad, equipamiento para baristas, suscripciones y tiendas físicas en Latinoamérica e Iberia).

- **Semilla PRNG fija**: `19870315`
- **Tamaño total en Parquet (ZSTD)**: 2.14 MB (2.245.222 bytes)
- **Total de tablas**: 13

## Catálogo de tablas y grano declarado

| Tabla | Filas | Tamaño (KB) | Grano (1 fila = ...) | Columnas principales |
| --- | ---: | ---: | --- | --- |
| `customers` | 2400 | 18.5 | 1 fila = 1 cliente actual (snapshot) | `customer_id` (INTEGER), `full_name` (VARCHAR), `email` (VARCHAR), `country_code` (VARCHAR), `city` (VARCHAR), `postal_code` (VARCHAR), `segment` (VARCHAR), `acquisition_channel` (VARCHAR), `signup_date` (DATE), `is_active` (BOOLEAN), `current_tier` (VARCHAR) |
| `customer_changes` | 4100 | 30.9 | 1 fila = 1 versión histórica SCD2 de cliente (valid_from, valid_to, is_current) | `change_id` (INTEGER), `customer_id` (INTEGER), `country_code` (VARCHAR), `segment` (VARCHAR), `tier` (VARCHAR), `valid_from` (TIMESTAMP), `valid_to` (TIMESTAMP), `is_current` (BOOLEAN) |
| `products` | 180 | 5.2 | 1 fila = 1 SKU con categoría, coste y precio de lista | `product_id` (INTEGER), `sku` (VARCHAR), `product_name` (VARCHAR), `category` (VARCHAR), `subcategory` (VARCHAR), `brand` (VARCHAR), `unit_cost_usd` (DOUBLE), `list_price_usd` (DOUBLE), `is_active` (BOOLEAN), `launch_date` (DATE) |
| `orders` | 18.000 | 384.1 | 1 fila = 1 pedido con customer_id, order_ts, status, store_id | `order_id` (INTEGER), `customer_id` (INTEGER), `store_id` (INTEGER), `order_ts` (TIMESTAMP), `order_date` (DATE), `status` (VARCHAR), `currency` (VARCHAR), `subtotal_usd` (DOUBLE), `discount_usd` (DOUBLE), `shipping_usd` (DOUBLE), `tax_usd` (DOUBLE), `total_usd` (DOUBLE), `campaign_id` (VARCHAR), `device_type` (VARCHAR) |
| `order_items` | 42.000 | 232.9 | 1 fila = 1 línea de pedido (order_id, product_id, qty, unit_price_usd, discount_usd) | `order_item_id` (INTEGER), `order_id` (INTEGER), `line_number` (INTEGER), `product_id` (INTEGER), `qty` (INTEGER), `unit_price_usd` (DOUBLE), `discount_usd` (DOUBLE), `line_total_usd` (DOUBLE) |
| `payments` | 19.200 | 272.0 | 1 fila = 1 intento de cobro (incluye reintentos fallidos y duplicados) | `payment_id` (INTEGER), `order_id` (INTEGER), `attempt_number` (INTEGER), `payment_method` (VARCHAR), `provider` (VARCHAR), `status` (VARCHAR), `amount_usd` (DOUBLE), `payment_ts` (TIMESTAMP), `idempotency_key` (VARCHAR) |
| `refunds` | 1450 | 22.9 | 1 fila = 1 devolución parcial o total asociada a order_id | `refund_id` (INTEGER), `order_id` (INTEGER), `refund_ts` (TIMESTAMP), `refund_date` (DATE), `reason` (VARCHAR), `refund_amount_usd` (DOUBLE), `status` (VARCHAR) |
| `events` | 65.000 | 1074.0 | 1 fila = 1 evento web/app (session_id, user_id, event_type, event_ts, payload_json) | `event_id` (VARCHAR), `session_id` (VARCHAR), `customer_id` (INTEGER), `user_id` (INTEGER), `event_type` (VARCHAR), `event_ts` (TIMESTAMP), `event_ts_raw` (VARCHAR), `timezone_offset` (VARCHAR), `device_type` (VARCHAR), `campaign_id` (VARCHAR), `product_id` (INTEGER), `payload_json` (VARCHAR) |
| `marketing_spend` | 730 | 8.8 | 1 fila = 1 día × canal con gasto e impresiones | `spend_date` (DATE), `channel` (VARCHAR), `campaign_id` (VARCHAR), `region` (VARCHAR), `spend_usd` (DOUBLE), `impressions` (INTEGER), `clicks` (INTEGER), `attributed_conversions` (INTEGER) |
| `experiments` | 6 | 2.7 | 1 fila = 1 experimento A/B con fechas e hipótesis | `experiment_id` (INTEGER), `experiment_code` (VARCHAR), `experiment_name` (VARCHAR), `hypothesis` (VARCHAR), `primary_metric` (VARCHAR), `start_date` (DATE), `end_date` (DATE), `status` (VARCHAR), `target_sample_size` (INTEGER), `srm_p_value` (DOUBLE) |
| `experiment_assignments` | 9600 | 132.1 | 1 fila = 1 usuario asignado a variante (control / treatment) | `assignment_id` (INTEGER), `experiment_id` (INTEGER), `customer_id` (INTEGER), `variant` (VARCHAR), `assigned_ts` (TIMESTAMP), `pre_experiment_spend_usd` (DOUBLE), `post_experiment_spend_usd` (DOUBLE), `converted` (BOOLEAN) |
| `stores` | 14 | 2.2 | 1 fila = 1 tienda física o almacén logístico regional | `store_id` (INTEGER), `store_code` (VARCHAR), `store_name` (VARCHAR), `store_type` (VARCHAR), `country_code` (VARCHAR), `region` (VARCHAR), `city` (VARCHAR), `opened_date` (DATE), `monthly_target_usd` (DOUBLE), `area_sqm` (INTEGER) |
| `calendar` | 1095 | 6.0 | 1 fila = 1 día natural con festivos, trimestre fiscal y semana ISO | `calendar_date` (DATE), `year` (INTEGER), `quarter` (INTEGER), `fiscal_quarter` (VARCHAR), `month` (INTEGER), `month_name` (VARCHAR), `iso_week` (INTEGER), `day_of_week` (INTEGER), `day_name` (VARCHAR), `is_weekend` (BOOLEAN), `is_holiday` (BOOLEAN), `holiday_name` (VARCHAR), `season` (VARCHAR) |

## Anomalías e imperfecciones intencionales para ejercicios

El dataset incluye errores realistas diseñados para las prácticas de modelado, calidad de datos, deduplicación y aislamiento de grano:

1. **Fan-out `1:N` entre cabecera y detalle (`orders` -> `order_items` y `orders` -> `refunds`)**: Un pedido tiene entre 1 y 4 líneas en `order_items` (42.000 líneas para 18.000 pedidos) y existen 300 pedidos con múltiples devoluciones parciales en `refunds` (1.450 filas). Hacer un `JOIN` directo sin preagregar en CTEs infla `SUM(total_usd)` y `SUM(refund_amount_usd)`.
2. **Duplicados por reintento de red y webhooks (`payments` y `events`)**:
   - En `payments` (19.200 filas para 18.000 pedidos) existen 750 reintentos legítimos (`attempt_number = 2` tras un intento `failed`) y **450 filas duplicadas por reenvío de webhook** que comparten exactamente el mismo `idempotency_key` y `order_id` con apenas 4 segundos de diferencia.
   - En `events` (65.000 filas) las primeras 1.200 sesiones web emitieron un evento duplicado idéntico (`event_id`, `session_id`, `event_type`).
3. **Valores `NULL` y códigos postales incompletos (`customers`, `orders`, `events`)**:
   - En `customers`, ~9% de los registros tienen `postal_code IS NULL` y ~6% tienen un prefijo postal truncado de 2 caracteres.
   - En `events`, el 15% de los eventos corresponden a navegación anónima (`customer_id IS NULL` y `user_id IS NULL`), y los eventos `page_view` tienen `product_id IS NULL`.
   - En `orders`, un tercio de los pedidos orgánicos tienen `campaign_id IS NULL`.
4. **Timestamps con mezcla de zonas horarias (`events.event_ts_raw` y `timezone_offset`)**: Mientras `event_ts` está normalizado en UTC, `event_ts_raw` conserva la cadena cruda emitida por el cliente con mezcla de sufijos `Z`, `-06:00`, `-05:00`, `-03:00` y `+01:00`.
5. **SKU de prueba con precio negativo (`products` y `order_items`)**: El producto `product_id = 180` (`sku = 'SKU-TEST-NEG'`, *"Producto de prueba calibración POS (no vender)"*) tiene `list_price_usd = -9.99` y aparece en 15 pedidos cancelados de calibración.
6. **Desbalance de muestreo SRM (`experiments` y `experiment_assignments`)**: Los experimentos 1 a 5 tienen reparto equilibrado 50/50 (800 `control` / 800 `treatment`), mientras que el experimento 6 (`EXP-PUSH-CART`) presenta un sesgo SRM severo (980 `control` vs 620 `treatment`, `srm_p_value = 0.0001`).
