import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRaffles } from '../hooks/useRaffles.js';
import { Container } from '../components/ui/Container.jsx';
import { LoadingBlock } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Button } from '../components/ui/Button.jsx';

/**
 * Link fijo para QR/carteles: siempre manda al sorteo "principal" — el
 * mismo que se destaca en la home (el primero marcado como "Destacado en
 * la home" desde el admin, o si no hay ninguno, el primer sorteo activo).
 * Así el QR nunca cambia, aunque cambie el sorteo: cuando se arma uno
 * nuevo, solo hay que tildar "Destacado" en ese sorteo desde el admin.
 */
export default function MainRaffleRedirect() {
  const navigate = useNavigate();
  const query = useRaffles();
  const raffles = query.data || [];
  const main = raffles.find((r) => r.featured) || raffles[0] || null;

  useEffect(() => {
    if (main) navigate(`/sorteos/${main.raffleId}`, { replace: true });
  }, [main, navigate]);

  if (query.isLoading || main) {
    return (
      <Container>
        <LoadingBlock label="Buscando el sorteo activo…" />
      </Container>
    );
  }

  return (
    <Container narrow>
      <EmptyState title="No hay ningún sorteo activo en este momento" action={<Button as={Link} to="/sorteos">Ver todos los sorteos</Button>}>
        Volvé a intentarlo más tarde.
      </EmptyState>
    </Container>
  );
}
