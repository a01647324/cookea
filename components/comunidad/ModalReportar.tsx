import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Icono, { NombreIcono } from '../Icono';
import { HojaInferior } from '../HojaInferior';
import { EstadoEnvio } from './EstadoEnvio';
import { MAX_DETALLE_REPORTE, MotivoReporte, useReporte } from '../../hooks/useReporte';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../theme/theme';

interface Props {
  visible: boolean;
  recetaId: number;
  onCerrar: () => void;
}

const MOTIVOS: { valor: MotivoReporte; texto: string; icono: NombreIcono }[] = [
  { valor: 'contenido_inapropiado', texto: 'Contenido inapropiado', icono: 'sad-circle-linear' },
  { valor: 'informacion_peligrosa', texto: 'Información peligrosa', icono: 'fire-linear' },
  { valor: 'alergenos_incorrectos', texto: 'Alérgenos incorrectos', icono: 'danger-triangle-linear' },
  { valor: 'spam', texto: 'Spam', icono: 'mailbox-linear' },
  { valor: 'otro', texto: 'Otro', icono: 'menu-dots-linear' },
];

type Fase = 'formulario' | 'exito' | 'repetido' | 'error';

export function ModalReportar({ visible, recetaId, onCerrar }: Props) {
  const { enviando, reportar } = useReporte(recetaId);
  const [motivo, setMotivo] = useState<MotivoReporte | null>(null);
  const [detalle, setDetalle] = useState('');
  const [fase, setFase] = useState<Fase>('formulario');

  useEffect(() => {
    if (!visible) return;
    setFase('formulario');
    setMotivo(null);
    setDetalle('');
  }, [visible]);

  const alReportar = async () => {
    if (!motivo) return;
    const resultado = await reportar(motivo, detalle);
    setFase(resultado === 'ok' ? 'exito' : resultado);
  };

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      {fase === 'exito' ? (
        <EstadoEnvio
          tipo="exito"
          titulo="Gracias, lo revisaremos"
          mensaje="Tu reporte es anónimo. Si varias personas reportan esta receta, se ocultará mientras la revisamos."
          onCerrar={onCerrar}
        />
      ) : fase === 'repetido' ? (
        <EstadoEnvio
          tipo="aviso"
          titulo="Ya la habías reportado"
          mensaje="Solo se puede reportar una vez cada receta. Gracias por avisarnos."
          onCerrar={onCerrar}
        />
      ) : fase === 'error' ? (
        <EstadoEnvio
          tipo="error"
          titulo="No se pudo enviar"
          mensaje="Revisa tu conexión a internet e intenta de nuevo."
          onCerrar={onCerrar}
          onReintentar={alReportar}
        />
      ) : (
        <View style={estilos.contenido}>
          <View style={estilos.halo}>
            <Icono nombre="flag-linear" size={28} color={colors.peligro} />
          </View>
          <Text style={estilos.titulo}>¿Qué está mal?</Text>
          <Text style={estilos.subtitulo}>Tu reporte es anónimo. Nos ayuda a cuidar a la comunidad.</Text>

          {MOTIVOS.map((m) => {
            const activo = motivo === m.valor;
            return (
              <Pressable
                key={m.valor}
                onPress={() => setMotivo(m.valor)}
                style={[estilos.opcion, activo && estilos.opcionActiva]}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
              >
                <View style={[estilos.iconoOpcion, activo && estilos.iconoActivo]}>
                  <Icono nombre={m.icono} size={19} color={activo ? colors.sobrePrimario : colors.calidoIntenso} />
                </View>
                <Text style={estilos.textoOpcion}>{m.texto}</Text>
                {activo && <Icono nombre="check-circle-bold" size={24} color={colors.primario} />}
              </Pressable>
            );
          })}

          {motivo === 'otro' && (
            <TextInput
              style={estilos.campo}
              placeholder="Cuéntanos brevemente qué pasa"
              placeholderTextColor={colors.textoSuave}
              value={detalle}
              onChangeText={setDetalle}
              maxLength={MAX_DETALLE_REPORTE}
              multiline
              textAlignVertical="top"
              autoComplete="off"
              importantForAutofill="no"
            />
          )}

          <View style={estilos.filaBotones}>
            <Pressable onPress={onCerrar} style={[estilos.boton, estilos.botonCancelar]}>
              <Text style={estilos.textoCancelar}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={alReportar}
              disabled={!motivo || enviando}
              style={[estilos.boton, estilos.botonReportar, (!motivo || enviando) && estilos.deshabilitado]}
            >
              {enviando ? (
                <ActivityIndicator color={colors.sobrePrimario} />
              ) : (
                <Text style={estilos.textoReportar}>Reportar</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: espaciado.sm,
  },
  halo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.peligroSuave,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  titulo: {
    ...tipografia.titulo,
    color: colors.primario,
    textAlign: 'center',
  },
  subtitulo: {
    ...tipografia.chico,
    fontSize: tamanos.base,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: espaciado.xs,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radios.md,
    paddingHorizontal: 14,
    minHeight: 58,
  },
  opcionActiva: {
    borderColor: colors.primario,
  },
  iconoOpcion: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoActivo: {
    backgroundColor: colors.primario,
  },
  textoOpcion: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  campo: {
    ...tipografia.cuerpo,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    padding: 12,
    minHeight: 70,
  },
  filaBotones: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginTop: espaciado.sm,
  },
  boton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: radios.pill,
  },
  botonCancelar: {
    borderWidth: 1.5,
    borderColor: colors.primario,
  },
  botonReportar: {
    backgroundColor: colors.peligro,
  },
  deshabilitado: {
    opacity: 0.45,
  },
  textoCancelar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
  textoReportar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
});