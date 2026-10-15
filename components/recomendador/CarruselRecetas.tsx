import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';
import { TarjetaRecomendada } from './tarjetaRecomendada';
import { Recomendacion } from '../../lib/recomendador/tipos';
import { colors, espaciado } from '../../theme/theme';

const SEPARACION = 14;
const MAX_TARJETAS = 10;
const FONDOS = [colors.resaltadoSuave, colors.acentoSuave, colors.calidoSuave, colors.serenoSuave];

interface Props {
  items: Recomendacion[];
  onAbrir: (recetaId: number) => void;
}

export function CarruselRecetas({ items, onAbrir }: Props) {
  const { width } = useWindowDimensions();
  const ancho = Math.min(Math.round(width * 0.7), 300);
  const paso = ancho + SEPARACION;
  const lado = (width - ancho) / 2;
  const datos = items.slice(0, MAX_TARJETAS);

  const scrollX = useRef(new Animated.Value(0)).current;
  const [activo, setActivo] = useState(0);

  return (
    <View>
      <Animated.FlatList
        data={datos}
        horizontal
        keyExtractor={(r) => String(r.receta.id)}
        showsHorizontalScrollIndicator={false}
        snapToInterval={paso}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: lado, paddingVertical: espaciado.sm }}
        ItemSeparatorComponent={() => <View style={{ width: SEPARACION }} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
          listener: (e: any) => {
            const indice = Math.round(e.nativeEvent.contentOffset.x / paso);
            setActivo(Math.max(0, Math.min(datos.length - 1, indice)));
          },
        })}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const rango = [(index - 1) * paso, index * paso, (index + 1) * paso];
          const escala = scrollX.interpolate({ inputRange: rango, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' });
          const opacidad = scrollX.interpolate({ inputRange: rango, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });
          return (
            <Animated.View style={{ transform: [{ scale: escala }], opacity: opacidad }}>
              <TarjetaRecomendada
                variante="destacada"
                ancho={ancho}
                recomendacion={item}
                colorFondo={FONDOS[index % FONDOS.length]}
                onPress={() => onAbrir(item.receta.id)}
              />
            </Animated.View>
          );
        }}
      />

      {datos.length > 1 && (
        <View style={estilos.puntos}>
          {datos.map((r, i) => (
            <View key={r.receta.id} style={[estilos.punto, i === activo && estilos.puntoActivo]} />
          ))}
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: espaciado.xs,
  },
  punto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.borde,
  },
  puntoActivo: {
    width: 20,
    backgroundColor: colors.calidoIntenso,
  },
});
