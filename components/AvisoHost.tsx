import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono, { NombreIcono } from './Icono';
import { Aviso, TipoAviso, registrarReceptor, reenviarAviso } from '../lib/avisos';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

const DURACION = 3500;
const FUERA = -180;

const ESTILO_TIPO: Record<TipoAviso, { icono: NombreIcono; fondo: string; color: string }> = {
  error: { icono: 'danger-triangle-linear', fondo: colors.destacado, color: colors.sobrePrimario },
  exito: { icono: 'check-circle-linear', fondo: colors.acento, color: colors.texto },
  info: { icono: 'info-circle-linear', fondo: colors.sereno, color: colors.texto },
};

export function AvisoHost() {
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const actual = useRef<Aviso | null>(null);
  const y = useRef(new Animated.Value(FUERA)).current;
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ocultar = useCallback(() => {
    const id = actual.current?.id;
    if (temporizador.current) clearTimeout(temporizador.current);
    Animated.timing(y, { toValue: FUERA, duration: 200, useNativeDriver: true }).start(() => {
      if (actual.current?.id !== id) return;
      actual.current = null;
      setAviso(null);
    });
  }, [y]);

  useEffect(() => {
    const quitar = registrarReceptor((nuevo) => {
      actual.current = nuevo;
      setAviso(nuevo);
      y.setValue(FUERA);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 4, speed: 14 }).start();
      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(ocultar, DURACION);
    });

    return () => {
      quitar();
      if (temporizador.current) clearTimeout(temporizador.current);
      // Si la hoja se cierra con un aviso en pantalla, lo pasa al siguiente AvisoHost
      if (actual.current) reenviarAviso(actual.current);
    };
  }, [ocultar, y]);

  if (!aviso) return null;
  const estilo = ESTILO_TIPO[aviso.tipo];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[estilos.contenedor, { top: insets.top + espaciado.sm, transform: [{ translateY: y }] }]}
    >
      <Pressable onPress={ocultar} style={estilos.tarjeta} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={[estilos.circulo, { backgroundColor: estilo.fondo }]}>
          <Icono nombre={estilo.icono} size={22} color={estilo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>{aviso.titulo}</Text>
          {!!aviso.mensaje && <Text style={estilos.mensaje}>{aviso.mensaje}</Text>}
        </View>
        <Icono nombre="close-linear" size={18} color={colors.textoTenue} />
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: espaciado.md,
    right: espaciado.md,
    zIndex: 1000,
    elevation: 12,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primario,
    borderRadius: radios.lg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: colors.primario,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  circulo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    lineHeight: 21,
    color: colors.sobrePrimario,
  },
  mensaje: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.sereno,
    marginTop: 2,
  },
});
