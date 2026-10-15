import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { formatearFechaLocal, inicioDeSemana, sumarDias, useWeeklyPlanner } from '../../hooks/useWeeklyPlanner';
import { mostrarAviso } from '../../lib/avisos';
import { MomentoComida } from '../../types/database';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  visible: boolean;
  recetaId: number;
  nombreReceta: string;
  onCerrar: () => void;
}

const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MOMENTOS: { valor: MomentoComida; texto: string }[] = [
  { valor: 'desayuno', texto: 'Desayuno' },
  { valor: 'comida', texto: 'Comida' },
  { valor: 'cena', texto: 'Cena' },
  { valor: 'bebida', texto: 'Bebida' },
];

export function HojaAgregarSemana({ visible, recetaId, nombreReceta, onCerrar }: Props) {
  const [hoy] = useState(() => new Date());
  const fechaHoy = formatearFechaLocal(hoy);
  const { items, guardarReceta, recargar } = useWeeklyPlanner(hoy);

  const [fecha, setFecha] = useState(fechaHoy);
  const [momento, setMomento] = useState<MomentoComida>('comida');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const semana = useMemo(() => {
    const lunes = inicioDeSemana(hoy);
    return Array.from({ length: 7 }, (_, i) => {
      const dia = sumarDias(lunes, i);
      return { fecha: formatearFechaLocal(dia), numero: dia.getDate(), letra: LETRAS[i] };
    });
  }, [hoy]);

  useEffect(() => {
    if (!visible) return;
    setFecha(fechaHoy);
    setMomento('comida');
    setError(null);
    recargar();
  }, [visible]);

  const ocupado =
    momento === 'bebida' ? null : items.find((i) => i.fecha === fecha && i.momento === momento) ?? null;

  async function agregar() {
    setGuardando(true);
    setError(null);
    const ok = await guardarReceta(fecha, momento, recetaId);
    setGuardando(false);
    if (ok) {
      onCerrar();
      mostrarAviso('Listo', `${nombreReceta} quedó en tu semana.`);
    } else {
      setError('No pudimos guardarla. Inténtalo de nuevo.');
    }
  }

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.contenido}>
        <View style={estilos.circulo}>
          <Icono nombre="calendar-add-linear" size={28} color={colors.serenoIntenso} />
        </View>
        <Text style={estilos.titulo}>Agregar a mi semana</Text>
        <Text style={estilos.subtitulo} numberOfLines={2}>
          {nombreReceta}
        </Text>

        <Text style={estilos.etiqueta}>¿Qué día?</Text>
        <View style={estilos.filaDias}>
          {semana.map((d) => {
            const pasado = d.fecha < fechaHoy;
            const elegido = d.fecha === fecha;
            return (
              <Pressable
                key={d.fecha}
                onPress={() => setFecha(d.fecha)}
                disabled={pasado}
                style={[estilos.dia, elegido && estilos.diaElegido, pasado && estilos.diaPasado]}
                accessibilityState={{ selected: elegido, disabled: pasado }}
              >
                <Text style={[estilos.letraDia, elegido && estilos.textoElegido]}>{d.letra}</Text>
                <Text style={[estilos.numeroDia, elegido && estilos.textoElegido]}>{d.numero}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={estilos.etiqueta}>¿Para qué momento?</Text>
        <View style={estilos.filaMomentos}>
          {MOMENTOS.map((m) => {
            const elegido = m.valor === momento;
            return (
              <Pressable
                key={m.valor}
                onPress={() => setMomento(m.valor)}
                style={[estilos.momento, elegido && estilos.momentoElegido]}
                accessibilityState={{ selected: elegido }}
              >
                <Text style={[estilos.textoMomento, elegido && estilos.textoElegido]}>{m.texto}</Text>
              </Pressable>
            );
          })}
        </View>

        {ocupado && (
          <View style={estilos.aviso}>
            <Icono nombre="danger-triangle-linear" size={18} color={colors.calidoOscuro} />
            <Text style={estilos.textoAviso}>
              Ya tienes {ocupado.recetas.nombre} en ese momento. La vamos a cambiar por esta.
            </Text>
          </View>
        )}

        {error && <Text style={estilos.error}>{error}</Text>}

        <Pressable onPress={agregar} disabled={guardando} style={estilos.boton}>
          {guardando ? (
            <ActivityIndicator color={colors.sobreEncabezado} />
          ) : (
            <Text style={estilos.textoBoton}>{ocupado ? 'Cambiar receta' : 'Agregar'}</Text>
          )}
        </Pressable>
      </View>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    paddingBottom: espaciado.sm,
  },
  circulo: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.serenoSuave,
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
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 2,
  },
  etiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    marginTop: espaciado.lg,
    marginBottom: espaciado.sm,
  },
  filaDias: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dia: {
    width: 42,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.superficie,
  },
  diaElegido: {
    backgroundColor: colors.encabezado,
  },
  diaPasado: {
    opacity: 0.35,
  },
  letraDia: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  numeroDia: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.grande,
    color: colors.texto,
    marginTop: 2,
  },
  textoElegido: {
    color: colors.sobreEncabezado,
  },
  filaMomentos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciado.sm,
  },
  momento: {
    paddingHorizontal: espaciado.md,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  momentoElegido: {
    backgroundColor: colors.encabezado,
    borderColor: colors.encabezado,
  },
  textoMomento: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  aviso: {
    flexDirection: 'row',
    gap: espaciado.sm,
    backgroundColor: colors.calidoSuave,
    borderRadius: radios.md,
    padding: espaciado.sm,
    marginTop: espaciado.md,
  },
  textoAviso: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.calidoOscuro,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  boton: {
    minHeight: 54,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.lg,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
});
