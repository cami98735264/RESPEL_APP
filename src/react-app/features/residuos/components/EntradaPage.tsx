import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BellRing, ChevronRight, Scale, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Banner } from "@/shared/ui/banner";
import { HazardBadge } from "@/shared/ui/hazard-badge";
import { PageHeader } from "@/shared/layout/PageHeader";
import { useGenerator } from "@/shared/layout/GeneratorContext";
import { ApiError } from "@/shared/lib/api";
import { HAZARD_CODES, type HazardCode } from "@shared/types";
import {
  lookupsService,
  wasteEntriesService,
  wastesService,
} from "../services/residuos.service";
import type {
  GeneratorCategoryAlert,
  HazardCharacteristic,
  WasteWithHazard,
} from "@shared/types";

const entradaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  hazard_code: z.enum(HAZARD_CODES, { error: "Selecciona una caracteristica" }),
  weight_kg: z
    .number({ error: "Ingresa un peso valido" })
    .positive("El peso debe ser mayor a 0"),
});

type EntradaFormValues = z.infer<typeof entradaSchema>;

const CATEGORY_LABEL: Record<number, string> = {
  1: "Pequeno",
  2: "Mediano",
  3: "Grande",
};

const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export default function EntradaPage() {
  const { generator, loading: genLoading, refresh: refreshGenerator } =
    useGenerator();
  const [hazards, setHazards] = useState<HazardCharacteristic[]>([]);
  const [wastes, setWastes] = useState<WasteWithHazard[]>([]);
  const [categoryAlert, setCategoryAlert] =
    useState<GeneratorCategoryAlert | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaFormValues>({
    resolver: zodResolver(entradaSchema),
  });

  useEffect(() => {
    lookupsService.getHazardCharacteristics().then(setHazards).catch(() => {
      setSubmitError("No se pudieron cargar las caracteristicas");
    });
  }, []);

  useEffect(() => {
    if (!generator) return;
    wastesService
      .list({ generatorId: generator.id })
      .then(setWastes)
      .catch(() => {
        /* non-fatal */
      });
  }, [generator]);

  const totalStock = useMemo(
    () => wastes.reduce((sum, w) => sum + w.current_stock_kg, 0),
    [wastes],
  );

  const recentWastes = useMemo(
    () =>
      [...wastes]
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime(),
        )
        .slice(0, 5),
    [wastes],
  );

  async function onSubmit(data: EntradaFormValues) {
    if (!generator) return;
    setSubmitError(null);
    setSubmitOk(null);
    try {
      const res = await wasteEntriesService.create({
        generator_id: generator.id,
        name: data.nombre,
        hazard_code: data.hazard_code as HazardCode,
        weight_kg: data.weight_kg,
        recorded_at: new Date().toISOString(),
      });

      setSubmitOk(
        `Entrada registrada: ${NUM.format(data.weight_kg)} kg de "${data.nombre}".`,
      );
      reset();
      if (res.categoryAlert) {
        setCategoryAlert(res.categoryAlert);
      }
      const refreshed = await wastesService.list({ generatorId: generator.id });
      setWastes(refreshed);
      refreshGenerator();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar la entrada";
      setSubmitError(msg);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operacion · Entradas"
        title="Registrar Entrada"
        description="Captura el residuo recibido del sensor de basculas. La categoria del generador se recalcula automaticamente."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Datos del residuo</CardTitle>
            <p className="text-xs text-muted-foreground">
              Decreto 4741/2005 · Caracteristicas CRETIB-R
            </p>
          </CardHeader>
          <div className="space-y-5 px-6 py-6">
            {categoryAlert && (
              <Banner
                tone="warning"
                title="Categoria del generador actualizada"
                icon={BellRing}
                onDismiss={() => setCategoryAlert(null)}
              >
                {CATEGORY_LABEL[categoryAlert.previous_category_id ?? 0] ??
                  "Sin categoria previa"}{" "}
                <ChevronRight className="inline h-3 w-3 align-middle" />{" "}
                <span className="font-semibold">
                  Generador{" "}
                  {CATEGORY_LABEL[categoryAlert.new_category_id] ?? "—"}
                </span>{" "}
                · promedio 6m{" "}
                <span className="tabular-figures">
                  {NUM.format(categoryAlert.rolling_avg_kg)}
                </span>{" "}
                kg/mes
              </Banner>
            )}

            {submitOk && (
              <Banner tone="success" onDismiss={() => setSubmitOk(null)}>
                {submitOk}
              </Banner>
            )}

            {submitError && (
              <Banner tone="error" onDismiss={() => setSubmitError(null)}>
                {submitError}
              </Banner>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre del residuo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej. Aceite mineral usado"
                  autoComplete="off"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-xs text-destructive">
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Caracteristica de peligrosidad</Label>
                  <Controller
                    control={control}
                    name="hazard_code"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {hazards.map((h) => (
                            <SelectItem key={h.code} value={h.code}>
                              {h.name_es} ({h.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.hazard_code && (
                    <p className="text-xs text-destructive">
                      {errors.hazard_code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weight_kg">Peso</Label>
                  <div className="relative">
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pr-10 font-mono tabular-figures"
                      {...register("weight_kg", { valueAsNumber: true })}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      kg
                    </span>
                  </div>
                  {errors.weight_kg && (
                    <p className="text-xs text-destructive">
                      {errors.weight_kg.message}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || genLoading || !generator}
              >
                {isSubmitting ? "Registrando..." : "Registrar Entrada"}
              </Button>
            </form>
          </div>
        </Card>

        {/* Side panel: live context */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Scale className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Stock total acumulado
                </p>
                <p className="font-display tabular-figures mt-1.5 text-3xl font-semibold leading-none text-foreground">
                  {NUM.format(totalStock)}{" "}
                  <span className="font-mono text-base font-medium text-muted-foreground">
                    kg
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Generador{" "}
                  <span className="font-medium text-foreground">
                    {generator?.current_category_id
                      ? CATEGORY_LABEL[generator.current_category_id] ?? "—"
                      : "—"}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Residuos recientes</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ultimos catalogados para este generador
              </p>
            </CardHeader>
            {recentWastes.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Sin residuos aun. La proxima entrada inaugura el catalogo.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentWastes.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between gap-3 px-6 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {w.name}
                      </p>
                      <div className="mt-1">
                        <HazardBadge
                          code={w.hazard_code}
                          name={w.hazard_name}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-sm tabular-figures text-foreground">
                      {NUM.format(w.current_stock_kg)}
                      <span className="text-muted-foreground"> kg</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-dashed bg-muted/40">
            <div className="flex gap-3 px-5 py-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Los pesos se redondean a 3 decimales. Si el promedio mensual
                cruza un umbral RESPEL, la categoria del generador se
                actualiza automaticamente.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
