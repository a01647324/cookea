import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, espaciado, radios, tipografia } from '../../theme/theme';
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
  const insets = useSafeAreaInsets();

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
      if (nueva <= 0) return prev; // nunca bajamos a 0: para eso está la casilla
      return { ...prev, [id]: { ...actual, cantidad: nueva } };
    });
  }

  // Marcados que SÍ están en la alacena = los que de verdad se van a descontar
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

  function renderFila(f: RecetaIng) {
    const ing = f.ingredientes;
    const e = estado[ing.id];
    if (!e) return null;

    const enAlacena = stock.get(ing.id);
    const marcado = e.marcado;
    const colorTexto = marcado ? colors.olivaOscuro : colors.vino;

    let pista = '';
    let pistaAdvertencia = false;
    if (!enAlacena) {
      pista = 'No está en tu alacena';
    } else if (marcado && enAlacena.cantidad < e.cantidad) {
      pista = `Solo tienes ${formatearCantidad(enAlacena.cantidad, ing.unidad)}; se descontará todo`;
      pistaAdvertencia = true;
    } else {
      pista = `Tienes ${formatearCantidad(enAlacena.cantidad, ing.unidad)}`;
    }

    return (
      <Pressable key={ing.id} onPress={() => alternar(ing.id)} style={estilos.fila} disabled={ocupado}>
        <View
          style={[
            estilos.casilla,
            marcado ? estilos.casillaMarcada : estilos.casillaVacia,
          ]}
        >
          {marcado && <Text style={estilos.palomita}>✓</Text>}
        </View>

        <View style={estilos.centroFila}>
          <Text style={[estilos.nombre, { color: colorTexto }]} numberOfLines={2}>
            {ing.nombre}
            {f.opcional ? ' (opcional)' : ''}
          </Text>
          <Text style={[estilos.pista, pistaAdvertencia && { color: colors.advertencia }]} numberOfLines={2}>
            {pista}
          </Text>
        </View>

        {}
        <View style={[estilos.pastilla, { borderColor: marcado ? colors.olivaOscuro : colors.vino }]}>
          {marcado && (
            <Pressable
              onPress={() => ajustar(ing.id, ing.unidad, false)}
              disabled={ocupado || e.cantidad - pasoDe(e.cantidad, ing.unidad) <= 0}
              hitSlop={8}
              style={[estilos.botonPastilla, e.cantidad - pasoDe(e.cantidad, ing.unidad) <= 0 && { opacity: 0.3 }]}
              accessibilityLabel={`Menos ${ing.nombre}`}
            >
              <Text style={[estilos.simboloPastilla, { color: colorTexto }]}>−</Text>
            </Pressable>
          )}
          <Text style={[estilos.textoPastilla, { color: colorTexto }]} numberOfLines={1}>
            {formatearCantidad(marcado ? e.cantidad : 0, ing.unidad)}
          </Text>
          {marcado && (
            <Pressable
              onPress={() => ajustar(ing.id, ing.unidad, true)}
              disabled={ocupado}
              hitSlop={8}
              style={estilos.botonPastilla}
              accessibilityLabel={`Más ${ing.nombre}`}
            >
              <Text style={[estilos.simboloPastilla, { color: colorTexto }]}>+</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
    );
  }

  const textoDescontar =
    aDescontar.length > 0 ? `Descontar de mi alacena (${aDescontar.length})` : 'Descontar de mi alacena';
  const descontarInactivo = ocupado || aDescontar.length === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrarSiLibre}>
      <View style={estilos.fondo}>
        <Pressable style={estilos.zonaCierre} onPress={cerrarSiLibre} />

        <View style={[estilos.hoja, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
          <View style={estilos.manija} />

          <Text style={tipografia.titulo}>¡Bien hecho!</Text>
          <Text style={estilos.subtitulo}>¿Usaste estos ingredientes? Ajusta las cantidades si es necesario.</Text>
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
              <ActivityIndicator color={colors.textoSobreColor} />
            ) : (
              <Text style={estilos.textoPrimario}>{textoDescontar}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={registrar}
            disabled={ocupado}
            style={[estilos.botonSecundario, ocupado && { opacity: 0.5 }]}
          >
            {accion === 'registrar' ? (
              <ActivityIndicator color={colors.textoPrincipal} />
            ) : (
              <Text style={estilos.textoSecundario}>Solo registrar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(58,46,34,0.45)',
    justifyContent: 'flex-end',
  },
  zonaCierre: {
    flex: 1,
  },
  hoja: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: espaciado.sm,
    paddingHorizontal: espaciado.lg,
  },
  manija: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borde,
    marginBottom: espaciado.md,
  },
  subtitulo: {
    ...tipografia.cuerpo,
    color: colors.textoSecundario,
    marginTop: espaciado.xs,
  },
  porciones: {
    ...tipografia.chico,
    marginTop: espaciado.xs,
    marginBottom: espaciado.sm,
  },
  lista: {
    flexShrink: 1,
    marginTop: espaciado.xs,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borde,
  },
  casilla: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  casillaMarcada: {
    backgroundColor: colors.olivaOscuro,
    borderColor: colors.olivaOscuro,
  },
  casillaVacia: {
    backgroundColor: 'transparent',
    borderColor: colors.vino,
  },
  palomita: {
    color: colors.textoSobreColor,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  centroFila: {
    flex: 1,
    paddingRight: 10,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  pista: {
    ...tipografia.chico,
    marginTop: 2,
  },
  pastilla: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radios.pill,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minHeight: 36,
  },
  botonPastilla: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simboloPastilla: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  textoPastilla: {
    minWidth: 54,
    paddingHorizontal: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  ayuda: {
    ...tipografia.chico,
    textAlign: 'center',
    marginTop: espaciado.sm,
  },
  botonPrimario: {
    backgroundColor: colors.oliva,
    borderRadius: radios.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: espaciado.md,
  },
  botonInactivo: {
    backgroundColor: '#B9B0A0', 
  },
  textoPrimario: {
    color: colors.textoSobreColor,
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundario: {
    borderRadius: radios.md,
    borderWidth: 1.5,
    borderColor: colors.textoPrincipal,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: espaciado.sm,
  },
  textoSecundario: {
    color: colors.textoPrincipal,
    fontSize: 16,
    fontWeight: '700',
  },
});