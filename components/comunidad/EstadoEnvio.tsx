import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../theme/theme';

type Tipo = 'exito' | 'error' | 'aviso';

interface Props {
  tipo: Tipo;
  titulo: string;
  mensaje: string;
  onCerrar: () => void;
  onReintentar?: () => void;
}

const ESTILO_TIPO: Record<Tipo, { icono: keyof typeof Ionicons.glyphMap; fondo: string; color: string }> = {
  exito: { icono: 'checkmark', fondo: colors.acentoSuave, color: colors.acento },
  error: { icono: 'cloud-offline-outline', fondo: colors.peligroSuave, color: colors.peligro },
  aviso: { icono: 'information', fondo: colors.calidoSuave, color: colors.calido },
};

export function EstadoEnvio({ tipo, titulo, mensaje, onCerrar, onReintentar }: Props) {
  const { icono, fondo, color } = ESTILO_TIPO[tipo];
  const relleno = tipo !== 'error';

  return (
    <View style={estilos.contenedor}>
      <View style={[estilos.halo, { backgroundColor: fondo }]}>
        <View style={[estilos.circulo, relleno && { backgroundColor: color }]}>
          <Ionicons name={icono} size={relleno ? 28 : 34} color={relleno ? colors.sobreAcento : color} />
        </View>
      </View>

      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>

      {onReintentar ? (
        <View style={estilos.filaBotones}>
          <Pressable onPress={onCerrar} style={[estilos.boton, estilos.mitad, estilos.botonSecundario]}>
            <Text style={estilos.textoSecundario}>Cerrar</Text>
          </Pressable>
          <Pressable onPress={onReintentar} style={[estilos.boton, estilos.mitad, estilos.botonPrimario]}>
            <Text style={estilos.textoPrimario}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onCerrar} style={[estilos.boton, estilos.botonPrimario, estilos.anchoCompleto]}>
          <Text style={estilos.textoPrimario}>Listo</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: espaciado.sm,
    paddingVertical: espaciado.sm,
  },
  halo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.xs,
  },
  circulo: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
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
  filaBotones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    alignSelf: 'stretch',
  },
  boton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radios.pill,
    paddingVertical: 14,
  },
  mitad: {
    flex: 1,
  },
  anchoCompleto: {
    alignSelf: 'stretch',
  },
  botonPrimario: {
    backgroundColor: colors.primario,
  },
  botonSecundario: {
    borderWidth: 1.5,
    borderColor: colors.primario,
  },
  textoPrimario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
  textoSecundario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
});