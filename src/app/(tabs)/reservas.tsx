import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useApp } from '@/context/AppContext';
import { LIBROS } from '@/data/libros';
import { colores, espaciado, radios, tipografia } from '@/constants/tema';
import { USUARIO_ACTUAL } from '@/constants/biblioteca';
import type { Prestamo, Libro } from '@/types';

/**
 * Pantalla "Mis reservas".
 *
 * Muestra:
 * - Préstamos activos (con fecha de devolución, interruptor "Recordarme" y botón "Devolver")
 * - Reservas en lista de espera (con posición)
 * - Avisos dentro de la app (cuando no hay permiso de notificaciones)
 *
 * El interruptor "Recordarme":
 * - Si está en OFF y se activa: pide permiso de notificaciones (si no está concedido)
 *   y programa una notificación local a los 15 segundos (modo demo).
 * - Si está en ON y se desactiva: cancela la notificación programada.
 * - El botón "Devolver" también cancela la notificación.
 */
export default function MisReservas() {
  const {
    prestamos,
    devolver,
    programarRecordatorio,
    cancelarRecordatorio,
    listasEspera,
    avisos,
    quitarAviso,
  } = useApp();

  // Estado local para los interruptores (se sincroniza con notificacionId de préstamos)
  const [recordatorios, setRecordatorios] = useState<Record<string, boolean>>(() => {
    const inicial: Record<string, boolean> = {};
    for (const p of prestamos) {
      inicial[p.isbn] = p.notificacionId !== null;
    }
    return inicial;
  });

  // Filtrar préstamos de estante (los de 'espera' no van acá)
  const prestamosActivos = prestamos.filter((p) => p.origen === 'estante');

  // Buscar libros donde el usuario está en lista de espera
  const reservasEspera: { libro: Libro; posicion: number }[] = [];
  for (const [isbn, cola] of Object.entries(listasEspera)) {
    const personas = cola.aArray();
    const posicion = personas.indexOf(USUARIO_ACTUAL);
    if (posicion !== -1) {
      const libro = LIBROS.find((l) => l.isbn === isbn);
      if (libro) {
        reservasEspera.push({ libro, posicion: posicion + 1 });
      }
    }
  }

  // Formatear fecha de vencimiento
  const formatearFecha = (timestamp: number): string => {
    const fecha = new Date(timestamp);
    return fecha.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Obtener información del libro
  const obtenerLibro = (isbn: string): Libro | undefined =>
    LIBROS.find((l) => l.isbn === isbn);

  /**
   * Manejar el cambio del interruptor "Recordarme".
   * - Si se activa: pide permiso de notificaciones (si es necesario) y programa.
   * - Si se desactiva: cancela la notificación.
   */
  const handleRecordatorioChange = async (isbn: string, activar: boolean) => {
    // Actualizar el estado local inmediatamente para feedback visual
    setRecordatorios((prev) => ({ ...prev, [isbn]: activar }));

    if (activar) {
      // Activar: verificar y pedir permiso
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'granted') {
        // Ya tenemos permiso: programar directamente
        const id = await programarRecordatorio(isbn);
        if (!id) {
          // Si falló, revertir el switch
          setRecordatorios((prev) => ({ ...prev, [isbn]: false }));
        }
      } else if (status === 'undetermined') {
        // Pedir permiso directamente
        const { status: nuevoStatus } = await Notifications.requestPermissionsAsync();
        
        if (nuevoStatus === 'granted') {
          // Permiso concedido: programar
          const id = await programarRecordatorio(isbn);
          if (!id) {
            // Si falló, revertir el switch
            setRecordatorios((prev) => ({ ...prev, [isbn]: false }));
          }
        } else {
          // Permiso denegado: revertir el switch
          setRecordatorios((prev) => ({ ...prev, [isbn]: false }));
        }
      } else {
        // Bloqueado: no se puede activar, revertir el switch
        setRecordatorios((prev) => ({ ...prev, [isbn]: false }));
      }
    } else {
      // Desactivar: cancelar la notificación
      await cancelarRecordatorio(isbn);
    }
  };

  /**
   * Devolver un libro.
   * Cancela la notificación asociada si existe.
   */
  const handleDevolver = async (isbn: string) => {
    await devolver(isbn);
  };

  // Renderizar un préstamo
  const renderPrestamo = (prestamo: Prestamo) => {
    const libro = obtenerLibro(prestamo.isbn);
    if (!libro) return null;

    const recordatorioActivo = recordatorios[prestamo.isbn] || false;

    return (
      <View key={prestamo.isbn} style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>
        <Text style={estilos.fecha}>
          Devolver antes del: {formatearFecha(prestamo.vence)}
        </Text>
        <View style={estilos.acciones}>
          <View style={estilos.switchContainer}>
            <Text style={estilos.switchLabel}>Recordarme</Text>
            <Switch
              value={recordatorioActivo}
              onValueChange={(valor) => handleRecordatorioChange(prestamo.isbn, valor)}
              accessibilityLabel={`Activar recordatorio para ${libro.titulo}`}
            />
          </View>
          <Pressable
            style={estilos.botonDevolver}
            onPress={() => handleDevolver(prestamo.isbn)}
            accessibilityRole="button"
            accessibilityLabel={`Devolver ${libro.titulo}`}
          >
            <Text style={estilos.textoBoton}>Devolver</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Renderizar una reserva en espera
  const renderReservaEspera = (item: { libro: Libro; posicion: number }) => (
    <View key={item.libro.isbn} style={estilos.tarjetaEspera}>
      <Text style={estilos.titulo}>{item.libro.titulo}</Text>
      <Text style={estilos.autor}>{item.libro.autor}</Text>
      <Text style={estilos.posicion}>Posición en espera: {item.posicion}</Text>
    </View>
  );

  // Renderizar avisos dentro de la app
  const renderAvisos = () => {
    if (avisos.length === 0) return null;

    return (
      <View style={estilos.seccionAvisos}>
        <Text style={estilos.tituloSeccion}>Avisos</Text>
        {avisos.map((aviso) => (
          <View key={aviso.id} style={estilos.aviso}>
            <Text style={estilos.textoAviso}>{aviso.texto}</Text>
            <Pressable
              onPress={() => quitarAviso(aviso.id)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar aviso"
            >
              <Text style={estilos.cerrarAviso}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>
    );
  };

  // Estado vacío
  if (prestamosActivos.length === 0 && reservasEspera.length === 0 && avisos.length === 0) {
    return (
      <View style={estilos.estadoVacio}>
        <Text style={estilos.textoVacio}>No tenés reservas ni préstamos activos</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[]}
      renderItem={() => null}
      keyExtractor={() => 'dummy'}
      ListHeaderComponent={
        <>
          {renderAvisos()}
          {prestamosActivos.length > 0 && (
            <>
              <Text style={estilos.tituloSeccion}>Mis préstamos</Text>
              {prestamosActivos.map((prestamo) => renderPrestamo(prestamo))}
            </>
          )}
          {reservasEspera.length > 0 && (
            <>
              <Text style={estilos.tituloSeccion}>En lista de espera</Text>
              {reservasEspera.map((reserva) => renderReservaEspera(reserva))}
            </>
          )}
        </>
      }
      contentContainerStyle={estilos.lista}
    />
  );
}

const estilos = StyleSheet.create({
  lista: {
    paddingVertical: espaciado.md,
  },
  seccionAvisos: {
    paddingHorizontal: espaciado.md,
    marginBottom: espaciado.md,
  },
  tituloSeccion: {
    fontSize: tipografia.subtitulo,
    fontWeight: '600',
    color: colores.texto,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
  },
  aviso: {
    backgroundColor: colores.aviso,
    borderRadius: radios.sm,
    padding: espaciado.md,
    marginBottom: espaciado.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textoAviso: {
    flex: 1,
    fontSize: tipografia.chica,
    color: colores.avisoTexto,
  },
  cerrarAviso: {
    fontSize: tipografia.normal,
    color: colores.avisoTexto,
    marginLeft: espaciado.sm,
    minWidth: 44,
    minHeight: 44,
    textAlign: 'center',
    lineHeight: 44,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginHorizontal: espaciado.md,
    marginVertical: espaciado.xs,
    borderLeftWidth: 4,
    borderLeftColor: colores.exito,
  },
  tarjetaEspera: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    padding: espaciado.md,
    marginHorizontal: espaciado.md,
    marginVertical: espaciado.xs,
    borderLeftWidth: 4,
    borderLeftColor: colores.avisoTexto,
  },
  titulo: {
    fontSize: tipografia.normal,
    fontWeight: '600',
    color: colores.texto,
    marginBottom: espaciado.xs,
  },
  autor: {
    fontSize: tipografia.chica,
    color: colores.textoSecundario,
    marginBottom: espaciado.sm,
  },
  fecha: {
    fontSize: tipografia.chica,
    color: colores.textoSecundario,
    marginBottom: espaciado.md,
  },
  posicion: {
    fontSize: tipografia.normal,
    fontWeight: '600',
    color: colores.avisoTexto,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
  },
  switchLabel: {
    fontSize: tipografia.chica,
    color: colores.textoSecundario,
  },
  botonDevolver: {
    backgroundColor: colores.error,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    borderRadius: radios.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBoton: {
    color: colores.primarioTexto,
    fontSize: tipografia.chica,
    fontWeight: '600',
  },
  estadoVacio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciado.lg,
  },
  textoVacio: {
    fontSize: tipografia.normal,
    color: colores.textoSecundario,
    textAlign: 'center',
  },
});
