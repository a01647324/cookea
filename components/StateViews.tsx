import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, espaciado, tipografia } from '../theme/theme';

/**
 * Estos tres componentes existen porque TODA pantalla que pide datos al
 * backend tiene, como mínimo, tres estados posibles: cargando, vacío (sin
 * error, pero sin resultados) y error.
 */

export function VistaCargando({ mensaje = 'Cargando...' }: { mensaje?: string }) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={colors.oliva} />
      <Text style={[tipografia.cuerpo, estilos.texto]}>{mensaje}</Text>
    </View>
  );
}

export function VistaVacia({ mensaje }: { mensaje: string }) {
  return (
    <View style={estilos.contenedor}>
      <Text style={[tipografia.subtitulo, estilos.texto]}>{mensaje}</Text>
    </View>
  );
}

export function VistaError({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar?: () => void;
}) {
  return (
    <View style={estilos.contenedor}>
      <Text style={[tipografia.cuerpo, estilos.textoError]}>{mensaje}</Text>
      {onReintentar && (
        <Text style={estilos.reintentar} onPress={onReintentar}>
          Reintentar
        </Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    padding: espaciado.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    marginTop: espaciado.sm,
    color: colors.textoSecundario,
    textAlign: 'center',
  },
  textoError: {
    color: colors.error,
    textAlign: 'center',
  },
  reintentar: {
    marginTop: espaciado.sm,
    color: colors.oliva,
    fontWeight: '600',
  },
});