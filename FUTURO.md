# Mejoras Futuras - Q'Chulada KDS

## 1. Inventario / Control de Stock

### Descripcion
Sistema de inventario basico que rastrea el stock de cada bebida y alerta cuando se esta agotando.

### Implementacion sugerida

**Nueva hoja en Google Sheets: "Inventario"**
| Columna | Campo | Ejemplo |
|---------|-------|---------|
| A | nombre | Cerveza Imperial |
| B | stockActual | 48 |
| C | stockMinimo | 10 |
| D | unidad | unidades |

**Cambios en Code.gs:**
- Nueva accion `getInventario`: retorna el inventario completo
- Modificar `crearOrden`: al crear una orden, decrementar el stock de cada bebida segun la cantidad
- Nueva accion `actualizarStock` (POST): permite actualizar manualmente el stock de una bebida
- Validacion: si una bebida tiene stock 0, rechazar la orden para esa bebida

**Cambios en orden.html:**
- Al cargar bebidas, tambien cargar inventario
- Deshabilitar (grayed out) las bebidas con stock 0 en el select y busqueda
- Mostrar indicador visual de "Stock bajo" junto a bebidas con stock <= stockMinimo

**Cambios en historial.html:**
- Nueva tab "Inventario" para ver y gestionar stock
- Tabla con nombre, stock actual, stock minimo, estado (OK / Bajo / Agotado)
- Boton para ajustar stock manualmente (ej: cuando llega mercaderia)

---

## 2. Modularizacion / Codigo Compartido

### Descripcion
Extraer utilidades comunes que se repiten en las 3 paginas HTML a archivos compartidos.

### Codigo duplicado actualmente
- `escapeHtml()` - identica en las 3 paginas
- `getStoredToken()`, `showAuthModal()`, `hideAuthModal()`, `autenticarModal()`, `handleAuthError()`, `logout()` - misma logica en las 3 paginas
- CSS variables (`:root` con --chile, --marigold, etc.) - identicas en las 3 paginas
- CSS del auth modal - identico en las 3 paginas
- CSS del papel-picado - identico en las 3 paginas
- Constante API_URL - misma URL en las 3 paginas
- Iconos SVG (ICON object) - repetidos en display.html y historial.html

### Implementacion sugerida con Google Apps Script

Google Apps Script soporta includes via `HtmlService`:

```javascript
// En Code.gs, agregar una ruta para servir HTML
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

Crear archivos parciales:
- `shared-css.html`: Variables CSS, papel-picado, auth modal CSS
- `shared-auth.html`: JavaScript de autenticacion
- `shared-utils.html`: escapeHtml, API_URL, iconos

En cada pagina principal usar:
```html
<?!= include('shared-css') ?>
<?!= include('shared-auth') ?>
```

**Nota:** Esto requiere servir las paginas via `HtmlService.createTemplateFromFile()` en vez de archivos estaticos.

---

## 3. Progressive Web App (PWA)

### Descripcion
Convertir la app en una PWA para que se pueda "instalar" en la pantalla de inicio del celular/tablet sin pasar por la tienda de apps.

### Implementacion sugerida

**manifest.json:**
```json
{
  "name": "Q'Chulada KDS",
  "short_name": "Q'Chulada",
  "description": "Kitchen Display System - Bar & Bebidas",
  "start_url": "/orden.html",
  "display": "standalone",
  "background_color": "#FFF8F0",
  "theme_color": "#C0392B",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Service Worker (sw.js):**
- Cache estatico: HTML, fonts, iconos
- Network-first para API calls
- Fallback a cache cuando no hay red

**Limitaciones con Google Apps Script:**
- Google Apps Script no permite servir archivos estaticos con URLs personalizadas
- El manifest.json y service worker tendrian que servirse via rutas especiales en doGet
- Alternativa: hospedar los HTML en un servidor estatico (GitHub Pages, Netlify) y solo usar Google Apps Script como API

**Iconos necesarios:**
- icon-192.png (192x192px)
- icon-512.png (512x512px)
- favicon.ico
- Disenar con la estetica mexicana del proyecto (rojo chile, tipografia Playfair Display)
