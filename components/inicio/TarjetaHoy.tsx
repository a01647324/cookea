import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../Icono';
import { Esqueleto } from '../Esqueleto';
import { DiaPlan } from '../../hooks/useWeekPlan';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

interface Props {
  dias: DiaPlan[];
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
  onAbrirReceta: (recetaId: number) => void;
  onCocinar: (recetaId: number) => void;
  onPlanear: (fecha?: string) => void;
  preparadaHoy?: boolean;
}

const NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function fechaLocal(fecha: Date) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function TarjetaHoy({
  dias,
  cargando,
  error,
  onReintentar,
  onAbrirReceta,
  onCocinar,
  onPlanear,
  preparadaHoy = false,
}: Props) {
  const ahora = new Date();
  const fechaHoy = fechaLocal(ahora);
  const manana = new Date(ahora);
  manana.setDate(ahora.getDate() + 1);
  const hoy = dias.find((d) => d.fecha === fechaHoy);
  const semanaVacia = dias.every((d) => !d.item);
  const item = hoy?.item;

  if (cargando && dias.length === 0) {
    return (
      <View style={estilos.tarjeta}>
        <Esqueleto ancho={110} alto={14} color={colors.primario} />
        <Esqueleto ancho="75%" alto={24} color={colors.primario} estilo={{ marginTop: espaciado.sm }} />
        <Esqueleto ancho="100%" alto={50} radio={radios.pill} color={colors.primario} estilo={{ marginTop: espaciado.md }} />
      </View>
    );
  }

  if (error && dias.length === 0) {
    return (
      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>No pudimos cargar tu semana</Text>
        <Text style={estilos.texto}>Revisa tu conexión e inténtalo otra vez.</Text>
        <Pressable style={estilos.boton} onPress={onReintentar}>
          <Icono nombre="refresh-linear" size={20} color={colors.sobreEncabezado} />
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.dia}>HOY · {NOMBRE_DIA[ahora.getDay()].toUpperCase()}</Text>

      {item ? (
        <>
          <Pressable onPress={() => onAbrirReceta(item.receta_id)} accessibilityRole="button">
            <Text style={estilos.titulo} numberOfLines={2}>
              {item.recetas.nombre}
            </Text>
          </Pressable>
          <View style={estilos.meta}>
            <Icono nombre="clock-circle-linear" size={16} color={colors.neutro} />
            <Text style={estilos.texto}>
              {capitalizar(item.momento)} · {item.recetas.tiempo_min} min
            </Text>
          </View>
          {preparadaHoy ? (
            <>
              <View style={estilos.cocinada}>
                <Icono nombre="check-circle-linear" size={18} color={colors.texto} />
                <Text style={estilos.textoCocinada}>¡Ya la cocinaste!</Text>
              </View>
              <Pressable style={estilos.botonSecundario} onPress={() => onPlanear(fechaLocal(manana))}>
                <Icono nombre="calendar-linear" size={20} color={colors.sobreEncabezado} />
                <Text style={estilos.textoBoton}>Ver qué toca mañana</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={estilos.boton} onPress={() => onCocinar(item.receta_id)}>
              <Icono nombre="chef-hat-linear" size={20} color={colors.sobreEncabezado} />
              <Text style={estilos.textoBoton}>Empezar a cocinar</Text>
            </Pressable>
          )}
        </>
      ) : semanaVacia ? (
        <>
          <Text style={estilos.titulo}>Aún no planeas tu semana</Text>
          <Text style={estilos.texto}>Elige qué cocinar cada día y te lo recordamos aquí.</Text>
          <Pressable style={estilos.boton} onPress={() => onPlanear()}>
            <Icono nombre="calendar-linear" size={20} color={colors.sobreEncabezado} />
            <Text style={estilos.textoBoton}>Planear mi semana</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={estilos.titulo}>Hoy está libre</Text>
          <Text style={estilos.texto}>Elige una receta para hoy.</Text>
          <Pressable style={estilos.boton} onPress={() => onPlanear(fechaHoy)}>
            <Icono nombre="add-circle-linear" size={20} color={colors.sobreEncabezado} />
            <Text style={estilos.textoBoton}>Elegir receta</Text>
          </Pressable>
        </>
      )}

      <View style={estilos.semana}>
        {dias.map((d) => {
          const esHoy = d.fecha === fechaHoy;
          return (
            <Pressable
              key={d.fecha}
              onPress={() => onPlanear(d.fecha)}
              hitSlop={6}
              style={estilos.diaSemana}
              accessibilityLabel={`${d.etiqueta}: ${d.item ? d.item.recetas.nombre : 'sin receta'}`}
            >
              <Text style={[estilos.letra, esHoy && estilos.letraHoy]}>{d.etiqueta.charAt(0)}</Text>
              <View style={[estilos.punto, d.item ? estilos.puntoLleno : estilos.puntoVacio, esHoy && estilos.puntoHoy]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.texto,
    borderRadius: 24,
    padding: espaciado.md,
    shadowColor: colors.texto,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  dia: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.mini,
    letterSpacing: 1.2,
    color: colors.resaltado,
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 21,
    lineHeight: 28,
    color: colors.superficie,
    marginTop: espaciado.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: espaciado.xs,
  },
  texto: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.base,
    lineHeight: 21,
    color: colors.neutro,
    marginTop: 2,
  },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
    minHeight: 50,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    marginTop: espaciado.md,
  },
  cocinada: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.resaltado,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 5,
    marginTop: espaciado.sm,
  },
  textoCocinada: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.texto,
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
    minHeight: 50,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.encabezado,
    marginTop: espaciado.md,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
  semana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: espaciado.md,
    paddingTop: espaciado.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(205, 215, 216, 0.2)',
  },
  diaSemana: {
    alignItems: 'center',
    gap: 6,
    minWidth: 32,
  },
  letra: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.neutro,
  },
  letraHoy: {
    fontFamily: fuentes.negrita,
    color: colors.superficie,
  },
  punto: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  puntoLleno: {
    backgroundColor: colors.calido,
  },
  puntoVacio: {
    borderWidth: 1.5,
    borderColor: colors.neutro,
  },
  puntoHoy: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.superficie,
  },
});
