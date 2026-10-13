import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HojaInferior } from './HojaInferior';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../theme/theme';

interface Props {
  visible: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar: string;
  icono?: keyof typeof Ionicons.glyphMap;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

export function ConfirmarHoja({
  visible,
  titulo,
  mensaje,
  textoConfirmar,
  icono = 'trash-outline',
  cargando = false,
  onConfirmar,
  onCerrar,
}: Props) {
  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.contenido}>
        <View style={estilos.halo}>
          <Ionicons name={icono} size={30} color={colors.peligro} />
        </View>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.mensaje}>{mensaje}</Text>
        <View style={estilos.fila}>
          <Pressable onPress={onCerrar} style={[estilos.boton, estilos.cancelar]}>
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>
          <Pressable onPress={onConfirmar} disabled={cargando} style={[estilos.boton, estilos.confirmar]}>
            {cargando ? (
              <ActivityIndicator color={colors.sobreAcento} />
            ) : (
              <Text style={estilos.textoConfirmar}>{textoConfirmar}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    alignItems: 'center',
    gap: espaciado.sm,
  },
  halo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.peligroSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.xs,
  },
  titulo: {
    ...tipografia.titulo,
    fontSize: 22,
    color: colors.primario,
    textAlign: 'center',
  },
  mensaje: {
    ...tipografia.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginBottom: espaciado.sm,
  },
  fila: {
    flexDirection: 'row',
    gap: espaciado.sm,
    alignSelf: 'stretch',
  },
  boton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radios.pill,
  },
  cancelar: {
    borderWidth: 1.5,
    borderColor: colors.primario,
  },
  confirmar: {
    backgroundColor: colors.peligro,
  },
  textoCancelar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
  textoConfirmar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreAcento,
  },
});