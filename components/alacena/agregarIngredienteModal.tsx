import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, espaciado, radios, tipografia } from '../../theme/theme';
import { useIngredientes } from '../../hooks/useIngredientes';
import { EntradaAlacena, IngredienteCatalogo, ResultadoAccion } from '../../types/alacena';
import {
  UnidadUI,
  aBase,
  convertirUI,
  formatearUI,
  opcionesUnidad,
  pasoUI,
  valorInicialUI,
} from '../../lib/unidades';
import { etiquetaPasillo, normalizar } from '../../constants/categorias';
import { mostrarAviso } from '../../lib/avisos';
import { ChipsFiltro } from './chipsFiltro';
import { SelectorUnidad } from './selectorUnidad';
import { Stepper } from './stepper';
import { IngredienteImagen } from './ingredienteImagen';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  onConfirmar: (entradas: EntradaAlacena[]) => Promise<ResultadoAccion>;
  onAbrirBamx: () => void;
}

type Seleccion = Record<number, { valor: number; unidad: UnidadUI }>;

export function AgregarIngredienteModal({ visible, onCerrar, onConfirmar, onAbrirBamx }: Props) {
  const { ingredientes, categorias, cargando, error, recargar } = useIngredientes(visible);

  const [categoriaElegida, setCategoriaElegida] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<Seleccion>({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (visible) {
      setSeleccion({});
      setBusqueda('');
      setCategoriaElegida(null);
      setGuardando(false);
    }
  }, [visible]);

  const categoriaActiva = categoriaElegida ?? categorias[0] ?? '';
  const buscando = busqueda.trim().length > 0;

  const visibles = useMemo(() => {
    if (buscando) {
      const q = normalizar(busqueda);
      return ingredientes.filter((i) => normalizar(i.nombre).includes(q));
    }
    return ingredientes.filter((i) => (i.categoria ?? 'Otros') === categoriaActiva);
  }, [ingredientes, busqueda, buscando, categoriaActiva]);

  const totalSeleccionados = Object.keys(seleccion).length;

  function alternar(ing: IngredienteCatalogo) {
    setSeleccion((prev) => {
      const copia = { ...prev };
      if (copia[ing.id]) {
        delete copia[ing.id];
      } else {
        const unidad = opcionesUnidad(ing.unidad)[0];
        copia[ing.id] = { valor: valorInicialUI(unidad), unidad };
      }
      return copia;
    });
  }

  function cambiarValor(ing: IngredienteCatalogo, delta: number) {
    setSeleccion((prev) => {
      const actual = prev[ing.id];
      if (!actual) return prev;
      const paso = pasoUI(actual.unidad);
      const nuevo = Math.max(paso, Math.round((actual.valor + delta) * 100) / 100);
      return { ...prev, [ing.id]: { ...actual, valor: nuevo } };
    });
  }

  function cambiarUnidad(ing: IngredienteCatalogo, unidad: UnidadUI) {
    setSeleccion((prev) => {
      const actual = prev[ing.id];
      if (!actual || actual.unidad === unidad) return prev;
      const valor = Math.max(pasoUI(unidad), convertirUI(actual.valor, actual.unidad, unidad));
      return { ...prev, [ing.id]: { valor, unidad } };
    });
  }

  async function confirmar() {
    if (totalSeleccionados === 0 || guardando) return;
    setGuardando(true);
    const entradas: EntradaAlacena[] = Object.entries(seleccion).map(([id, s]) => ({
      ingrediente_id: Number(id),
      cantidad: aBase(s.valor, s.unidad), 
    }));
    const resultado = await onConfirmar(entradas);
    setGuardando(false);
    if (resultado.ok) onCerrar();
    else mostrarAviso('No se pudo agregar', resultado.mensaje ?? 'Intenta de nuevo.');
  }

  function renderFila({ item: ing }: { item: IngredienteCatalogo }) {
    const sel = seleccion[ing.id];
    const unidades = opcionesUnidad(ing.unidad);
    return (
      <View style={[estilos.fila, sel && estilos.filaActiva]}>
        <Pressable onPress={() => alternar(ing)} style={estilos.filaSuperior}>
          <IngredienteImagen
            nombre={ing.nombre}
            categoria={ing.categoria}
            url={ing.imagen_url}
            tamano={44}
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={tipografia.subtitulo}>{ing.nombre}</Text>
            {buscando && <Text style={tipografia.chico}>{ing.categoria ?? 'Otros'}</Text>}
          </View>
          <View style={[estilos.marca, sel && estilos.marcaActiva]}>
            {sel && <Text style={estilos.palomita}>✓</Text>}
          </View>
        </Pressable>

        {sel && (
          <View style={estilos.filaCantidad}>
            <Stepper
              compacto
              texto={formatearUI(sel.valor, sel.unidad)}
              menosDeshabilitado={sel.valor - pasoUI(sel.unidad) < pasoUI(sel.unidad)}
              onMenos={() => cambiarValor(ing, -pasoUI(sel.unidad))}
              onMas={() => cambiarValor(ing, pasoUI(sel.unidad))}
            />
            <SelectorUnidad
              opciones={unidades}
              seleccionada={sel.unidad}
              onCambiar={(u) => cambiarUnidad(ing, u)}
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
          {}
          <View style={estilos.encabezado}>
            <Text style={tipografia.titulo}>Agregar ingredientes</Text>
            <Pressable onPress={onCerrar} hitSlop={10}>
              <Text style={estilos.cerrar}>✕</Text>
            </Pressable>
          </View>

          {}
          <Pressable onPress={onAbrirBamx} style={estilos.bannerBamx}>
            <Text style={estilos.bannerIcono}>📦</Text>
            <View style={{ flex: 1 }}>
              <Text style={estilos.bannerTitulo}>Agregar mi despensa BAMX</Text>
              <Text style={estilos.bannerTexto}>Marca lo que te llegó y se agrega de una vez.</Text>
            </View>
            <Text style={estilos.bannerFlecha}>›</Text>
          </Pressable>

          {}
          <View style={estilos.buscador}>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Busca un ingrediente"
              placeholderTextColor={colors.textoSecundario}
              style={estilos.input}
            />
            {buscando && (
              <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
                <Text style={estilos.limpiar}>✕</Text>
              </Pressable>
            )}
          </View>

          {}
          {!buscando && categorias.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <ChipsFiltro
                opciones={categorias.map((c) => ({ clave: c, etiqueta: etiquetaPasillo(c) }))}
                seleccionada={categoriaActiva}
                onSeleccionar={setCategoriaElegida}
              />
            </View>
          )}

          {}
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
          ) : visibles.length === 0 ? (
            <View style={estilos.centro}>
              <Text style={tipografia.cuerpo}>
                {buscando ? `No hay ingredientes que coincidan con "${busqueda}".` : 'Esta categoría no tiene ingredientes.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={visibles}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderFila}
              extraData={seleccion}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingVertical: 10, paddingBottom: 20 }}
              style={{ flex: 1 }}
            />
          )}

          {}
          <Pressable
            onPress={confirmar}
            disabled={totalSeleccionados === 0 || guardando}
            style={[estilos.botonConfirmar, (totalSeleccionados === 0 || guardando) && estilos.botonInactivo]}
          >
            {guardando ? (
              <ActivityIndicator color={colors.textoSobreColor} />
            ) : (
              <Text style={estilos.textoConfirmar}>
                {totalSeleccionados === 0
                  ? 'Elige al menos un ingrediente'
                  : totalSeleccionados === 1
                  ? 'Agregar 1 ingrediente'
                  : `Agregar ${totalSeleccionados} ingredientes`}
              </Text>
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
    height: '86%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: espaciado.md,
    paddingHorizontal: espaciado.md,
    paddingBottom: espaciado.md,
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
  bannerBamx: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.oliva,
    borderRadius: radios.md,
    padding: 12,
    marginBottom: 12,
  },
  bannerIcono: {
    fontSize: 26,
    marginRight: 12,
  },
  bannerTitulo: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 14,
  },
  bannerTexto: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  bannerFlecha: {
    color: colors.textoSobreColor,
    fontSize: 28,
    marginLeft: 8,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radios.pill,
    borderWidth: 1,
    borderColor: colors.borde,
    paddingHorizontal: espaciado.md,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textoPrincipal,
  },
  limpiar: {
    fontSize: 16,
    color: colors.textoSecundario,
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
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  botonConfirmar: {
    backgroundColor: colors.terracota,
    borderRadius: radios.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonInactivo: {
    backgroundColor: '#B9B0A0', // gris cálido: el texto blanco se sigue leyendo bien
  },
  textoConfirmar: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 15,
  },
});