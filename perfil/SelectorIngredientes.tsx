import { indexarCatalogo, buscarCatalogo } from './busquedaCatalogo';
import { useMemo, useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import ListaAlergenos from './ListaAlergenos';
import Icono from '../components/Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../theme/theme';

export type OpcionCatalogo = { id: number; nombre: string };
type Props = { opciones: OpcionCatalogo[]; seleccionados: Set<number>; onAlternar: (id: number) => void; deshabilitado?: boolean };

export default function SelectorIngredientes({ opciones, ...props }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const indice = useMemo(() => indexarCatalogo(opciones), [opciones]);
  const visibles = useMemo(() => buscarCatalogo(indice, busqueda), [indice, busqueda]);

  return (
    <View>
      <View style={styles.buscador}>
        <Icono nombre="magnifer-linear" size={20} color={colors.textoSuave} />
        <TextInput
          style={styles.input}
          accessibilityLabel="Buscar ingredientes"
          placeholder="Buscar ingredientes"
          placeholderTextColor={colors.textoTenue}
          value={busqueda}
          onChangeText={setBusqueda}
          editable={!props.deshabilitado}
        />
      </View>
      {opciones.length === 0 ? (
        <Text style={styles.vacio}>No hay ingredientes disponibles. Tus selecciones guardadas se conservan.</Text>
      ) : visibles.length === 0 ? (
        <Text style={styles.vacio}>No hay coincidencias.</Text>
      ) : (
        <ListaAlergenos alergenos={visibles} {...props} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    height: 50,
    borderRadius: radios.pill,
    backgroundColor: colors.fondo,
    paddingHorizontal: espaciado.md,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  vacio: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
  },
});
