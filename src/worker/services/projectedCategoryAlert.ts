import type { ProjectedCategoryAlert } from "@shared/types";

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const nowIso = (): string => new Date().toISOString();

interface CategoryRow {
  id: number;
  min_kg_month: number;
}

export async function createProjectedCategoryAlert(
  db: D1Database,
  generatorId: number,
  recordedAt: string
): Promise<ProjectedCategoryAlert | null> {
  const triggerMonth = recordedAt.substring(0, 7) + "-01";

  const monthly = await db
    .prepare(
      `SELECT strftime('%Y-%m', recorded_at) AS mo,
              SUM(weight_kg)                 AS monthly_kg
       FROM waste_entry
       WHERE generator_id = ?
         AND recorded_at >= date(?, 'start of month', '-5 months')
         AND recorded_at <  date(?, 'start of month', '+1 month')
       GROUP BY strftime('%Y-%m', recorded_at)`
    )
    .bind(generatorId, triggerMonth, triggerMonth)
    .all<{ mo: string; monthly_kg: number }>();

  const months = monthly.results ?? [];
  if (months.length === 0) return null;

  const projectedRollingAvg = round3(
    months.reduce((sum, row) => sum + row.monthly_kg, 0) / months.length
  );
  const monthKey = recordedAt.substring(0, 7);
  const currentMonth = months.find((row) => row.mo === monthKey);
  const monthTotal = round3(currentMonth?.monthly_kg ?? 0);

  const projectedCategory = await db
    .prepare(
      `SELECT id, min_kg_month
       FROM generator_category
       WHERE ? >= min_kg_month
         AND (max_kg_month IS NULL OR ? < max_kg_month)
       LIMIT 1`
    )
    .bind(projectedRollingAvg, projectedRollingAvg)
    .first<CategoryRow>();
  if (!projectedCategory) return null;

  const generator = await db
    .prepare("SELECT current_category_id FROM generator WHERE id = ?")
    .bind(generatorId)
    .first<{ current_category_id: number | null }>();
  if (!generator) return null;
  if (generator.current_category_id === projectedCategory.id) return null;

  const existing = await db
    .prepare(
      `SELECT * FROM projected_category_alert
       WHERE generator_id = ?
         AND trigger_month = ?
         AND projected_category_id = ?
         AND acknowledged = 0
       ORDER BY id DESC
       LIMIT 1`
    )
    .bind(generatorId, triggerMonth, projectedCategory.id)
    .first<ProjectedCategoryAlert>();
  if (existing) return existing;

  const thresholdKg = round3(projectedCategory.min_kg_month);
  const exceededByKg = round3(Math.max(projectedRollingAvg - thresholdKg, 0));
  const now = nowIso();

  const inserted = await db
    .prepare(
      `INSERT INTO projected_category_alert (
          generator_id,
          current_category_id,
          projected_category_id,
          trigger_month,
          month_total_kg,
          projected_rolling_avg_kg,
          threshold_kg,
          exceeded_by_kg,
          created_at,
          whatsapp_status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
       RETURNING *`
    )
    .bind(
      generatorId,
      generator.current_category_id ?? null,
      projectedCategory.id,
      triggerMonth,
      monthTotal,
      projectedRollingAvg,
      thresholdKg,
      exceededByKg,
      now
    )
    .first<ProjectedCategoryAlert>();

  return inserted ?? null;
}
