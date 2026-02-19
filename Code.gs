/**
 * API KDS
 */

// PASO IMPORTANTE: Reemplazar con tu ID de spreadsheet
const SPREADSHEET_ID = '1iHJ0RQTH3LRFzkdZXRDz_3W2R4GQyTNdt2NbgRVd8Tk';
const API_TOKEN = 'qchulada-kds-jacaranda';

function doGet(e) {
  try {
    if (e.parameter.token !== API_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido' });
    }

    const action = e.parameter.action;
    
    if (action === 'getBebidas') {
      const bebidas = obtenerBebidas();
      return jsonResponse({ success: true, data: bebidas });
    }
    
    if (action === 'getOrdenes') {
      const ordenes = obtenerOrdenesPendientes();
      return jsonResponse({ success: true, data: ordenes });
    }
    
    if (action === 'completarOrden') {
      const ordenID = parseInt(e.parameter.ordenID);
      completarOrden(ordenID);
      return jsonResponse({ success: true });
    }
    
    if (action === 'getHistorial') {
      const limite = e.parameter.limite ? parseInt(e.parameter.limite) : null;
      Logger.log('Ejecutando obtenerHistorial con límite: ' + limite);
      const historial = obtenerHistorial(limite);
      Logger.log('Historial obtenido: ' + historial.length + ' órdenes');
      return jsonResponse({ success: true, data: historial });
    }
    
    return jsonResponse({ success: false, error: 'Acción no válida' });
    
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.token !== API_TOKEN) {
      return jsonResponse({ success: false, error: 'Token inválido' });
    }

    if (payload.action === 'crearOrden') {
      const resultado = crearOrden(payload.ticket, payload.cliente, payload.bebidas);
      return jsonResponse({ success: true, data: resultado });
    }

    return jsonResponse({ success: false, error: 'Acción POST no válida' });

  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function obtenerBebidas() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Bebidas');

  if (!sheet) {
    throw new Error('Sheet "Bebidas" no encontrada');
  }

  const data = sheet.getDataRange().getValues();
  const bebidas = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    bebidas.push({
      nombre: data[i][0],
      precio: data[i][1],
      categoria: data[i][2]
    });
  }

  return bebidas;
}

function obtenerOrdenesPendientes() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordenesSheet = ss.getSheetByName('Órdenes');
  const itemsSheet = ss.getSheetByName('Items');
  
  const ordenes = ordenesSheet.getDataRange().getValues();
  const items = itemsSheet.getDataRange().getValues();
  
  const resultado = [];
  
  for (let i = 1; i < ordenes.length; i++) {
    if (ordenes[i][4] !== 'Pendiente') continue;
    
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
  
  return resultado;
}

function completarOrden(ordenID) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordenesSheet = ss.getSheetByName('Órdenes');
  const data = ordenesSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === ordenID) {
      ordenesSheet.getRange(i + 1, 5).setValue('Completada');
      return;
    }
  }
}

function crearOrden(ticket, nombreCliente, bebidas) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const ordenesSheet = ss.getSheetByName('Órdenes');
  const itemsSheet = ss.getSheetByName('Items');
  
  const lastRow = ordenesSheet.getLastRow();
  const ordenID = lastRow > 1 ? ordenesSheet.getRange(lastRow, 1).getValue() + 1 : 1;
  
  ordenesSheet.appendRow([
    ordenID,
    new Date(),
    'BEB-' + ticket,
    nombreCliente,
    'Pendiente'
  ]);
  
  bebidas.forEach((bebida, i) => {
    itemsSheet.appendRow([
      ordenID + '-' + (i + 1),
      ordenID,
      bebida.nombre,
      bebida.cantidad,
      bebida.detalles || ''
    ]);
  });
  
  return {
    mensaje: `Orden ${ticket} creada con ${bebidas.length} bebidas`
  };
}

/**
 * Obtener historial de órdenes completadas
 */
function obtenerHistorial(limite) {
  Logger.log('obtenerHistorial() ejecutándose...');
  Logger.log('Límite: ' + (limite || 'sin límite'));
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ordenesSheet = ss.getSheetByName('Órdenes');
    const itemsSheet = ss.getSheetByName('Items');
    
    if (!ordenesSheet || !itemsSheet) {
      throw new Error('Sheets no encontrados');
    }
    
    const ordenes = ordenesSheet.getDataRange().getValues();
    const items = itemsSheet.getDataRange().getValues();
    
    Logger.log('Total filas en Órdenes: ' + ordenes.length);
    
    const resultado = [];
    
    // Iterar desde el final (más recientes primero)
    for (let i = ordenes.length - 1; i >= 1; i--) {
      const estado = ordenes[i][4];
      
      // Solo órdenes completadas
      if (estado !== 'Completada') continue;
      
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
          timestamp: ordenes[i][1],
          items: itemsOrden
        });
      }
      
      // Si hay límite y ya llegamos, parar
      if (limite && resultado.length >= limite) {
        break;
      }
    }
    
    Logger.log('Total órdenes en historial: ' + resultado.length);
    return resultado;
    
  } catch (error) {
    Logger.log('ERROR en obtenerHistorial: ' + error.toString());
    throw error;
  }
}