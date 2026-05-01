import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
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
import {
  receptorsService,
  wasteExitsService,
  wastesService,
} from "../services/residuos.service";
import type { AuthorizedReceptor, WasteWithHazard } from "@shared/types";

const salidaSchema = z.object({
  waste_id: z
    .number({ error: "Selecciona un residuo" })
    .int()
    .positive("Selecciona un residuo"),
  receptor_id: z
    .number({ error: "Selecciona un gestor" })
    .int()
    .positive("Selecciona un gestor"),
  weight_kg: z
    .number({ error: "Ingresa un peso valido" })
    .positive("El peso debe ser mayor a 0"),
  manifesto_number: z.string().optional(),
  disposal_method: z.string().optional(),
  receptor_certificate_ref: z.string().optional(),
});

type SalidaFormValues = z.infer<typeof salidaSchema>;

const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

export default function SalidaPage() {
  const { generator } = useGenerator();
  const [wastes, setWastes] = useState<WasteWithHazard[]>([]);
  const [receptors, setReceptors] = useState<AuthorizedReceptor[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SalidaFormValues>({
    resolver: zodResolver(salidaSchema),
  });

  useEffect(() => {
    if (!generator) return;
    wastesService
      .list({ generatorId: generator.id, inStockOnly: true })
      .then(setWastes)
      .catch(() => setSubmitError("No se pudieron cargar los residuos"));
  }, [generator]);

  useEffect(() => {
    receptorsService
      .list({ activeOnly: true })
      .then(setReceptors)
      .catch(() => setSubmitError("No se pudieron cargar los gestores"));
  }, []);

  const selectedWasteId = watch("waste_id");
  const selectedWaste = wastes.find((w) => w.id === Number(selectedWasteId));

  async function refreshWastes() {
    if (!generator) return;
    const list = await wastesService.list({
      generatorId: generator.id,
      inStockOnly: true,
    });
    setWastes(list);
  }

  async function onSubmit(data: SalidaFormValues) {
    if (!generator) return;
    setSubmitError(null);
    setSubmitOk(null);
    try {
      await wasteExitsService.create({
        waste_id: data.waste_id,
        generator_id: generator.id,
        receptor_id: data.receptor_id,
        weight_kg: data.weight_kg,
        dispatched_at: new Date().toISOString(),
        manifesto_number: data.manifesto_number || null,
        disposal_method: data.disposal_method || null,
        receptor_certificate_ref: data.receptor_certificate_ref || null,
      });
      setSubmitOk(
        `Salida registrada: ${NUM.format(data.weight_kg)} kg dispuestos al gestor.`,
      );
      reset();
      await refreshWastes();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "No se pudo registrar la salida";
      setSubmitError(msg);
    }
  }

  const totalAvailable = useMemo(
    () => wastes.reduce((s, w) => s + w.current_stock_kg, 0),
    [wastes],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Operacion · Salidas"
        title="Registrar Salida"
        description="Despache residuos a un gestor autorizado. La trazabilidad se mantiene desde el generador hasta el certificado de disposicion final."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Datos de despacho</CardTitle>
            <p className="text-xs text-muted-foreground">
              Decreto 4741/2005 · Articulos 10(a) y 17
            </p>
          </CardHeader>
          <div className="space-y-5 px-6 py-6">
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
                <Label>Residuo</Label>
                <Controller
                  control={control}
                  name="waste_id"
                  render={({ field }) => (
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            wastes.length === 0
                              ? "Sin stock disponible"
                              : "Seleccionar residuo"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {wastes.map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.name} — {w.hazard_code} (
                            {w.current_stock_kg.toFixed(2)} kg)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.waste_id && (
                  <p className="text-xs text-destructive">
                    {errors.waste_id.message}
                  </p>
                )}
                {selectedWaste && (
                  <p className="text-xs text-muted-foreground">
                    Stock disponible:{" "}
                    <span className="font-mono tabular-figures text-foreground">
                      {NUM.format(selectedWaste.current_stock_kg)} kg
                    </span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Gestor autorizado</Label>
                  <Controller
                    control={control}
                    name="receptor_id"
                    render={({ field }) => (
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={field.value ? String(field.value) : ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar gestor" />
                        </SelectTrigger>
                        <SelectContent>
                          {receptors.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)}>
                              {r.legal_name} — {r.license_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.receptor_id && (
                    <p className="text-xs text-destructive">
                      {errors.receptor_id.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="weight_kg">Peso a despachar</Label>
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

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="manifesto_number">
                    Manifiesto{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="manifesto_number"
                    placeholder="N. de manifiesto de transporte"
                    {...register("manifesto_number")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disposal_method">
                    Metodo de disposicion{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="disposal_method"
                    placeholder="Ej. Incineracion, celda de seguridad"
                    {...register("disposal_method")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receptor_certificate_ref">
                  Certificado del gestor{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="receptor_certificate_ref"
                  placeholder="Referencia del certificado"
                  {...register("receptor_certificate_ref")}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !generator || wastes.length === 0}
              >
                {isSubmitting ? "Registrando..." : "Registrar Salida"}
              </Button>
            </form>
          </div>
        </Card>

        {/* Side panel: stock disponible */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex items-start gap-4 px-6 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Disponible para despacho
                </p>
                <p className="font-display tabular-figures mt-1.5 text-3xl font-semibold leading-none text-foreground">
                  {NUM.format(totalAvailable)}{" "}
                  <span className="font-mono text-base font-medium text-muted-foreground">
                    kg
                  </span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {wastes.length} residuos con stock
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock disponible</CardTitle>
              <p className="text-xs text-muted-foreground">
                Solo residuos con saldo positivo
              </p>
            </CardHeader>
            {wastes.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                Sin residuos en stock para despachar.
              </p>
            ) : (
              <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
                {wastes.map((w) => (
                  <li
                    key={w.id}
                    className={
                      "flex items-center justify-between gap-3 px-6 py-3 transition-colors " +
                      (selectedWaste?.id === w.id
                        ? "bg-primary/5"
                        : "hover:bg-muted/40")
                    }
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
        </div>
      </div>
    </div>
  );
}
