import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

// AUTH: clave con la que guardamos en el celular que la persona está a la mitad
// de recuperar su contraseña (paso 3). Así, si cierra la app, regresa a ese paso.
const CLAVE_RECUPERANDO = "cookea_recuperando";

// (nuevo) Guarda o borra el dato "recuperando" en AsyncStorage.
// Si falla, no detenemos la app: el dato en memoria sigue funcionando.
async function guardarRecuperando(valor: boolean) {
  try {
    if (valor) {
      await AsyncStorage.setItem(CLAVE_RECUPERANDO, "si");
    } else {
      await AsyncStorage.removeItem(CLAVE_RECUPERANDO);
    }
  } catch {
  }
}

// useSession: dice si hay alguien con sesión iniciada.
// App.tsx lo usa para decidir si mostrar Login o Home.
export default function useSession() {
  // (nuevo) En Supabase la "sesión" trae al usuario y sus tokens.
  // Si es null, nadie ha iniciado sesión.
  const [session, setSession] = useState<Session | null>(null);

  // Mientras leemos la sesión guardada en el celular, mostramos un indicador
  // de carga para que no aparezca el Login por un instante sin razón.
  const [cargando, setCargando] = useState(true);

  // AUTH: true cuando la sesión viene de "Recuperar clave" y todavía falta
  // escribir la nueva contraseña. App.tsx muestra solo NuevaContrasena.
  const [recuperando, setRecuperando] = useState(false);

  // (clase) Igual que onAuthStateChanged: un useEffect con [] que corre una
  // sola vez cuando se abre la app.
  useEffect(() => {
    let activo = true;
    let revision = 0;
    // (nuevo) Leemos la sesión que quedó guardada (AsyncStorage) de la última
    // vez que se abrió la app. Así el usuario no tiene que volver a iniciar sesión.
    // AUTH: también leemos "recuperando" ANTES de quitar el indicador de carga,
    // para no mostrar la Home un instante si estaba en el paso 3.
    async function leerDatosGuardados() {
      try {
        const { data } = await supabase.auth.getSession();
        const guardado = await AsyncStorage.getItem(CLAVE_RECUPERANDO);

        if (!activo || revision !== 0) return;
        if (guardado !== null && data.session !== null) {
          setRecuperando(true);
        } else if (guardado !== null) {
          // Quedó el dato pero ya no hay sesión: lo borramos y va al Login
          guardarRecuperando(false);
        }
        setSession(data.session);
      } catch {
      } finally {
        if (activo) setCargando(false);
      }
    }
    leerDatosGuardados();

    // (clase/nuevo) Equivalente a onAuthStateChanged de Firebase: nos avisa
    // cada vez que alguien inicia o cierra sesión.
    const { data } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      if (!activo) return;
      if (evento !== "INITIAL_SESSION") revision++;
      else if (revision !== 0) return;
      // AUTH: (nuevo) PASSWORD_RECOVERY llega cuando el código del correo fue
      // correcto. Supabase ya inició sesión, pero falta la nueva contraseña.
      if (evento === "PASSWORD_RECOVERY") {
        setRecuperando(true);
        guardarRecuperando(true);
      }
      // AUTH: si la sesión se cierra por cualquier motivo, ya no hay recuperación
      if (evento === "SIGNED_OUT") {
        setRecuperando(false);
        guardarRecuperando(false);
      }
      setSession(nuevaSesion);
    });

    // (nuevo) Al desmontar, cancelamos la suscripción para no seguir
    // escuchando cambios de una pantalla que ya no existe.
    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // Función para cerrar sesión, lista para que el equipo la use (por ejemplo,
  // en un botón de Perfil). No hace falta navegar: onAuthStateChange detecta
  // el cambio y App.tsx regresa solo al Login.
  async function cerrarSesion() {
    try {
      // (nuevo) Supabase no lanza el error, lo regresa en { error }.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        alert("No se pudo cerrar sesión. Intenta de nuevo.");
      }
    } catch {
      // (clase) "fail gracefully": si algo inesperado falla (por ejemplo, sin internet)
      alert("Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  // AUTH: se llama al tocar "Continuar" después de guardar la nueva contraseña.
  // Borra "recuperando" y App.tsx pasa a la Home.
  async function terminarRecuperacion() {
    await guardarRecuperando(false);
    setRecuperando(false);
  }

  // AUTH: se llama en cuanto la nueva contraseña se guardó, antes de mostrar
  // la pantalla de éxito. Solo borra el dato del celular; "recuperando" sigue
  // en true para que se vea el éxito. Si la persona cierra la app ahí, al
  // abrirla entra a la Home en vez de pedirle otra contraseña.
  async function olvidarRecuperacionGuardada() {
    await guardarRecuperando(false);
  }

  // AUTH: se llama al tocar "Cancelar" en el paso 3. Cierra la sesión de
  // recuperación y regresa al Login; la contraseña anterior sigue igual.
  async function cancelarRecuperacion() {
    try {
      // (nuevo) scope "local" cierra solo la sesión de este celular, no las
      // de otros dispositivos. Aunque no haya internet, Supabase borra la
      // sesión del celular y lanza SIGNED_OUT, así que siempre se regresa al Login.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
      }
    } catch {
    } finally {
      await guardarRecuperando(false);
      setRecuperando(false);
      setSession(null); // por si acaso, para que siempre se vea el Login
    }
  }

  return {
    session,
    cargando,
    cerrarSesion,
    recuperando,
    terminarRecuperacion,
    olvidarRecuperacionGuardada,
    cancelarRecuperacion,
  };
}
