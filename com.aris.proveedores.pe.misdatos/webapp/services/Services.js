sap.ui.define([
	"../util/utilResponse",
	"../util/utilHttp",
	"../constantes",
	"../estructuras/Estructura"
], function(utilResponse, utilHttp, constantes,Estructura) {
	"use strict";
	return {
        _readReference: function (context, url, callback, method) {
            // Do not cache supplier records, balances, quantities, conditions or documents.
            const path = new URL(url, document.baseURI).pathname;
            const catalog = /\/ZMMB_PORTALPROVEEDORES\/(Status|ClaDoc)$/.test(path) ||
                /\/ZSD_PORTAL_PROVEEDORES_SRV\/DatosEmpresasSet$/.test(path);
            if (!catalog) return utilHttp[method](url, callback);
            const component = context.getOwnerComponent();
            const scope = JSON.stringify([context.getUserLoged(), context.local, context.AdminUser]);
            if (component._supplierCatalogScope !== scope) {
                component._supplierCatalogScope = scope;
                component._supplierCatalogReads = new Map();
            }
            const cache = component._supplierCatalogReads;
            const key = method + ":" + url;
            const copy = value => JSON.parse(JSON.stringify(value));
            const existing = cache.get(key);
            if (existing) {
                if (existing.result) return callback(copy(existing.result));
                existing.callbacks.push(callback);
                return;
            }
            const entry = { callbacks: [callback] };
            cache.set(key, entry);
            return utilHttp[method](url, result => {
                if (result.iCode === 1 && result.complete === true) entry.result = copy(result);
                else cache.delete(key);
                const callbacks = entry.callbacks;
                entry.callbacks = [];
                callbacks.forEach(fn => fn(copy(result)));
            });
        },
		RegistrarAuditoriaSap: function (context, oResults, callback) {
			utilHttp.Post(constantes.services.RegistrarAuditoriaSap, oResults, callback, context);
		},
		getoDataVGenericaCampo: function (context,oFilter,callback) {
			utilHttp.getoData(context,'/VGenericaCampo',oFilter, callback);  //callback(modLocal) --> mockData
		},
		getoDataEstandar:function(context,oResults,callback){
			utilHttp.Post(constantes.services.getoDataEstandar, oResults, callback, context);
		},
		postoDataEstandar:function(context,oResults,callback){
			utilHttp.Post(constantes.services.postoDataEstandar, oResults, callback, context);
		},
		getoDataERPSync:function(context, url, callback){
            return this._readReference(context, url, callback, "ERPGetSync");
		},
		getoDataERPSyncNotResult:function(context, url, callback){
            return this._readReference(context, url, callback, "ERPGetSyncNotResult");
		},
		getoDataERPAsync:function(context, url, callback){
            return this._readReference(context, url, callback, "ERPGetAsync");
		},
		postoDataERPSync:function(context, urlget, urlpost, data, callback){
			utilHttp.ERPPostTokenSync( urlget, urlpost, data, callback);
		},
		postoDataERPAsync:function(context, urlget, urlpost, data, callback){
			utilHttp.ERPPostTokenAsync( urlget, urlpost, data, callback);
		},
	};
});