import useProteccionCapturas from './useProteccionCapturas';
import { seleccionarSeccion, SeccionPreferencias } from './secciones';
import React, { useCallback, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAlbums } from '../hooks/useAlbums';
import useSession from '../auth/useSession';
import { VistaError } from '../components/StateViews';
import { Esqueleto } from '../components/Esqueleto';
import { ConfirmarHoja } from '../components/ConfirmarHoja';
import Icono, { NombreIcono } from '../components/Icono';
import { mostrarAviso } from '../lib/avisos';
import { fondo } from '../constants/fondos';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import EliminarCuentaModal from './EliminarCuentaModal';

function nombres(filas: { alergenos: unknown }[]): string[] {
  return filas.flatMap((f) => {
    const relacion = Array.isArray(f.alergenos) ? f.alergenos[0] : f.alergenos;
    return relacion && typeof relacion === 'object' && 'nombre' in relacion && typeof relacion.nombre === 'string'
      ? [relacion.nombre]
      : [];
  });
}

interface PropsFila {
  icono: NombreIcono;
  fondoIcono: string;
  colorIcono: string;
  texto: string;
  detalle?: string;
  onPress: () => void;
  peligro?: boolean;
  primera?: boolean;
}

function Fila({ icono, fondoIcono, colorIcono, texto, detalle, onPress, peligro, primera }: PropsFila) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [estilos.fila, !primera && estilos.separador, pressed && { backgroundColor: colors.fondo }]}
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${texto}, ${detalle}` : texto}
    >
      <View style={[estilos.icono, { backgroundColor: fondoIcono }]}>
        <Icono nombre={icono} size={22} color={colorIcono} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[estilos.textoFila, peligro && { color: colors.peligro }]}>{texto}</Text>
        {!!detalle && (
          <Text style={estilos.detalle} numberOfLines={1}>
            {detalle}
          </Text>
        )}
      </View>
      {!peligro && <Icono nombre="alt-arrow-right-linear" size={20} color={colors.textoTenue} />}
    </Pressable>
  );
}

export default function PerfilScreen({ navigation }: any) {
  useProteccionCapturas('perfil');
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, cerrarSesion } = useSession();
  const { perfil, error: errorPerfil, recargar } = useUserProfile();
  const { albumes, cargando: cargandoAlbumes, error: errorAlbumes, recargar: recargarAlbumes } = useAlbums();
  const [propias, setPropias] = useState<string[] | null>(null);
  const [hogar, setHogar] = useState<string[] | null>(null);
  const [error, setError] = useState(false);
  const [cargandoAlergias, setCargandoAlergias] = useState(true);
  const [mostrarEliminar, setMostrarEliminar] = useState(false);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [intento, setIntento] = useState(0);
  const peticion = useRef(0);
  const id = session?.user.id;

  useFocusEffect(
    useCallback(() => {
      const solicitud = ++peticion.current;
      void intento;
      void recargar();
      void recargarAlbumes();
      if (!id) return;
      setCargandoAlergias(true);
      setError(false);
      async function cargar() {
        try {
          const [a, b] = await Promise.all([
            supabase.from('usuario_alergias').select('alergenos(nombre)').eq('usuario_id', id),
            supabase.from('hogar_alergias').select('alergenos(nombre)').eq('usuario_id', id),
          ]);
          if (a.error || b.error) throw new Error();
          if (solicitud === peticion.current) {
            setPropias(nombres(a.data ?? []));
            setHogar(nombres(b.data ?? []));
          }
        } catch {
          if (solicitud === peticion.current) setError(true);
        } finally {
          if (solicitud === peticion.current) setCargandoAlergias(false);
        }
      }
      void cargar();
      return () => {
        peticion.current++;
      };
    }, [id, recargar, recargarAlbumes, intento])
  );

  function preferencias(seccion: SeccionPreferencias) {
    if (id) seleccionarSeccion(id, seccion);
    navigation.navigate('Preferencias');
  }

  function abrirAlbum(tipo: 'ya_preparadas') {
    const album = albumes.find((a) => a.tipo === tipo);
    if (cargandoAlbumes) return mostrarAviso('Cargando tus álbumes', 'Espera un momento y vuelve a intentar.');
    if (errorAlbumes || !album) {
      void recargarAlbumes();
      return mostrarAviso('No pudimos abrir tu álbum', 'Vuelve a intentar cuando termine la carga.');
    }
    navigation.navigate('Inicio', {
      screen: 'ColeccionDetalle',
      params: { albumId: album.id, nombre: album.nombre, tipo },
      initial: false,
    });
  }

  const altoImagen = width * fondo.proporcionPerfil;

  if (!perfil || perfil.id !== id) {
    return (
      <View style={[estilos.pantalla, { paddingTop: insets.top }]}>
        {errorPerfil ? (
          <VistaError mensaje="No pudimos cargar tu perfil." onReintentar={() => void recargar()} />
        ) : (
          <View style={estilos.esqueletos}>
            <Esqueleto ancho={110} alto={110} radio={55} estilo={{ alignSelf: 'center', marginTop: altoImagen * 0.35 }} />
            <Esqueleto ancho="50%" alto={24} estilo={{ alignSelf: 'center', marginTop: espaciado.md }} />
            <Esqueleto ancho="100%" alto={76} radio={radios.lg} estilo={{ marginTop: espaciado.lg }} />
            <Esqueleto ancho="100%" alto={200} radio={radios.lg} estilo={{ marginTop: espaciado.lg }} />
          </View>
        )}
      </View>
    );
  }

  const contar = (tipo: string) => albumes.filter((a) => a.tipo === tipo).reduce((s, a) => s + a.cantidad_recetas, 0);
  const cifras = [
    { valor: cargandoAlbumes ? '—' : String(contar('ya_preparadas')), texto: 'preparadas', color: colors.calidoIntenso },
    { valor: cargandoAlbumes ? '—' : String(contar('favoritos')), texto: 'favoritas', color: colors.destacadoIntenso },
    { valor: String(perfil.personas_hogar), texto: perfil.personas_hogar === 1 ? 'persona' : 'personas', color: colors.acentoIntenso },
  ];

  const resumen = (lista: string[] | null) =>
    error ? 'No se pudieron cargar' : cargandoAlergias || lista === null ? 'Cargando…' : lista.length ? lista.join(', ') : 'Sin alergias';

  const inicial = Array.from(perfil.alias.trim())[0]?.toUpperCase() || '?';

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        <Image source={fondo.perfil} style={{ width, height: altoImagen }} resizeMode="cover" />

        <View style={[estilos.cabecera, { marginTop: -altoImagen * 0.55 }]}>
          <Pressable
            onPress={() => navigation.navigate('EditarPerfil')}
            style={estilos.avatar}
            accessibilityRole="button"
            accessibilityLabel={`Editar perfil de ${perfil.alias}`}
          >
            <Text style={estilos.inicial}>{inicial}</Text>
            <View style={[estilos.lapiz, { backgroundColor: fondo.acento }]}>
              <Icono nombre="pen-linear" size={15} color={colors.sobrePrimario} />
            </View>
          </Pressable>
          <Text style={estilos.alias}>{perfil.alias}</Text>
          <Text style={estilos.correo}>{session?.user.email}</Text>
          <Text style={estilos.privado}>
            {perfil.nombre} · solo tú ves tu nombre
          </Text>
        </View>

        <View style={estilos.cifras}>
          {cifras.map((c, i) => (
            <View key={c.texto} style={[estilos.cifra, i > 0 && estilos.cifraSeparada]}>
              <Text style={[estilos.numero, { color: c.color }]}>{c.valor}</Text>
              <Text style={estilos.textoCifra}>{c.texto}</Text>
            </View>
          ))}
        </View>

        {(errorPerfil || error) && (
          <Pressable onPress={() => setIntento((p) => p + 1)} style={estilos.aviso} accessibilityRole="button">
            <Icono nombre="danger-triangle-linear" size={20} color={colors.peligro} />
            <Text style={estilos.textoAviso}>No pudimos actualizar tus datos. Toca para reintentar.</Text>
          </Pressable>
        )}

        <Text style={estilos.seccion}>Preferencias</Text>
        <View style={estilos.grupo}>
          <Fila
            primera
            icono="health-linear"
            fondoIcono={colors.peligroSuave}
            colorIcono={colors.peligro}
            texto="Mis restricciones"
            detalle={resumen(propias)}
            onPress={() => preferencias('restricciones')}
          />
          <Fila
            icono="home-2-linear"
            fondoIcono={colors.calidoSuave}
            colorIcono={colors.calidoIntenso}
            texto="Mi hogar"
            detalle={
              perfil.personas_hogar > 1
                ? `${perfil.personas_hogar} personas · ${resumen(hogar)}`
                : '1 persona'
            }
            onPress={() => preferencias('hogar')}
          />
          <Fila
            icono="oven-mitts-linear"
            fondoIcono={colors.serenoSuave}
            colorIcono={colors.serenoIntenso}
            texto="Mi cocina"
            detalle="Utensilios y gustos"
            onPress={() => preferencias('cocina')}
          />
        </View>

        <Text style={estilos.seccion}>Mi actividad</Text>
        <View style={estilos.grupo}>
          <Fila
            primera
            icono="notebook-linear"
            fondoIcono={colors.acentoSuave}
            colorIcono={colors.acentoIntenso}
            texto="Mis publicaciones"
            onPress={() => navigation.navigate('Comunidad', { screen: 'MisPublicaciones', initial: false })}
          />
          <Fila
            icono="chef-hat-linear"
            fondoIcono={colors.calidoSuave}
            colorIcono={colors.calidoIntenso}
            texto="Recetas que he preparado"
            onPress={() => abrirAlbum('ya_preparadas')}
          />
          <Fila
            icono="heart-linear"
            fondoIcono={colors.destacadoSuave}
            colorIcono={colors.destacadoIntenso}
            texto="Favoritos y colecciones"
            onPress={() => navigation.navigate('Inicio', { screen: 'Favoritos', initial: false })}
          />
        </View>

        <Text style={estilos.seccion}>Cuenta</Text>
        <View style={estilos.grupo}>
          <Fila
            primera
            icono="pen-linear"
            fondoIcono={colors.fondo}
            colorIcono={colors.textoSuave}
            texto="Editar perfil"
            onPress={() => navigation.navigate('EditarPerfil')}
          />
          <Fila
            icono="lock-keyhole-linear"
            fondoIcono={colors.fondo}
            colorIcono={colors.textoSuave}
            texto="Cambiar contraseña"
            onPress={() => navigation.navigate('CambiarContrasena')}
          />
          <Fila
            icono="logout-2-linear"
            fondoIcono={colors.peligroSuave}
            colorIcono={colors.peligro}
            texto="Cerrar sesión"
            peligro
            onPress={() => setConfirmarSalida(true)}
          />
        </View>

        <Pressable onPress={() => setMostrarEliminar(true)} style={estilos.eliminar} accessibilityRole="button">
          <Text style={estilos.textoEliminar}>Eliminar mi cuenta</Text>
        </Pressable>
      </ScrollView>

      <ConfirmarHoja
        visible={confirmarSalida}
        titulo="¿Cerrar sesión?"
        mensaje="Tu alacena y tus recetas se quedan guardadas. Para volver a entrar necesitarás tu correo y contraseña."
        textoConfirmar="Cerrar sesión"
        icono="logout-2-linear"
        onConfirmar={() => {
          setConfirmarSalida(false);
          cerrarSesion();
        }}
        onCerrar={() => setConfirmarSalida(false)}
      />
      <EliminarCuentaModal visible={mostrarEliminar} onCerrar={() => setMostrarEliminar(false)} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  esqueletos: {
    paddingHorizontal: espaciado.md,
  },
  cabecera: {
    alignItems: 'center',
    paddingHorizontal: espaciado.md,
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: colors.superficieCalida,
    borderWidth: 5,
    borderColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.texto,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  inicial: {
    fontFamily: fuentes.negrita,
    fontSize: 44,
    color: colors.calidoOscuro,
  },
  lapiz: {
    position: 'absolute',
    right: -2,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alias: {
    fontFamily: fuentes.titulo,
    fontSize: 27,
    lineHeight: 35,
    color: colors.texto,
    marginTop: espaciado.sm,
    textAlign: 'center',
  },
  correo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
  },
  privado: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoTenue,
    textAlign: 'center',
    marginTop: 2,
  },
  cifras: {
    flexDirection: 'row',
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    paddingVertical: espaciado.md,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.lg,
  },
  cifra: {
    flex: 1,
    alignItems: 'center',
  },
  cifraSeparada: {
    borderLeftWidth: 1,
    borderLeftColor: colors.borde,
  },
  numero: {
    fontFamily: fuentes.negrita,
    fontSize: 24,
  },
  textoCifra: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.peligroSuave,
    borderRadius: radios.md,
    padding: 12,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  textoAviso: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
  },
  seccion: {
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 26,
    color: colors.texto,
    marginHorizontal: espaciado.md + 4,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  grupo: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    marginHorizontal: espaciado.md,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  separador: {
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoFila: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  detalle: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 1,
  },
  eliminar: {
    alignSelf: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: espaciado.lg,
    marginTop: espaciado.lg,
  },
  textoEliminar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
    textDecorationLine: 'underline',
  },
});
