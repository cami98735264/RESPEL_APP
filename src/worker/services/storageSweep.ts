const nowIso = (): string => new Date().toISOString();

export async function checkStorageLimits(db: D1Database): Promise<number> {
  const now = nowIso();

  const candidates = await db
    .prepare(
      `SELECT w.id           AS waste_id,
              w.generator_id,
              w.first_entry_at,
              date(w.first_entry_at, '+365 days') AS deadline_date
       FROM waste w
       WHERE w.current_stock_kg > 0
         AND w.first_entry_at IS NOT NULL
         AND date(w.first_entry_at, '+365 days') <= date('now', '+30 days')
         AND NOT EXISTS (
               SELECT 1 FROM storage_limit_alert sla
               WHERE sla.waste_id = w.id AND sla.resolved = 0
             )`
    )
    .all<{
      waste_id: number;
      generator_id: number;
      first_entry_at: string;
      deadline_date: string;
    }>();

  const rows = candidates.results ?? [];
  if (rows.length === 0) return 0;

  await db.batch(
    rows.map((row) =>
      db
        .prepare(
          `INSERT INTO storage_limit_alert
            (waste_id, generator_id, first_entry_at, deadline_date, alerted_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(row.waste_id, row.generator_id, row.first_entry_at, row.deadline_date, now)
    )
  );
  return rows.length;
}
