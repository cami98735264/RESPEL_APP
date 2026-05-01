import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Banner } from "@/shared/ui/banner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { ApiError } from "@/shared/lib/api";
import type { AuthorizedReceptor } from "@shared/types";
import {
  gestorFormSchema,
  type GestorFormSubmit,
  type GestorFormValues,
} from "../schemas/gestor.schema";
import { gestoresService } from "../services/gestores.service";

const DEFAULT_AUTHORITY_ID = 1;

interface GestorFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gestor?: AuthorizedReceptor | null;
  onSaved: () => void;
}

const EMPTY_VALUES: GestorFormValues = {
  legal_name: "",
  nit: "",
  license_number: "",
  license_expiry: "",
  allowed_activities: "",
  address: "",
  contact_phone: "",
  contact_email: "",
};

function toFormValues(gestor: AuthorizedReceptor | null | undefined): GestorFormValues {
  if (!gestor) return EMPTY_VALUES;
  return {
    legal_name: gestor.legal_name ?? "",
    nit: gestor.nit ?? "",
    license_number: gestor.license_number ?? "",
    license_expiry: gestor.license_expiry?.slice(0, 10) ?? "",
    allowed_activities: gestor.allowed_activities ?? "",
    address: gestor.address ?? "",
    contact_phone: gestor.contact_phone ?? "",
    contact_email: gestor.contact_email ?? "",
  };
}

export function GestorFormDrawer({
  open,
  onOpenChange,
  gestor,
  onSaved,
}: GestorFormDrawerProps) {
  const isEdit = Boolean(gestor);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<GestorFormValues, undefined, GestorFormSubmit>({
    resolver: zodResolver(gestorFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) {
      reset(toFormValues(gestor));
      setSubmitError(null);
    }
  }, [open, gestor, reset]);

  async function onSubmit(data: GestorFormSubmit) {
    setSubmitError(null);
    try {
      if (isEdit && gestor) {
        await gestoresService.update(gestor.id, {
          legal_name: data.legal_name,
          nit: data.nit,
          license_number: data.license_number,
          license_expiry: data.license_expiry,
          allowed_activities: data.allowed_activities,
          address: data.address,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
        });
      } else {
        await gestoresService.create({
          legal_name: data.legal_name,
          nit: data.nit,
          license_number: data.license_number,
          license_expiry: data.license_expiry,
          allowed_activities: data.allowed_activities,
          address: data.address,
          contact_phone: data.contact_phone,
          contact_email: data.contact_email,
          authority_id: DEFAULT_AUTHORITY_ID,
          is_active: 1,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : isEdit
            ? "No se pudo actualizar el gestor"
            : "No se pudo registrar el gestor";
      setSubmitError(msg);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? "Editar gestor" : "Registrar gestor autorizado"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Actualice los datos del gestor autorizado."
              : "Complete los datos del receptor autorizado para la disposicion de residuos peligrosos."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {submitError && (
              <Banner tone="error" onDismiss={() => setSubmitError(null)}>
                {submitError}
              </Banner>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="legal_name">Razon social</Label>
              <Input
                id="legal_name"
                placeholder="Ej. GESTOR DEMO ANDESCO S.A.S."
                {...register("legal_name")}
              />
              {errors.legal_name && (
                <p className="text-xs text-destructive">
                  {errors.legal_name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nit">NIT</Label>
                <Input
                  id="nit"
                  placeholder="Ej. 900123456-7"
                  {...register("nit")}
                />
                {errors.nit && (
                  <p className="text-xs text-destructive">{errors.nit.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="license_number">Numero de licencia</Label>
                <Input
                  id="license_number"
                  placeholder="Ej. LIC-AMB-2024-001"
                  {...register("license_number")}
                />
                {errors.license_number && (
                  <p className="text-xs text-destructive">
                    {errors.license_number.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="license_expiry">
                  Vencimiento de licencia{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="license_expiry"
                  type="date"
                  {...register("license_expiry")}
                />
                {errors.license_expiry && (
                  <p className="text-xs text-destructive">
                    {errors.license_expiry.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">
                  Telefono{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  id="contact_phone"
                  placeholder="Ej. +57 300 123 4567"
                  {...register("contact_phone")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_email">
                Correo electronico{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contacto@gestor.com"
                {...register("contact_email")}
              />
              {errors.contact_email && (
                <p className="text-xs text-destructive">
                  {errors.contact_email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">
                Direccion{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="address"
                placeholder="Direccion fisica del gestor"
                {...register("address")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allowed_activities">
                Actividades autorizadas{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="allowed_activities"
                placeholder="Ej. Incineracion, celda de seguridad"
                {...register("allowed_activities")}
              />
            </div>
          </div>

          <SheetFooter className="justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Registrar gestor"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
