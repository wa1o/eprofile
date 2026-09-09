import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const supabase = getSupabaseAdmin();

  const { data: estudiante } = await supabase.from('estudiantes').select('id').eq('slug', params.slug).single();

  if (!estudiante) {
    return NextResponse.json({ error: 'Estudiante no encontrado.' }, { status: 404 });
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre_completo, carrera')
    .eq('estudiante_id', estudiante.id)
    .eq('estado', 'publicado')
    .single();

  if (!perfil) {
    return NextResponse.json({ error: 'Perfil no publicado.' }, { status: 404 });
  }

  const { data: enlaces } = await supabase
    .from('enlaces_contacto')
    .select('red_tipo, valor')
    .eq('estudiante_id', estudiante.id)
    .eq('estado', 'publicado');

  const correo = enlaces?.find((e) => e.red_tipo === 'Correo')?.valor ?? '';
  const telefono = enlaces?.find((e) => e.red_tipo === 'Telefono')?.valor ?? '';

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${perfil.nombre_completo ?? ''}`,
    `TITLE:${perfil.carrera ?? ''}`,
    telefono ? `TEL;TYPE=CELL:${telefono}` : '',
    correo ? `EMAIL:${correo}` : '',
    `URL:${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${params.slug}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');

  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard',
      'Content-Disposition': `attachment; filename="${params.slug}.vcf"`,
    },
  });
}
