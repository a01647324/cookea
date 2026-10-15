import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { HojaInferior } from '../HojaInferior';
import { SearchBar } from '../SearchBar';
import Icono from '../Icono';
import { useRecipes } from '../../hooks/useRecipes';
import { RecetaResumen } from '../../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  visible: boolean;
  titulo: string;
  subtitulo: string;
  error?: string | null;
  onElegir: (receta: RecetaResumen) => Promise<boolean>;
  onCerrar: () => void;
}

export function HojaElegirReceta({ visible, titulo, subtitulo, error, onElegir, onCerrar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [version, setVersion] = useState(0);
  const [guardando, setGuardando] = useState<number | null>(null);
  const { recetas, cargando } = useRecipes({ busqueda, modoHogar: true });

  useEffect(() => {
    if (!visible) return;
    setBusqueda('');
    setVersion((v) => v + 1);
  }, [visible]);

  async function elegir(receta: RecetaResumen) {
    setGuardando(receta.id);
    await onElegir(receta);
    setGuardando(null);
  }

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.subtitulo}>{subtitulo}</Text>

      <View style={estilos.buscador}>
        <SearchBar key={version} placeholder="Busca una receta" onBuscar={setBusqueda} />
      </View>

      {!!error && <Text style={estilos.error}>{error}</Text>}

      {cargando ? (
        <ActivityIndicator color={colors.encabezado} style={{ marginVertical: espaciado.lg }} />
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(r) => String(r.id)}
          style={estilos.lista}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={estilos.vacio}>
              {busqueda.trim() ? `No encontramos «${busqueda.trim()}».` : 'No hay recetas disponibles.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => elegir(item)}
              disabled={guardando !== null}
              style={({ pressed }) => [estilos.fila, pressed && { opacity: 0.8 }]}
            >
              {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={estilos.foto} contentFit="cover" />
              ) : (
                <View style={[estilos.foto, estilos.sinFoto]}>
                  <Icono nombre="chef-hat-linear" size={22} color={colors.textoSuave} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre} numberOfLines={2}>
                  {item.nombre}
                </Text>
                <Text style={estilos.meta}>{item.tiempo_min} min</Text>
              </View>
              {guardando === item.id ? (
                <ActivityIndicator color={colors.encabezado} />
              ) : (
                <Icono nombre="add-circle-linear" size={30} color={colors.encabezado} />
              )}
            </Pressable>
          )}
        />
      )}
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.texto,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 2,
  },
  buscador: {
    marginVertical: espaciado.md,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
    textAlign: 'center',
    marginBottom: espaciado.sm,
  },
  lista: {
    flexShrink: 1,
  },
  vacio: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginVertical: espaciado.lg,
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
  foto: {
    width: 56,
    height: 56,
    borderRadius: radios.md,
  },
  sinFoto: {
    backgroundColor: colors.superficieCalida,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    lineHeight: 20,
    color: colors.texto,
  },
  meta: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
});
