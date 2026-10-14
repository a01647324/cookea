import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  RecetaResumen,
} from '../types/database';

import {
  RecipeCard,
} from './RecipeCard';

import {
  useFavoriteToggle,
} from '../hooks/useFavoriteToggle';

import {
  useAlbumToggle,
} from '../hooks/useAlbumToggle';

import {
  colors,
  espaciado,
  radios,
} from '../theme/theme';


interface Props {
  receta: RecetaResumen;

  colorFondo: string;

  onAbrir: () => void;

  onColeccion: (
    receta: RecetaResumen
  ) => void;

  onSemana: (receta: RecetaResumen) => void;
}


export function RecetarioRecipeItem({
  receta,
  colorFondo,
  onAbrir,
  onColeccion,
  onSemana,
}: Props) {

  const {
    esFavorita,
    cargando:
      cargandoFavorito,
    alternar:
      alternarFavorito,
  } = useFavoriteToggle(
    receta.id
  );


  const {
    activo:
      hacerDespues,
    cargando:
      cargandoDespues,
    alternar:
      alternarDespues,
  } = useAlbumToggle(
    receta.id,
    'hacer_despues'
  );


  return (
    <View
      style={
        estilos.contenedor
      }
    >

      <RecipeCard
        receta={receta}
        variante="recetario"
        colorFondo={
          colorFondo
        }
        onPress={onAbrir}
      />


      <View
        style={
          estilos.acciones
        }
      >

        {/* FAVORITO */}

        <Pressable
          disabled={
            cargandoFavorito
          }
          style={[
            estilos.accion,
            esFavorita &&
              estilos.accionActiva,
          ]}
          onPress={() =>
            void alternarFavorito()
          }
        >

          <Ionicons
            name={
              esFavorita
                ? 'heart'
                : 'heart-outline'
            }
            size={18}
            color={
              esFavorita
                ? colors.terracota
                : colors.textoPrincipal
            }
          />

          <Text
            style={[
              estilos.textoAccion,
              esFavorita &&
                estilos.textoActivo,
            ]}
          >
            Favorito
          </Text>

        </Pressable>


        {/* HACER DESPUÉS */}

        <Pressable
          disabled={
            cargandoDespues
          }
          style={[
            estilos.accion,
            hacerDespues &&
              estilos.accionActiva,
          ]}
          onPress={() =>
            void alternarDespues()
          }
        >

          <Ionicons
            name={
              hacerDespues
                ? 'time'
                : 'time-outline'
            }
            size={18}
            color={
              hacerDespues
                ? colors.olivaOscuro
                : colors.textoPrincipal
            }
          />

          <Text
            style={[
              estilos.textoAccion,
              hacerDespues &&
                estilos.textoActivo,
            ]}
          >
            Después
          </Text>

        </Pressable>


        {/* COLECCIÓN */}

        <Pressable
          style={
            estilos.accion
          }
          onPress={() =>
            onColeccion(
              receta
            )
          }
        >

          <Ionicons
            name="folder-outline"
            size={18}
            color={
              colors.textoPrincipal
            }
          />

          <Text
            style={
              estilos.textoAccion
            }
          >
            Colección
          </Text>

        </Pressable>

        {/** SEMANA */}
        <Pressable
        style={estilos.accion}
        onPress={() => onSemana(receta)}
        >
        <Ionicons
            name="calendar-outline"
            size={20}
            color={colors.olivaOscuro}
        />

        <Text style={estilos.textoAccion}>
            Semana
        </Text>
        </Pressable>

      </View>

    </View>
  );
}


const estilos =
  StyleSheet.create({

    contenedor: {
      marginBottom:
        espaciado.md,
    },

    acciones: {
      flexDirection: 'row',
      gap: 6,
      marginTop:
        -espaciado.sm,
    },

    accion: {
      flex: 1,

      minHeight: 42,

      backgroundColor:
        colors.surface,

      borderWidth: 1,

      borderColor:
        colors.borde,

      borderRadius:
        radios.md,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 5,

      paddingHorizontal: 5,
    },

    accionActiva: {
      backgroundColor:
        colors.surfaceMuted,

      borderColor:
        colors.mostaza,
    },

    textoAccion: {
      color:
        colors.textoPrincipal,

      fontSize: 11,

      fontWeight: '600',
    },

    textoActivo: {
      fontWeight: '700',
    },

  });