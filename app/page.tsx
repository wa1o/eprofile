import Link from 'next/link';
import { IdCard } from 'lucide-react';

export default function Home() {
  return (
    <div className="pantalla-centrada">
      <div className="card">
        <div className="icono-circulo">
          <IdCard size={26} />
        </div>
        <h1 style={{ marginTop: 0 }}>EProfile</h1>
        <p style={{ color: 'var(--muted)' }}>Tarjeta de presentacion digital para estudiantes.</p>
        <div className="fila-botones" style={{ justifyContent: 'center' }}>
          <Link href="/auth/login">
            <button>Iniciar sesion</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
