import React, { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radios } from '../../theme/theme';
import { iconoIngrediente } from '../../constants/categorias';

interface Props {
  nombre: string;
  categoria: string | null;
  url?: string | null; 
  tamano?: number;
  style?: StyleProp<ViewStyle>;
}

export function IngredienteImagen({ nombre, categoria, url, tamano = 64, style }: Props) {
  const [fallo, setFallo] = useState(false);

 
  useEffect(() => {
    setFallo(false);
  }, [url]);

  const mostrarFoto = !!url && !fallo;

  return (
    <View
      style={[
        estilos.caja,
        { width: tamano, height: tamano, borderRadius: tamano > 50 ? radios.md : radios.sm },
        style,
      ]}
    >
      {mostrarFoto ? (
        <Image
          source={{ uri: url as string }}
          style={estilos.foto}
          resizeMode="cover"
          onError={() => setFallo(true)}
        />
      ) : (
        <Text style={{ fontSize: Math.round(tamano * 0.52) }}>{iconoIngrediente(nombre, categoria)}</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  foto: {
    width: '100%',
    height: '100%',
  },
});