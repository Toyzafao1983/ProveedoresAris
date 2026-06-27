sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/Text',
	"sap/ui/layout/VerticalLayout",
	"sap/ui/core/routing/History",
	'sap/ui/model/Filter',
	"./utilController",
	"com/aris/proveedores/facturaexterior/pe/model/formatter"
], function (JSONModel, MessageBox, MessageToast, Button, Dialog, Text, VerticalLayout, History, Filter, utilController, formatter) {
	"use strict";
	var imgSaasa = ''
	var imagenes = [];
	var cCodigoUA = 0;
	var imgX = 22;
	var imgY = 108;
	var cLoad = 0;
	var cImgPage = 1;	
	return {  
		loadingPage: function (self, valor) {
			self.getView().getModel("ui").setProperty("/loadingPage", valor);
			self.getView().getModel("ui").refresh();
		},
		validarEmail: function (email) {
			var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/; ///^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
			var indicador = "";
			if (!email.match(rexMail)) {
				indicador = false;
			} else {
				indicador = true;
			}
			return indicador;
		},
		onFiltrarTablaLive: function (self, idInput, idTabla, fields) {
			var oView = self.getView();
			var Input = oView.byId(idInput);
			var oTable = oView.byId(idTabla);
			var valor = Input.getValue();
			this.filterSearchBoxList(oTable, valor, fields);
		},
		filterSearchBoxList: function (tablaLista, valor, params) {
			var oBinding = tablaLista.mBindingInfos.items.binding; //tablaLista.getBinding();
			// apply filters to binding
			var aFilters = [];
			params.forEach(function (item) {
				aFilters.push(new Filter(item.key, item.query, valor));
			});
			var filter = new Filter({
				filters: aFilters,
				and: false
			});
			oBinding.filter(filter);
		},
		filterSearchBoxList2: function (tablaLista, valor, params) {
			var oBinding = tablaLista.getBinding();
			// apply filters to binding
			var aFilters = [];
			params.forEach(function (item) {
				aFilters.push(new Filter(item.key, item.query, valor));
			});
			var filter = new Filter({
				filters: aFilters,
				and: false
			});
			oBinding.filter(filter);
		},
		FiltrarCampos2: function (self, modelo, tabla, arrayFiltros, nuevoModel, resolve, reject) {
			var oDataModel = self.getView().getModel(modelo);
			//new Filter("CodigoTabla", "EQ", "tipo_usuario");
			var onSuccess = function (oDataModel) {
				var results = oDataModel.results;
				var filtrado = new JSONModel(results);
				self.getView().setModel(filtrado, nuevoModel);
				self.getView().getModel(nuevoModel);
				self.getView().getModel(nuevoModel).refresh();
				resolve(results);
				sap.ui.core.BusyIndicator.hide()
				Busy.close();

			};
			//Handler en caso de error
			var onError = function (error) {
				reject();
				sap.ui.core.BusyIndicator.hide()
				Busy.close();
			};
			var reqHeaders = {
				filters: arrayFiltros,
				context: this, // mention the context you want
				success: onSuccess, // success call back method
				error: onError, // error call back method
				async: false // flage for async true
			};

			oDataModel.read("/" + tabla, reqHeaders);
		},
		FiltrarCampos: function (self, modelo, tabla, arrayFiltros, nuevoModel, nuevoTabla) {
			var oDataModel = self.getView().getModel(modelo);
			//new Filter("CodigoTabla", "EQ", "tipo_usuario");
			var onSuccess = function (oDataModel) {
				var results = oDataModel.results;
				self.getView().getModel(nuevoModel).setProperty("/" + nuevoTabla, results);
				self.getView().getModel(nuevoModel).refresh();
				sap.ui.core.BusyIndicator.hide()
				Busy.close();
			};
			//Handler en caso de error
			var onError = function (error) {
				sap.ui.core.BusyIndicator.hide()
				Busy.close();
			};
			var reqHeaders = {
				filters: arrayFiltros,
				context: this, // mention the context you want
				success: onSuccess, // success call back method
				error: onError, // error call back method
				async: false // flage for async true
			};
			oDataModel.read("/" + tabla, reqHeaders);
		},
		onMensajeGeneral: function (self, mensaje) {
			var dialog = new sap.m.Dialog({
				title: 'Mensaje',
				type: 'Message',
				content: new sap.m.Text({
					text: mensaje
				}),
				beginButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						dialog.close();
					}.bind(self)
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageErrorDialogPress: function (idTransaccion, message) {
			var mensaje = message ? message : 'Ocurrió un error en el servicio';
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Error',
				type: 'Message',
				state: 'Error',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							//id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					icon: 'sap-icon://copy',
					//id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function () {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		
		onMessageErrorDialogPress2: function ( message) {
			var mensaje = message ? message : 'Ocurrió un error en el servicio';
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Error',
				type: 'Message',
				state: 'Error',
				contentWidth: 'auto',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							// textAlign: 'Center'
								//id: 'txtMensaje'
						}),
					]
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		onMessageWarningDialogPress: function (idTransaccion, mensaje) {
			var that = this;
			var dialog = new Dialog({
				//id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							//id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					visible: false,
					icon: 'sap-icon://copy',
					//id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function () {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		
		onMessageWarningDialogPress2: function (mensaje) {
			var that = this;
			var dialog = new Dialog({
				//id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						})
					]
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		
		onMessageWarningDialogPressExit: function (idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							//id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					visible: false,
					icon: 'sap-icon://copy',
					//id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function () {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'Salir',
					press: function () {
						var aplicacion = "#";
						var accion = "";
						that.regresarAlLaunchpad(aplicacion, accion);
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageWarningDialogPress2: function (idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new Text({
						text: mensaje + '\n' + '\n',
						textAlign: 'Center'
							//id: 'txtMensaje'
					})]
				}),
				beginButton: new sap.m.Button({
					visible: false,
					icon: 'sap-icon://copy',
					//id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function () {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageSuccessDialogPress: function (idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Éxito',
				type: 'Message',
				state: 'Success',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							//id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					icon: 'sap-icon://copy',
					//id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function () {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'Cerrar',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageSuccessDialogPress2: function (idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Éxito',
				type: 'Message',
				state: 'Success',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						})
					]
				}),
				
				endButton: new sap.m.Button({
					text: 'Cerrar',
					press: function () {
						dialog.destroy();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageSuccessDialogPressSuccesFunctionEnd: function (idTransaccion, mensaje, events,result) {
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Éxito',
				type: 'Message',
				state: 'Success',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						})
					]
				}),
				
				endButton: new sap.m.Button({
					text: 'Cerrar',
					press: function () {
						dialog.destroy();
						events.success(result.oResults,result.oAuditResponse.sMessage);
					}
				}),
				afterClose: function () {
					dialog.destroy();
					events.success(result.oResults,result.oAuditResponse.sMessage);
				}
			});

			dialog.open();
		},
		
		onMessageSuccessDialogPressInformationFunctionEnd: function (idTransaccion, mensaje, events,result) {
			var that = this;
			var dialog = new sap.m.Dialog({
				//id: 'dglExitoso',
				title: 'Mensaje',
				type: 'Message',
				state: 'Information',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					//id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center'
								//id: 'txtMensaje'
						})
					]
				}),
				
				endButton: new sap.m.Button({
					text: 'Cerrar',
					press: function () {
						dialog.destroy();
						events.success(result.oResults,result.oAuditResponse.sMessage);
					}
				}),
				afterClose: function () {
					dialog.destroy();
					events.success(result.oResults,result.oAuditResponse.sMessage);
				}
			});

			dialog.open();
		},

		messageStrip: function (controller, id, message, tipo) {

			var control = controller.getView().byId(id);
			control.setText(message);
			control.setShowIcon(true);
			control.setShowCloseButton(false);

			if (!tipo) {
				control.setType("Information");
			}

			if (tipo.toUpperCase() === "E") {
				control.setType("Error");
			}

			if (tipo.toUpperCase() === "S") {
				control.setType("Success");
			}

			if (tipo.toUpperCase() === "W") {
				control.setType("Warning");
			}

			if (tipo.toUpperCase() === "I") {
				control.setType("Information");
			}
		},
		objectListItemSelectedItem: function (event, model) {
			return event.getSource().getBindingContext(model) == undefined ? false : event.getSource().getBindingContext(model).getObject();
		},
		messageBox: function (mensaje, tipo, callback) {
			if (tipo.toUpperCase() === "C") {
				MessageBox.show(mensaje, {
					icon: MessageBox.Icon.QUESTION,
					title: "Confirmación",
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAnswer) {
						return callback(sAnswer === MessageBox.Action.YES);
					}
				});
			}

			if (tipo.toUpperCase() === "I") {
				MessageBox.information(mensaje, {
					title: "Información",
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					onClose: function (sAnswer) {
						return callback(sAnswer === MessageBox.Action.YES);
					}
				});
			}

			if (tipo.toUpperCase() === "E") {
				MessageBox.error(mensaje, {
					onClose: function (sAnswer) {
						return callback(sAnswer === MessageBox.Action.YES);
					}
				});
			}

			if (tipo.toUpperCase() === "S") {
				MessageBox.success(mensaje, {
					onClose: function (sAnswer) {
						return callback(sAnswer === MessageBox.Action.YES);
					}
				});
			}

		},
		messageToast: function (data) {
			return MessageToast.show(data, {
				duration: 3000
			});
		},
		imageResize: function (srcData, width, height) {
			var imageObj = new Image(),
				canvas = document.createElement("canvas"),
				ctx = canvas.getContext('2d'),
				xStart = 0,
				yStart = 0,
				aspectRadio,
				newWidth,
				newHeight;

			imageObj.src = srcData;
			canvas.width = width;
			canvas.height = height;

			aspectRadio = imageObj.height / imageObj.width;

			if (imageObj.height < imageObj.width) {
				//horizontal
				aspectRadio = imageObj.width / imageObj.height;
				newHeight = height,
					newWidth = aspectRadio * height;
				xStart = -(newWidth - width) / 2;
			} else {
				//vertical
				newWidth = width,
					newHeight = aspectRadio * width;
				yStart = -(newHeight - height) / 2;
			}

			ctx.drawImage(imageObj, xStart, yStart, newWidth, newHeight);

			return canvas.toDataURL("image/jpeg", 0.75);
		},
		resizeImg: function (img, maxWidth, maxHeight, degrees) {
			var imgWidth = img.width,
				imgHeight = img.height;

			var ratio = 1,
				ratio1 = 1,
				ratio2 = 1;
			ratio1 = maxWidth / imgWidth;
			ratio2 = maxHeight / imgHeight;

			// Use the smallest ratio that the image best fit into the maxWidth x maxHeight box.
			if (ratio1 < ratio2) {
				ratio = ratio1;
			} else {
				ratio = ratio2;
			}
			var canvas = document.createElement("canvas");
			var canvasContext = canvas.getContext("2d");
			var canvasCopy = document.createElement("canvas");
			var copyContext = canvasCopy.getContext("2d");
			var canvasCopy2 = document.createElement("canvas");
			var copyContext2 = canvasCopy2.getContext("2d");
			canvasCopy.width = imgWidth;
			canvasCopy.height = imgHeight;
			copyContext.drawImage(img, 0, 0);

			// init
			canvasCopy2.width = imgWidth;
			canvasCopy2.height = imgHeight;
			copyContext2.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvasCopy2.width, canvasCopy2.height);

			var rounds = 1;
			var roundRatio = ratio * rounds;
			for (var i = 1; i <= rounds; i++) {

				// tmp
				canvasCopy.width = imgWidth * roundRatio / i;
				canvasCopy.height = imgHeight * roundRatio / i;

				copyContext.drawImage(canvasCopy2, 0, 0, canvasCopy2.width, canvasCopy2.height, 0, 0, canvasCopy.width, canvasCopy.height);

				// copy back
				canvasCopy2.width = imgWidth * roundRatio / i;
				canvasCopy2.height = imgHeight * roundRatio / i;
				copyContext2.drawImage(canvasCopy, 0, 0, canvasCopy.width, canvasCopy.height, 0, 0, canvasCopy2.width, canvasCopy2.height);

			} // end for

			canvas.width = imgWidth * roundRatio / rounds;
			canvas.height = imgHeight * roundRatio / rounds;
			canvasContext.drawImage(canvasCopy2, 0, 0, canvasCopy2.width, canvasCopy2.height, 0, 0, canvas.width, canvas.height);

			if (degrees == 90 || degrees == 270) {
				canvas.width = canvasCopy2.height;
				canvas.height = canvasCopy2.width;
			} else {
				canvas.width = canvasCopy2.width;
				canvas.height = canvasCopy2.height;
			}

			canvasContext.clearRect(0, 0, canvas.width, canvas.height);
			if (degrees == 90 || degrees == 270) {
				canvasContext.translate(canvasCopy2.height / 2, canvasCopy2.width / 2);
			} else {
				canvasContext.translate(canvasCopy2.width / 2, canvasCopy2.height / 2);
			}
			canvasContext.rotate(degrees * Math.PI / 180);
			canvasContext.drawImage(canvasCopy2, -canvasCopy2.width / 2, -canvasCopy2.height / 2);

			var dataURL = canvas.toDataURL();
			return dataURL;
		},
		loading: function (bShow) {
			if (bShow === true) {
				sap.ui.core.BusyIndicator.show(10);
			} else {
				sap.ui.core.BusyIndicator.hide()
				Busy.close();
			}
		},
		getValueIN18: function (context, nameField) {
			return context.getView().getModel("i18n").getResourceBundle().getText(nameField);
			//{i18n>Description_TEXT}
		},
		crearExcel1: function (self, model, tabla, arrayFiltros, newModel, newTabla, arrayColumTabla, tituloExcel, nameFile) {
			var results = self.getView().getModel(model).getProperty("/" + tabla);
			this.onCreateExcel(self, results, newModel, arrayColumTabla, tituloExcel, nameFile);
		},
		crearExcelOdata1: function (self, model, tabla, arrayFiltros, newModel, newTabla, arrayColumTabla, tituloExcel, nameFile) {
			var that = this;
			var odata = "/" + tabla;
			var oDataModel = self.getView().getModel(model);
			//new Filter("CodigoTabla", "EQ", "tipo_usuario");
			var onSuccess = function (oDataModel) {
				var results = oDataModel.results;
				self.getView().getModel(newModel).setProperty("/" + newTabla, results);
				that.onCreateExcel(self, results, newModel, arrayColumTabla, tituloExcel, nameFile);
			};
			//Handler en caso de error
			var onError = function (error) {
			};
			var reqHeaders = {
				filters: arrayFiltros,
				context: self, // mention the context you want
				success: onSuccess, // success call back method
				error: onError, // error call back method
				async: false // flage for async true
			};
			oDataModel.read(odata, reqHeaders);
		},
		onCreateExcelPasado: function (self, resultados, newModel, arrayColumTabla, tituloExcel, nameFile) {
			/*for (var i = 0; i < resultados.length; i++) {
				resultados[i].FechaCreacion = resultados[i].FechaCreacion.getDate() + "/" + (resultados[i].FechaCreacion.getMonth() + 1) + "/" +
					resultados[i].FechaCreacion.getFullYear();
			}*/
			var rows = resultados;
			//////Inicio Fecha Actual/////////////////////////////////////////////////////////////////////////
			var date = new Date();
			var yyyy = date.getFullYear().toString();
			var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
			var dd = date.getDate().toString();
			var fechaActual = (dd[1] ? dd : "0" + dd[0]) + "/" + (mm[1] ? mm : "0" + mm[0]) + "/" + yyyy; // padding 
			//var fechaAct = (dd[1] ? dd : "0" + dd[0]) + (mm[1] ? mm : "0" + mm[0]) + yyyy; // padding 
			///////Fin Fecha Actual///////////////////////////////////////////////////////////////////////////
			var datefull = fechaActual; //this.formatter.date_full(new Date());
			var html = "";
			var tr = "";
			var th = "";
			var td = "";
			html = '<h2> ' + tituloExcel + ' </h2>';
			html = html + '<label>Fecha Reporte: ' + datefull + '</label>';
			var columnas = [];
			columnas = arrayColumTabla;
			/*[{
			        						name: "Id",
			        						model: "Id"
			        					   }];*/
			tr += '<tr>';
			for (var l = 0; l < columnas.length; l++) {
				var text = columnas[l].name;
				th += '<th style="background-color: #404040; color: #fff">' + text + '</th>';
			}
			tr += th + '</tr>';

			for (var j = 0; j < rows.length; j++) {
				tr += '<tr>';
				td = "";
				for (var k = 0; k < columnas.length; k++) {
					var item = rows[j][columnas[k].model];
					td += '<td style="background-color: #e6e6e6">' + item + '</td>';
				}
				tr += td + '</tr>';
			}
			html = html + '<table style="width:100%">' + tr + '</table>';
			var fileName = nameFile + fechaActual + ".xls";
			//var data_type = 'data:application/vnd.ms-excel';
			var ua = window.navigator.userAgent;
			var msie = ua.indexOf("MSIE");
			if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
				if (window.navigator.msSaveBlob) {
					var blob = new Blob([html], {
						type: "application/csv;charset=utf-8;"
					});
					navigator.msSaveBlob(blob, fileName);
				}
			} else {
				var blob2 = new Blob([html], {
					type: "application/csv;charset=utf-8;"
				});
				var filename = fileName;
				var elem = window.document.createElement('a');
				elem.href = window.URL.createObjectURL(blob2);
				elem.download = filename;
				document.body.appendChild(elem);
				elem.click();
				document.body.removeChild(elem);
			}
			self.getView().getModel(newModel).refresh(true);
		},
		///Inicio Export Excel///
		onExportExcel: function (self, model, tabla, arrayFiltros, newModel, newTabla, nameFile, nameHoja, mapEstructura) {
			var results = self.getView().getModel(model).getProperty("/" + tabla);
			this.onCreateExcel(self, results, newModel, nameFile, nameHoja, mapEstructura);
		},
		onExportExcelOdata: function (self, model, tabla, arrayFiltros, newModel, newTabla, nameFile, nameHoja) {
			var that = this;
			var odata = "/" + tabla;
			var oDataModel = self.getView().getModel(model);
			//new Filter("CodigoTabla", "EQ", "tipo_usuario");
			var onSuccess = function (oDataModel) {
				var results = oDataModel.results;
				self.getView().getModel(newModel).setProperty("/" + newTabla, results);
				that.onCreateExcel(self, results, newModel, nameFile, nameHoja);
			};
			//Handler en caso de error
			var onError = function (error) {
			};
			var reqHeaders = {
				filters: arrayFiltros,
				context: self, // mention the context you want
				success: onSuccess, // success call back method
				error: onError, // error call back method
				async: false // flage for async true
			};
			oDataModel.read(odata, reqHeaders);
		},
		onCreateExcel: function (self, results, newModel, nameFile, nameHoja, mapEstructura) {
			var data = mapEstructura(results);
			/* this line is only needed if you are not adding a script tag reference */
			if (typeof XLSX == 'undefined') XLSX = require('xlsx');
			/* make the worksheet */
			var ws = XLSX.utils.json_to_sheet(data);
			//Inicio Filtrar//
			var AutoFilter = {
				ref: "A1:E1"
			};
			ws['!autofilter'] = AutoFilter;
			//End Filtrar//
			//Inicio Tamaño de la Columna//
			/*var wscols = [{wpx: '100'},{wpx: '100'}];
			ws['!cols'] = wscols ;*/
			//End Tamaño de la Columna//
			//Inicio Agregar Comentario//
			/*ws.A2.c.hidden = true;
			ws.A2.c.push({a:"SheetJS", t:"This comment will be hidden"});*/
			//End Agregar Comentario//
			/* add to workbook */
			var wb = XLSX.utils.book_new();
			//Inicio Agregar Otra Hoja//
			/*wb.SheetNames.push("Test Sheet");
			var ws1 = XLSX.utils.aoa_to_sheet(data);
			wb.Sheets["Test Sheet"] = ws1;*/
			//End Agregar Otra Hoja//
			XLSX.utils.book_append_sheet(wb, ws, nameHoja);
			/* generate an XLSX file */
			//////Inicio Fecha Actual/////////////////////////////////////////////////////////////////////////
			var date = new Date();
			var yyyy = date.getFullYear().toString();
			var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
			var dd = date.getDate().toString();
			var fechaActual = (dd[1] ? dd : "0" + dd[0]) + "/" + (mm[1] ? mm : "0" + mm[0]) + "/" + yyyy;
			//////End Fecha Actual////////////////////////////////////////////////////////////////////////////
			XLSX.writeFile(wb, nameFile + fechaActual + ".xlsx");
		},
		///End Export Excel///
		///Inicio Import Excel///
		onImportExcel: function (self, oEvent, libro1, libro2, idFileUploader, mapEstructura, callback) {
			var file = oEvent.getParameter("files")[0];
			if (file && window.FileReader) {
				var reader = new FileReader();
				reader.onload = this.onReadFile.bind(self, self, libro1, libro2, idFileUploader, mapEstructura, callback);
				reader.readAsArrayBuffer(file);
			}
		},
		onReadFile: function (self, libro1, libro2, idFileUploader, mapEstructura, callback, evt) {
			var result = {};
			var data;
			var arr;
			var xlsx;
			data = evt.target.result;
			//var xlsx = XLSX.read(data, {type: 'binary'});
			arr = String.fromCharCode.apply(null, new Uint8Array(data));
			xlsx = XLSX.read(btoa(arr), {
				type: 'base64'
			});
			result = xlsx.Strings;
			result = {};
			xlsx.SheetNames.forEach(function (sheetName) {
				var rObjArr = XLSX.utils.sheet_to_row_object_array(xlsx.Sheets[sheetName]);
				if (rObjArr.length > 0) {
					result[sheetName] = rObjArr;
				}
			});
			var oResponse = {};
			oResponse.success = true;
			var contenido1 = result[libro1];
			var formatContenido1 = mapEstructura(contenido1);

			var contenido2 = result[libro2];
			var formatContenido2 = mapEstructura(contenido2);
			//self.getView().getModel(model).getProperty(tabla1)

			if ((!contenido1 || !contenido2) || (formatContenido1.length == 0 && formatContenido2.length == 0)) {
				oResponse.success = false;
			}
			self.getView().byId(idFileUploader).setValue("");
			oResponse.DocumentoTransporteMadre = formatContenido1;
			oResponse.DocumentoTransporteHija = formatContenido2;

			callback(oResponse);
		},
		///Inicio Import con MockData
		onImportExcel1: function (self, oEvent, model, tabla, idFileUploader, mapEstructura) {
			var file = oEvent.getParameter("files")[0];
			if (file && window.FileReader) {
				var reader = new FileReader();
				reader.onload = this.onReadFile.bind(self, self, model, tabla, idFileUploader, mapEstructura);
				reader.readAsArrayBuffer(file);
			}
		},
		onReadFile1: function (self, model, tabla, idFileUploader, mapEstructura, evt) {
			var result = {};
			var data;
			var arr;
			var xlsx;
			data = evt.target.result;
			//var xlsx = XLSX.read(data, {type: 'binary'});
			arr = String.fromCharCode.apply(null, new Uint8Array(data));
			xlsx = XLSX.read(btoa(arr), {
				type: 'base64'
			});
			result = xlsx.Strings;
			result = {};
			xlsx.SheetNames.forEach(function (sheetName) {
				var rObjArr = XLSX.utils.sheet_to_row_object_array(xlsx.Sheets[sheetName]);
				if (rObjArr.length > 0) {
					result[sheetName] = rObjArr;
				}
			});
			var contenido = result["SAP Document Export"]; //this.onRemoverHeader(data);
			//var localModel = this.getView().getModel("modelProductos");
			var formatContenido = mapEstructura(contenido);
			var modelTb = self.getView().getModel(model).getProperty(tabla) === undefined ? [] : self.getView().getModel(model).getProperty(tabla);
			var modelConcat = modelTb.concat(formatContenido);
			self.getView().getModel(model).setProperty(tabla, modelConcat);
			self.getView().byId(idFileUploader).setValue("");
		},
		onRemoverHeader1: function (data) {
			var excelKeys;
			var primerLibro = {};
			excelKeys = Object.keys(data);
			primerLibro.nombre = excelKeys[0];
			primerLibro.contenido = data[primerLibro.nombre];
			var shiftedInfo = primerLibro.contenido.shift();
			return primerLibro.contenido;
		},
		///End Import Mock Data
		///End Import Excel///

		///Inicio Descargar PDF///
		onGenerarPDFActaInventarioDirecta: function (value) {
			imagenes = [];
			cCodigoUA = 0;
			cLoad = 0;
			cImgPage = 1;
			var t = this;
			$.generarOrdenCompraPDF = function (value) {
				var doc = new jsPDF('p', 'mm', 'a4');
				var setCabecera = function (value) {
					var cord_X = 165;
					var cord_y = 5;
					doc.setFontSize(10);
					doc.setFont('arial', 'bold');
					doc.text(8, 5.5, value.RazonSocialTransportista);
					doc.setFontSize(8);
					doc.setFont('arial', 'normal');
					doc.text(8, 9.5, 'R.U.C.: '+value.RucTransportista);
					doc.text(8, 13, 'Dirección: '+value.DireccionTransportista);
					/////////////////////////////
					var date = new Date();
					var yyyy = date.getFullYear().toString();
					var mm = utilController.pad((date.getMonth() + 1).toString(),"0",2); // getMonth() is zero-based
					var dd = utilController.pad(date.getDate().toString(),"0",2);
					var h = utilController.pad(date.getHours(),"0", 2);
					var m = utilController.pad(date.getMinutes(),"0", 2);
					var s = utilController.pad(date.getSeconds(),"0", 2);
					var fechaActual =   dd + "/" + mm + "/" + yyyy; // padding 
					/////////////////////////////
					// doc.text(cord_X, cord_y, "Callao, "+fechaActual+" "+h+":"+m+":"+s);
				};
				var setSubCabecera = function (value) {
					doc.setFont('arial', 'bold');
					doc.setFontSize(13);
					doc.text(62, 30, 'ACTA DE INVENTARIO N° '+value.NumeroActaInventario);
				};

				var cordYLVertical = 75;
				var profundidadLVertical = 88.8;
				var setHeaderDetalle = function (value) {
					var cordX= 6;
					var cordY= 40;
					// doc.setFontSize(10);
					// doc.rect(cordX, cordY, 35, 6);//Horizontal
					// doc.text(cordX+9, cordY+4, 'Manifiesto');
					// doc.text(cordX+3, cordY+12, value.NumeroManifiesto);

					// doc.rect(cordX+37, cordY, 35, 6);//Horizontal
					// doc.text(cordX+40, cordY+4, 'Fecha Recepción');
					// doc.text(cordX+45, cordY+12, value.FechaRecepcion);

					// doc.rect(cordX+74, cordY, 35, 6);//Horizontal
					// doc.text(cordX+85, cordY+4, 'Vuelo');
					// doc.text(cordX+82, cordY+12, value.NumeroVuelo);

					// doc.rect(cordX+111, cordY, 37, 6);//Horizontal
					// doc.text(cordX+112.5, cordY+4, 'Doc. Transp. Directo');
					// doc.text(cordX+120, cordY+12, value.DocTransporteDirecta);

					// doc.rect(cordX+150, cordY, 37, 6);//Horizontal
					// doc.text(cordX+152, cordY+4, 'Doc. Transp. Máster');
					// doc.text(cordX+158, cordY+12, value.DocTransporteMaster);
					
				}
				var setCuerpoDetalle = function (value) {
					
					var coordX = 6;
					var coordY = 40;
					//doc.rect(8, 17, 130, 47);//Contorno de una linea
					
					/*
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**nroManifiestoCarga**", value.NumeroManifiesto);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**nroVuelo**", value.NumeroVuelo);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**nroDocumentoTransporte**", value.DocTransporteMaster);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**codPuntoLlegada**", value.NumeroInventario.PuntoLlegada);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**nomPuntoLlegada**", value.NumeroInventario.PuntoLlegadaDescripcion);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**fechaVuelo**", value.NumeroInventario.ManifiestoFechaLlegadaATAString);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**horaVuelo**", value.NumeroInventario.ManifiestoFechaHoraLlegadaATAString.slice(11));
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**fechaTarja**", value.NumeroInventario.ManifiestoFechaInicioTarjaString);
					value.BaseLegalMaster = value.BaseLegalMaster.replace("**horaTarja**", value.NumeroInventario.ManifiestoFechaHoraInicioTarjaString.slice(11));
					*/
					
					var sPuntoLlegada = value.NumeroInventario.PuntoLlegadaDescripcion.split('-');
					var sDesPuntoLlegada = sPuntoLlegada.length > 1 ? sPuntoLlegada[1] : sPuntoLlegada[0];
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY, "Siendo las               horas del                  en las  instalaciones  de  nuestro  Terminal  de  Carga   Aéreo  –  Punto   de   Llegada");
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+17, coordY, value.NumeroInventario.ManifiestoFechaHoraInicioTarjaString.slice(11));
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+47, coordY, value.NumeroInventario.ManifiestoFechaInicioTarjaString);
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					var textoSegundaLinea = "                                                                         identificado con código de aduanas N°        , se llevó a cabo la verificación física"
					doc.text(coordX, coordY+3.5, textoSegundaLinea);
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX, coordY+3.5, sDesPuntoLlegada);
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+132.5, coordY+3.5, value.NumeroInventario.PuntoLlegada);
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+7, "de los bultos arribados en mala condición exterior, los mismos que arribaron en el vuelo              a las              , de conformidad");
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+10.5, "del día                  al amparo del documento de transporte N°                      y manifiesto de carga de ingreso N°");
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+138, coordY+7, value.NumeroVuelo);
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX + 159.5, coordY+7, value.NumeroInventario.ManifiestoFechaHoraLlegadaATAString.slice(11));
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX + 11.5, coordY+10.5, value.NumeroInventario.ManifiestoFechaLlegadaATAString);
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX + 96, coordY+10.5, value.DocTransporteMaster);
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX + 173, coordY+10.5, value.NumeroManifiesto);
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+14.3, "con lo establecido en los artículos 102° y 106° de la Ley General de Aduanas aprobada por  Decreto Legislativo  N° 1053  y el");
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+18, "artículo 138° e inciso d) del artículo 146° de su Reglamento aprobado por Decreto Supremo N° 010-2009-EF en concordancia");
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+22, "con lo establecido en el numeral 3 de la sección IV del Procedimiento General “Manifiesto de Carga” DESPA-PG.09 versión 7,");
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+25.7, "aprobado por Resolución de Superintendencia N° 016-2020/SUNAT, el cual señala que:");
					
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+47.6, '“');
					
					doc.setFont('arial', 'bold');
					doc.text(coordX + 1.5, coordY+47.6, "IV. DEFINICIONES Y ABREVIATURAS ");
					
					doc.setFontSize(9);
					doc.setFont("arial");
					doc.setFont('arial', 'normal');
					//utilController.alignTextJsPDF(doc,value.BaseLegalMaster,coordX,coordY,180,"normal");    
					
					//doc.text(coordX, coordY, value.BaseLegalMaster);
					
					// Contorno de linea del marco en la cita
					coordY = coordY + 23;
					doc.setDrawColor(0, 0, 0);
					doc.roundedRect(coordX - 2, coordY + 20, 200, 33, 3, 3);
							
					doc.setFontSize(10);
					doc.setFont('arial', 'italic');
					utilController.alignTextJsPDF(doc,value.BaseLegalMasterCita,coordX,coordY+22,180,"justify");    
					//doc.text(coordX, coordY+22, value.BaseLegalMasterCita);
					
					
					coordY = coordY + 3;
					doc.setFont('arial', 'normal');
					// doc.text(coordX, coordY+56, 'TRANSPORTISTA');
					// doc.text(coordX+45, coordY + 56, ": "+ (value.Transportista.length > 57 ? value.Transportista.substring(0,56) : value.Transportista));
					// doc.rect(coordX+47, coordY + 56.5, 130, 0);//Horizontal
					
					var contenedor;
					if (value.Contenedor){
						contenedor=value.Contenedor;
					} else {
						contenedor='(S/C)';
					}
					
					doc.text(coordX, coordY+61, 'CONSIGNATARIO');
					doc.text(coordX+45, coordY +61, ": "+(value.Consignatario.length > 57 ? value.Consignatario.substring(0,56) : value.Consignatario));
					doc.rect(coordX+47, coordY + 61.5, 130, 0);//Horizontal

					doc.text(coordX, coordY+66, 'CONTENEDOR');
					doc.text(coordX+45, coordY + 66, ": "+ (contenedor.length > 57 ? contenedor.substring(0,56) : contenedor));
					doc.rect(coordX+47, coordY + 66.5, 130, 0);//Horizontal

					doc.text(coordX, coordY+71, 'DESCRIPCIÓN');
					doc.text(coordX+45, coordY + 71, ": "+ (value.Descripcion.length > 57 ? value.Descripcion.substring(0,56) : value.Descripcion));
					doc.rect(coordX+47, coordY + 71.5, 130, 0);//Horizontal
					
					
					////////////////////////////////////////////////

					var cordXSub = 30;
					var cordYSub = 145;
					doc.setFont('arial', 'bold');
					doc.rect(cordXSub, cordYSub, 35, 6);//Horizontal
					doc.text(cordXSub+8, cordYSub+4, 'Total Bultos');
					doc.text(cordXSub+16, cordYSub+11, value.aDetalle.BultosRecibidos);

					doc.rect(cordXSub+37, cordYSub, 35, 6);//Horizontal
					doc.text(cordXSub+39, cordYSub+4, 'Bultos mal estado');
					doc.text(cordXSub+51, cordYSub+11, value.aDetalle.BultosMalos);

					doc.rect(cordXSub+74, cordYSub, 35, 6);//Horizontal
					doc.text(cordXSub+82, cordYSub+4, 'Peso Total');
					doc.text(cordXSub+90, cordYSub+11, value.aDetalle.PesoRecibidos);

					doc.rect(cordXSub+111, cordYSub, 35, 6);//Horizontal
					doc.text(cordXSub+114, cordYSub+4, 'Peso mal estado');
					doc.text(cordXSub+125, cordYSub+11, value.aDetalle.PesoMalos);

					var cordXComent = 14;
					var cordYComent = 165;
					doc.text(cordXComent, cordYComent, 'DESCRIPCION DE LA INCIDENCIA:');
					doc.rect(cordXComent, cordYComent+0.5, 59, 0);//Horizontal
					doc.setFont('arial', 'normal');
					utilController.alignTextJsPDF2(doc,value.Observacion,cordXComent,cordYComent+9,180,"justify");
					//doc.text(cordXComent, cordYComent+9, value.Observacion);
					//doc.rect(cordXComent, cordYComent+10, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+16, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+22, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+28, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+34, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+40, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+46, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+52, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+58, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+64, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+70, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+76, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+82, 180, 0);//Horizontal
					//doc.rect(cordXComent, cordYComent+60, 180, 0);//Horizontal

					cordYComent = cordYComent + 8;
					doc.rect(cordXComent+25, cordYComent+100, 55, 0);//Horizontal
					doc.text(cordXComent+35, cordYComent+104, 'Nombres y Apellidos');
					doc.text(cordXComent+39, cordYComent+108, 'Transportista');

					doc.rect(cordXComent+98, cordYComent+100, 55, 0);//Horizontal
					doc.text(cordXComent+108, cordYComent+104, 'Nombres y Apellidos');
					doc.text(cordXComent+109, cordYComent+108, 'Depósito Temporal');
					
				};
				
				var setDetalleSegundaPagina = function (value) {
					
					doc.setFont('arial', 'bold');
					doc.setFontSize(10);
					doc.text(13, 30, 'FOTOS DE BULTOS ARRIBADOS EN MALA CONDICION EXTERIOR – ACTA DE INVENTARIO N° '+ value.NumeroActaInventario);
					
					var coordX = 9;
					var coordY = 40;
					
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{nroManifiestoCarga}}", value.NumeroManifiesto);
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{actaInventario}}", value.NumeroActaInventario);
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{nroDocumentoTransporte}}", value.DocTransporteDirecta);
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{codPuntoLlegada}}", value.NumeroInventario.PuntoLlegada);
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{nomPuntoLlegada}}", value.NumeroInventario.PuntoLlegadaDescripcion);
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{fechaTarja}}", value.NumeroInventario.ManifiestoFechaInicioTarjaString);
					value.BaseLegalMasterMalaCond = value.BaseLegalMasterMalaCond.replace("{{horaTarja}}", value.NumeroInventario.ManifiestoFechaHoraInicioTarjaString.slice(11));
					
					var sPuntoLlegada = value.NumeroInventario.PuntoLlegadaDescripcion.split('-');
					var sDesPuntoLlegada = sPuntoLlegada.length > 1 ? sPuntoLlegada[1] : sPuntoLlegada[0];
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY, "Conforme a lo descrito en la sección  “DESCRIPCIÓN DE LA INCIDENCIA” del  ACTA  DE  INVENTARIO  N°");
					
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX + 173, coordY, value.NumeroActaInventario);
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+4, "formulada a las                horas del                   en las instalaciones del Depósito Temporal");
					
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+25, coordY+4, value.NumeroInventario.ManifiestoFechaHoraInicioTarjaString.slice(11));
					
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+56, coordY+4, value.NumeroInventario.ManifiestoFechaInicioTarjaString);
					
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+142, coordY+4, sDesPuntoLlegada.substring(0, 24));
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX + 15, coordY+7.8, "              identificado con código de aduanas N°        , a   través   del  presente   documento  se deja  constancia");
					
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX, coordY+7.8, sDesPuntoLlegada.substring(24, sDesPuntoLlegada.length));

					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+89.3, coordY+7.8, value.NumeroInventario.PuntoLlegada);

					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+11.6, "de  la  recepción  de  los bultos arribados   en   mala  condición   exterior   correspondiente   al  documento  de  transporte");
					
					doc.setFontSize(10);
					doc.setFont('arial', 'normal');
					doc.text(coordX, coordY+15.6, "N°                       y manifiesto de carga de ingreso N°");
					
					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+5, coordY+15.6, value.DocTransporteDirecta);

					doc.setFontSize(9);
					doc.setFont('arial', 'bold');
					doc.text(coordX+83, coordY+15.6, value.NumeroManifiesto + ":");
					
					doc.setFontSize(10.5);
					doc.setFont('arial', 'normal');
					//utilController.alignTextJsPDF(doc,value.BaseLegalMasterMalaCond,coordX,coordY,180,"normal");
					
					doc.setDrawColor(0, 0, 0);
					doc.roundedRect(coordX-2, coordY + 25, 195, 33, 3, 3);
							
					doc.setFont('arial', 'italic');
					utilController.alignTextJsPDF(doc,value.BaseLegalMasterMalaCondCita,coordX,coordY+30,180,"normal");   
					
					if (value.Fotos.length > 0){
						doc.setFont('arial', 'bold');
						doc.text(coordX + 5, coordY + 64.5, "UA N°: " + value.Fotos[0]);	
					
						cCodigoUA += 2;
					}
					
					coordX = coordX + 4;
					coordY = coordY + 68;
					doc.rect(coordX, coordY, 80, 87);
					doc.rect(coordX + 100, coordY, 80, 87);
					doc.rect(coordX, coordY + 90, 80, 87);
					doc.rect(coordX + 100, coordY + 90, 80, 87);
				};

				var setFooter = function (value, cord_x) {
				};
				var cordXTabla = 36;
				var cordYTabla = 80;
				var setDetalle = function (Detalle) {
					setCabecera(value);
					setSubCabecera(value);
					setHeaderDetalle(value);
					setCuerpoDetalle(value);
					setFooter(value);
				};
				var setSegundaPagina = function (Detalle) {
					doc.addPage();
					setCabecera(value);
					setDetalleSegundaPagina(value);
				};
				// DETALLE
				var Detalle = value.aDetalle;
				setDetalle(Detalle);
				setSegundaPagina(Detalle);
				
				var cX = 16;
				var cY = 40;
				var cSinImg = 1;
				if (value.Fotos.length > 0){
					$.each(value.Fotos, function(i, e){
						var img1 = new Image();
						if (e.indexOf("SaasaService") > -1){
							imagenes.push(e);
							img1.src = e	
						}else{
							cSinImg++;
						}
					});
					if ((imagenes.length-1) == (value.Fotos.length - cSinImg)){
						t.loadImage(doc, value, cSinImg, {cX: cX-3, cY: cY}, {y1: 109, y2: 199}, 1);	
					}
				}else{
					sap.ui.core.BusyIndicator.hide()
					Busy.close();
					doc.save("DOCUMENTO-" + value.Titulo.trim() + '.pdf');
				}
				//terminosCondiciones(value);
				
			};
			
			$.generarOrdenCompraPDF(value);
		},
		loadImage: function(doc, value, cSinImg, dim, pos, formato) {
		    if (!imagenes.length) {
		        return;
		    }
		
		    var image = imagenes.shift();
			var t = this;
			var img = new Image();
			img.src = image;
		    img.onload = function() {
		    	if (img.src != ""){
					if (cLoad > 0){
						if (cLoad%4==0){
							doc.addPage();
							
							
							var idxCodigoHouse = cCodigoUA + cLoad + 1;
							if (formato==2){
								doc.setFont('arial', 'bold');
								cCodigoUA++;
								doc.text(dim.cX + 2, dim.cY - 7.5, "HOUSE N°: " + value.Fotos[idxCodigoHouse]);	
							}
							
							idxCodigoHouse--;
							doc.setFont('arial', 'bold');
							cCodigoUA++;
							doc.text(dim.cX + 2, dim.cY - 3, "UA  N°: " + value.Fotos[idxCodigoHouse]);
			
			
							doc.rect(dim.cX, dim.cY, 80, 87);
							doc.rect(dim.cX + 100, dim.cY, 80, 87);
							doc.rect(dim.cX, dim.cY + 90, 80, 87);
							doc.rect(dim.cX + 100, dim.cY + 90, 80, 87);
						
							cImgPage = 1;
						}	
					}
					
					switch(cImgPage){
						case 1:
							imgX = formato!=3? 14.7 : 17;
							imgY = cLoad<4?pos.y1:42;
							break;
						case 2:
							imgX = formato!=3? 114.7 : 117;
							imgY = cLoad<4?pos.y1:42;
							break;
						case 3:
							imgX = formato!=3? 14.7 : 17;
							imgY = cLoad<4?pos.y2:132;
							break;
						case 4:
							imgX = formato!=3? 114.7 : 117;
							imgY = cLoad<4?pos.y2:132;
							break;
					}
					
					doc.addImage(img, 'JPEG', imgX, imgY, 76, 84);	
					
					if (cLoad==(value.Fotos.length-cSinImg)){
						sap.ui.core.BusyIndicator.hide()
						Busy.close();
						var pageCount = doc.internal.getNumberOfPages();	
						//doc.deletePage(pageCount);
						doc.save("DOCUMENTO-" + value.Titulo.trim() + '.pdf');	
					}
					
					
					cLoad++;
					cImgPage++;	
				}
				
		        t.loadImage(doc, value, cSinImg, {cX: dim.cX, cY: dim.cY}, pos, formato);
		    };
		},
		onGenerarPDFReport: function (that,value) {
			const { jsPDF } = window.jspdf;

			var self = this;
			var doc = new jsPDF('p', 'mm', 'a4');
			//kassiel
			var date = new Date();
			var yyyy = date.getFullYear().toString();
			var mm = self.pad((date.getMonth() + 1).toString(), "0", 2); // getMonth() is zero-based
			var dd = self.pad(date.getDate().toString(), "0", 2);
			var h = self.pad(date.getHours(), "0", 2);
			var m = self.pad(date.getMinutes(), "0", 2);
			var s = self.pad(date.getSeconds(), "0", 2);
			var fechaActual = dd + "/" + mm + "/" + yyyy; // padding 
			var timeActual = h + ":" + m + ":" + s;
			var plusChofer=0;
			// Contador para el número de páginas
			var totalPagesExp = "{total_pages_count_string}";
			
			var pageSize = doc.internal.pageSize;
			var widthSize = pageSize.width - 19.5;
			var heightSize = pageSize.height - 19.5;
			
			var setCabecera = function (data) {};

			var setSubCabecera = function (data) {};

			var setHeaderDetalle = function (data) {};

			var setCuerpoDetalle = function (value) {
				var pageSize = doc.internal.pageSize;
				var widthSize = pageSize.width - 17.5;
				var heightSize = pageSize.height - 17.5;
				var heightLine = 5;
				
				var arrayLinea = [];
				var arrayCampo = [];
				var arrayFooter = [];
				var arrayFooterTotal = [];
				//////////////////////////////////////
				var cord_x_init = 12.5;
				var cord_y_init = 11;
				var coordX = 12.5;
				var coordY = 57;
				
				var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.yyyy",
					UTC: true
				});

				var HistorialOic = value;
				for (var i in HistorialOic) {
					var obj = HistorialOic[i];
					
					var sErdat =  obj.Erdat ? obj.Erdat : "";
					
					arrayCampo	=	[];
					arrayCampo.push( sErdat ? formatter.formatYYYYMMDDDateAbapDateHourSlash( sErdat ) : "" );
					arrayCampo.push(obj.Tplnr);
					arrayCampo.push(obj.Pltxt);
					arrayCampo.push(obj.Qmnum);
					arrayCampo.push( obj.Qmtxt );
					arrayCampo.push( obj.Txt30 );
					arrayCampo.push(obj.Innam);
					arrayCampo.push(obj.Oteil);
					arrayCampo.push( obj.Kurztex1 ? obj.Kurztex1 : "");
					arrayCampo.push( obj.Fecod ? obj.Fecod : "");
					arrayCampo.push( obj.Kurztex2 ? obj.Kurztex2 : "");
					arrayCampo.push( obj.Fecod ? obj.Fecod : "");
					arrayCampo.push( obj.Kurztex2 ? obj.Kurztex2 : "");
					arrayLinea.push(arrayCampo);
				}

				var startY = cord_y_init+17.5;
				const headerTable = [
					{ title: self.getValueIN18(that,"titleColNotificationDate"), dataKey: 1, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColTechnicalLocation"), dataKey: 2, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColDenTechnicalLocation"), dataKey: 3, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColNotification"), dataKey: 4, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColDescription"), dataKey: 5, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColState"), dataKey: 6, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColPlanningGroup"), dataKey: 7, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColCodeResponsible"), dataKey: 8, styles: { halign: 'center' } },
					{ title: self.getValueIN18(that,"titleColResponsible"), dataKey: 9 },
					{ title: self.getValueIN18(that,"titleColCodeBloq"), dataKey: 10 },
					{ title: self.getValueIN18(that,"titleColBloq"), dataKey: 11 }
				];

				doc.autoTable(headerTable,arrayLinea,{
					startY: startY,
					body: arrayLinea,
					theme: 'grid',
					bodyStyles: {valign: 'top'},
					margin: { top: startY }, 
					headStyles: { halign: 'center' },  // Solo el encabezado
					styles: {
						rowPageBreak: 'auto',
						fontSize:6.5,
						textColor:[0, 0, 0],
						valign: 'top',
						minCellWidth: 1.2,
						minCellHeight: 12
					},
					didDrawPage: function (data) {	// Dibuja la estructura en todas las páginas
						//Titulo
						var pageSize = doc.internal.pageSize;
						var widthSize = pageSize.width - 17.5;
						var heightSize = pageSize.height - 17.5;
						var heightLine = 5;
						var widthSizeContainer = widthSize ;
						
						var cord_X_fin = 165;
						var cord_y_fin = 6;

						doc.setFont('arial', 'bold');
						var widthContainer2 = widthSizeContainer;
						
						var cord_X_init_container2 = cord_x_init + 60.5;
						var cord_y_init_container2 = cord_y_init + 3;
						
						self.alignTextJsPDFV2(doc.setFontSize(12), self.getValueIN18(that,"title"), cord_X_init_container2, cord_y_init_container2 + 6, widthSizeContainer-cord_X_init_container2, 'center');
						//Titulo
					},
					columnStyles:	{
						1: {cellWidth: 17, halign: 'center'},
						2: {cellWidth: 18, halign: 'center'},			
						3: {cellWidth: 25, halign: 'center'},
						4: {cellWidth: 13.4, halign: 'center'},
						5: {cellWidth: 25, halign: 'center'},
						6: {cellWidth: 15, halign: 'center'},
						7: {cellWidth: 18, halign: 'center'},
						8: {cellWidth: 14, halign: 'center'},
						9: {cellWidth: 18, halign: 'center'},
						10: {cellWidth: 10.5, halign: 'center'},
						11: {cellWidth: 18, halign: 'center'}
					}
				});
			};
			
			var setPiePagina = function (doc, data) {
				/////////////////////////////
				var date = new Date();
				var yyyy = date.getFullYear().toString();
				var mm = self.pad((date.getMonth() + 1).toString(),"0",2); // getMonth() is zero-based
				var dd = self.pad(date.getDate().toString(),"0",2);
				var h = self.pad(date.getHours(),"0", 2);
				var m = self.pad(date.getMinutes(),"0", 2);
				var s = self.pad(date.getSeconds(),"0", 2);
				var fechaActual =   dd + "/" + mm + "/" + yyyy; // padding
				/////////////////////////////
				
				// Pie Footer
				var coordX = data.settings.margin.left;
				var coordY = doc.internal.pageSize.height - 15;

				doc.setDrawColor(0, 0, 0);
				doc.setTextColor(128, 128, 128);
				var widthPageMargin = doc.internal.pageSize.width - (data.settings.margin.left + data.settings.margin.right)

				const pageCount = doc.internal.getNumberOfPages()
			
				doc.setFont('helvetica', 'italic')
				doc.setFontSize(8)
				for (var i = 1; i <= pageCount; i++) {
					doc.setPage(i)
					
					self.splitLine(doc, data.settings.margin.left, widthPageMargin+data.settings.margin.left, 287, 1, 9, 'normal', '=');
					
					var baseWidthLegal = doc.getTextWidth('Page ' + String(i) + ' of ' + String(pageCount));
					doc.text('Rev. '+fechaActual, data.settings.margin.left+12, 290, { align: 'center' });
					doc.text('Page ' + String(i) + ' of ' + String(pageCount), doc.internal.pageSize.width / 2 - baseWidthLegal/2+10, 290, { align: 'center' });
					
					var baseWidthLegalPRJ = doc.getTextWidth(self.getValueIN18(that,"title"));
					doc.text(self.getValueIN18(that,"title") , data.settings.margin.left + widthPageMargin - baseWidthLegalPRJ+17, 290, { align: 'center' })
				}
			};

			var cordXTabla = 36;
			var cordYTabla = 80;
			var setDetalle = function (Detalle) {
				setCabecera(value);
				setSubCabecera(value);
				setHeaderDetalle(value);
				setCuerpoDetalle(value);
			};
			
			// DETALLE
			var Detalle = "";
			setDetalle(Detalle);
			
			var modData = {};
			modData.settings = {};
			modData.settings.margin = {};
			modData.settings.margin.left = 10;
			modData.settings.margin.right = 10;
			setPiePagina(doc, modData);

			doc.save("Report.pdf");
			var pdfBase64  = doc.output('datauristring');
			const pdfArrayBuffer = doc.output('arraybuffer');
			var pdfSize = pdfArrayBuffer.byteLength;
			var base64String = pdfBase64.replace('data:application/pdf;base64,', '');
			return {"Name":"Report",
				    "File":base64String,
					"Comment":"Esto es un documento PDF Historial OIC",
					"DocumentTypeName":"Monitor procesos - Historial OIC",
					"ContentType":"application/pdf",
					"Size":pdfSize
			};			
		},
		onGenerarPDFReportPromise: function (that,value) {
			var self = this;
			try{
				return new Promise(function (resolve, reject) {
					const { jsPDF } = window.jspdf;
					var doc = new jsPDF('p', 'mm', 'a4');
					//kassiel
					var date = new Date();
					var yyyy = date.getFullYear().toString();
					var mm = self.pad((date.getMonth() + 1).toString(), "0", 2); // getMonth() is zero-based
					var dd = self.pad(date.getDate().toString(), "0", 2);
					var h = self.pad(date.getHours(), "0", 2);
					var m = self.pad(date.getMinutes(), "0", 2);
					var s = self.pad(date.getSeconds(), "0", 2);
					var fechaActual = dd + "/" + mm + "/" + yyyy; // padding 
					var timeActual = h + ":" + m + ":" + s;
					var plusChofer=0;
					// Contador para el número de páginas
					var totalPagesExp = "{total_pages_count_string}";
					
					var pageSize = doc.internal.pageSize;
					var widthSize = pageSize.width - 19.5;
					var heightSize = pageSize.height - 19.5;
					
					var setCabecera = function (data) {};

					var setSubCabecera = function (data) {};

					var setHeaderDetalle = function (data) {};

					var setCuerpoDetalle = function (value) {
						var pageSize = doc.internal.pageSize;
						var widthSize = pageSize.width - 17.5;
						var heightSize = pageSize.height - 17.5;
						var heightLine = 5;
						
						var arrayLinea = [];
						var arrayCampo = [];
						var arrayFooter = [];
						var arrayFooterTotal = [];
						//////////////////////////////////////
						var cord_x_init = 12.5;
						var cord_y_init = 11;
						var coordX = 12.5;
						var coordY = 57;
						
						var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: "dd.MM.yyyy",
							UTC: true
						});

						var HistorialOic = value;
						for (var i in HistorialOic) {
							var obj = HistorialOic[i];
							
							var sErdat =  obj.Erdat ? obj.Erdat : "";
							
							arrayCampo	=	[];
							arrayCampo.push( sErdat ? formatter.formatYYYYMMDDDateAbapDateHourSlash( sErdat ) : "" );
							arrayCampo.push(obj.Tplnr);
							arrayCampo.push(obj.Pltxt);
							arrayCampo.push(obj.Qmnum);
							arrayCampo.push( obj.Qmtxt );
							arrayCampo.push( obj.Txt30 );
							arrayCampo.push(obj.Innam);
							arrayCampo.push(obj.Oteil);
							arrayCampo.push( obj.Kurztex1 ? obj.Kurztex1 : "");
							arrayCampo.push( obj.Fecod ? obj.Fecod : "");
							arrayCampo.push( obj.Kurztex2 ? obj.Kurztex2 : "");
							arrayLinea.push(arrayCampo);
						}

						var startY = cord_y_init+17.5;
						const headerTable = [
							{ title: self.getValueIN18(that,"titleColNotificationDate"), dataKey: 1, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColTechnicalLocation"), dataKey: 2, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColDenTechnicalLocation"), dataKey: 3, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColNotification"), dataKey: 4, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColDescription"), dataKey: 5, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColState"), dataKey: 6, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColPlanningGroup"), dataKey: 7, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColCodeResponsible"), dataKey: 8, styles: { halign: 'center' } },
							{ title: self.getValueIN18(that,"titleColResponsible"), dataKey: 9 },
							// { title: self.getValueIN18(that,"titleColCodeBloq"), dataKey: 10 },
							// { title: self.getValueIN18(that,"titleColBloq"), dataKey: 11 }
						];

						doc.autoTable(headerTable,arrayLinea,{
							startY: startY,
							body: arrayLinea,
							theme: 'grid',
							bodyStyles: {valign: 'top'},
							margin: { top: startY }, 
							headStyles: { halign: 'center' },  // Solo el encabezado
							styles: {
								rowPageBreak: 'auto',
								fontSize:6.5,
								textColor:[0, 0, 0],
								valign: 'top',
								minCellWidth: 1.2,
								minCellHeight: 12
							},
							didDrawPage: function (data) {	// Dibuja la estructura en todas las páginas
								//Titulo
								var pageSize = doc.internal.pageSize;
								var widthSize = pageSize.width - 17.5;
								var heightSize = pageSize.height - 17.5;
								var heightLine = 5;
								var widthSizeContainer = widthSize ;
								
								var cord_X_fin = 165;
								var cord_y_fin = 6;

								doc.setFont('arial', 'bold');
								var widthContainer2 = widthSizeContainer;
								
								var cord_X_init_container2 = cord_x_init + 60.5;
								var cord_y_init_container2 = cord_y_init + 3;
								
								self.alignTextJsPDFV2(doc.setFontSize(12), self.getValueIN18(that,"title"), cord_X_init_container2, cord_y_init_container2 + 6, widthSizeContainer-cord_X_init_container2, 'center');
								//Titulo
							},
							columnStyles:	{
								1: {cellWidth: 17.5, halign: 'center'},
								2: {cellWidth: 18.5, halign: 'center'},			
								3: {cellWidth: 29, halign: 'center'},
								4: {cellWidth: 13.5, halign: 'center'},
								5: {cellWidth: 29, halign: 'center'},
								6: {cellWidth: 20.5, halign: 'center'},
								7: {cellWidth: 20.5, halign: 'center'},
								8: {cellWidth: 15.5, halign: 'center'},
								9: {cellWidth: 20.5, halign: 'center'},
								// 10: {cellWidth: 14.5, halign: 'center'},
								// 11: {cellWidth: 14.5, halign: 'center'}
							}
						});
					};
					
					var setPiePagina = function (doc, data) {
						/////////////////////////////
						var date = new Date();
						var yyyy = date.getFullYear().toString();
						var mm = self.pad((date.getMonth() + 1).toString(),"0",2); // getMonth() is zero-based
						var dd = self.pad(date.getDate().toString(),"0",2);
						var h = self.pad(date.getHours(),"0", 2);
						var m = self.pad(date.getMinutes(),"0", 2);
						var s = self.pad(date.getSeconds(),"0", 2);
						var fechaActual =   dd + "/" + mm + "/" + yyyy; // padding
						/////////////////////////////
						
						// Pie Footer
						var coordX = data.settings.margin.left;
						var coordY = doc.internal.pageSize.height - 15;

						doc.setDrawColor(0, 0, 0);
						doc.setTextColor(128, 128, 128);
						var widthPageMargin = doc.internal.pageSize.width - (data.settings.margin.left + data.settings.margin.right)

						const pageCount = doc.internal.getNumberOfPages()
					
						doc.setFont('helvetica', 'italic')
						doc.setFontSize(8)
						for (var i = 1; i <= pageCount; i++) {
							doc.setPage(i)
							
							self.splitLine(doc, data.settings.margin.left, widthPageMargin+data.settings.margin.left, 287, 1, 9, 'normal', '=');
							
							var baseWidthLegal = doc.getTextWidth('Page ' + String(i) + ' of ' + String(pageCount));
							doc.text('Rev. '+fechaActual, data.settings.margin.left+12, 290, { align: 'center' });
							doc.text('Page ' + String(i) + ' of ' + String(pageCount), doc.internal.pageSize.width / 2 - baseWidthLegal/2+10, 290, { align: 'center' });
							
							var baseWidthLegalPRJ = doc.getTextWidth(self.getValueIN18(that,"title"));
							doc.text(self.getValueIN18(that,"title") , data.settings.margin.left + widthPageMargin - baseWidthLegalPRJ+17, 290, { align: 'center' })
						}
					};

					var cordXTabla = 36;
					var cordYTabla = 80;
					var setDetalle = function (Detalle) {
						setCabecera(value);
						setSubCabecera(value);
						setHeaderDetalle(value);
						setCuerpoDetalle(value);
					};
					
					// DETALLE
					var Detalle = "";
					setDetalle(Detalle);
					
					var modData = {};
					modData.settings = {};
					modData.settings.margin = {};
					modData.settings.margin.left = 10;
					modData.settings.margin.right = 10;
					setPiePagina(doc, modData);

					doc.save("Report.pdf");
					var pdfBase64  = doc.output('datauristring');
					const pdfArrayBuffer = doc.output('arraybuffer');
					var pdfSize = pdfArrayBuffer.byteLength;
					var base64String = pdfBase64.replace('data:application/pdf;base64,', '');
					resolve( {"Name":"Report",
							"File":base64String,
							"Comment":"Esto es un documento PDF Historial OIC",
							"DocumentTypeName":"Monitor procesos - Historial OIC",
							"ContentType":"application/pdf",
							"Size":pdfSize
					} );			
				});
			}catch(oError){
				that.getMessageBox("error", that.getI18nText("errorExportPDF"));
			}
			
		},
		///End Descargar PDF///

		_groupBy: function (array, param) {
            return array.reduce(function (groups, item) {
                const val = item[param]
                groups[val] = groups[val] || []
                groups[val].push(item)
                return groups
            }, {});
        },
		onGetValueForText:function(value, valor1, valor2){
			let cadena = value;
			if (cadena.includes(valor1)) {
				var cadenaTemp= cadena.split(valor1);
				cadena = cadenaTemp[1];
				if (cadena.includes(valor2)) {
					var cadenaTemp= cadena.split(valor2);
					cadena = cadenaTemp[0];
				}
			}
			return cadena;
		},
		pad:function(n, padStrging,length){
			var n = n.toString();
			while(n.length < length){
				n = padStrging+n;
			}
			return n;
		},
		alignTextJsPDFV2: function(Doc, Value, CoordX, CoordY, WidthString, Align){
			var doc = Doc;
			var coordX = CoordX;
			var coordY = CoordY;
			var widthString = WidthString;
			var paragraph = Value;
			var lines = doc.splitTextToSize(paragraph, widthString);
			var dim = doc.getTextDimensions('Text');
			var lineHeight = dim.h;
			var maximoWidth = 0;
			var lineWidth = 0;
			var restLineWidth = 0;
			for (var l = 0; l < lines.length; l++) {
				if (doc.getTextWidth(lines[l]) > maximoWidth) {
					maximoWidth = doc.getTextWidth(lines[l]);
				}
			}
			for (var i = 0; i < lines.length; i++) {
				var lineTop = i == 0 ? coordY : ((lineHeight / 3.3) * (i)) + coordY;
				lines[i] = lines[i].toString().replace(/ /g, "|"); 
				while (doc.getTextWidth(lines[i]) < maximoWidth) { 
					// if (doc.getTextWidth(lines[i]) * 1.2 <= maximoWidth) { 
					if (doc.getTextWidth(lines[i]) <= maximoWidth) { 
						break; 
					} 
					if (!lines[i].toString().includes("|")) { 
						lines[i] = lines[i].toString().replace(/ /g, "|"); 
					} 
					lines[i] = lines[i].toString().replace("|", " "); 
				} 
				while (lines[i].includes("|")) { 
					lines[i] = lines[i].toString().replace("|", " "); 
				} 
				var x = 0; 
				if(Align == 'center'){ 
					var txtWidth = doc.getStringUnitWidth(lines[i])*doc.internal.getFontSize()/doc.internal.scaleFactor; 
					x = ( widthString - txtWidth ) / 2; 
					// if (doc.getTextWidth(lines[i]) * 1.2 <= maximoWidth) { 
					// } 
				} 

				doc.text(lines[i], coordX + x, lineTop, { 
					maxWidth: widthString, align: Align //justify,center,left,rihgt 
				}); //see this line }
			}
		},
		splitLine: function (doc, startX, endX, CoordY, Space, Size, Font, simbolo) { 
			var modX = startX;
			doc.setFont('sans-serif', Font); 
			doc.setFontSize(Size); 
			while (modX <= endX) { 
				doc.text(modX, CoordY, simbolo);
				modX = modX + Space; 
			} 
		},

	};
});