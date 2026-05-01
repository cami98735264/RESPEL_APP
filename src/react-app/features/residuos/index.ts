export { default as ResiduosPage } from './components/ResiduosPage';
export { default as EntradaPage } from './components/EntradaPage';
export { default as SalidaPage } from './components/SalidaPage';
export { useResiduos } from './hooks/useResiduos';
export { useDefaultGenerator } from './hooks/useDefaultGenerator';
export type {
  Waste,
  WasteWithHazard,
  WasteEntry,
  WasteExit,
  Generator,
  AuthorizedReceptor,
  HazardCharacteristic,
  GeneratorCategory,
  HazardCode,
  CategoryCode,
} from '@shared/types';
