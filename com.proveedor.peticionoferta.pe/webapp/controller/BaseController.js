sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	'sap/ui/model/FilterOperator',
	"sap/ui/export/Spreadsheet",
	'sap/m/Token',
	"com/proveedor/peticionoferta/pe/services/ServiceOdata",
	"com/proveedor/peticionoferta/pe/model/models",
	"com/proveedor/peticionoferta/pe/model/formatter",
	"com/proveedor/peticionoferta/pe/services/Services",
	"com/proveedor/peticionoferta/pe/util/util",
	"sap/ui/model/resource/ResourceModel"
], function (Controller, History, UIComponent, MessageBox, MessageToast, Fragment, BusyIndicator, JSONModel,
	Filter, FilterOperator, Spreadsheet, Token, ServiceOdata, models, Formatter, Services, util, ResourceModel) {
	"use strict";
	var that;
	var sMessage = "";
	var that;
	return Controller.extend("com.proveedor.peticionoferta.pe.controller.BaseController", {
		formatter: Formatter,
		local: window.location.href.indexOf('launchpad') == -1 ? true : false,
		localModel: true,
		AdminUser: false,
		userSet: "kestefo@ravaconsulting.com.pe",
		route: "com.proveedor.peticionoferta.pe",
		routeSharepoint: "arisindustrial.sharepoint.com,e5faea81-7554-4754-ab0a-7a1615a9006f,f96740cf-8f3f-4805-b1fc-1a0a87bf4ae3",
		driveId: "b!ger65VR1VEerCnoWFakAb9nmGbJ284hOpTWdHF4jSOLjVnYNoEj0QrJVZ7_OziEd",
		_getUsers: function () {
			that = this;
			try {
				var model = new sap.ui.model.json.JSONModel();
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					const sMail = that.getUserLoged();

					if (that.local) {
						const sPath = '/service/scim/Users?filter=emails eq "' + sMail + '"';
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/API-USER-IAS/service/scim/Users?filter=emails eq "' + sMail + '"';
						sUrl = sPath;
					}

					// ✅ Igual que MIS DATOS
					if (that.local) {
						setTimeout(() => {
							if (that.AdminUser) {
								resolve(models.oModelUserExt());
							} else {
								resolve(models.oModelUser());
							}
						}, "1000");
					} else {
						model.loadData(sUrl, null, true, "GET", null, null, {
							"Content-Type": "application/scim+json"
						}).then(() => {
							var oDataTemp = model.getData();
							resolve(oDataTemp);
						}).catch(err => {
							console.log("Error:" + err.message);
							reject(err);
						});
					}
				});
			} catch (oError) {
				this.getMessageBox("error", this.getI18nText("sErrorTry"));
			}
		},

		_getScimCustomAttributes: function (oUser) {
			return oUser?.["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"] || {};
		},

		_getScimCustomAttributeValue: function (oUser, sName) {
			const oCustom = this._getScimCustomAttributes(oUser);
			const aAttrs = Array.isArray(oCustom?.attributes) ? oCustom.attributes : [];

			const oAttr = aAttrs.find(function (a) {
				return String(a?.name || "").trim() === sName;
			});

			if (oAttr && oAttr.value !== undefined && oAttr.value !== null) {
				return String(oAttr.value).trim();
			}

			if (oCustom && oCustom[sName] !== undefined && oCustom[sName] !== null) {
				return String(oCustom[sName]).trim();
			}

			return "";
		},

		_resolveProveedorUserProfile: function (oUser) {
			const aGroups = (oUser?.groups || [])
				.map(function (g) {
					return String(g?.value || g?.display || "").trim();
				})
				.filter(Boolean);

			const sAttribute4 = this._getScimCustomAttributeValue(oUser, "customAttribute4");
			const sAttribute5 = this._getScimCustomAttributeValue(oUser, "customAttribute5");

			const bHasAttribute4 = !!sAttribute4;
			const bHasAttribute5 = !!sAttribute5;

			// Nueva regla estándar proveedores:
			// customAttribute4 con BP => proveedor externo.
			// customAttribute5 con código y sin customAttribute4 => usuario interno Aris.
			const bIsExtAyc = bHasAttribute4;
			const bIsInterno = !bHasAttribute4 && bHasAttribute5;

			const sRolPrincipal =
				bIsExtAyc ? "EXT" :
					bIsInterno ? "INT" :
						"SIN_ROL";

			return {
				aGroups: aGroups,
				sAttribute4: sAttribute4,
				sAttribute5: sAttribute5,
				bIsExtAyc: bIsExtAyc,
				bIsInterno: bIsInterno,
				sRolPrincipal: sRolPrincipal,

				// El BP externo siempre sale de customAttribute4.
				sExtBP: bIsExtAyc ? sAttribute4 : "",

				// Código interno Aris, por si luego se necesita.
				sInternalBP: bIsInterno ? sAttribute5 : ""
			};
		},

		_applyProveedorUserProfile: function (oUser) {
			const oProfile = this._resolveProveedorUserProfile(oUser);
			const oModelUser = this.getOwnerComponent().getModel("oModelUser");

			if (oModelUser) {
				oModelUser.setProperty("/Information", oUser || {});
				oModelUser.setProperty("/groups", oProfile.aGroups);
				oModelUser.setProperty("/customAttribute4", oProfile.sAttribute4);
				oModelUser.setProperty("/customAttribute5", oProfile.sAttribute5);

				// Compatibilidad con el código actual de esta app.
				oModelUser.setProperty("/bAdmin", oProfile.bIsInterno);
				oModelUser.setProperty("/bExterno", oProfile.bIsExtAyc);
				oModelUser.setProperty("/sRol", oProfile.sRolPrincipal);

				// Alias iguales a los otros proyectos.
				oModelUser.setProperty("/bEsInterno", oProfile.bIsInterno);
				oModelUser.setProperty("/bEsExterno", oProfile.bIsExtAyc);
				oModelUser.setProperty("/bIsInterno", oProfile.bIsInterno);
				oModelUser.setProperty("/bIsExtAyc", oProfile.bIsExtAyc);

				oModelUser.setProperty("/sBpProv", oProfile.sExtBP);
				oModelUser.setProperty("/sExtBP", oProfile.sExtBP);
				oModelUser.setProperty("/sInternalBP", oProfile.sInternalBP);
				oModelUser.setProperty("/sRolPrincipal", oProfile.sRolPrincipal);
				oModelUser.setProperty("/_loaded", true);
			}

			return oProfile;
		},

		getUserLoged: function () {
			var user = "";
			if (this.local || this.isEmpty(sap.ushell)) {
				user = this.userSet;
			} else {
				if (this.isEmpty(sap.ushell.Container.getService("UserInfo").getUser().getEmail())) {
					user = this.userSet;
				} else {
					user = sap.ushell.Container.getService("UserInfo").getUser().getEmail();
				}
			}
			return user;
		},
		validateUser: function () {
			that = this;
			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel);

			oModel.loadData("/services/userapi/attributes");
			return new Promise(function (resolve, reject) {
				oModel.attachRequestCompleted(function onCompleted(oEvent) {
					console.log("--------------------------:---------------------------");
					console.log(oEvent);
					console.log(oModel);
					if (oEvent.getParameter("success")) {
						resolve(oModel.getData());
					} else {
						var msg = oEvent.getParameter("errorObject").textStatus;
						if (msg) {
							reject(msg);
							this.setData("status", msg);
						} else {
							reject("Unknown error retrieving user info");
							this.setData("status", "Unknown error retrieving user info");
						}

					}
				});
			});

		},
		_onbtnHome: function () {
			var that = this;

			MessageBox.warning(this.getI18nText("textbtnHome"), {
				actions: [this.getI18nText("acceptText"), this.getI18nText("cancelText")],
				emphasizedAction: this.getI18nText("acceptText"),
				onClose: function (sAction) {
					if (sAction !== that.getI18nText("acceptText")) {
						return;
					}

					try {
						// FLP / Launchpad
						if (window.top) {
							window.top.location.hash = "#Shell-home";
						} else {
							window.location.hash = "#Shell-home";
						}
					} catch (e) {
						// fallback local
						var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
						if (oRouter) {
							oRouter.navTo("View", {}, true);
						} else {
							window.history.back();
						}
					}
				}
			});
		},
		showMessageBoxAndBack: function (msg, Method) {
			var fnGoHome = function () {
				try {
					if (window.top) {
						window.top.location.hash = "#Shell-home";
					} else {
						window.location.hash = "#Shell-home";
					}
				} catch (e) {
					this.onBackHome();
				}
			}.bind(this);

			if (Method === "warning") {
				sap.m.MessageBox.warning(msg, {
					title: "Alerta",
					actions: ["Aceptar"],
					onClose: function () {
						fnGoHome();
					}
				});
			}

			if (Method === "error") {
				sap.m.MessageBox.error(msg, {
					title: "Error",
					actions: ["Aceptar"],
					onClose: function () {
						this.onBackHome();
					}.bind(this)
				});
			}

			if (Method === "show") {
				sap.m.MessageBox.show(msg, {
					title: "Mensaje",
					actions: ["Aceptar"],
					onClose: function () {
						fnGoHome();
					}
				});
			}

			if (Method === "success") {
				sap.m.MessageBox.success(msg, {
					title: "Éxito",
					actions: ["Aceptar"],
					onClose: function () {
						fnGoHome();
					}
				});
			}
		},
		onBackHome: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			var oQueryParams = this.getQueryParameters(window.location);
			if (sPreviousHash !== undefined || oQueryParams.navBackToLaunchpad) {
				window.history.go(-1);
			} else {
				this.oRouter.navTo("default", true);
			}
		},
		isEmpty: function (inputStr) {
			var flag = false;
			if (inputStr === '') { flag = true; }
			if (inputStr === null) { flag = true; }
			if (inputStr === undefined) { flag = true; }
			if (inputStr == null) { flag = true; }
			return flag;
		},
		validateInternet: function () {
			var bValidate = false;
			if (!window.navigator.onLine) {
				bValidate = true;
				MessageToast.show(this.getI18nText("warningInternet"));
			}
			return bValidate;
		},
		getComponentData: function () {
			return this.getOwnerComponent().getComponentData();
		},
		showErrorMessage: function (sError, sDetail) {
			var sDetail2 = String(sDetail);
			return MessageBox.error(sError, {
				title: "Error",
				details: sDetail2,
				styleClass: "sapUiSizeCompact",
				contentWidth: "100px"
			});
		},
		downloadFileCordova2: function (fileToSave, fileName) {
			saveFile(dirEntry, blob, fileName);
		},
		downloadFileCordova: function (fileToSave, fileName) {
			writeFile(fileToSave);

			function writeFile() {
				console.log("request file system");
				window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemRetrieved, onFileSystemFail);
			}

			function onFileSystemRetrieved(fileSystem) {
				console.log("file system retrieved");
				fileSystem.root.getFile(fileName, {
					create: true
				}, onFileEntryRetrieved, onFileSystemFail);
			}

			function onFileEntryRetrieved(fileEntry) {
				console.log("file entry retrieved");
				fileEntry.createWriter(gotFileWriter, onFileSystemFail);
			}

			function gotFileWriter(writer) {
				console.log("write to file");

				writer.onwrite = function (evt) {
					alert('done');
				}
				writer.write(fileToSave);

				window.open(fileName, '_blank');
			}

			function onFileSystemFail(error) {
				console.log(error.code);
				alert(error.code)
			}
		},
		getBlobFromFile: function (sFile) {
			var contentType = sFile.substring(5, sFile.indexOf(";base64,"));

			var base64_marker = "data:" + contentType + ";base64,";
			var base64Index = base64_marker.length;
			contentType = contentType || "";
			var sliceSize = 512;
			var byteCharacters = window.atob(sFile.substring(base64Index)); //method which converts base64 to binary
			var byteArrays = [];
			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			var blob = new Blob(byteArrays, {
				type: contentType
			});

			return blob;
		},
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},
		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.navTo("RouteBusqueda");
			}
		},
		getI18n: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		getI18nText: function (sText) {
			return this.oView.getModel("i18n") === undefined ? false : this.oView.getModel("i18n").getResourceBundle().getText(sText);
		},
		getResourceBundle: function () {
			return this.oView.getModel("i18n").getResourceBundle();
		},
		getModel: function (sModel) {
			return this.oView.getModel(sModel);
		},
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		_byId: function (sName) {
			var cmp = this.byId(sName);
			if (!cmp) {
				cmp = sap.ui.getCore().byId(sName);
			}
			return cmp;
		},
		getMessageBox: function (sType, sMessage) {
			return MessageBox[sType](sMessage);
		},
		getMessageBox1: function (sType, sMessage, sParameter) {
			return MessageBox[sType](sMessage, sParameter);
		},
		getMessageBoxFlex: function (sType, sMessage, _this, aMessage, sAction, sRoute, sAction2) {
			that = _this;
			return MessageBox[sType](sMessage, {
				actions: sAction === "" ? [sAction2] : [sAction, sAction2],
				onClose: function (oAction) {
					if (oAction === sAction && sRoute === "ErrorUpdate") {
						this.createMessageLog(aMessage, that);
					}
					if (oAction === sAction && sRoute === "InformationTreat") {
						var oJson = {
							NoticeNumber: this._notification,
							Flag: "",
							SystemStatus: "",
							UserStatus: ""
						};
						this.updateStateNotific("Treat", oJson, that);
					}
					if (oAction === sAction && sRoute === "InformationPostpone") {
						var oJson = {
							NoticeNumber: this._notification,
							Flag: "",
							SystemStatus: "",
							UserStatus: ""
						};
						this.updateStateNotific("Postpone", oJson, that);
					}
					if (oAction === sAction && sRoute === "InformationClose") {
						var oJson = {
							NoticeNumber: this._notification,
							RefDate: aMessage.RefDate,
							RefTime: aMessage.RefTime,
							Flag: "",
							SystemStatus: "",
							UserStatus: ""
						};
					}
					if (oAction === sAction && sRoute === "ErrorTakePhoto") {
						this._onTakePhoto();
					}
					if (oAction === sAction2 && sRoute === "SuccessUpdate") {
						var sIdNotification = this._notification;
						this.getNotificationDetail(sIdNotification);
					}
					if (oAction === sAction && sRoute === "WarningCancel") {
						var oData = this.getModel("backup").getData();
						this.getModel("createAd").setData(JSON.parse(JSON.stringify(oData)));
					}
					if (sAction === action2 && Event === "SuccesRegister") {
						try {
							if (window.top) {
								window.top.location.hash = "#Shell-home";
							} else {
								window.location.hash = "#Shell-home";
							}
						} catch (e) {
							this.onBackHome();
						}
					}
					if (oAction === sAction && sRoute === "ErrorUpload") {
						BusyIndicator.show();
						ServiceOdata.oFTP("create", "/HeaderFileSet", this.aCreateFile, "", "1", that).then(function (resolve) {
							BusyIndicator.hide();
						}, function (error) {
							BusyIndicator.hide();
							this.getMessageBoxFlex("error", this.getI18nText("errorFTP"), that, "", this.getI18nText("yes"),
								"ErrorUpload", this.getI18nText("no"));
						});
					}
					if (oAction === sAction && sRoute === "ErrorUploadSharepoint") {
						this._saveDocuments(this.aCreateFile);
					}
				}
			});
		},
		createMessageLog: function (aMessage, _this) {
			that = _this;
			aMessage.forEach(function (oItem) {
				switch (oItem.MessageType) {
					case "E":
						oItem.MessageType = "Error";
						break;
					case "W":
						oItem.MessageType = "Warning";
						break;
					case "I":
						oItem.MessageType = "Information";
						break;
					case "C":
						oItem.MessageType = "Confirm";
						break;
					default:
				}
			});
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{MessageType}',
				title: '{MessageText}',
			});

			var oModel = new JSONModel();
			oModel.setData(aMessage);

			var oBackButton = new sap.m.Button({
				icon: sap.ui.core.IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					this.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});

			this.oMessageView = new sap.m.MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "/",
					template: oMessageTemplate
				}
			});

			this.oMessageView.setModel(oModel);

			this.oDialog = new sap.m.Dialog({
				resizable: true,
				content: this.oMessageView,
				state: 'Error',
				beginButton: new sap.m.Button({
					press: function () {
						this.getParent().close();
					},
					text: "Cerrar"
				}),
				customHeader: new sap.m.Bar({
					contentMiddle: [
						new sap.m.Text({
							text: "Error"
						})
					],
					contentLeft: [oBackButton]
				}),
				contentHeight: "300px",
				contentWidth: "500px",
				verticalScrolling: false
			});
			this.oMessageView.navigateBack();
			this.oDialog.open();
		},
		getScanner: function (oEvent, controller, oBarcode) {
			that = controller;
			var sPath;
			if (!this._oScanDialog) {
				this._oScanDialog = new sap.m.Dialog({
					title: "Scan barcode",
					contentWidth: "640px",
					contentHeight: "480px",
					horizontalScrolling: false,
					verticalScrolling: false,
					stretchOnPhone: true,
					content: [
						new sap.ui.core.HTML({
							content: "<div id='barcode'> <video id='barcodevideo'   autoplay></video>	<canvas id='barcodecanvasg' ></canvas></div><canvas id='barcodecanvas' ></canvas><div id='result'></div>"
						})
					],
					endButton: new sap.m.Button({
						text: "Cancelar",
						press: function (oEvent) {
							this._oScanDialog.close();
						}.bind(that)
					}),
					afterOpen: function () {

						oBarcode.config.start = 0.0;
						oBarcode.config.end = 1.0;
						oBarcode.config.video = '#barcodevideo';
						oBarcode.config.canvas = '#barcodecanvas';
						oBarcode.config.canvasg = '#barcodecanvasg';

						oBarcode.setHandler(function (oBarcode) {
							this.getView().byId("equipment").setValue(oBarcode);
							this._oScanDialog.close();
							return new Promise(function (resolve, reject) {
								sPath = this.oModel.createKey("/Equipment", {
									Equipment: oData.EquipOrTechLocat
								});
								this.oModel.read(sPath, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject();
										this.getMessageBox("error", this.getI18nText("error"));
										$.oLog.push({
											error: error,
											date: new Date()
										});
									}
								});
							});
						});
						oBarcode.init();
					}.bind(that)
				});

				this.getView().addDependent(this._oScanDialog);
			}
			this._oScanDialog.open();
		},
		getDaysBefore: function (date, days) {
			var _24HoursInMilliseconds = 86400000;
			var daysAgo = new Date(date.getTime() + days * _24HoursInMilliseconds);
			daysAgo.setHours(0);
			daysAgo.setMinutes(0);
			daysAgo.setSeconds(0);
			return daysAgo;
		},
		handleMessageToast: function (message) {
			MessageToast.show(message);
		},
		setTextField: function (ofield, valueItem) {
			this._byId(ofield).setText(valueItem);
		},
		setFragment: function (sDialogName, sFragmentId, sNameFragment, that) {
			try {
				if (!that[sDialogName]) {
					that[sDialogName] = sap.ui.xmlfragment(sFragmentId, this.route + ".view.dialogs." + sNameFragment,
						that);
					this.getView().addDependent(that[sDialogName]);
				}
				that[sDialogName].open();
			} catch (error) {
				this.getMessageBox("error", this.getI18nText("error"));
				$.oLog.push({
					error: error,
					date: new Date()
				});
			}
		},
		Destroy: function (that) {
			if (that["_dialogCreate"]) {
				that["_dialogCreate"].destroy();
			}
		},
		_treefy: function (arr, sPropertyPrincipal, sPropertyPatern, sType) {
			var _cleanTree = function (tree) {
				for (var i = 0, len = tree.length; i < len; i++) {
					delete tree[i]["__metadata"];
					if (tree[i].nodes.length === 0) {
						delete tree[i].nodes;
					} else {
						_cleanTree(tree[i]["nodes"]);
					}
				}
			};

			var tree = [],
				mappedArr = {},
				arrElem,
				mappedElem;

			for (var i = 0, len = arr.length; i < len; i++) {
				arrElem = arr[i];
				mappedArr[arrElem[sPropertyPrincipal]] = arrElem;
				mappedArr[arrElem[sPropertyPrincipal]]["nodes"] = [];
			}

			for (var id in mappedArr) {
				if (mappedArr.hasOwnProperty(id)) {
					mappedElem = mappedArr[id];
					if (!mappedElem.Flag) {
						mappedElem.ref = "sap-icon://functional-location";
					} else {
						mappedElem.ref = "sap-icon://machine";
					}
					if (mappedElem[sPropertyPrincipal] && mappedElem[sPropertyPatern] !== "") {
						mappedArr[mappedElem[sPropertyPatern]]["nodes"].push(mappedElem);
					}
					else {
						tree.push(mappedElem);
					}
				}
			}
			_cleanTree(tree);
			return tree;
		},
		_onCloseDialog: function (oEvent) {
			oEvent.destroy();
		},
		reverseStringForParameter: function (str, variable) {
			var splitString = str.split(variable);
			var reverseArray = splitString.reverse();
			var joinArray = reverseArray.join(variable);
			return joinArray;
		},
		onValidateChange: function (oEvent) {
			var kSelected = oEvent.getSource().getSelectedKey();
			var sSelected = oEvent.getSource().getValue();
			if (kSelected !== '') {
				oEvent.getSource().setValue(sSelected);
			} else {
				if (oEvent.getSource().getValue()) {
					this.getMessageBox("error", this.getI18nText("sErrorSelect"));
				}
				oEvent.getSource().setValue("");
			}
		},
		liveChangeFormatInteger: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) { var x = values; }
			else { var x = values.substring(0, values.length - 1); }
			var x = parseInt(values);
			var sValueUsed = isNaN(x) ? '0' : x;

			oSource.setValue(sValueUsed);
		},
		liveChangeFormatFloat: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) { var x = values; }
			else { var x = ''; }
			var x = parseFloat(values);
			var sValueUsed = isNaN(x) ? '0.00' : values;

			oSource.setValue(sValueUsed);
		},
		liveChangeDialogFromTo: function (oEvent) {
			var oSource = oEvent.getSource(),
				sValue = oSource.getValue(),
				sIdfragment = oSource.getId().split("--")[0],
				sCustom = oSource.data("custom");

			if (this.isEmpty(sValue)) {
				this._byId(sIdfragment + "--" + sCustom).setValue("");
				this._byId(sIdfragment + "--" + sCustom).setEnabled(false);
			} else { this._byId(sIdfragment + "--" + sCustom).setEnabled(true); }

			oSource.setValue(sValue);
		},
		ChangeSelectedDialogFrom: function (oEvent) {
			var oSource = oEvent.getSource(),
				sValue = oSource.getValue(),
				sIdfragment = oSource.getId().split("--")[0],
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[0],
				sTextParameter = sCustom.split("/")[1],
				sObject = oSource.getSelectedItem() ? oSource.getSelectedItem().getBindingContext("oModelData").getObject() : "";

			if (this.isEmpty(oSource.getSelectedKey())) {
				this._byId(sIdfragment + "--" + sCustomParameter.slice(0, -4) + "To").setValue("");
				this._byId(sIdfragment + "--" + sCustomParameter.slice(0, -4) + "To").setEnabled(false);
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, "");
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", "");
			} else {
				this._byId(sIdfragment + "--" + sCustomParameter.slice(0, -4) + "To").setEnabled(true);
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, oSource.getSelectedKey());
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", sObject[sTextParameter]);
			}

			oSource.setValue(sValue);
		},
		ChangeSelectedDialogTo: function (oEvent) {
			var oSource = oEvent.getSource(),
				sValue = oSource.getValue(),
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[0],
				sTextParameter = sCustom.split("/")[1],
				sObject = oSource.getSelectedItem().getBindingContext("oModelData").getObject();

			if (this.isEmpty(oSource.getSelectedKey())) {
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, "");
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", "");
				if (sCustomParameter === "cbPlanningCenter") {
					that.getModel("oModelData").setProperty("/oTechnicalLocation", []);
				}
			} else {
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, oSource.getSelectedKey());
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", sObject[sTextParameter]);
				if (sCustomParameter === "cbPlanningCenter") {
					this._byId(this.frgIdFilterInit + "--" + "cbPlanningGroupFrom").setSelectedKey("");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/cbPlanningGroupFrom", "");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/cbPlanningGroupFromText", "");

					this._byId(this.frgIdFilterInit + "--" + "cbPlanningGroupTo").setSelectedKey("");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/cbPlanningGroupTo", "");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/cbPlanningGroupToText", "");

					this._byId(this.frgIdFilterInit + "--" + "miTechnicalLocationFrom").removeAllTokens(true);
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/miTechnicalLocationFrom", "");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/miTechnicalLocationFromText", "");

					this._byId(this.frgIdFilterInit + "--" + "miTechnicalLocationTo").removeAllTokens(true);
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/miTechnicalLocationTo", "");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/miTechnicalLocationToText", "");

					this._byId(this.frgIdFilterInit + "--" + "cbState").setSelectedKey("");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/cbState", "");
					this.getView().getModel("oModelProyect").setProperty("/Main/filter/cbStateText", "");


					let oTechnicalLocationFilter = that.getModel("oModelData").getProperty("/oTechnicalLocationTotal").filter((sValue) => sValue.Iwerk === oSource.getSelectedItem().getKey());
					let oGroupPlanningFilter = that.getModel("oModelData").getProperty("/oGroupPlanningTotal").filter((sValue) => sValue.Iwerk === oSource.getSelectedItem().getKey());

					that.getModel("oModelData").setProperty("/oTechnicalLocation", oTechnicalLocationFilter);
					that.getModel("oModelData").setProperty("/oGroupPlanning", oGroupPlanningFilter);
				}
			}
			oSource.setValue(sValue);
		},
		TokenUpdateDialogFrom: function (oEvent) {
			var oSource = oEvent.getSource(),
				sIdfragment = oSource.getId().split("--")[0],
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[2],
				sObject = oSource.getSelectedKey();

			if (oEvent.mParameters.type === "removed") {
				this._byId(sIdfragment + "--" + sCustomParameter.slice(0, -4) + "To").setValue("");
				this._byId(sIdfragment + "--" + sCustomParameter.slice(0, -4) + "To").setEnabled(false);
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, "");
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", "");
			} else {
				let oTechnicalLocationFilter = that.getModel("oModelData").getProperty("/oTechnicalLocationTotal").filter((sValue) => sValue.Tplnr === oSource.getSelectedKey());

				this._byId(sIdfragment + "--" + sCustomParameter.slice(0, -4) + "To").setEnabled(true);
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, oSource.getSelectedKey());
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", oTechnicalLocationFilter[0].Pltxt);
			}
		},
		_onPressClose: function (oEvent) {
			var oSource = oEvent.getSource();
			var sCustom = oSource.data("custom");
			switch (sCustom) {
				case "FilterInit":
					oSource.getParent().close();
					break;
				default:
					oSource.getParent().close();
			}
		},
		_onClearComponentClient: function () {
			this._byId("frgIdSelectClient--slUsuario").setSelectedKey("");
		},
		_onClearDataCliente: function () {
		},
		_onClearComponentDialogPromotions: function () {

		},
		_onClearDataDialogPromotions: function () {
			this._byId("frgIdAddPromotions--idAddPromotions").setText("");
		},
		_onClearComponentSelectClient: function () {
			this.oModelPedidoVenta.setProperty("/DataGeneral/oPromotions/oPromotionDetail", []);
			this.oModelPedidoVenta.setProperty("/DataGeneral/oPromotions/oPromotionPadre", []);
		},
		_onClearComponentDetailClient: function () {
			this._byId("frgIdDetailCliente--slDirecciones").setSelectedKey("");
			this._byId("frgIdDetailCliente--rbgComprobante").setSelectedIndex(0);
			this._byId("frgIdDetailCliente--inOrdenCompra").setValue("");
			this._byId("frgIdDetailCliente--tardenCompra").setValue("");
		},
		_onClearDataDetailClient: function () {
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/sNumPedido", "");
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/sStatus", "");
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oFlete", []);
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oSelectedCliente", {});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterialSelectEan", {});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterialSelectMasive", {
				titulo: "",
				oDataCargadaPrev: [],
				oDataCargadaMost: []
			});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/Spots", {
				items: [{}]
			});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oPromotions", {
				oComponent: {},
				sCantBoni: "",
				sCantProm: "",
				oPromotion: [],
				oTablaPrimerMoment: [],
				oPromotionDetail: [],
				oPromotionPadre: [],
				oPromotionSelect: [],
				sPromotionSelect: ""
			});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oSelectedLineaCredito", {});
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterial", []);
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/objects", {});
		},
		_onClearComponentAddManualProduct: function () {
			this._byId("frgIdAddManualProduct--slFamilia").setSelectedKey("");
			this._byId("frgIdAddManualProduct--tbMaterialesManual").removeSelections(true);
			this._byId("frgIdAddManualProduct--tbMaterialesManual").setVisible(false);
			this._byId("frgIdAddManualProduct--btnNextAddManualProduct").setVisible(true);
			this._byId("frgIdAddManualProduct--btnAcceptAddManualProduct").setVisible(false);
		},
		_onClearDataAddManualProduct: function () {
			this.oModelGetPedidoVenta.setProperty("/oMaterialFamiliaSelected", []);
		},
		_onClearComponentTableProduct: function () {
			this._byId("tbProductos").removeSelections(true);
		},
		_onClearDatatTableProduct: function () {
		},
		_onClearComponentDialogEan: function () {
			this._byId("frgIdAddEan--inCodeEan").setValue("");
		},
		_onClearDataDialogEan: function () {
			this.oModelGetPedidoVenta.setProperty("/oMaterialEanSelected", []);
		},
		_onClearComponentDialogMasive: function () {
		},
		_onClearDataDialogMasive: function () {
			this.getModel("oModelPedidoVenta").setProperty("/DataGeneral/oMaterialSelectMasive", {
				titulo: "",
				oDataCargadaPrev: [],
				oDataCargadaMost: []
			});
		},
		goNavConTo: function (sFragmentId, sNavId, sPageId) {
			var oNavCon = Fragment.byId(sFragmentId, sNavId);
			var oDetailPage = Fragment.byId(sFragmentId, sPageId);
			oNavCon.to(oDetailPage);
		},
		_groupByKey: function (array, groups, valueKey) {
			var map = new Map;
			groups = [].concat(groups);
			return array.reduce((r, o) => {
				groups.reduce((m, k, i, {
					length
				}) => {
					var child;
					if (m.has(o[k])) return m.get(o[k]);
					if (i + 1 === length) {
						child = Object.assign(...groups.map(k => ({
							[k]: o[k]
						})), {
							[valueKey]: 0
						});
						r.push(child);
					} else {
						child = new Map;
					}
					m.set(o[k], child);
					return child;
				}, map)[valueKey] += +o[valueKey];
				return r;
			}, [])
		},
		_groupBy: function (array, param) {
			return array.reduce(function (groups, item) {
				const val = item[param]
				groups[val] = groups[val] || []
				groups[val].push(item)
				return groups
			}, {});
		},
		zfill: function (number, width) {
			var numberOutput = Math.abs(number); /* Valor absoluto del número */
			var length = number.toString().length; /* Largo del número */
			var zero = "0"; /* String de cero */

			if (width <= length) {
				if (number < 0) {
					return ("-" + numberOutput.toString());
				} else {
					return numberOutput.toString();
				}
			} else {
				if (number < 0) {
					return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
				} else {
					return ((zero.repeat(width - length)) + numberOutput.toString());
				}
			}
		},
		validateTwoDigit: function (value) {
			if (!this.isEmpty(value))
				if (value < 10) { value = "0" + value; }

			return value;
		},

		onGetFormatEstateNumber: function (value) {
			if (value && value !== "" && value !== "-") {
				if (0 <= value) {
					return "Success";
				} else if (0 > value) {
					return "Error";
				}
			} else {
				return "None";
			}
		},
		onGetFormatMonthAnt: function (date) {
			if (date && date !== "") {
				var y = date.getUTCFullYear(),
					m = date.getUTCMonth(),
					d = date.getUTCDate();
				if (m < 1) {
					y = y - 1;
					m = 12;
				}
				m = m < 10 ? "0" + m : m;
				d = d < 10 ? "0" + d : d;

				return y.toString() + '-' + m.toString() + '-' + d.toString();
			} else {
				return "";
			}
		},
		onGetFormatYearAnt: function (date) {
			if (date && date !== "") {
				var y = date.getUTCFullYear(),
					m = date.getUTCMonth() + 1,
					d = date.getUTCDate();

				y = y - 1;
				m = m < 10 ? "0" + m : m;
				d = d < 10 ? "0" + d : d;

				return y.toString() + "-" + m.toString() + "-" + d.toString();
			} else {
				return "";
			}
		},

		onInvoiceDateChange: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue();
			var booleanFormatDate = this.formatValidateDate(sValue);
			if (!booleanFormatDate) {
				this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
				oSource.setValue("");
				return;
			}

			var booleanDate = this.ValidateDate(sValue);
			if (!booleanDate) {
				this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
				oSource.setValue("");
				return;
			}

			var dateReverseToString = this.reverseStringForParameter(sValue, "/");
			var booleanValidateDate = Date.parse(dateReverseToString);

			if (isNaN(booleanValidateDate)) {
				this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
				oSource.setValue("");
				return;
			}

			oSource.setValue(sValue);
		},
		ValidateFormatDate: function (sValue) {
			var booleanFormatDate = this.formatValidateDate(sValue);
			if (!booleanFormatDate) {
				return false;
			}

			var booleanDate = this.ValidateDate(sValue);
			if (!booleanDate) {
				return false;
			}

			var dateReverseToString = this.reverseStringForParameter(sValue, "/");
			var booleanValidateDate = Date.parse(dateReverseToString);

			if (isNaN(booleanValidateDate)) {
				return false;
			}

			return true;
		},
		formatValidateDate: function (campo) {
			var RegExPattern = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
			if ((campo.match(RegExPattern)) && (campo != '')) {
				return true;
			} else {
				return false;
			}
		},
		ValidateDate: function (fecha) {
			var fechaf = fecha.split("/");
			var day = fechaf[0];
			var month = fechaf[1];
			var year = fechaf[2];
			var date = new Date(year, month, '0');
			if ((day - 0) > (date.getDate() - 0)) {
				return false;
			}
			return true;
		},
		xmlToJson: function (xml) {
			function parse(node, j) {
				var nodeName = node.nodeName.replace(/^.+:/, '').toLowerCase();
				var cur = null;
				var text = $(node).contents().filter(function (x) {
					return this.nodeType === 3;
				});
				if (text[0] && text[0].nodeValue.trim()) {
					cur = text[0].nodeValue;
				} else {
					cur = {};
					$.each(node.attributes, function () {
						if (this.name.indexOf('xmlns:') !== 0) {
							cur[this.name.replace(/^.+:/, '')] = this.value;
						}
					});
					$.each(node.children, function () {
						parse(this, cur);
					});
				}

				j[nodeName] = cur;
			}

			var roots = $(xml);
			var root = roots[roots.length - 1];
			var json = {};
			parse(root, json);
			console.log(json);
		},
		onColorForState: function (value) {
			var sReturn;
			if (this.isEmpty(value)) {
				sReturn = "None";
			} else {
				switch (value) {
					case "N":
						sReturn = "None";
						break;
					case "S":
						sReturn = "Success";
						break;
					case "E":
						sReturn = "Error";
						break;
					case "W":
						sReturn = "Warning";
						break;
					case "I":
						sReturn = "Information";
						break;
					case "C":
						sReturn = "Confirm";
						break;
					default:
						sReturn = "None";
						break;
				}
			}
			return sReturn;
		},
		fnExportarExcel: function (oData1, oData2, oData3, sAuthor) {
			var that = this;
			var jsonDataTotal = oData1;
			var jsonDataMaster = oData2;
			var jsonDataHija = oData3;


			var jsonDataTableExcel = [];
			if (jsonDataTotal.length != 0) {
				for (var i = 0; i < jsonDataTotal.length; i++) {
					jsonDataTableExcel.push(jsonDataTotal[i]);
				}
			}
			if (jsonDataMaster.length != 0) {
				for (var i = 0; i < jsonDataMaster.length; i++) {
					jsonDataTableExcel.push(jsonDataMaster[i]);
				}
			} else if (jsonDataHija.length != 0) {
				for (var j = 0; j < jsonDataHija.length; j++) {
					jsonDataTableExcel.push(jsonDataHija[j]);
				}
			}

			if (jsonDataTableExcel.length < 1) {
				this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
				return;
			}

			var aCols, oSettings;

			aCols = this.createColumnConfig();
			var dDate = new Date();
			var sGetTime = dDate.getTime().toString();
			var sTitleExcel = this.getI18nText("sTitleExport") + '-' + sGetTime + '.xlsx';
			var sTitleDocument = ""
			if (this.isEmpty(sAuthor)) {
				sTitleDocument = this.getI18nText("Token");
			} else {
				sTitleDocument = this.getI18nText("Token") + "-" + sAuthor;
			}

			oSettings = {
				workbook: {
					context: {
						title: sTitleDocument,
						modifiedBy: this.getI18nText("author")
					},
					columns: aCols
				},
				dataSource: jsonDataTableExcel,
				fileName: sTitleExcel
			};

			var oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function () {
				oSheet.destroy();
			});
		},
		createColumnConfig: function () {
			return [
				{
					label: this.getI18nText("titleExportColMat"),
					property: 'Matnr',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleExportColCantidad"),
					property: 'cantidad',
					width: '15'
				}
			];
		},
		ColumnDetalle: function () {
			var oModel = [
				{
					sEtiqueta: this.getI18nText("txtColTab1IdPadre"),
					sAgrupador: 'IdCab',
					Type: EdmType.Number
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1Fecha"),
					sAgrupador: 'Fecha',
					sType: EdmType.Date,
					sFormat: 'dd/mm/yyyy'
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1CodHomologacion"),
					sAgrupador: 'IdHom',
					sType: EdmType.Number
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1Homologacion"),
					sAgrupador: 'Detalle',
					sType: EdmType.String
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1VentasUSD"),
					sAgrupador: 'iValorUs',
					sType: EdmType.Number
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1VentasPEN"),
					sAgrupador: 'iValor',
					sType: EdmType.Number
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1Transacciones"),
					sAgrupador: 'Trans',
					sType: EdmType.Number
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1ValorizacionUSD"),
					sAgrupador: 'iValorizacionUSD',
					sType: EdmType.Number
				},
				{
					sEtiqueta: this.getI18nText("txtColTab1ValorizacionPEN"),
					sAgrupador: 'iValorizacionPEN',
					sType: EdmType.Number
				}
			];
			return oModel;
		},
		decimalAdjust: function (type, value, exp) {
			// Si el exp no está definido o es cero...
			if (typeof exp === 'undefined' || +exp === 0) {
				return Math[type](value);
			}
			value = +value;
			exp = +exp;
			// Si el valor no es un número o el exp no es un entero...
			if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
				return NaN;
			}
			// Shift
			value = value.toString().split('e');
			value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
			// Shift back
			value = value.toString().split('e');
			return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
		},


		_onChangeDateDesde: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue()
			if (!this.isEmpty(sValue)) {
				var sFechaInicio = "";
				sFechaInicio = sValue.trim();
				var booleanValidateFirst = this.ValidateFormatDate(sFechaInicio);
				if (!booleanValidateFirst) {
					this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
					oSource.setValue("");
					this._byId("dpDateFilterHasta").setValue("");
					this._byId("dpDateFilterHasta").setEnabled(true);

					this._byId("dpDateFilterHasta").setEnabled(true);
					return;
				}

				oSource.setValue(sValue);
				this._byId("dpDateFilterHasta").setValue("");
				this._byId("dpDateFilterHasta").setEnabled(true);
			} else {
				oSource.setValue("");
				this._byId("dpDateFilterHasta").setValue("");
				this._byId("dpDateFilterHasta").setEnabled(true);
			}
		},
		_onChangeDateHasta: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValue = oSource.getValue()
			if (!this.isEmpty(sValue)) {
				var sFechaInicio = "";
				sFechaInicio = sValue.trim();
				var booleanValidateFirst = this.ValidateFormatDate(sFechaInicio);
				if (!booleanValidateFirst) {
					this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sValue);
					oSource.setValue("");
					return;
				}

				oSource.setValue(sValue);
				this._byId("dpDateFilterHasta").setEnabled(true);
			} else {
				oSource.setValue("");
			}
		},
		_onNavigateDateHasta: function (oEvent) {
			var oSource = oEvent.getSource();
			var sValueDesde = oSource.getValue();
			var sValueDesdeSplit = sValueDesde.split("/");
			var year = parseInt(sValueDesdeSplit[2]);
			var mount = parseInt(sValueDesdeSplit[1]);
			var day = parseInt(sValueDesdeSplit[0]);
			oSource.setMinDate(new Date(year, mount - 1, day));
		},
		_onChangeDateRange: function (oEvent) {
			let oSource = oEvent.getSource();
			let sValue = oSource.getValue()
			if (!this.isEmpty(sValue)) {
				let oSplitValue = sValue.split("-");
				//Inicio
				let sDateInit = oSplitValue[0].trim();
				let booleanValidateFirst = this.ValidateFormatDate(sDateInit);
				if (!booleanValidateFirst) {
					this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sDateInit);
					oSource.setValue("");
					return;
				}

				//Fin
				let sDateEnd = oSplitValue[1].trim();
				let booleanValidateEnd = this.ValidateFormatDate(sDateEnd);
				if (!booleanValidateEnd) {
					this.getMessageBox('error', this.getI18nText("sErrorChangeDatePicker") + sDateEnd);
					oSource.setValue("");
					return;
				}

				oSource.setValue(sValue);
			} else {
				oSource.setValue("");
			}
		},
		onGetFormatDate: function (date) {
			if (date && date !== "") {
				var y = date.getUTCFullYear(),
					m = date.getUTCMonth() + 1,
					d = date.getUTCDate();

				m = m < 10 ? "0" + m : m;
				d = d < 10 ? "0" + d : d;

				return d.toString() + "/" + m.toString() + "/" + y.toString();
			} else { return ""; }
		},
		onGetFormatDateAbap: function (date) {
			if (date && date !== "") {
				var y = date.getUTCFullYear(),
					m = date.getUTCMonth() + 1,
					d = date.getUTCDate();

				m = m < 10 ? "0" + m : m;
				d = d < 10 ? "0" + d : d;

				return y.toString() + "-" + m.toString() + "-" + d.toString() + "T00:00:00";
			} else { return ""; }
		},
		getYYYYMMDDSlash: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) { t = "0" + t; }
			if (n < 10) { n = "0" + n; }
			var o = r + "/" + n + "/" + t;
			return o
		},
		getYYYYMMDDLine: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) { t = "0" + t; }
			if (n < 10) { n = "0" + n; }
			var o = r + "-" + n + "-" + t;
			return o
		},
		getYYYYMMDDHHMMSSLine: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) { t = "0" + t; }
			if (n < 10) { n = "0" + n; }
			var o = r + "-" + n + "-" + t;
			var i = e.getHours();
			var u = e.getMinutes();
			var a = e.getSeconds();
			o = o + " " + this.zfill(i, 2) + ":" + this.zfill(u, 2) + ":" + this.zfill(a, 2);
			return o
		},
		getYYYYMMDDHHMMSSSlash: function (e) {
			var t = e.getDate();
			var n = e.getMonth() + 1;
			var r = e.getFullYear();
			if (t < 10) { t = "0" + t; }
			if (n < 10) { n = "0" + n; }
			var o = r + "/" + n + "/" + t;
			var i = e.getHours();
			var u = e.getMinutes();
			var a = e.getSeconds();
			o = o + " " + this.zfill(i, 2) + ":" + this.zfill(u, 2) + ":" + this.zfill(a, 2);
			return o
		},
		handleValueHelpFrom: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue(),
				sCustom = oEvent.getSource().data("custom"),
				oView = this.getView();
			this.oTokens = oEvent.getSource().getTokens();

			if (!this[sCustom.split("/")[1]]) {
				this[sCustom.split("/")[1]] = Fragment.load({
					id: oView.getId(),
					name: this.route + ".view.dialogs." + sCustom.split("/")[0],
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}

			this[sCustom.split("/")[1]].then(function (oValueHelpDialog) {
				oValueHelpDialog.open(sInputValue);
				that.oTokens.forEach(function (value) {
					oValueHelpDialog._oList.getItems().forEach(function (value2) {
						let oData = value2.getBindingContext("oModelData").getObject();
						if (value.getKey() === oData.code) {
							oValueHelpDialog._oList.setSelectedItem(value2);
						}
					})
				});
			});
		},
		handleValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue(),
				sCustom = oEvent.getSource().data("custom"),
				oView = this.getView();
			this.oTokens = oEvent.getSource().getTokens();

			if (!this[sCustom.split("/")[1]]) {
				this[sCustom.split("/")[1]] = Fragment.load({
					id: oView.getId(),
					name: this.route + ".view.dialogs." + sCustom.split("/")[0],
					controller: this
				}).then(function (oValueHelpDialog) {
					oView.addDependent(oValueHelpDialog);
					return oValueHelpDialog;
				});
			}

			this[sCustom.split("/")[1]].then(function (oValueHelpDialog) {
				oValueHelpDialog.open(sInputValue);
				that.oTokens.forEach(function (value) {
					oValueHelpDialog._oList.getItems().forEach(function (value2) {
						let oData = value2.getBindingContext("oModelData").getObject();
						if (value.getKey() === oData.code) {
							oValueHelpDialog._oList.setSelectedItem(value2);
						}
					})
				});
			});
		},
		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value"),
				sCustom = oEvent.getSource().data("custom").split("/")[2];
			var oFilter = new Filter(
				sCustom,
				FilterOperator.Contains,
				sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpSearchResponsible: function (oEvent) {
			var sValue = oEvent.getParameter("value"),
				sCustom = oEvent.getSource().data("custom").split("/")[2];
			var oFilter = new Filter({
				filters: [
					new Filter({
						path: sCustom,
						operator: FilterOperator.Contains,
						value1: sValue
					}),
					new Filter({
						path: "Code",
						operator: FilterOperator.Contains,
						value1: sValue
					}),
				],
				and: false
			});
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose: function (oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems"),
				sCustom = oEvent.getSource().data("custom").split("/")[1],
				oMultiInput;

			oMultiInput = this._byId(this.frgIdFilterInit + "--" + sCustom);
			if (aSelectedItems && aSelectedItems.length > 0) {
				oMultiInput.removeAllTokens(true);
				aSelectedItems.forEach(function (oItem) {
					oMultiInput.addToken(new Token({
						key: oItem.getDescription(),
						text: oItem.getTitle()
					}));
					that.getModel("oModelProyect").setProperty("/Main/filter/" + sCustom, oItem.getDescription());
					that.getModel("oModelProyect").setProperty("/Main/filter/" + sCustom + "Text", oItem.getTitle());
				});
			}

			switch (sCustom) {
				case "miTechnicalLocationFrom":
					var oMultiInput = this._byId(this.frgIdFilterInit + "--" + sCustom.slice(0, -4) + "To");

					if (aSelectedItems && aSelectedItems.length > 0) {
						oMultiInput.setEnabled(true);
					} else {
						oMultiInput.removeAllTokens(true);
						oMultiInput.setEnabled(false);
						that.getModel("oModelProyect").setProperty("/Main/filter/" + sCustom, "");
						that.getModel("oModelProyect").setProperty("/Main/filter/" + sCustom + "Text", "");
					}
				default:

			}


		},
		_clearComponent: function (oCell) {
			let sResponse = "";
			if (oCell instanceof sap.m.Input) sResponse = oCell.setValue("");
			if (oCell instanceof sap.m.DatePicker) sResponse = oCell.setValue("");
			if (oCell instanceof sap.m.Switch) oCell.setState("F");
			if (oCell instanceof sap.m.Link) oCell.setText("");
			if (oCell instanceof sap.m.CheckBox) oCell.setSelected("");
			if (oCell instanceof sap.m.ComboBox) oCell.setSelectedKey("");
			if (oCell instanceof sap.m.MultiComboBox) oCell.setSelectedKeys("");
			if (oCell instanceof sap.m.MultiInput) oCell.removeAllTokens(true);
			if (oCell instanceof sap.m.TextArea) oCell.setValue("");
			if (oCell instanceof sap.ui.unified.FileUploader) {
				var oFile = oCell.data("oFile");
				var oContext = oCell.data("oContext");
				if (oFile) {
					self.uploadFileLegal(oFile, function (res) {
						if (res) {
							if (res.ok) {
								res.result.forEach(function (oItem) {
									if (oItem.response) {
										oContext.NewIdAdjunto = oItem.response.idAdjunto;
									}
								})
							}
							oCell.data("oContext", oContext);
						}
					});
				}
				sResponse = oCell.getValue() ? oCell.getValue() : "";
			}
		},
		_validatorComponent: function (oCell) {
			let bValidate = false;
			if (oCell instanceof sap.m.HBox) bValidate = true;
			if (oCell instanceof sap.m.VBox) bValidate = true;
			return bValidate;
		},
		_getDataControl: function (oCell) {
			var sResponse = "";
			if (oCell instanceof sap.m.Input) sResponse = oCell.getValue() ? oCell.getValue() : "";
			if (oCell instanceof sap.m.DatePicker) sResponse = oCell.getDateValue() ? oCell.getDateValue() + "" : "";
			if (oCell instanceof sap.m.Switch) sResponse = oCell.getState() ? "V" : "F";
			if (oCell instanceof sap.m.Link) sResponse = oCell.getText() ? oCell.getText() : "";
			if (oCell instanceof sap.m.CheckBox) sResponse = oCell.getSelected() ? "X" : "";
			if (oCell instanceof sap.m.ComboBox) sResponse = oCell.getSelectedKey() ? oCell.getSelectedKey() : "";
			if (oCell instanceof sap.m.MultiComboBox) sResponse = oCell.getSelectedKeys() ? oCell.getSelectedKeys().join(",") : "";
			if (oCell instanceof sap.m.TextArea) sResponse = oCell.getValue() ? oCell.getValue() : "";
			if (oCell instanceof sap.ui.unified.FileUploader) {
				var oFile = oCell.data("oFile");
				var oContext = oCell.data("oContext");
				if (oFile) {
					self.uploadFileLegal(oFile, function (res) {
						if (res) {
							if (oContext.IdSolicitudContratoFormatoRespAdjunto) {
								self.onDeleteEntity("LegSolicitudContratoFormatoRespAdjuntos", oContext.IdSolicitudContratoFormatoRespAdjunto, {
									IdSolicitudContratoFormatoRespAdjunto: oContext.IdSolicitudContratoFormatoRespAdjunto,
									UpdateTime: new Date(),
									UserloginDelete: oUser.id
								}, function (res) { });
							}
							if (res.ok) {
								res.result.forEach(function (oItem) {
									if (oItem.response) {
										oContext.NewIdAdjunto = oItem.response.idAdjunto;
									}
								})
							}
							oCell.data("oContext", oContext);
						}
					});
				}
				sResponse = oCell.getValue() ? oCell.getValue() : "";
			}
			return sResponse;
		},
		_uploadSharepoint: function (file, onProgress, aFolderChain) {
			const that = this;
			return new Promise((resolve) => {
				const baseFolderPath = "Repositorio Apps/SAP Hana/Pruebas BTP/Proveedores/PETICIONES DE OFERTA Y OFERTAS";
				let folderPath = baseFolderPath;
				if (Array.isArray(aFolderChain) && aFolderChain.length) {
					folderPath += "/" + aFolderChain.join("/");
				}
				const encodedPath = encodeURIComponent(`${folderPath}/${file.name}`);
				let sUrl = "";
				if (that.local) {
					sUrl = that.getOwnerComponent()
						.getManifestObject()
						.resolveUri(
							`/sites/${that.routeSharepoint}/drives/${that.driveId}/root:/${encodedPath}:/content`
						);
				} else {
					sUrl =
						jQuery.sap.getModulePath(that.route) +
						`/SharePointAris/sites/${that.routeSharepoint}/drives/${that.driveId}/root:/${encodedPath}:/content`;
				}
				Services.sharePointUploadProgressSync(
					sUrl,
					file,
					onProgress,
					function (result) {
						if (result.iCode === 1) {
							resolve({ sEstado: "S", oResults: result.data });
						} else {
							resolve({ sEstado: "E", oResults: result.data });
						}
					}
				);
			});
		},
		_ensureSharePointFolderChain: function (aFolderChain) {
			const that = this;
			return new Promise(function (resolve) {
				if (!Array.isArray(aFolderChain) || !aFolderChain.length) {
					resolve({ sEstado: "S" });
					return;
				}
				const baseFolder = "Repositorio Apps/SAP Hana/Pruebas BTP/Proveedores/PETICIONES DE OFERTA Y OFERTAS";
				let currentPath = baseFolder;
				let iIndex = 0;
				const fnNext = function () {
					if (iIndex >= aFolderChain.length) {
						resolve({ sEstado: "S" });
						return;
					}
					const sFolderName = aFolderChain[iIndex];
					const encodedParentPath = encodeURIComponent(currentPath);
					let sUrl = "";
					if (that.local) {
						sUrl = that.getOwnerComponent()
							.getManifestObject()
							.resolveUri(
								`/sites/${that.routeSharepoint}/drives/${that.driveId}/root:/${encodedParentPath}:/children`
							);
					} else {
						sUrl =
							jQuery.sap.getModulePath(that.route) +
							`/SharePointAris/sites/${that.routeSharepoint}/drives/${that.driveId}/root:/${encodedParentPath}:/children`;
					}
					const oBody = {
						name: sFolderName,
						folder: {},
						"@microsoft.graph.conflictBehavior": "fail"
					};
					Services.sharePointCreateFolderSync(sUrl, oBody, function (result) {
						if (result.iCode === 1 || result.status === 409) {
							currentPath = currentPath + "/" + sFolderName;
							iIndex++;
							fnNext();
						} else {
							resolve({ sEstado: "E", oResults: result });
						}
					});
				};

				fnNext();
			});
		},
		_getPrueba: function () {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = '/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES';
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/S4HANA/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES';
						sUrl = sPath;
					}
					if (that.localModel) { resolve(models.oModelPrueba()); }
					else {
						Services.getoDataERPSync(that, sUrl, function (result) {
							util.response.validateAjaxGetERPNotMessage(result, {
								success: function (oData, message) {
									oResp.sEstado = "S";
									oResp.oResults = oData.data;
									resolve(oResp);
								},
								error: function (message) {
									oResp.oResults = [];
									resolve(oResp);
								}
							});
						});
					}
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		_getState: function (context) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "",
						sNumPedido = "";
					if (that.local) {
						const sPath = '/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/S4HANA/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = sPath;
					}
					if (that.localModel) { resolve(models.JsonState(context)); }
					else {
						Services.getoDataERPSync(that, sUrl, function (result) {
							util.response.validateAjaxGetERPNotMessage(result, {
								success: function (oData, message) {
									oResp.sEstado = "S";
									oResp.oResults = oData.data;
									resolve(oResp);
								},
								error: function (message) {
									oResp.oResults = [];
									resolve(oResp);
								}
							});
						});
					}
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		_getCondPago: function (context) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "",
						sNumPedido = "";
					if (that.local) {
						const sPath = '/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/S4HANA/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = sPath;
					}
					if (that.localModel) { resolve(models.JsonCondPago(context)); }
					else {
						Services.getoDataERPSync(that, sUrl, function (result) {
							util.response.validateAjaxGetERPNotMessage(result, {
								success: function (oData, message) {
									oResp.sEstado = "S";
									oResp.oResults = oData.data;
									resolve(oResp);
								},
								error: function (message) {
									oResp.oResults = [];
									resolve(oResp);
								}
							});
						});
					}
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},

		_setLanguageModel: function (langKey) {
			var bundleName;
			if (langKey === "esp") {
				bundleName = "com.proveedor.peticionoferta.pe.i18n.i18n_esp";
			} else if (langKey === "ing") {
				bundleName = "com.proveedor.peticionoferta.pe.i18n.i18n_ing";
			} else {
				console.warn("Idioma no soportado:", langKey);
				return;
			}

			var i18nModel = new ResourceModel({
				bundleName: bundleName
			});
			this.getView().setModel(i18nModel, "i18n");
			this.getModel("oModelProyect").setProperty("/sIdioma", langKey);

		},
		onLiveCalculate: function (oEvent) {
			var oInput = oEvent.getSource();
			var value = oInput.getValue();
			value = value.replace(/[^\d.]/g, "");
			value = value.replace(/(\..*)\./g, "$1");
			var num = parseFloat(value);
			if (isNaN(num)) num = 0;
			oInput.setValue(value);
			var oContext = oInput.getBindingContext("oModelProyect");
			var oModel = oContext.getModel();
			var oData = oContext.getObject();
			var sField = oInput.getBindingPath("value");

			var cantidad = parseFloat(oData.cantCotizada) || 0;
			var precio = parseFloat(oData.priceUnit) || 0;
			var descuento = parseFloat(oData.Discount) || 0;
			var maximo = parseFloat(oData.ScheduleLineOrderQuantity) || 0;
			if (sField === "cantCotizada") {
				cantidad = num;
				if (cantidad > maximo) {
					oInput.setValueState("Error");
					oInput.setValueStateText("Cantidad excedida. Máximo permitido: " + maximo);
					sap.m.MessageBox.error(
						"La cantidad ingresada (" + cantidad +
						") excede la cantidad solicitada (" + maximo + ").",
						{ title: "Error en cantidad" }
					);
					cantidad = maximo;
					oModel.setProperty(oContext.getPath() + "/cantCotizada", maximo);
				} else {
					oInput.setValueState("None");
					oModel.setProperty(oContext.getPath() + "/cantCotizada", cantidad);
				}
			}
			if (sField === "priceUnit") {
				precio = num;
				oModel.setProperty(oContext.getPath() + "/priceUnit", precio);
			}
			if (sField === "Discount") {
				descuento = num;
				if (descuento < 0) descuento = 0;
				if (descuento > 100) descuento = 100;
				oModel.setProperty(oContext.getPath() + "/Discount", descuento);
			}
			var subtotal = cantidad * precio;
			subtotal -= subtotal * descuento / 100;
			oModel.setProperty(oContext.getPath() + "/SubTotal", subtotal.toFixed(2));
		},
		onLiveCalculateInteger: function (oEvent) {
			var oInput = oEvent.getSource();
			var value = oInput.getValue();
			value = value.replace(/[^\d.]/g, "");
			value = value.replace(/(\..*)\./g, "$1");
			var num = parseFloat(value);
			if (isNaN(num)) {
				num = 0;
			}
			oInput.setValue(value);
			var sNewValue = value;
			var oContext = oInput.getBindingContext("oModelProyect");
			var oModel = oContext.getModel();
			var oData = oContext.getObject();
			var sField = oInput.getBindingPath("value");
			var cantidad = parseFloat(oData.cantCotizada) || 0;
			var precio = parseFloat(oData.priceUnit) || 0;
			var descuento = parseFloat(oData.Discount) || 0;
			var maximo = parseFloat(oData.ScheduleLineOrderQuantity) || 0;
			if (sField === "cantCotizada") {
				cantidad = num;
				if (cantidad > maximo) {
					oInput.setValueState("Error");
					oInput.setValueStateText("Cantidad excedida. Máximo permitido: " + maximo);
					sap.m.MessageBox.error(
						"La cantidad ingresada (" + cantidad +
						") excede la cantidad solicitada (" + maximo + ").",
						{ title: "Error en cantidad" }
					);
					cantidad = maximo;
					oModel.setProperty(oContext.getPath() + "/cantCotizada", maximo);
				} else {
					oInput.setValueState("None");
					oModel.setProperty(oContext.getPath() + "/cantCotizada", cantidad);
				}
			}
			if (sField === "priceUnit") {
				precio = num;
				oModel.setProperty(oContext.getPath() + "/priceUnit", precio);
			}
			if (sField === "Discount") {
				descuento = num;
				if (descuento < 0) descuento = 0;
				if (descuento > 100) descuento = 100;
				oModel.setProperty(oContext.getPath() + "/Discount", descuento);
			}
			var subtotal = cantidad * precio;
			subtotal -= subtotal * descuento / 100;
			oModel.setProperty(oContext.getPath() + "/SubTotal", subtotal.toFixed(2));
		},
		onLiveCalculateFloat: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d.]/g;
			var x = values.replace(/[^\d]/g, '');
			if (values.match(regex)) { var x = values; }
			else { var x = ''; }
			var x = parseFloat(values);
			var sValueUsed = isNaN(x) ? '0.00' : values;
			oSource.setValue(sValueUsed);
			var oInput = oEvent.getSource();
			var sNewValue = oEvent.getParameter("value");
			var oContext = oInput.getBindingContext("oModelProyect");
			var oModel = oContext.getModel();
			var oData = oContext.getObject();
			var sField = oInput.getBindingPath("value");
			var cantidad = parseFloat(oData.cantCotizada) || 0;
			var precio = parseFloat(oData.priceUnit) || 0;
			var descuento = parseFloat(oData.Discount) || 0;
			var maximo = parseFloat(oData.ScheduleLineOrderQuantity) || 0;
			if (sField === "cantCotizada") {
				cantidad = parseFloat(sNewValue) || 0;
				if (cantidad > maximo) {
					oInput.setValueState("Error");
					oInput.setValueStateText("Cantidad excedida. Máximo permitido: " + maximo);
					sap.m.MessageBox.error(
						"La cantidad ingresada (" + cantidad +
						") excede la cantidad solicitada (" + maximo + ").",
						{ title: "Error en cantidad" }
					);
					cantidad = maximo;
					oModel.setProperty(oContext.getPath() + "/cantCotizada", maximo);
				} else {
					oInput.setValueState("None");
				}
			}
			if (sField === "priceUnit") {
				precio = parseFloat(sNewValue) || 0;
				oModel.setProperty(oContext.getPath() + "/priceUnit", precio);
			}
			if (sField === "Discount") {
				descuento = parseFloat(sNewValue) || 0;
				if (descuento < 0) { descuento = 0; }
				if (descuento > 100) { descuento = 100; }
				oModel.setProperty(oContext.getPath() + "/Discount", descuento);
			}
			var subtotal = cantidad * precio;
			subtotal -= subtotal * descuento / 100;

			oModel.setProperty(oContext.getPath() + "/SubTotal", subtotal.toFixed(2));
		},

		_getFechaPeticionMs: function (vDate) {
			if (!vDate) {
				return 0;
			}

			if (vDate instanceof Date) {
				return vDate.getTime();
			}

			const sDate = String(vDate).trim();

			// Formato SAP: /Date(1780099200000)/
			if (sDate.indexOf("/Date(") >= 0) {
				const nMs = parseInt(sDate.replace(/[^\d]/g, ""), 10);
				return isNaN(nMs) ? 0 : nMs;
			}

			// Formato visual: dd/MM/yyyy o dd-MM-yyyy
			const aMatch = sDate.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
			if (aMatch) {
				const nDay = parseInt(aMatch[1], 10);
				const nMonth = parseInt(aMatch[2], 10) - 1;
				const nYear = parseInt(aMatch[3], 10);
				return new Date(nYear, nMonth, nDay).getTime();
			}

			const nTime = new Date(sDate).getTime();
			return isNaN(nTime) ? 0 : nTime;
		},

		_sortByFechaPeticionDesc: function (aData) {
			const that = this;

			return (Array.isArray(aData) ? aData : []).slice().sort(function (a, b) {
				const nA = that._getFechaPeticionMs(a.CreationDate);
				const nB = that._getFechaPeticionMs(b.CreationDate);

				// Fecha de Petición más actual primero.
				return nB - nA;
			});
		},

		_getPetOffertMain: function (sRequestForQuotation, sSupplier) {
			try {
				var oResp = {
					sEstado: "E",
					oResults: []
				};

				return new Promise(function (resolve, reject) {
					let sUrl = "";
					let sFilter = [];

					if (sRequestForQuotation) {
						sFilter.push(`RequestForQuotation eq '${sRequestForQuotation}'`);
					}

					if (sSupplier) {
						sFilter.push(`Supplier eq '${sSupplier}'`);
					}

					const sFilterParam = sFilter.length > 0
						? `&$filter=${sFilter.join(" and ")}`
						: "";

					if (that.local) {
						const sPath =
							"/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVPEOFERTA" +
							"?$top=10000&$format=json&sap-language=es-ES" +
							sFilterParam;

						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath =
							jQuery.sap.getModulePath(that.route) +
							"/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVPEOFERTA" +
							"?$top=10000&$format=json&sap-language=es-ES" +
							sFilterParam;

						sUrl = sPath;
					}

					Services.getoDataERPSync(that, sUrl, function (result) {
						util.response.validateAjaxGetERPNotMessage(result, {
							success: function (oData, message) {
								let aResults = oData.data || [];
								const norm = (v) => String(v || "").trim();

								if (sRequestForQuotation) {
									aResults = aResults.filter(x => norm(x.RequestForQuotation) === norm(sRequestForQuotation));
								}

								if (sSupplier) {
									aResults = aResults.filter(x => norm(x.Supplier) === norm(sSupplier));
								}

								const aFiltered = aResults.filter((obj, index, self) =>
									index === self.findIndex(t =>
										norm(t.RequestForQuotation) === norm(obj.RequestForQuotation) &&
										norm(t.Supplier) === norm(obj.Supplier)
									)
								);

								const aSorted = that._sortByFechaPeticionDesc(aFiltered);

								oResp.sEstado = "S";
								oResp.oResults = aSorted;
								resolve(oResp);
							},
							error: function () {
								oResp.sEstado = "E";
								oResp.oResults = [];
								resolve(oResp);
							}
						});
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		_getPetOffertFilter: function (sRequestForQuotation, sSupplier) {
			try {
				var oResp = {
					sEstado: "E",
					oResults: [],
					aEstados: [],
					aRFQDisponibles: [],
					aSupplierDisponibles: [],
					aNameSupplierDisponibles: []
				};

				return new Promise(function (resolve, reject) {
					let sUrl = "";
					let aFilter = [];

					if (sRequestForQuotation) {
						aFilter.push(`RequestForQuotation eq '${sRequestForQuotation}'`);
					}

					if (sSupplier) {
						aFilter.push(`Supplier eq '${sSupplier}'`);
					}

					const sFilterParam = aFilter.length > 0
						? `&$filter=${aFilter.join(" and ")}`
						: "";

					if (that.local) {
						const sPath =
							"/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVPEOFERTA" +
							"?$top=10000&$format=json&sap-language=es-ES" +
							sFilterParam;

						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath =
							jQuery.sap.getModulePath(that.route) +
							"/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVPEOFERTA" +
							"?$top=10000&$format=json&sap-language=es-ES" +
							sFilterParam;

						sUrl = sPath;
					}

					Services.getoDataERPSync(that, sUrl, function (result) {
						util.response.validateAjaxGetERPNotMessage(result, {
							success: function (oData, message) {
								let aResults = oData.data || [];
								const norm = (v) => String(v || "").trim();

								if (sRequestForQuotation) {
									aResults = aResults.filter(x => norm(x.RequestForQuotation) === norm(sRequestForQuotation));
								}

								if (sSupplier) {
									aResults = aResults.filter(x => norm(x.Supplier) === norm(sSupplier));
								}

								const aFiltered = aResults.filter((obj, index, self) =>
									index === self.findIndex(t =>
										norm(t.RequestForQuotation) === norm(obj.RequestForQuotation) &&
										norm(t.Supplier) === norm(obj.Supplier)
									)
								);

								const uniq = (arr) => [...new Set(arr.map(x => norm(x)).filter(Boolean))];
								const aSorted = that._sortByFechaPeticionDesc(aFiltered);

								oResp.sEstado = "S";
								oResp.oResults = aSorted;
								oResp.aEstados = uniq(aSorted.map(x => x.DscStatus));
								oResp.aRFQDisponibles = uniq(aSorted.map(x => x.RequestForQuotation));
								oResp.aSupplierDisponibles = uniq(aSorted.map(x => x.Supplier));
								oResp.aNameSupplierDisponibles = uniq(aSorted.map(x => x.NameSupplier));

								resolve(oResp);
							},
							error: function () {
								oResp.sEstado = "E";
								oResp.oResults = [];
								oResp.aEstados = [];
								oResp.aRFQDisponibles = [];
								oResp.aSupplierDisponibles = [];
								oResp.aNameSupplierDisponibles = [];
								resolve(oResp);
							}
						});
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},


	});
});