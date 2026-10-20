# Regresión de lecturas de Proveedores

Ejecutar desde la raíz, sin instalar dependencias:

```sh
node tests/performance-reads.test.cjs
```

Las pruebas cargan los módulos reales de las cinco aplicaciones con un transporte
simulado. Cubren paginación de más de 5000 registros, continuaciones de `$expand`,
conservación de `$top`, filtros y proxy, respuestas vacías, errores intermedios,
ciclos, caché de catálogos, aislamiento de usuarios y copias entre pantallas.
No sustituyen las pruebas funcionales contra SAP.

## Alcance

- Calendario está excluido.
- Las consultas SAP de las aplicaciones usan `$top=800000`. Las listas sin
  `$top` explícito también usan `800000`; el helper respeta límites explícitos
  y la continuación enviada por SAP. SharePoint conserva su límite propio.
- Se sigue la continuación enviada por SAP; no se inventan páginas por `$skip`.
  Si SAP alcanza un `$top` explícito sin devolver continuación, se conserva ese
  contrato y no se intenta superar el límite.
- Las lecturas conservan su modo síncrono o asíncrono y el formato del callback.
- Identidad y los catálogos SAP Status, ClaDoc y DatosEmpresasSet se reutilizan
  en memoria por Component y usuario. Recargar la aplicación renueva la caché.
  Las URLs distintas y los formatos de respuesta no se mezclan.
- Los catálogos estáticos que ya se generan localmente siguen igual.
- Pedidos, documentos, proveedores, saldos, condiciones, cantidades y cotizaciones
  siguen consultándose a SAP; no se resuelven con datos operativos antiguos.
- No se modifican registros, validaciones, permisos ni cálculos.

## Validación funcional pendiente con SAP

1. Comparar registros, importes, filtros y exportación con los mismos parámetros.
2. Probar un resultado con más de 5000 registros y verificar la última página.
3. Revisar posiciones/direcciones/contactos que tengan su propia continuación.
4. Navegar listado–detalle–listado y entrar al detalle por enlace directo.
5. Guardar/modificar y confirmar que se leen los datos operativos actualizados.
6. Confirmar que recargar la aplicación vuelve a consultar identidad y catálogos.
