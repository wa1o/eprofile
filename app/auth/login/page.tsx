'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError || !data.user) {
      setError('Correo o contrasena incorrectos.');
      setCargando(false);
      return;
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', data.user.id)
      .single();

    if (usuario?.rol === 'admin_plataforma') {
      router.push('/admin');
      return;
    }

    const { data: estudiante } = await supabase
      .from('estudiantes')
      .select('slug')
      .eq('usuario_id', data.user.id)
      .single();

    if (estudiante?.slug) {
      router.push(`/${estudiante.slug}/admin`);
    } else {
      setError('Tu cuenta no tiene un perfil de estudiante asociado.');
      setCargando(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 380 }}>
      <div className="card">
        <h1>Iniciar sesion</h1>
        <form onSubmit={handleSubmit}>
          <label>Correo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Contrasena</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={cargando}>
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
