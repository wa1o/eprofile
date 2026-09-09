import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1>EProfile</h1>
        <p>Tarjeta de presentacion digital para estudiantes.</p>
        <div className="fila-botones">
          <Link href="/auth/login">
            <button>Iniciar sesion</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
