import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: estudiantes, error } = await supabase
    .from('estudiantes')
    .select('id, slug, usuario_id, usuarios(activo), perfiles(nombre_completo, estado)')
    .order('creado_en', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ estudiantes });
}
