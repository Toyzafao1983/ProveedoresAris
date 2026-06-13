sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"./utilResponse",
	"../constantes",
	"./util",
	"./utilPopUps"
], function (Controller, JSONModel, utilResponse, constantes, util, utilPopUps) {
	"use strict";
	return {
		getToken: function (callback) {
			$.ajax({
				url: "/JavaService/TokenSession",
				method: "GET",
				async:false,
				success: function (result) {
					callback(result);
				},
				error: function (xhr, status, error) {
					callback(null);
				}
			});
		},
		HandlerErrorRed: function (e, textStatus, errorThrown) {
			var codigoError = "Error: " + e.status;
			sap.ui.core.BusyIndicator.hide();
			utilPopUps.onMessageErrorDialogPress(codigoError);
			// sap.ui.core.BusyIndicator.hide()
		},
		HandlerErrorToken: function () {
			var codigoError = "Error al obtener el token de acceso";
			utilPopUps.onMessageErrorDialogPress(codigoError);
			sap.ui.core.BusyIndicator.hide()
		},
		getoData: function (self, tabla, oFilter, callback, urlParameters,flag) {
			var oDataModel = self.getView().getModel(constantes.modelOdata);
			var onSuccess = function (oDataModel) {
				var results = oDataModel.results;
				if(flag){
					sap.ui.core.BusyIndicator.hide();
				}
				callback(utilResponse.success('0000000', '', results));
			};
			var onError = function (error) {
				sap.ui.core.BusyIndicator.hide();
				callback(utilResponse.exception('0000000', 'Error al consultar los datos '));
			};
			var reqHeaders = {
				context: this, // mention the context you want
				success: onSuccess, // success call back method
				error: onError, // error call back method
				async: true // flage for async true
			};
			if (urlParameters) {
				reqHeaders.urlParameters = urlParameters;
			}
			if (oFilter.length !== 0) {
				reqHeaders.filters = [oFilter];
			}

			try {
				oDataModel.read(tabla, reqHeaders);
			} catch (ex) {}

		},
		encode: function (input) {
			var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

			function utf8_encode(string) {
				string = string.replace(/\r\n/g, "\n");
				var utftext = "";
				for (var n = 0; n < string.length; n++) {
					var c = string.charCodeAt(n);
					if (c < 128) {
						utftext += String.fromCharCode(c);
					} else if ((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192);
						utftext += String.fromCharCode((c & 63) | 128);
					} else {
						utftext += String.fromCharCode((c >> 12) | 224);
						utftext += String.fromCharCode(((c >> 6) & 63) | 128);
						utftext += String.fromCharCode((c & 63) | 128);
					}
				}
				return utftext;
			}

			var output = "";
			var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
			var i = 0;

			input = utf8_encode(input);

			while (i < input.length) {

				chr1 = input.charCodeAt(i++);
				chr2 = input.charCodeAt(i++);
				chr3 = input.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}

				output = output +
					keyStr.charAt(enc1) + keyStr.charAt(enc2) +
					keyStr.charAt(enc3) + keyStr.charAt(enc4);

			}

			return output;
		},
		tagAleatorio: function () {
			var tad1 = new Array("M=Ga", "VCaK", "OP=Q", "NNOA", "McXs", "ZZ=Q", "LJGS", "PNk=", "qswf", "ZVs2", "qaSa", "LNms", "CzSQ", "Nlsd",
				"SSd=", "HGas", "MRTG", "KhRt", "lGtR", "BvRt", "AzsF", "JkTr", "HGas", "QRXG", "KhRt", "PGtR", "Avtt ", "AzsF", "Fkxr");

			var aleat = Math.random() * tad1.length;
			aleat = Math.floor(aleat);
			return tad1[aleat];
		},

		generarIdTransaccion: function () {
			var fecha = new Date();
			var fechaIso = fecha.toISOString();
			var fechaString = fechaIso.toString().replace(/:/g, "").replace(/-/g, "").replace(".", "").replace("Z", "").replace("T", "");
			var randon = Math.floor((Math.random() * 1000000) + 1);
			var idTransaccion = fechaString + "" + randon;
			return idTransaccion;
		},

		validarRespuestaServicio: function (oAuditResponse, mensaje2) {
			if (oAuditResponse.iCode === 1) {
				utilPopUps.onMessageSuccessDialogPress(oAuditResponse.sIdTransaction, mensaje2);
			} else if (oAuditResponse.iCode === 200) {
				utilPopUps.onMessageWarningDialogPressExit(oAuditResponse.sIdTransaction, mensaje2);
			} else if (oAuditResponse.iCode > 1) {
				//var mensaje = oAuditResponse.sMessage;
				utilPopUps.onMessageWarningDialogPress2(oAuditResponse.sIdTransaction, mensaje2);
			} else if (oAuditResponse.iCode === 0) {
				utilPopUps.onMessageErrorDialogPress(oAuditResponse.sIdTransaction);
			} else {
				utilPopUps.onMessageErrorDialogPress(oAuditResponse.sIdTransaction);
			}
		},
		serviceRootpath: function () {
			var rootPath;
				rootPath = "/RavaService/IPROVIDER_FASE_2";
				//rootPath = "https://flpnwc-zdlgl0m4e5.dispatcher.br1.hana.ondemand.com/BnvDev";//Debugg
			return rootPath;
		},
		obtenerFechaIso: function () {
			var d = new Date();
			var fechaIso = d.toISOString();
			return fechaIso.toString();
		},
		generarHeaders: function (self, token) {
			var that = this;
			var userapi = self.getView().getModel("userapi");
			var request = {};
			request.sIdTransaccion = this.generarIdTransaccion();
			request.sAplicacion = constantes.IdApp;
			// that.getToken(function (result) {
			// 		request.sToken = that.tagAleatorio() + that.encode(result);
			// 	})
			if(userapi){
				var name = userapi.getProperty("/name");
				if(name){
					
				}else{
					name = "NoUser"
				}
			}else{
				var name = "";
			}
				request.sToken = this.tagAleatorio() + this.encode("F2E7F4AE0F1E9F419EE4D59042AD4E90")+ "/" + name;
				return request;
		},
		Post2: function (service, oResults, success, context) {
			var self = this;
			var oResults = {
				name:"kestefo",email:"kestefo@ravaconsulting.com.pe",displayName:"kestefo"
			};
			$.ajax({
				url: this.serviceRootpath() +service,
				// url: service,
				timeout: 0,
				headers: this.generarHeaders(context),
				data: JSON.stringify(oResults),
				contentType: "application/json; charset=utf-8",
				context: context,
				method: "POST",
				async: true,
				success: function (data) {
					sap.ui.core.BusyIndicator.hide();
					return data;
					if (data.oAuditResponse.iCode === 1) {
						util.ui.messageBox("El usuario ha sido registrado", 's', function () {});
					} else {
						util.http.validarRespuestaServicio(data.oAuditResponse, data.oAuditResponse.sMessage);
					}
				},
				error: self.HandlerErrorRed,
				complete: function () {
					console.log("--Se ejecutÃ³ llamada de red--");
				}
			});
		},
		Post3: function (service, oResults, callback, context) {
			/* Posibles parametros para post3: 
				service 
				oResults
				context
				callback */
			/* Recibe tres variantes de callback
			undefined, que ejecuta la función estándar
			callback como funcion para ejecutar una funcion reemplazando la original 
			callback como falso, que no hace nada con el éxito para manejarlo manualmente
			*/

			/* ¿Cuantos casos hay */
			// 01. Sin pasar funciones que se ejecute por default
			/* En este caso el callback le mando undefined y se ejecuta default */
			// 02. Sin pasar funciones que no ejecute nada
			/* Le mando falso */
			// 03. pasar funcion y que ejecute default
			/* Le mando una funcion */
			// 04. Pasar funcion y que no ejecute default
			// Le mando falso otra vez y manejo la funcion en otro lado 

			var self = this;

			// Por defecto
			// 01.Sin pasar funciones que se ejecute por default
			var success = function (data) {
				//   if (service.bSystemMessage)
				//   {
				// (service.sMensaje && data.oAuditResponse.iCode === 1) ? data..sMensaje: void 0;
				//   }
				if (!service.bSystemMessage) {
					(service.sMensaje && data.oAuditResponse.iCode === 1) ? data.oAuditResponse.sMessage = service.sMensaje: void 0;
				}
				self.validarRespuestaServicio(data.oAuditResponse, undefined, this);
			};

			// 02. Si no quiero que se ejecute default	
			if (callback === false) {
				var success = function (data) {};
			}

			// 03. Le paso una funcion y que ejecute default
			else if (callback) {
				var success = function (data) {
					if (!service.bSystemMessage) {
						(service.sMensaje && data.oAuditResponse.iCode === 1) ? data.oAuditResponse.sMessage = service.sMensaje: void 0;
					}
					self.validarRespuestaServicio(data.oAuditResponse, callback, this);
				};
			}

			// El caso 04 se logra poniendo false, y luego manejando la funcion pasada en el control original
			// var service = service.http.algo();
			// service.success(function(x){
			//    console.log("algo");
			//});

			var ajax = $.ajax({
				// url: service.sUrl,
				url: this.serviceRootpath() +service,
				timeout: 0,
				headers: this.generarHeaders(context),
				data: JSON.stringify(oResults),
				// data: '{"oResults":{"iId":574,"iContenedores":[],"iDocumentosTransporte":["4060","4059","4058","4062","4061"],"iPaquetes":[],"iPrecintos":[],"iAdjuntos":[],"iFletes":[]}}',
				context: context,
				contentType: "application/json; charset=utf-8",
				//context: context,
				method: "POST",
				async: true,
				success: success,
				complete: function () {
				},
				error: self.HandlerErrorRed
			});
			return ajax;
		},
		PostSync: function (service, oResults, success, context) {
			var self = this;
			$.ajax({
				url: this.serviceRootpath() + service,
				timeout: 0,
				headers: this.generarHeaders(context),
				data: JSON.stringify(oResults),
				contentType: "application/json; charset=utf-8",
				context: context,
				method: "POST",
				async: false,
				success: success,
				error: self.HandlerErrorRed,
				complete: function () {
					console.log("--Se ejecutÃ³ llamada de red--");
				}
			});
		},
		Post: function (service, oResults, success, context) {

			var self = this;
			var headers = self.generarHeaders(context);
			// var headers = {
			// 	  Authorization: "Basic VVNSX1JBVkE6UmF2YTIwMjAk"
			// 	};
			// const promise =Promise.resolve(headers);
			
			// promise.then((value) => {
				$.ajax({
					url: self.serviceRootpath() + service,
					timeout: 0,
					headers: headers,
					data: JSON.stringify(oResults),
					contentType: "application/json; charset=utf-8",
					context: context,
					method: "POST",
					async: true,
					success: success,
					error: self.HandlerErrorRed,
					complete: function () {
						console.log("--Se ejecutÃ³ llamada de red--");
					}
				});
			// });
			
		},
		SessionUserGet: function (url, callback) {
			$.ajax({
				url: url,
				method: "GET",
				async: true,
				contentType: 'application/json',
				dataType: 'json',
				success: function (result) {
					var respuestaService = {
						iCode:1,
						c: "suc",
						u: url,
						m: "Exito HTTP - GET",
						data: result.data          
					};
					return callback(respuestaService);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: url,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		
		SessionUserGetAsync: function (url, callback) {
			$.ajax({
				url: url,
				method: "GET",
				async: false,
				contentType: 'application/json',
				dataType: 'json',
				success: function (result) {
					var respuestaService = {
						iCode:1,
						c: "suc",
						u: url,
						m: "Exito HTTP - GET",
						data: result          
					};
					return callback(respuestaService);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: url,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		
		Get: function (service, oResults, success, context) {
			$.ajax({
				url: this.serviceRootpath() + service,
				// url: url + service,
				timeout: 0,
				contentType: "application/json",
				context: context,
				method: "GET",
				async: true,
				success: success,
				error: this.HandlerErrorRed,
				complete: function () {
					jQuery.sap.log.info("--Se ejecutÃ³ llamada de red--");
				}
			});
		},
		ERPGetAsync: function (url, callback) {
			$.ajax({
				url: url,
				method: "GET",
				async: true,
				contentType: 'application/json',
				dataType: 'json',
				success: function (result) {
					if( !Array.isArray(result.d.results) ){delete result.d.results.__metadata}
					var respuestaService = {
						iCode:1,
						c: "suc",
						u: url,
						m: "Exito HTTP - GET",
						data: Array.isArray(result.d.results) ? result.d.results.map(({ __metadata, ...rest }) => rest) : result.d.results     
					};
					return callback(respuestaService);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: url,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		ERPGetSync: function (url, callback) {
			$.ajax({
				url: url,
				method: "GET",
				async: false,
				contentType: 'application/json',
				dataType: 'json',
				success: function (result) {
					if( !Array.isArray(result.d.results) ){delete result.d.results.__metadata}
					var respuestaService = {
						iCode:1,
						c: "suc",
						u: url,
						m: "Exito HTTP - GET",
						data: Array.isArray(result.d.results) ? result.d.results.map(({ __metadata, ...rest }) => rest) : result.d.results
					};
					return callback(respuestaService);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: url,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		ERPGetSyncNotResult: function (url, callback) {
			$.ajax({
				url: url,
				method: "GET",
				async: false,
				contentType: 'application/json',
				dataType: 'json',
				success: function (result) {
					if( !Array.isArray(result.d) ){delete result.d.__metadata}
					var respuestaService = {
						iCode:1,
						c: "suc",
						u: url,
						m: "Exito HTTP - GET",
						data: Array.isArray(result.d) ? result.d.map(({ __metadata, ...rest }) => rest) : result.d
					};
					return callback(respuestaService);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: url,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		ERPPostTokenSync: function (urlget, urlpost, data, callback) {
			$.ajax({
				url: urlget,
				type: "GET",
				async: false,
				headers: {"x-CSRF-Token": "Fetch"},
				success: function (oData, status, response) {
					var token = response.getResponseHeader("x-csrf-token");
					$.ajax({
						url: urlpost,
						method: "POST",
						headers: {"x-CSRF-Token": token},
						async: false,
						contentType: "application/json",
						dataType: "json",
						data: JSON.stringify(data),
						success: function (result) {
							var respuestaService = {
								iCode:1,
								c: "suc",
								u: urlpost,
								m: "Exito HTTP - GET",
								data: result.d
							};
							return callback(respuestaService);
						},
						error: function (xhr, status, error) {
							var respuestaService = {
								iCode:-1,
								c: "ex",
								u: urlpost,
								m: "Error HTTP - GET",
								data: error
							};
							return callback(respuestaService);
						}
					});
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: urlpost,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		ERPPostTokenAsync: function (urlget, urlpost, data, callback) {
			$.ajax({
				url: urlget,
				type: "GET",
				async: true,
				headers: {"x-CSRF-Token": "Fetch"},
				success: function (oData, status, response) {
					var token = response.getResponseHeader("x-csrf-token");
					$.ajax({
						url: urlpost,
						method: "POST",
						headers: {"x-CSRF-Token": token},
						async: true,
						contentType: "application/json",
						dataType: "json",
						data: JSON.stringify(data),
						success: function (result) {
							var respuestaService = {
								iCode:1,
								c: "suc",
								u: urlpost,
								m: "Exito HTTP - GET",
								data: result.d
							};
							return callback(respuestaService);
						},
						error: function (xhr, status, error) {
							var respuestaService = {
								iCode:-1,
								c: "ex",
								u: urlpost,
								m: "Error HTTP - GET",
								data: error,
								responseText: xhr.responseText,
								status: xhr.status
							};
							return callback(respuestaService);
						}
					});
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						iCode:-1,
						c: "ex",
						u: urlpost,
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		Put: function (service, oData, success, context) {
			$.ajax({
				url: this.serviceRootpath() + service,
				timeout: 0,
				headers: this.generarHeaders(context),
				data: JSON.stringify(oData),
				contentType: "application/json; charset=utf-8",
				context: context,
				method: "PUT",
				async: true,
				success: success,
				error: this.HandlerErrorRed,
				complete: function () {
					console.log("--Se ejecutÃ³ llamada de red--");
				}
			});
		},
		Delete: function (service, oData, success, context) {
			$.ajax({
				url: this.serviceRootpath() + service,
				timeout: 0,
				headers: this.generarHeaders(context),
				data: JSON.stringify(oData),
				contentType: "application/json; charset=utf-8",
				context: context,
				method: "DELETE",
				async: true,
				success: success,
				error: this.HandlerErrorRed,
				complete: function () {
					console.log("--Se ejecutÃ³ llamada de red--");
				}
			});
		},
		restGet: function (url, callback) {
			$.ajax({
				url: url,
				method: "GET",
				async: false,
				contentType: 'application/json',
				dataType: 'json',
				success: function (result) {
					return callback(result);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						c: "ex",
						m: "Error HTTP - GET",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		restPost: function (url, data, callback) {
			$.ajax({
				url: url,
				method: "POST",
				async: false,
				contentType: 'application/json',
				dataType: 'json',
				data: JSON.stringify(data),
				success: function (result) {
					return callback(result);
				},
				error: function (xhr, status, error) {
					var respuestaService = {
						c: "ex",
						m: "Error HTTP - POST",
						data: error
					};
					return callback(respuestaService);
				}
			});
		},
		httpPost: function (path, content, callback, data) {
			$.ajax({
				url: "/DocumentService" + path,
				method: "POST",
				cache: false,
				async: true,
				data: JSON.stringify({
					content: content
				}),
				timeout: 5000000,
				contentType: "application/json charset=utf-8",
				success: function (result) {
					try {
						return callback(JSON.parse(result), data);
					} catch (e) {
						return callback(result, data);
					}
				},
				error: function (error) {
					var respuestaError = utilResponse.error("Error del sistema", error);
					return callback(respuestaError);
				}
			});
		},

		ftp: function (NroEntrega, objRequest) {
			var pathService = constantes.URLFTPService;
			var resultFTP = {};
			$.ajax({
				url: pathService,
				type: "POST",
				dataType: 'json',
				async: false,
				contentType: "application/json; charset=utf-8",
				data: JSON.stringify(objRequest),
				success: function (result) {
					var respuestaService = {
						c: "s",
						m: "",
						data: result
					};
					resultFTP = respuestaService;
				},
				error: function (xhr, resp, text) {
					var respuestaService = {
						c: "ex",
						m: "Exepcion del sistema",
						data: error
					};
					resultFTP = respuestaService;
				}
			});

			return resultFTP;
		}
	};
});