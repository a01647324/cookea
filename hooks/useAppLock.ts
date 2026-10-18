import {
    useCallback,
    useEffect,
    useRef,
    useState,
  } from 'react';
  
  import {
    AppState,
    AppStateStatus,
  } from 'react-native';
  
  import * as LocalAuthentication
    from 'expo-local-authentication';
  
  
  export function useAppLock(
    activo: boolean
  ) {
    const [bloqueada, setBloqueada] =
      useState(false);
  
    const [autenticando, setAutenticando] =
      useState(false);
  
    const estadoApp =
      useRef<AppStateStatus>(
        AppState.currentState
      );
  
  
    const autenticar =
      useCallback(async () => {
  
        if (!activo || autenticando) {
          return;
        }
  
        setAutenticando(true);
  
        try {
          const resultado =
            await LocalAuthentication
              .authenticateAsync({
                promptMessage:
                  'Desbloquear Cookea',
  
                cancelLabel:
                  'Cancelar',
  
                fallbackLabel:
                  'Usar método del dispositivo',
  
                disableDeviceFallback:
                  false,
              });
  
          if (resultado.success) {
            setBloqueada(false);
          } else {
            setBloqueada(true);
          }
  
        } catch (error) {
          console.log(
            '[seguridad] Error al autenticar:',
            error
          );
  
          setBloqueada(true);
  
        } finally {
          setAutenticando(false);
        }
  
      }, [activo, autenticando]);
  
    useEffect(() => {
      const suscripcion =
        AppState.addEventListener(
          'change',
          (siguienteEstado) => {
  
            const anterior =
              estadoApp.current;
  
            if (
              activo &&
              (
                siguienteEstado ===
                  'inactive' ||
                siguienteEstado ===
                  'background'
              )
            ) {
              setBloqueada(true);
            }
  
            if (
              activo &&
              anterior !== 'active' &&
              siguienteEstado === 'active'
            ) {
              void autenticar();
            }
  
            estadoApp.current =
              siguienteEstado;
          }
        );
  
      return () => {
        suscripcion.remove();
      };
  
    }, [activo, autenticar]);
  
  
    return {
      bloqueada,
      autenticando,
      autenticar,
    };
  }