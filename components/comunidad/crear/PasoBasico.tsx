import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Icono from '../../Icono';
import { FormularioReceta } from '../../../hooks/useCrearReceta';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../../theme/theme';

interface Props {
  form: FormularioReceta;
  actualizar: (cambios: Partial<FormularioReceta>) => void;
  onFoto: () => void;
}

interface ContadorProps {
  etiqueta: string;
  valor: number;
  texto: string;
  min: number;
  max: number;
  paso: number;
  onCambiar: (valor: number) => void;
}

function Contador({ etiqueta, valor, texto, min, max, paso, onCambiar }: ContadorProps) {
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View style={estilos.contador}>
        <Pressable
          onPress={() => onCambiar(Math.max(min, valor - paso))}
          disabled={valor <= min}
          hitSlop={8}
          style={[estilos.botonMenos, valor <= min && estilos.apagado]}
          accessibilityLabel={`Menos ${etiqueta.toLowerCase()}`}
        >
          <Icono nombre="minus-linear" size={16} color={colors.primario} />
        </Pressable>
        <Text style={estilos.valor}>{texto}</Text>
        <Pressable
          onPress={() => onCambiar(Math.min(max, valor + paso))}
          disabled={valor >= max}
          hitSlop={8}
          style={[estilos.botonMas, valor >= max && estilos.apagado]}
          accessibilityLabel={`Más ${etiqueta.toLowerCase()}`}
        >
          <Icono nombre="add-linear" size={16} color={colors.sobrePrimario} />
        </Pressable>
      </View>
    </View>
  );
}

export function PasoBasico({ form, actualizar, onFoto }: Props) {
  const pasoTiempo = form.tiempo < 10 ? 1 : 5;

  return (
    <View style={estilos.contenedor}>
      <Pressable onPress={onFoto} style={estilos.foto} accessibilityRole="button" accessibilityLabel={form.fotoUri ? "Cambiar foto" : "Agregar foto"}>
        {form.fotoUri ? (
          <>
            <Image source={{ uri: form.fotoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={estilos.cambiarFoto}>
              <Icono nombre="camera-linear" size={16} color={colors.sobrePrimario} />
              <Text style={estilos.textoCambiar}>Cambiar foto</Text>
            </View>
          </>
        ) : (
          <>
            <View style={estilos.iconoFoto}>
              <Icono nombre="gallery-add-linear" size={28} color={colors.calidoIntenso} />
            </View>
            <Text style={estilos.tituloFoto}>Agregar foto</Text>
            <Text style={tipografia.chico}>Cámara o galería · opcional</Text>
          </>
        )}
      </Pressable>

      <View style={estilos.campo}>
        <Text style={estilos.etiqueta}>Nombre de la receta</Text>
        <TextInput
          style={estilos.input}
          value={form.nombre}
          onChangeText={(nombre) => actualizar({ nombre })}
          placeholder="Ej. Frijoles de la olla"
          placeholderTextColor={colors.textoSuave}
          maxLength={100}
          autoComplete="off"
          importantForAutofill="no"
        />
      </View>

      <View style={estilos.campo}>
        <Text style={estilos.etiqueta}>
          Cuéntanos de tu receta <Text style={tipografia.chico}>(opcional)</Text>
        </Text>
        <TextInput
          style={[estilos.input, estilos.multilinea]}
          value={form.descripcion}
          onChangeText={(descripcion) => actualizar({ descripcion })}
          placeholder="¿De dónde viene? ¿Para quién la cocinas?"
          placeholderTextColor={colors.textoSuave}
          maxLength={1000}
          multiline
          textAlignVertical="top"
          autoComplete="off"
          importantForAutofill="no"
        />
      </View>

      <View style={estilos.filaContadores}>
        <Contador
          etiqueta="Tiempo"
          valor={form.tiempo}
          texto={`${form.tiempo} min`}
          min={1}
          max={600}
          paso={pasoTiempo}
          onCambiar={(tiempo) => actualizar({ tiempo })}
        />
        <Contador
          etiqueta="Porciones"
          valor={form.porciones}
          texto={String(form.porciones)}
          min={1}
          max={50}
          paso={1}
          onCambiar={(porciones) => actualizar({ porciones })}
        />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    gap: espaciado.md,
  },
  foto: {
    height: 180,
    borderRadius: radios.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.calido,
    backgroundColor: colors.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  iconoFoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.calidoSuave,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tituloFoto: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.textoSuave,
  },
  cambiarFoto: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.vidrio,
    borderWidth: 1,
    borderColor: colors.vidrioBorde,
    borderRadius: radios.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  textoCambiar: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.chico,
    color: colors.sobrePrimario,
  },
  campo: {
    gap: 6,
  },
  etiqueta: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
  },
  input: {
    ...tipografia.cuerpo,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  multilinea: {
    minHeight: 100,
  },
  filaContadores: {
    flexDirection: 'row',
    gap: espaciado.sm,
  },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    paddingHorizontal: 10,
    height: 52,
  },
  botonMenos: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMas: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apagado: {
    opacity: 0.35,
  },
  valor: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
});