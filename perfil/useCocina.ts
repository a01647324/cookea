import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { calcularCambios } from './preferencias';
import { OpcionCatalogo } from './SelectorIngredientes';
type Tipo = 'gusta' | 'disgusta';
export default function useCocina() {
 const [ingredientes, setIngredientes] = useState<OpcionCatalogo[]>([]);
 const [electrodomesticos, setElectrodomesticos] = useState<OpcionCatalogo[]>([]);
 const [gustos, setGustos] = useState(new Map<number, Tipo>());
 const [aparatos, setAparatos] = useState(new Set<number>());
 const guardados = useRef(new Map<number, Tipo>());
 const aparatosGuardados = useRef(new Set<number>());
 const usuario = useRef<string | null>(null);
 const [baseGustos,setBaseGustos] = useState(new Map<number, Tipo>());
 const [baseAparatos,setBaseAparatos] = useState(new Set<number>());
 const bloqueo = useRef(false);
 const [cargando, setCargando] = useState(true);
 const [error, setError] = useState('');
 const [guardando, setGuardando] = useState(false);
 const cargar = useCallback(async () => {
  try {
   const { data: sesion } = await supabase.auth.getSession();
   setCargando(true); setError('');
   if (!sesion.session) throw new Error();
   const id = sesion.session.user.id;
   const [ing, electro, preferencias, equipos] = await Promise.all([
    supabase.from('ingredientes').select('id, nombre').order('nombre'),
    supabase.from('electrodomesticos').select('id, nombre').order('nombre'),
    supabase.from('usuario_preferencias').select('ingrediente_id, tipo').eq('usuario_id', id),
    supabase.from('usuario_electrodomesticos').select('electrodomestico_id').eq('usuario_id', id),
   ]);
   if ([ing, electro, preferencias, equipos].some(r => r.error)) throw new Error();
   const seleccion = new Map<number, Tipo>();
   for (const fila of preferencias.data ?? []) {
    if (fila.tipo !== 'gusta' && fila.tipo !== 'disgusta') throw new Error();
    seleccion.set(fila.ingrediente_id, fila.tipo);
   }
   const disponibles = new Set<number>((equipos.data ?? []).map(f => f.electrodomestico_id));
   setIngredientes(ing.data ?? []); setElectrodomesticos(electro.data ?? []);
   guardados.current = new Map(seleccion); aparatosGuardados.current = new Set(disponibles);
   setBaseGustos(new Map(seleccion)); setBaseAparatos(new Set(disponibles));
   setGustos(seleccion); setAparatos(disponibles); usuario.current = id;
  } catch { setError('No pudimos cargar tus gustos y cocina. Reintenta antes de guardar.'); }
  finally { setCargando(false); }
}, []);
  const inicio = useRef(false);
  useFocusEffect(useCallback(() => { if (!inicio.current) { inicio.current = true; void cargar(); } }, [cargar]));
 function alternarGusto(id: number, tipo: Tipo) {
  setGustos(prev => { const next = new Map(prev); if (next.get(id) === tipo) next.delete(id); else next.set(id, tipo); return next; });
 }
 function alternarAparato(id: number) {
  setAparatos(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
 }
 const cambiosAparatos = calcularCambios(baseAparatos, aparatos);
 const hayCambios = gustos.size !== baseGustos.size || [...gustos].some(([id,tipo]) => baseGustos.get(id) !== tipo) || cambiosAparatos.agregar.length > 0 || cambiosAparatos.quitar.length > 0;
 async function guardar(bloque: "gustos" | "cocina" | "todos" = "todos"): Promise<string | null> {
  if (bloqueo.current || cargando || error || !usuario.current) return 'Espera a que tus preferencias carguen correctamente.';
  bloqueo.current = true; setGuardando(true);
  try {
   const { data: sesion } = await supabase.auth.getSession();
   if (sesion.session?.user.id !== usuario.current) return 'La sesión cambió. Vuelve a abrir tus preferencias.';
   const id = usuario.current;
   // (nuevo) Guardamos solo diferencias. Cada bloque confirmado se conserva para reintentar.
   if (bloque !== "cocina") {
   const nuevos = [...gustos].filter(([ing,tipo]) => guardados.current.get(ing) !== tipo);
   if (nuevos.length) {
    const r = await supabase.from('usuario_preferencias').upsert(nuevos.map(([ingrediente_id,tipo]) => ({ usuario_id: id, ingrediente_id, tipo })), { onConflict: 'usuario_id,ingrediente_id' }).select('ingrediente_id');
    if (r.error || r.data?.length !== nuevos.length) throw new Error();
    for (const [ing,tipo] of nuevos) guardados.current.set(ing,tipo);
    setBaseGustos(new Map(guardados.current));
   }
   const quitar = [...guardados.current.keys()].filter(ing => !gustos.has(ing));
   if (quitar.length) {
    const r = await supabase.from('usuario_preferencias').delete().eq('usuario_id',id).in('ingrediente_id',quitar).select('ingrediente_id');
    if (r.error) throw new Error();
    if (r.data?.length !== quitar.length) {
     const restantes = await supabase.from('usuario_preferencias').select('ingrediente_id').eq('usuario_id',id).in('ingrediente_id',quitar);
     if (restantes.error || restantes.data?.length) throw new Error();
    }
    for (const ing of quitar) guardados.current.delete(ing);
    setBaseGustos(new Map(guardados.current));
   }
   }
   if (bloque !== "gustos") {
   if (cambiosAparatos.agregar.length) {
    const r = await supabase.from('usuario_electrodomesticos').upsert(cambiosAparatos.agregar.map(electrodomestico_id => ({ usuario_id:id, electrodomestico_id })), { onConflict:'usuario_id,electrodomestico_id' }).select('electrodomestico_id');
    if (r.error || r.data?.length !== cambiosAparatos.agregar.length) throw new Error();
    for (const aparato of cambiosAparatos.agregar) aparatosGuardados.current.add(aparato);
    setBaseAparatos(new Set(aparatosGuardados.current));
   }
   if (cambiosAparatos.quitar.length) {
    const r = await supabase.from('usuario_electrodomesticos').delete().eq('usuario_id',id).in('electrodomestico_id',cambiosAparatos.quitar).select('electrodomestico_id');
    if (r.error) throw new Error();
    if (r.data?.length !== cambiosAparatos.quitar.length) {
     const restantes = await supabase.from('usuario_electrodomesticos').select('electrodomestico_id').eq('usuario_id',id).in('electrodomestico_id',cambiosAparatos.quitar);
     if (restantes.error || restantes.data?.length) throw new Error();
    }
    for (const aparato of cambiosAparatos.quitar) aparatosGuardados.current.delete(aparato);
    setBaseAparatos(new Set(aparatosGuardados.current));
   }
   }
   return null;
  } catch { return 'No se completó el guardado de gustos y cocina. Algunos cambios pueden haberse guardado. Conservamos tu selección; vuelve a intentar.'; }
  finally { bloqueo.current = false; setGuardando(false); }
 }
 return { ingredientes, electrodomesticos, gustos, aparatos, alternarGusto, alternarAparato, hayCambios, cargando, error, recargar:cargar, guardar, guardando };
}
