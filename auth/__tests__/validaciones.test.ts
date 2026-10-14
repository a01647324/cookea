import { describe, expect, test } from '@jest/globals';
import { esCorreoValido, limpiarCodigo, normalizarCorreo, validarNuevaContrasena } from '../validaciones';
import { calcularCambios, validarAlias, validarNombre } from '../../perfil/preferencias';
describe('validación antes de enviar credenciales', () => {
 test.each(['abcdefgh','12345678','abc1234',''])('rechaza composición o longitud inválida: %s', clave => { expect(validarNuevaContrasena(clave,clave)).not.toBeNull(); });
 test('acepta una letra y un número sin recortar ni transformar', () => { expect(validarNuevaContrasena('abc123  ','abc123  ')).toBeNull(); expect(validarNuevaContrasena('abc123  ','abc123')).not.toBeNull(); });
 test('acepta letras acentuadas', () => { expect(validarNuevaContrasena('óóóóóó12','óóóóóó12')).toBeNull(); });
 test('los emojis no cuentan como dos caracteres', () => { expect(validarNuevaContrasena('😀😀a123','😀😀a123')).not.toBeNull(); });
 test('exige confirmación igual', () => { expect(validarNuevaContrasena('abc12345','abc12346')?.campo).toBe('confirmacion'); });
 test.each(['ana@','ana@@correo.com','ana correo@ejemplo.com','correo'])('rechaza correo inválido: %s', correo => { expect(esCorreoValido(correo)).toBe(false); });
 test('normaliza correo y permite pegar código con separadores', () => { expect(normalizarCorreo(' Ana@Ejemplo.com ')).toBe('ana@ejemplo.com'); expect(limpiarCodigo('1234-5678')).toBe('12345678'); });
});
describe('preferencias y límites del perfil', () => {
 test('respeta los límites exactos de alias y nombre', () => { expect(validarAlias('ab')).not.toBeNull(); expect(validarAlias('abc')).toBeNull(); expect(validarNombre('a'.repeat(80))).toBeNull(); expect(validarNombre('a'.repeat(81))).not.toBeNull(); });
 test('cuenta caracteres Unicode como PostgreSQL', () => { expect(validarAlias('😀😀')).not.toBeNull(); expect(validarAlias('😀😀😀')).toBeNull(); });
 test('obtiene diferencias sin alterar el borrador ni la copia guardada', () => { const antes = new Set([1,2]); const despues = new Set([2,3]); expect(calcularCambios(antes,despues)).toEqual({agregar:[3],quitar:[1]}); expect([...antes]).toEqual([1,2]); expect([...despues]).toEqual([2,3]); });
});
