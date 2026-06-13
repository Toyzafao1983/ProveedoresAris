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
        postoDataERPAsync: async function(context, urlget, urlpost, data, callback){
            return await utilHttp.ERPPostTokenAsync(urlget, urlpost, data, callback);
        },
        postoDataERPWithHeadersAsync: async function (context, urlget, urlpost, data, extraHeaders, callback) {
            return await utilHttp.ERPPostTokenAsync(urlget, urlpost, data, callback, extraHeaders);
        },

        postNoBodyERPAsync: async function (context, urlget, urlpost, extraHeaders, callback) {
            return await utilHttp.ERPPostTokenAsync(urlget, urlpost, {}, callback, extraHeaders);
        },
        postSharepointSync: function(url, body, contentType, callback) {
			utilHttp.sharePointPostSync(url, body, contentType, callback);
		},
        sharePointUploadProgressSync: function (url, file, onProgress, callback) {
			utilHttp.sharePointUploadProgressSync(url, file, onProgress, callback);
		},
        sharePointCreateFolderSync: function (url, body, callback) {
			utilHttp.sharePointCreateFolderSync(url, body, callback);
		},
        mergeODataAsync: async function (context, url, oBody, callback) {
            return new Promise((resolve, reject) => {
                // 🔹 Primero obtenemos token
                $.ajax({
                    url: url,
                    type: "GET",
                    async: true,
                    headers: { "X-CSRF-Token": "Fetch" },
                    success: function (oData, status, response) {
                        const token = response.getResponseHeader("X-CSRF-Token");
                        if (!token) {
                            const err = { message: "No se pudo obtener el token CSRF para MERGE" };
                            callback && callback({ iCode: -1, m: err.message });
                            return reject(err);
                        }

                        // 🔹 Ejecutamos MERGE (PATCH)
                        $.ajax({
                            url: url,
                            type: "POST", // SAP usa POST + X-HTTP-Method=MERGE
                            async: true,
                            headers: {
                                "X-CSRF-Token": token,
                                "X-HTTP-Method": "MERGE",
                                "Accept": "application/json",
                                "Content-Type": "application/json"
                            },
                            data: JSON.stringify(oBody || {}),
                            success: function (result) {
                                const resp = {
                                    iCode: 1,
                                    c: "suc",
                                    m: "Éxito HTTP - MERGE",
                                    data: result?.d || result
                                };
                                callback && callback(resp);
                                resolve(resp);
                            },
                            error: function (xhr, status, error) {
                                const resp = {
                                    iCode: -1,
                                    c: "err",
                                    m: "Error HTTP - MERGE",
                                    status: xhr.status,
                                    data: error,
                                    responseText: xhr.responseText
                                };
                                callback && callback(resp);
                                reject(resp);
                            }
                        });
                    },
                    error: function (xhr, status, error) {
                        const resp = {
                            iCode: -1,
                            c: "err",
                            m: "Error HTTP - GET (token MERGE)",
                            status: xhr.status,
                            data: error
                        };
                        callback && callback(resp);
                        reject(resp);
                    }
                });
            });
        },
		oDataConsultODATAAsync: async function (sMethod, sUrl, aFilters, aParams, sVersion, oContext) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: sUrl,
                    type: sMethod || "GET",
                    async: true,
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    success: function (data) {
                        // ✅ Estructuramos la respuesta como hace SAP Gateway
                        resolve({
                            d: data.d || data
                        });
                    },
                    error: function (xhr, status, error) {
                        console.error("Error en oDataConsultODATAAsync:", error);
                        reject({
                            status: xhr.status,
                            message: xhr.responseText || error
                        });
                    }
                });
            });
        },
        postoDataBatchAsync :function (context, urlForToken, urlBatch, batchBody, extraHeaders = {}) {
        return new Promise((resolve, reject) => {
            $.ajax({
            url: urlForToken,                    // ej: sServiceUrltoken + "$metadata"
            type: "GET",
            headers: { "x-CSRF-Token": "Fetch" },
            success: function (_data, _status, resp) {
                const token = resp.getResponseHeader("x-csrf-token");

                $.ajax({
                url: urlBatch,                   // ej: sServiceUrl + "$batch"
                method: "POST",
                contentType: "multipart/mixed; boundary=batch_123", // <- real
                headers: Object.assign({
                    "x-csrf-token": token,
                    "Accept": "multipart/mixed"   // <- importante
                }, extraHeaders),
                data: batchBody,                 // string multipart
                processData: false,              // no tocar el body
                success: (result) => resolve(result),
                error:   (xhr)    => reject(xhr)
                });
            },
            error: (xhr) => reject(xhr)
            });
        });
        },
		postOData: function(context, sUrl, oData, callback) {
            // Llama a tu utilHttp.Post genérico
            try {
                utilHttp.Post(sUrl, oData, function(result) {
                    if (callback) callback(result);
                }, context);
            } catch (error) {
                console.error("Error en postOData:", error);
                sap.m.MessageBox.error("Error enviando datos a SAP: " + error.message);
            }
        }
        
	};
});