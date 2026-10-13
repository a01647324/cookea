import React, { useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radios } from '../../theme/theme';

const ANCHO_BOTON = 84;
const usarDriverNativo = Platform.OS !== 'web';

interface Props {
  children: React.ReactNode;
  onEliminar: () => void;
}
export function SwipeableRow({ children, onEliminar }: Props) {
  const x = useRef(new Animated.Value(0)).current;
  const abierto = useRef(false);

  function moverA(valor: number) {
    Animated.spring(x, {
      toValue: valor,
      useNativeDriver: usarDriverNativo,
      bounciness: 0,
    }).start();
  }

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        const base = abierto.current ? -ANCHO_BOTON : 0;
        const nuevo = Math.min(0, Math.max(-ANCHO_BOTON - 24, base + g.dx));
        x.setValue(nuevo);
      },
      onPanResponderRelease: (_, g) => {
        const base = abierto.current ? -ANCHO_BOTON : 0;
        const abrir = base + g.dx < -ANCHO_BOTON / 2;
        abierto.current = abrir;
        moverA(abrir ? -ANCHO_BOTON : 0);
      },
      onPanResponderTerminate: () => {
        moverA(abierto.current ? -ANCHO_BOTON : 0);
      },
    })
  ).current;

  return (
    <View style={estilos.contenedor}>
      {}
      <View style={estilos.fondo}>
        <Pressable
          onPress={() => {
            abierto.current = false;
            moverA(0);
            onEliminar();
          }}
          style={estilos.botonBasura}
          accessibilityLabel="Eliminar ingrediente"
        >
          <Text style={estilos.basura}>🗑️</Text>
        </Pressable>
      </View>

      {}
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    marginBottom: 14,
  },
  fondo: {
    ...StyleSheet.absoluteFill, /////.....absoluteFillObject
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  botonBasura: {
    width: ANCHO_BOTON - 8,
    height: '100%',
    borderRadius: radios.lg,
    backgroundColor: '#F3CFC6', 
    alignItems: 'center',
    justifyContent: 'center',
  },
  basura: {
    fontSize: 26,
    color: colors.terracota,
  },
});