import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const CARACTERISTICAS = [
  { value: "inflamable", label: "Inflamable" },
  { value: "corrosivo", label: "Corrosivo" },
  { value: "reactivo", label: "Reactivo" },
  { value: "toxico", label: "Tóxico" },
  { value: "infeccioso", label: "Infeccioso" },
  { value: "radiactivo", label: "Radiactivo" },
] as const;

const entradaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  caracteristica: z.enum(
    ["inflamable", "corrosivo", "reactivo", "toxico", "infeccioso", "radiactivo"],
    { error: "Selecciona una característica" }
  ),
  peso: z
    .number({ error: "Ingresa un peso válido" })
    .positive("El peso debe ser mayor a 0"),
});

type EntradaFormValues = z.infer<typeof entradaSchema>;

export default function EntradaPage() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EntradaFormValues>({
    resolver: zodResolver(entradaSchema),
  });

  function onSubmit(data: EntradaFormValues) {
    console.log("Entrada registrada:", data);
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="relative hidden w-2/5 flex-col justify-between overflow-hidden bg-teal-950 p-14 select-none md:flex">
        {/* Watermark hazard icon */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-[0.06]">
          <TriangleAlert className="h-[420px] w-[420px] text-white" />
        </div>

        {/* Top: brand */}
        <div className="relative z-10">
          <span className="text-xs font-semibold tracking-[0.2em] text-teal-400 uppercase">
            Sistema de Gestión
          </span>
          <h1 className="mt-3 text-[5.5rem] leading-none font-black text-white">
            RESPEL
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-teal-300">
            Control de Residuos Peligrosos
          </p>
          <div className="mt-8 space-y-3">
            <div className="h-px w-10 bg-teal-700" />
            <p className="max-w-[260px] text-sm leading-relaxed text-teal-500">
              Registro, trazabilidad y gestión conforme a normativa CRETIB.
            </p>
          </div>
        </div>

        {/* Bottom: legal */}
        <p className="relative z-10 text-xs text-teal-800">
          © 2025 RESPEL · Todos los derechos reservados
        </p>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-y-auto bg-white">
        <div className="flex flex-1 flex-col px-10 py-16 sm:px-16 lg:px-20">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">

            {/* Form header */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Registrar Entrada
              </h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Complete los datos del residuo peligroso ingresante.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-1 flex-col"
            >
              <div className="flex-1 space-y-6">
                {/* Nombre del residuo */}
                <div className="space-y-1.5">
                  <Label htmlFor="nombre">Nombre del residuo</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej. Aceite mineral usado"
                    {...register("nombre")}
                  />
                  {errors.nombre && (
                    <p className="text-xs text-destructive">
                      {errors.nombre.message}
                    </p>
                  )}
                </div>

                {/* Característica de peligrosidad */}
                <div className="space-y-1.5">
                  <Label>Característica de peligrosidad</Label>
                  <Controller
                    control={control}
                    name="caracteristica"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar característica" />
                        </SelectTrigger>
                        <SelectContent>
                          {CARACTERISTICAS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.caracteristica && (
                    <p className="text-xs text-destructive">
                      {errors.caracteristica.message}
                    </p>
                  )}
                </div>

                {/* Peso (kg) */}
                <div className="space-y-1.5">
                  <Label htmlFor="peso">Peso</Label>
                  <div className="relative">
                    <Input
                      id="peso"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pr-10"
                      {...register("peso", { valueAsNumber: true })}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      kg
                    </span>
                  </div>
                  {errors.peso && (
                    <p className="text-xs text-destructive">
                      {errors.peso.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="mt-8 w-full">
                Registrar Entrada
              </Button>
            </form>

            {/* Summary footer */}
            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
              <span className="text-xs text-gray-500">
                Stock total:{" "}
                <span className="font-semibold text-gray-700">1,240 kg</span>
              </span>
              <Badge variant="secondary">Generador Pequeño</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
