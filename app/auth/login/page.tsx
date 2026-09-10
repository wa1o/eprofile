'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';
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
    <div className="pantalla-centrada">
      <div className="card">
        <div className="icono-circulo">
          <LogIn size={26} />
        </div>
        <h1 style={{ marginTop: 0 }}>Iniciar sesion</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: -8 }}>Entra a tu EProfile</p>
        <form onSubmit={handleSubmit}>
          <label>
            <Mail size={13} /> Correo
          </label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>
            <Lock size={13} /> Contrasena
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={cargando} style={{ width: '100%', justifyContent: 'center' }}>
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
