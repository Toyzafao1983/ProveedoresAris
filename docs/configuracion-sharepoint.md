# Carpetas SharePoint de Proveedores

Cada aplicación con rutas de carpetas SharePoint dispone de `webapp/config/sharepoint.properties`:

| Aplicación | Propiedad | Ruta conservada |
|---|---|---|
| com.aris.proveedores.facturasexterior.pe | documentsFolder | Pruebas BTP/Proveedores/EXTERIOR |
| com.proveedor.peticionoferta.pe | documentsFolder | Pruebas BTP/Proveedores/PETICIONES DE OFERTA Y OFERTAS |
| com.aris.proveedores.pe.calendario | materialsFolder | AF_Sistemas/Documentos/Repositorio Apps/SAP Hana/Portal BTP/clientes/materiales |

Calendario conserva su ruta anterior a materiales de Clientes. Revisar funcionalmente si esa consulta sigue siendo necesaria.

Se usa el mismo patrón de Clientes: ResourceBundle asíncrono, sin variantes de idioma, carga compartida y caché por sesión. Un error de carga o una propiedad vacía o inválida rechaza la operación y permite reintentar; no hay carpeta alternativa en el controlador.

Facturas utiliza documentsFolder para listar adjuntos, crear subcarpetas y subir archivos. Petición de oferta lo utiliza para crear subcarpetas y subir archivos. Se conservan las subcarpetas dinámicas por documento/oferta y los nombres de archivo.

Para cambiar de carpeta, editar la propiedad de cada aplicación y volver a construir/desplegar incluyendo el controlador y `webapp/config/sharepoint.properties`. Recargar después la aplicación. Las rutas son relativas a la raíz de la biblioteca: sin barra inicial/final, segmentos vacíos, `.` o `..`. Escribir espacios normales, no `%20`. No incluir credenciales.

El alcance es el mismo que en Clientes: carpetas configurables. Los destinos, identificadores de sitio/biblioteca y resolución de sitio de Calendario conservan su configuración existente. No se crean ni se mueven carpetas al editar el archivo.

Validación: `node docs/tests/sharepoint-config.cjs`, `node --check` de los tres controladores y `git diff --check`. El test ejecuta los controladores con ResourceBundle y transporte simulados, cubriendo carga compartida, rutas local/launchpad, subida/listado/creación de carpetas, codificación, configuración inválida y reintento tras fallo de carga. No se ejecutó build, despliegue ni operaciones reales contra SharePoint. Verificar en navegador la carga de properties y las operaciones con un archivo de prueba; comprobar su inclusión en el artefacto de despliegue.
