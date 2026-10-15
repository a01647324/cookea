import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import Icono from '../Icono';
import { HojaInferior } from '../HojaInferior';
import { EstadoEnvio } from './EstadoEnvio';
import { useCalificacion } from '../../hooks/useCalificacion';
import { MAX_COMENTARIO } from '../../hooks/useComentarios';
import { colors, espaciado, fuentes, radios, tamanos, tipografia } from '../../theme/theme';

interface Props {
  visible: boolean;
  recetaId: number;
  nombre: string;
  autorAlias: string;
  fotoUrl: string | null;
  onCerrar: () => void;
  onEnviada: () => void;
}

const PALABRAS = ['', 'No me gustó', 'Regular', 'Buena', '¡Muy rica!', '¡Me encantó!'];

type Fase = 'formulario' | 'exito' | 'error';

export function ModalCalificar({ visible, recetaId, nombre, autorAlias, fotoUrl, onCerrar, onEnviada }: Props) {
  const { miCalificacion, enviando, enviar } = useCalificacion(recetaId);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [fase, setFase] = useState<Fase>('formulario');

  // Solo se reinicia al ABRIR el modal, no cada vez que cambia miCalificacion
  useEffect(() => {
    if (!visible) return;
    setFase('formulario');
    setComentario('');
    setEstrellas(miCalificacion ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Si la calificación previa llega después de abrir, se rellena una sola vez
  useEffect(() => {
    if (visible && fase === 'formulario' && estrellas === 0 && miCalificacion) {
      setEstrellas(miCalificacion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miCalificacion]);

  const alEnviar = async () => {
    const ok = await enviar(estrellas, comentario);
    setFase(ok ? 'exito' : 'error');
    if (ok) onEnviada();
  };

  return (
    <HojaInferior visible={visible} onCerrar={onCerrar}>
      {fase === 'exito' ? (
        <EstadoEnvio
          tipo="exito"
          titulo="¡Gracias por calificar!"
          mensaje="Tu opinión ayuda a otras familias a elegir qué cocinar."
          onCerrar={onCerrar}
        />
      ) : fase === 'error' ? (
        <EstadoEnvio
          tipo="error"
          titulo="No se pudo enviar"
          mensaje="Revisa tu conexión a internet e intenta de nuevo."
          onCerrar={onCerrar}
          onReintentar={alEnviar}
        />
      ) : (
        <View style={estilos.contenido}>
          <View style={estilos.receta}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={estilos.miniatura} contentFit="cover" />
            ) : (
              <View style={[estilos.miniatura, estilos.miniaturaRespaldo]}>
                <Icono nombre="chef-hat-linear" size={22} color={colors.superficie} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={estilos.nombre} numberOfLines={1}>{nombre}</Text>
              {!!autorAlias && <Text style={tipografia.chico}>por {autorAlias}</Text>}
            </View>
          </View>

          <Text style={estilos.titulo}>¿Cómo te quedó?</Text>

          <View style={estilos.filaEstrellas}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setEstrellas(n)}
                hitSlop={4}
                accessibilityRole="radio"
                accessibilityState={{ selected: n === estrellas }}
                accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              >
                <Icono
                  nombre={n <= estrellas ? 'star-bold' : 'star-linear'}
                  size={42}
                  color={n <= estrellas ? colors.calido : colors.textoTenue}
                />
              </Pressable>
            ))}
          </View>
          <Text style={estilos.palabra}>{estrellas ? PALABRAS[estrellas] : 'Toca las estrellas'}</Text>

          <Text style={estilos.etiqueta}>
            Cuéntales cómo te quedó <Text style={tipografia.chico}>(opcional)</Text>
          </Text>
          <TextInput
            style={estilos.campo}
            placeholder="Por ejemplo: le puse menos sal y quedó perfecta"
            placeholderTextColor={colors.textoSuave}
            value={comentario}
            onChangeText={setComentario}
            maxLength={MAX_COMENTARIO}
            multiline
            textAlignVertical="top"
            autoComplete="off"
            importantForAutofill="no"
          />
          <Text style={estilos.contador}>
            {comentario.length} / {MAX_COMENTARIO}
          </Text>

          <Pressable
            onPress={alEnviar}
            disabled={estrellas === 0 || enviando}
            style={[estilos.boton, (estrellas === 0 || enviando) && estilos.botonDeshabilitado]}
          >
            {enviando ? (
              <ActivityIndicator color={colors.sobrePrimario} />
            ) : (
              <>
                <Icono nombre="star-linear" size={18} color={colors.sobrePrimario} />
                <Text style={estilos.textoBoton}>
                  {miCalificacion ? 'Actualizar calificación' : 'Enviar calificación'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </HojaInferior>
  );
}

const estilos = StyleSheet.create({
  contenido: {
    gap: 12,
  },
  receta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.superficie,
    borderRadius: radios.lg,
    padding: 10,
  },
  miniatura: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  miniaturaRespaldo: {
    backgroundColor: colors.neutro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.texto,
  },
  titulo: {
    ...tipografia.titulo,
    color: colors.primario,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  filaEstrellas: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  palabra: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.acentoOscuro,
    textAlign: 'center',
    minHeight: 22,
  },
  etiqueta: {
    fontFamily: fuentes.semibold,
    fontSize: tamanos.cuerpo,
    color: colors.texto,
    marginTop: espaciado.xs,
  },
  campo: {
    ...tipografia.cuerpo,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: radios.md,
    padding: 14,
    minHeight: 96,
  },
  contador: {
    ...tipografia.chico,
    textAlign: 'right',
    marginTop: -6,
  },
  boton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    backgroundColor: colors.primario,
    borderRadius: radios.pill,
    marginTop: espaciado.xs,
  },
  botonDeshabilitado: {
    opacity: 0.45,
  },
  textoBoton: {
    fontFamily: fuentes.negrita,
    fontSize: tamanos.destacado,
    color: colors.sobrePrimario,
  },
});