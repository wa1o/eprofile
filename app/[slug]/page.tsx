import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { QrCode } from '@/components/QrCode';
import { Download, Contact as ContactIcon, GraduationCap, FolderKanban, Sparkles, Award, AtSign, QrCode as QrCodeIcon, ExternalLink } from 'lucide-react';

export const revalidate = 0;

function fmt(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
}

export default async function EProfilePublica({ params }: { params: { slug: string } }) {
  const supabase = getSupabaseAdmin();

  const { data: estudiante } = await supabase.from('estudiantes').select('id, slug').eq('slug', params.slug).single();

  if (!estudiante) {
    return (
      <div className="container">
        <div className="card">
          <p>Esta EProfile no existe.</p>
        </div>
      </div>
    );
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
    return (
      <div className="container">
        <div className="card">
          <p>Este estudiante aun no ha publicado su EProfile.</p>
        </div>
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const urlPropia = `${siteUrl}/${params.slug}`;

  return (
    <div className="container">
      <div className="card header-perfil">
        {perfil.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfil.foto_url} alt={perfil.nombre_completo ?? ''} />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: '#e2e8f0',
            }}
          />
        )}
        <div>
          <h1 style={{ margin: 0 }}>{perfil.nombre_completo}</h1>
          <p style={{ margin: '4px 0', color: '#64748b' }}>{perfil.carrera}</p>
          {perfil.resena && <p style={{ margin: 0 }}>{perfil.resena}</p>}
        </div>
      </div>

      <div className="card fila-botones">
        <a href={`/api/cv/${params.slug}`} target="_blank" rel="noopener noreferrer">
          <button>
            <Download size={15} /> Descargar CV en PDF
          </button>
        </a>
        <a href={`/api/vcard/${params.slug}`}>
          <button className="secundario">
            <ContactIcon size={15} /> Guardar contacto
          </button>
        </a>
      </div>

      {curriculums && curriculums.length > 0 && (
        <div className="card">
          <div className="seccion-titulo titulo-con-icono"><GraduationCap size={14} /> Formacion y experiencia</div>
          {curriculums.map((c) => (
            <div key={c.id} className="item-lista">
              <strong>{c.titulo}</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {c.institucion_empresa}
                {c.fecha_inicio ? ` - ${fmt(c.fecha_inicio)} a ${c.fecha_fin ? fmt(c.fecha_fin) : 'Actual'}` : ''}
              </div>
              {c.descripcion && <p style={{ margin: '4px 0 0' }}>{c.descripcion}</p>}
            </div>
          ))}
        </div>
      )}

      {habilidades && habilidades.length > 0 && (
        <div className="card">
          <div className="seccion-titulo titulo-con-icono"><Sparkles size={14} /> Habilidades</div>
          <p>{habilidades.map((h) => h.nombre).join('  -  ')}</p>
        </div>
      )}

      {proyectos && proyectos.length > 0 && (
        <div className="card">
          <div className="seccion-titulo titulo-con-icono"><FolderKanban size={14} /> Proyectos</div>
          {proyectos.map((p) => (
            <div key={p.id} className="item-lista">
              <strong>
                {p.nombre}
                {p.es_academico ? ' (Academico)' : ''}
              </strong>
              {p.descripcion && <p style={{ margin: '4px 0' }}>{p.descripcion}</p>}
              {p.tecnologias_rol?.length > 0 && (
                <div style={{ fontSize: 12, color: '#64748b' }}>{p.tecnologias_rol.join(' - ')}</div>
              )}
              <div className="fila-botones" style={{ marginTop: 4 }}>
                {p.enlace_demo && <a href={p.enlace_demo}>Demo</a>}
                {p.enlace_repositorio && <a href={p.enlace_repositorio}>Repositorio</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {reconocimientos && reconocimientos.length > 0 && (
        <div className="card">
          <div className="seccion-titulo titulo-con-icono"><Award size={14} /> Reconocimientos</div>
          {reconocimientos.map((r) => (
            <div key={r.id} className="item-lista">
              <strong>{r.titulo}</strong>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {r.emisor}
                {r.fecha ? ` - ${fmt(r.fecha)}` : ''}
              </div>
              {r.descripcion && <p style={{ margin: '4px 0 0' }}>{r.descripcion}</p>}
            </div>
          ))}
        </div>
      )}

      {enlaces && enlaces.length > 0 && (
        <div className="card">
          <div className="seccion-titulo titulo-con-icono"><AtSign size={14} /> Contacto</div>
          {enlaces.map((e) => (
            <p key={e.id} style={{ margin: '4px 0' }}>
              {e.red_tipo}: {e.valor}
            </p>
          ))}
        </div>
      )}

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="seccion-titulo titulo-con-icono" style={{justifyContent: "center"}}><QrCodeIcon size={14} /> Tarjeta digital</div>
        {siteUrl && <QrCode url={urlPropia} />}
        <p style={{ fontSize: 12, color: '#64748b' }}>Escanea para abrir esta EProfile</p>
      </div>
    </div>
  );
}
