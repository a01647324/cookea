import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { useAlbums } from '../../hooks/useAlbums';
import { mostrarAviso } from '../../lib/avisos';
import { RecetaResumen } from '../../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  visible: boolean;
  receta: RecetaResumen | null;
  onCerrar: () => void;
}

export function HojaColeccion({ visible, receta, onCerrar }: Props) {
  const { albumes, cargando, error, crearAlbum, agregarRecetaAAlbum } = useAlbums();
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);

  const propias = albumes.filter((a) => a.tipo === 'propio');

  useEffect(() => {
    if (!visible) return;
    setCreando(false);
    setNombre('');
  }, [visible]);

  async function guardarEn(albumId: number, nombreAlbum: string) {
    if (!receta) return;
    setGuardando(true);
    const ok = await agregarRecetaAAlbum(albumId, receta.id);
    setGuardando(false);
    if (ok) {
      onCerrar();
      mostrarAviso('Guardada', `${receta.nombre} quedó en "${nombreAlbum}".`);
    }
  }

  async function crearYGuardar() {
    const limpio = nombre.trim();
    if (!limpio || !receta) return;
    setGuardando(true);
    const album = await crearAlbum(limpio);
    setGuardando(false);
    if (album) await guardarEn(album.id, album.nombre);
  }

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.circulo}>
        <Icono nombre="folder-with-files-linear" size={28} color={colors.calidoIntenso} />
      </View>
      <Text style={estilos.titulo}>Guardar en colección</Text>
      {receta && (
        <Text style={estilos.subtitulo} numberOfLines={2}>
          {receta.nombre}
        </Text>
      )}

      {cargando ? (
        <ActivityIndicator color={colors.encabezado} style={{ marginVertical: espaciado.lg }} />
      ) : error ? (
        <Text style={estilos.error}>{error}</Text>
      ) : propias.length === 0 && !creando ? (
        <Text style={estilos.vacio}>Todavía no tienes colecciones. Crea la primera aquí abajo.</Text>
      ) : (
        <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false}>
          {propias.map((album) => (
            <Pressable
              key={album.id}
              onPress={() => guardarEn(album.id, album.nombre)}
              disabled={guardando}
              style={({ pressed }) => [estilos.fila, pressed && { opacity: 0.8 }]}
            >
              <View style={estilos.iconoFila}>
                <Icono nombre="folder-linear" size={20} color={colors.calidoIntenso} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombreAlbum}>{album.nombre}</Text>
                <Text style={estilos.cantidad}>
                  {album.cantidad_recetas} {album.cantidad_recetas === 1 ? 'receta' : 'recetas'}
                </Text>
              </View>
              <Icono nombre="add-circle-linear" size={24} color={colors.encabezado} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {creando ? (
        <View style={estilos.crear}>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de la colección"
            placeholderTextColor={colors.textoTenue}
            style={estilos.input}
            maxLength={40}
            autoFocus
            autoComplete="off"
            importantForAutofill="no"
          />
          <View style={estilos.botones}>
            <Pressable onPress={() => setCreando(false)} style={[estilos.boton, estilos.botonCancelar]}>
              <Text style={estilos.textoCancelar}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={crearYGuardar}
              disabled={guardando || !nombre.trim()}
              style={[estilos.boton, estilos.botonCrear, (!nombre.trim() || guardando) && { opacity: 0.5 }]}
            >
              {guardando ? (
                <ActivityIndicator color={colors.sobreEncabezado} />
              ) : (
                <Text style={estilos.textoCrear}>Crear y guardar</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setCreando(true)} style={estilos.nueva}>
          <Icono nombre="add-circle-linear" size={20} color={colors.acentoIntenso} />
          <Text style={estilos.textoNueva}>Crear nueva colección</Text>
        </Pressable>
      )}
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: espaciado.md,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
    textAlign: 'center',
    marginVertical: espaciado.md,
  },
  vacio: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    textAlign: 'center',
    marginVertical: espaciado.md,
  },
  lista: {
    maxHeight: 300,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderRadius: 18,
    padding: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  iconoFila: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreAlbum: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  cantidad: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
  nueva: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.acento,
    marginTop: espaciado.sm,
  },
  textoNueva: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.acentoIntenso,
  },
  crear: {
    marginTop: espaciado.sm,
  },
  input: {
    minHeight: 50,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: espaciado.md,
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  botones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginTop: espaciado.sm,
  },
  boton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCancelar: {
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  botonCrear: {
    backgroundColor: colors.encabezado,
  },
  textoCancelar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  textoCrear: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobreEncabezado,
  },
});
