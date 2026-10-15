import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icono from '../../Icono';
import { IngredienteImagen } from '../../alacena/ingredienteImagen';
import { FormularioReceta } from '../../../hooks/useCrearReceta';
import { formatearUI } from '../../../lib/unidades';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../../theme/theme';

interface Props {
  form: FormularioReceta;
  alergenos: string[];
  onAgregar: () => void;
  onEditar: (indice: number) => void;
}

export function PasoIngredientes({ form, alergenos, onAgregar, onEditar }: Props) {
  return (
    <View style={estilos.contenedor}>
      {form.ingredientes.length === 0 && (
        <View style={estilos.vacio}>
          <Text style={estilos.textoVacio}>Aún no agregas ingredientes</Text>
        </View>
      )}

      {form.ingredientes.map((item, indice) => (
        <Pressable
          key={item.ingrediente.id}
          onPress={() => onEditar(indice)}
          style={estilos.tarjeta}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${item.ingrediente.nombre}`}
        >
          <IngredienteImagen
            nombre={item.ingrediente.nombre}
            categoria={item.ingrediente.categoria}
            url={item.ingrediente.imagen_url}
            tamano={42}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={estilos.filaNombre}>
              <Text style={estilos.nombre}>{item.ingrediente.nombre}</Text>
              {item.opcional && (
                <View style={estilos.etiquetaOpcional}>
                  <Text style={estilos.textoOpcional}>opcional</Text>
                </View>
              )}
            </View>
            <Text style={tipografia.chico}>{formatearUI(item.valor, item.unidad)}</Text>
          </View>
          <Icono nombre="pen-linear" size={20} color={colors.textoSuave} />
        </Pressable>
      ))}

      {form.ingredientes.length < 40 && (
        <Pressable onPress={onAgregar} style={estilos.botonAgregar} accessibilityRole="button">
          <Icono nombre="add-linear" size={20} color={colors.primario} />
          <Text style={estilos.textoAgregar}>Agregar ingrediente</Text>
        </Pressable>
      )}

      {alergenos.length > 0 && (
        <View style={estilos.aviso}>
          <Icono nombre="danger-triangle-linear" size={18} color={colors.peligro} />
          <Text style={estilos.textoAviso}>
            Contiene: <Text style={{ fontFamily: fuentes.negrita }}>{alergenos.join(', ').toLowerCase()}</Text>.
            Lo mostraremos en tu receta.
          </Text>
        </View>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: 12,
  },
  vacio: {
    alignItems: 'center',
    paddingVertical: espaciado.md,
  },
  textoVacio: {
    ...tipografia.cuerpo,
    color: colors.textoSuave,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filaNombre: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  etiquetaOpcional: {
    backgroundColor: colors.fondoHundido,
    borderRadius: radios.pill,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  textoOpcional: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.mini,
    color: colors.textoSuave,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primario,
    borderRadius: radios.md,
  },
  textoAgregar: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.primario,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.peligroSuave,
    borderWidth: 1,
    borderColor: colors.peligroBorde,
    borderRadius: radios.md,
    padding: 12,
  },
  textoAviso: {
    flex: 1,
    fontFamily: fuentes.semibold,
    fontSize: tamanos.base,
    lineHeight: 20,
    color: colors.peligro,
  },
});