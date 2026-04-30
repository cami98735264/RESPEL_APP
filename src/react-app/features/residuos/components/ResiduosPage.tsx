import { useResiduos } from '../hooks/useResiduos';

export default function ResiduosPage() {
  const { residuos, loading, error } = useResiduos();

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Residuos Peligrosos</h1>
      <p>{residuos.length} registros</p>
    </div>
  );
}
