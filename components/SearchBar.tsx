import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, espaciado, radios } from '../theme/theme';

interface Props {
  valorInicial?: string;
  placeholder?: string;
  onBuscar: (texto: string) => void; 
  onFiltro?: () => void; 
}


export function SearchBar({ valorInicial = '', placeholder = 'Busca una receta', onBuscar, onFiltro }: Props) {
  const [texto, setTexto] = useState(valorInicial);
  const referenciaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (referenciaTimeout.current) clearTimeout(referenciaTimeout.current);
    referenciaTimeout.current = setTimeout(() => onBuscar(texto), 400);
    return () => {
      if (referenciaTimeout.current) clearTimeout(referenciaTimeout.current);
    };
    // Solo re-ejecutar cuando cambia el texto, no cuando cambia la función onBuscar
  }, [texto]);

  return (
    <View style={estilos.contenedor}>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={placeholder}
        placeholderTextColor={colors.textoSecundario}
        style={estilos.input}
        returnKeyType="search"
        onSubmitEditing={() => onBuscar(texto)}
      />
      {onFiltro && (
        <Pressable onPress={onFiltro} style={estilos.botonFiltro}>
          <Text>▤</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingHorizontal: espaciado.md,
  },
  input: {
    flex: 1,
    paddingVertical: espaciado.sm + 2,
    fontSize: 14,
    color: colors.textoPrincipal,
  },
  botonFiltro: {
    paddingLeft: espaciado.sm,
  },
});