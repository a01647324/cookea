import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { HojaInferior } from '../HojaInferior';
import { SearchBar } from '../SearchBar';
import Icono from '../Icono';
import { useRecipes } from '../../hooks/useRecipes';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  visible: boolean;
  nombreAlbum: string;
  idsEnAlbum: Set<number>;
  onAgregar: (recetaId: number) => Promise<boolean>;
  onCerrar: () => void;
}

export function HojaSelectorRecetas({ visible, nombreAlbum, idsEnAlbum, onAgregar, onCerrar }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [agregando, setAgregando] = useState<number | null>(null);
  const { recetas, cargando } = useRecipes({ busqueda, modoHogar: true });

  async function agregar(id: number) {
    setAgregando(id);
    await onAgregar(id);
    setAgregando(null);
  }

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <Text style={estilos.titulo}>Agregar a {nombreAlbum}</Text>
      <Text style={estilos.subtitulo}>Toca las recetas que quieras guardar.</Text>

      <View style={estilos.buscador}>
        <SearchBar placeholder="Busca una receta" onBuscar={setBusqueda} />
      </View>

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
          renderItem={({ item }) => {
            const yaEsta = idsEnAlbum.has(item.id);
            return (
              <Pressable
                onPress={() => !yaEsta && agregar(item.id)}
                disabled={yaEsta || agregando !== null}
                style={({ pressed }) => [estilos.fila, pressed && { opacity: 0.8 }]}
                accessibilityState={{ selected: yaEsta }}
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
                {agregando === item.id ? (
                  <ActivityIndicator color={colors.encabezado} />
                ) : yaEsta ? (
                  <View style={estilos.agregada}>
                    <Icono nombre="check-linear" size={18} color={colors.sobreEncabezado} />
                  </View>
                ) : (
                  <Icono nombre="add-circle-linear" size={30} color={colors.encabezado} />
                )}
              </Pressable>
            );
          }}
        />
      )}

      <Pressable onPress={onCerrar} style={estilos.listo}>
        <Text style={estilos.textoListo}>Listo</Text>
      </Pressable>
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
  agregada: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listo: {
    minHeight: 52,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoListo: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
});
