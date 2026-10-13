import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { VistaCargando, VistaError } from '../components/StateViews';
import { BotonYaLoPrepare } from '../components/receta/botonYaLoPrepare';
import { ModalYaLoPrepare } from '../components/receta/modalYaLoPrepare';
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

  // Cantidad de porciones que quiere preparar el usuario
  const [porciones, setPorciones] = useState<number | null>(null);

  // Usamos las porciones originales hasta que el usuario cambie el valor
  const porcionesBase = receta?.porciones_base ?? 1;
  const porcionesActuales = porciones ?? porcionesBase;
  const [modalPreparada, setModalPreparada] = useState(false);
  // Calcula la cantidad proporcional de cada ingrediente
  function ajustarCantidad(cantidad: number) {
    const resultado = cantidad * (porcionesActuales / porcionesBase);

    return Number(resultado.toFixed(2));
  }

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
          <View style={estilos.tarjetaInformacion}>
          <Text style={tipografia.titulo}>{receta.nombre}</Text>
          <Text style={estilos.meta}>
            ⏱ {receta.tiempo_min} min
          </Text>

          <View style={estilos.selectorPorciones}>
            <Text style={estilos.etiquetaPorciones}>Porciones</Text>

            <View style={estilos.controlesPorciones}>
              <Pressable
                style={estilos.botonPorcion}
                disabled={porcionesActuales <= 1}
                onPress={() =>
                  setPorciones(Math.max(1, porcionesActuales - 1))
                }
              >
                <Text style={estilos.textoBotonPorcion}>−</Text>
              </Pressable>
            </View>
              <Text style={estilos.numeroPorciones}>
                {porcionesActuales}
              </Text>

              <Pressable
                style={estilos.botonPorcion}
                disabled={porcionesActuales >= 20}
                onPress={() =>
                  setPorciones(Math.min(20, porcionesActuales + 1))
                }
              >
                <Text style={estilos.textoBotonPorcion}>+</Text>
              </Pressable>
            </View>
          </View>

          {receta.descripcion && <Text style={estilos.descripcion}>{receta.descripcion}</Text>}
          <Pressable
            style={estilos.botonCocinar}
            onPress={() =>
              navigation.navigate('ModoCocina', {
                recetaId: receta.id,
                porciones: porcionesActuales,
              })
            }
          >
            <Text style={estilos.textoBotonCocinar}>
              EMPEZAR A COCINAR
            </Text>
            
          </Pressable>
          <BotonYaLoPrepare onPress={() => setModalPreparada(true)} />

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
                • {ajustarCantidad(ri.cantidad)} {ri.ingredientes.unidad} de{' '}
                {ri.ingredientes.nombre}
                {ri.opcional ? ' (opcional)' : ''}
              </Text>

              {ri.cantidad_texto && (
                <Text style={estilos.cantidadOriginal}>
                  Receta original: {ri.cantidad_texto}
                </Text>
              )}
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
      <ModalYaLoPrepare visible={modalPreparada} onCerrar={() => setModalPreparada(false)}
     receta={receta} porciones={porcionesActuales} />
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
    height: 300,
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
    backgroundColor: colors.surface,
    borderRadius: radios.sm,
    padding: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  filaPaso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radios.sm,
    padding: espaciado.md,
    marginBottom: espaciado.sm,
    gap: espaciado.sm,
  },

  numeroPaso: {
    ...tipografia.subtitulo,
    width: 24,
    color: colors.oliva,
  },
    botonCocinar: {
    backgroundColor: colors.oliva,
    borderRadius: radios.md,
    paddingVertical: espaciado.md,
    alignItems: 'center',
    marginTop: espaciado.lg,
  },

  textoBotonCocinar: {
    color: colors.textoSobreColor,
    fontSize: 14,
    fontWeight: '700',
  },

  selectorPorciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginTop: espaciado.md,
  },

  etiquetaPorciones: {
    ...tipografia.subtitulo,
  },

  controlesPorciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
  },

  botonPorcion: {
    width: 34,
    height: 34,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radios.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoBotonPorcion: {
    fontSize: 22,
    color: colors.textoPrincipal,
    fontWeight: '600',
  },

  numeroPorciones: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textoPrincipal,
    minWidth: 24,
    textAlign: 'center',
  },

  cantidadOriginal: {
    ...tipografia.chico,
    marginLeft: espaciado.md,
    marginTop: 2,
  },

  contenido: {
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.xl,
    marginTop: -25,
  },

  tarjetaInformacion: {
    backgroundColor: colors.surface,
    borderRadius: radios.lg,
    padding: espaciado.md,
    marginBottom: espaciado.lg,
  },
});