import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/ui';
import { Logo } from '../components/common/Logo';

export function NotFoundPage() {
  return (
    <div
      className="flex-col items-center justify-center text-center"
      style={{ minHeight: '100vh', padding: 'var(--sp-5)', gap: 'var(--sp-4)' }}
    >
      <Logo size={40} withWordmark={false} />
      <div className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '1.6rem' }}>Página no encontrada</h1>
      <p className="text-muted" style={{ maxWidth: 420 }}>
        La ruta que buscas no existe o el recurso ya no está disponible.
      </p>
      <Link to="/">
        <Button leftIcon={<Compass size={16} />}>Ir al inicio</Button>
      </Link>
    </div>
  );
}
