import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Icono from './Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import { LIMITES, limpiarBusqueda } from '../lib/entradas';

interface Props {
  valorInicial?: string;
  placeholder?: string;
  onBuscar: (texto: string) => void;
  onFiltro?: () => void;
  buscarAlEscribir?: boolean;
}

export function SearchBar({
  valorInicial = '',
  placeholder = 'Busca una receta',
  onBuscar,
  onFiltro,
  buscarAlEscribir = true,
}: Props) {
  const [texto, setTexto] = useState(valorInicial);
  const referenciaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!buscarAlEscribir) return;
    if (referenciaTimeout.current) clearTimeout(referenciaTimeout.current);
    referenciaTimeout.current = setTimeout(() => onBuscar(limpiarBusqueda(texto)), 400);
    return () => {
      if (referenciaTimeout.current) clearTimeout(referenciaTimeout.current);
    };
    // Solo cuando cambia el texto, no cuando cambia onBuscar
  }, [texto]);

  return (
    <View style={estilos.contenedor}>
      <Icono nombre="magnifer-linear" size={20} color={colors.textoSuave} />
      <TextInput
        value={texto}
        onChangeText={setTexto}
        placeholder={placeholder}
        placeholderTextColor={colors.textoSuave}
        style={estilos.input}
        returnKeyType="search"
        onSubmitEditing={() => onBuscar(limpiarBusqueda(texto))}
        maxLength={LIMITES.busqueda}
        autoComplete="off"
        importantForAutofill="no"
      />
      {onFiltro && (
        <Pressable onPress={onFiltro} hitSlop={10} style={estilos.botonFiltro}>
          <Icono nombre="tuning-2-linear" size={22} color={colors.primario} />
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
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    letterSpacing: 0.2,
    color: colors.texto,
  },
  botonFiltro: {
    paddingLeft: espaciado.xs,
  },
});
