import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { generatorsService } from "@/features/residuos/services/residuos.service";
import type { Generator } from "@shared/types";

interface GeneratorContextValue {
  generator: Generator | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const GeneratorContext = createContext<GeneratorContextValue | undefined>(
  undefined,
);

export function GeneratorProvider({ children }: { children: ReactNode }) {
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const g = await generatorsService.getDefault();
      setGenerator(g);
      setError(null);
    } catch {
      setError("No se pudo cargar el generador por defecto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ generator, loading, error, refresh }),
    [generator, loading, error, refresh],
  );

  return (
    <GeneratorContext.Provider value={value}>
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const ctx = useContext(GeneratorContext);
  if (!ctx) {
    throw new Error("useGenerator must be used within GeneratorProvider");
  }
  return ctx;
}
