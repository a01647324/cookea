import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { HojaInferior } from '../HojaInferior';
import Icono from '../Icono';
import { AlacenaItem } from '../../types/alacena';
import { UnidadUI, aBase, convertirUI, desdeBase, opcionesUnidad } from '../../lib/unidades';
import { mostrarAviso } from '../../lib/avisos';
import { validarCantidad } from '../../lib/entradas';
import { etiquetaPasillo, haceCuanto } from '../../constants/categorias';
import { SelectorUnidad } from './selectorUnidad';
import { IngredienteImagen } from './ingredienteImagen';
import { colors, espaciado, fuentes, radios, tamanos } from '../../theme/theme';

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
  const [actual, setActual] = useState<AlacenaItem | null>(item);
  const [texto, setTexto] = useState('');
  const [unidad, setUnidad] = useState<UnidadUI>('pza');
  const [usarPronto, setUsarPronto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!item) return;
    const { valor, unidad: u } = desdeBase(item.cantidad, item.ingredientes.unidad);
    setActual(item);
    setTexto(aTexto(valor));
    setUnidad(u);
    setUsarPronto(item.usar_pronto);
    setGuardando(false);
  }, [item]);

  function cambiarUnidad(nueva: UnidadUI) {
    const valor = parseFloat(texto.replace(',', '.'));
    if (Number.isFinite(valor)) setTexto(aTexto(convertirUI(valor, unidad, nueva)));
    setUnidad(nueva);
  }

  async function guardar() {
    const r = validarCantidad(texto);
    if (!r.ok) {
      mostrarAviso('Cantidad no válida', r.error);
      return;
    }
    setGuardando(true);
    await onGuardar(item!, aBase(r.valor, unidad), usarPronto);
    setGuardando(false);
  }

  const ing = actual?.ingredientes;

  return (
    <HojaInferior visible={!!item} onCerrar={onCerrar}>
      {actual && ing && (
        <>
          <View style={estilos.cabecera}>
            <IngredienteImagen
              nombre={ing.nombre}
              categoria={ing.categoria}
              url={ing.imagen_url}
              tamano={64}
              style={{ borderRadius: 32 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombre}>{ing.nombre}</Text>
              <Text style={estilos.meta}>
                {etiquetaPasillo(ing.categoria ?? 'otros')} · {haceCuanto(actual.agregado_en)}
              </Text>
            </View>
          </View>

          <Text style={estilos.etiqueta}>Cantidad que tienes</Text>
          <View style={estilos.filaCantidad}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              keyboardType="decimal-pad"
              maxLength={10}
              style={estilos.input}
              selectTextOnFocus
              autoComplete="off"
              importantForAutofill="no"
            />
            <SelectorUnidad opciones={opcionesUnidad(ing.unidad)} seleccionada={unidad} onCambiar={cambiarUnidad} />
          </View>

          <View style={estilos.filaPronto}>
            <View style={estilos.circuloPronto}>
              <Icono nombre="hourglass-linear" size={22} color={colors.destacadoIntenso} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tituloPronto}>Usar pronto</Text>
              <Text style={estilos.meta}>Márcalo si se va a echar a perder.</Text>
            </View>
            <Switch
              value={usarPronto}
              onValueChange={setUsarPronto}
              trackColor={{ false: colors.borde, true: colors.encabezado }}
              thumbColor={colors.superficie}
            />
          </View>

          <Pressable
            onPress={guardar}
            disabled={guardando}
            style={[estilos.botonGuardar, guardando && { opacity: 0.6 }]}
          >
            {guardando ? (
              <ActivityIndicator color={colors.sobreEncabezado} />
            ) : (
              <Text style={estilos.textoGuardar}>Guardar cambios</Text>
            )}
          </Pressable>

          <Pressable onPress={() => onEliminar(actual)} style={estilos.botonEliminar}>
            <Icono nombre="trash-bin-trash-linear" size={20} color={colors.peligro} />
            <Text style={estilos.textoEliminar}>Quitar de mi alacena</Text>
          </Pressable>
        </>
      )}
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: espaciado.lg,
  },
  nombre: {
    fontFamily: fuentes.titulo,
    fontSize: 22,
    lineHeight: 29,
    color: colors.texto,
  },
  meta: {
    fontFamily: fuentes.regular,
    fontSize: tamanos.chico,
    lineHeight: 19,
    color: colors.textoSuave,
  },
  etiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    color: colors.textoSuave,
    marginBottom: espaciado.sm,
  },
  filaCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciado.sm,
    backgroundColor: colors.superficie,
    borderRadius: 20,
    padding: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: colors.fondo,
    borderRadius: radios.md,
    paddingHorizontal: espaciado.md,
    fontFamily: fuentes.negrita,
    fontSize: 20,
    color: colors.texto,
  },
  filaPronto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: 20,
    padding: espaciado.sm,
    paddingRight: espaciado.md,
    marginBottom: espaciado.lg,
  },
  circuloPronto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.destacadoSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloPronto: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  botonGuardar: {
    minHeight: 54,
    borderRadius: radios.pill,
    backgroundColor: colors.encabezado,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoGuardar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobreEncabezado,
  },
  botonEliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    marginTop: espaciado.xs,
  },
  textoEliminar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.peligro,
  },
});
