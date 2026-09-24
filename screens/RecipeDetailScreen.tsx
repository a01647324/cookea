import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, espaciado, radios, tipografia } from '../theme/theme';

/**
 * RecipeDetailScreen
 *
 * incluye: nombre, ingredientes (con cantidad),
 * pasos de preparación y tiempo estimado, más el ícono de favorito.
 */
export function RecipeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const recetaId: number = route.params?.recetaId;

  const { receta, cargando, error, recargar } = useRecipeDetail(recetaId);
  const { esFavorita, alternar } = useFavoriteToggle(recetaId);

  if (cargando) return <VistaCargando mensaje="Cargando receta..." />;
  if (error || !receta) return <VistaError mensaje={error ?? 'Receta no encontrada.'} onReintentar={recargar} />;

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <ScrollView>
        {receta.foto_url ? (
          <Image source={{ uri: receta.foto_url }} style={estilos.foto} />
        ) : (
          <View style={[estilos.foto, estilos.fotoRespaldo]} />
        )}

        <View style={estilos.encabezadoFlotante}>
          <Pressable onPress={() => navigation.goBack()} style={estilos.botonRedondo}>
            <Text>←</Text>
          </Pressable>
          <Pressable onPress={alternar} style={estilos.botonRedondo}>
            <Text>{esFavorita ? '★' : '☆'}</Text>
          </Pressable>
        </View>

        <View style={estilos.contenido}>
          <Text style={tipografia.titulo}>{receta.nombre}</Text>
          <Text style={estilos.meta}>
            ⏱ {receta.tiempo_min} min · 🍽 {receta.porciones_base} porciones
          </Text>

          {receta.descripcion && <Text style={estilos.descripcion}>{receta.descripcion}</Text>}

          {/* Recordatorio de seguridad (sección 3.4 del manual): aunque el
              filtro de alergias ya excluyó esta receta si aplicaba, seguimos
              mostrando el aviso porque las alergias del HOGAR pueden variar
              persona a persona, y el manual pide que el usuario siempre
              revise la lista completa. */}
          <View style={estilos.avisoAlergias}>
            <Text style={estilos.avisoTexto}>
              ⚠ Revisa la lista completa de ingredientes antes de preparar o consumir esta receta,
              incluso si ya registraste tus alergias.
            </Text>
          </View>

          <Text style={[tipografia.subtitulo, estilos.seccionTitulo]}>Ingredientes</Text>
          {receta.receta_ingredientes.map((ri, indice) => (
            <View key={indice} style={estilos.filaIngrediente}>
              <Text style={tipografia.cuerpo}>
                • {ri.cantidad_texto ?? `${ri.cantidad} ${ri.ingredientes.unidad}`} de{' '}
                {ri.ingredientes.nombre}
                {ri.opcional ? ' (opcional)' : ''}
              </Text>
            </View>
          ))}

          <Text style={[tipografia.subtitulo, estilos.seccionTitulo]}>Preparación</Text>
          {receta.pasos_receta
            .sort((a, b) => a.orden - b.orden)
            .map((paso) => (
              <View key={paso.orden} style={estilos.filaPaso}>
                <Text style={estilos.numeroPaso}>{paso.orden}</Text>
                <Text style={[tipografia.cuerpo, { flex: 1 }]}>{paso.texto}</Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  foto: {
    width: '100%',
    height: 220,
  },
  fotoRespaldo: {
    backgroundColor: colors.surfaceMuted,
  },
  encabezadoFlotante: {
    position: 'absolute',
    top: espaciado.md,
    left: espaciado.md,
    right: espaciado.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonRedondo: {
    width: 36,
    height: 36,
    borderRadius: radios.pill,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    padding: espaciado.md,
  },
  meta: {
    ...tipografia.chico,
    marginTop: espaciado.xs,
  },
  descripcion: {
    ...tipografia.cuerpo,
    marginTop: espaciado.sm,
  },
  avisoAlergias: {
    backgroundColor: '#FBEFE3',
    borderRadius: radios.sm,
    padding: espaciado.sm,
    marginTop: espaciado.md,
  },
  avisoTexto: {
    ...tipografia.chico,
    color: colors.advertencia,
  },
  seccionTitulo: {
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  filaIngrediente: {
    marginBottom: espaciado.xs,
  },
  filaPaso: {
    flexDirection: 'row',
    marginBottom: espaciado.sm,
  },
  numeroPaso: {
    ...tipografia.subtitulo,
    width: 24,
    color: colors.oliva,
  },
});