import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { formatearFechaLocal } from '../../hooks/useWeeklyPlanner';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const LETRAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  visible: boolean;
  seleccionada: Date;
  onElegir: (fecha: Date) => void;
  onCerrar: () => void;
}

export function HojaCalendario({ visible, seleccionada, onElegir, onCerrar }: Props) {
  const [mes, setMes] = useState(new Date(seleccionada.getFullYear(), seleccionada.getMonth(), 1));

  useEffect(() => {
    if (visible) setMes(new Date(seleccionada.getFullYear(), seleccionada.getMonth(), 1));
  }, [visible]);

  const textoSeleccionada = formatearFechaLocal(seleccionada);
  const textoHoy = formatearFechaLocal(new Date());
  const desfase = (mes.getDay() + 6) % 7;
  const dias = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
  const celdas: (Date | null)[] = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: dias }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1)),
  ];

  function moverMes(cantidad: number) {
    setMes((m) => new Date(m.getFullYear(), m.getMonth() + cantidad, 1));
  }

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => moverMes(-1)} hitSlop={10} style={estilos.flecha} accessibilityLabel="Mes anterior">
          <Icono nombre="alt-arrow-left-linear" size={22} color={colors.texto} />
        </Pressable>
        <Text style={estilos.mes}>
          {MESES[mes.getMonth()]} {mes.getFullYear()}
        </Text>
        <Pressable onPress={() => moverMes(1)} hitSlop={10} style={estilos.flecha} accessibilityLabel="Mes siguiente">
          <Icono nombre="alt-arrow-right-linear" size={22} color={colors.texto} />
        </Pressable>
      </View>

      <View style={estilos.fila}>
        {LETRAS.map((l, i) => (
          <Text key={i} style={estilos.letra}>
            {l}
          </Text>
        ))}
      </View>

      <View style={estilos.cuadricula}>
        {celdas.map((fecha, i) => {
          if (!fecha) return <View key={`v${i}`} style={estilos.celda} />;
          const texto = formatearFechaLocal(fecha);
          const elegida = texto === textoSeleccionada;
          const esHoy = texto === textoHoy;
          return (
            <Pressable key={texto} style={estilos.celda} onPress={() => onElegir(fecha)}>
              <View style={[estilos.numero, esHoy && estilos.hoy, elegida && estilos.elegida]}>
                <Text style={[estilos.textoNumero, elegida && estilos.textoElegida]}>{fecha.getDate()}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => onElegir(new Date())}
        style={estilos.botonHoy}
      >
        <Text style={estilos.textoHoy}>Ir a hoy</Text>
      </Pressable>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  flecha: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mes: {
    fontFamily: fuentes.titulo,
    fontSize: 20,
    color: colors.texto,
  },
  fila: {
    flexDirection: 'row',
  },
  letra: {
    width: '14.285%',
    textAlign: 'center',
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  cuadricula: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: espaciado.sm,
  },
  celda: {
    width: '14.285%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numero: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoy: {
    borderWidth: 2,
    borderColor: colors.resaltado,
  },
  elegida: {
    backgroundColor: colors.encabezado,
    borderColor: colors.encabezado,
  },
  textoNumero: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  textoElegida: {
    fontFamily: fuentes.negrita,
    color: colors.sobreEncabezado,
  },
  botonHoy: {
    minHeight: 50,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.md,
  },
  textoHoy: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
});
