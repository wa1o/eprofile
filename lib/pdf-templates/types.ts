export interface CVData {
  perfil: { nombre_completo: string; carrera: string; resena: string };
  curriculums: {
    id: string;
    titulo: string;
    institucion_empresa: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
  }[];
  habilidades: { id: string; nombre: string }[];
  proyectos: { id: string; nombre: string; descripcion: string; es_academico: boolean }[];
  reconocimientos: { id: string; titulo: string; emisor: string; fecha: string }[];
  enlaces: { id: string; red_tipo: string; valor: string }[];
}
