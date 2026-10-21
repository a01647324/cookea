import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { NOMBRE_GRUPO_PLATO } from '../../constants/recomendador';
import { useAporteReceta } from '../../hooks/useAporteReceta';
import { GRUPOS_PRINCIPALES, sugerenciaParaCompletar } from '../../lib/recomendador/salud';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  recetaId: number;
}

export function PlatoBienComer({ recetaId }: Props) {
  const { aporte, excluidos } = useAporteReceta(recetaId);
  if (!aporte) return null;

  const sugerencia = excluidos ? sugerenciaParaCompletar(aporte.faltantes, excluidos) : null;
  const total = GRUPOS_PRINCIPALES.length;

  return (
    <View>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Plato del Bien Comer</Text>
        <Text style={estilos.resumen}>
          {aporte.cubiertos.length} de {total} grupos
        </Text>
      </View>

      <View style={estilos.tarjeta}>
        <Text style={estilos.intro}>Esta receta aporta:</Text>

        {GRUPOS_PRINCIPALES.map((grupo) => {
          const aporta = aporte.cubiertos.includes(grupo);
          return (
            <View key={grupo} style={estilos.fila} accessible accessibilityLabel={`${NOMBRE_GRUPO_PLATO[grupo]}: ${aporta ? 'sí aporta' : 'no aporta'}`}>
              <View style={[estilos.marca, aporta ? estilos.marcaSi : estilos.marcaNo]}>
                {aporta && <Icono nombre="check-linear" size={16} color={colors.acentoOscuro} />}
              </View>
              <Text style={[estilos.nombreGrupo, !aporta && estilos.nombreApagado]}>{NOMBRE_GRUPO_PLATO[grupo]}</Text>
            </View>
          );
        })}

        {sugerencia && (
          <View style={estilos.nota}>
            <Icono nombre="leaf-linear" size={18} color={colors.serenoIntenso} />
            <Text style={estilos.textoNota}>{sugerencia}</Text>
          </View>
        )}

        {aporte.ultraprocesados.length > 0 && (
          <View style={[estilos.nota, estilos.notaCalida]}>
            <Icono nombre="info-circle-linear" size={18} color={colors.calidoOscuro} />
            <Text style={[estilos.textoNota, { color: colors.calidoOscuro }]}>
              Lleva ultraprocesados ({aporte.ultraprocesados.join(', ').toLowerCase()}). Las guías alimentarias de México
              recomiendan moderarlos.
            </Text>
          </View>
        )}

        <Text style={estilos.pie}>Guía basada en la NOM-043-SSA2-2012. Combina esta receta con otras para completar tu comida.</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 27,
    color: colors.texto,
  },
  resumen: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    marginHorizontal: espaciado.md,
    padding: espaciado.md,
    gap: espaciado.sm,
  },
  intro: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marca: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaSi: {
    backgroundColor: colors.acentoSuave,
  },
  marcaNo: {
    borderWidth: 1.5,
    borderColor: colors.borde,
  },
  nombreGrupo: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  nombreApagado: {
    fontFamily: fuentes.regular,
    color: colors.textoTenue,
  },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.sm,
    backgroundColor: colors.serenoSuave,
    borderRadius: radios.md,
    padding: 12,
    marginTop: espaciado.xs,
  },
  notaCalida: {
    backgroundColor: colors.calidoSuave,
    marginTop: 0,
  },
  textoNota: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.textoSuave,
  },
  pie: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    lineHeight: 17,
    color: colors.textoTenue,
    marginTop: espaciado.xs,
  },
});