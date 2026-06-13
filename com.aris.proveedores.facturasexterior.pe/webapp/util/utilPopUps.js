sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageBox',
	"sap/m/MessageToast",
	"sap/m/Label",
	"sap/m/Text",
	"sap/m/Button",
	"sap/m/Input",
	"sap/m/Dialog",
	"sap/ui/layout/VerticalLayout"
], function(Controller, JSONModel, MessageBox, MessageToast,Label,	Text,	Button,	Input,	Dialog, VerticalLayout) {
	"use strict";
	
	return {
		onMensajeGeneral:function(self,mensaje){
			var dialog = new sap.m.Dialog({
				title: 'Default Message',
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
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageErrorDialogPress: function(idTransaccion) {
			var mensaje = 'Ocurrió un error en el servicio';
			var that = this;
			var dialog = new sap.m.Dialog({
				id: 'dglExitoso',
				title: 'Error',
				type: 'Message',
				state: 'Error',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center',
							id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					icon: 'sap-icon://copy',
					id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function() {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		onMessageWarningDialogPress: function(idTransaccion, mensaje) {
			var that = this;
			var dialog = new Dialog({
				id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center',
							id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					visible: false,
					icon: 'sap-icon://copy',
					id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function() {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},

		onMessageWarningDialogPressExit: function(idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center',
							id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					visible: false,
					icon: 'sap-icon://copy',
					id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function() {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'Salir',
					press: function() {
						var aplicacion = "#";
						var accion = "";
						that.regresarAlLaunchpad(aplicacion, accion);
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageWarningDialogPress2: function(idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				id: 'dglExitoso',
				title: 'Advertencia',
				type: 'Message',
				state: 'Warning',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					id: 'idVertical',
					content: [new Text({
						text: mensaje + '\n' + '\n',
						textAlign: 'Center',
						id: 'txtMensaje'
					})]
				}),
				beginButton: new sap.m.Button({
					visible: false,
					icon: 'sap-icon://copy',
					id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function() {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'OK',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		onMessageSuccessDialogPress: function(idTransaccion, mensaje) {
			var that = this;
			var dialog = new sap.m.Dialog({
				id: 'dglExitoso',
				title: 'Éxito',
				type: 'Message',
				state: 'Success',
				contentWidth: '25rem',
				content: new sap.ui.layout.VerticalLayout({
					id: 'idVertical',
					content: [new sap.m.Text({
							text: mensaje + '\n' + '\n',
							textAlign: 'Center',
							id: 'txtMensaje'
						}),
						new sap.m.Input({
							value: idTransaccion,
							enabled: false,
							id: 'inputTranscaccion',
							class: 'tamaniotexto'
						})
					]
				}),
				beginButton: new sap.m.Button({
					icon: 'sap-icon://copy',
					id: 'btnidTransaccion',
					tooltip: 'Copiar código de transaccion al portapapeles',
					press: function() {
						that.copyToClipboard(idTransaccion);
					}
				}),
				endButton: new sap.m.Button({
					text: 'Cerrar',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},
		copyToClipboard: function(idTransaccion) {

			var sString = idTransaccion,
				sSuccessText,
				sExceptionText;

			sSuccessText = "Código de transaccción copiado al portapapeles";
			sExceptionText = "sExceptionText";
			this._copyStringToClipboard(sString, sSuccessText, sExceptionText);

			/* MessageToast.show("Número de transacción copiado al portapapeles", {
					duration: 5000
				}); */
		},

		_copyStringToClipboard: function(copyText, successText, exceptionText) {
			var $temp = $("<input>");

			try {
				$("body").append($temp);
				$temp.val(copyText).select();
				document.execCommand("copy");
				$temp.remove();

				//MessageToast.show(successText);
				MessageToast.show(successText, {
					duration: 5000,
					width: '20rem,'
				});
			} catch (oException) {
				MessageToast.show(exceptionText, {
					duration: 5000,
					width: '20rem,'
				});
			}
		}
		
	};
});