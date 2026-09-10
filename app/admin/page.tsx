'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { RequireAuth } from '@/components/RequireAuth';

interface FilaEstudiante {
  id: string;
  slug: string;
  usuario_id: string;
  usuarios: { activo: boolean } | null;
  perfiles: { nombre_completo: string | null; estado: string } | null;
}

export default function PanelAdmin() {
  return <RequireAuth>{() => <Contenido />}</RequireAuth>;
}

function Contenido() {
  const router = useRouter();
  const [estudiantes, setEstudiantes] = useState<FilaEstudiante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aEliminar, setAEliminar] = useState<FilaEstudiante | null>(null);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const res = await fetch('/api/admin/estudiantes', { cache: 'no-store' });
    const json = await res.json();
    setEstudiantes(json.estudiantes ?? []);
    setCargando(false);
  }

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setEnviando(true);

    const res = await fetch('/api/admin/estudiantes/invitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, slug }),
    });
    const json = await res.json();
    setEnviando(false);

    if (!res.ok) {
      setError(json.error ?? 'Error al invitar.');
      return;
    }

    setMensaje('Invitacion enviada.');
    setEmail('');
    setSlug('');
    cargar();
  }

  async function alternarActivo(usuarioId: string, activoActual: boolean) {
    setError('');
    const res = await fetch(`/api/admin/estudiantes/${usuarioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !activoActual }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'No se pudo actualizar la cuenta.');
      return;
    }
    cargar();
  }

  async function eliminar(usuarioId: string) {
    setError('');
    const res = await fetch(`/api/admin/estudiantes/${usuarioId}`, { method: 'DELETE' });
    setAEliminar(null);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? 'No se pudo eliminar la cuenta.');
      return;
    }
    cargar();
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <div className="container">
      <div className="top-bar">
        <h1 style={{ margin: 0 }}>Panel de administracion</h1>
        <button className="secundario" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Crear cuenta de estudiante</h2>
        <form onSubmit={invitar}>
          <div className="grid-2">
            <div>
              <label>Correo</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label>Slug (ruta)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="ej. luisjz"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
          </div>
          {error && <p className="error">{error}</p>}
          {mensaje && <p className="exito">{mensaje}</p>}
          <button type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar invitacion'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Estudiantes</h2>
        {error && <p className="error">{error}</p>}
        {cargando ? (
          <p>Cargando...</p>
        ) : estudiantes.length === 0 ? (
          <p>Aun no hay estudiantes registrados.</p>
        ) : (
          <div className="lista-estudiantes">
            {estudiantes.map((e) => (
              <div key={e.id} className="fila-estudiante">
                <div className="info">
                  <div className="nombre">{e.perfiles?.nombre_completo || '(sin nombre)'}</div>
                  <div className="slug">
                    <Link href={`/${e.slug}`}>/{e.slug}</Link>
                  </div>
                  <div className="badges">
                    <span className={`badge ${e.perfiles?.estado ?? 'borrador'}`}>
                      {e.perfiles?.estado ?? 'borrador'}
                    </span>
                    <span className={`badge ${e.usuarios?.activo ? 'activo' : 'inactivo'}`}>
                      {e.usuarios?.activo ? 'activo' : 'inactivo'}
                    </span>
                  </div>
                </div>
                <div className="fila-botones">
                  <Link href={`/${e.slug}/admin`}>
                    <button className="secundario">Administrar</button>
                  </Link>
                  <button className="secundario" onClick={() => alternarActivo(e.usuario_id, !!e.usuarios?.activo)}>
                    {e.usuarios?.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button className="peligro" onClick={() => setAEliminar(e)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {aEliminar && (
        <div className="overlay" onClick={() => setAEliminar(null)}>
          <div className="modal" onClick={(ev) => ev.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Eliminar estudiante</h3>
            <p>
              Esto borra permanentemente la cuenta de{' '}
              <strong>{aEliminar.perfiles?.nombre_completo || aEliminar.slug}</strong> y todo su contenido
              (perfil, CV, proyectos, habilidades, reconocimientos y contacto). No se puede deshacer.
            </p>
            <div className="fila-botones" style={{ justifyContent: 'flex-end' }}>
              <button className="secundario" onClick={() => setAEliminar(null)}>
                Cancelar
              </button>
              <button className="peligro" onClick={() => eliminar(aEliminar.usuario_id)}>
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}