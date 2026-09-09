'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function SetPasswordPage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    // supabase-js detecta el token de invitacion en el fragmento de la URL
    // y crea la sesion automaticamente (detectSessionInUrl: true por defecto).
    supabase.auth.getSession().then(({ data }) => {
      setListo(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setListo(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }

    setGuardando(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setGuardando(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const { data: estudiante } = await supabase
      .from('estudiantes')
      .select('slug')
      .eq('usuario_id', authData.user?.id)
      .single();

    router.push(estudiante?.slug ? `/${estudiante.slug}/admin` : '/admin');
  }

  if (!listo) {
    return (
      <div className="container" style={{ maxWidth: 380 }}>
        <div className="card">
          <p>Validando invitacion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 380 }}>
      <div className="card">
        <h1>Crea tu contrasena</h1>
        <form onSubmit={handleSubmit}>
          <label>Nueva contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
