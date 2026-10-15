import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';
import { RecetaDetalle, UnidadIngrediente } from '../../types/database';
import { formatearCantidad } from '../../lib/unidades';
import { mostrarAviso } from '../../lib/avisos';
import {
  Descuento,
  ResultadoPreparada,
  StockAlacena,
  descontarYRegistrar,
  leerStock,
  soloRegistrar,
} from '../../lib/yaLaPrepare';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  receta: RecetaDetalle;
  porciones: number;
}

type Estado = Record<number, { marcado: boolean; cantidad: number }>;

type RecetaIng = RecetaDetalle['receta_ingredientes'][number];

const redondear = (n: number) => Math.round(n * 100) / 100;

function pasoDe(cantidad: number, base: UnidadIngrediente): number {
  if (base === 'pieza') return 1;
  if (cantidad >= 500) return 100;
  if (cantidad >= 100) return 50;
  if (cantidad >= 20) return 10;
  return 5;
}

export function ModalYaLoPrepare({ visible, onCerrar, receta, porciones }: Props) {
  const filas: RecetaIng[] = useMemo(
    () =>
      [...receta.receta_ingredientes].sort(
        (a, b) =>
          Number(a.opcional) - Number(b.opcional) ||
          a.ingredientes.nombre.localeCompare(b.ingredientes.nombre, 'es')
      ),
    [receta]
  );

  function escalar(cantidad: number): number {
    return redondear(Number(cantidad) * (porciones / (receta.porciones_base || 1)));
  }

  function estadoInicial(): Estado {
    const e: Estado = {};
    filas.forEach((f) => {
      e[f.ingredientes.id] = { marcado: !f.opcional, cantidad: escalar(f.cantidad) };
    });
    return e;
  }

  const [estado, setEstado] = useState<Estado>(estadoInicial);
  const [stock, setStock] = useState<Map<number, StockAlacena>>(new Map());
  const [accion, setAccion] = useState<'descontar' | 'registrar' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelado = false;
    setError(null);
    setAccion(null);
    setEstado(estadoInicial());
    leerStock(filas.map((f) => f.ingredientes.id)).then((m) => {
      if (!cancelado) setStock(m);
    });
    return () => {
      cancelado = true;
    };
  }, [visible, receta.id, porciones]);

  const ocupado = accion !== null;

  function alternar(id: number) {
    setEstado((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], marcado: !prev[id].marcado } } : prev));
  }

  function ajustar(id: number, base: UnidadIngrediente, subiendo: boolean) {
    setEstado((prev) => {
      const actual = prev[id];
      if (!actual) return prev;
      const paso = pasoDe(actual.cantidad, base);
      const nueva = redondear(subiendo ? actual.cantidad + paso : actual.cantidad - paso);
      if (nueva <= 0) return prev;
      return { ...prev, [id]: { ...actual, cantidad: nueva } };
    });
  }

  const aDescontar: Descuento[] = filas
    .filter((f) => estado[f.ingredientes.id]?.marcado && stock.has(f.ingredientes.id))
    .map((f) => ({ ingrediente_id: f.ingredientes.id, cantidad: estado[f.ingredientes.id].cantidad }));

  const hayMarcados = filas.some((f) => estado[f.ingredientes.id]?.marcado);

  function terminar(r: ResultadoPreparada, mensajeOk: string) {
    if (r.ok) {
      onCerrar();
      mostrarAviso('¡Listo!', mensajeOk);
    } else if (r.alacenaModificada) {
      mostrarAviso('Revisa tu alacena', r.mensaje);
    } else {
      setError(r.mensaje ?? 'No se pudo guardar. Inténtalo de nuevo.');
    }
  }

  async function descontar() {
    if (ocupado || aDescontar.length === 0) return;
    setError(null);
    setAccion('descontar');
    const r = await descontarYRegistrar(receta.id, aDescontar);
    setAccion(null);

    const partes = [`Descontamos ${r.descontados} ${r.descontados === 1 ? 'ingrediente' : 'ingredientes'} de tu alacena`];
    if (r.agotados > 0) partes[0] += ` (${r.agotados === 1 ? 'se terminó 1' : `se terminaron ${r.agotados}`})`;
    terminar(r, `${partes[0]}. La receta quedó en "Ya preparadas".`);
  }

  async function registrar() {
    if (ocupado) return;
    setError(null);
    setAccion('registrar');
    const r = await soloRegistrar(receta.id);
    setAccion(null);
    terminar(r, 'La receta quedó en "Ya preparadas". Tu alacena no cambió.');
  }

  function cerrarSiLibre() {
    if (!ocupado) onCerrar();
  }

  function renderFila(f: RecetaIng, indice: number) {
    const ing = f.ingredientes;
    const e = estado[ing.id];
    if (!e) return null;

    const enAlacena = stock.get(ing.id);
    const marcado = e.marcado;
    const sinMenos = e.cantidad - pasoDe(e.cantidad, ing.unidad) <= 0;

    let pista = '';
    let advertencia = false;
    if (!enAlacena) {
      pista = 'No está en tu alacena';
    } else if (marcado && enAlacena.cantidad < e.cantidad) {
      pista = `Solo tienes ${formatearCantidad(enAlacena.cantidad, ing.unidad)}; se descontará todo`;
      advertencia = true;
    } else {
      pista = `Tienes ${formatearCantidad(enAlacena.cantidad, ing.unidad)}`;
    }

    return (
      <Pressable
        key={ing.id}
        onPress={() => alternar(ing.id)}
        disabled={ocupado}
        style={[estilos.fila, indice === filas.length - 1 && estilos.filaFinal, !marcado && estilos.filaApagada]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: marcado }}
        accessibilityLabel={ing.nombre}
      >
        <View style={[estilos.casilla, marcado ? estilos.casillaMarcada : estilos.casillaVacia]}>
          {marcado && <Icono nombre="check-linear" size={18} color={colors.sobreEncabezado} />}
        </View>

        <View style={estilos.centroFila}>
          <Text style={estilos.nombre} numberOfLines={2}>
            {ing.nombre}
            {f.opcional ? ' (opcional)' : ''}
          </Text>
          <View style={estilos.filaPista}>
            {advertencia && <Icono nombre="danger-triangle-linear" size={14} color={colors.calidoOscuro} />}
            <Text style={[estilos.pista, advertencia && estilos.pistaAdvertencia]} numberOfLines={2}>
              {pista}
            </Text>
          </View>
        </View>

        {marcado ? (
          <View style={estilos.pastilla}>
            <Pressable
              onPress={() => ajustar(ing.id, ing.unidad, false)}
              disabled={ocupado || sinMenos}
              hitSlop={8}
              style={[estilos.botonMenos, sinMenos && { opacity: 0.35 }]}
              accessibilityLabel={`Menos ${ing.nombre}`}
            >
              <Icono nombre="minus-linear" size={16} color={colors.texto} />
            </Pressable>
            <Text style={estilos.textoPastilla} numberOfLines={1}>
              {formatearCantidad(e.cantidad, ing.unidad)}
            </Text>
            <Pressable
              onPress={() => ajustar(ing.id, ing.unidad, true)}
              disabled={ocupado}
              hitSlop={8}
              style={estilos.botonMas}
              accessibilityLabel={`Más ${ing.nombre}`}
            >
              <Icono nombre="add-linear" size={16} color={colors.sobreEncabezado} />
            </Pressable>
          </View>
        ) : (
          <View style={estilos.noUsada}>
            <Text style={estilos.textoNoUsada}>No usada</Text>
          </View>
        )}
      </Pressable>
    );
  }

  const textoDescontar =
    aDescontar.length > 0 ? `Descontar de mi alacena (${aDescontar.length})` : 'Descontar de mi alacena';
  const descontarInactivo = ocupado || aDescontar.length === 0;

  return (
    <HojaInferior visible={visible} onCerrar={cerrarSiLibre}>
      <View style={estilos.circulo}>
        <Icono nombre="check-circle-linear" size={30} color={colors.acentoIntenso} />
      </View>
      <Text style={estilos.titulo}>¡Bien hecho!</Text>
      <Text style={estilos.subtitulo}>¿Usaste estos ingredientes? Ajusta si hace falta.</Text>
      <Text style={estilos.porciones}>
        Cantidades para {porciones} {porciones === 1 ? 'porción' : 'porciones'}
      </Text>

      <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false}>
        {filas.length === 0 ? (
          <Text style={estilos.subtitulo}>Esta receta no tiene ingredientes registrados.</Text>
        ) : (
          filas.map(renderFila)
        )}
      </ScrollView>

      {error && <Text style={estilos.error}>{error}</Text>}
      {!error && aDescontar.length === 0 && (
        <Text style={estilos.ayuda}>
          {hayMarcados
            ? 'Ninguno de los ingredientes marcados está en tu alacena, así que no hay nada que descontar.'
            : 'Marca al menos un ingrediente que tengas en tu alacena para descontarlo.'}
        </Text>
      )}

      <Pressable
        onPress={descontar}
        disabled={descontarInactivo}
        style={[estilos.botonPrimario, descontarInactivo && estilos.botonInactivo]}
      >
        {accion === 'descontar' ? (
          <ActivityIndicator color={colors.sobreEncabezado} />
        ) : (
          <Text style={[estilos.textoPrimario, descontarInactivo && estilos.textoInactivo]}>{textoDescontar}</Text>
        )}
      </Pressable>

      <Pressable onPress={registrar} disabled={ocupado} style={[estilos.botonSecundario, ocupado && { opacity: 0.5 }]}>
        {accion === 'registrar' ? (
          <ActivityIndicator color={colors.texto} />
        ) : (
          <Text style={estilos.textoSecundario}>Solo registrar</Text>
        )}
      </Pressable>
      <Text style={estilos.nota}>"Solo registrar" la guarda en Ya preparadas sin tocar tu alacena.</Text>
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  circulo: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.acentoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fuentes.titulo,
    fontSize: 24,
    lineHeight: 31,
    color: colors.texto,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  subtitulo: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.cuerpo,
    lineHeight: 22,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 2,
  },
  porciones: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoTenue,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: espaciado.sm,
  },
  lista: {
    flexShrink: 1,
    backgroundColor: colors.superficie,
    borderRadius: 20,
    paddingHorizontal: espaciado.md,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  filaFinal: {
    borderBottomWidth: 0,
  },
  filaApagada: {
    opacity: 0.55,
  },
  casilla: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: {
    backgroundColor: colors.encabezado,
  },
  casillaVacia: {
    borderWidth: 2,
    borderColor: colors.textoTenue,
  },
  centroFila: {
    flex: 1,
  },
  nombre: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    lineHeight: 21,
    color: colors.texto,
  },
  filaPista: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pista: {
    flexShrink: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.textoSuave,
  },
  pistaAdvertencia: {
    fontFamily: fuentes.semibold,
    color: colors.calidoOscuro,
  },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.fondo,
    borderRadius: radios.pill,
    padding: 4,
  },
  botonMenos: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMas: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPastilla: {
    minWidth: 56,
    textAlign: 'center',
    fontFamily: fuentes.negrita,
    fontSize: tamanos.base,
    color: colors.texto,
  },
  noUsada: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.textoTenue,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.sm,
    paddingVertical: 6,
  },
  textoNoUsada: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.textoSuave,
  },
  error: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.peligro,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  ayuda: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 18,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  botonPrimario: {
    minHeight: 54,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.md,
  },
  botonInactivo: {
    backgroundColor: colors.fondoHundido,
  },
  textoPrimario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
  textoInactivo: {
    color: colors.textoTenue,
  },
  botonSecundario: {
    minHeight: 50,
    borderRadius: radios.pill,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: espaciado.sm,
  },
  textoSecundario: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  nota: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.mini,
    color: colors.textoTenue,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
});
