import {
  LIMITES,
  esEnlaceVideoSeguro,
  limpiarBusqueda,
  limpiarTexto,
  validarCantidad,
  validarComentario,
  validarTextoLibre,
} from '../entradas';

// Se corre con:  npm test -- entradas

describe('limpiarBusqueda', () => {
  it('A1 recorta espacios al inicio y al final', () => {
    expect(limpiarBusqueda('  tomate  ')).toBe('tomate');
  });
  it('A1b colapsa espacios, tabulaciones y saltos de línea', () => {
    expect(limpiarBusqueda('sopa   de\t\nlentejas')).toBe('sopa de lentejas');
  });
  it('A2 quita los comodines: "100%" y "a_b" no se interpretan como patrón', () => {
    expect(limpiarBusqueda('100%')).toBe('100');
    expect(limpiarBusqueda('a_b')).toBe('a b');
    expect(limpiarBusqueda('arro*')).toBe('arro');
    expect(limpiarBusqueda('a\\b')).toBe('a b');
  });
  it('A2b un "%" solo deja la búsqueda vacía (no se filtra nada)', () => {
    expect(limpiarBusqueda('%')).toBe('');
    expect(limpiarBusqueda('%%%___')).toBe('');
  });
  it('A3 quita comas y paréntesis que separan filtros', () => {
    expect(limpiarBusqueda('tomate,cebolla)')).toBe('tomate cebolla');
    expect(limpiarBusqueda('a),(id.gt.0')).toBe('a id.gt.0');
  });
  it('A4 recorta a 60 caracteres', () => {
    expect(limpiarBusqueda('a'.repeat(200))).toHaveLength(LIMITES.busqueda);
  });
  it('A4b no parte un emoji a la mitad', () => {
    const r = limpiarBusqueda('🍅'.repeat(100));
    expect(Array.from(r)).toHaveLength(60);
    expect(r.includes('�')).toBe(false);
  });
  it('A5 solo espacios = vacío', () => {
    expect(limpiarBusqueda('     ')).toBe('');
    expect(limpiarBusqueda('')).toBe('');
  });
  it('A6 elimina caracteres invisibles', () => {
    expect(limpiarBusqueda('to​ma‍te')).toBe('tomate');
    expect(limpiarBusqueda('﻿tomate')).toBe('tomate');
    expect(limpiarBusqueda('to‮mate')).toBe('tomate');
    expect(limpiarBusqueda('to\u0000mate')).toBe('tomate');
  });
  it('conserva acentos y ñ', () => {
    expect(limpiarBusqueda('Limón y piña')).toBe('Limón y piña');
  });
  it('normaliza acentos compuestos (NFC)', () => {
    expect(limpiarBusqueda('Limón')).toBe('Limón');
  });
  it('un texto con HTML solo pierde los paréntesis y sigue siendo texto plano', () => {
    expect(limpiarBusqueda('<script>alert(1)</script>')).toBe('<script>alert 1 </script>');
  });
  it('no truena con null o undefined', () => {
    expect(limpiarBusqueda(undefined as any)).toBe('');
    expect(limpiarBusqueda(null as any)).toBe('');
  });
});

describe('limpiarTexto', () => {
  it('multilínea conserva saltos pero máximo dos seguidos', () => {
    expect(limpiarTexto('hola\n\n\n\nmundo', 100, { multilinea: true })).toBe('hola\n\nmundo');
  });
  it('una línea convierte saltos en espacio', () => {
    expect(limpiarTexto('hola\nmundo', 100)).toBe('hola mundo');
  });
  it('convierte \\r\\n en salto simple', () => {
    expect(limpiarTexto('a\r\nb', 100, { multilinea: true })).toBe('a\nb');
  });
});

describe('validarComentario', () => {
  it('rechaza vacío o solo espacios', () => {
    expect(validarComentario('   ').ok).toBe(false);
    expect(validarComentario('​​').ok).toBe(false);
  });
  it('A14 recorta a 500 caracteres', () => {
    const r = validarComentario('x'.repeat(501));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valor).toHaveLength(LIMITES.comentario);
  });
  it('acepta un comentario normal con salto de línea', () => {
    const r = validarComentario('Quedó rica.\nLa repito.');
    expect(r).toEqual({ ok: true, valor: 'Quedó rica.\nLa repito.' });
  });
});

describe('validarTextoLibre', () => {
  it('rechaza si queda más corto que el mínimo', () => {
    expect(validarTextoLibre('ab', 'El nombre', 3, 80).ok).toBe(false);
  });
  it('acepta dentro del rango y limpia', () => {
    expect(validarTextoLibre('  Sopa   rica ', 'El nombre', 3, 80)).toEqual({ ok: true, valor: 'Sopa rica' });
  });
  it('con mínimo 1 el mensaje pide escribir algo', () => {
    const r = validarTextoLibre('  ', 'un motivo', 1, 200);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Escribe un motivo.');
  });
});

describe('validarCantidad', () => {
  it('A12 rechaza negativos, cero, texto, notación científica y números enormes', () => {
    for (const v of ['-1', '0', 'abc', '1e9', '1000000', '', ' ', '1.234', '--1', '1..5', 'Infinity', 'NaN']) {
      expect(validarCantidad(v).ok).toBe(false);
    }
  });
  it('A12b rechaza números no finitos o gigantes', () => {
    expect(validarCantidad(NaN).ok).toBe(false);
    expect(validarCantidad(Infinity).ok).toBe(false);
    expect(validarCantidad(1e21).ok).toBe(false);
    expect(validarCantidad(-3).ok).toBe(false);
  });
  it('A13 acepta coma decimal', () => {
    expect(validarCantidad('1,5')).toEqual({ ok: true, valor: 1.5 });
    expect(validarCantidad(' 2 ')).toEqual({ ok: true, valor: 2 });
    expect(validarCantidad('0.25')).toEqual({ ok: true, valor: 0.25 });
  });
  it('acepta el máximo y rechaza uno más', () => {
    expect(validarCantidad('100000').ok).toBe(true);
    expect(validarCantidad('100000.01').ok).toBe(false);
  });
  it('un número con error de punto flotante se redondea', () => {
    expect(validarCantidad(0.1 + 0.2)).toEqual({ ok: true, valor: 0.3 });
  });
  it('respeta un máximo personalizado', () => {
    expect(validarCantidad('50', { max: 20 }).ok).toBe(false);
  });
});

describe('esEnlaceVideoSeguro', () => {
  it('acepta enlaces https de YouTube', () => {
    expect(esEnlaceVideoSeguro('https://www.youtube.com/watch?v=abc123')).toBe(true);
    expect(esEnlaceVideoSeguro('https://youtu.be/abc123')).toBe(true);
    expect(esEnlaceVideoSeguro('https://m.youtube.com/watch?v=abc')).toBe(true);
  });
  it('rechaza otros esquemas y otros sitios', () => {
    for (const u of [
      'javascript:alert(1)',
      'http://www.youtube.com/watch?v=abc',
      'intent://scan/#Intent;scheme=zxing;end',
      'file:///etc/passwd',
      'https://youtube.com.evil.com/watch',
      'https://evil.com/?https://youtube.com/',
      'https://www.youtube.com/watch?v=a b',
      '',
    ]) {
      expect(esEnlaceVideoSeguro(u)).toBe(false);
    }
  });
  it('rechaza null, undefined y enlaces larguísimos', () => {
    expect(esEnlaceVideoSeguro(null)).toBe(false);
    expect(esEnlaceVideoSeguro(undefined)).toBe(false);
    expect(esEnlaceVideoSeguro('https://youtu.be/' + 'a'.repeat(400))).toBe(false);
  });
});