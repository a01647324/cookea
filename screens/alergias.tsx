import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Alergeno = {
    id: number;
    nombre: string;
};

export default function Alergias() {
    const [alergenos, setAlergenos] = useState<Alergeno[]>([]);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
    cargarAlergenos();
    }, []);

    async function cargarAlergenos() {
    const { data, error } = await supabase
        .from('alergenos')
        .select('id, nombre')
        .order('id');

    if (error) {
        Alert.alert('Error', error.message);
    } else {
        setAlergenos(data || []);
    }

    setCargando(false);
    }

    function seleccionarAlergeno(id: number) {
    if (seleccionados.includes(id)) {
        setSeleccionados(seleccionados.filter(item => item !== id));
    } else {
        setSeleccionados([...seleccionados, id]);
    }
    }

    async function guardarAlergias() {
    console.log('Funciona?')
    setGuardando(true);

    const {
    data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
    Alert.alert(
        'Inicio de sesión requerido',
        'Debes inicar sesión para guardar tus alergias.'
    );
    setGuardando(false);
    return;
    }

    // Borra las alergias anteriores del usuario
    const { error: deleteError } = await supabase
    .from('usuario_alergias')
    .delete()
    .eq('usuario_id', user.id);

    if (deleteError) {
    Alert.alert('Error', deleteError.message);
    setGuardando(false);
    return;
    }

    // Prepara las alergias seleccionadas
    const registros = seleccionados.map(alergenoId => ({
    alergeno_id: alergenoId,
    }));

    // Guarda las nuevas alergias
    if (registros.length > 0) {
    const { error: insertError } = await supabase
        .from('usuario_alergias')
        .insert(registros);

    if (insertError) {
        Alert.alert('Error', insertError.message);
        setGuardando(false);
        return;
    }
    }

    Alert.alert(
    '¡Listo!',
    'Tus alergias se guardaron correctamente'
    );

    setGuardando(false);
    }

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando alergias...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Alergias alimentarias</Text>

      <Text style={styles.subtitle}>
        Selecciona las alergias que tengas. Esto nos ayudará a personalizar tus recetas
      </Text>

      <View style={styles.options}>
        {alergenos.map(alergeno => {
          const seleccionado = seleccionados.includes(alergeno.id);

          return (
            <TouchableOpacity
              key={alergeno.id}
              style={[
                styles.option,
                seleccionado && styles.optionSelected,
              ]}
              onPress={() => seleccionarAlergeno(alergeno.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  seleccionado && styles.checkboxSelected,
                ]}
              >
                {seleccionado && <Text style={styles.check}>✓</Text>}
              </View>

              <Text style={styles.optionText}>{alergeno.nombre}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={guardarAlergias}
        disabled={guardando}
      >
        <Text style={styles.buttonText}>
          {guardando ? 'Guardando...' : 'Guardar alergias'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 30,
        paddingTop: 70,
        backgroundColor: '#F7F5F0',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
    marginTop: 10,
    },

    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 16,
        marginBottom: 30,
        lineHeight: 22,
    },

    options: {
    gap: 12,
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        backgroundColor: 'white',
    },

    optionSelected: {
        borderColor: '#333',
    },

    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#AAA',
        borderRadius: 6,
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkboxSelected: {
        backgroundColor: '#333',
        borderColor: '#333',
    },

    check: {
        color: 'white',
        fontWeight: 'bold',
    },

    optionText: {
    fontSize: 17,
    },

    button: {
        marginTop: 30,
        padding: 17,
        borderRadius: 12,
        backgroundColor: '#333',
        alignItems: 'center'
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
});