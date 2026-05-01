import type { GeneratorCategoryAlert } from "@shared/types";

const nowIso = (): string => new Date().toISOString();

export async function recalculateCategory(
  db: D1Database,
  generatorId: number,
  recordedAt: string
): Promise<GeneratorCategoryAlert | null> {
  const now = nowIso();
  const triggerMonth = recordedAt.substring(0, 7) + "-01";

  const monthly = await db
    .prepare(
      `SELECT strftime('%Y-%m', recorded_at) AS mo,
              SUM(weight_kg)                 AS monthly_kg
       FROM waste_entry
       WHERE generator_id = ?
         AND recorded_at >= date(?, 'start of month', '-6 months')
         AND recorded_at <  date(?, 'start of month')
       GROUP BY strftime('%Y-%m', recorded_at)`
    )
    .bind(generatorId, triggerMonth, triggerMonth)
    .all<{ mo: string; monthly_kg: number }>();

  const months = monthly.results ?? [];
  if (months.length === 0) return null;

  const rollingAvg =
    months.reduce((s, r) => s + r.monthly_kg, 0) / months.length;

  const matchedCategory = await db
    .prepare(
      `SELECT id FROM generator_category
       WHERE ? >= min_kg_month
         AND (max_kg_month IS NULL OR ? < max_kg_month)
       LIMIT 1`
    )
    .bind(rollingAvg, rollingAvg)
    .first<{ id: number }>();

  if (!matchedCategory) return null;

  const generator = await db
    .prepare("SELECT current_category_id FROM generator WHERE id = ?")
    .bind(generatorId)
    .first<{ current_category_id: number | null }>();

  if (!generator) return null;
  if (generator.current_category_id === matchedCategory.id) return null;

  const [_updateResult, alertResult] = await db.batch([
    db
      .prepare(
        `UPDATE generator
         SET current_category_id = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(matchedCategory.id, now, generatorId),
    db
      .prepare(
        `INSERT INTO generator_category_alert
          (generator_id, previous_category_id, new_category_id,
           trigger_month, rolling_avg_kg, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(
        generatorId,
        generator.current_category_id ?? null,
        matchedCategory.id,
        triggerMonth,
        rollingAvg,
        now
      ),
  ]);

  const inserted = (alertResult.results as GeneratorCategoryAlert[])[0];
  return inserted ?? null;
}
