import type { HazardCode, Waste, WasteEntry, WasteExit } from "@shared/types";
import { HttpError } from "../middleware/error";
import { recalculateCategory } from "./categoryRecalc";
import type { GeneratorCategoryAlert } from "@shared/types";
import { buildEvent, notify } from "./notify";

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const nowIso = (): string => new Date().toISOString();

async function getHazardIdByCode(
  db: D1Database,
  code: HazardCode
): Promise<number> {
  const row = await db
    .prepare("SELECT id FROM hazard_characteristic WHERE code = ?")
    .bind(code)
    .first<{ id: number }>();
  if (!row) {
    throw new HttpError(
      400,
      `Codigo de peligrosidad desconocido: ${code}`,
      "unknown_hazard"
    );
  }
  return row.id;
}

export async function upsertWaste(
  db: D1Database,
  args: {
    generator_id: number;
    name: string;
    hazard_characteristic_id: number;
  }
): Promise<Waste> {
  const existing = await db
    .prepare(
      `SELECT * FROM waste
       WHERE generator_id = ? AND name = ? AND hazard_characteristic_id = ?`
    )
    .bind(args.generator_id, args.name, args.hazard_characteristic_id)
    .first<Waste>();
  if (existing) return existing;

  const now = nowIso();
  const inserted = await db
    .prepare(
      `INSERT INTO waste
        (generator_id, name, hazard_characteristic_id, current_stock_kg, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?)
       RETURNING *`
    )
    .bind(args.generator_id, args.name, args.hazard_characteristic_id, now, now)
    .first<Waste>();
  if (!inserted) {
    throw new HttpError(
      500,
      "No se pudo registrar el residuo",
      "waste_upsert_failed"
    );
  }
  return inserted;
}

export interface InsertEntryInput {
  generator_id: number;
  name: string;
  hazard_code: HazardCode;
  weight_kg: number;
  recorded_at?: string;
  sensor_reading_ref?: string | null;
  source_description?: string | null;
  notes?: string | null;
}

export interface InsertEntryResult {
  entry: WasteEntry;
  waste: Waste;
  categoryAlert: GeneratorCategoryAlert | null;
}

export async function insertWasteEntry(
  env: Env,
  input: InsertEntryInput
): Promise<InsertEntryResult> {
  const db = env.DB;
  const now = nowIso();
  const recordedAt = input.recorded_at ?? now;
  const weight = round3(input.weight_kg);

  const hazardId = await getHazardIdByCode(db, input.hazard_code);
  const waste = await upsertWaste(db, {
    generator_id: input.generator_id,
    name: input.name,
    hazard_characteristic_id: hazardId,
  });

  const firstEntryAt = waste.first_entry_at ?? recordedAt;

  const [insertResult, _updateResult] = await db.batch([
    db
      .prepare(
        `INSERT INTO waste_entry
          (waste_id, generator_id, sensor_reading_ref, weight_kg, recorded_at, source_description, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(
        waste.id,
        input.generator_id,
        input.sensor_reading_ref ?? null,
        weight,
        recordedAt,
        input.source_description ?? null,
        input.notes ?? null
      ),
    db
      .prepare(
        `UPDATE waste
         SET current_stock_kg = current_stock_kg + ?,
             first_entry_at   = COALESCE(first_entry_at, ?),
             updated_at       = ?
         WHERE id = ?`
      )
      .bind(weight, firstEntryAt, now, waste.id),
  ]);

  const entry = (insertResult.results as WasteEntry[])[0];
  if (!entry) {
    throw new HttpError(
      500,
      "La insercion no devolvio registros",
      "entry_insert_failed"
    );
  }

  const refreshedWaste = await db
    .prepare("SELECT * FROM waste WHERE id = ?")
    .bind(waste.id)
    .first<Waste>();

  const categoryAlert = await recalculateCategory(
    db,
    input.generator_id,
    recordedAt
  );

  const finalWaste = refreshedWaste ?? waste;

  await notify(
    env,
    buildEvent({
      kind: "entry.created",
      generator_id: input.generator_id,
      payload: {
        entry_id: entry.id,
        waste_id: finalWaste.id,
        waste_name: finalWaste.name,
        weight_kg: weight,
      },
    })
  );

  if (categoryAlert) {
    await notify(
      env,
      buildEvent({
        kind: "alert.category.created",
        generator_id: categoryAlert.generator_id,
        payload: categoryAlert,
      })
    );
  }

  return { entry, waste: finalWaste, categoryAlert };
}

export interface InsertExitInput {
  waste_id: number;
  generator_id: number;
  receptor_id: number;
  weight_kg: number;
  dispatched_at?: string;
  manifesto_number?: string | null;
  disposal_method?: string | null;
  receptor_certificate_ref?: string | null;
  certificate_issued_at?: string | null;
  notes?: string | null;
}

export async function insertWasteExit(
  env: Env,
  input: InsertExitInput
): Promise<{ exit: WasteExit; waste: Waste }> {
  const db = env.DB;
  const now = nowIso();
  const dispatchedAt = input.dispatched_at ?? now;
  const weight = round3(input.weight_kg);

  const receptor = await db
    .prepare("SELECT is_active FROM authorized_receptor WHERE id = ?")
    .bind(input.receptor_id)
    .first<{ is_active: number }>();
  if (!receptor) {
    throw new HttpError(404, "Gestor no encontrado", "receptor_not_found");
  }
  if (receptor.is_active !== 1) {
    throw new HttpError(
      422,
      `El gestor ${input.receptor_id} no esta activo`,
      "receptor_inactive"
    );
  }

  const waste = await db
    .prepare("SELECT * FROM waste WHERE id = ?")
    .bind(input.waste_id)
    .first<Waste>();
  if (!waste) {
    throw new HttpError(404, "Residuo no encontrado", "waste_not_found");
  }
  if (waste.generator_id !== input.generator_id) {
    throw new HttpError(
      422,
      "El residuo no pertenece a este generador",
      "waste_generator_mismatch"
    );
  }
  if (waste.current_stock_kg < weight) {
    throw new HttpError(
      422,
      `Stock insuficiente para el residuo ${input.waste_id}. Disponible: ${waste.current_stock_kg} kg, solicitado: ${weight} kg.`,
      "insufficient_stock"
    );
  }

  const [insertResult, _updateResult] = await db.batch([
    db
      .prepare(
        `INSERT INTO waste_exit
          (waste_id, generator_id, receptor_id, weight_kg, dispatched_at,
           manifesto_number, disposal_method, receptor_certificate_ref,
           certificate_issued_at, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(
        input.waste_id,
        input.generator_id,
        input.receptor_id,
        weight,
        dispatchedAt,
        input.manifesto_number ?? null,
        input.disposal_method ?? null,
        input.receptor_certificate_ref ?? null,
        input.certificate_issued_at ?? null,
        input.notes ?? null
      ),
    db
      .prepare(
        `UPDATE waste
         SET current_stock_kg = current_stock_kg - ?,
             updated_at       = ?
         WHERE id = ?`
      )
      .bind(weight, now, input.waste_id),
  ]);

  const exit = (insertResult.results as WasteExit[])[0];
  if (!exit) {
    throw new HttpError(
      500,
      "La insercion no devolvio registros",
      "exit_insert_failed"
    );
  }

  const refreshedWaste = await db
    .prepare("SELECT * FROM waste WHERE id = ?")
    .bind(input.waste_id)
    .first<Waste>();

  await notify(
    env,
    buildEvent({
      kind: "exit.created",
      generator_id: input.generator_id,
      payload: {
        exit_id: exit.id,
        waste_id: input.waste_id,
        weight_kg: weight,
        receptor_id: input.receptor_id,
      },
    })
  );

  return { exit, waste: refreshedWaste ?? waste };
}
