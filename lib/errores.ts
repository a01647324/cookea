//errores alacena
export function textoError(e: { code?: string; message?: string } | null | undefined): string {
  if (__DEV__ && e) {
    console.log('[alacena] error de Supabase:', e.code, e.message);
  }

  switch (e?.code) {
    case '23505':
      return 'Ese ingrediente ya está en tu alacena.';
    case '23514':
      return 'Alguna cantidad no es válida. Revisa los números e inténtalo de nuevo.';
    case '42501':
      return 'No tienes permiso para hacer eso. Cierra sesión, vuelve a entrar e inténtalo otra vez.';
  }

  const m = (e?.message ?? '').toLowerCase();
  if (m.includes('fetch') || m.includes('network')) {
    return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return 'Algo salió mal. Inténtalo de nuevo en un momento.';
}