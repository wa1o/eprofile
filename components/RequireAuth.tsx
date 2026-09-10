'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Ctx {
  userId: string;
  esAdmin: boolean;
}

export function RequireAuth({
  children,
  slugPermitido,
}: {
  children: (ctx: Ctx) => React.ReactNode;
  /** Si se da, solo el dueno de ese slug o un admin pueden entrar. Si se omite, la ruta es exclusiva de admin. */
  slugPermitido?: string;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'denegado'>('cargando');
  const [ctx, setCtx] = useState<Ctx | null>(null);

  useEffect(() => {
    let activo = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('rol, activo')
        .eq('id', session.user.id)
        .single();

      if (usuarioError) {
        // Error transitorio (red, RLS, timing) - no expulsamos al login, solo negamos esta vista.
        if (activo) setEstado('denegado');
        return;
      }

      if (!usuario.activo) {
        await supabase.auth.signOut();
        router.push('/auth/login');
        return;
      }

      const esAdmin = usuario.rol === 'admin_plataforma';

      if (!esAdmin) {
        if (!slugPermitido) {
          if (activo) setEstado('denegado');
          return;
        }
        const { data: estudiante } = await supabase
          .from('estudiantes')
          .select('slug')
          .eq('usuario_id', session.user.id)
          .single();

        if (estudiante?.slug !== slugPermitido) {
          if (activo) setEstado('denegado');
          return;
        }
      }

      if (activo) {
        setCtx({ userId: session.user.id, esAdmin });
        setEstado('ok');
      }
    })();

    return () => {
      activo = false;
    };
  }, [router, slugPermitido]);

  if (estado === 'cargando') {
    return (
      <div className="container">
        <p>Cargando...</p>
      </div>
    );
  }

  if (estado === 'denegado') {
    return (
      <div className="container">
        <div className="card">
          <p>No tienes permiso para ver esta pagina.</p>
        </div>
      </div>
    );
  }

  return <>{ctx && children(ctx)}</>;
}