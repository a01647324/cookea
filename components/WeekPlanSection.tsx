import React from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  colors,
  espaciado,
  radios,
  tipografia,
} from '../theme/theme';

import { DiaPlan } from '../hooks/useWeekPlan';

interface Props {
  dias: DiaPlan[];
  onVerSemana: () => void;
  onAgregar: (fecha: string) => void;
}


// Fecha local YYYY-MM-DD
function obtenerFechaHoy() {
  const hoy = new Date();

  const year = hoy.getFullYear();

  const month = String(
    hoy.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    hoy.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


export function WeekPlanSection({
  dias,
  onVerSemana,
  onAgregar,
}: Props) {

  const hoy = obtenerFechaHoy();


  // Busca en qué posición está el día de hoy
  const indiceHoy = dias.findIndex(
    (dia) => dia.fecha === hoy
  );


  // Si encuentra el día de hoy:
  // ponemos primero HOY y después los demás días.
  //
  // Ejemplo:
  // Si hoy es sábado:
  //
  // Sábado → Domingo → Lunes → Martes → ...
  const diasOrdenados =
    indiceHoy >= 0
      ? [
          ...dias.slice(indiceHoy),
          ...dias.slice(0, indiceHoy),
        ]
      : dias;


  return (

    <View style={estilos.contenedor}>

      {/* ENCABEZADO */}

      <View style={estilos.encabezado}>

        <Text style={estilos.titulo}>
          TU SEMANA
        </Text>

        <Pressable onPress={onVerSemana}>

          <Text style={estilos.verSemana}>
            Ver semana →
          </Text>

        </Pressable>

      </View>


      {/* DÍAS DE LA SEMANA */}

      <ScrollView

        horizontal

        showsHorizontalScrollIndicator={false}

        contentContainerStyle={estilos.scrollContenido}

      >

        {diasOrdenados.map((dia) => {

          const esHoy =
            dia.fecha === hoy;

          return (

            <View
              key={dia.fecha}
              style={[
                estilos.tarjeta,
                esHoy && estilos.tarjetaHoy,
              ]}
            >


              {/* RECETA O ESPACIO VACÍO */}

              {dia.item ? (

                <Image

                  source={{
                    uri:
                      dia.item.recetas.foto_url ??
                      undefined,
                  }}

                  style={estilos.imagen}

                  resizeMode="cover"

                />

              ) : (

                <Pressable

                  style={[
                    estilos.imagen,
                    estilos.imagenVacia,
                  ]}

                  onPress={() =>
                    onAgregar(dia.fecha)
                  }

                >

                  <Text style={estilos.mas}>
                    +
                  </Text>

                </Pressable>

              )}


              {/* DÍA + ETIQUETA HOY */}

              <View style={estilos.filaDia}>

                <Text
                  style={[
                    estilos.etiquetaDia,
                    esHoy && estilos.etiquetaDiaHoy,
                  ]}
                  numberOfLines={1}
                >

                  {dia.etiqueta}

                  {dia.item
                    ? ` · ⏱ ${dia.item.recetas.tiempo_min} min.`
                    : ''}

                </Text>


                {esHoy && (

                  <View style={estilos.hoyPill}>

                    <Text style={estilos.hoyPillTexto}>
                      HOY
                    </Text>

                  </View>

                )}

              </View>


              {/* RECETA */}

              <Text
                style={estilos.nombreReceta}
                numberOfLines={1}
              >

                {dia.item
                  ? dia.item.recetas.nombre.toUpperCase()
                  : 'NO ASIGNADO'}

              </Text>

            </View>

          );

        })}

      </ScrollView>

    </View>

  );
}


const estilos = StyleSheet.create({

  contenedor: {

    backgroundColor: colors.oliva,

    paddingTop: espaciado.lg,

    paddingBottom: espaciado.lg,

    borderBottomLeftRadius: radios.lg,

    borderBottomRightRadius: radios.lg,

  },


  encabezado: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: espaciado.md,

    paddingHorizontal: espaciado.md,

  },


  titulo: {

    color: colors.textoSobreColor,

    fontWeight: '700',

    fontSize: 16,

    letterSpacing: 0.5,

  },


  verSemana: {

    color: 'rgba(255,255,255,0.90)',

    fontSize: 13,

    textDecorationLine: 'underline',

  },


  scrollContenido: {

    paddingHorizontal: espaciado.md,

    paddingBottom: 2,

  },


  tarjeta: {
    width: 165,
    marginRight: espaciado.md,
  
    backgroundColor: colors.surfaceMuted,
  
    borderRadius: radios.lg,
    padding: 8,
  
    overflow: 'hidden',
  },


  // Tarjeta del día actual
  tarjetaHoy: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 3,
    borderColor: colors.mostaza,
  },


  imagen: {

    width: '100%',

    height: 100,

    borderRadius: radios.md,

    backgroundColor: colors.surfaceMuted,

  },


  imagenVacia: {
    justifyContent: 'center',
    alignItems: 'center',
  
    borderWidth: 1.5,
    borderColor: colors.borde,
    borderStyle: 'dashed',
  
    backgroundColor: colors.background,
  },


  mas: {
    fontSize: 34,
    color: '#745213',
    fontWeight: '600',
  },


  filaDia: {

    flexDirection: 'row',

    alignItems: 'center',

    marginTop: espaciado.xs,

  },


  etiquetaDia: {
    ...tipografia.chico,
    color: colors.textoSecundario,
    flex: 1,
  },


  etiquetaDiaHoy: {
    color: colors.textoPrincipal,
    fontWeight: '700',
  },


  hoyPill: {

    backgroundColor: colors.mostaza,

    borderRadius: radios.pill,

    paddingHorizontal: 7,

    paddingVertical: 2,

    marginLeft: 5,

  },


  hoyPillTexto: {

    fontSize: 9,

    fontWeight: '800',

    color: colors.textoPrincipal,

  },


  nombreReceta: {
    color: colors.textoPrincipal,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 3,
  },

});