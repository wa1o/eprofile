'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function SetPasswordPage() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);

      if (url.searchParams.get('error_description')) {
        setError(decodeURIComponent(url.searchParams.get('error_description')!));
        return;
      }

      // Flujo PKCE: la URL trae ?code=...
      if (url.searchParams.get('code')) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }

      // Flujo implicito: supabase-js detecta el #access_token solo (detectSessionInUrl).
      const { data } = await supabase.auth.getSession();
      setListo(!!data.session);
    })();

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

  if (error && !listo) {
    return (
      <div className="pantalla-centrada">
        <div className="card">
          <div className="icono-circulo" style={{ background: '#fef2f2', color: 'var(--danger)' }}>
            <KeyRound size={26} />
          </div>
          <p className="error">{error}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Es posible que el link haya expirado. Pide al administrador que te reenvie la invitacion.
          </p>
        </div>
      </div>
    );
  }

  if (!listo) {
    return (
      <div className="pantalla-centrada">
        <div className="card">
          <div className="icono-circulo">
            <KeyRound size={26} />
          </div>
          <p>Validando invitacion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pantalla-centrada">
      <div className="card">
        <div className="icono-circulo">
          <KeyRound size={26} />
        </div>
        <h1 style={{ marginTop: 0 }}>Crea tu contrasena</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -8 }}>Ultimo paso para activar tu cuenta</p>
        <form onSubmit={handleSubmit}>
          <label>
            <Lock size={13} /> Nueva contrasena
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={guardando} style={{ width: '100%', justifyContent: 'center' }}>
            {guardando ? 'Guardando...' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
