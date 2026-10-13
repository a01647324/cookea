import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HojaInferior } from './HojaInferior';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../theme/theme';

export interface OpcionMenu {
  texto: string;
  descripcion?: string;
  icono: keyof typeof Ionicons.glyphMap;
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
      <View style={estilos.contenido}>
        {!!titulo && <Text style={estilos.titulo}>{titulo}</Text>}

        {opciones.map((o) => {
          const color = o.peligro ? colors.peligro : colors.primario;
          return (
            <Pressable
              key={o.texto}
              onPress={o.onPress}
              style={({ pressed }) => [estilos.opcion, pressed && estilos.presionada]}
            >
              <View style={[estilos.icono, { backgroundColor: o.peligro ? colors.peligroSuave : colors.calidoSuave }]}>
                <Ionicons name={o.icono} size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[estilos.texto, { color }]}>{o.texto}</Text>
                {!!o.descripcion && <Text style={tipografia.chico}>{o.descripcion}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textoTenue} />
            </Pressable>
          );
        })}

        <Pressable onPress={onCerrar} style={estilos.cancelar}>
          <Text style={estilos.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: espaciado.sm,
  },
  titulo: {
    ...tipografia.titulo,
    fontSize: 21,
    color: colors.primario,
    textAlign: 'center',
    marginBottom: espaciado.xs,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  presionada: {
    opacity: 0.7,
  },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.destacado,
  },
  cancelar: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.primario,
    borderRadius: radios.pill,
    marginTop: espaciado.xs,
  },
  textoCancelar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
});