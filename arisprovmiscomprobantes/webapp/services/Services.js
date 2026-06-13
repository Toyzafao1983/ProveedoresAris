sap.ui.define([
	"../util/utilResponse",
	"../util/utilHttp",
	"../constantes",
	"../estructuras/Estructura"
], function(utilResponse, utilHttp, constantes,Estructura) {
	"use strict";
	return {
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
			utilHttp.ERPGetSync( url, callback);
		},
		getoDataERPSyncNotResult:function(context, url, callback){
			utilHttp.ERPGetSyncNotResult( url, callback);
		},
		getoDataERPAsync:function(context, url, callback){
			utilHttp.ERPGetAsync( url, callback);
		},
		postoDataERPSync:function(context, urlget, urlpost, data, callback){
			utilHttp.ERPPostTokenSync( urlget, urlpost, data, callback);
		},
		postoDataERPAsync:function(context, urlget, urlpost, data, callback){
			utilHttp.ERPPostTokenAsync( urlget, urlpost, data, callback);
		},
	};
});