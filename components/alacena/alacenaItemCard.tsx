import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { AlacenaItem } from '../../types/alacena';
import { formatearCantidad } from '../../lib/unidades';
import { haceCuanto } from '../../constants/categorias';
import { IngredienteImagen } from './ingredienteImagen';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  item: AlacenaItem;
  onPress: () => void;
}

export function AlacenaItemCard({ item, onPress }: Props) {
  const ing = item.ingredientes;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [estilos.tarjeta, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${ing.nombre}, ${formatearCantidad(item.cantidad, ing.unidad)}`}
    >
      <IngredienteImagen
        nombre={ing.nombre}
        categoria={ing.categoria}
        url={ing.imagen_url}
        tamano={60}
        style={estilos.imagen}
      />

      <View style={{ flex: 1 }}>
        <Text style={estilos.nombre} numberOfLines={1}>
          {ing.nombre}
        </Text>
        <Text style={estilos.fecha}>{haceCuanto(item.agregado_en)}</Text>
        {item.usar_pronto && (
          <View style={estilos.pronto}>
            <Icono nombre="hourglass-linear" size={13} color={colors.destacadoOscuro} />
            <Text style={estilos.textoPronto}>Usar pronto</Text>
          </View>
        )}
      </View>

      <View style={estilos.cantidad}>
        <Text style={estilos.textoCantidad}>{formatearCantidad(item.cantidad, ing.unidad)}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.superficie,
    borderRadius: 20,
    padding: 12,
  },
  imagen: {
    borderRadius: 30,
  },
  nombre: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    lineHeight: 22,
    color: colors.texto,
  },
  fecha: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    color: colors.textoTenue,
    marginTop: 1,
  },
  pronto: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.destacadoSuave,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 3,
    marginTop: 6,
  },
  textoPronto: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
    color: colors.destacadoOscuro,
  },
  cantidad: {
    backgroundColor: colors.fondo,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoCantidad: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.texto,
  },
});
