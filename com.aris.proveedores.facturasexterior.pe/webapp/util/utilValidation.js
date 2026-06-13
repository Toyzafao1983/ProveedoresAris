/* global moment:true */
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
	"sap/ui/core/message/ControlMessageProcessor",
	"sap/m/MessageItem",
	"sap/m/MessagePopover",
	"sap/m/UploadCollectionParameter",
	"../util/utilController"
], function (Controller, JSONModel, MessageBox, MessageToast,
	Label, Text, Button, Input, Dialog, ControlMessageProcessor,
	MessageItem, MessagePopover, UploadCollectionParameter, controller) {
	"use strict";
	return {
		validTypeInput: function (objInput,oEvent) {
			var value = controller.unlink(objInput.mProperties).value;
			if (value === undefined || value.trim() === "") {
				this.oMessageManager.registerObject(objInput, true); //registerObject con true es para agregar
			}
			var validator = new Validator();
			validator.validate(objInput,oEvent, this.oMessageManager, this.oMessageProcessor);
		},
		validatorSAPUI5: function (self, nameFieldGroup, oEvent, model,obj) {
			if (!this.oMessageManager) {
				this.oMessageManager = sap.ui.getCore().getMessageManager();
			}
			this.oMessageManager.registerObject(self.getView(), false);
			if (!this.oMessageProcessor) {
				this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			}
			this.oMessageManager.registerMessageProcessor(this.oMessageProcessor);
			this.oMessageManager.removeAllMessages();
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				if (oEvent) {
					var path = oEvent.getSource().getBindingContext(model).getPath();
					var bindingInput = inputs[i].getBindingContext(model);
					if (bindingInput) {
						var pathInput = bindingInput.getPath();
						if (path === pathInput) {
							this.validTypeInput(inputs[i],oEvent);
						}
					}
				} else {
					if (inputs[i].bOutput === true) {
						this.validTypeInput(inputs[i],obj);
					}
				}
			}
			var messages = this.oMessageManager.getMessageModel().getData().filter(function (el) {
				return el.type == sap.ui.core.MessageType.Error;
			});
			if (messages.length == 0) {
				return true;
			} else {
				return false;
			}
		},
		validTypeInput2: function (objInput) {
			var value = controller.unlink(objInput.mProperties).value;
			if (value === undefined || value.trim() === "") {
				this.oMessageManager.registerObject(objInput, true); //registerObject con true es para agregar
				if (objInput.getDateValue) {//Picker
					objInput.setValue("");
				} 
				else {
					if (objInput.getSelectedKey) {} //ComboBox
					else {} //Input if(objInput.getValue){} 
				}
			}
			var validator = new Validator();
			validator.validate(objInput, this.oMessageManager, this.oMessageProcessor);
		},
		validatorSAPUI5_V3: function (self, nameFieldGroup) {
			if (!this.oMessageManager) {
				this.oMessageManager = sap.ui.getCore().getMessageManager();
			}
			this.oMessageManager.registerObject(self.getView(), false);
			if (!this.oMessageProcessor) {
				this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			}
			this.oMessageManager.registerMessageProcessor(this.oMessageProcessor);
			this.oMessageManager.removeAllMessages();
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				if (inputs[i].bOutput === true) {
					var value = controller.unlink(inputs[i].mProperties).value;
					try {
						if (value === undefined || value.trim() === "") {
							this.oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar
							if (inputs[i].getDateValue) {
								inputs[i].setValue(" ");
							} //Picker
							else {
								if (inputs[i].getSelectedKey) {} //ComboBox
								else {} //Input if(inputs[i].getValue){} 
							}
						}
					} catch (e) {}
					var validator = new Validator();
					validator.validate(inputs[i], this.oMessageManager, this.oMessageProcessor);
				}
			}
			var messages = this.oMessageManager.getMessageModel().getData().filter(function (el) {
				return el.type == sap.ui.core.MessageType.Error;
			});
			if (messages.length == 0) {
				return true;
			} else {
				return false;
			}
		},
		validatorSAPUI52_1: function (self, nameFieldGroup) {
			if (!this.oMessageManager) {
				this.oMessageManager = sap.ui.getCore().getMessageManager();
			}
			this.oMessageManager.registerObject(self.getView(), false);
			if (!this.oMessageProcessor) {
				this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			}
			this.oMessageManager.registerMessageProcessor(this.oMessageProcessor);
			this.oMessageManager.removeAllMessages();
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				if (inputs[i].bOutput === true) {
					this.oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar
					var value = controller.unlink(inputs[i].mProperties).value;
					try {
						if (value === undefined || value.trim() === "") {
							if (inputs[i].getDateValue) { //Picker
								inputs[i].setValue(" ");
							} else {
								if (inputs[i].getValue) { //Input
								}
							}
							if (inputs[i].getSelectedKey) { //ComboBox
							}
						}
					} catch (e) {}
					var validator = new Validator();
					validator.validate(inputs[i], this.oMessageManager, this.oMessageProcessor);
				}
			}
			var messages = this.oMessageManager.getMessageModel().getData();
			if (messages.length == 0) {
				return true;
			} else {
				var count = 0;
				for (var i in messages) {
					if (messages[i].type === sap.ui.core.MessageType.Success) {
						count = count + 1;
					}
				}
				if (count === messages.length) {
					return true;
				} else {
					return false;
				}
			}
		},
		validatorSAPUI52: function (self, nameFieldGroup) {
			if (!this.oMessageManager) {
				this.oMessageManager = sap.ui.getCore().getMessageManager();
			}
			this.oMessageManager.registerObject(self.getView(), false);
			if (!this.oMessageProcessor) {
				this.oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			}
			this.oMessageManager.registerMessageProcessor(this.oMessageProcessor);
			this.oMessageManager.removeAllMessages();
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				if (inputs[i].bOutput === true) {
					this.oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar
					var sId = inputs[i].getId();
					if (sId.includes("picker") && (!sId.includes("-") || sId.includes("clone"))) {
						var value = controller.unlink(inputs[i].mProperties).value;
						if (value === undefined || value.trim() === "") {
							inputs[i].setValue(" ");
						}
					}
					var validator = new Validator();
					validator.validate(inputs[i], this.oMessageManager, this.oMessageProcessor);
				}
			}
			var messages = this.oMessageManager.getMessageModel().getData();
			if (messages.length == 0) {
				return true;
			} else {
				var count = 0;
				for (var i in messages) {
					if (messages[i].type === sap.ui.core.MessageType.Success) {
						count = count + 1;
					}
				}
				if (count === messages.length) {
					return true;
				} else {
					return false;
				}
			}
		},
		validatorTable: function (self, nameFieldGroup, oEvent) {
			sap.ui.getCore().getMessageManager().destroy();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(self.getView(), false);
			oMessageManager = sap.ui.getCore().getMessageManager();
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				if (inputs[i].bOutput === true) {
					oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar
					var value = controller.unlink(inputs[i].mProperties).value;
					if (value === "") {
						errorNull.push({});
					}
				}
			}
			var messages = oMessageManager.getMessageModel().oMessageManager.mMessages;
			if (messages) {
				var errors = messages[oMessageProcessor.id];
				if (controller.isObject(errors)) {
					if (Object.keys(errors).length === 0 && errorNull.length === 0) {
						return true;
					} else if (Object.keys(errors).length > 0 || errorNull.length > 0) {
						return false;
					}
				} else if (errors === undefined && errorNull.length === 0) {
					return true;
				} else if (errors === undefined && errorNull.length > 0) {
					return false;
				} else {
					if (errors.length === 0 && errorNull.length === 0) {
						return true;
					} else if (errors.length > 0 || errorNull.length > 0) {
						return false;
					}
				}
			} else {
				return false;
			}
			//oMessagePopover.destroy();
		},
		validatorForm: function (self, nameFieldGroup) {
			sap.ui.getCore().getMessageManager().destroy();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(self.getView(), false);
			oMessageManager = sap.ui.getCore().getMessageManager();
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar input y false es para omitir.
				var value = inputs[i].mProperties.value;
				if (value === "") {
					try {
						var sId = inputs[i].sId;
						if (sId.includes("input")) {
							inputs[i].setValue("//");
						} else if (sId.includes("box")) {
							try {
								var firstKey = inputs[i].getItems()[0].getKey();
								inputs[i].setSelectedKey(firstKey);
								inputs[i].setSelectedKey("");
							} catch (e) {
								inputs[i].setKey("")
							}
						} else if (sId.includes("picker")) {
							inputs[i].setValue("/");
						}
					} catch (e) {}
					errorNull.push({});
				}
			}
			var messages = oMessageManager.getMessageModel().getData();
			if (messages.length > 0) {
				return false;
			} else {
				return true;
			}
		},
		validatorForm1: function (self, nameFieldGroup) {
			sap.ui.getCore().getMessageManager().destroy();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(self.getView(), false);
			oMessageManager = sap.ui.getCore().getMessageManager();
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar input y false es para omitir.
				var value = inputs[i].mProperties.value;
				if (value === "") {
					errorNull.push({});
				}
			}
			var messages = oMessageManager.getMessageModel().oMessageManager.mMessages;
			if (messages) {
				var errors = messages[oMessageProcessor.id];
				if (controller.isObject(errors)) {
					if (Object.keys(errors).length === 0 && errorNull.length === 0) {
						return true;
					} else if (Object.keys(errors).length > 0 || errorNull.length > 0) {
						return false;
					}
				} else if (errors === undefined && errorNull.length === 0) {
					return true;
				} else if (errors === undefined && errorNull.length > 0) {
					return false;
				} else {
					if (errors.length === 0 && errorNull.length === 0) {
						return true;
					} else if (errors.length > 0 || errorNull.length > 0) {
						return false;
					}
				}
			} else {
				return false;
			}
			//oMessagePopover.destroy();
		},
		validatorForm2: function (self, nameFieldGroup) {
			sap.ui.getCore().getMessageManager().destroy();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(self.getView(), false);
			oMessageManager = sap.ui.getCore().getMessageManager();
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
			var errorNull = [];
			for (var i in inputs) {
				oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar input y false es para omitir.
				if (inputs[i].getValue) {
					var valueInput = inputs[i].getValue();
					if (valueInput) {
						var valueInputTrim = valueInput == "0" ? valueInput : valueInput.trim();
						if (valueInputTrim == "") {
							errorNull.push({});
							/*oMessageManager.addMessages(new sap.ui.core.message.Message({
								message: "Tiene que llenar el campo",
								type:sap.ui.core.ValueState.Error
							}));
							inputs[i].setValueState(sap.ui.core.ValueState.Error);
							inputs[i].setValueStateText("Llene correctamente el campo.");*/
						} else {
							inputs[i].setValueState(sap.ui.core.ValueState.None);
							inputs[i].setValueStateText("");
						}
					} else {
						errorNull.push({});
					}
				}
			}
			var errors = oMessageManager.getMessageModel().oMessageManager.mMessages[oMessageProcessor.id];
			if (errors) {
				if (controller.isObject(errors)) {
					if (Object.keys(errors).length === 0 && errorNull.length === 0) {
						return true;
					} else if (Object.keys(errors).length > 0 || errorNull.length > 0) {
						return false;
					}
				} else {
					if (errors.length === 0 && errorNull.length === 0) {
						return true;
					} else if (errors.length > 0 || errorNull.length > 0) {
						return false;
					}
				}
			} else {
				return false;
			}
			//oMessagePopover.destroy();
		},
		validatorFormUltimo: function (self, nameFieldGroup) {
			if (!self.oMessagePopover) {
				self.oMessagePopover = new MessagePopover({
					height: "auto",
					width: "auto",
					items: {
						path: "message>/",
						template: new sap.m.MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});
				self.oMessageManager = sap.ui.getCore().getMessageManager();
				self.oMessageManager.registerObject(self.getView(), false); //registerObject con true es para agregar input y false es para omitir.

				self.oMessagePopover.setModel(self.oMessageManager.getMessageModel(), "message");
				//self.getView().byId('btMessagePopover').setVisible(false);
			} else {
				self.oMessageManager.registerObject(self.getView(), false); //registerObject con true es para agregar input y false es para omitir.
				var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
				for (var i in inputs) {
					self.oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar input y false es para omitir.
				}
				var errors = self.oMessagePopover.getItems();
				if (errors) {
					if (errors.length === 0) {
						//self.getView().byId('btMessagePopover').setVisible(false);
					} else if (errors.length > 0) {
						//self.getView().byId('btMessagePopover').setText(errors.length);
						//self.getView().byId('btMessagePopover').setVisible(true);
					}
				}
			}
		},
		validatorForm1: function (self, nameFieldGroup) {
			if (!self.oMessagePopover) {
				self.oMessagePopover = new MessagePopover({
					height: "auto",
					width: "auto",
					items: {
						path: "message>/",
						template: new sap.m.MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});
				self.oMessageManager = sap.ui.getCore().getMessageManager();
				self.oMessageManager.registerObject(self.getView(), false); //registerObject con true es para agregar input y false es para omitir.

				self.oMessagePopover.setModel(self.oMessageManager.getMessageModel(), "message");
				self.getView().byId('btMessagePopover').setVisible(false);
			} else {
				self.oMessageManager.registerObject(self.getView(), false); //registerObject con true es para agregar input y false es para omitir.
				var inputs = self.getView().getControlsByFieldGroupId(nameFieldGroup);
				for (var i in inputs) {
					self.oMessageManager.registerObject(inputs[i], true); //registerObject con true es para agregar input y false es para omitir.
				}
				var errors = self.oMessagePopover.getItems();
				if (errors) {
					if (errors.length === 0) {
						self.getView().byId('btMessagePopover').setVisible(false);
					} else if (errors.length > 0) {
						self.getView().byId('btMessagePopover').setText(errors.length);
						self.getView().byId('btMessagePopover').setVisible(true);
					}
				}
			}
		},
		openPopover: function (self, oEvent) {
			self.oMessagePopover.openBy(oEvent.getSource());
		},
		isPhone: function () {
			return window.innerWidth < 600;
		},
		fnValidarFecha: function (fecha) {
			fecha.fFecha ? fecha.cFecha.setValueState("None") : fecha.cFecha.setValueState("Error");
		},
		// 	fnValidarCampos: function(validadorGrupoSelect, validarGrupoteInput) {
		// 	var bValidatedSelect = true;
		// 	var bValidatedInput = true;
		// 	if (validadorGrupoSelect) {
		// 		var aControlSelect = sap.ui.getCore().byFieldGroupId(validadorGrupoSelect);
		// 		aControlSelect.forEach(function(oControl) {
		// 			try {
		// 				if (oControl.getSelectedKey() === "") {
		// 					oControl.setValueState("Error");
		// 				} else {
		// 					oControl.setValueState("None");
		// 				}
		// 			} catch (e) {
		// 				jQuery.sap.log.info("------");
		// 			}
		// 		});
		// 		bValidatedSelect = aControlSelect.every(function(oControl) {
		// 			var activar;
		// 			try {
		// 				activar = oControl.getValueState() === "None";
		// 			} catch (e) {
		// 				activar = true;
		// 			}
		// 			return activar;
		// 		});
		// 	}
		// 	if (validarGrupoteInput) {
		// 		var aControlInput = sap.ui.getCore().byFieldGroupId(validarGrupoteInput);

		// 		/* @@ Workaround para las textArea */
		// 		/* TO-DO convertir en su propio forEach */

		// 		var arrayRemove = [];
		// 		$.each(aControlInput, function(index, oControl){

		// 			if ((oControl.getMetadata().getName() == "sap.m.Text") ||
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.Calendar") || 
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.Header") ||
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.Month") || 
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.MonthPicker") ||
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.YearPicker"))
		// 			{
		// 				arrayRemove.push(index);
		// 		//	aControlInput.splice(index, 1);
		// 		//	--index;
		// 			return;
		// 			}
		// 			/* Fin de workAround */
		// 			if (oControl.getRequired() ) {
		// 				if (oControl.getValue().length === 0) {
		// 					oControl.setValueState("Error");
		// 					oControl.setValueStateText("Dato Obligatorio");
		// 				} else {
		// 					oControl.setValueState("None");
		// 				}
		// 			}

		// 		});

		// 		arrayRemove.forEach(function(iIndex){
		// 			aControlInput.splice(iIndex, 1);
		// 		});
		// 					/*	aControlInput.forEach(function(oControl) {
		// 			if (oControl.getMetadata().getName() == "sap.m.Text")
		// 			{
		// 			return;
		// 			}

		// 			if (oControl.getRequired() ) {
		// 				if (oControl.getValue().length === 0) {
		// 					oControl.setValueState("Error");
		// 					oControl.setValueStateText("Dato Obligatorio");
		// 				} else {
		// 					oControl.setValueState("None");
		// 				}
		// 			}
		// 		});
		// 		*/
		// 		bValidatedInput = aControlInput.every(function(oControl) {
		// 				if ((oControl.getMetadata().getName() == "sap.m.Text") ||
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.Calendar") || 
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.Header") ||
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.Month") || 
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.MonthPicker") ||
		// 				(oControl.getMetadata().getName() == "sap.ui.unified.calendar.YearPicker"))
		// 			{
		// 				return true;
		// 			}
		// 			else
		// 			{
		// 			return oControl.getValueState() === "None";
		// 			}
		// 		});
		// 	}
		// 	var validaCampos = (bValidatedSelect === true && bValidatedInput === true) ? true : false;

		// 	if (!validaCampos) {
		// 		var mensaje = 'Deben llenarse los campos obligatorios marcados con un asterisco';
		// 		sap.m.MessageToast.show(mensaje, {
		// 			duration: 5000,
		// 			width: "25em"
		// 		});
		// 		return false;
		// 	} else {
		// 		return true;
		// 	}
		// },

		fnValidarCampos: function (validadorGrupoSelect, validarGrupoteInput) {
			var bValidatedSelect = true;
			var bValidatedInput = true;
			if (validadorGrupoSelect) {
				var aControlSelect = sap.ui.getCore().byFieldGroupId(validadorGrupoSelect);
				aControlSelect.forEach(function (oControl) {
					try {
						if (oControl.getSelectedKey() === "") {
							oControl.setValueState("Error");
						} else {
							oControl.setValueState("None");
						}
					} catch (e) {
						jQuery.sap.log.info(e.message);
					}
				});
				bValidatedSelect = aControlSelect.every(function (oControl) {
					var activar;
					try {
						activar = oControl.getValueState() === "None";
					} catch (e) {
						activar = true;
					}
					return activar;
				});
			}
			if (validarGrupoteInput) {
				var aControlInput = sap.ui.getCore().byFieldGroupId(validarGrupoteInput);
				aControlInput.forEach(function (oControl) {
					try {
						if (oControl.getRequired()) {
							if (oControl.getValue().length === 0) {
								oControl.setValueState("Error");
								oControl.setValueStateText("Dato Obligatorio");
							} else {
								oControl.setValueState("None");
							}
						}
					} catch (e) {
						jQuery.sap.log.info(e.message);
					}
				});
				try {
					bValidatedInput = aControlInput.every(function (oControl) {
						return oControl.getValueState() === "None";
					});
				} catch (e) {
					jQuery.sap.log.info(e.message);
				}
			}
			var validaCampos = (bValidatedSelect === true && bValidatedInput === true) ? true : false;
			return validaCampos;
		},

		limpiarError: function (validadorGrupoSelect, validarGrupoteInput) {
			if (validadorGrupoSelect) {
				var aControlSelect = sap.ui.getCore().byFieldGroupId(validadorGrupoSelect);
				aControlSelect.forEach(function (oControl) {
					try {
						oControl.setValueState("None");
					} catch (e) {
						jQuery.sap.log.info("------");
					}
				});
			}
			if (validarGrupoteInput) {
				var aControlInput = sap.ui.getCore().byFieldGroupId(validarGrupoteInput);
				aControlInput.forEach(function (oControl) {
					try {
						oControl.setValueState("None");
					} catch (e) {
						jQuery.sap.log.info("------");
					}
				});
			}
		},

		validarCampoUnit: function (oEvent) {
			//	Obtiene los controles 
			if (oEvent.getSource().getId().split("--")[1] === "inputMonto") {
				this.limitarInputMonto();
			}

			var sUserInput = oEvent.getParameter("value");
			var oInputControl = oEvent.getSource();
			if (sUserInput.length > 0) {
				oInputControl.setValueState("None");
			} else {
				oInputControl.setValueState("Error");
			}
		},

		validarSelectUnit: function (oEvent) {
			this.limitarInputMonto();

			var sUserInput = oEvent.getSource().getSelectedKey();
			var oInputControl = oEvent.getSource();
			if (sUserInput) {
				oInputControl.setValueState(sap.ui.core.ValueState.None);
			} else {
				oInputControl.setValueState(sap.ui.core.ValueState.Error);
			}
		}
	};
});