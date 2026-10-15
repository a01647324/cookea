import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono, { NombreIcono } from '../components/Icono';
import { colors, fuentes, tamanos } from '../theme/theme';

const ICONOS: Record<string, NombreIcono> = {
  Recetas: 'notebook-linear',
  Alacena: 'box-linear',
  Inicio: 'home-2-linear',
  Comunidad: 'users-group-rounded-linear',
  Cuenta: 'user-circle-linear',
};

// Accesos directos: "Recetas" y "Alacena" abren pantallas que viven en la pila de Inicio
const DESTINOS: Record<string, string> = {
  Recetas: 'Recetario',
  Alacena: 'Alacena',
  Inicio: 'Home',
};

// Qué botón se ve activo según la pantalla abierta dentro de Inicio
function activaDeInicio(pantalla: string) {
  if (pantalla === 'Recetario') return 'Recetas';
  if (pantalla === 'Alacena' || pantalla === 'QueCocino') return 'Alacena';
  return 'Inicio';
}

export default function BarraPestanas({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [tecladoAbierto, setTecladoAbierto] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const mostrar = Keyboard.addListener('keyboardDidShow', () => setTecladoAbierto(true));
    const ocultar = Keyboard.addListener('keyboardDidHide', () => setTecladoAbierto(false));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);

  const opcionesActivas = descriptors[state.routes[state.index].key].options;
  const ocultaPorPantalla = (opcionesActivas.tabBarStyle as { display?: string } | undefined)?.display === 'none';

  if (tecladoAbierto || ocultaPorPantalla) return null;

  const rutaActual = state.routes[state.index];
  const activa =
    rutaActual.name === 'Inicio'
      ? activaDeInicio(getFocusedRouteNameFromRoute(rutaActual) ?? 'Home')
      : rutaActual.name;

  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(insets.bottom, espacioInferior) }]}>
      {state.routes.map((ruta, indice) => {
        const enfocada = activa === ruta.name;
        const { options } = descriptors[ruta.key];
        const etiqueta = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : ruta.name;
        const icono = ICONOS[ruta.name] ?? 'home-2-linear';

        const alPresionar = () => {
          const evento = navigation.emit({
            type: 'tabPress',
            target: ruta.key,
            canPreventDefault: true,
          });
          if (enfocada || evento.defaultPrevented) return;
          const pantalla = DESTINOS[ruta.name];
          if (pantalla) navigation.navigate('Inicio', { screen: pantalla });
          else navigation.navigate(ruta.name, ruta.params);
        };

        return (
          <Pressable
            key={ruta.key}
            onPress={alPresionar}
            style={estilos.pestana}
            accessibilityRole="tab"
            accessibilityState={{ selected: enfocada }}
            accessibilityLabel={etiqueta}
          >
            {enfocada ? (
              <View style={estilos.activa}>
                <View style={estilos.circulo}>
                  <Icono nombre={icono} size={28} color={colors.acentoOscuro} />
                </View>
                <Text style={estilos.etiqueta}>{etiqueta}</Text>
              </View>
            ) : (
              <Icono nombre={icono} size={27} color={colors.textoTenue} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const espacioInferior = 10;

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: colors.superficie,
    paddingTop: 12,
    shadowColor: colors.texto,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  activa: {
    alignItems: 'center',
    marginTop: -34,
  },
  circulo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.texto,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 12,
  },
  etiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.chico,
    letterSpacing: 0.3,
    color: colors.acentoOscuro,
    marginTop: 2,
  },
});
