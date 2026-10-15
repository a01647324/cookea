import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useDetalleReceta, Utensilio } from '../hooks/useDetalleReceta';
import { useFavoriteToggle } from '../hooks/useFavoriteToggle';
import { VistaError } from '../components/StateViews';
import { Esqueleto } from '../components/Esqueleto';
import Icono, { NombreIcono } from '../components/Icono';
import { IngredienteImagen } from '../components/alacena/ingredienteImagen';
import { ModalYaLoPrepare } from '../components/receta/modalYaLoPrepare';
import { HojaAgregarSemana } from '../components/receta/HojaAgregarSemana';
import { formatearCantidad } from '../lib/unidades';
import { normalizar } from '../constants/categorias';
import { RecetaIngrediente } from '../types/database';
import { colors, espaciado, fuentes, radios, sombra, tamanos } from '../theme/theme';

type IngredienteConImagen = RecetaIngrediente & {
  ingredientes: RecetaIngrediente['ingredientes'] & { imagen_url?: string | null };
};

const ICONOS_UTENSILIO: [string[], NombreIcono, string, string][] = [
  [['estufa', 'parrilla', 'comal', 'fuego'], 'fire-linear', colors.destacadoSuave, colors.destacadoIntenso],
  [['horno'], 'oven-mitts-linear', colors.calidoSuave, colors.calidoIntenso],
  [['microondas'], 'monitor-linear', colors.serenoSuave, colors.serenoIntenso],
  [['licuadora', 'batidora', 'procesador', 'extractor'], 'bolt-linear', colors.resaltadoSuave, colors.calidoOscuro],
  [['refri', 'congelador'], 'fridge-linear', colors.serenoSuave, colors.serenoIntenso],
  [['olla', 'cacerola', 'vaporera'], 'cup-hot-linear', colors.calidoSuave, colors.calidoIntenso],
  [['sarten', 'plato'], 'plate-linear', colors.acentoSuave, colors.acentoIntenso],
  [['bascula', 'balanza'], 'scale-linear', colors.acentoSuave, colors.acentoIntenso],
];

function estiloUtensilio(nombre: string) {
  const n = normalizar(nombre);
  const encontrado = ICONOS_UTENSILIO.find(([claves]) => claves.some((c) => n.includes(c)));
  if (encontrado) return { icono: encontrado[1], fondo: encontrado[2], color: encontrado[3] };
  return { icono: 'chef-hat-linear' as NombreIcono, fondo: colors.acentoSuave, color: colors.acentoIntenso };
}

function textoTemporizador(segundos: number) {
  const minutos = Math.round(segundos / 60);
  return minutos >= 1 ? `${minutos} min` : `${segundos} s`;
}

export function RecipeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const recetaId: number = route.params?.recetaId;

  const { receta, extras, cargando, error, recargar, recargarExtras } = useDetalleReceta(recetaId);
  const { esFavorita, alternar } = useFavoriteToggle(recetaId);

  const [porciones, setPorciones] = useState<number | null>(null);
  const [hoja, setHoja] = useState<'preparada' | 'semana' | null>(null);

  const botonesFlotantes = (
    <View style={[estilos.flotantes, { top: insets.top + espaciado.sm }]}>
      <Pressable onPress={() => navigation.goBack()} style={estilos.botonVidrio} accessibilityLabel="Regresar">
        <Icono nombre="arrow-left-linear" size={22} color={colors.superficie} />
      </Pressable>
      {receta && (
        <Pressable
          onPress={alternar}
          style={estilos.botonVidrio}
          accessibilityLabel={esFavorita ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        >
          <Icono
            nombre={esFavorita ? 'star-bold' : 'star-linear'}
            size={22}
            color={esFavorita ? colors.calificacion : colors.superficie}
          />
        </Pressable>
      )}
    </View>
  );

  if (cargando && !receta) {
    return (
      <View style={estilos.pantalla}>
        <Esqueleto ancho="100%" alto={290} radio={0} />
        <View style={[estilos.tarjetaTitulo, { alignItems: 'center' }]}>
          <Esqueleto ancho="70%" alto={26} />
          <Esqueleto ancho="45%" alto={14} estilo={{ marginTop: espaciado.sm }} />
          <Esqueleto ancho="100%" alto={48} estilo={{ marginTop: espaciado.md }} />
        </View>
        <View style={estilos.carrusel}>
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} ancho={72} alto={72} radio={36} />
          ))}
        </View>
        {botonesFlotantes}
      </View>
    );
  }

  if (error || !receta) {
    return (
      <View style={[estilos.pantalla, { paddingTop: insets.top + 70 }]}>
        <VistaError mensaje={error ?? 'Receta no encontrada.'} onReintentar={recargar} />
        {botonesFlotantes}
      </View>
    );
  }

  const porcionesBase = receta.porciones_base || 1;
  const porcionesActuales = porciones ?? porcionesBase;
  const factor = porcionesActuales / porcionesBase;

  const ingredientes = [...(receta.receta_ingredientes as IngredienteConImagen[])].sort(
    (a, b) => Number(a.opcional) - Number(b.opcional)
  );
  const obligatorios = ingredientes.filter((ri) => !ri.opcional);
  const alacenaVacia = Object.keys(extras.alacena).length === 0;
  const loTiene = (ri: IngredienteConImagen) =>
    (extras.alacena[ri.ingredientes.id] ?? 0) >= Number(ri.cantidad) * factor;
  const cuantosTiene = obligatorios.filter(loTiene).length;
  const tieneTodo = obligatorios.length > 0 && cuantosTiene === obligatorios.length;

  const resumenIngredientes = alacenaVacia
    ? `${obligatorios.length} ingredientes`
    : tieneTodo
      ? 'Tienes todo'
      : `Tienes ${cuantosTiene} de ${obligatorios.length}`;

  return (
    <View style={estilos.pantalla}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={estilos.contenido}>
        {receta.foto_url ? (
          <Image source={{ uri: receta.foto_url }} style={estilos.foto} contentFit="cover" transition={200} />
        ) : (
          <View style={[estilos.foto, estilos.sinFoto]}>
            <Icono nombre="chef-hat-linear" size={56} color={colors.superficie} />
          </View>
        )}

        <View style={estilos.tarjetaTitulo}>
          <Text style={estilos.nombre}>{receta.nombre}</Text>
          {extras.etiquetas.length > 0 && (
            <Text style={estilos.etiquetas}>{extras.etiquetas.join(' · ')}</Text>
          )}
          <View style={estilos.datos}>
            <View style={estilos.dato}>
              <Icono nombre="clock-circle-linear" size={22} color={colors.calidoIntenso} />
              <Text style={estilos.valorDato}>{receta.tiempo_min} min</Text>
            </View>
            <View style={estilos.dato}>
              <Icono nombre="users-group-rounded-linear" size={22} color={colors.serenoIntenso} />
              <Text style={estilos.valorDato}>{porcionesActuales} porc.</Text>
            </View>
            <View style={estilos.dato}>
              <Icono nombre="box-linear" size={22} color={colors.acentoIntenso} />
              <Text style={estilos.valorDato}>
                {alacenaVacia ? obligatorios.length : `${cuantosTiene} de ${obligatorios.length}`}
              </Text>
            </View>
          </View>
        </View>

        <View style={[estilos.aviso, extras.tieneAlergeno && estilos.avisoPeligro]}>
          <Icono
            nombre="danger-triangle-linear"
            size={20}
            color={extras.tieneAlergeno ? colors.peligro : colors.destacadoOscuro}
          />
          <Text style={[estilos.textoAviso, extras.tieneAlergeno && { color: colors.peligro }]}>
            {extras.tieneAlergeno
              ? 'Esta receta tiene un ingrediente al que alguien de tu hogar es alérgico.'
              : 'Revisa los ingredientes antes de preparar, aunque ya registraste tus alergias.'}
          </Text>
        </View>

        {!!receta.descripcion && <Text style={estilos.descripcion}>{receta.descripcion}</Text>}

        <View style={estilos.porciones}>
          <Text style={estilos.textoPorciones}>Porciones</Text>
          <View style={estilos.stepper}>
            <Pressable
              onPress={() => setPorciones(Math.max(1, porcionesActuales - 1))}
              disabled={porcionesActuales <= 1}
              style={[estilos.botonMenos, porcionesActuales <= 1 && estilos.apagado]}
              accessibilityLabel="Menos porciones"
            >
              <Icono nombre="minus-linear" size={20} color={colors.texto} />
            </Pressable>
            <Text style={estilos.numeroPorciones}>{porcionesActuales}</Text>
            <Pressable
              onPress={() => setPorciones(Math.min(20, porcionesActuales + 1))}
              disabled={porcionesActuales >= 20}
              style={[estilos.botonMas, porcionesActuales >= 20 && estilos.apagado]}
              accessibilityLabel="Más porciones"
            >
              <Icono nombre="add-linear" size={20} color={colors.sobreEncabezado} />
            </Pressable>
          </View>
        </View>

        {!!receta.video_url && (
          <Pressable onPress={() => Linking.openURL(receta.video_url!)} style={estilos.botonVideo}>
            <Icono nombre="play-linear" size={18} color={colors.texto} />
            <Text style={estilos.textoVideo}>Ver video</Text>
          </Pressable>
        )}

        <View style={estilos.encabezado}>
          <Text style={estilos.tituloSeccion}>Ingredientes</Text>
          <Text style={[estilos.resumen, tieneTodo && !alacenaVacia && { color: colors.acentoIntenso }]}>
            {resumenIngredientes}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.carrusel}>
          {ingredientes.map((ri) => {
            const falta = !alacenaVacia && !ri.opcional && !loTiene(ri);
            return (
              <View key={ri.ingredientes.id} style={estilos.ingrediente}>
                <View
                  style={[
                    estilos.circulo,
                    falta && estilos.circuloFalta,
                    ri.opcional && estilos.circuloOpcional,
                  ]}
                >
                  <IngredienteImagen
                    nombre={ri.ingredientes.nombre}
                    categoria={ri.ingredientes.categoria}
                    url={ri.ingredientes.imagen_url}
                    tamano={62}
                    style={estilos.imagenIngrediente}
                  />
                </View>
                <Text style={estilos.nombreIngrediente} numberOfLines={2}>
                  {ri.ingredientes.nombre}
                </Text>
                <Text style={estilos.cantidad} numberOfLines={1}>
                  {ri.opcional
                    ? 'Opcional'
                    : formatearCantidad(Number(ri.cantidad) * factor, ri.ingredientes.unidad)}
                </Text>
                {falta && <Text style={estilos.falta}>Te falta</Text>}
              </View>
            );
          })}
        </ScrollView>

        {extras.utensilios.length > 0 && (
          <>
            <View style={estilos.encabezado}>
              <Text style={estilos.tituloSeccion}>Utensilios</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.carrusel}>
              {extras.utensilios.map((u: Utensilio) => {
                const estilo = estiloUtensilio(u.nombre);
                return (
                  <View key={u.id} style={estilos.utensilio}>
                    <View style={[estilos.circuloUtensilio, { backgroundColor: estilo.fondo }]}>
                      <Icono nombre={estilo.icono} size={24} color={estilo.color} />
                    </View>
                    <Text style={estilos.nombreUtensilio} numberOfLines={2}>
                      {u.nombre}
                    </Text>
                    {u.loTienes !== null && (
                      <Text style={[estilos.estadoUtensilio, !u.loTienes && { color: colors.destacadoOscuro }]}>
                        {u.loTienes ? 'Lo tienes' : 'No lo tienes'}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        <View style={estilos.encabezado}>
          <Text style={estilos.tituloSeccion}>Preparación</Text>
          <Text style={estilos.resumen}>
            {receta.pasos_receta.length} {receta.pasos_receta.length === 1 ? 'paso' : 'pasos'}
          </Text>
        </View>
        {receta.pasos_receta.map((paso, i) => (
          <View key={paso.orden}>
            <View style={estilos.paso}>
              <View style={estilos.numeroPaso}>
                <Text style={estilos.textoNumero}>{paso.orden}</Text>
              </View>
              <View style={estilos.cuerpoPaso}>
                <Text style={estilos.textoPaso}>{paso.texto}</Text>
                {!!paso.temporizador_seg && (
                  <View style={estilos.temporizador}>
                    <Icono nombre="stopwatch-linear" size={14} color={colors.texto} />
                    <Text style={estilos.textoTemporizador}>{textoTemporizador(paso.temporizador_seg)}</Text>
                  </View>
                )}
              </View>
            </View>
            {i < receta.pasos_receta.length - 1 && <View style={estilos.separador} />}
          </View>
        ))}
      </ScrollView>

      {botonesFlotantes}

      <View style={estilos.barra}>
        <Pressable
          onPress={() => navigation.navigate('ModoCocina', { recetaId: receta.id, porciones: porcionesActuales })}
          style={({ pressed }) => [estilos.botonCocinar, pressed && { opacity: 0.9 }]}
        >
          <Icono nombre="chef-hat-linear" size={20} color={colors.sobreEncabezado} />
          <Text style={estilos.textoCocinar}>Empezar a cocinar</Text>
        </Pressable>
        <View style={estilos.filaSecundaria}>
          <Pressable onPress={() => setHoja('semana')} style={estilos.botonSecundario}>
            <Icono nombre="calendar-linear" size={18} color={colors.texto} />
            <Text style={estilos.textoSecundario}>A mi semana</Text>
          </Pressable>
          <Pressable onPress={() => setHoja('preparada')} style={estilos.botonSecundario}>
            <Icono nombre="check-circle-linear" size={18} color={colors.texto} />
            <Text style={estilos.textoSecundario}>Ya la preparé</Text>
          </Pressable>
        </View>
      </View>

      <ModalYaLoPrepare
        visible={hoja === 'preparada'}
        onCerrar={() => {
          setHoja(null);
          recargarExtras();
        }}
        receta={receta}
        porciones={porcionesActuales}
      />
      <HojaAgregarSemana
        visible={hoja === 'semana'}
        recetaId={receta.id}
        nombreReceta={receta.nombre}
        onCerrar={() => setHoja(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  contenido: {
    paddingBottom: 190,
  },
  foto: {
    width: '100%',
    height: 290,
  },
  sinFoto: {
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flotantes: {
    position: 'absolute',
    left: espaciado.md,
    right: espaciado.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  botonVidrio: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaTitulo: {
    marginTop: -52,
    marginHorizontal: espaciado.md,
    backgroundColor: colors.superficie,
    borderRadius: 24,
    padding: espaciado.md,
    ...sombra,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: 25,
    lineHeight: 32,
    color: colors.texto,
    textAlign: 'center',
  },
  etiquetas: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 4,
  },
  datos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    marginTop: espaciado.md,
    paddingTop: espaciado.sm,
  },
  dato: {
    alignItems: 'center',
    gap: 4,
  },
  valorDato: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  aviso: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
    padding: espaciado.sm,
    borderRadius: radios.md,
    backgroundColor: colors.destacadoSuave,
  },
  avisoPeligro: {
    backgroundColor: colors.peligroSuave,
    borderWidth: 1,
    borderColor: colors.peligroBorde,
  },
  textoAviso: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.destacadoOscuro,
  },
  descripcion: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 23,
    color: colors.textoSuave,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  porciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: espaciado.md,
    marginTop: espaciado.md,
    backgroundColor: colors.superficie,
    borderRadius: 18,
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  textoPorciones: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
  },
  botonMenos: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMas: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apagado: {
    opacity: 0.35,
  },
  numeroPorciones: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.enorme,
    color: colors.texto,
    minWidth: 24,
    textAlign: 'center',
  },
  botonVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xs,
    marginHorizontal: espaciado.md,
    marginTop: espaciado.sm,
    minHeight: 46,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  textoVideo: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  tituloSeccion: {
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
  carrusel: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  ingrediente: {
    width: 82,
    alignItems: 'center',
  },
  circulo: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: colors.superficie,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  circuloFalta: {
    borderColor: colors.destacado,
    backgroundColor: colors.destacadoSuave,
  },
  circuloOpcional: {
    borderStyle: 'dashed',
    borderColor: colors.textoTenue,
    backgroundColor: 'transparent',
  },
  imagenIngrediente: {
    borderRadius: 31,
  },
  nombreIngrediente: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    lineHeight: 17,
    color: colors.texto,
    textAlign: 'center',
  },
  cantidad: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
    marginTop: 2,
  },
  falta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
    color: colors.destacadoOscuro,
    marginTop: 2,
  },
  utensilio: {
    width: 100,
    alignItems: 'center',
    backgroundColor: colors.superficie,
    borderRadius: 18,
    paddingVertical: espaciado.sm,
    paddingHorizontal: 6,
  },
  circuloUtensilio: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  nombreUtensilio: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.texto,
    textAlign: 'center',
  },
  estadoUtensilio: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
    color: colors.acentoIntenso,
    marginTop: 2,
  },
  paso: {
    flexDirection: 'row',
    gap: espaciado.sm,
    paddingHorizontal: espaciado.md,
  },
  numeroPaso: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.texto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoNumero: {
    fontFamily: fuentes.titulo,
    fontSize: tamanos.destacado,
    color: colors.superficie,
  },
  cuerpoPaso: {
    flex: 1,
    paddingTop: 4,
  },
  textoPaso: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 24,
    color: colors.texto,
  },
  temporizador: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: espaciado.xs,
    backgroundColor: colors.resaltadoSuave,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 3,
  },
  textoTemporizador: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.texto,
  },
  separador: {
    height: 1,
    backgroundColor: colors.borde,
    marginLeft: espaciado.md + 32 + espaciado.sm,
    marginRight: espaciado.md,
    marginVertical: espaciado.md,
  },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.superficie,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    paddingBottom: espaciado.md,
    shadowColor: colors.texto,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 12,
  },
  botonCocinar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
    minHeight: 52,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
  },
  textoCocinar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
  filaSecundaria: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginTop: espaciado.sm,
  },
  botonSecundario: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
  },
  textoSecundario: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.texto,
  },
});
