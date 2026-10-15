import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HojaInferior } from './HojaInferior';
import Icono from './Icono';
import { IconoCompat, NombreIconoCompat } from './IconoCompat';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

export interface OpcionMenu {
  texto: string;
  descripcion?: string;
  icono: NombreIconoCompat;
  peligro?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  titulo?: string;
  opciones: OpcionMenu[];
  onCerrar: () => void;
}

export function MenuHoja({ visible, titulo, opciones, onCerrar }: Props) {
  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      {!!titulo && (
        <Text style={estilos.titulo} numberOfLines={2}>
          {titulo}
        </Text>
      )}

      <View style={estilos.grupo}>
        {opciones.map((o, i) => {
          const color = o.peligro ? colors.peligro : colors.texto;
          return (
            <Pressable
              key={o.texto}
              onPress={o.onPress}
              style={({ pressed }) => [estilos.opcion, i > 0 && estilos.separador, pressed && estilos.presionada]}
              accessibilityRole="button"
            >
              <View style={[estilos.icono, { backgroundColor: o.peligro ? colors.peligroSuave : colors.fondo }]}>
                <IconoCompat nombre={o.icono} size={22} color={o.peligro ? colors.peligro : colors.textoSuave} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.texto, { color }]}>{o.texto}</Text>
                {!!o.descripcion && <Text style={estilos.descripcion}>{o.descripcion}</Text>}
              </View>
              {!o.peligro && <Icono nombre="alt-arrow-right-linear" size={20} color={colors.textoTenue} />}
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onCerrar} style={estilos.cancelar} accessibilityRole="button">
        <Text style={estilos.textoCancelar}>Cancelar</Text>
      </Pressable>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.texto,
    textAlign: 'center',
    marginBottom: espaciado.md,
    paddingHorizontal: espaciado.md,
  },
  grupo: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    overflow: 'hidden',
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 66,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  separador: {
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  presionada: {
    backgroundColor: colors.fondo,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 19,
    color: colors.textoSuave,
    marginTop: 1,
  },
  cancelar: {
    minHeight: 54,
    borderRadius: radios.pill,
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.md,
  },
  textoCancelar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
});
