import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono, { NombreIcono } from '../Icono';
import { colors, espaciado, fuentes, sombra, tamanos } from '../../theme/theme';

export interface Acceso {
  clave: string;
  titulo: string;
  icono: NombreIcono;
  fondo: string;
  color: string;
  onPress: () => void;
}

export function AccesosRapidos({ accesos }: { accesos: Acceso[] }) {
  return (
    <View style={estilos.fila}>
      {accesos.map((a) => (
        <Pressable
          key={a.clave}
          onPress={a.onPress}
          style={({ pressed }) => [estilos.tile, pressed && estilos.presionado]}
          accessibilityRole="button"
          accessibilityLabel={a.titulo}
        >
          <View style={[estilos.circulo, { backgroundColor: a.fondo }]}>
            <Icono nombre={a.icono} size={24} color={a.color} />
          </View>
          <Text style={estilos.titulo} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {a.titulo}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderRadius: 18,
    paddingVertical: espaciado.md,
    paddingHorizontal: 4,
    ...sombra,
  },
  presionado: {
    transform: [{ scale: 0.96 }],
  },
  circulo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.sm,
  },
  titulo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.primario,
  },
});
