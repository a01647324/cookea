import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Icono, { NombreIcono } from './Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

// Los tres estados que tiene toda pantalla que pide datos: cargando, vacío y error.

export function VistaCargando({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={colors.encabezado} />
      <Text style={estilos.textoCargando}>{mensaje}</Text>
    </View>
  );
}

export function VistaVacia({ mensaje, icono = 'chef-hat-linear' }: { mensaje: string; icono?: NombreIcono }) {
  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.circulo, { backgroundColor: colors.calidoSuave }]}>
        <Icono nombre={icono} size={32} color={colors.calidoIntenso} />
      </View>
      <Text style={estilos.titulo}>{mensaje}</Text>
    </View>
  );
}

export function VistaError({
  mensaje,
  titulo = 'Algo salió mal',
  onReintentar,
}: {
  mensaje: string;
  titulo?: string;
  onReintentar?: () => void;
}) {
  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.circulo, { backgroundColor: colors.peligroSuave }]}>
        <Icono nombre="danger-triangle-linear" size={32} color={colors.peligro} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {onReintentar && (
        <Pressable
          onPress={onReintentar}
          style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
        >
          <Icono nombre="refresh-linear" size={20} color={colors.sobrePrimario} />
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.lg,
    paddingVertical: espaciado.xl,
  },
  textoCargando: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.md,
  },
  circulo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.md,
  },
  mensaje: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.xs,
    maxWidth: 300,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 50,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.pill,
    backgroundColor: colors.primario,
    marginTop: espaciado.md,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobrePrimario,
  },
});
