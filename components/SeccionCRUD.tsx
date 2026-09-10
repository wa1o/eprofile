'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Trash2, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export type Campo =
  | { name: string; label: string; type: 'text' | 'date' | 'url' }
  | { name: string; label: string; type: 'textarea' }
  | { name: string; label: string; type: 'checkbox' }
  | { name: string; label: string; type: 'select'; opciones: string[] }
  | { name: string; label: string; type: 'tags' };

interface Props {
  table: string;
  estudianteId: string;
  titulo: string;
  icono?: React.ReactNode;
  campos: Campo[];
  /** Nombre de campo(s) que forman el titulo visible de cada item en la lista */
  campoResumen: string;
  campoSubResumen?: string;
}

function valoresIniciales(campos: Campo[]): Record<string, any> {
  const v: Record<string, any> = {};
  for (const c of campos) {
    if (c.type === 'checkbox') v[c.name] = false;
    else if (c.type === 'tags') v[c.name] = '';
    else if (c.type === 'select') v[c.name] = c.opciones[0];
    else v[c.name] = '';
  }
  return v;
}

function itemAFormulario(item: Record<string, any>, campos: Campo[]): Record<string, any> {
  const v: Record<string, any> = {};
  for (const c of campos) {
    if (c.type === 'tags') v[c.name] = (item[c.name] ?? []).join(', ');
    else v[c.name] = item[c.name] ?? (c.type === 'checkbox' ? false : '');
  }
  return v;
}

function formularioAItem(valores: Record<string, any>, campos: Campo[]) {
  const out: Record<string, any> = {};
  for (const c of campos) {
    if (c.type === 'tags') {
      out[c.name] = String(valores[c.name] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (c.type === 'date') {
      out[c.name] = valores[c.name] || null;
    } else {
      out[c.name] = valores[c.name];
    }
  }
  return out;
}

export function SeccionCRUD({ table, estudianteId, titulo, icono, campos, campoResumen, campoSubResumen }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valores, setValores] = useState<Record<string, any>>(valoresIniciales(campos));

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudianteId, table]);

  async function cargar() {
    setCargando(true);
    const { data, error: err } = await supabase.from(table).select('*').eq('estudiante_id', estudianteId);
    if (err) setError(err.message);
    setItems(data ?? []);
    setCargando(false);
  }

  function abrirNuevo() {
    setEditandoId(null);
    setValores(valoresIniciales(campos));
    setMostrarForm(true);
  }

  function abrirEditar(item: any) {
    setEditandoId(item.id);
    setValores(itemAFormulario(item, campos));
    setMostrarForm(true);
  }

  async function guardar() {
    setError('');
    const payload = formularioAItem(valores, campos);

    if (editandoId) {
      const { error: err } = await supabase.from(table).update(payload).eq('id', editandoId);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await supabase
        .from(table)
        .insert([{ ...payload, estudiante_id: estudianteId, estado: 'borrador' }]);
      if (err) {
        setError(err.message);
        return;
      }
    }

    setMostrarForm(false);
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm('Eliminar este registro?')) return;
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    cargar();
  }

  async function alternarPublicado(item: any) {
    const nuevoEstado = item.estado === 'publicado' ? 'borrador' : 'publicado';
    const { error: err } = await supabase.from(table).update({ estado: nuevoEstado }).eq('id', item.id);
    if (err) {
      setError(err.message);
      return;
    }
    cargar();
  }

  return (
    <div className="card">
      <div className="top-bar">
        <h2 className="titulo-con-icono" style={{ margin: 0 }}>
          {icono} {titulo}
        </h2>
        {!mostrarForm && (
          <button onClick={abrirNuevo}>
            <Plus size={15} /> Agregar
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {mostrarForm && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
          {campos.map((c) => (
            <div key={c.name}>
              <label>{c.label}</label>
              {c.type === 'textarea' && (
                <textarea
                  value={valores[c.name] ?? ''}
                  onChange={(e) => setValores({ ...valores, [c.name]: e.target.value })}
                />
              )}
              {c.type === 'checkbox' && (
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={!!valores[c.name]}
                  onChange={(e) => setValores({ ...valores, [c.name]: e.target.checked })}
                />
              )}
              {c.type === 'select' && (
                <select
                  value={valores[c.name] ?? ''}
                  onChange={(e) => setValores({ ...valores, [c.name]: e.target.value })}
                >
                  {c.opciones.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              )}
              {(c.type === 'text' || c.type === 'url' || c.type === 'date' || c.type === 'tags') && (
                <input
                  type={c.type === 'date' ? 'date' : c.type === 'url' ? 'url' : 'text'}
                  placeholder={c.type === 'tags' ? 'separadas por coma' : ''}
                  value={valores[c.name] ?? ''}
                  onChange={(e) => setValores({ ...valores, [c.name]: e.target.value })}
                />
              )}
            </div>
          ))}
          <div className="fila-botones">
            <button onClick={guardar}>
              <Check size={15} /> Guardar
            </button>
            <button className="secundario" onClick={() => setMostrarForm(false)}>
              <X size={15} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <p>Cargando...</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Aun no has agregado nada aqui.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="item-lista">
            <div className="top-bar" style={{ marginBottom: 0 }}>
              <div>
                <strong>{item[campoResumen]}</strong>
                {campoSubResumen && item[campoSubResumen] ? (
                  <span style={{ color: '#64748b', fontSize: 12 }}> - {item[campoSubResumen]}</span>
                ) : null}
                <div>
                  <span className={`badge ${item.estado}`}>{item.estado}</span>
                </div>
              </div>
              <div className="fila-botones">
                <button className="secundario" onClick={() => abrirEditar(item)}>
                  <Pencil size={13} /> Editar
                </button>
                <button className="secundario" onClick={() => alternarPublicado(item)}>
                  {item.estado === 'publicado' ? <EyeOff size={13} /> : <Eye size={13} />}
                  {item.estado === 'publicado' ? 'Despublicar' : 'Publicar'}
                </button>
                <button className="peligro" onClick={() => eliminar(item.id)}>
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
