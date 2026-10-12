import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Alergeno } from "../types/database";
import { calcularCambios } from "./preferencias";

// Mensajes que comparten las pantallas de Perfil
export const MENSAJE_ERROR_CARGA =
  "No pudimos cargar tus datos. Revisa tu internet e intenta de nuevo.";
export const MENSAJE_ERROR_GUARDAR = "No se pudieron guardar los cambios. Intenta de nuevo.";
export const MENSAJE_CERO_FILAS =
  "No se pudieron guardar los cambios. Cierra sesión, vuelve a entrar e intenta de nuevo.";
export const MENSAJE_SIN_CONEXION = "No hay conexión. Revisa tu internet e intenta de nuevo.";

// (nuevo) Lo que regresa Supabase en cada consulta: los datos o el error.
// status vale 0 cuando no hubo respuesta del servidor (sin internet):
// Supabase no lanza ese error, lo regresa aquí.
type Respuesta = {
  error: { code: string; message: string } | null;
  status: number;
};

// Revisa una respuesta de Supabase. Regresa el mensaje para la persona,
// o null si no hubo error.
function revisarRespuesta(respuesta: Respuesta): string | null {
  if (respuesta.error === null) return null;
  console.log(respuesta.error.code, respuesta.error.message);
  if (respuesta.status === 0) return MENSAJE_SIN_CONEXION;
  return MENSAJE_ERROR_GUARDAR;
}

// (nuevo) Guarda las alergias de una tabla (usuario_alergias o hogar_alergias)
// escribiendo solo lo que cambió. Regresa el mensaje de error o null.
//
// screens/alergias.tsx borra todo y vuelve a insertar: si el borrado sale bien
// y el insert falla, la persona se queda sin alergias. Aquí PRIMERO agregamos y
// DESPUÉS quitamos: si algo falla a la mitad, quedan alergias de más, nunca de
// menos. En un filtro de alergias, lo seguro es ser más estricto.
async function guardarAlergias(
  tabla: "usuario_alergias" | "hogar_alergias",
  guardados: Set<number>,
  seleccionados: Set<number>
): Promise<string | null> {
  const { agregar, quitar } = calcularCambios(guardados, seleccionados);

  if (agregar.length > 0) {
    // Solo mandamos alergeno_id: el servidor pone usuario_id con auth.uid().
    // ignoreDuplicates: si una ya existía (por ejemplo, en un reintento),
    // se ignora sin error.
    const filas = agregar.map((id) => ({ alergeno_id: id }));
    const respuesta = await supabase
      .from(tabla)
      .upsert(filas, { onConflict: "usuario_id,alergeno_id", ignoreDuplicates: true });
    const mensaje = revisarRespuesta(respuesta);
    if (mensaje !== null) return mensaje;
  }

  if (quitar.length > 0) {
    // (nuevo) No filtramos por usuario_id: las políticas RLS ("Solo el
    // dueño") hacen que solo se puedan borrar las filas propias.
    const respuesta = await supabase.from(tabla).delete().in("alergeno_id", quitar);
    const mensaje = revisarRespuesta(respuesta);
    if (mensaje !== null) return mensaje;
  }

  return null;
}

// usePreferencias: carga y guarda las preferencias de la persona (cuántas
// personas viven en su casa, sus alergias y las de su hogar). Lo usan
// PersonalizaScreen y PreferenciasScreen para no repetir código.
// La carga del catálogo y la forma de marcar/desmarcar vienen de
// screens/alergias.tsx, con un Set en vez de un arreglo.
export default function usePreferencias() {
  // Catálogo de alérgenos (solo lectura)
  const [alergenos, setAlergenos] = useState<Alergeno[]>([]);

  // (clase) Un useState por cada valor. Cada uno tiene su copia "guardada",
  // que es lo que hay en la base, para saber qué cambió.
  const [personas, setPersonas] = useState(1);
  const [personasGuardadas, setPersonasGuardadas] = useState(1);
  // (nuevo) Set: una colección sin repetidos donde marcar y revisar es O(1)
  const [propias, setPropias] = useState<Set<number>>(new Set());
  const [propiasGuardadas, setPropiasGuardadas] = useState<Set<number>>(new Set());
  const [hogar, setHogar] = useState<Set<number>>(new Set());
  const [hogarGuardadas, setHogarGuardadas] = useState<Set<number>>(new Set());

  const [usuarioId, setUsuarioId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [guardando, setGuardando] = useState(false);

  // (clase) useEffect con [] para cargar una sola vez al abrir la pantalla
  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setErrorCarga("");

    // (clase) async/await con try/catch/finally para "fail gracefully"
    try {
      // (nuevo) getSession lee la sesión guardada en el celular, sin internet
      const { data } = await supabase.auth.getSession();
      if (data.session === null) {
        setErrorCarga(MENSAJE_ERROR_CARGA);
        return;
      }
      const id = data.session.user.id;
      setUsuarioId(id);

      // (nuevo) Promise.all hace las cuatro consultas al mismo tiempo y espera
      // a que terminen todas. Es más rápido que hacerlas una por una.
      const [resAlergenos, resPropias, resHogar, resPerfil] = await Promise.all([
        supabase.from("alergenos").select("id, nombre").order("id"),
        supabase.from("usuario_alergias").select("alergeno_id"),
        supabase.from("hogar_alergias").select("alergeno_id"),
        supabase.from("perfiles").select("personas_hogar").eq("id", id).single(),
      ]);

      const errores = [resAlergenos.error, resPropias.error, resHogar.error, resPerfil.error];
      let huboError = false;
      for (const error of errores) {
        if (error) {
          console.log(error.code, error.message);
          huboError = true;
        }
      }
      if (huboError) {
        setErrorCarga(MENSAJE_ERROR_CARGA);
        return;
      }

      const idsPropias = new Set<number>(
        (resPropias.data ?? []).map((fila) => fila.alergeno_id as number)
      );
      const idsHogar = new Set<number>(
        (resHogar.data ?? []).map((fila) => fila.alergeno_id as number)
      );
      const numeroPersonas = (resPerfil.data?.personas_hogar as number) ?? 1;

      setAlergenos(resAlergenos.data ?? []);
      setPropias(idsPropias);
      setPropiasGuardadas(idsPropias);
      setHogar(idsHogar);
      setHogarGuardadas(idsHogar);
      setPersonas(numeroPersonas);
      setPersonasGuardadas(numeroPersonas);
    } catch (e) {
      console.log("Error al cargar las preferencias", e);
      setErrorCarga(MENSAJE_ERROR_CARGA);
    } finally {
      setCargando(false);
    }
  }

  // (clase) Marcar y desmarcar, como seleccionarAlergeno de screens/alergias.tsx.
  // Copiamos el Set para que React note el cambio y vuelva a dibujar.
  function alternarPropia(id: number) {
    const nuevo = new Set(propias);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    setPropias(nuevo);
  }

  function alternarHogar(id: number) {
    const nuevo = new Set(hogar);
    if (nuevo.has(id)) nuevo.delete(id);
    else nuevo.add(id);
    setHogar(nuevo);
  }

  function limpiarPropias() {
    setPropias(new Set());
  }

  function limpiarHogar() {
    setHogar(new Set());
  }

  // Si vive sola o solo, las alergias del hogar cuentan como vacías
  function hogarSegunPersonas(seleccion: Set<number>): Set<number> {
    return personas === 1 ? new Set<number>() : seleccion;
  }

  const cambiosPropias = calcularCambios(propiasGuardadas, propias);
  const cambiosHogar = calcularCambios(hogarGuardadas, hogarSegunPersonas(hogar));
  const hayCambios =
    personas !== personasGuardadas ||
    cambiosPropias.agregar.length > 0 ||
    cambiosPropias.quitar.length > 0 ||
    cambiosHogar.agregar.length > 0 ||
    cambiosHogar.quitar.length > 0;

  // Guarda en este orden: personas, alergias propias, alergias del hogar.
  // Regresa null si todo salió bien, o el mensaje de error para mostrar.
  // Lo que ya se guardó pasa a ser la copia "guardada", así un reintento
  // solo escribe lo que falta.
  // Normalmente guarda lo marcado en pantalla. Personaliza puede pasar otra
  // selección (por ejemplo, vacía en "No tengo alergias, terminar"), porque
  // el estado nuevo de React todavía no estaría listo en esta llamada.
  async function guardar(
    propiasElegidas: Set<number> = propias,
    hogarElegido: Set<number> = hogar
  ): Promise<string | null> {
    const hogarParaGuardar = hogarSegunPersonas(hogarElegido);
    setGuardando(true);
    try {
      // 1. Personas en la casa, solo si cambió
      if (personas !== personasGuardadas) {
        // (nuevo) .select() regresa las filas que se actualizaron. Si regresa
        // cero, RLS no encontró la fila aunque no mande error.
        const respuesta = await supabase
          .from("perfiles")
          .update({ personas_hogar: personas })
          .eq("id", usuarioId)
          .select("id");
        const mensaje = revisarRespuesta(respuesta);
        if (mensaje !== null) return mensaje;
        if (respuesta.data === null || respuesta.data.length === 0) {
          console.log("update de perfiles regresó cero filas");
          return MENSAJE_CERO_FILAS;
        }
        setPersonasGuardadas(personas);
      }

      // 2. Alergias propias
      const mensajePropias = await guardarAlergias(
        "usuario_alergias",
        propiasGuardadas,
        propiasElegidas
      );
      if (mensajePropias !== null) return mensajePropias;
      setPropiasGuardadas(new Set(propiasElegidas));
      setPropias(new Set(propiasElegidas));

      // 3. Alergias del hogar (vacías si vive sola o solo)
      const mensajeHogar = await guardarAlergias(
        "hogar_alergias",
        hogarGuardadas,
        hogarParaGuardar
      );
      if (mensajeHogar !== null) return mensajeHogar;
      setHogarGuardadas(new Set(hogarParaGuardar));
      setHogar(new Set(hogarParaGuardar));

      return null;
    } catch (e) {
      console.log("Error al guardar las preferencias", e);
      return MENSAJE_SIN_CONEXION;
    } finally {
      setGuardando(false);
    }
  }

  return {
    alergenos,
    personas,
    cambiarPersonas: setPersonas,
    propias,
    alternarPropia,
    limpiarPropias,
    hogar,
    alternarHogar,
    limpiarHogar,
    hayCambios,
    cargando,
    errorCarga,
    recargar: cargar,
    guardando,
    guardar,
  };
}
