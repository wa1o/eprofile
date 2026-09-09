import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { CVData } from './types';

const s = StyleSheet.create({
  page: { flexDirection: 'row', fontSize: 10, fontFamily: 'Helvetica' },
  sidebar: { width: '32%', backgroundColor: '#1e293b', color: '#fff', padding: 20 },
  main: { width: '68%', padding: 24 },
  nombre: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  carrera: { fontSize: 10, color: '#cbd5e1', marginTop: 2, marginBottom: 12 },
  bloqueTitulo: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 4,
  },
  linea: { fontSize: 9, color: '#e2e8f0', marginBottom: 2 },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 14,
    marginBottom: 6,
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 3,
  },
  item: { marginBottom: 8 },
  itemTitulo: { fontSize: 10, fontWeight: 'bold' },
  itemSub: { fontSize: 9, color: '#555' },
  itemDesc: { fontSize: 9, color: '#333', marginTop: 2 },
});

function fmt(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });
}

export function ModernaTemplate({ data }: { data: CVData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.sidebar}>
          <Text style={s.nombre}>{data.perfil.nombre_completo}</Text>
          <Text style={s.carrera}>{data.perfil.carrera}</Text>
          {data.perfil.resena ? <Text style={s.linea}>{data.perfil.resena}</Text> : null}

          {data.enlaces.length > 0 && (
            <View>
              <Text style={s.bloqueTitulo}>Contacto</Text>
              {data.enlaces.map((e) => (
                <Text key={e.id} style={s.linea}>
                  {e.red_tipo}: {e.valor}
                </Text>
              ))}
            </View>
          )}

          {data.habilidades.length > 0 && (
            <View>
              <Text style={s.bloqueTitulo}>Habilidades</Text>
              {data.habilidades.map((h) => (
                <Text key={h.id} style={s.linea}>
                  - {h.nombre}
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={s.main}>
          {data.curriculums.length > 0 && (
            <View>
              <Text style={s.seccionTitulo}>Formacion y experiencia</Text>
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
            <View>
              <Text style={s.seccionTitulo}>Proyectos</Text>
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

          {data.reconocimientos.length > 0 && (
            <View>
              <Text style={s.seccionTitulo}>Reconocimientos</Text>
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
        </View>
      </Page>
    </Document>
  );
}
