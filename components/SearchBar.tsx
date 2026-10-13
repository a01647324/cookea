import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, espaciado, fuentes, radios } from '../theme/theme';

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
      <Ionicons name="search" size={18} color={colors.textoSuave} />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={placeholder}
        placeholderTextColor={colors.textoSuave}
        style={estilos.input}
        returnKeyType="search"
        onSubmitEditing={() => onBuscar(texto)}
        autoComplete="off"
        importantForAutofill="no"
      />
      {onFiltro && (
        <Pressable onPress={onFiltro} hitSlop={10} style={estilos.botonFiltro}>
          <Ionicons name="options-outline" size={20} color={colors.primario} />
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingHorizontal: espaciado.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: 15,
    letterSpacing: 0.2,
    color: colors.texto,
  },
  botonFiltro: {
    paddingLeft: espaciado.xs,
  },
});