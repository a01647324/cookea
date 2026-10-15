import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Icono from '../Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

const TAMANO = 128;
const GROSOR = 10;
const RADIO = (TAMANO - GROSOR) / 2;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

function formatear(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface Props {
  duracion: number;
}

export function Temporizador({ duracion }: Props) {
  const [restantes, setRestantes] = useState(duracion);
  const [activo, setActivo] = useState(false);
  const finEn = useRef(0);

  useEffect(() => {
    if (!activo) return;
    const intervalo = setInterval(() => {
      const quedan = Math.max(0, Math.ceil((finEn.current - Date.now()) / 1000));
      setRestantes(quedan);
      if (quedan === 0) {
        setActivo(false);
        Vibration.vibrate([0, 500, 250, 500, 250, 500]);
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [activo]);

  function alternar() {
    if (restantes === 0) {
      finEn.current = Date.now() + duracion * 1000;
      setRestantes(duracion);
      setActivo(true);
      return;
    }
    if (!activo) finEn.current = Date.now() + restantes * 1000;
    setActivo(!activo);
  }

  function reiniciar() {
    setActivo(false);
    setRestantes(duracion);
  }

  const terminado = restantes === 0;
  const progreso = duracion > 0 ? restantes / duracion : 0;
  const tocado = restantes !== duracion;

  const textoBoton = terminado ? 'Repetir' : activo ? 'Pausar' : tocado ? 'Continuar' : 'Iniciar';
  const iconoBoton = terminado ? 'refresh-linear' : activo ? 'pause-linear' : 'play-linear';
  const titulo = terminado ? '¡Tiempo!' : activo ? 'Corriendo' : tocado ? 'En pausa' : 'Temporizador';

  return (
    <View style={[estilos.tarjeta, terminado && estilos.tarjetaTerminada]}>
      <View style={estilos.anillo}>
        <Svg width={TAMANO} height={TAMANO} style={StyleSheet.absoluteFill}>
          <Circle
            cx={TAMANO / 2}
            cy={TAMANO / 2}
            r={RADIO}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={GROSOR}
            fill="none"
          />
          <Circle
            cx={TAMANO / 2}
            cy={TAMANO / 2}
            r={RADIO}
            stroke={colors.resaltado}
            strokeWidth={GROSOR}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
            transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}
          />
        </Svg>
        {terminado ? (
          <Icono nombre="alarm-linear" size={40} color={colors.sobrePrimario} />
        ) : (
          <Text style={estilos.tiempo} accessibilityLabel={`Quedan ${formatear(restantes)}`}>
            {formatear(restantes)}
          </Text>
        )}
      </View>

      <View style={estilos.lado}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.total}>{formatear(duracion)} en total</Text>

        <Pressable
          onPress={alternar}
          style={({ pressed }) => [estilos.botonPrincipal, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
        >
          <Icono nombre={iconoBoton} size={20} color={colors.texto} />
          <Text style={estilos.textoBoton}>{textoBoton}</Text>
        </Pressable>

        {tocado && !terminado && (
          <Pressable onPress={reiniciar} hitSlop={8} style={estilos.reiniciar} accessibilityRole="button">
            <Icono nombre="refresh-linear" size={16} color={colors.sobrePrimario} />
            <Text style={estilos.textoReiniciar}>Reiniciar</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    backgroundColor: colors.calidoIntenso,
    borderRadius: 26,
    padding: espaciado.md,
    marginTop: espaciado.md,
  },
  tarjetaTerminada: {
    backgroundColor: colors.destacadoIntenso,
  },
  anillo: {
    width: TAMANO,
    height: TAMANO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiempo: {
    fontFamily: fuentes.negrita,
    fontSize: 30,
    color: colors.sobrePrimario,
    fontVariant: ['tabular-nums'],
  },
  lado: {
    flex: 1,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    lineHeight: 26,
    color: colors.sobrePrimario,
  },
  total: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  botonPrincipal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radios.pill,
    backgroundColor: colors.superficie,
    marginTop: espaciado.sm,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  reiniciar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: espaciado.sm,
  },
  textoReiniciar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.sobrePrimario,
  },
});
