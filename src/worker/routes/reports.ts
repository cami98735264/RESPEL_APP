import { Hono } from "hono";
import type {
  EntryDetailReportRow,
  ExitDetailReportRow,
} from "@shared/types";
import { HttpError } from "../middleware/error";
import { reportQuerySchema } from "../schemas/report";

const reports = new Hono<{ Bindings: Env }>();

type Filter = { sql: string; binds: (string | number)[] };

function buildPeriodFilter(
  q: ReturnType<typeof reportQuerySchema.parse>
): Filter {
  const filters: string[] = [];
  const binds: (string | number)[] = [];
  filters.push("report_year = ?");
  binds.push(String(q.year));

  switch (q.period) {
    case "annual":
      break;
    case "semiannual":
      if (q.half === 1) filters.push("report_quarter IN (1, 2)");
      else filters.push("report_quarter IN (3, 4)");
      break;
    case "quarterly":
      filters.push("report_quarter = ?");
      binds.push(q.quarter!);
      break;
    case "daily": {
      const m = String(q.month!).padStart(2, "0");
      const d = String(q.day!).padStart(2, "0");
      filters.push("report_day = ?");
      binds.push(`${q.year}-${m}-${d}`);
      break;
    }
  }

  if (q.generator_id) {
    filters.push("generator_id = ?");
    binds.push(q.generator_id);
  }

  return { sql: filters.join(" AND "), binds };
}

reports.get("/entries", async (c) => {
  const parsed = reportQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams)
  );
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Consulta invalida");
  }
  const { sql, binds } = buildPeriodFilter(parsed.data);
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM v_entry_detail_report WHERE ${sql} ORDER BY recorded_at DESC`
  )
    .bind(...binds)
    .all<EntryDetailReportRow>();
  return c.json(results ?? []);
});

reports.get("/exits", async (c) => {
  const parsed = reportQuerySchema.safeParse(
    Object.fromEntries(new URL(c.req.url).searchParams)
  );
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Consulta invalida");
  }
  const { sql, binds } = buildPeriodFilter(parsed.data);
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM v_exit_detail_report WHERE ${sql} ORDER BY dispatched_at DESC`
  )
    .bind(...binds)
    .all<ExitDetailReportRow>();
  return c.json(results ?? []);
});

export default reports;
