import { expect, test } from '@jest/globals';
import { indexarCatalogo, buscarCatalogo } from '../../perfil/busquedaCatalogo';
import { prepararCorreoAcceso, consumirCorreoAcceso } from '../correoAcceso';
test('búsqueda tolera mayúsculas, acentos y espacios sin cambiar el catálogo', () => {
 const opciones = [{id:1,nombre:'Limón'}, {id:2,nombre:'Arroz'}];
 const indice = indexarCatalogo(opciones);
 expect(buscarCatalogo(indice, ' LIMON ')).toEqual([opciones[0]]);
 expect(buscarCatalogo(indice, '')).toEqual(opciones);
 expect(buscarCatalogo(indice, 'papaya')).toEqual([]);
 expect(opciones[0].nombre).toBe('Limón');
});
test('el correo del registro se consume una sola vez', () => {
 prepararCorreoAcceso('prueba@ejemplo.invalid');
 expect(consumirCorreoAcceso()).toBe('prueba@ejemplo.invalid');
 expect(consumirCorreoAcceso()).toBe('');
});
