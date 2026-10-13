import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fuentes, tamanos } from '../theme/theme';

type NombreIcono = keyof typeof Ionicons.glyphMap;

const ICONOS: Record<string, [NombreIcono, NombreIcono]> = {
  Recetas: ['book', 'book-outline'],
  Alacena: ['file-tray-full', 'file-tray-full-outline'],
  Inicio: ['home', 'home-outline'],
  Comunidad: ['people', 'people-outline'],
  Cuenta: ['person-circle', 'person-circle-outline'],
};

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

  return (
    <View style={[estilos.barra, { paddingBottom: Math.max(insets.bottom, espacioInferior) }]}>
      {state.routes.map((ruta, indice) => {
        const enfocada = state.index === indice;
        const { options } = descriptors[ruta.key];
        const etiqueta =
          typeof options.tabBarLabel === 'string' ? options.tabBarLabel : ruta.name;
        const [iconoActivo, iconoInactivo] = ICONOS[ruta.name] ?? ['ellipse', 'ellipse-outline'];

        const alPresionar = () => {
          const evento = navigation.emit({
            type: 'tabPress',
            target: ruta.key,
            canPreventDefault: true,
          });
          if (!enfocada && !evento.defaultPrevented) {
            navigation.navigate(ruta.name, ruta.params);
          }
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
                  <Ionicons name={iconoActivo} size={28} color={colors.acento} />
                </View>
                <Text style={estilos.etiqueta}>{etiqueta}</Text>
              </View>
            ) : (
              <Ionicons name={iconoInactivo} size={27} color={colors.textoTenue} />
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