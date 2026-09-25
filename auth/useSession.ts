import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// useSession: dice si hay alguien con sesión iniciada.
// App.tsx lo usa para decidir si mostrar Login o Home.
export default function useSession() {
  // (nuevo) En Supabase la "sesión" trae al usuario y sus tokens.
  // Si es null, nadie ha iniciado sesión.
  const [session, setSession] = useState<Session | null>(null);

  // Mientras leemos la sesión guardada en el celular, mostramos un indicador
  // de carga para que no aparezca el Login por un instante sin razón.
  const [cargando, setCargando] = useState(true);

  // (clase) Igual que onAuthStateChanged: un useEffect con [] que corre una
  // sola vez cuando se abre la app.
  useEffect(() => {
    // (nuevo) Leemos la sesión que quedó guardada (AsyncStorage) de la última
    // vez que se abrió la app. Así el usuario no tiene que volver a iniciar sesión.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    // (clase/nuevo) Equivalente a onAuthStateChanged de Firebase: nos avisa
    // cada vez que alguien inicia o cierra sesión.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
    });

    // (nuevo) Al desmontar, cancelamos la suscripción para no seguir
    // escuchando cambios de una pantalla que ya no existe.
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Función para cerrar sesión, lista para que el equipo la use (por ejemplo,
  // en un botón de Perfil). No hace falta navegar: onAuthStateChange detecta
  // el cambio y App.tsx regresa solo al Login.
  async function cerrarSesion() {
    try {
      // (nuevo) Supabase no lanza el error, lo regresa en { error }.
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("No se pudo cerrar sesión. Intenta de nuevo.");
      }
    } catch (e) {
      // (clase) "fail gracefully": si algo inesperado falla (por ejemplo, sin internet)
      alert("Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  return { session, cargando, cerrarSesion };
}
