import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { colors, espaciado, radios, tipografia } from '../../theme/theme';
import { AlacenaItem } from '../../types/alacena';
import { UnidadUI, aBase, convertirUI, desdeBase, opcionesUnidad } from '../../lib/unidades';
import { mostrarAviso } from '../../lib/avisos';
import { etiquetaPasillo } from '../../constants/categorias';
import { SelectorUnidad } from './selectorUnidad';
import { IngredienteImagen } from './ingredienteImagen';

interface Props {
  item: AlacenaItem | null;
  onCerrar: () => void;
  onGuardar: (item: AlacenaItem, cantidadBase: number, usarPronto: boolean) => Promise<void>;
  onEliminar: (item: AlacenaItem) => void;
}

function aTexto(n: number): string {
  return Number(n.toFixed(2)).toString();
}

export function EditarItemModal({ item, onCerrar, onGuardar, onEliminar }: Props) {
  const [texto, setTexto] = useState('');
  const [unidad, setUnidad] = useState<UnidadUI>('pza');
  const [usarPronto, setUsarPronto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (item) {
      const { valor, unidad: u } = desdeBase(item.cantidad, item.ingredientes.unidad);
      setTexto(aTexto(valor));
      setUnidad(u);
      setUsarPronto(item.usar_pronto);
      setGuardando(false);
    }
  }, [item]);

  if (!item) return null;
  const ing = item.ingredientes;

  function cambiarUnidad(nueva: UnidadUI) {
    const actual = parseFloat(texto.replace(',', '.'));
    if (Number.isFinite(actual)) setTexto(aTexto(convertirUI(actual, unidad, nueva)));
    setUnidad(nueva);
  }

  async function guardar() {
    const valor = parseFloat(texto.replace(',', '.'));
    if (!Number.isFinite(valor) || valor <= 0) {
      mostrarAviso('Cantidad no válida', 'Escribe un número mayor a 0.');
      return;
    }
    setGuardando(true);
    await onGuardar(item!, aBase(valor, unidad), usarPronto);
    setGuardando(false);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCerrar}>
      <View style={estilos.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCerrar} />

        <View style={estilos.tarjeta}>
          <View style={estilos.cabecera}>
            <IngredienteImagen
              nombre={ing.nombre}
              categoria={ing.categoria}
              url={ing.imagen_url}
              tamano={56}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={tipografia.titulo}>{ing.nombre}</Text>
              <Text style={tipografia.chico}>{etiquetaPasillo(ing.categoria ?? 'otros')}</Text>
            </View>
            <Pressable onPress={onCerrar} hitSlop={10}>
              <Text style={estilos.cerrar}>✕</Text>
            </Pressable>
          </View>

          <Text style={estilos.etiqueta}>Cantidad que tienes</Text>
          <View style={estilos.filaCantidad}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              keyboardType="decimal-pad"
              style={estilos.input}
              selectTextOnFocus
            />
            <SelectorUnidad
              opciones={opcionesUnidad(ing.unidad)}
              seleccionada={unidad}
              onCambiar={cambiarUnidad}
            />
          </View>

          <View style={estilos.filaPronto}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={tipografia.subtitulo}>Usar pronto</Text>
              <Text style={tipografia.chico}>Márcalo si se va a echar a perder pronto.</Text>
            </View>
            <Switch
              value={usarPronto}
              onValueChange={setUsarPronto}
              trackColor={{ false: colors.borde, true: colors.oliva }}
              thumbColor={colors.surface}
            />
          </View>

          <Pressable onPress={guardar} disabled={guardando} style={[estilos.botonGuardar, guardando && { opacity: 0.6 }]}>
            <Text style={estilos.textoGuardar}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Text>
          </Pressable>

          <Pressable onPress={() => onEliminar(item)} style={estilos.botonEliminar}>
            <Text style={estilos.textoEliminar}>🗑️  Eliminar de mi alacena</Text>
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
    justifyContent: 'center',
    padding: espaciado.md,
  },
  tarjeta: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: espaciado.md,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espaciado.md,
  },
  iconoCaja: {
    width: 56,
    height: 56,
    borderRadius: radios.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icono: {
    fontSize: 30,
  },
  cerrar: {
    fontSize: 20,
    color: colors.textoSecundario,
  },
  etiqueta: {
    ...tipografia.chico,
    marginBottom: 6,
  },
  filaCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  input: {
    width: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textoPrincipal,
  },
  filaPronto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radios.md,
    padding: 12,
    marginBottom: espaciado.md,
  },
  botonGuardar: {
    backgroundColor: colors.terracota,
    borderRadius: radios.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoGuardar: {
    color: colors.textoSobreColor,
    fontWeight: '700',
    fontSize: 15,
  },
  botonEliminar: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  textoEliminar: {
    color: colors.vino,
    fontWeight: '600',
    fontSize: 14,
  },
});