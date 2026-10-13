import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HojaInferior } from '../HojaInferior';
import { ChipsFiltro } from '../alacena/chipsFiltro';
import { IngredienteImagen } from '../alacena/ingredienteImagen';
import { Stepper } from '../alacena/stepper';
import { SelectorUnidad } from '../alacena/selectorUnidad';
import { useIngredientes } from '../../hooks/useIngredientes';
import { IngredienteForm } from '../../hooks/useCrearReceta';
import { IngredienteCatalogo } from '../../types/alacena';
import { UnidadUI, convertirUI, formatearUI, opcionesUnidad, pasoUI, valorInicialUI } from '../../lib/unidades';
import { etiquetaPasillo, normalizar } from '../../constants/categorias';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../theme/theme';

interface Props {
  visible: boolean;
  existente: IngredienteForm | null;
  idsUsados: number[];
  onConfirmar: (item: IngredienteForm) => void;
  onQuitar: () => void;
  onCerrar: () => void;
}

const ALTO_LISTA = Dimensions.get('window').height * 0.5;

export function SelectorIngredienteReceta({ visible, existente, idsUsados, onConfirmar, onQuitar, onCerrar }: Props) {
  const { ingredientes, categorias, cargando, error, recargar } = useIngredientes(visible);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaElegida, setCategoriaElegida] = useState<string | null>(null);
  const [elegido, setElegido] = useState<IngredienteCatalogo | null>(null);
  const [valor, setValor] = useState(1);
  const [unidad, setUnidad] = useState<UnidadUI>('pieza' as UnidadUI);
  const [opcional, setOpcional] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setBusqueda('');
    setCategoriaElegida(null);
    if (existente) {
      setElegido(existente.ingrediente);
      setValor(existente.valor);
      setUnidad(existente.unidad);
      setOpcional(existente.opcional);
    } else {
      setElegido(null);
      setOpcional(false);
    }
  }, [visible, existente]);

  const buscando = busqueda.trim().length > 0;
  const categoriaActiva = categoriaElegida ?? categorias[0] ?? '';

  const visibles = useMemo(() => {
    const disponibles = ingredientes.filter((i) => !idsUsados.includes(i.id));
    if (buscando) {
      const q = normalizar(busqueda);
      return disponibles.filter((i) => normalizar(i.nombre).includes(q));
    }
    return disponibles.filter((i) => (i.categoria ?? 'Otros') === categoriaActiva);
  }, [ingredientes, idsUsados, busqueda, buscando, categoriaActiva]);

  const elegir = (ing: IngredienteCatalogo) => {
    const u = opcionesUnidad(ing.unidad)[0];
    setElegido(ing);
    setUnidad(u);
    setValor(valorInicialUI(u));
  };

  const cambiarUnidad = (u: UnidadUI) => {
    if (u === unidad) return;
    setValor(Math.max(pasoUI(u), convertirUI(valor, unidad, u)));
    setUnidad(u);
  };

  const paso = pasoUI(unidad);

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      {elegido ? (
        <View style={estilos.contenido}>
          <View style={estilos.encabezadoElegido}>
            {!existente && (
              <Pressable onPress={() => setElegido(null)} hitSlop={10} accessibilityLabel="Elegir otro">
                <Ionicons name="arrow-back" size={22} color={colors.primario} />
              </Pressable>
            )}
            <IngredienteImagen nombre={elegido.nombre} categoria={elegido.categoria} url={elegido.imagen_url} tamano={52} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombreElegido}>{elegido.nombre}</Text>
              <Text style={tipografia.chico}>{etiquetaPasillo(elegido.categoria ?? 'Otros')}</Text>
            </View>
          </View>

          <Text style={estilos.etiqueta}>¿Cuánto lleva?</Text>
          <View style={estilos.filaCantidad}>
            <Stepper
              texto={formatearUI(valor, unidad)}
              menosDeshabilitado={valor - paso < paso}
              onMenos={() => setValor((v) => Math.max(paso, Math.round((v - paso) * 100) / 100))}
              onMas={() => setValor((v) => Math.round((v + paso) * 100) / 100)}
            />
            <SelectorUnidad opciones={opcionesUnidad(elegido.unidad)} seleccionada={unidad} onCambiar={cambiarUnidad} />
          </View>

          <View style={estilos.filaOpcional}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.textoOpcional}>Es opcional</Text>
              <Text style={tipografia.chico}>Como sal, agua o aceite: se puede cocinar sin él.</Text>
            </View>
            <Switch
              value={opcional}
              onValueChange={setOpcional}
              trackColor={{ true: colors.acento, false: colors.fondoHundido }}
              thumbColor={colors.superficie}
            />
          </View>

          <Pressable
            onPress={() => onConfirmar({ ingrediente: elegido, valor, unidad, opcional })}
            style={estilos.botonPrimario}
          >
            <Text style={estilos.textoPrimario}>{existente ? 'Guardar cambios' : 'Agregar a la receta'}</Text>
          </Pressable>
          {existente && (
            <Pressable onPress={onQuitar} style={estilos.botonQuitar}>
              <Ionicons name="trash-outline" size={17} color={colors.peligro} />
              <Text style={estilos.textoQuitar}>Quitar de la receta</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={estilos.contenido}>
          <Text style={estilos.titulo}>Agregar ingrediente</Text>

          <View style={estilos.buscador}>
            <Ionicons name="search" size={18} color={colors.textoSuave} />
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              placeholder="Busca un ingrediente"
              placeholderTextColor={colors.textoSuave}
              style={estilos.input}
              autoComplete="off"
              importantForAutofill="no"
            />
            {buscando && (
              <Pressable onPress={() => setBusqueda('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textoSuave} />
              </Pressable>
            )}
          </View>

          {!buscando && categorias.length > 0 && (
            <ChipsFiltro
              opciones={categorias.map((c) => ({ clave: c, etiqueta: etiquetaPasillo(c) }))}
              seleccionada={categoriaActiva}
              onSeleccionar={setCategoriaElegida}
            />
          )}

          <View style={{ height: ALTO_LISTA }}>
            {cargando ? (
              <ActivityIndicator color={colors.acento} style={{ marginTop: espaciado.lg }} />
            ) : error ? (
              <Text style={estilos.mensaje} onPress={recargar}>
                No pudimos cargar los ingredientes. Toca para reintentar.
              </Text>
            ) : visibles.length === 0 ? (
              <Text style={estilos.mensaje}>
                {buscando ? `No encontramos "${busqueda}".` : 'No hay más ingredientes en esta categoría.'}
              </Text>
            ) : (
              <FlatList
                data={visibles}
                keyExtractor={(i) => String(i.id)}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: espaciado.sm, paddingVertical: espaciado.sm }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => elegir(item)} style={estilos.fila}>
                    <IngredienteImagen nombre={item.nombre} categoria={item.categoria} url={item.imagen_url} tamano={40} />
                    <Text style={estilos.nombreFila}>{item.nombre}</Text>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primario} />
                  </Pressable>
                )}
              />
            )}
          </View>
        </View>
      )}
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: 12,
  },
  titulo: {
    ...tipografia.titulo,
    fontSize: 21,
    color: colors.primario,
    textAlign: 'center',
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.pill,
    paddingHorizontal: espaciado.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: fuentes.regular,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  mensaje: {
    ...tipografia.cuerpo,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: espaciado.lg,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  nombreFila: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  encabezadoElegido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nombreElegido: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.enorme,
    color: colors.texto,
  },
  etiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    marginTop: espaciado.xs,
  },
  filaCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaciado.sm,
  },
  filaOpcional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    padding: 14,
  },
  textoOpcional: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  botonPrimario: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    marginTop: espaciado.xs,
  },
  textoPrimario: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
  botonQuitar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
  },
  textoQuitar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.peligro,
  },
});