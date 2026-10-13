import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, espaciado, radios, tipografia } from '../../theme/theme';
import { usePaquetesBamx } from '../../hooks/usePaquetesBamx';
import { EntradaAlacena, PaqueteBamx, ResultadoAccion } from '../../types/alacena';
import { cantidadMinima, formatearCantidad, pasoBase } from '../../lib/unidades';
import { mostrarAviso } from '../../lib/avisos';
import { Stepper } from './stepper';
import { IngredienteImagen } from './ingredienteImagen';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  onConfirmar: (entradas: EntradaAlacena[]) => Promise<ResultadoAccion>;
}

type Fila = PaqueteBamx['paquete_bamx_ingredientes'][number];

export function DespensaBamxModal({ visible, onCerrar, onConfirmar }: Props) {
  const { paquetes, cargando, error, recargar } = usePaquetesBamx(visible);

  const [paqueteId, setPaqueteId] = useState<number | null>(null);
  const [seleccion, setSeleccion] = useState<Record<number, number>>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setPaqueteId(null);
      setSeleccion({});
      setGuardando(false);
    }
  }, [visible]);

  const paqueteActivoId = paqueteId ?? (paquetes.length === 1 ? paquetes[0].id : null);
  const paquete = paquetes.find((p) => p.id === paqueteActivoId) ?? null;

  const filas: Fila[] = useMemo(
    () =>
      [...(paquete?.paquete_bamx_ingredientes ?? [])].sort((a, b) =>
        a.ingredientes.nombre.localeCompare(b.ingredientes.nombre, 'es')
      ),
    [paquete]
  );

  const total = Object.keys(seleccion).length;
  const todosMarcados = filas.length > 0 && total === filas.length;

  function alternar(fila: Fila) {
    setSeleccion((prev) => {
      const copia = { ...prev };
      if (copia[fila.ingrediente_id] != null) delete copia[fila.ingrediente_id];
      else copia[fila.ingrediente_id] = fila.cantidad; 
      return copia;
    });
  }

  function marcarTodos() {
    if (todosMarcados) {
      setSeleccion({});
    } else {
      const todos: Record<number, number> = {};
      filas.forEach((f) => (todos[f.ingrediente_id] = f.cantidad));
      setSeleccion(todos);
    }
  }

  function ajustar(fila: Fila, subiendo: boolean) {
    setSeleccion((prev) => {
      const actual = prev[fila.ingrediente_id];
      if (actual == null) return prev;
      const base = fila.ingredientes.unidad;
      const paso = pasoBase(actual, base, subiendo);
      const nueva = subiendo ? actual + paso : Math.max(cantidadMinima(base), actual - paso);
      return { ...prev, [fila.ingrediente_id]: nueva };
    });
  }

  async function confirmar() {
    if (total === 0 || guardando) return;
    setGuardando(true);
    const entradas: EntradaAlacena[] = Object.entries(seleccion).map(([id, cantidad]) => ({
      ingrediente_id: Number(id),
      cantidad,
    }));
    const resultado = await onConfirmar(entradas);
    setGuardando(false);
    if (resultado.ok) onCerrar();
    else mostrarAviso('No se pudo agregar', resultado.mensaje ?? 'Intenta de nuevo.');
  }

  function renderFila({ item: fila }: { item: Fila }) {
    const cantidad = seleccion[fila.ingrediente_id];
    const marcado = cantidad != null;
    const ing = fila.ingredientes;
    return (
      <View style={[estilos.fila, marcado && estilos.filaActiva]}>
        <Pressable onPress={() => alternar(fila)} style={estilos.filaSuperior}>
          <IngredienteImagen
            nombre={ing.nombre}
            categoria={ing.categoria}
            url={ing.imagen_url}
            tamano={44}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={tipografia.subtitulo}>{ing.nombre}</Text>
            <Text style={tipografia.chico}>Aprox. {formatearCantidad(fila.cantidad, ing.unidad)}</Text>
          </View>
          <View style={[estilos.marca, marcado && estilos.marcaActiva]}>
            {marcado && <Text style={estilos.palomita}>✓</Text>}
          </View>
        </Pressable>

        {marcado && (
          <View style={estilos.filaCantidad}>
            <Text style={tipografia.chico}>¿Cuánto te llegó?</Text>
            <Stepper
              compacto
              texto={formatearCantidad(cantidad, ing.unidad)}
              menosDeshabilitado={cantidad - pasoBase(cantidad, ing.unidad, false) < cantidadMinima(ing.unidad)}
              onMenos={() => ajustar(fila, false)}
              onMas={() => ajustar(fila, true)}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={estilos.fondo}>
        <Pressable style={estilos.zonaCierre} onPress={onCerrar} />

        <View style={estilos.hoja}>
          <View style={estilos.encabezado}>
            <Text style={tipografia.titulo}>Mi despensa BAMX</Text>
            <Pressable onPress={onCerrar} hitSlop={10}>
              <Text style={estilos.cerrar}>✕</Text>
            </Pressable>
          </View>

          {cargando ? (
            <View style={estilos.centro}>
              <ActivityIndicator size="large" color={colors.oliva} />
            </View>
          ) : error ? (
            <View style={estilos.centro}>
              <Text style={estilos.textoError}>{error}</Text>
              <Text style={estilos.reintentar} onPress={recargar}>
                Reintentar
              </Text>
            </View>
          ) : paquetes.length === 0 ? (
            <View style={estilos.centro}>
              <Text style={tipografia.subtitulo}>Todavía no hay despensas disponibles</Text>
              <Text style={[tipografia.chico, { textAlign: 'center', marginTop: 6 }]}>
                Cuando BAMX publique una, la verás aquí.
              </Text>
            </View>
          ) : !paquete ? (
            <FlatList
              data={paquetes}
              keyExtractor={(p) => String(p.id)}
              contentContainerStyle={{ paddingVertical: 10 }}
              ListHeaderComponent={<Text style={estilos.ayuda}>¿Cuál despensa recibiste?</Text>}
              renderItem={({ item: p }) => (
                <Pressable onPress={() => setPaqueteId(p.id)} style={estilos.tarjetaPaquete}>
                  <Text style={estilos.iconoPaquete}>📦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={tipografia.subtitulo}>{p.nombre}</Text>
                    {p.descripcion && <Text style={tipografia.chico}>{p.descripcion}</Text>}
                  </View>
                  <Text style={estilos.flecha}>›</Text>
                </Pressable>
              )}
            />
          ) : (
            <>
              <Text style={estilos.ayuda}>
                {paquete.nombre}. Marca lo que te llegó; las cantidades son aproximadas, ajústalas si hace falta.
              </Text>

              <Pressable onPress={marcarTodos} style={estilos.botonMarcarTodos}>
                <Text style={estilos.textoMarcarTodos}>{todosMarcados ? 'Quitar todos' : 'Marcar todos'}</Text>
              </Pressable>

              <FlatList
                data={filas}
                keyExtractor={(f) => String(f.ingrediente_id)}
                renderItem={renderFila}
                extraData={seleccion}
                contentContainerStyle={{ paddingVertical: 6, paddingBottom: 20 }}
                style={{ flex: 1 }}
                ListEmptyComponent={
                  <Text style={[tipografia.cuerpo, { textAlign: 'center', marginTop: 20 }]}>
                    Esta despensa aún no tiene productos registrados.
                  </Text>
                }
              />
            </>
          )}

          {paquete && (
            <Pressable
              onPress={confirmar}
              disabled={total === 0 || guardando}
              style={[estilos.botonConfirmar, (total === 0 || guardando) && estilos.botonInactivo]}
            >
              {guardando ? (
                <ActivityIndicator color={colors.textoSobreColor} />
              ) : (
                <Text style={estilos.textoConfirmar}>
                  {total === 0
                    ? 'Marca lo que te llegó'
                    : total === 1
                    ? 'Agregar 1 producto'
                    : `Agregar ${total} productos`}
                </Text>
              )}
            </Pressable>
          )}
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
    height: '86%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: espaciado.md,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espaciado.sm,
  },
  cerrar: {
    fontSize: 20,
    color: colors.textoSecundario,
  },
  ayuda: {
    ...tipografia.cuerpo,
    color: colors.textoSecundario,
    marginBottom: 10,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  textoError: {
    color: colors.error,
    textAlign: 'center',
  },
  reintentar: {
    marginTop: 8,
    color: colors.oliva,
    fontWeight: '600',
  },
  tarjetaPaquete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radios.md,
    padding: 14,
    marginBottom: 10,
  },
  iconoPaquete: {
    fontSize: 28,
    marginRight: 12,
  },
  flecha: {
    fontSize: 26,
    color: colors.textoSecundario,
  },
  botonMarcarTodos: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.oliva,
    marginBottom: 6,
  },
  textoMarcarTodos: {
    color: colors.oliva,
    fontWeight: '600',
    fontSize: 12,
  },
  fila: {
    backgroundColor: colors.surface,
    borderRadius: radios.md,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filaActiva: {
    borderColor: colors.oliva,
  },
  filaSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  iconoCaja: {
    width: 44,
    height: 44,
    borderRadius: radios.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icono: {
    fontSize: 24,
  },
  marca: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaActiva: {
    backgroundColor: colors.oliva,
    borderColor: colors.oliva,
  },
  palomita: {
    color: colors.textoSobreColor,
    fontSize: 14,
    fontWeight: '700',
  },
  filaCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  botonConfirmar: {
    backgroundColor: colors.terracota,
    borderRadius: radios.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonInactivo: {
    backgroundColor: '#B9B0A0',
  },
  textoConfirmar: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 15,
  },
});