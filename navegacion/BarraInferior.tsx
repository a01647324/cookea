import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigatorScreenParams } from "@react-navigation/native";
import { Alert } from "react-native";
import BarraPestanas from "./BarraPestanas";

// Pantallas de la pestaña "Inicio"
import { AlacenaScreen } from "../screens/AlacenaScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { RecetarioScreen } from "../screens/RecetarioScreen";
import { RecipeDetailScreen } from "../screens/RecipeDetailScreen";
import { WeekPlanScreen } from "../screens/WeekPlanScreen";
import { ModoCocinaScreen } from '../screens/ModoCocinaScreen';
import Alergias from "../screens/alergias";
import PersonalizaScreen from "../perfil/PersonalizaScreen";

// Pantallas de la pestaña "Comunidad"
import ComunidadScreen from "../screens/ComunidadScreen";
import DetalleComunidadScreen from "../screens/DetalleComunidadScreen";

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

export type ComunidadParamList = {
  ComunidadFeed: undefined;
  DetalleComunidad: { recetaId: number };
  ModoCocina: {
    recetaId: number;
    porciones?: number;
  };
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
  Comunidad: NavigatorScreenParams<ComunidadParamList> | undefined;
  Cuenta: NavigatorScreenParams<CuentaParamList> | undefined;
};

// (nuevo) Cada pestaña tiene su propio Stack. Así, al abrir Recetario o una
// receta desde la Home, la pantalla se apila DENTRO de la pestaña "Inicio" y
// la barra sigue visible abajo. Cada pestaña recuerda en qué pantalla se quedó.
const InicioStack = createNativeStackNavigator<InicioParamList>();
const ComunidadStack = createNativeStackNavigator<ComunidadParamList>();
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

function PestanaComunidad() {
  return (
    <ComunidadStack.Navigator screenOptions={{ headerShown: false }}>
      <ComunidadStack.Screen name="ComunidadFeed">
        {({ navigation }) => (
          <ComunidadScreen
            onAbrirReceta={(id) => navigation.navigate("DetalleComunidad", { recetaId: id })}
            onPublicar={() => Alert.alert("Próximamente", "Crear receta está en construcción.")}
            onMisPublicaciones={() =>
              Alert.alert("Próximamente", "Mis publicaciones está en construcción.")
            }
          />
        )}
      </ComunidadStack.Screen>
      <ComunidadStack.Screen name="DetalleComunidad">
        {({ navigation, route }) => (
          <DetalleComunidadScreen
            recetaId={route.params.recetaId}
            onVolver={() => navigation.goBack()}
            onCocinar={(porciones) =>
              navigation.navigate("ModoCocina", { recetaId: route.params.recetaId, porciones })
            }
            onEditar={() => Alert.alert("Próximamente", "Editar receta está en construcción.")}
            onAgregarSemana={() =>
              Alert.alert("Próximamente", "Agregar a mi semana está en construcción.")
            }
            onYaLaPrepare={() => Alert.alert("Próximamente", "Ya la preparé está en construcción.")}
          />
        )}
      </ComunidadStack.Screen>
      <ComunidadStack.Screen name="ModoCocina" component={ModoCocinaScreen} />
    </ComunidadStack.Navigator>
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
// La barra se dibuja con BarraPestanas.tsx (círculo elevado en la pestaña
// activa). Para agregar una pestaña: crea su Stack, agrégala a BarraParamList,
// agrega su <Tab.Screen> en orden y su ícono en ICONOS de BarraPestanas.tsx.
// Si la pantalla ya estaba en el Stack de otra pestaña, quítala de ahí.
export default function BarraInferior() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      tabBar={(props) => <BarraPestanas {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={PestanaInicio} />
      <Tab.Screen name="Comunidad" component={PestanaComunidad} />
      <Tab.Screen name="Cuenta" component={PestanaCuenta} options={{ tabBarLabel: "Perfil" }} />
    </Tab.Navigator>
  );
}