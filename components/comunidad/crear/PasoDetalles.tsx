import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icono, { NombreIcono } from '../../Icono';
import { Catalogo, FormularioReceta, REGEX_YOUTUBE } from '../../../hooks/useCrearReceta';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../../theme/theme';

interface Props {
  form: FormularioReceta;
  actualizar: (cambios: Partial<FormularioReceta>) => void;
  etiquetas: Catalogo[];
  electrodomesticos: Catalogo[];
  alias: string;
  pedirConsentimiento: boolean;
  acepto: boolean;
  onAceptar: (valor: boolean) => void;
}

const ICONOS: Record<string, NombreIcono> = {
  Estufa: 'fire-linear',
  Horno: 'oven-mitts-linear',
  Licuadora: 'bottle-linear',
  Microondas: 'monitor-linear',
  'Olla de presión': 'stopwatch-linear',
  Refrigerador: 'fridge-linear',
};

const alternar = (lista: number[], id: number) =>
  lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];

export function PasoDetalles({
  form,
  actualizar,
  etiquetas,
  electrodomesticos,
  alias,
  pedirConsentimiento,
  acepto,
  onAceptar,
}: Props) {
  const videoInvalido = form.video.trim() !== '' && !REGEX_YOUTUBE.test(form.video.trim());

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.seccion}>
        <Text style={estilos.etiqueta}>¿Qué tipo de receta es?</Text>
        <View style={estilos.filaChips}>
          {etiquetas.map((e) => {
            const activa = form.etiquetas.includes(e.id);
            return (
              <Pressable
                key={e.id}
                onPress={() => actualizar({ etiquetas: alternar(form.etiquetas, e.id) })}
                style={[estilos.chip, activa && estilos.chipActivo]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activa }}
              >
                {activa && <Icono nombre="check-linear" size={15} color={colors.sobreAcento} />}
                <Text style={[estilos.textoChip, activa && estilos.textoChipActivo]}>{e.nombre}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={estilos.seccion}>
        <Text style={estilos.etiqueta}>¿Qué se necesita en la cocina?</Text>
        <View style={estilos.filaHerramientas}>
          {electrodomesticos.map((e) => {
            const activo = form.electrodomesticos.includes(e.id);
            return (
              <Pressable
                key={e.id}
                onPress={() => actualizar({ electrodomesticos: alternar(form.electrodomesticos, e.id) })}
                style={[estilos.herramienta, activo && estilos.herramientaActiva]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: activo }}
              >
                <Icono
                  nombre={ICONOS[e.nombre] ?? 'chef-hat-linear'}
                  size={24}
                  color={activo ? colors.primario : colors.textoSuave}
                />
                <Text style={[estilos.textoHerramienta, activo && { color: colors.primario }]} numberOfLines={2}>
                  {e.nombre}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={estilos.seccion}>
        <Text style={estilos.etiqueta}>
          Video de YouTube <Text style={tipografia.chico}>(opcional)</Text>
        </Text>
        <View style={[estilos.campoVideo, videoInvalido && { borderColor: colors.peligroBorde }]}>
          <Icono nombre="play-circle-linear" size={20} color={colors.destacadoIntenso} />
          <TextInput
            style={estilos.inputVideo}
            value={form.video}
            onChangeText={(video) => actualizar({ video })}
            placeholder="https://youtu.be/…"
            placeholderTextColor={colors.textoSuave}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            autoComplete="off"
            importantForAutofill="no"
          />
        </View>
        {videoInvalido && (
          <Text style={estilos.error}>Solo se aceptan enlaces de YouTube (youtube.com o youtu.be).</Text>
        )}
      </View>

      {pedirConsentimiento && (
        <Pressable
          onPress={() => onAceptar(!acepto)}
          style={estilos.consentimiento}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acepto }}
        >
          <View style={[estilos.casilla, acepto && estilos.casillaMarcada]}>
            {acepto && <Icono nombre="check-linear" size={17} color={colors.sobrePrimario} />}
          </View>
          <Text style={estilos.textoConsentimiento}>
            Entiendo que mi receta será pública y se mostrará con mi alias{' '}
            <Text style={{ fontFamily: fuentes.negrita }}>{alias}</Text>, nunca con mi nombre.
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: espaciado.lg,
  },
  seccion: {
    gap: espaciado.sm,
  },
  etiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  filaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.acento,
    borderRadius: radios.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActivo: {
    backgroundColor: colors.acento,
  },
  textoChip: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.acentoOscuro,
  },
  textoChipActivo: {
    color: colors.sobreAcento,
  },
  filaHerramientas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
  },
  herramienta: {
    width: 88,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radios.md,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  herramientaActiva: {
    borderColor: colors.primario,
    backgroundColor: colors.serenoSuave,
  },
  textoHerramienta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
    textAlign: 'center',
  },
  campoVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputVideo: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  error: {
    ...tipografia.chico,
    color: colors.peligro,
  },
  consentimiento: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 14,
  },
  casilla: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: {
    backgroundColor: colors.primario,
  },
  textoConsentimiento: {
    ...tipografia.cuerpo,
    flex: 1,
    fontSize: tamanos.base,
    lineHeight: 21,
  },
});