'use client';

import { useEffect, useState } from 'react';
import { User, Camera, Save, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Perfil {
  id: string;
  nombre_completo: string | null;
  carrera: string | null;
  resena: string | null;
  foto_url: string | null;
  estado: 'borrador' | 'publicado';
}

export function PerfilForm({ estudianteId }: { estudianteId: string }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargar();
  }, [estudianteId]);

  async function cargar() {
    setCargando(true);
    const { data } = await supabase.from('perfiles').select('*').eq('estudiante_id', estudianteId).single();
    setPerfil(data);
    setCargando(false);
  }

  async function guardar(nuevoEstado?: 'borrador' | 'publicado') {
    if (!perfil) return;
    setError('');
    setMensaje('');

    if (nuevoEstado === 'publicado' && (!perfil.nombre_completo || !perfil.carrera)) {
      setError('Para publicar necesitas al menos nombre completo y carrera.');
      return;
    }

    setGuardando(true);
    const { error: err } = await supabase
      .from('perfiles')
      .update({
        nombre_completo: perfil.nombre_completo,
        carrera: perfil.carrera,
        resena: perfil.resena,
        foto_url: perfil.foto_url,
        estado: nuevoEstado ?? perfil.estado,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', perfil.id);

    setGuardando(false);

    if (err) {
      setError(err.message);
      return;
    }

    setMensaje('Guardado.');
    if (nuevoEstado) setPerfil({ ...perfil, estado: nuevoEstado });
  }

  if (cargando) return <p>Cargando perfil...</p>;
  if (!perfil) return <p>No se encontro el perfil.</p>;

  return (
    <div className="card">
      <div className="top-bar">
        <h2 className="titulo-con-icono" style={{ margin: 0 }}>
          <User size={17} /> Perfil
        </h2>
        <span className={`badge ${perfil.estado}`}>{perfil.estado}</span>
      </div>

      <label>Nombre completo</label>
      <input
        value={perfil.nombre_completo ?? ''}
        onChange={(e) => setPerfil({ ...perfil, nombre_completo: e.target.value })}
      />

      <label>Carrera</label>
      <input value={perfil.carrera ?? ''} onChange={(e) => setPerfil({ ...perfil, carrera: e.target.value })} />

      <label>Resena breve</label>
      <textarea value={perfil.resena ?? ''} onChange={(e) => setPerfil({ ...perfil, resena: e.target.value })} />

      <label>
        <Camera size={13} /> Foto
      </label>
      {perfil.foto_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={perfil.foto_url} alt="Foto actual" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: 8 }} />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setError('');
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) return;

          const ruta = `${session.user.id}/foto.${file.name.split('.').pop()}`;
          const { error: subeError } = await supabase.storage
            .from('avatars')
            .upload(ruta, file, { upsert: true });

          if (subeError) {
            setError(subeError.message);
            return;
          }

          const { data: publica } = supabase.storage.from('avatars').getPublicUrl(ruta);
          setPerfil({ ...perfil, foto_url: `${publica.publicUrl}?t=${Date.now()}` });
        }}
      />

      {error && <p className="error">{error}</p>}
      {mensaje && <p className="exito">{mensaje}</p>}

      <div className="fila-botones">
        <button onClick={() => guardar()} disabled={guardando}>
          <Save size={15} /> Guardar borrador
        </button>
        {perfil.estado === 'borrador' ? (
          <button onClick={() => guardar('publicado')} disabled={guardando} className="secundario">
            <Eye size={15} /> Publicar
          </button>
        ) : (
          <button onClick={() => guardar('borrador')} disabled={guardando} className="secundario">
            <EyeOff size={15} /> Pasar a borrador
          </button>
        )}
      </div>
    </div>
  );
}
