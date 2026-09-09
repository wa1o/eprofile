'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { RequireAuth } from '@/components/RequireAuth';
import { PerfilForm } from '@/components/PerfilForm';
import { SeccionCRUD } from '@/components/SeccionCRUD';
import { QrCode } from '@/components/QrCode';

export default function PanelEstudiante({ params }: { params: { slug: string } }) {
  return (
    <RequireAuth slugPermitido={params.slug}>
      {() => <Contenido slug={params.slug} />}
    </RequireAuth>
  );
}

function Contenido({ slug }: { slug: string }) {
  const router = useRouter();
  const [estudianteId, setEstudianteId] = useState<string | null>(null);
  const [plantilla, setPlantilla] = useState('clasica');
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    supabase
      .from('estudiantes')
      .select('id, plantilla_cv_id')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        if (data) {
          setEstudianteId(data.id);
          setPlantilla(data.plantilla_cv_id ?? 'clasica');
        }
      });
  }, [slug]);

  async function cambiarPlantilla(valor: string) {
    setPlantilla(valor);
    await supabase.from('estudiantes').update({ plantilla_cv_id: valor }).eq('slug', slug);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  if (!estudianteId) {
    return (
      <div className="container">
        <p>Cargando panel...</p>
      </div>
    );
  }

  const urlPublica = `${siteUrl}/${slug}`;

  return (
    <div className="container">
      <div className="top-bar">
        <h1 style={{ margin: 0 }}>Mi panel</h1>
        <div className="fila-botones">
          <Link href={`/${slug}`}>
            <button className="secundario">Ver mi EProfile</button>
          </Link>
          <button className="secundario" onClick={cerrarSesion}>
            Cerrar sesion
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Enlace y QR</h2>
        <p style={{ fontSize: 13, wordBreak: 'break-all' }}>
          <a href={urlPublica}>{urlPublica}</a>
        </p>
        {siteUrl && <QrCode url={urlPublica} size={140} />}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Plantilla de CV</h2>
        <select value={plantilla} onChange={(e) => cambiarPlantilla(e.target.value)}>
          <option value="clasica">Clasica</option>
          <option value="moderna">Moderna</option>
        </select>
        <p style={{ fontSize: 12, color: '#64748b' }}>
          Asi se vera tu CV al descargarse en PDF desde tu EProfile publica.
        </p>
      </div>

      <PerfilForm estudianteId={estudianteId} />

      <SeccionCRUD
        table="curriculums"
        estudianteId={estudianteId}
        titulo="Formacion y experiencia"
        campoResumen="titulo"
        campoSubResumen="institucion_empresa"
        campos={[
          { name: 'categoria', label: 'Categoria', type: 'select', opciones: ['formacion', 'experiencia', 'proyecto_academico'] },
          { name: 'titulo', label: 'Titulo', type: 'text' },
          { name: 'institucion_empresa', label: 'Institucion / Empresa', type: 'text' },
          { name: 'descripcion', label: 'Descripcion', type: 'textarea' },
          { name: 'fecha_inicio', label: 'Fecha inicio', type: 'date' },
          { name: 'fecha_fin', label: 'Fecha fin (vacio = actual)', type: 'date' },
        ]}
      />

      <SeccionCRUD
        table="proyectos"
        estudianteId={estudianteId}
        titulo="Proyectos"
        campoResumen="nombre"
        campos={[
          { name: 'nombre', label: 'Nombre', type: 'text' },
          { name: 'descripcion', label: 'Descripcion', type: 'textarea' },
          { name: 'tecnologias_rol', label: 'Tecnologias / rol', type: 'tags' },
          { name: 'enlace_demo', label: 'Enlace demo', type: 'url' },
          { name: 'enlace_repositorio', label: 'Enlace repositorio', type: 'url' },
          { name: 'es_academico', label: 'Es proyecto academico', type: 'checkbox' },
        ]}
      />

      <SeccionCRUD
        table="habilidades"
        estudianteId={estudianteId}
        titulo="Habilidades"
        campoResumen="nombre"
        campoSubResumen="categoria"
        campos={[
          { name: 'nombre', label: 'Nombre', type: 'text' },
          { name: 'categoria', label: 'Categoria', type: 'select', opciones: ['tecnica', 'blanda', 'otra'] },
        ]}
      />

      <SeccionCRUD
        table="reconocimientos"
        estudianteId={estudianteId}
        titulo="Reconocimientos"
        campoResumen="titulo"
        campoSubResumen="emisor"
        campos={[
          { name: 'titulo', label: 'Titulo', type: 'text' },
          { name: 'emisor', label: 'Emisor', type: 'text' },
          { name: 'fecha', label: 'Fecha', type: 'date' },
          { name: 'descripcion', label: 'Descripcion', type: 'textarea' },
        ]}
      />

      <SeccionCRUD
        table="enlaces_contacto"
        estudianteId={estudianteId}
        titulo="Contacto"
        campoResumen="red_tipo"
        campoSubResumen="valor"
        campos={[
          { name: 'red_tipo', label: 'Tipo', type: 'select', opciones: ['LinkedIn', 'GitHub', 'Correo', 'Telefono', 'Otro'] },
          { name: 'valor', label: 'Valor', type: 'text' },
        ]}
      />
    </div>
  );
}
