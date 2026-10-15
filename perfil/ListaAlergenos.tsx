import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';
import { Alergeno } from '../types/database';

type Props = {
  alergenos: Alergeno[];
  seleccionados: Set<number>;
  onAlternar: (id: number) => void;
  deshabilitado?: boolean;
};

// ListaAlergenos: opciones para marcar y desmarcar, como pastillas que se acomodan solas.
// También la usan los selectores de ingredientes y electrodomésticos.
export default function ListaAlergenos({ alergenos, seleccionados, onAlternar, deshabilitado = false }: Props) {
  return (
    <View style={styles.lista}>
      {alergenos.map((alergeno) => {
        const marcado = seleccionados.has(alergeno.id);
        return (
          <Pressable
            key={alergeno.id}
            style={({ pressed }) => [
              styles.chip,
              marcado && styles.chipMarcado,
              deshabilitado && styles.inactivo,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => onAlternar(alergeno.id)}
            disabled={deshabilitado}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marcado, disabled: deshabilitado }}
            accessibilityLabel={alergeno.nombre}
          >
            <View style={[styles.casilla, marcado && styles.casillaMarcada]}>
              {marcado && <Icono nombre="check-linear" size={14} color={colors.encabezado} />}
            </View>
            <Text style={[styles.nombre, marcado && styles.nombreMarcado]}>{alergeno.nombre}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
  },
  chip: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  chipMarcado: {
    backgroundColor: colors.encabezado,
    borderColor: colors.encabezado,
  },
  inactivo: {
    opacity: 0.5,
  },
  casilla: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: {
    backgroundColor: colors.superficie,
    borderColor: colors.superficie,
  },
  nombre: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  nombreMarcado: {
    fontFamily: fuentes.negrita,
    color: colors.sobreEncabezado,
  },
});
