import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../theme/theme';

interface Acceso {
  clave: string;
  titulo: string;
  subtitulo: string;
  color: string;
  onPress: () => void;
}

/**
 * QuickAccessGrid este no llama a supabase
 */
export function QuickAccessGrid({ accesos }: { accesos: Acceso[] }) {
  return (
    <View style={estilos.grid}>
      {accesos.map((acceso) => (
        <Pressable
          key={acceso.clave}
          onPress={acceso.onPress}
          style={[estilos.tarjeta, { backgroundColor: acceso.color }]}
        >
          <Text style={estilos.titulo}>{acceso.titulo}</Text>
          <Text style={estilos.subtitulo}>{acceso.subtitulo}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
  },
  tarjeta: {
    width: '48%',
    borderRadius: radios.md,
    padding: espaciado.md,
    marginBottom: espaciado.md,
    minHeight: 84,
    justifyContent: 'flex-end',
  },
  titulo: {
    ...tipografia.subtitulo,
    color: colors.textoSobreColor,
  },
  subtitulo: {
    ...tipografia.chico,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});