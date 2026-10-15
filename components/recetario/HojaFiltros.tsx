import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

export type OrdenRecetario = 'nombre' | 'tiempo' | 'alacena';

interface Props {
  visible: boolean;
  tiempoMaximo: number | null;
  orden: OrdenRecetario;
  conAlacena: boolean;
  onTiempo: (valor: number | null) => void;
  onOrden: (valor: OrdenRecetario) => void;
  onLimpiar: () => void;
  onCerrar: () => void;
}

const TIEMPOS: { texto: string; valor: number | null }[] = [
  { texto: 'Cualquiera', valor: null },
  { texto: '15 min', valor: 15 },
  { texto: '30 min', valor: 30 },
  { texto: '1 hora', valor: 60 },
];

export function HojaFiltros({ visible, tiempoMaximo, orden, conAlacena, onTiempo, onOrden, onLimpiar, onCerrar }: Props) {
  const ordenes: { texto: string; valor: OrdenRecetario }[] = [
    { texto: 'Nombre', valor: 'nombre' },
    { texto: 'Más rápidas', valor: 'tiempo' },
    ...(conAlacena ? [{ texto: 'Lo que más tengo', valor: 'alacena' as OrdenRecetario }] : []),
  ];

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Filtrar recetas</Text>
        <Pressable onPress={onLimpiar} hitSlop={10}>
          <Text style={estilos.limpiar}>Limpiar</Text>
        </Pressable>
      </View>

      <Text style={estilos.etiqueta}>¿Cuánto tiempo tienes?</Text>
      <View style={estilos.chips}>
        {TIEMPOS.map((t) => {
          const activo = tiempoMaximo === t.valor;
          return (
            <Pressable key={t.texto} onPress={() => onTiempo(t.valor)} style={[estilos.chip, activo && estilos.chipActivo]}>
              <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{t.texto}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={estilos.etiqueta}>Ordenar por</Text>
      <View style={estilos.chips}>
        {ordenes.map((o) => {
          const activo = orden === o.valor;
          return (
            <Pressable key={o.valor} onPress={() => onOrden(o.valor)} style={[estilos.chip, activo && estilos.chipActivo]}>
              <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{o.texto}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onCerrar} style={estilos.boton}>
        <Icono nombre="check-linear" size={20} color={colors.sobreEncabezado} />
        <Text style={estilos.textoBoton}>Ver recetas</Text>
      </Pressable>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.texto,
  },
  limpiar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.acentoIntenso,
  },
  etiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: espaciado.md,
    justifyContent: 'center',
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  chipActivo: {
    backgroundColor: colors.encabezado,
    borderColor: colors.encabezado,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  textoChipActivo: {
    color: colors.sobreEncabezado,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
    minHeight: 54,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    marginTop: espaciado.lg,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
});
