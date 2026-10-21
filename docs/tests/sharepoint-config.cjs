const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const cases = [
 ['com.aris.proveedores.facturasexterior.pe', 'Base', 'documentsFolder'],
 ['com.proveedor.peticionoferta.pe', 'Base', 'documentsFolder'],
 ['com.aris.proveedores.pe.calendario', 'View', 'materialsFolder']
];
async function run(app, file, key) {
 let controller, loads = 0, value = 'Ambiente prueba/Documentos', fail = false;
 const requests = [];
 const services = {
  sharePointUploadProgressSync(url, file, progress, cb) { requests.push(url); cb({iCode: 1, data: {}}); },
  sharePointCreateFolderSync(url, body, cb) { requests.push(url); cb({iCode: 1}); },
  getSharepointChildrenSync(url, cb) { requests.push(url); cb({iCode: 1, data: {value: []}}); }
 };
 const base = {extend(name, definition) {controller = definition; return definition;}};
 const context = {
  window: {location: {href: 'launchpad'}},
  jQuery: {sap: {getModulePath: () => '/app'}},
  $: {ajax({url, success}) {requests.push(url); success({value: []});}},
  sap: {ui: {
   require: {toUrl: url => {assert.ok(url.endsWith('/config/sharepoint.properties')); return url;}},
   define(deps, factory) {
    factory(...deps.map(dep => dep === 'sap/base/i18n/ResourceBundle' ? {
     async create(options) {
      loads++; assert.equal(options.locale, '');
      if (fail) throw new Error('load failed');
      return {hasText: k => k === key, getText: () => value};
     }
    } : dep.endsWith('/Services') ? services : dep.endsWith('/Controller') || dep.endsWith('/BaseController') ? base : {}));
   }
  }}
 };
 vm.runInNewContext(fs.readFileSync(`${app}/webapp/controller/${file === "View" ? "View.controller.js" : "BaseController.js"}`, 'utf8'), context);
 controller.local = false;
 controller.getOwnerComponent = () => ({getManifestObject: () => ({resolveUri: x => x})});
 await Promise.all([controller._getSharePointFolder(key), controller._getSharePointFolder(key)]);
 assert.equal(loads, 1);
 for (const local of [false, true]) {
  controller.local = local;
  if (file === 'Base') {
   await controller._ensureSharePointFolderChain(['AF 123']);
   await controller._uploadSharepoint({name: 'archivo (1).pdf'}, () => {}, ['AF 123']);
   if (controller._getSharePointChildrenByFolderChain) await controller._getSharePointChildrenByFolderChain(['AF 123']);
  } else await controller._listarArchivos('site', 'drive');
 }
 assert.ok(requests.every(url => url.includes('/Ambiente%20prueba/Documentos')));
 assert.ok(requests.some(url => file === 'View' || url.includes('/AF%20123/archivo%20(1).pdf:/content')));
 // Invalid configuration must prevent transport and permit retry.
 const count = requests.length;
 value = '../incorrecta';
 const operation = () => file === 'Base' ? controller._uploadSharepoint({name: 'x'}, () => {}, []) : controller._listarArchivos('site', 'drive');
 await assert.rejects(operation);
 assert.equal(requests.length, count);
 fail = true;
 await assert.rejects(operation);
 fail = false; value = 'Recuperado/Carpeta';
 await operation();
 assert.ok(requests.at(-1).includes('/Recuperado/Carpeta'));
 const properties = fs.readFileSync(`${app}/webapp/config/sharepoint.properties`, 'utf8');
 assert.ok(properties.includes(`${key}=`));
 console.log(`OK ${app}`);
}
(async () => {for (const args of cases) await run(...args);})().catch(error => {console.error(error); process.exitCode = 1;});
