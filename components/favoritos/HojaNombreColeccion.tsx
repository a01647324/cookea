import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  visible: boolean;
  titulo: string;
  textoBoton: string;
  nombreInicial?: string;
  guardando: boolean;
  error?: string | null;
  onGuardar: (nombre: string) => void;
  onCerrar: () => void;
}

export function HojaNombreColeccion({
  visible,
  titulo,
  textoBoton,
  nombreInicial = '',
  guardando,
  error,
  onGuardar,
  onCerrar,
}: Props) {
  const [nombre, setNombre] = useState(nombreInicial);
  const campo = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    setNombre(nombreInicial);
    const espera = setTimeout(() => campo.current?.focus(), 350);
    return () => clearTimeout(espera);
  }, [visible, nombreInicial]);

  const vacio = nombre.trim().length === 0;

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.circulo}>
        <Icono nombre="add-folder-linear" size={28} color={colors.calidoIntenso} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>

      <TextInput
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Desayunos con avena"
        placeholderTextColor={colors.textoTenue}
        style={estilos.input}
        maxLength={40}
        ref={campo}
        autoComplete="off"
        importantForAutofill="no"
        returnKeyType="done"
        onSubmitEditing={() => !vacio && onGuardar(nombre)}
      />
      <Text style={estilos.contador}>{nombre.length}/40</Text>

      {!!error && <Text style={estilos.error}>{error}</Text>}

      <View style={estilos.botones}>
        <Pressable onPress={onCerrar} style={[estilos.boton, estilos.cancelar]}>
          <Text style={estilos.textoCancelar}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={() => onGuardar(nombre)}
          disabled={vacio || guardando}
          style={[estilos.boton, estilos.guardar, (vacio || guardando) && { opacity: 0.5 }]}
        >
          {guardando ? (
            <ActivityIndicator color={colors.sobreEncabezado} />
          ) : (
            <Text style={estilos.textoGuardar}>{textoBoton}</Text>
          )}
        </Pressable>
      </View>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.sm,
    marginBottom: espaciado.md,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: espaciado.md,
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  contador: {
    alignSelf: 'flex-end',
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    color: colors.textoTenue,
    marginTop: 4,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  botones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginTop: espaciado.md,
  },
  boton: {
    flex: 1,
    minHeight: 52,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelar: {
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  guardar: {
    backgroundColor: colors.encabezado,
  },
  textoCancelar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  textoGuardar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.sobreEncabezado,
  },
});
