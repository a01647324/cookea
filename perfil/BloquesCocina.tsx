import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SelectorIngredientes from './SelectorIngredientes';
import SelectorElectrodomesticos from './SelectorElectrodomesticos';
import useCocina from './useCocina';
import Icono, { NombreIcono } from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

type Props = { cocina: ReturnType<typeof useCocina>; deshabilitado: boolean; solo?: 'gustos' | 'cocina' };

function Titulo({ icono, fondo, color, texto }: { icono: NombreIcono; fondo: string; color: string; texto: string }) {
  return (
    <View style={styles.titulo}>
      <View style={[styles.circulo, { backgroundColor: fondo }]}>
        <Icono nombre={icono} size={20} color={color} />
      </View>
      <Text style={styles.textoTitulo}>{texto}</Text>
    </View>
  );
}

export default function BloquesCocina({ cocina, deshabilitado, solo }: Props) {
  const { gusta, disgusta } = useMemo(() => {
    const gusta = new Set<number>();
    const disgusta = new Set<number>();
    for (const [id, tipo] of cocina.gustos) (tipo === 'gusta' ? gusta : disgusta).add(id);
    return { gusta, disgusta };
  }, [cocina.gustos]);

  return (
    <View style={styles.contenedor}>
      {solo !== 'cocina' && (
        <>
          <View style={styles.bloque}>
            <Titulo icono="heart-linear" fondo={colors.acentoSuave} color={colors.acentoIntenso} texto="Me gusta" />
            <SelectorIngredientes
              opciones={cocina.ingredientes}
              seleccionados={gusta}
              onAlternar={(id) => cocina.alternarGusto(id, 'gusta')}
              deshabilitado={deshabilitado}
            />
          </View>
          <View style={styles.bloque}>
            <Titulo icono="close-circle-linear" fondo={colors.destacadoSuave} color={colors.destacadoIntenso} texto="No me gusta" />
            <SelectorIngredientes
              opciones={cocina.ingredientes}
              seleccionados={disgusta}
              onAlternar={(id) => cocina.alternarGusto(id, 'disgusta')}
              deshabilitado={deshabilitado}
            />
          </View>
          <View style={styles.nota}>
            <Icono nombre="info-circle-linear" size={20} color={colors.serenoIntenso} />
            <Text style={styles.textoNota}>
              Los gustos no anulan alergias. Estas preferencias se guardan, pero todavía no cambian las recomendaciones.
            </Text>
          </View>
        </>
      )}
      {solo !== 'gustos' && (
        <View style={styles.bloque}>
          <Titulo icono="oven-mitts-linear" fondo={colors.serenoSuave} color={colors.serenoIntenso} texto="Mi cocina" />
          <SelectorElectrodomesticos
            opciones={cocina.electrodomesticos}
            seleccionados={cocina.aparatos}
            onAlternar={cocina.alternarAparato}
            deshabilitado={deshabilitado}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: espaciado.md,
  },
  bloque: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: espaciado.md,
  },
  titulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    marginBottom: 12,
  },
  circulo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoTitulo: {
    fontFamily: fuentes.titulo,
    fontSize: 19,
    lineHeight: 26,
    color: colors.texto,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    backgroundColor: colors.serenoSuave,
    borderRadius: radios.md,
    padding: 12,
  },
  textoNota: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 19,
    color: colors.texto,
  },
});
