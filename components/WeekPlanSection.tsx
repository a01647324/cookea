import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../theme/theme';
import { DiaPlan } from '../hooks/useWeekPlan';

interface Props {
  dias: DiaPlan[];
  onVerSemana: () => void;
  onAgregar: (fecha: string) => void; // se llama al tocar "+" en un día sin asignar
}

/**
 * WeekPlanSection
 *
 * Recibe ya procesados los `dias` que arma useWeekPlan (fecha + etiqueta +
 * receta o null). Aquí solo decidimos CÓMO se ve cada caso:
 *   - Si `item` existe: tarjeta con foto, nombre y tiempo.
 *   - Si `item` es null: tarjeta con "+", como en el mockup ("Martes - NO ASIGNADO").
 *
 * El botón "+" en este stage solo dispara `onAgregar` (que HomeScreen puede
 * usar para navegar al Recetario); la lógica de "asignar una receta a un día"
 * es un flujo aparte que no está definido en el manual todavía, así que no lo
 * inventamos aquí.
 */
export function WeekPlanSection({ dias, onVerSemana, onAgregar }: Props) {
  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>TU SEMANA</Text>
        <Pressable onPress={onVerSemana}>
          <Text style={estilos.verSemana}>Ver semana →</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dias.map((dia) => (
          <View key={dia.fecha} style={estilos.tarjeta}>
            {dia.item ? (
              <Image
                source={{ uri: dia.item.recetas.foto_url ?? undefined }}
                style={estilos.imagen}
              />
            ) : (
              <Pressable
                style={[estilos.imagen, estilos.imagenVacia]}
                onPress={() => onAgregar(dia.fecha)}
              >
                <Text style={estilos.mas}>+</Text>
              </Pressable>
            )}
            <Text style={estilos.etiquetaDia}>
              {dia.etiqueta} {dia.item ? `· ⏱ ${dia.item.recetas.tiempo_min} min.` : ''}
            </Text>
            <Text style={estilos.nombreReceta} numberOfLines={1}>
              {dia.item ? dia.item.recetas.nombre.toUpperCase() : 'NO ASIGNADO'}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    backgroundColor: colors.oliva,
    paddingTop: espaciado.lg,
    paddingBottom: espaciado.lg,
    paddingHorizontal: espaciado.md,
    borderBottomLeftRadius: radios.lg,
    borderBottomRightRadius: radios.lg,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.sm,
  },
  titulo: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  verSemana: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  tarjeta: {
    width: 150,
    marginRight: espaciado.md,
  },
  imagen: {
    width: '100%',
    height: 90,
    borderRadius: radios.md,
    backgroundColor: colors.surfaceMuted,
  },
  imagenVacia: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  mas: {
    fontSize: 28,
    color: colors.textoSobreColor,
  },
  etiquetaDia: {
    ...tipografia.chico,
    color: 'rgba(255,255,255,0.85)',
    marginTop: espaciado.xs,
  },
  nombreReceta: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 12,
  },
});