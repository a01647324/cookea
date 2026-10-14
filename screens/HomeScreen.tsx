import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Image, } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, } from '@react-navigation/native';
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
import TarjetaPersonaliza from '../perfil/TarjetaPersonaliza'; // PERFIL:

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

  // PERFIL: recargarPerfil para que el saludo muestre el alias nuevo
  // después de editarlo en Cuenta
  const { perfil, recargar: recargarPerfil } = useUserProfile();
  const {
    dias,
    cargando: cargandoPlan,
    error: errorPlan,
    recargar: recargarPlan
  } = useWeekPlan();
  
  useFocusEffect(
    React.useCallback(() => {
  
      recargarPlan();
      recargarPerfil(); // PERFIL: para que el saludo muestre el alias nuevo

    }, [recargarPlan, recargarPerfil])
  );
  const {
    recetas: destacadas,
    cargando: cargandoDestacadas,
    error: errorDestacadas,
    recargar: recargarDestacadas,
  } = useFeaturedRecipes(6);
  
  const [refrescando, setRefrescando] = React.useState(false);

  async function alJalarParaRefrescar() {
    setRefrescando(true);
    await Promise.all([
      recargarPlan(),
      recargarDestacadas(),
      recargarPerfil(),
    ]);
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
  
      onPress: () => navigation.navigate('Alacena'),
    },
  
    {
      clave: 'favoritos',
      titulo: 'Favoritos',
      subtitulo: 'Mira tus recetas favoritas',
      color: coloresTarjetaReceta[2],
    
      icono: require('../assets/images/icons/heart.png'),
    
      onPress: () => navigation.navigate('Favoritos'),
    },
  
    {
      clave: 'comunidad',
      titulo: 'Comunidad',
      subtitulo: 'Comparte tus recetas',
      color: colors.olivaOscuro,
      icono: require('../assets/images/icons/group.png'),
      onPress: () => navigation.navigate('Comunidad'),
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.contenidoScroll}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={alJalarParaRefrescar}
          />
        }
      >
        <View style={estilos.header}>
        <Image 
          source={require('../assets/images/cookea-logo.png')}
          style={estilos.logo}
          resizeMode="contain"/>
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
            {/* PERFIL: sin nombre solo cuando todavía no hay perfil; al
                recargar se sigue viendo el alias, así el saludo no parpadea */}
            {perfil === null ? '¡Bienvenid@!' : `¡Bienvenid@, ${perfil.alias}!`}
          </Text>
        </View>

        {/* PERFIL: invitación a Personaliza; se esconde sola cuando ya la
            contestó o tocó "Ahora no" */}
        <TarjetaPersonaliza />

        {cargandoPlan ? (
          <VistaCargando mensaje="Cargando tu semana..." />
        ) : errorPlan ? (
          <VistaError mensaje={errorPlan} onReintentar={recargarPlan} />
        ) : (
          <WeekPlanSection
            dias={dias}
            onVerSemana={() =>
              navigation.navigate(
                'TuSemana'
              )
            }
            onAgregar={(fecha) =>
              navigation.navigate(
                'TuSemana',
                {
                  fechaInicial: fecha,
                }
              )
            }
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
          ) : destacadas.length === 0 ? (
            <View style={estilos.sinRecomendaciones}>
              <Text style={estilos.textoSinRecomendaciones}>
                Todavía no hay recetas recomendadas disponibles.
              </Text>
              
            </View>
          ) : (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{
                  marginTop: espaciado.sm,
                  minHeight: 210,
                }}
              >
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

  contenidoScroll: {
    paddingBottom: espaciado.xl,
  },

  sinRecomendaciones: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: espaciado.md,
    marginTop: espaciado.sm,
  },

  textoSinRecomendaciones: {
    color: colors.textoPrincipal,
    fontSize: 14,
    textAlign: 'center',
  },
});