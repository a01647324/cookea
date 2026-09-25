import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Alert, Image, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useUserProfile } from '../hooks/useUserProfile';
import { useWeekPlan } from '../hooks/useWeekPlan';
import { useFeaturedRecipes } from '../hooks/useFeaturedRecipes';
import { SearchBar } from '../components/SearchBar';
import { WeekPlanSection } from '../components/WeekPlanSection';
import { QuickAccessGrid } from '../components/QuickAccessGrid';
import { TipBanner } from '../components/TipBanner';
import { RecipeCard } from '../components/RecipeCard';
import { VistaCargando, VistaError } from '../components/StateViews';
import { colors, coloresTarjetaReceta, espaciado, tipografia } from '../theme/theme';
// AUTH: botón y función para cerrar sesión (temporal, para probar login/registro)
import { Pressable } from 'react-native';
import { radios } from '../theme/theme';
import useSession from '../auth/useSession';

/**
 * HomeScreen
 *
 *Combina cuatro hooks, cada uno responsable de un pedazo de datos:
 *   - useUserProfile     -> alias para el saludo
 *   - useWeekPlan        -> tarjetas de "Tu semana"
 *   - useFeaturedRecipes -> carrusel de abajo
 *  todavía le flatan pantallas porque no las hemos ehcho jiji ;) :)
 */
export function HomeScreen() {
  const navigation = useNavigation<any>();
  // AUTH: cerrarSesion viene del hook useSession
  const { cerrarSesion } = useSession();

  const { perfil, cargando: cargandoPerfil } = useUserProfile();
  const { dias, cargando: cargandoPlan, error: errorPlan, recargar: recargarPlan } = useWeekPlan(2);
  const {
    recetas: destacadas,
    cargando: cargandoDestacadas,
    error: errorDestacadas,
    recargar: recargarDestacadas,
  } = useFeaturedRecipes(6);

  const [refrescando, setRefrescando] = React.useState(false);

  async function alJalarParaRefrescar() {
    setRefrescando(true);
    await Promise.all([recargarPlan(), recargarDestacadas()]);
    setRefrescando(false);
  }

  const accesos = [
    {
      clave: 'recetas',
      titulo: 'Recetas',
      subtitulo: 'Busca recetas',
      color: coloresTarjetaReceta[0],
  
      icono: require('../assets/images/icons/recipe-book.png'),
  
      onPress: () => navigation.navigate('Recetario'),
    },
  
    {
      clave: 'alacena',
      titulo: 'Alacena',
      subtitulo: 'Observa lo que tienes',
      color: coloresTarjetaReceta[1],
  
      icono: require('../assets/images/icons/cupboard.png'),
  
      onPress: () =>
        Alert.alert(
          'Próximamente',
          'La Alacena está en construcción.'
        ),
    },
  
    {
      clave: 'favoritos',
      titulo: 'Favoritos',
      subtitulo: 'Mira tus recetas favoritas',
      color: coloresTarjetaReceta[2],
  
      icono: require('../assets/images/icons/heart.png'),
  
      onPress: () =>
        Alert.alert(
          'Próximamente',
          'Favoritos está en construcción.'
        ),
    },
  
    {
      clave: 'comunidad',
      titulo: 'Comunidad',
      subtitulo: 'Comparte tus recetas',
      color: colors.olivaOscuro,
  
      icono: require('../assets/images/icons/group.png'),
  
      onPress: () =>
        Alert.alert(
          'Próximamente',
          'Comunidad está en construcción.'
        ),
    },
  
    {
      clave: 'alergias',
      titulo: 'Alergias',
      subtitulo: 'Configura tus alergias',
      color: colors.olivaOscuro,
  
      icono: require('../assets/images/icons/allergy.png'),
  
      onPress: () => navigation.navigate('Alergias'),
    },
  ];

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={alJalarParaRefrescar} />}
      >
        <View style={estilos.header}>
        <Image 
          source={require('../assets/images/cookea-logo.png')}
          style={estilos.logo}
          resizeMode="contain"/>

          {/* AUTH: botón para cerrar sesión en la esquina superior derecha;
              App.tsx regresa solo al Login */}
          {/* Pressable en vez de Button porque Button no deja cambiar el
              tamaño ni el estilo de la letra */}
          <Pressable
            onPress={cerrarSesion}
            style={({ pressed }) => [estilos.botonCerrarSesion, pressed && { opacity: 0.6 }]}
          >
            <Text style={estilos.textoCerrarSesion}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={estilos.buscadorContenedor}>
          <SearchBar
            placeholder="Buscar"
            onBuscar={(texto) => {
              if (texto.trim().length > 0) {
                navigation.navigate('Recetario', { busquedaInicial: texto });
              }
            }}
          />
        </View>

        <View style={estilos.saludoContenedor}>
          <Text style={tipografia.titulo}>
            {cargandoPerfil ? '¡Bienvenid@!' : `¡Bienvenid@, ${perfil?.alias ?? 'usuario'}!`}
          </Text>
        </View>

        {cargandoPlan ? (
          <VistaCargando mensaje="Cargando tu semana..." />
        ) : errorPlan ? (
          <VistaError mensaje={errorPlan} onReintentar={recargarPlan} />
        ) : (
          <WeekPlanSection
            dias={dias}
            onVerSemana={() => Alert.alert('Próximamente', 'La vista de semana completa está en construcción.')}
            onAgregar={() => navigation.navigate('Recetario')}
          />
        )}

        <View style={{ marginTop: espaciado.lg }}>
          <QuickAccessGrid accesos={accesos} />
        </View>

        <TipBanner />

        <View style={estilos.seccionDestacadas}>
          <Text style={tipografia.subtitulo}>Recomendadas para ti</Text>
          {cargandoDestacadas ? (
            <VistaCargando />
          ) : errorDestacadas ? (
            <VistaError mensaje={errorDestacadas} onReintentar={recargarDestacadas} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: espaciado.sm }}>
              {destacadas.map((receta, indice) => (
                <RecipeCard
                  key={receta.id}
                  receta={receta}
                  variante="carrusel"
                  colorFondo={coloresTarjetaReceta[indice % coloresTarjetaReceta.length]}
                  onPress={() => navigation.navigate('RecetaDetalle', { recetaId: receta.id })}
                />
              ))}
            </ScrollView>
          )}
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
  header: {
    alignItems: 'center',
    justifyContent: 'center',
  
    paddingTop: 10,
    paddingBottom: 10,
  
    minHeight: 65,
  },
  
  logo: {
    width: 155,
    height: 45,
  },

  // AUTH: coloca el botón de cerrar sesión a la derecha del header,
  // sin mover el logo del centro
  botonCerrarSesion: {
    position: 'absolute',
    right: espaciado.md,
    top: espaciado.sm,
    paddingVertical: espaciado.xs,
    paddingHorizontal: espaciado.sm,
    borderWidth: 1,
    borderColor: colors.vino,
    borderRadius: radios.pill,
  },
  textoCerrarSesion: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.vino,
  },
  buscadorContenedor: {
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.md,
  },
  saludoContenedor: {
    paddingHorizontal: espaciado.md,
    marginVertical: espaciado.md,
  },
  seccionDestacadas: {
    paddingHorizontal: espaciado.md,
    marginTop: espaciado.lg,
    marginBottom: espaciado.xl,
  },
});