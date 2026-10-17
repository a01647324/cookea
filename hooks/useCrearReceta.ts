import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../lib/supabase';
import { IngredienteCatalogo } from '../types/alacena';
import { UnidadUI, aBase, convertirUI, formatearUI, opcionesUnidad } from '../lib/unidades';

import { esEnlaceVideoSeguro, limpiarTexto, validarCantidad, validarTextoLibre } from '../lib/entradas'

export interface IngredienteForm {

  ingrediente: IngredienteCatalogo;
  valor: number;
  unidad: UnidadUI;
  opcional: boolean;
}

export interface PasoForm {
  clave: string;
  texto: string;
  minutos: number | null;
}

export interface FormularioReceta {
  fotoUri: string | null;
  nombre: string;
  descripcion: string;
  tiempo: number;
  porciones: number;
  ingredientes: IngredienteForm[];
  pasos: PasoForm[];
  etiquetas: number[];
  electrodomesticos: number[];
  video: string;
}

export interface Catalogo {
  id: number;
  nombre: string;
}

export const nuevaClave = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const FORMULARIO_VACIO: FormularioReceta = {
  fotoUri: null,
  nombre: '',
  descripcion: '',
  tiempo: 30,
  porciones: 4,
  ingredientes: [],
  pasos: [{ clave: 'inicial', texto: '', minutos: null }],
  etiquetas: [],
  electrodomesticos: [],
  video: '',
};

export const REGEX_YOUTUBE = /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be)\//;

const ETIQUETAS_OCULTAS = ['Comunidad BAMX'];
const RUTA_PUBLICA = '/storage/v1/object/public/recetas/';

export type ResultadoPublicar = { ok: true; id: number } | { ok: false; mensaje: string };

async function subirFoto(uri: string, uid: string) {
  const imagen = await ImageManipulator.manipulate(uri).resize({ width: 1080 }).renderAsync();
  const comprimida = await imagen.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });

  const datos = await (await fetch(comprimida.uri)).arrayBuffer();
  const ruta = `${uid}/${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from('recetas')
    .upload(ruta, datos, { contentType: 'image/jpeg' });
  if (error) throw error;

  return { ruta, url: supabase.storage.from('recetas').getPublicUrl(ruta).data.publicUrl };
}

function rutaDesdeUrl(url: string | null) {
  if (!url || !url.includes(RUTA_PUBLICA)) return null;
  return url.split(RUTA_PUBLICA)[1];
}

export function useCrearReceta(recetaId?: number) {
  const [form, setForm] = useState<FormularioReceta>(FORMULARIO_VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [etiquetas, setEtiquetas] = useState<Catalogo[]>([]);
  const [electrodomesticos, setElectrodomesticos] = useState<Catalogo[]>([]);
  const [alias, setAlias] = useState('');
  const [yaAcepto, setYaAcepto] = useState(false);
  const [alergenos, setAlergenos] = useState<string[]>([]);
  const [publicando, setPublicando] = useState(false);
  const [borradorRecuperado, setBorradorRecuperado] = useState(false);

  const uid = useRef<string | null>(null);
  const fotoOriginal = useRef<string | null>(null);
  const esEdicion = recetaId != null;
  const claveBorrador = () => `cookea:borrador_receta:${uid.current}`;

  const actualizar = useCallback((cambios: Partial<FormularioReceta>) => {
    setForm((prev) => ({ ...prev, ...cambios }));
  }, []);

  useEffect(() => {
    (async () => {
      setCargando(true);
      setError(null);
      try {
        const { data: sesion } = await supabase.auth.getSession();
        uid.current = sesion.session?.user.id ?? null;
        if (!uid.current) throw new Error('sin sesión');

        const [et, el, perfil] = await Promise.all([
          supabase.from('etiquetas').select('id, nombre').order('nombre'),
          supabase.from('electrodomesticos').select('id, nombre').order('nombre'),
          supabase.from('perfiles').select('alias, acepto_comunidad_en').eq('id', uid.current).maybeSingle(),
        ]);

        setEtiquetas(((et.data ?? []) as Catalogo[]).filter((e) => !ETIQUETAS_OCULTAS.includes(e.nombre)));
        setElectrodomesticos((el.data ?? []) as Catalogo[]);
        setAlias(perfil.data?.alias ?? '');
        setYaAcepto(!!perfil.data?.acepto_comunidad_en);

        if (esEdicion) {
          const { data, error: errorReceta } = await supabase
            .from('recetas')
            .select(
              `nombre, descripcion, tiempo_min, porciones_base, foto_url, video_url, autor_id,
               receta_ingredientes(cantidad, opcional, ingredientes(id, nombre, categoria, unidad, imagen_url)),
               pasos_receta(orden, texto, temporizador_seg),
               receta_etiquetas(etiqueta_id),
               receta_electrodomesticos(electrodomestico_id)`
            )
            .eq('id', recetaId)
            .order('orden', { referencedTable: 'pasos_receta' })
            .maybeSingle();

          if (errorReceta || !data || data.autor_id !== uid.current) {
            setError('No puedes editar esta receta.');
            return;
          }

          const r = data as any;
          fotoOriginal.current = r.foto_url;
          setForm({
            fotoUri: r.foto_url,
            nombre: r.nombre,
            descripcion: r.descripcion ?? '',
            tiempo: r.tiempo_min,
            porciones: r.porciones_base,
            ingredientes: r.receta_ingredientes.map((ri: any) => {
              const base = ri.ingredientes.unidad as UnidadUI;
              const opciones = opcionesUnidad(ri.ingredientes.unidad);
              const unidad = opciones.includes(base) ? base : opciones[0];
              const valor = unidad === base ? Number(ri.cantidad) : convertirUI(Number(ri.cantidad), base, unidad);
              return { ingrediente: ri.ingredientes, valor, unidad, opcional: ri.opcional };
            }),
            pasos: r.pasos_receta.map((p: any) => ({
              clave: nuevaClave(),
              texto: p.texto,
              minutos: p.temporizador_seg ? Math.round(p.temporizador_seg / 60) : null,
            })),
            etiquetas: r.receta_etiquetas.map((e: any) => e.etiqueta_id),
            electrodomesticos: r.receta_electrodomesticos.map((e: any) => e.electrodomestico_id),
            video: r.video_url ?? '',
          });
        } else {
          const guardado = await AsyncStorage.getItem(claveBorrador()).catch(() => null);
          if (guardado) {
            setForm({ ...FORMULARIO_VACIO, ...JSON.parse(guardado) });
            setBorradorRecuperado(true);
          }
        }
      } catch {
        setError('No pudimos preparar el formulario. Revisa tu conexión.');
      } finally {
        setCargando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recetaId]);

  // Borrador automático (solo recetas nuevas)
  useEffect(() => {
    if (esEdicion || cargando || !uid.current) return;
    const temporizador = setTimeout(() => {
      AsyncStorage.setItem(claveBorrador(), JSON.stringify(form)).catch(() => {});
    }, 800);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, cargando, esEdicion]);

  // Alérgenos calculados desde los ingredientes elegidos
  const idsIngredientes = form.ingredientes.map((i) => i.ingrediente.id).join(',');
  useEffect(() => {
    const ids = form.ingredientes.map((i) => i.ingrediente.id);
    if (ids.length === 0) {
      setAlergenos([]);
      return;
    }
    supabase
      .from('ingrediente_alergenos')
      .select('alergenos(nombre)')
      .in('ingrediente_id', ids)
      .then(({ data }) => {
        const nombres = (data ?? []).map((f: any) => f.alergenos?.nombre).filter(Boolean);
        setAlergenos([...new Set<string>(nombres)]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsIngredientes]);

  const descartarBorrador = useCallback(async () => {
    if (uid.current) await AsyncStorage.removeItem(claveBorrador()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publicar = useCallback(
    
    async (acepto: boolean): Promise<ResultadoPublicar> => {
      if (!uid.current) return { ok: false, mensaje: 'Necesitas iniciar sesión.' };

      const nombre = validarTextoLibre(form.nombre, 'El nombre', 3, 100);
      if (!nombre.ok) return { ok: false, mensaje: nombre.error };
      const descripcion = validarTextoLibre(form.descripcion, 'La descripción', 0, 1000, { multilinea: true });
      if (!descripcion.ok) return { ok: false, mensaje: descripcion.error };
      const video = form.video.trim();
      if (video && !esEnlaceVideoSeguro(video)) {
        return { ok: false, mensaje: 'El enlace de video debe ser de YouTube (https).' };
      }
      for (const i of form.ingredientes) {
        const c = validarCantidad(i.valor);
        if (!c.ok) return { ok: false, mensaje: `${i.ingrediente.nombre}: ${c.error}` };
      }
      

      setPublicando(true);
      let fotoSubida: string | null = null;
      try {
        let fotoUrl = form.fotoUri;
        if (form.fotoUri && !form.fotoUri.startsWith('http')) {
          const subida = await subirFoto(form.fotoUri, uid.current);
          fotoSubida = subida.ruta;
          fotoUrl = subida.url;
        }

        const { data, error: errorRpc } = await supabase.rpc('publicar_receta', {
          p_receta_id: recetaId ?? null,
          p_nombre: nombre.valor,
          p_descripcion: descripcion.valor,
          p_tiempo: form.tiempo,
          p_porciones: form.porciones,
          p_foto_url: fotoUrl,
          p_video_url: video,
          p_ingredientes: form.ingredientes.map((i) => ({
            ingrediente_id: i.ingrediente.id,
            cantidad: aBase(i.valor, i.unidad),
            cantidad_texto: formatearUI(i.valor, i.unidad),
            opcional: i.opcional,
          })),
          p_pasos: form.pasos
            .filter((p) =>limpiarTexto(p.texto, 1000, { multilinea: true }))
            .map((p) => ({ texto: limpiarTexto(p.texto, 1000, { multilinea: true }), temporizador_seg: p.minutos ? p.minutos * 60 : null })),
          p_etiquetas: form.etiquetas,
          p_electrodomesticos: form.electrodomesticos,
          p_acepto: acepto,
        });

        if (errorRpc) {
          if (fotoSubida) await supabase.storage.from('recetas').remove([fotoSubida]);
          // P0001 = mensaje propio de la función (ya está en español y es seguro mostrarlo)
          const mensaje =
            errorRpc.code === 'P0001'
              ? errorRpc.message
              : errorRpc.code === '23514'
                ? 'Algún dato no cumple las reglas. Revisa los campos.'
                : 'No pudimos publicar tu receta. Intenta de nuevo.';
          return { ok: false, mensaje };
        }

        // Si cambió la foto al editar, se borra la anterior (solo si estaba en su carpeta)
        const rutaVieja = rutaDesdeUrl(fotoOriginal.current);
        if (esEdicion && fotoOriginal.current !== fotoUrl && rutaVieja?.startsWith(`${uid.current}/`)) {
          await supabase.storage.from('recetas').remove([rutaVieja]);
        }

        if (!esEdicion) await descartarBorrador();
        setYaAcepto(true);
        return { ok: true, id: data as number };
      } catch {
        if (fotoSubida) await supabase.storage.from('recetas').remove([fotoSubida]).catch(() => {});
        return { ok: false, mensaje: 'Revisa tu conexión a internet e intenta de nuevo.' };
      } finally {
        setPublicando(false);
      }
    },
    [form, recetaId, esEdicion, descartarBorrador]
  );

  return {
    form,
    actualizar,
    cargando,
    error,
    etiquetas,
    electrodomesticos,
    alias,
    yaAcepto,
    alergenos,
    publicando,
    publicar,
    esEdicion,
    borradorRecuperado,
    descartarBorrador,
  };
}