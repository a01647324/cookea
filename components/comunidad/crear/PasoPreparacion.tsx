import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icono from '../../Icono';
import { FormularioReceta, PasoForm, nuevaClave } from '../../../hooks/useCrearReceta';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../../theme/theme';

interface Props {
  form: FormularioReceta;
  actualizar: (cambios: Partial<FormularioReceta>) => void;
}

const MAX_PASOS = 30;

export function PasoPreparacion({ form, actualizar }: Props) {
  const pasos = form.pasos;

  const cambiar = (indice: number, cambios: Partial<PasoForm>) =>
    actualizar({ pasos: pasos.map((p, i) => (i === indice ? { ...p, ...cambios } : p)) });

  const mover = (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= pasos.length) return;
    const copia = [...pasos];
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
    actualizar({ pasos: copia });
  };

  const quitar = (indice: number) => actualizar({ pasos: pasos.filter((_, i) => i !== indice) });

  const agregar = () => actualizar({ pasos: [...pasos, { clave: nuevaClave(), texto: '', minutos: null }] });

  const cambiarMinutos = (indice: number, actual: number, delta: number) => {
    const paso = actual + delta <= 10 ? 1 : 5;
    const siguiente = Math.min(600, Math.max(1, actual + (delta > 0 ? paso : -paso)));
    cambiar(indice, { minutos: siguiente });
  };

  return (
    <View style={estilos.contenedor}>
      {pasos.map((paso, indice) => (
        <View key={paso.clave} style={estilos.tarjeta}>
          <View style={estilos.numero}>
            <Text style={estilos.textoNumero}>{indice + 1}</Text>
          </View>

          <View style={{ flex: 1, gap: espaciado.sm }}>
            <TextInput
              style={estilos.input}
              value={paso.texto}
              onChangeText={(texto) => cambiar(indice, { texto })}
              placeholder={indice === 0 ? 'Ej. Remoja el frijol desde la noche anterior.' : 'Describe este paso'}
              placeholderTextColor={colors.textoSuave}
              maxLength={1000}
              multiline
              autoComplete="off"
              importantForAutofill="no"
            />

            {paso.minutos == null ? (
              <Pressable onPress={() => cambiar(indice, { minutos: 5 })} style={estilos.chipTiempo} accessibilityRole="button">
                <Icono nombre="alarm-linear" size={14} color={colors.textoSuave} />
                <Text style={estilos.textoChip}>Temporizador</Text>
              </Pressable>
            ) : (
              <View style={[estilos.chipTiempo, estilos.chipActivo]}>
                <Pressable onPress={() => cambiarMinutos(indice, paso.minutos!, -1)} hitSlop={8} accessibilityLabel="Menos minutos">
                  <Icono nombre="minus-linear" size={16} color={colors.textoSuave} />
                </Pressable>
                <Icono nombre="alarm-linear" size={14} color={colors.textoSuave} />
                <Text style={estilos.textoChip}>{paso.minutos} min</Text>
                <Pressable onPress={() => cambiarMinutos(indice, paso.minutos!, 1)} hitSlop={8} accessibilityLabel="Más minutos">
                  <Icono nombre="add-linear" size={16} color={colors.textoSuave} />
                </Pressable>
                <Pressable onPress={() => cambiar(indice, { minutos: null })} hitSlop={8} accessibilityLabel="Quitar temporizador">
                  <Icono nombre="close-linear" size={16} color={colors.textoSuave} />
                </Pressable>
              </View>
            )}
          </View>

          <View style={estilos.acciones}>
            <Pressable onPress={() => mover(indice, -1)} disabled={indice === 0} hitSlop={6} accessibilityLabel="Subir paso">
              <Icono nombre="alt-arrow-up-linear" size={20} color={indice === 0 ? colors.textoTenue : colors.textoSuave} />
            </Pressable>
            <Pressable
              onPress={() => mover(indice, 1)}
              disabled={indice === pasos.length - 1}
              hitSlop={6}
              accessibilityLabel="Bajar paso"
            >
              <Icono
                nombre="alt-arrow-down-linear"
                size={20}
                color={indice === pasos.length - 1 ? colors.textoTenue : colors.textoSuave}
              />
            </Pressable>
            {pasos.length > 1 && (
              <Pressable onPress={() => quitar(indice)} hitSlop={6} accessibilityLabel="Quitar paso">
                <Icono nombre="trash-bin-trash-linear" size={18} color={colors.textoSuave} />
              </Pressable>
            )}
          </View>
        </View>
      ))}

      {pasos.length < MAX_PASOS && (
        <Pressable onPress={agregar} style={estilos.botonAgregar} accessibilityRole="button">
          <Icono nombre="add-linear" size={20} color={colors.primario} />
          <Text style={estilos.textoAgregar}>Agregar paso</Text>
        </Pressable>
      )}

    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 12,
  },
  tarjeta: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 14,
  },
  numero: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoNumero: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.sobrePrimario,
  },
  input: {
    ...tipografia.cuerpo,
    minHeight: 48,
    paddingVertical: 4,
    textAlignVertical: 'top',
  },
  chipTiempo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.neutro,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActivo: {
    backgroundColor: colors.calidoSuave,
    borderColor: colors.calido,
    gap: 10,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  acciones: {
    alignItems: 'center',
    gap: 10,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primario,
    borderRadius: radios.md,
  },
  textoAgregar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
});