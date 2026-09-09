import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// id = usuario_id (auth.users.id)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { activo } = await request.json();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('usuarios').update({ activo }).eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();

  // Borra el usuario de auth.users; el ON DELETE CASCADE limpia usuarios/estudiantes/perfiles/etc.
  const { error } = await supabase.auth.admin.deleteUser(params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
