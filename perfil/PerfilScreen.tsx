import useProteccionCapturas from "./useProteccionCapturas";
import { seleccionarSeccion, SeccionPreferencias } from "./secciones";
import { useCallback, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAlbums } from '../hooks/useAlbums';
import useSession from '../auth/useSession';
import { VistaCargando } from '../components/StateViews';
import { colors, fuentes, tipografia } from '../theme/theme';
import EliminarCuentaModal from './EliminarCuentaModal';

function nombres(filas: { alergenos: unknown }[]): string[] {
 return filas.flatMap(f => { const relacion = Array.isArray(f.alergenos) ? f.alergenos[0] : f.alergenos; return relacion && typeof relacion === 'object' && 'nombre' in relacion && typeof relacion.nombre === 'string' ? [relacion.nombre] : []; });
}
function Fila({ texto, onPress, peligro = false, flecha = true }: { texto: string; onPress: () => void; peligro?: boolean; flecha?: boolean }) {
 return <TouchableOpacity style={styles.fila} onPress={onPress} accessibilityRole="button" accessibilityLabel={texto}><Text style={[styles.textoFila,peligro && styles.peligro]}>{texto}</Text>{flecha && <Text style={styles.flecha}>›</Text>}</TouchableOpacity>;
}
export default function PerfilScreen({ navigation }: any) {
  useProteccionCapturas("perfil");
 const { session, cerrarSesion } = useSession();
 const { perfil, error: errorPerfil, recargar } = useUserProfile();
 const { albumes, cargando: cargandoAlbumes, error: errorAlbumes, recargar: recargarAlbumes } = useAlbums();
 const [propias, setPropias] = useState<string[] | null>(null);
 const [hogar, setHogar] = useState<string[] | null>(null);
 const [error, setError] = useState(false);
 const [cargandoAlergias, setCargandoAlergias] = useState(true);
 const [mostrarEliminar, setMostrarEliminar] = useState(false);
 const peticion = useRef(0);
 const id = session?.user.id;
 const [intento,setIntento] = useState(0);
 useFocusEffect(useCallback(() => {
  const solicitud = ++peticion.current;
  void intento;
  void recargar(); void recargarAlbumes();
  if (!id) return;
  setCargandoAlergias(true); setError(false);
  async function cargar() {
   try {
    const [a,b] = await Promise.all([
     supabase.from('usuario_alergias').select('alergenos(nombre)').eq('usuario_id',id),
     supabase.from('hogar_alergias').select('alergenos(nombre)').eq('usuario_id',id),
    ]);
    if (a.error || b.error) throw new Error();
    if (solicitud === peticion.current) { setPropias(nombres(a.data ?? [])); setHogar(nombres(b.data ?? [])); }
   } catch { if (solicitud === peticion.current) setError(true); }
   finally { if (solicitud === peticion.current) setCargandoAlergias(false); }
  }
  void cargar();
  return () => { peticion.current++; };
 },[id,recargar,recargarAlbumes,intento]));
 function cerrar() { Alert.alert('¿Cerrar sesión?', 'Para volver a entrar necesitarás tu correo y contraseña.', [{ text:'Cancelar',style:'cancel' },{ text:'Cerrar sesión',style:'destructive',onPress:cerrarSesion }]); }
 function preferencias(seccion: SeccionPreferencias) { if (id) seleccionarSeccion(id,seccion); navigation.navigate('Preferencias'); }
 function actividad() {
  const album = albumes.find(a => a.tipo === 'ya_preparadas');
  if (cargandoAlbumes) { Alert.alert('Cargando álbumes','Espera un momento y vuelve a intentar.'); return; }
  if (errorAlbumes || !album) { void recargarAlbumes(); Alert.alert('No pudimos abrir tu álbum','Vuelve a intentar cuando termine la carga.'); return; }
  navigation.navigate('Inicio',{ screen:'ColeccionDetalle',params:{ albumId:album.id,nombre:album.nombre,tipo:'ya_preparadas' },initial:false });
 }
 if (!perfil || perfil.id !== id) return <SafeAreaView edges={['top']} style={styles.pantalla}>{errorPerfil ? <><Text style={styles.aviso}>No pudimos cargar tu perfil.</Text><Fila texto="Reintentar" onPress={() => { void recargar(); }} /></> : <VistaCargando mensaje="Cargando tu cuenta…" />}</SafeAreaView>;
 const pendiente = cargandoAlergias || error;
 const numero = (lista: string[] | null) => pendiente || lista === null ? '—' : String(lista.length);
 const lista = (valores: string[] | null) => error ? 'No se pudieron actualizar las alergias.' : cargandoAlergias || valores === null ? 'Cargando…' : valores.length ? valores.join(', ') : 'Ninguna';
 return <SafeAreaView edges={['top']} style={styles.pantalla}><ScrollView contentContainerStyle={styles.contenido}>
  <View style={styles.banda}><Text style={styles.bandaTitulo}>Tu cuenta</Text></View>
  <View style={styles.avatar} accessible accessibilityLabel={'Inicial de '+perfil.alias}><Text style={styles.inicial}>{Array.from(perfil.alias.trim())[0]?.toUpperCase() || '?'}</Text></View>
  <View style={styles.datos}><Text style={styles.alias}>{perfil.alias}</Text><Text style={styles.dato}>{session?.user.email}</Text><Text style={styles.dato}>{perfil.nombre}</Text><Text style={styles.nota}>Solo tú puedes ver tu nombre</Text></View>
  {(errorPerfil || error) && <><Text style={styles.aviso}>No pudimos actualizar tus datos. Vuelve a abrir Cuenta para reintentar.</Text><Fila texto="Reintentar" onPress={() => { setIntento(prev => prev+1); }} /></>}
  <View style={styles.cifras}>{[[String(perfil.personas_hogar),'Personas en casa'],[numero(propias),'Tus alergias'],...(perfil.personas_hogar > 1 ? [[numero(hogar),'Alergias en tu casa']] : [])].map(([valor,texto]) => <View key={texto} style={styles.cifra}><Text style={styles.numero}>{valor}</Text><Text style={styles.nota}>{texto}</Text></View>)}</View>
  <View style={styles.resumen}><Text style={tipografia.subtitulo}>Tus alergias</Text><Text style={tipografia.cuerpo}>{lista(propias)}</Text>{perfil.personas_hogar > 1 && <><Text style={tipografia.subtitulo}>Alergias de tu hogar</Text><Text style={tipografia.cuerpo}>{lista(hogar)}</Text></>}</View>
  <Text style={styles.grupo}>Perfil</Text><View style={styles.menu}><Fila texto="Editar perfil" onPress={() => navigation.navigate('EditarPerfil')} /></View>
  <Text style={styles.grupo}>Preferencias</Text><View style={styles.menu}><Fila texto="Mis restricciones" onPress={() => preferencias('restricciones')} /><Fila texto={'Mi hogar · '+perfil.personas_hogar+' personas'} onPress={() => preferencias('hogar')} /><Fila texto="Mi cocina" onPress={() => preferencias('cocina')} /></View>
  <Text style={styles.grupo}>Mi actividad</Text><View style={styles.menu}><Fila texto="Mis publicaciones" onPress={() => navigation.navigate('Comunidad',{screen:'MisPublicaciones',initial:false})} /><Fila texto="Recetas que he preparado" onPress={actividad} /></View>
  <Text style={styles.grupo}>Cuenta</Text><View style={styles.menu}><Fila texto="Cambiar contraseña" onPress={() => navigation.navigate('CambiarContrasena')} /></View>
  <View style={styles.cierre}><Fila texto="Cerrar sesión" onPress={cerrar} flecha={false} /></View>
  <View style={styles.eliminar}><Fila texto="Eliminar mi cuenta" peligro onPress={() => setMostrarEliminar(true)} flecha={false} /></View>
 </ScrollView><EliminarCuentaModal visible={mostrarEliminar} onCerrar={() => setMostrarEliminar(false)} /></SafeAreaView>;
}
const styles = StyleSheet.create({
 pantalla:{flex:1,backgroundColor:colors.fondo}, contenido:{paddingBottom:32,width:"100%",maxWidth:640,alignSelf:"center"},
 banda:{minHeight:140,backgroundColor:colors.superficieCalida,borderBottomLeftRadius:24,borderBottomRightRadius:24,paddingTop:24,alignItems:'center'},bandaTitulo:{...tipografia.subtitulo},
 avatar:{width:96,height:96,borderRadius:48,borderWidth:4,borderColor:colors.superficie,backgroundColor:colors.acento,alignSelf:'center',marginTop:-48,alignItems:'center',justifyContent:'center'},inicial:{fontFamily:fuentes.negrita,fontSize:40,color:colors.sobreAcento},
 datos:{padding:16,alignItems:'center',gap:5},alias:{...tipografia.titulo,fontSize:24},dato:{...tipografia.cuerpo,fontSize:17,lineHeight:26,textAlign:'center'},nota:{...tipografia.chico,textAlign:'center'},
 cifras:{flexDirection:'row',marginHorizontal:16,backgroundColor:colors.superficie,borderRadius:14,paddingVertical:16},cifra:{flex:1,paddingHorizontal:8,borderRightWidth:1,borderColor:colors.borde},numero:{...tipografia.subtitulo,textAlign:'center',fontSize:22},
 resumen:{padding:16,gap:8},grupo:{...tipografia.subtitulo,marginHorizontal:16,marginTop:20,marginBottom:8},menu:{marginHorizontal:16,backgroundColor:colors.superficie,borderRadius:14,overflow:'hidden'},
 fila:{minHeight:56,paddingVertical:14,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderColor:colors.borde},textoFila:{fontFamily:fuentes.semibold,fontSize:17,color:colors.texto,flex:1},flecha:{fontSize:26,color:colors.textoSuave},
 cierre:{marginHorizontal:16,marginTop:20,backgroundColor:colors.superficie,borderRadius:14},eliminar:{marginTop:32,marginHorizontal:16},peligro:{color:colors.peligro},aviso:{...tipografia.cuerpo,color:colors.peligro,padding:16},
});
