import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from './types';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: '2 solid #333', paddingBottom: 10 },
  nombre: { fontSize: 22, fontWeight: 'bold' },
  carrera: { fontSize: 13, color: '#555', marginTop: 2 },
  resena: { fontSize: 10, color: '#333', marginTop: 8 },
  seccion: { marginTop: 16 },
  titulo: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, textTransform: 'uppercase' },
  item: { marginBottom: 8 },
  itemTitulo: { fontSize: 11, fontWeight: 'bold' },
  itemSub: { fontSize: 10, color: '#555' },
  itemDesc: { fontSize: 10, color: '#333', marginTop: 2 },
});

function fmt(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
}

export function ClasicaTemplate({ data }: { data: CVData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.nombre}>{data.perfil.nombre_completo}</Text>
          <Text style={s.carrera}>{data.perfil.carrera}</Text>
          {data.perfil.resena ? <Text style={s.resena}>{data.perfil.resena}</Text> : null}
        </View>

        {data.curriculums.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.titulo}>Formacion y experiencia</Text>
            {data.curriculums.map((c) => (
              <View key={c.id} style={s.item}>
                <Text style={s.itemTitulo}>{c.titulo}</Text>
                <Text style={s.itemSub}>
                  {c.institucion_empresa}
                  {c.fecha_inicio ? ` - ${fmt(c.fecha_inicio)} a ${c.fecha_fin ? fmt(c.fecha_fin) : 'Actual'}` : ''}
                </Text>
                {c.descripcion ? <Text style={s.itemDesc}>{c.descripcion}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {data.proyectos.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.titulo}>Proyectos</Text>
            {data.proyectos.map((p) => (
              <View key={p.id} style={s.item}>
                <Text style={s.itemTitulo}>
                  {p.nombre}
                  {p.es_academico ? ' (Academico)' : ''}
                </Text>
                {p.descripcion ? <Text style={s.itemDesc}>{p.descripcion}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {data.habilidades.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.titulo}>Habilidades</Text>
            <Text style={s.itemDesc}>{data.habilidades.map((h) => h.nombre).join('  -  ')}</Text>
          </View>
        )}

        {data.reconocimientos.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.titulo}>Reconocimientos</Text>
            {data.reconocimientos.map((r) => (
              <View key={r.id} style={s.item}>
                <Text style={s.itemTitulo}>{r.titulo}</Text>
                <Text style={s.itemSub}>
                  {r.emisor}
                  {r.fecha ? ` - ${fmt(r.fecha)}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {data.enlaces.length > 0 && (
          <View style={s.seccion}>
            <Text style={s.titulo}>Contacto</Text>
            {data.enlaces.map((e) => (
              <Text key={e.id} style={s.itemDesc}>
                {e.red_tipo}: {e.valor}
              </Text>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
