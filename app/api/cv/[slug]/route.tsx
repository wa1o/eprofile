import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ClasicaTemplate } from '@/lib/pdf-templates/ClasicaTemplate';
import { ModernaTemplate } from '@/lib/pdf-templates/ModernaTemplate';
import { CVData } from '@/lib/pdf-templates/types';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const supabase = getSupabaseAdmin();

  const { data: estudiante } = await supabase
    .from('estudiantes')
    .select('id, plantilla_cv_id')
    .eq('slug', params.slug)
    .single();

  if (!estudiante) {
    return NextResponse.json({ error: 'Estudiante no encontrado.' }, { status: 404 });
  }

  const [
    { data: perfil },
    { data: curriculums },
    { data: habilidades },
    { data: proyectos },
    { data: reconocimientos },
    { data: enlaces },
  ] = await Promise.all([
    supabase.from('perfiles').select('*').eq('estudiante_id', estudiante.id).eq('estado', 'publicado').single(),
    supabase
      .from('curriculums')
      .select('*')
      .eq('estudiante_id', estudiante.id)
      .eq('estado', 'publicado')
      .order('fecha_inicio', { ascending: false }),
    supabase.from('habilidades').select('*').eq('estudiante_id', estudiante.id).eq('estado', 'publicado'),
    supabase.from('proyectos').select('*').eq('estudiante_id', estudiante.id).eq('estado', 'publicado'),
    supabase.from('reconocimientos').select('*').eq('estudiante_id', estudiante.id).eq('estado', 'publicado'),
    supabase.from('enlaces_contacto').select('*').eq('estudiante_id', estudiante.id).eq('estado', 'publicado'),
  ]);

  if (!perfil) {
    return NextResponse.json({ error: 'Este perfil aun no esta publicado.' }, { status: 404 });
  }

  const cvData: CVData = {
    perfil,
    curriculums: curriculums ?? [],
    habilidades: habilidades ?? [],
    proyectos: proyectos ?? [],
    reconocimientos: reconocimientos ?? [],
    enlaces: enlaces ?? [],
  };

  const Template = estudiante.plantilla_cv_id === 'moderna' ? ModernaTemplate : ClasicaTemplate;
  const buffer = await renderToBuffer(<Template data={cvData} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cv-${params.slug}.pdf"`,
    },
  });
}
