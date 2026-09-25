import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  ImageSourcePropType,
} from 'react-native';

import {
  colors,
  espaciado,
  radios,
  tipografia,
} from '../theme/theme';


// Estructura de cada acceso rápido
interface Acceso {
  clave: string;
  titulo: string;
  subtitulo: string;
  color: string;
  icono: ImageSourcePropType | null;
  onPress: () => void;
}


// Componente de accesos rápidos
export function QuickAccessGrid({
  accesos,
}: {
  accesos: Acceso[];
}) {

  return (

    <View style={estilos.grid}>

      {accesos.map((acceso) => (

        <Pressable

          key={acceso.clave}

          onPress={acceso.onPress}

          style={[
            estilos.tarjeta,
            { backgroundColor: acceso.color },
          ]}

        >

          {/* ICONO DE CADA SECCIÓN */}

          <View style={estilos.iconoContenedor}>

          {acceso.icono && (

            <Image
              source={acceso.icono}
              style={estilos.icono}
              resizeMode="contain"
            />

          )}

          </View>


          {/* TEXTO Y FLECHA DE LA TARJETA */}

          <View style={estilos.textoContenedor}>

          <View style={estilos.filaTitulo}>

            <Text style={estilos.titulo} numberOfLines={1}>
              {acceso.titulo}
            </Text>

            <Text style={estilos.flecha}>›</Text>

          </View>

          <Text style={estilos.subtitulo} numberOfLines={2}>
            {acceso.subtitulo}
          </Text>

          </View>

        </Pressable>

      ))}

    </View>

  );

}


// ESTILOS

const estilos = StyleSheet.create({

  // Contenedor general de tarjetas
  grid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

    paddingHorizontal: espaciado.md,

  },


  // Tarjeta individual
  tarjeta: {

    width: '48%',

    borderRadius: radios.md,

    padding: 10,

    marginBottom: espaciado.md,

    minHeight: 90,

    flexDirection: 'row',

    alignItems: 'center',

  },


  // Cuadro blanco para colocar iconos
  iconoContenedor: {

    width: 55,

    height: 55,

    backgroundColor: colors.surface,

    borderRadius: 12,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 8,

  },


  // Contenedor de texto
  textoContenedor: {

    flex: 1,

    justifyContent: 'center',

  },


  // Título
  titulo: {
    color: colors.textoSobreColor,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },


  // Subtítulo
  subtitulo: {

    color: 'rgba(255,255,255,0.85)',

    fontSize: 10,

    marginTop: 3,

  },

  

  // Icono
  icono: {
    width: 34,
    height: 34,
    tintColor: "#745213",
  },

  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  flecha: {
    color: colors.textoSobreColor,
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 3,
  },

});