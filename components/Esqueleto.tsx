import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { colors, radios } from '../theme/theme';

interface Props {
  ancho: DimensionValue;
  alto: number;
  radio?: number;
  color?: string;
  estilo?: StyleProp<ViewStyle>;
}

export function Esqueleto({ ancho, alto, radio = radios.md, color = colors.fondoHundido, estilo }: Props) {
  const opacidad = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacidad, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [opacidad]);

  return (
    <Animated.View
      style={[{ width: ancho, height: alto, borderRadius: radio, backgroundColor: color, opacity: opacidad }, estilo]}
    />
  );
}
