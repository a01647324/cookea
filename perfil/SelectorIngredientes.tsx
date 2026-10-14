import { indexarCatalogo, buscarCatalogo } from './busquedaCatalogo';
import { useMemo, useState } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import ListaAlergenos from './ListaAlergenos';
import { colors, tipografia } from '../theme/theme';
export type OpcionCatalogo = { id: number; nombre: string };
type Props = { opciones: OpcionCatalogo[]; seleccionados: Set<number>; onAlternar: (id: number) => void; deshabilitado?: boolean };
export default function SelectorIngredientes({ opciones, ...props }: Props) {
 const [busqueda, setBusqueda] = useState('');
 const indice = useMemo(() => indexarCatalogo(opciones), [opciones]);
 const visibles = useMemo(() => buscarCatalogo(indice, busqueda), [indice, busqueda]);
 return <View><TextInput style={styles.input} accessibilityLabel="Buscar ingredientes" placeholder="Buscar ingredientes" value={busqueda} onChangeText={setBusqueda} editable={!props.deshabilitado} />
 {opciones.length === 0 ? <Text style={tipografia.cuerpo}>No hay ingredientes disponibles. Tus selecciones guardadas se conservan.</Text> : visibles.length === 0 ? <Text style={tipografia.cuerpo}>No hay coincidencias.</Text> : <ListaAlergenos alergenos={visibles} {...props} />}</View>;
}
const styles = StyleSheet.create({ input: { minHeight: 56, borderRadius: 14, backgroundColor: colors.superficie, fontSize: 17, borderWidth: 1, borderColor: colors.borde, padding: 12, marginBottom: 12, color: colors.texto } });
