import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, espaciado } from '../theme/theme';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  children: React.ReactNode;
}

const ALTO_PANTALLA = Dimensions.get('window').height;

export function HojaInferior({ visible, onCerrar, children }: Props) {
  const insets = useSafeAreaInsets();
  const posicion = useRef(new Animated.Value(ALTO_PANTALLA)).current;

  useEffect(() => {
    if (!visible) return;
    posicion.setValue(ALTO_PANTALLA);
    Animated.spring(posicion, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 3,
      speed: 14,
    }).start();
  }, [visible, posicion]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={estilos.contenedor}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={estilos.velo} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <Animated.View
          style={[
            estilos.hoja,
            { paddingBottom: insets.bottom + espaciado.md, transform: [{ translateY: posicion }] },
          ]}
        >
          <View style={estilos.asa} />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  velo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.velo,
  },
  hoja: {
    backgroundColor: colors.fondo,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: espaciado.md,
    paddingTop: espaciado.sm,
    maxHeight: '90%',
  },
  asa: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borde,
    alignSelf: 'center',
    marginBottom: espaciado.md,
  },
});