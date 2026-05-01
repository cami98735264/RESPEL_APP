import type { HazardCode, CategoryCode } from "./enums";

export interface HazardCharacteristic {
  id: number;
  code: HazardCode;
  name_es: string;
  description_es: string;
  created_at: string;
}

export interface GeneratorCategory {
  id: number;
  code: CategoryCode;
  name_es: string;
  min_kg_month: number;
  max_kg_month: number | null;
  registration_months: number;
}

export interface WasteType {
  id: number;
  annex_code: string;
  description_es: string;
  source_annex: "I" | "II";
  created_at: string;
}

export interface EnvironmentalAuthority {
  id: number;
  name: string;
  jurisdiction: string | null;
  created_at: string;
}

export interface Generator {
  id: number;
  legal_name: string;
  nit: string;
  address: string;
  municipality: string;
  department: string;
  contact_phone: string | null;
  contact_email: string | null;
  authority_id: number;
  registration_code: string | null;
  registered_at: string | null;
  current_category_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthorizedReceptor {
  id: number;
  legal_name: string;
  nit: string;
  license_number: string;
  license_expiry: string | null;
  allowed_activities: string | null;
  address: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  authority_id: number;
  is_active: 0 | 1;
  created_at: string;
  updated_at: string;
}

export interface Waste {
  id: number;
  generator_id: number;
  name: string;
  waste_type_id: number | null;
  hazard_characteristic_id: number;
  current_stock_kg: number;
  first_entry_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WasteWithHazard extends Waste {
  hazard_code: HazardCode;
  hazard_name: string;
}

export interface WasteEntry {
  id: number;
  waste_id: number;
  generator_id: number;
  sensor_reading_ref: string | null;
  weight_kg: number;
  recorded_at: string;
  source_description: string | null;
  notes: string | null;
}

export interface WasteExit {
  id: number;
  waste_id: number;
  generator_id: number;
  receptor_id: number;
  weight_kg: number;
  dispatched_at: string;
  manifesto_number: string | null;
  disposal_method: string | null;
  receptor_certificate_ref: string | null;
  certificate_issued_at: string | null;
  notes: string | null;
}

export interface GeneratorCategoryAlert {
  id: number;
  generator_id: number;
  previous_category_id: number | null;
  new_category_id: number;
  trigger_month: string;
  rolling_avg_kg: number;
  created_at: string;
  acknowledged: 0 | 1;
  acknowledged_at: string | null;
}

export interface StorageLimitAlert {
  id: number;
  waste_id: number;
  generator_id: number;
  first_entry_at: string;
  deadline_date: string;
  alerted_at: string;
  resolved: 0 | 1;
  resolved_at: string | null;
}

export interface CurrentStockRow {
  waste_id: number;
  waste_name: string;
  generator_id: number;
  generator_name: string;
  hazard_code: HazardCode;
  hazard_name: string;
  current_stock_kg: number;
  first_entry_at: string | null;
  storage_deadline: string | null;
  near_deadline_flag: 0 | 1;
}

export interface EntryDetailReportRow {
  entry_id: number;
  recorded_at: string;
  report_day: string;
  report_month: string;
  report_quarter: number;
  report_year: string;
  generator_id: number;
  generator_nit: string;
  generator_name: string;
  category_code: CategoryCode | null;
  waste_name: string;
  hazard_code: HazardCode;
  hazard_name: string;
  weight_kg: number;
  sensor_reading_ref: string | null;
  source_description: string | null;
}

export interface ExitDetailReportRow {
  exit_id: number;
  dispatched_at: string;
  report_day: string;
  report_month: string;
  report_quarter: number;
  report_year: string;
  generator_id: number;
  generator_nit: string;
  generator_name: string;
  waste_name: string;
  hazard_code: HazardCode;
  hazard_name: string;
  weight_kg: number;
  receptor_name: string;
  receptor_license: string;
  manifesto_number: string | null;
  disposal_method: string | null;
  receptor_certificate_ref: string | null;
}

export interface CreateWasteEntryDto {
  generator_id: number;
  name: string;
  hazard_code: HazardCode;
  weight_kg: number;
  sensor_reading_ref?: string | null;
  recorded_at?: string;
  source_description?: string | null;
  notes?: string | null;
}

export interface CreateWasteEntryResponse {
  entry: WasteEntry;
  waste: Waste;
  categoryAlert: GeneratorCategoryAlert | null;
}

export interface CreateWasteExitDto {
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

export interface CreateGeneratorDto {
  legal_name: string;
  nit: string;
  address: string;
  municipality: string;
  department: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  authority_id: number;
  registration_code?: string | null;
  registered_at?: string | null;
}

export interface UpdateGeneratorDto extends Partial<CreateGeneratorDto> {}

export interface CreateReceptorDto {
  legal_name: string;
  nit: string;
  license_number: string;
  license_expiry?: string | null;
  allowed_activities?: string | null;
  address?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  authority_id: number;
  is_active?: 0 | 1;
}

export interface UpdateReceptorDto extends Partial<CreateReceptorDto> {}

export interface CreateWasteDto {
  generator_id: number;
  name: string;
  hazard_characteristic_id: number;
  waste_type_id?: number | null;
  notes?: string | null;
}

export interface UpdateWasteDto {
  name?: string;
  hazard_characteristic_id?: number;
  waste_type_id?: number | null;
  notes?: string | null;
}
