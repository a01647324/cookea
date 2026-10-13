import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";
import { colors } from "../theme/theme";
import { Ionicons } from '@expo/vector-icons';

// Pantallas de la pestaña "Inicio"
import { AlacenaScreen } from "../screens/AlacenaScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { RecetarioScreen } from "../screens/RecetarioScreen";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { WeekPlanScreen } from "../screens/WeekPlanScreen";
import { ModoCocinaScreen } from '../screens/ModoCocinaScreen';
import Alergias from "../screens/alergias";
import PersonalizaScreen from "../perfil/PersonalizaScreen";

// Pantallas de la pestaña "Cuenta"
import PerfilScreen from "../perfil/PerfilScreen";
import EditarPerfilScreen from "../perfil/EditarPerfilScreen";
import PreferenciasScreen from "../perfil/PreferenciasScreen";
import CambiarContrasenaScreen from "../auth/CambiarContrasenaScreen";

// BARRA: qué pantallas tiene cada pestaña y qué parámetros recibe cada una.
// (Antes estaban en RootStackParamList de App.tsx.)
export type InicioParamList = {
  Home: undefined;
  Recetario: { busquedaInicial?: string } | undefined;
  RecetaDetalle: { recetaId: number };
  Alergias: undefined;
  ModoCocina: {
    recetaId: number;
    porciones?: number;
  };
  TuSemana: { fechaInicial?: string } | undefined;
  Personaliza: undefined;
  Alacena: undefined;           
};

export type CuentaParamList = {
  Perfil: undefined;
  EditarPerfil: undefined;
  Preferencias: undefined;
  CambiarContrasena: undefined;
};

// BARRA: las pestañas de la barra
export type BarraParamList = {
  Inicio: NavigatorScreenParams<InicioParamList> | undefined;
  Cuenta: NavigatorScreenParams<CuentaParamList> | undefined;
};

// (nuevo) Cada pestaña tiene su propio Stack. Así, al abrir Recetario o una
// receta desde la Home, la pantalla se apila DENTRO de la pestaña "Inicio" y
// la barra sigue visible abajo. Cada pestaña recuerda en qué pantalla se quedó.
const InicioStack = createNativeStackNavigator<InicioParamList>();
const CuentaStack = createNativeStackNavigator<CuentaParamList>();
const Tab = createBottomTabNavigator<BarraParamList>();

// (clase) headerShown:false porque cada pantalla dibuja su propio encabezado
function PestanaInicio() {
  return (
    <InicioStack.Navigator screenOptions={{ headerShown: false }}>
      <InicioStack.Screen name="Home" component={HomeScreen} />
      <InicioStack.Screen name="Recetario" component={RecetarioScreen} />
      <InicioStack.Screen name="RecetaDetalle" component={RecipeDetailScreen} />
      <InicioStack.Screen name="Alacena" component={AlacenaScreen} />
      {/* Alergias sí lleva header nativo simple, porque su propio diseño
          no trae uno propio (usa un ActivityIndicator/ScrollView plano). */}
      <InicioStack.Screen
        name="ModoCocina"
        component={ModoCocinaScreen}
      />
      <InicioStack.Screen
        name="Alergias"
        component={Alergias}
        options={{ headerShown: true, title: "Alergias" }}
      />
      <InicioStack.Screen name="TuSemana" component={WeekPlanScreen} />
      {/* PERFIL: se abre desde la tarjeta de la Home */}
      <InicioStack.Screen name="Personaliza" component={PersonalizaScreen} />
    </InicioStack.Navigator>
  );
}

function PestanaCuenta() {
  return (
    <CuentaStack.Navigator screenOptions={{ headerShown: false }}>
      <CuentaStack.Screen name="Perfil" component={PerfilScreen} />
      <CuentaStack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
      <CuentaStack.Screen name="Preferencias" component={PreferenciasScreen} />
      <CuentaStack.Screen name="CambiarContrasena" component={CambiarContrasenaScreen} />
    </CuentaStack.Navigator>
  );
}

// BarraInferior: es la única pantalla de App.tsx cuando hay sesión.
// Dentro de una pestaña se navega igual que antes:
// navigation.navigate("Recetario") desde la Home.
//
// BARRA: cómo agregar una pestaña nueva (por ejemplo "Favoritos"):
//   1. Si la pestaña tendrá varias pantallas, crea su Stack igual que
//      PestanaInicio: un tipo FavoritosParamList, un
//      createNativeStackNavigator<FavoritosParamList>() y una función
//      PestanaFavoritos con sus <Stack.Screen>. Si es una sola pantalla,
//      puedes usar la pantalla directamente.
//   2. Agrega su nombre en BarraParamList:
//        Favoritos: NavigatorScreenParams<FavoritosParamList> | undefined;
//   3. Agrega un <Tab.Screen> abajo, en el orden en que debe aparecer:
//        <Tab.Screen name="Favoritos" component={PestanaFavoritos} />
//   4. Si quieres ícono, agrega en options:
//        tabBarIcon: ({ color, size }) => (
//          <Image source={require("../assets/images/icons/heart.png")}
//                 style={{ width: size, height: size, tintColor: color }} />
//        ),
//      y quita tabBarIconStyle de screenOptions, que ahora oculta los íconos.
//   5. Si la pantalla ya estaba en el Stack de otra pestaña (por ejemplo,
//      Recetario en PestanaInicio), quítala de ahí para que no esté repetida.
export default function BarraInferior() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: colors.olivaOscuro,
        tabBarInactiveTintColor: colors.textoSecundario,

        tabBarIcon: ({ color, size }) => {
          const nombreIcono =
            route.name === 'Inicio'
              ? 'home-outline'
              : 'person-outline';

          return (
            <Ionicons
              name={nombreIcono}
              size={size}
              color={color}
            />
          );
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.background,
          paddingTop: 5,
        },

        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={PestanaInicio}
      />

      <Tab.Screen
        name="Cuenta"
        component={PestanaCuenta}
      />
    </Tab.Navigator>
  );
}