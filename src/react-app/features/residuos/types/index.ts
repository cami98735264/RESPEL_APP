export type EstadoResiduo = 'pendiente' | 'almacenado' | 'gestionado';

export interface Residuo {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  estado: EstadoResiduo;
  fechaRegistro: string;
  responsable: string;
}

export interface CreateResiduoDto {
  nombre: string;
  cantidad: number;
  unidad: string;
  responsable: string;
}
