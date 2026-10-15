import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icono, { NombreIcono } from '../components/Icono';
import { colors, espaciado, fuentes, tamanos } from '../theme/theme';

type Props = {
  paso: 1 | 2 | 3;
  icono: NombreIcono;
  colorIcono: string;
  fondoIcono: string;
  titulo: string;
  children?: ReactNode;
};

// Barra de 3 pasos + ícono + título de "Recuperar contraseña"
export default function PasosRecuperar({ paso, icono, colorIcono, fondoIcono, titulo, children }: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.barra} accessible accessibilityLabel={`Paso ${paso} de 3`}>
        {[1, 2, 3].map((n) => (
          <View key={n} style={[styles.segmento, n <= paso && styles.segmentoActivo]} />
        ))}
      </View>
      <Text style={styles.paso}>Paso {paso} de 3</Text>

      <View style={[styles.circulo, { backgroundColor: fondoIcono }]}>
        <Icono nombre={icono} size={34} color={colorIcono} />
      </View>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', marginBottom: espaciado.md },
  barra: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  segmento: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.borde },
  segmentoActivo: { backgroundColor: colors.encabezado },
  paso: {
    alignSelf: 'flex-start',
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    marginTop: 8,
    marginBottom: espaciado.lg,
  },
  circulo: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 26,
    lineHeight: 34,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.md,
    marginBottom: espaciado.xs,
  },
});
