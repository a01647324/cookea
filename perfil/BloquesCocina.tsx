import { useMemo } from 'react';
import { Text, View } from 'react-native';
import SelectorIngredientes from './SelectorIngredientes';
import SelectorElectrodomesticos from './SelectorElectrodomesticos';
import useCocina from './useCocina';
import { tipografia } from '../theme/theme';
type Props = { cocina: ReturnType<typeof useCocina>; deshabilitado: boolean; solo?: 'gustos' | 'cocina' };
export default function BloquesCocina({ cocina, deshabilitado, solo }: Props) {
 const { gusta, disgusta } = useMemo(() => {
  const gusta = new Set<number>(); const disgusta = new Set<number>();
  for (const [id, tipo] of cocina.gustos) (tipo === 'gusta' ? gusta : disgusta).add(id);
  return { gusta, disgusta };
 }, [cocina.gustos]);
 return <View style={{ gap: 16 }}>{solo !== 'cocina' && <>
 <Text style={tipografia.subtitulo}>Me gusta</Text><SelectorIngredientes opciones={cocina.ingredientes} seleccionados={gusta} onAlternar={id => cocina.alternarGusto(id,'gusta')} deshabilitado={deshabilitado} />
 <Text style={tipografia.subtitulo}>No me gusta</Text><SelectorIngredientes opciones={cocina.ingredientes} seleccionados={disgusta} onAlternar={id => cocina.alternarGusto(id,'disgusta')} deshabilitado={deshabilitado} />
 <Text style={tipografia.chico}>Los gustos no anulan alergias. Estas preferencias se guardan, pero todavía no cambian las recomendaciones.</Text>
 </>}{solo !== 'gustos' && <><Text style={tipografia.subtitulo}>Mi cocina</Text><SelectorElectrodomesticos opciones={cocina.electrodomesticos} seleccionados={cocina.aparatos} onAlternar={cocina.alternarAparato} deshabilitado={deshabilitado} /></>}</View>;
}
