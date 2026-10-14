import { Text } from 'react-native';
import ListaAlergenos from './ListaAlergenos';
import { OpcionCatalogo } from './SelectorIngredientes';
import { tipografia } from '../theme/theme';
type Props = { opciones: OpcionCatalogo[]; seleccionados: Set<number>; onAlternar: (id: number) => void; deshabilitado?: boolean };
export default function SelectorElectrodomesticos({ opciones, ...props }: Props) {
 return opciones.length ? <ListaAlergenos alergenos={opciones} {...props} /> : <Text style={tipografia.cuerpo}>No hay electrodomésticos disponibles. Tus selecciones guardadas se conservan.</Text>;
}
