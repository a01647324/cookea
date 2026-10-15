import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono, { NombreIcono } from '../Icono';
import { Mascota } from '../cocina/Mascota';
import { AccionMascota } from '../../constants/mascota';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../theme/theme';

type Tipo = 'exito' | 'error' | 'aviso';

interface Props {
  tipo: Tipo;
  titulo: string;
  mensaje: string;
  accion?: AccionMascota;
  onCerrar: () => void;
  onReintentar?: () => void;
}

const ESTILO_TIPO: Record<Tipo, { icono: NombreIcono; fondo: string; color: string }> = {
  exito: { icono: 'check-circle-linear', fondo: colors.acentoSuave, color: colors.acentoOscuro },
  error: { icono: 'cloud-cross-linear', fondo: colors.peligroSuave, color: colors.peligro },
  aviso: { icono: 'info-circle-linear', fondo: colors.calidoSuave, color: colors.calidoIntenso },
};

// Resultado de un envío (calificar, reportar, publicar). Con "accion" muestra a la mascota.
export function EstadoEnvio({ tipo, titulo, mensaje, accion, onCerrar, onReintentar }: Props) {
  const { icono, fondo, color } = ESTILO_TIPO[tipo];

  return (
    <View style={estilos.contenedor} accessibilityLiveRegion="polite">
      {accion ? (
        <Mascota accion={accion} tamano={170} />
      ) : (
        <View style={[estilos.halo, { backgroundColor: fondo }]}>
          <View style={estilos.circulo}>
            <Icono nombre={icono} size={34} color={color} />
          </View>
        </View>
      )}

      <Text style={estilos.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>

      {onReintentar ? (
        <View style={estilos.filaBotones}>
          <Pressable onPress={onCerrar} style={[estilos.boton, estilos.mitad, estilos.botonSecundario]} accessibilityRole="button">
            <Text style={estilos.textoSecundario}>Cerrar</Text>
          </Pressable>
          <Pressable onPress={onReintentar} style={[estilos.boton, estilos.mitad, estilos.botonPrimario]} accessibilityRole="button">
            <Icono nombre="refresh-linear" size={18} color={colors.sobrePrimario} />
            <Text style={estilos.textoPrimario}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={onCerrar} style={[estilos.boton, estilos.botonPrimario, estilos.anchoCompleto]} accessibilityRole="button">
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
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaciado.xs,
  },
  circulo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    ...tipografia.titulo,
    fontSize: 22,
    lineHeight: 30,
    color: colors.primario,
    textAlign: 'center',
  },
  mensaje: {
    ...tipografia.cuerpo,
    lineHeight: 23,
    color: colors.textoSuave,
    textAlign: 'center',
    marginBottom: espaciado.sm,
    maxWidth: 340,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    alignSelf: 'stretch',
  },
  boton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: radios.pill,
  },
  mitad: { flex: 1 },
  anchoCompleto: { alignSelf: 'stretch' },
  botonPrimario: { backgroundColor: colors.primario },
  botonSecundario: { borderWidth: 1.5, borderColor: colors.primario },
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
