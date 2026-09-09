import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, slug } = await request.json();

    if (!email || !slug) {
      return NextResponse.json({ error: 'Correo y slug son requeridos.' }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'El slug solo puede tener minusculas, numeros y guiones.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: slugExistente, error: slugError } = await supabaseAdmin
      .from('estudiantes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (slugError) {
      console.error('Error validando slug:', slugError.message);
      return NextResponse.json({ error: 'Error validando el slug.' }, { status: 500 });
    }

    if (slugExistente) {
      return NextResponse.json({ error: 'El slug ya esta registrado.' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/set-password`,
      data: {
        rol: 'estudiante',
        slug,
      },
    });

    if (authError || !authUser?.user) {
      console.error('Error de Supabase Auth:', authError?.message);
      return NextResponse.json(
        { error: authError?.message ?? 'No se pudo crear el usuario.' },
        { status: 400 }
      );
    }

    // La fila en 'estudiantes' y 'perfiles' la crea el trigger handle_new_user.
    return NextResponse.json(
      { mensaje: 'Invitacion enviada con exito.', usuario_id: authUser.user.id },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error no controlado:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
