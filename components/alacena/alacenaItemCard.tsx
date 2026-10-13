import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radios, tipografia } from '../../theme/theme';
import { AlacenaItem } from '../../types/alacena';
import { cantidadMinima, formatearCantidad, pasoBase } from '../../lib/unidades';
import { haceCuanto } from '../../constants/categorias';
import { Stepper } from './stepper';
import { IngredienteImagen } from './ingredienteImagen';

interface Props {
  item: AlacenaItem;
  onCambiarCantidad: (item: AlacenaItem, nueva: number) => void;
  onPress: () => void; 
}

export function AlacenaItemCard({ item, onCambiarCantidad, onPress }: Props) {
  const { ingredientes: ing } = item;
  const minimo = cantidadMinima(ing.unidad);

  const nuevaAlBajar = item.cantidad - pasoBase(item.cantidad, ing.unidad, false);
  const puedeBajar = nuevaAlBajar >= minimo;

  return (
    <Pressable onPress={onPress} style={estilos.tarjeta}>
      <IngredienteImagen
        nombre={ing.nombre}
        categoria={ing.categoria}
        url={ing.imagen_url}
        tamano={64}
        style={{ marginRight: 14 }}
      />

      <View style={estilos.centro}>
        <View style={estilos.filaNombre}>
          <Text style={estilos.nombre} numberOfLines={1}>
            {ing.nombre}
          </Text>
          {item.usar_pronto && (
            <View style={estilos.etiquetaPronto}>
              <Text style={estilos.textoPronto}>Usar pronto</Text>
            </View>
          )}
        </View>
        <Text style={tipografia.chico}>{haceCuanto(item.agregado_en)}</Text>

        <View style={{ marginTop: 8 }}>
          <Stepper
            compacto
            texto={formatearCantidad(item.cantidad, ing.unidad)}
            menosDeshabilitado={!puedeBajar}
            onMenos={() => onCambiarCantidad(item, nuevaAlBajar)}
            onMas={() =>
              onCambiarCantidad(item, item.cantidad + pasoBase(item.cantidad, ing.unidad, true))
            }
          />
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radios.lg,
    padding: 14,
    shadowColor: '#3A2E22',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  iconoCaja: {
    width: 64,
    height: 64,
    borderRadius: radios.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icono: {
    fontSize: 34,
  },
  centro: {
    flex: 1,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nombre: {
    ...tipografia.subtitulo,
    flexShrink: 1,
  },
  etiquetaPronto: {
    marginLeft: 8,
    backgroundColor: colors.mostaza,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textoPronto: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textoPrincipal,
  },
});