/**
 * API KDS - Sistema de Bebidas
 * VERSIÓN SIMPLIFICADA PARA DEBUGGING
 */

// NO TOCAR - ID de tu spreadsheet
const SPREADSHEET_ID = '1iHJ0RQTH3LRFzkdZXRDz_3W2R4GQyTNdt2NbgRVd8Tk';

/**
 * Función principal que recibe requests HTTP
 */
function doGet(e) {
  Logger.log('=== doGet LLAMADO ===');
  Logger.log('Parámetros recibidos: ' + JSON.stringify(e.parameter));
  
  try {
    const action = e.parameter.action;
    Logger.log('Action solicitado: ' + action);
    
    // TEST: Siempre devolver algo
    if (!action) {
      return jsonResponse({ 
        success: false, 
        error: 'No se especificó action',
        received: e.parameter
      });
    }
    
    // GET BEBIDAS
    if (action === 'getBebidas') {
      Logger.log('Ejecutando obtenerBebidas...');
      const bebidas = obtenerBebidas();
      Logger.log('Bebidas obtenidas: ' + JSON.stringify(bebidas));
      return jsonResponse({ success: true, data: bebidas });
    }
    
    // GET ORDENES
    if (action === 'getOrdenes') {
      Logger.log('Ejecutando obtenerOrdenesPendientes...');
      const ordenes = obtenerOrdenesPendientes();
      Logger.log('Órdenes obtenidas: ' + ordenes.length);
      return jsonResponse({ success: true, data: ordenes });
    }
    
    // COMPLETAR ORDEN
    if (action === 'completarOrden') {
      const ordenID = parseInt(e.parameter.ordenID);
      Logger.log('Completando orden: ' + ordenID);
      completarOrden(ordenID);
      return jsonResponse({ success: true });
    }
    
    // CREAR ORDEN
    if (action === 'crearOrden') {
      const data = JSON.parse(e.parameter.data);
      Logger.log('Creando orden: ' + JSON.stringify(data));
      const resultado = crearOrden(data.ticket, data.cliente, data.bebidas);
      return jsonResponse({ success: true, data: resultado });
    }
    
    // Si no matchea ninguna acción
    return jsonResponse({ 
      success: false, 
      error: 'Acción no reconocida: ' + action 
    });
    
  } catch (error) {
    Logger.log('ERROR en doGet: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    return jsonResponse({ 
      success: false, 
      error: error.toString(),
      stack: error.stack
    });
  }
}

/**
 * Convertir objeto a JSON response
 */
function jsonResponse(obj) {
  Logger.log('Enviando respuesta: ' + JSON.stringify(obj));
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Obtener catálogo de bebidas (HARDCODED)
 */
function obtenerBebidas() {
  Logger.log('obtenerBebidas() ejecutándose...');
  
  const bebidas = [
    'Mangonada',
    'Maracuyada',
    'Jamaica',
    'Horchata',
    'Hierbabuena con Limón',
    'Cantarito',
    'Chelas',
    'Gomichela',
    'Margarona',
    'Margarita',
    'Paloma Fresa',
    'Paloma Maracuya',
    'Paloma Tamarindo',
    'Charro Negro',
    'Azulito',
    'Acapulco Azul',
    'Tablazo'
  ];
  
  Logger.log('Retornando ' + bebidas.length + ' bebidas');
  return bebidas;
}

/**
 * Obtener órdenes pendientes
 */
function obtenerOrdenesPendientes() {
  Logger.log('obtenerOrdenesPendientes() ejecutándose...');
  Logger.log('SPREADSHEET_ID: ' + SPREADSHEET_ID);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Spreadsheet abierto correctamente');
    
    const ordenesSheet = ss.getSheetByName('Órdenes');
    const itemsSheet = ss.getSheetByName('Items');
    
    if (!ordenesSheet) {
      throw new Error('Sheet "Órdenes" no encontrado');
    }
    if (!itemsSheet) {
      throw new Error('Sheet "Items" no encontrado');
    }
    
    Logger.log('Sheets encontrados correctamente');
    
    const ordenes = ordenesSheet.getDataRange().getValues();
    const items = itemsSheet.getDataRange().getValues();
    
    Logger.log('Total filas en Órdenes: ' + ordenes.length);
    Logger.log('Total filas en Items: ' + items.length);
    
    const resultado = [];
    
    for (let i = 1; i < ordenes.length; i++) {
      const estado = ordenes[i][4];
      
      if (estado !== 'Pendiente') continue;
      
      const ordenID = ordenes[i][0];
      const itemsOrden = [];
      
      for (let j = 1; j < items.length; j++) {
        if (items[j][1] === ordenID) {
          itemsOrden.push({
            bebida: items[j][2],
            cantidad: items[j][3],
            detalles: items[j][4] || ''
          });
        }
      }
      
      if (itemsOrden.length > 0) {
        resultado.push({
          id: ordenID,
          ticket: ordenes[i][2],
          cliente: ordenes[i][3],
          items: itemsOrden
        });
      }
    }
    
    Logger.log('Total órdenes pendientes: ' + resultado.length);
    return resultado;
    
  } catch (error) {
    Logger.log('ERROR en obtenerOrdenesPendientes: ' + error.toString());
    throw error;
  }
}

/**
 * Completar una orden
 */
function completarOrden(ordenID) {
  Logger.log('completarOrden() ejecutándose con ID: ' + ordenID);
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordenesSheet = ss.getSheetByName('Órdenes');
  const data = ordenesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ordenID) {
      ordenesSheet.getRange(i + 1, 5).setValue('Completada');
      Logger.log('Orden ' + ordenID + ' marcada como completada');
      return;
    }
  }
  
  Logger.log('Orden ' + ordenID + ' no encontrada');
}

/**
 * Crear nueva orden
 */
function crearOrden(ticket, nombreCliente, bebidas) {
  Logger.log('crearOrden() ejecutándose...');
  Logger.log('Ticket: ' + ticket);
  Logger.log('Cliente: ' + nombreCliente);
  Logger.log('Bebidas: ' + JSON.stringify(bebidas));
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordenesSheet = ss.getSheetByName('Órdenes');
  const itemsSheet = ss.getSheetByName('Items');
  
  const lastRow = ordenesSheet.getLastRow();
  const ordenID = lastRow > 1 ? ordenesSheet.getRange(lastRow, 1).getValue() + 1 : 1;
  
  Logger.log('Nuevo ordenID: ' + ordenID);
  
  ordenesSheet.appendRow([
    ordenID,
    new Date(),
    'BEB-' + ticket,
    nombreCliente,
    'Pendiente'
  ]);
  
  Logger.log('Orden agregada a sheet Órdenes');
  
  bebidas.forEach((bebida, i) => {
    itemsSheet.appendRow([
      ordenID + '-' + (i + 1),
      ordenID,
      bebida.nombre,
      bebida.cantidad,
      bebida.detalles || ''
    ]);
  });
  
  Logger.log('Items agregados a sheet Items');
  
  return {
    mensaje: `Orden ${ticket} creada con ${bebidas.length} bebidas`
  };
}

/**
 * FUNCIÓN DE TEST - Ejecutar manualmente
 */
function testObtenerBebidas() {
  Logger.log('=== TEST obtenerBebidas ===');
  const result = obtenerBebidas();
  Logger.log('Resultado: ' + JSON.stringify(result));
  Logger.log('Tipo: ' + typeof result);
  Logger.log('Es array: ' + Array.isArray(result));
  Logger.log('Longitud: ' + result.length);
  return result;
}