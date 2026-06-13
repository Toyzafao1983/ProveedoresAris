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
	"com/aris/proveedores/facturaexterior/pe/services/ServiceOdata",
	"com/aris/proveedores/facturaexterior/pe/model/models",
	"com/aris/proveedores/facturaexterior/pe/model/formatter",
	"com/aris/proveedores/facturaexterior/pe/services/Services",
	"com/aris/proveedores/facturaexterior/pe/util/util",
	"sap/ui/model/resource/ResourceModel"
], function (Controller, History, UIComponent, MessageBox, MessageToast, Fragment, BusyIndicator, JSONModel,
	Filter, FilterOperator, Spreadsheet, Token, ServiceOdata, models, Formatter, Services, util, ResourceModel) {
	"use strict";
	var that;
	var sMessage = "";
	var that;

	return Controller.extend("com.aris.proveedores.facturaexterior.pe.controller.BaseController", {
		formatter: Formatter,
		local: window.location.href.indexOf('launchpad') == -1 ? true : false,
		localModel: true,
		AdminUser: false,
		userSet: "kestefo@ravaconsulting.com.pe",
		route: "com.aris.proveedores.facturaexterior.pe",
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
					if (that.local) {
						setTimeout(() => {
							if (that.AdminUser) {
								resolve(models.oModelUser());
							} else {
								resolve(models.oModelUserExt());
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

			const hasGroup = function (sGroup) {
				return aGroups.includes(sGroup);
			};

			const sAttribute4 = this._getScimCustomAttributeValue(oUser, "customAttribute4");
			const sAttribute5 = this._getScimCustomAttributeValue(oUser, "customAttribute5");

			const bHasAttribute4 = !!sAttribute4;
			const bHasAttribute5 = !!sAttribute5;

			// Regla funcional:
			// 1. Si attribute4 tiene BP => proveedor / cliente externo.
			// 2. Si attribute5 tiene código y attribute4 está vacío => usuario interno Aris.
			// 3. Si además tiene grupo INT_PROVEEDORES_COMEX_ARIS => usuario COMEX.
			const bIsExtAyc = bHasAttribute4;
			const bIsInterno = !bHasAttribute4 && bHasAttribute5;
			const bIsIntComex = bIsInterno && hasGroup("INT_PROVEEDORES_COMEX_ARIS");

			const sRolPrincipal =
				bIsExtAyc ? "EXT" :
					bIsIntComex ? "COMEX_INT" :
						bIsInterno ? "INT_ARIS" :
							"SIN_ROL";

			return {
				aGroups: aGroups,
				sAttribute4: sAttribute4,
				sAttribute5: sAttribute5,
				bIsExtAyc: bIsExtAyc,
				bIsInterno: bIsInterno,
				bIsIntComex: bIsIntComex,
				sRolPrincipal: sRolPrincipal,

				// Para filtros de proveedor externo solo debe usarse attribute4.
				sExtBP: bIsExtAyc ? sAttribute4 : "",

				// Código interno Aris, por si luego lo necesitas.
				sInternalBP: bIsInterno ? sAttribute5 : ""
			};
		},

		_applyProveedorUserProfile: function (oUser) {
			const oProfile = this._resolveProveedorUserProfile(oUser);
			const oMU = this.getOwnerComponent().getModel("oModelUser");

			if (oMU) {
				oMU.setProperty("/groups", oProfile.aGroups);
				oMU.setProperty("/customAttribute4", oProfile.sAttribute4);
				oMU.setProperty("/customAttribute5", oProfile.sAttribute5);

				// Mantengo los mismos nombres actuales para no tocar XML ni validaciones existentes.
				oMU.setProperty("/bIsIntComex", oProfile.bIsIntComex);
				oMU.setProperty("/bIsExtAyc", oProfile.bIsExtAyc);
				oMU.setProperty("/bIsInterno", oProfile.bIsInterno);
				oMU.setProperty("/sRolPrincipal", oProfile.sRolPrincipal);
				oMU.setProperty("/sExtBP", oProfile.sExtBP);
				oMU.setProperty("/sInternalBP", oProfile.sInternalBP);
				oMU.setProperty("/_loaded", true);
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
		liveChangeToUpperCase: function (oEvent) {
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			oSource.setValue(values.toUpperCase());
		},
		liveChangeFormatInteger: function (oEvent) {
			var sValueUsed = "";
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) { var x = values; }
			else { var x = values.substring(0, values.length - 1); }
			var x = parseInt(values);

			if (values.length != x.toString().length) { sValueUsed = isNaN(x) ? '0' : that.zfill(x, values.length); }
			else { sValueUsed = isNaN(x) ? '' : x.toString(); }

			oSource.setValue(sValueUsed);
		},
		liveChangeFormatFloat: function (oEvent) {
			var sValueUsed = "";
			var oSource = oEvent.getSource();
			var values = oSource.getValue();
			var regex = /[^\d]/g;
			var x = values.replace(/[^\d]/g, '');

			if (values.match(regex)) { var x = values; }
			else { var x = ''; }
			var x = parseFloat(values);
			sValueUsed = isNaN(x) ? '' : x.toString();

			if (values[values.length - 1] === "." && values.split(".").length == 2) { sValueUsed = x.toString() + "." }
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
		MultiChangeSelectedTo: function (oEvent) {
			var oSource = oEvent.getSource(),
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[0],
				oSelectedItems = oSource.getSelectedItems(),
				oKey = [],
				oText = [];

			oSelectedItems.forEach(function (value) {
				oKey.push(value.getKey());
				oText.push(value.getText());
			});

			this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, oKey);
			this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", oText);
		},
		ChangeSelectedDetalleHeaderTo: function (oEvent) {
			var oSource = oEvent.getSource(),
				sValue = oSource.getValue(),
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[0],
				sTextParameter = sCustom.split("/")[1],
				sObject = oSource.getSelectedItem() ? oSource.getSelectedItem().getBindingContext("oModelData").getObject() : "";

			if (this.isEmpty(oSource.getSelectedKey())) {
				this.getView().getModel("oModelProyect").setProperty("/oCabecera/" + sCustomParameter, "");
				this.getView().getModel("oModelProyect").setProperty("/oCabecera/" + sCustomParameter + "Text", "");
			} else {
				this.getView().getModel("oModelProyect").setProperty("/oCabecera/" + sCustomParameter, oSource.getSelectedKey());
				this.getView().getModel("oModelProyect").setProperty("/oCabecera/" + sCustomParameter + "Text", sObject[sTextParameter]);
			}
			oSource.setValue(sValue);
		},
		ChangeSelectedTo: function (oEvent) {
			var oSource = oEvent.getSource(),
				sValue = oSource.getValue(),
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[0],
				sTextParameter = sCustom.split("/")[1],
				sObject = oSource.getSelectedItem() ? oSource.getSelectedItem().getBindingContext("oModelData").getObject() : "";

			if (this.isEmpty(oSource.getSelectedKey())) {
				this.getView().getModel("oModelProyect").setProperty("/jDatosViaje/" + sCustomParameter, "");
				this.getView().getModel("oModelProyect").setProperty("/jDatosViaje/" + sCustomParameter + "Text", "");
			} else {
				this.getView().getModel("oModelProyect").setProperty("/jDatosViaje/" + sCustomParameter, oSource.getSelectedKey());
				this.getView().getModel("oModelProyect").setProperty("/jDatosViaje/" + sCustomParameter + "Text", sObject[sTextParameter]);
			}
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
		_hasCargaData: function (oMP) {
			const aB = oMP.getProperty("/jDatosCarga/oBultos") || [];
			const aC = oMP.getProperty("/jDatosCarga/oContenido") || [];
			return (Array.isArray(aB) && aB.length) || (Array.isArray(aC) && aC.length);
		},

		_hasViajeData: function (oMP) {
			const v = oMP.getProperty("/jDatosViaje") || {};
			// considera “hay data” si al menos uno de los campos clave tiene algo
			return !!(
				String(v.cbModalidad || "").trim() ||
				String(v.sViajeNave || "").trim() ||
				String(v.sViajeNumBL || "").trim() ||
				String(v.cbTipoEmision || "").trim() ||
				String(v.sPaisEmbarque || v.cbPaisesEmb || "").trim() ||
				String(v.sPuertaEmbarque || "").trim() ||
				String(v.sFechaETD || "").trim() ||
				String(v.sFechaETA || "").trim()
			);
		},

		_hasAdjuntosData: function (oMP) {
			const aDocs = oMP.getProperty("/documentos") || [];
			return Array.isArray(aDocs) && aDocs.length > 0;
		},

		_isDialogSaved: function (oMP, sKey) {
			const oState = oMP.getProperty("/appContext/dialogState") || {};
			const st = oState[sKey] || {};
			// savedOnce te evita “se guardó una vez y luego se reabrió”
			return !!st.saved || !!st.savedOnce;
		},
		_onPressClose: function (oEvent) {
			var oSource = oEvent.getSource();
			var sCustom = oSource.data("custom") || "default";
			var oMP = this.getModel("oModelProyect");

			var sIdSap = String(
				oMP.getProperty("/appContext/sIdSap") ||
				oMP.getProperty("/oCabecera/IdSap") ||
				""
			).trim();

			var bFromIdSap = !!oMP.getProperty("/appContext/bFromIdSap");
			var bIsIdSapContext = bFromIdSap || !!sIdSap;

			if (bIsIdSapContext) {
				if (sIdSap && typeof this._persistStateByIdSap === "function") {
					this._persistStateByIdSap(sIdSap);
				}
				oSource.getParent().close();
				return;
			}

			try {
				var oDlg = oSource.getParent();
				var sDlgId = (oDlg && oDlg.getId) ? oDlg.getId() : "";
				if (sCustom === "default" && sDlgId.indexOf("IdDocumentUpload") !== -1) {
					sCustom = "AdjuntarDocumentos";
				}
			} catch (e) { /* noop */ }

			switch (sCustom) {

				case "DatosCarga": {
					const bSaved = this._isDialogSaved(oMP, "DatosCarga");
					const bHasData = this._hasCargaData(oMP);
					if (!bSaved && !bHasData) {
						oMP.setProperty("/jDatosCarga/oBultos", []);
						oMP.setProperty("/jDatosCarga/oContenido", []);
					}

					oSource.getParent().close();
					break;
				}

				case "DatosViaje": {
					const bSaved = this._isDialogSaved(oMP, "DatosViaje");
					const bHasData = this._hasViajeData(oMP);

					if (!bSaved && !bHasData) {
						oMP.setProperty("/jDatosViaje/cbModalidad", "");
						oMP.setProperty("/jDatosViaje/sViajeNave", "");
						oMP.setProperty("/jDatosViaje/sViajeNumBL", "");
						oMP.setProperty("/jDatosViaje/cbTipoEmision", "");
						oMP.setProperty("/jDatosViaje/sPaisEmbarque", "");
						oMP.setProperty("/jDatosViaje/sPuertaEmbarque", "");
						oMP.setProperty("/jDatosViaje/sFechaETD", "");
						oMP.setProperty("/jDatosViaje/sPaisDesembarque", "");
						oMP.setProperty("/jDatosViaje/sPuertaDesembarque", "");
						oMP.setProperty("/jDatosViaje/sFechaETA", "");
					}

					oSource.getParent().close();
					break;
				}

				case "AdjuntarDocumentos": {
					const bSaved = this._isDialogSaved(oMP, "AdjuntarDocumentos");
					const bHasData = this._hasAdjuntosData(oMP);

					if (!bSaved && !bHasData) {
						oMP.setProperty("/documentos", []);
						oMP.setProperty("/jDatosAdjuntos/cbTipDocument", "");
						oMP.setProperty("/jDatosAdjuntos/sTipDocumentText", "");
						oMP.setProperty("/jDatosAdjuntos/bPendienteSubirSP", false);
					}

					oSource.getParent().close();
					break;
				}

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
			var obj = {};

			if (xml.nodeType === 1) { // element
				if (xml.attributes.length > 0) {
					obj.attributes = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj.attributes[attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType === 3) {
				obj = xml.nodeValue.trim();
			}

			if (xml.hasChildNodes() && xml.childNodes.length === 1 && (xml.childNodes[0].nodeType === 3 || xml.childNodes[0].nodeType === 4)) {
				obj.value = xml.childNodes[0].nodeValue.trim();
			} else if (xml.hasChildNodes()) {
				for (var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = "";
					if (item.nodeName.indexOf(":") != -1) {
						nodeName = item.nodeName.substring(item.nodeName.indexOf(":") + 1);
					} else {
						nodeName = item.nodeName;
					}
					if (typeof (obj[nodeName]) === "undefined") {
						obj[nodeName] = this.xmlToJson(item);
					} else {
						if (typeof (obj[nodeName].push) === "undefined") {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(this.xmlToJson(item));
					}
				}
			}

			return obj;
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
		onGetAbapFormatDate: function (date) {
			if (date && date !== "") {
				return date.substring(6, 8) + "/" + date.substring(4, 6) + "/" + date.substring(0, 4);
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
				// oMultiInput = this._byId( sCustom );
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
			let oModel = { bValidate: false, sCode: "" };
			if (oCell instanceof sap.m.HBox) oModel = { bValidate: true, sCode: "HVBox" };
			if (oCell instanceof sap.m.VBox) oModel = { bValidate: true, sCode: "HVBox" };
			if (oCell instanceof sap.ui.comp.filterbar.FilterBar) oModel = { bValidate: true, sCode: "FilterBar" };
			return oModel;
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
		EvaluarType: function (oEvent) {
			let aFileTypes = oEvent.getSource().getFileType()
			this.getMessageBox("error", this.getI18nText("errorTypeExtension") + aFileTypes.join(", "));
		},
		EvaluarFileSize: function (oEvent) {
			var size = this.getView().getModel("modelInformation").getProperty("/valorFilePDF");
			that.getMessageBox("error", that.getI18nText("errorSizeType") + size + "MB");
		},
		FileToBase64: function (f, callback) {
			var reader = new FileReader();
			reader.onload = (function (theFile) {
				return function (e) { callback(e.target.result); };
			})(f);
			reader.readAsDataURL(f);
		},
		SplitTernas: function (texto, range) {
			const resultado = [];
			for (let i = 0; i < texto.length; i += range) {
				resultado.push(texto.substr(i, range));
			}
			return resultado;
		},
		formatTwoInteger: function (value) {
			const num = Number(value);
			if (!isNaN(num)) {
				return num.toLocaleString('es-PE', {
					maximumFractionDigits: 2
				});
			} else if (typeof value === 'string') {
				return parseFloat(value).toLocaleString('es-PE', {
					maximumFractionDigits: 2
				});
			} else { return '0'; }
		},
		formatTwoDecimalsMonto: function (value) {
			const num = Number(value);
			if (!isNaN(num)) {
				return num.toLocaleString('es-PE', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				});
			} else if (typeof value === 'string') {
				return parseFloat(value).toLocaleString('es-PE', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				});
			} else { return '0.00'; }
		},
		formatInteger: function (value) {
			const num = Number(value);
			if (!isNaN(num)) {
				return (num).toString();
			} else if (typeof value === 'string') {
				return (parseInt(value)).toString();
			} else { return '0.00'; }
		},
		formatTwoDecimals: function (value) {
			const num = Number(value);
			if (!isNaN(num)) {
				return that.safeToFixed(num, 2);
			} else if (typeof value === 'string') {
				return that.safeToFixed(parseFloat(value), 2);
			} else { return '0.00'; }
		},
		safeToFixed: function (num, decimals) {
			return (Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
		},

		_onClearDataFilter: function () {
			that.getModel("oModelProyect").setProperty("/", models.createModelProyect());
		},
		fnreemLetrasCant: function (oEvent) {
			var Objeto = oEvent.getSource();
			var val = Objeto.getValue();
			val = val.replace(/[^0-9,.]/g, '').replace(/,/g, '.');
			val = parseFloat(val).toFixed(2);
			val = val.toString();
			// val.indexOf();
			if (val === "NaN") {
				val = "0.00";
			}

			val = parseFloat(val);

			if (isNaN(val) || val === 0) {
				val = parseFloat(0).toFixed(2);
			} else {
				val = val.toFixed(2);

				var val_parts = val.split('.'),
					regexp = /(\d+)(\d{3})/;

				while (regexp.test(val_parts[0]))
					val_parts[0] = val_parts[0].replace(regexp, '$1' + ',' + '$2');

				val = val_parts.join('.');
			}

			Objeto.setValue(val);
		},
		_getSharepoint: function (sNumPedido) {
			that = this;
			try {
				var oResp = { "sEstado": "E", "oResults": [] };
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = '/sites/' + that.routeSharepoint +
							'/drives/b!ger65VR1VEerCnoWFakAb89AZ_k_jwVIsfwaCoe_SuOrBelpHdYGQKelpn4cbbDm';
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/SharePointAris/sites/' + that.routeSharepoint +
							'/drives/b!ger65VR1VEerCnoWFakAb89AZ_k_jwVIsfwaCoe_SuOrBelpHdYGQKelpn4cbbDm';
						sUrl = sPath;
					}
					Services.getSharepointSync(sUrl, function (result) {
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
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		_mapGraphItemToDocumento: function (it) {
			const isFile = !!it.file;
			const sWebUrl = it.webUrl || "";
			const sDownloadUrl = it["@microsoft.graph.downloadUrl"] || "";

			return {
				fileName: it.name || "",
				mimeType: (it.file && it.file.mimeType) ? it.file.mimeType : "",
				fileSize: it.size || 0,
				url: sWebUrl || sDownloadUrl || "",
				previewUrl: "",

				// control:
				uploaded: true,
				fileObject: null,
				originalFileName: it.name || "",
				spId: it.id || "",
				spLastModified: it.lastModifiedDateTime || "",
				spIsFile: isFile
			};
		},
		_getSharePointPreviewUrlByItemId: function (sItemId) {
			const that = this;

			return new Promise(function (resolve, reject) {
				const id = String(sItemId || "").trim();
				if (!id) return resolve("");

				let sUrl = "";
				if (that.local) {
					sUrl = that.getOwnerComponent()
						.getManifestObject()
						.resolveUri(`/sites/${that.routeSharepoint}/drives/${that.driveId}/items/${id}/preview`);
				} else {
					sUrl = jQuery.sap.getModulePath(that.route) +
						`/SharePointAris/drives/${that.driveId}/items/${id}/preview`;
				}
				jQuery.ajax({
					url: sUrl,
					method: "POST",
					contentType: "application/json",
					data: JSON.stringify({}),
					success: function (data) {
						const sPreview = (data && (data.getUrl || data.previewUrl)) ? (data.getUrl || data.previewUrl) : "";
						resolve(String(sPreview || ""));
					},
					error: function (xhr) {
						reject(xhr);
					}
				});
			});
		},
		_getSharePointChildrenByFolderChain: function (aFolderChain) {
			const that = this;
			return new Promise(function (resolve) {

				const baseFolderPath = "Repositorio Apps/SAP Hana/Pruebas BTP/Proveedores/EXTERIOR";
				let folderPath = baseFolderPath;

				if (Array.isArray(aFolderChain) && aFolderChain.length) {
					folderPath += "/" + aFolderChain.join("/");
				}

				const encodedFolderPath = encodeURIComponent(folderPath);

				let sUrl = "";
				const sQuery = "?$top=999" + "&$select=id,name,size,webUrl,file,folder,lastModifiedDateTime";

				if (that.local) {
					sUrl = that.getOwnerComponent()
						.getManifestObject()
						.resolveUri(`/sites/${that.routeSharepoint}/drives/${that.driveId}/root:/${encodedFolderPath}:/children${sQuery}`);
				} else {
					sUrl = jQuery.sap.getModulePath(that.route) +
						`/SharePointAris/drives/${that.driveId}/root:/${encodedFolderPath}:/children${sQuery}`;
				}

				Services.getSharepointChildrenSync(sUrl, function (result) {
					if (result && result.iCode === 1) {
						const data = result.data || {};
						const a = Array.isArray(data.value) ? data.value : [];
						resolve({ sEstado: "S", oResults: a });
					} else {
						resolve({ sEstado: "E", oResults: [], detail: result });
					}
				});

			});
		},
		_loadSharePointDocsByIdSap: async function (sIdSap) {
			const oMP = this.getModel("oModelProyect") || this.getOwnerComponent().getModel("oModelProyect");
			if (!oMP) return { sEstado: "E", oResults: [] };

			const id = String(sIdSap || "").trim();
			if (!id) return { sEstado: "E", oResults: [] };

			const sPathDocs = "/documentos";

			const aFolderChain = [`AF${id}`];

			let resp;
			try {
				resp = await this._getSharePointChildrenByFolderChain(aFolderChain);
			} catch (e) {

				return { sEstado: "E", oResults: [] };
			}

			const aItems = (resp && resp.sEstado === "S") ? (resp.oResults || []) : [];
			const aFiles = aItems.filter(it => !!it && !!it.file);

			const aRemoteDocs = aFiles.map(it => this._mapGraphItemToDocumento(it));
			const aCurr = (oMP.getProperty(sPathDocs) || []).slice();
			const norm = (v) => String(v || "").trim().toLowerCase();
			const mByName = Object.create(null);
			aRemoteDocs.forEach(d => {
				const k = norm(d?.fileName);
				if (k) mByName[k] = d;
			});
			aCurr.forEach(d => {
				const k = norm(d?.fileName);
				if (!k) return;
				if (d.uploaded === false) {
					if (!mByName[k]) mByName[k] = d;
					return;
				}
				if (!mByName[k]) mByName[k] = d;
			});
			const aFinal = Object.keys(mByName).map(k => mByName[k]);
			aFinal.sort((a, b) => String(a?.fileName || "").localeCompare(String(b?.fileName || "")));

			oMP.setProperty(sPathDocs, aFinal);
			if (typeof oMP.refresh === "function") oMP.refresh(true);
			if (typeof oMP.updateBindings === "function") oMP.updateBindings(true);

			return { sEstado: "S", oResults: aFinal };
		},
		_uploadSharepoint: function (file, onProgress, aFolderChain) {
			const that = this;
			return new Promise((resolve) => {
				const baseFolderPath = "Repositorio Apps/SAP Hana/Pruebas BTP/Proveedores/EXTERIOR";
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
						`/SharePointAris/drives/${that.driveId}/root:/${encodedPath}:/content`;
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
				const baseFolder = "Repositorio Apps/SAP Hana/Pruebas BTP/Proveedores/EXTERIOR";
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
							`/SharePointAris/drives/${that.driveId}/root:/${encodedParentPath}:/children`;
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

		//Llamadas reutilizables
		_getCabecera: function (sFiltro) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?$filter=" + sFiltro + "&$expand=toPurOrdItems&$format=json";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?$filter=" + sFiltro + "&$expand=toPurOrdItems&$format=json";
						sUrl = sPath;
					}

					if (that.isEmpty(sFiltro)) {
						oResp.oResults = [];
						resolve(oResp);
					} else {
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
		_getOrdenes: function (sFiltro) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?$filter=" + sFiltro + "&$expand=toPurOrdItems&$format=json";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?$filter=" + sFiltro + "&$expand=toPurOrdItems&$format=json";
						sUrl = sPath;
					}
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
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
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
		// para ingresar al detalle cuando ya existe factura
		_getFilterFactExt: function (sFiltro) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					const sRaw = String(sFiltro ?? "").trim();
					const bIsExpression = /\b(eq|ne|gt|ge|lt|le|and|or)\b/i.test(sRaw);
					const sPO = bIsExpression ? sRaw : sRaw.replace(/'/g, "''");
					const sFilterExpr = bIsExpression ? sPO : "PurchaseOrder eq '" + sPO + "'";

					if (that.local) {
						const sPath =
							"/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/INPUT_CONSULTAS_ORDCOMPRASSET" + "?$expand=ToConsultasOrdCompras,toCanPenFac" +
							"&$filter=" + encodeURIComponent(sFilterExpr) + "&$format=json";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath =
							jQuery.sap.getModulePath(that.route) +
							"/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/INPUT_CONSULTAS_ORDCOMPRASSET" + "?$expand=ToConsultasOrdCompras,toCanPenFac" +
							"&$filter=" + encodeURIComponent(sFilterExpr) + "&$format=json";
						sUrl = sPath;
					}

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

				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},

		//kestefo
		_getSuppliers: function () {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts&$format=json&sap-language=es-ES";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts&$format=json&sap-language=es-E';
						sUrl = sPath;
					}

					Services.getoDataERPSync(that, sUrl, function (result) {
						util.response.validateAjaxGetERPNotMessage(result, {
							success: function (oData, message) {
								oResp.sEstado = "S";
								oResp.oResults = oData.data.filter((value) => !that.isEmpty(value.TaxID1));
								resolve(oResp);
							},
							error: function (message) {
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
		_getSharepoint: function (sNumPedido) {
			that = this;
			try {
				var oResp = { "sEstado": "E", "oResults": [] };
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = '/sites/' + that.routeSharepoint +
							'/drives/b!ger65VR1VEerCnoWFakAb89AZ_k_jwVIsfwaCoe_SuOrBelpHdYGQKelpn4cbbDm';
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/SharePointAris/sites/' + that.routeSharepoint +
							'/drives/b!ger65VR1VEerCnoWFakAb89AZ_k_jwVIsfwaCoe_SuOrBelpHdYGQKelpn4cbbDm';
						sUrl = sPath;
					}
					Services.getSharepointSync(sUrl, function (result) {
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
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		_getConditionsDetail: function (oOrdenes) {
			that = this;
			try {
				var oResp = { "sEstado": "E", "oResults": [] };

				return new Promise(function (resolve) {
					let sUrl = "";

					const _esc = (v) => String(v ?? "").trim().replace(/'/g, "''");

					const aOrdenes = Array.isArray(oOrdenes)
						? oOrdenes.map(x => String(x ?? "").trim()).filter(Boolean)
						: String(oOrdenes ?? "").split(",").map(x => x.trim()).filter(Boolean);

					if (!aOrdenes.length) {
						resolve(oResp);
						return;
					}

					const sFilterOrders = aOrdenes
						.map(sDoc => "SalesDocument eq '" + _esc(sDoc) + "'")
						.join(" or ");

					const sFilter =
						"(" + sFilterOrders + ") and (" +
						"ConditionClass eq 'ZI03' or " +
						"ConditionClass eq 'ZI04' or " +
						"ConditionClass eq 'ZI05'" +
						")";

					if (that.local) {
						const sPath =
							"/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/POCondition?$filter=" +
							encodeURIComponent(sFilter) +
							"&$format=json";

						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath =
							jQuery.sap.getModulePath(that.route) +
							"/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/POCondition?$filter=" +
							encodeURIComponent(sFilter) +
							"&$format=json";

						sUrl = sPath;
					}

					Services.getoDataERPSync(that, sUrl, function (result) {
						util.response.validateAjaxGetERPNotMessage(result, {
							success: function (oData) {
								oResp.sEstado = "S";
								oResp.oResults = oData.data;
								resolve(oResp);
							},
							error: function () {
								oResp.oResults = [];
								resolve(oResp);
							}
						});
					});
				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
				return Promise.resolve({ "sEstado": "E", "oResults": [] });
			}
		},
		_getStatusOrder: function (sFiltro) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Status?$format=json";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Status?$format=json";
						sUrl = sPath;
					}
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

				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		_getClaseDocumento: function (sFiltro) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ClaDoc?$format=json&$filter=DocumentClass eq '91'";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ClaDoc?$format=json&$filter=DocumentClass eq '91'";
						sUrl = sPath;
					}
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

				});
			} catch (oError) {
				that.getMessageBox("error", that.getI18nText("sErrorTry"));
			}
		},
		// Datos Directos
		//Hsoler
		_getCountriesEmb: function () {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				const oJson = models.JsonPaiseEmb(that);
				oResp.oResults = (oJson && oJson.d && oJson.d.results) ? oJson.d.results : [];

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},
		_getPuertoEmb: function () {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				const oJson = models.JsonPuertosEmb(that);
				oResp.oResults = (oJson && oJson.d && oJson.d.results) ? oJson.d.results : [];

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},
		_getTipoBulto: function (sFiltro) {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				oResp.oResults = [
					{ Vegr2: "", Bezei: "--Seleccionar--" },
					{ Vegr2: "1", Bezei: "Paletas" },
					{ Vegr2: "2", Bezei: "Sacos" },
					{ Vegr2: "3", Bezei: "Bidones" },
					{ Vegr2: "4", Bezei: "Cajas" },
					{ Vegr2: "5", Bezei: "IBC" },
					{ Vegr2: "6", Bezei: "Fardos" },
					{ Vegr2: "7", Bezei: "Tubos" },
					{ Vegr2: "8", Bezei: "Paquetes" },
					{ Vegr2: "9", Bezei: "Piezas" },
					{ Vegr2: "10", Bezei: "Bultos" }
				];

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},

		_getTipoContenido: function (sFiltro) {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				oResp.oResults = [
					{ Vegr2: "", Bezei: "--Seleccionar--" },
					{ Vegr2: "ZBRE00", Bezei: "Break bulk" },
					{ Vegr2: "ZGRA20", Bezei: "Granel20" },
					{ Vegr2: "ZHC040", Bezei: "40HC" },
					{ Vegr2: "ZLCL00", Bezei: "LCL" },
					{ Vegr2: "ZREF40", Bezei: "40REEFER" },
					{ Vegr2: "ZST020", Bezei: "20ST" },
					{ Vegr2: "ZST040", Bezei: "40ST" }
				];

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},

		_getModalidad: function (sFiltro) {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				oResp.oResults = [
					{ sKey: "Maritimo", sText: "Marítimo" },
					{ sKey: "Aereo", sText: "Aéreo" },
					{ sKey: "Courier", sText: "Courier" },
					{ sKey: "Terrestre", sText: "Terrestre" },
					{ sKey: "Multimodal", sText: "Multimodal" }
				];

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},
		_getTipoEmision: function (sFiltro) {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				oResp.oResults = [
					{ sKey: "1", sText: "Emisión Origen" },
					{ sKey: "2", sText: "Emisión Destino" },
					{ sKey: "3", sText: "Emisión SWB/TELEX" },
					{ sKey: "4", sText: "No aplica" }
				];

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},
		_getAdjuntarDatos: function (sFiltro) {
			const that = this;
			try {
				const oResp = { sEstado: "S", oResults: [] };

				oResp.oResults = [
					{ sKey: "1", sText: "Factura Comercial 1" },
					{ sKey: "6", sText: "Nota de Crédito 1" },
					{ sKey: "9", sText: "Packing List 1" },
					{ sKey: "14", sText: "Traducción de Facturas" },
					{ sKey: "15", sText: "Facturas de Muestras" },
					{ sKey: "16", sText: "Seguro" },
					{ sKey: "17", sText: "Documento de Embarque" },
					{ sKey: "18", sText: "Certificado de Origen" },
					{ sKey: "19", sText: "Certificado de Análisis" },
					{ sKey: "20", sText: "Certificado de Calidad" },
					{ sKey: "21", sText: "MSDS" },
					{ sKey: "22", sText: "Ficha Técnica" },
					{ sKey: "23", sText: "Permiso de Exportación" },
					{ sKey: "24", sText: "Otros" },
					{ sKey: "35", sText: "Permiso de Exportación" }
				].map(o => ({
					...o,
					nKey: parseInt(o.sKey, 10) || 0
				}));

				// Orden numérico ascendente por código
				oResp.oResults.sort((a, b) => a.nKey - b.nKey);

				return Promise.resolve(oResp);
			} catch (e) {
				console.error(e);
				return Promise.resolve({ sEstado: "E", oResults: [] });
			}
		},
		_getCurrentLanguageKey: function () {
			let sLang = "";

			try {
				const oComp = this.getOwnerComponent && this.getOwnerComponent();
				const oView = this.getView && this.getView();

				const oMP =
					(oComp && oComp.getModel("oModelProyect")) ||
					(oView && oView.getModel("oModelProyect"));

				sLang = oMP ? String(oMP.getProperty("/sIdioma") || "").trim() : "";
			} catch (e) {
				sLang = "";
			}

			if (!sLang) {
				try {
					sLang = String(window.localStorage.getItem("factExtLang") || "").trim();
				} catch (e) {
					sLang = "";
				}
			}

			return sLang === "ing" ? "ing" : "esp";
		},

		_setLanguageModel: function (langKey) {
			langKey = langKey === "ing" ? "ing" : "esp";

			const sSapLanguage = langKey === "ing" ? "en" : "es";
			let bundleName = "";

			if (langKey === "esp") {
				bundleName = "com.aris.proveedores.facturaexterior.pe.i18n.i18n_esp";
			} else {
				bundleName = "com.aris.proveedores.facturaexterior.pe.i18n.i18n_ing";
			}

			// Importante: esto traduce textos estándar de SAPUI5,
			// por ejemplo los botones internos del FilterBar: Go/Clear/Adapt Filters.
			try {
				const oConfig = sap.ui.getCore().getConfiguration();
				if (oConfig && oConfig.setLanguage) {
					oConfig.setLanguage(sSapLanguage);
				}
			} catch (e) {
				// No bloquea si la versión de UI5 no soporta setLanguage aquí.
			}

			try {
				sap.ui.require(["sap/base/i18n/Localization"], function (Localization) {
					if (Localization && Localization.setLanguage) {
						Localization.setLanguage(sSapLanguage);
					}
				});
			} catch (e) {
				// Compatibilidad con versiones UI5 donde Localization no esté disponible.
			}

			const oI18nModel = new ResourceModel({
				bundleName: bundleName
			});

			const oComp = this.getOwnerComponent && this.getOwnerComponent();
			const oView = this.getView && this.getView();

			if (oComp) {
				oComp.setModel(oI18nModel, "i18n");
			}

			if (oView) {
				oView.setModel(oI18nModel, "i18n");
			}

			const oMP =
				(oComp && oComp.getModel("oModelProyect")) ||
				(oView && oView.getModel("oModelProyect"));

			if (oMP) {
				oMP.setProperty("/sIdioma", langKey);
			}

			try {
				window.localStorage.setItem("factExtLang", langKey);
			} catch (e) {
				// No bloquea si el navegador no permite localStorage.
			}

			setTimeout(() => {
				if (typeof this._refreshFilterBarStandardButtons === "function") {
					this._refreshFilterBarStandardButtons();
				}

				if (oView && oView.invalidate) {
					oView.invalidate();
				}
			}, 0);

			return oI18nModel;
		},

		_getTextSafe: function (sKey, sDefault) {
			try {
				const sText = this.getI18nText(sKey);
				return (sText && sText !== sKey) ? sText : (sDefault || "");
			} catch (e) {
				return sDefault || "";
			}
		},

		_getStatusDescription: function (vStatus, bDetail) {
			const _normStatus = function (v) {
				const s = String(v ?? "").trim();
				if (!s) return "";
				return s.length === 1 ? s.padStart(2, "0") : s;
			};

			const sKey = _normStatus(vStatus);

			const mI18n = {
				"00": bDetail ? "status00Detail" : "status00",
				"01": "status01",
				"02": "status02",
				"03": "status03",
				"04": "status04"
			};

			if (mI18n[sKey]) {
				const sText = this._getTextSafe(mI18n[sKey], "");
				if (sText) {
					return sText;
				}
			}

			return sKey || "";
		},

		_refreshFilterBarStandardButtons: function () {
			const oFilterBar = this.byId ? this.byId("idFilterBar") : null;

			if (!oFilterBar || !oFilterBar.findAggregatedObjects) {
				return;
			}

			const sGo = this._getTextSafe("filterBarGo", "Ir");
			const sClear = this._getTextSafe("filterBarClear", "Borrar");
			const sAdapt = this._getTextSafe("filterBarAdaptFilters", "Adaptar filtros");

			const fnNormalize = function (sValue) {
				return String(sValue || "")
					.trim()
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.toLowerCase();
			};

			const aButtons = oFilterBar.findAggregatedObjects(true, function (oControl) {
				return oControl && oControl.isA && oControl.isA("sap.m.Button");
			});

			aButtons.forEach(function (oButton) {
				const sText = fnNormalize(oButton.getText && oButton.getText());

				if (["ir", "go"].includes(sText)) {
					oButton.setText(sGo);
					return;
				}

				if (["borrar", "clear"].includes(sText)) {
					oButton.setText(sClear);
					return;
				}

				if (["adaptar filtros", "adapt filters"].includes(sText)) {
					oButton.setText(sAdapt);
				}
			});

			if (oFilterBar.invalidate) {
				oFilterBar.invalidate();
			}
		},


		_onClearComponentGlobal: function (sState, oComponent, bOtherComponent) {
			if (!this.isEmpty(oComponent)) {
				if (sState === that.getI18nText("sStateInit")) {
					let oValidaterContent = that._validatorComponent(oComponent);
					if (oValidaterContent.bValidate) {
						if (oValidaterContent.sCode === "HVBox") {
							oComponent.getItems().forEach(function (value) {
								if (that._validatorComponent(value).bValidate) { that._onClearComponentGlobal(that.getI18nText("sStateMiddle"), value.getItems(), false); }
								else { that._clearComponent(value); }
							});
						} else if (oValidaterContent.sCode === "FilterBar") {
							oComponent.getAllFilterItems().forEach(function (value) {
								if (that._validatorComponent(value.getControl()).bValidate) { that._onClearComponentGlobal(that.getI18nText("sStateMiddle"), value.getControl(), false); }
								else { that._clearComponent(value.getControl()); }
							});
						}
					} else { that._clearComponent(value); }
				} else if (sState === that.getI18nText("sStateMiddle")) {
					oComponent.forEach(function (value) {
						if (that._validatorComponent(value).bValidate) { that._onClearComponentGlobal(that.getI18nText("sStateMiddle"), value.getItems(), false); }
						else { that._clearComponent(value); }
					});
				}
			}
		},
		_onClearDataGlobal: function () {
			that.getModel("oModelProyect").setProperty("/", models.createModelProyect(that));
		},

		liveChangeNumeroFacturaOnlyDigits: function (oEvent) {
			const oSrc = oEvent.getSource();
			let v = (oSrc.getValue() || "");

			// solo dígitos
			v = v.replace(/\D/g, "");

			// máximo 8
			if (v.length > 8) v = v.slice(0, 8);

			oSrc.setValue(v);
		},

		onChangeNumeroFacturaPad8: function (oEvent) {
			const oSrc = oEvent.getSource();
			let v = (oSrc.getValue() || "").replace(/\D/g, "");

			if (!v) {
				oSrc.setValue("");
				return;
			}

			// padding a 8
			//v = this.zfill(parseInt(v, 10), 8);
			oSrc.setValue(v);

			// asegura que el modelo se sincronice
			const oCtx = oSrc.getBinding("value");
			if (oCtx && oCtx.getModel && oCtx.getPath) {
				oCtx.getModel().setProperty(oCtx.getPath(), v);
			}
		},
		liveChangeNumeroFacturaAlphaNum: function (oEvent) {
			const oSrc = oEvent.getSource();
			let v = (oSrc.getValue() || "");

			// solo alfanumérico
			v = v.replace(/[^a-zA-Z0-9]/g, "");

			// opcional: llevar a mayúsculas para estandarizar
			v = v.toUpperCase();

			// máximo 8
			if (v.length > 8) {
				v = v.slice(0, 8);
			}

			oSrc.setValue(v);

			// sincroniza modelo
			const oBinding = oSrc.getBinding("value");
			if (oBinding && oBinding.getModel && oBinding.getPath) {
				oBinding.getModel().setProperty(oBinding.getPath(), v);
			}
		},

		onChangeNumeroFacturaPad8: function (oEvent) {
			const oSrc = oEvent.getSource();
			let v = (oSrc.getValue() || "");

			// solo alfanumérico
			v = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

			if (!v) {
				oSrc.setValue("");
				return;
			}

			// máximo 8
			if (v.length > 8) {
				v = v.slice(0, 8);
			}

			// padding a la izquierda hasta 8 caracteres
			v = v.padStart(8, "0");

			oSrc.setValue(v);

			// asegura sincronización con modelo
			const oBinding = oSrc.getBinding("value");
			if (oBinding && oBinding.getModel && oBinding.getPath) {
				oBinding.getModel().setProperty(oBinding.getPath(), v);
			}
		},
		liveChangeNumeroFacturaMax25: function (oEvent) {
			const oSrc = oEvent.getSource();
			let v = oSrc.getValue() || "";

			// Solo limitar longitud, sin eliminar caracteres especiales
			if (v.length > 25) {
				v = v.slice(0, 25);
			}

			oSrc.setValue(v);

			const oBinding = oSrc.getBinding("value");
			if (oBinding && oBinding.getModel && oBinding.getPath) {
				oBinding.getModel().setProperty(oBinding.getPath(), v);
			}
		},


	});

});