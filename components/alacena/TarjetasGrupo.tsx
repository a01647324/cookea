import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Icono, { NombreIcono } from '../Icono';
import { GrupoAlacena } from '../../constants/categorias';
import { colors, espaciado, fuentes, tamanos } from '../../theme/theme';

export const GRUPOS: { clave: GrupoAlacena; nombre: string; icono: NombreIcono; fondo: string; color: string }[] = [
  { clave: 'todo', nombre: 'Todo', icono: 'widget-linear', fondo: colors.superficie, color: colors.textoSuave },
  { clave: 'refrigerados', nombre: 'Refrigerados', icono: 'snowflake-linear', fondo: colors.serenoSuave, color: colors.serenoIntenso },
  { clave: 'verduras', nombre: 'Verduras y frutas', icono: 'leaf-linear', fondo: colors.acentoSuave, color: colors.acentoIntenso },
  { clave: 'despensa', nombre: 'Despensa', icono: 'bottle-linear', fondo: colors.calidoSuave, color: colors.calidoIntenso },
  { clave: 'pronto', nombre: 'Usar pronto', icono: 'hourglass-linear', fondo: colors.destacadoSuave, color: colors.destacadoIntenso },
];

interface Props {
  seleccionado: GrupoAlacena;
  conteos: Record<GrupoAlacena, number>;
  onElegir: (grupo: GrupoAlacena) => void;
}

export function TarjetasGrupo({ seleccionado, conteos, onElegir }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.fila}>
      {GRUPOS.map((g) => {
        const activo = g.clave === seleccionado;
        return (
          <Pressable
            key={g.clave}
            onPress={() => onElegir(g.clave)}
            style={[estilos.tarjeta, { backgroundColor: activo ? colors.primario : g.fondo }]}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={`${g.nombre}, ${conteos[g.clave]}`}
          >
            <View style={[estilos.circulo, activo && estilos.circuloActivo]}>
              <Icono nombre={g.icono} size={22} color={activo ? colors.sobrePrimario : g.color} />
            </View>
            <View>
              <Text style={[estilos.nombre, activo && { color: colors.sobrePrimario }]} numberOfLines={2}>
                {g.nombre}
              </Text>
              <Text style={[estilos.conteo, activo && { color: colors.sereno }]}>{conteos[g.clave]}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fila: {
    paddingHorizontal: espaciado.md,
    gap: espaciado.sm,
  },
  tarjeta: {
    width: 116,
    height: 124,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'space-between',
  },
  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloActivo: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  nombre: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    lineHeight: 18,
    color: colors.texto,
  },
  conteo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 2,
  },
});
