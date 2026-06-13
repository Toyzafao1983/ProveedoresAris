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
	"com/aris/proveedores/pe/pedidocompra/services/ServiceOdata",
	"com/aris/proveedores/pe/pedidocompra/model/models",
	"com/aris/proveedores/pe/pedidocompra/model/formatter",
	"com/aris/proveedores/pe/pedidocompra/services/Services",
	"com/aris/proveedores/pe/pedidocompra/util/util",
	"sap/ui/core/format/NumberFormat",
	"sap/base/i18n/Localization",
	"sap/ui/model/resource/ResourceModel"
], function (Controller, History, UIComponent, MessageBox, MessageToast, Fragment, BusyIndicator, JSONModel,
	Filter, FilterOperator, Spreadsheet, Token, ServiceOdata, models, Formatter, Services, util, NumberFormat, Localization, ResourceModel) {
	"use strict";
	var that;
	var sMessage = "";
	var that;
	return Controller.extend("com.aris.proveedores.pe.pedidocompra.controller.BaseController", {
		formatter: Formatter,
		local: window.location.href.indexOf('launchpad') == -1 ? true : false,
		localModel: true,
		AdminUser: true,
		userSet: "kestefo@ravaconsulting.com.pe",
		route: "com.aris.proveedores.pe.pedidocompra",
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

			// Regla estándar proveedores:
			// customAttribute4 con BP => usuario externo / proveedor.
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

				// BP externo solo desde customAttribute4.
				sExtBP: bIsExtAyc ? sAttribute4 : "",

				// Código interno Aris solo desde customAttribute5.
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

				// Compatibilidad con la lógica actual de esta app.
				// /bRol y /bAdmin true => usuario interno.
				oModelUser.setProperty("/bRol", oProfile.bIsInterno);
				oModelUser.setProperty("/bAdmin", oProfile.bIsInterno);

				// Alias comunes usados en otros proyectos.
				oModelUser.setProperty("/bEsInterno", oProfile.bIsInterno);
				oModelUser.setProperty("/bEsExterno", oProfile.bIsExtAyc);
				oModelUser.setProperty("/bIsInterno", oProfile.bIsInterno);
				oModelUser.setProperty("/bIsExtAyc", oProfile.bIsExtAyc);

				oModelUser.setProperty("/sRol", oProfile.sRolPrincipal);
				oModelUser.setProperty("/sRolPrincipal", oProfile.sRolPrincipal);
				oModelUser.setProperty("/sExtBP", oProfile.sExtBP);
				oModelUser.setProperty("/sInternalBP", oProfile.sInternalBP);

				// Compatibilidad con esta app.
				oModelUser.setProperty("/sNumProv", oProfile.sExtBP);
				oModelUser.setProperty("/_loaded", true);
			}

			return oProfile;
		},

		_ensureProveedorUserProfile: function () {
			const oModelUser = this.getOwnerComponent().getModel("oModelUser");

			if (oModelUser && oModelUser.getProperty("/_loaded")) {
				return Promise.resolve({
					bIsInterno: !!oModelUser.getProperty("/bIsInterno"),
					bIsExtAyc: !!oModelUser.getProperty("/bIsExtAyc"),
					sExtBP: String(oModelUser.getProperty("/sExtBP") || "").trim(),
					sInternalBP: String(oModelUser.getProperty("/sInternalBP") || "").trim(),
					sRolPrincipal: String(oModelUser.getProperty("/sRolPrincipal") || "").trim()
				});
			}

			return this._getUsers().then(function (oResp) {
				const oUser = oResp?.Resources?.[0] || {};
				return this._applyProveedorUserProfile(oUser);
			}.bind(this));
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
		fnExportarExcel: function (oData1, oData2, oData3, sAuthor, sIndicador) {
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
			var dDate = new Date();
			var sGetTime = dDate.getTime().toString();
			if (sIndicador == "ReporteMain") {
				aCols = this.createColumnConfig();
				var sTitleExcel = this.getI18nText("sTitleExport1") + '-' + sGetTime + '.xlsx';
			}
			else {
				aCols = this.createColumnConfigDetalle();
				var sTitleExcel = this.getI18nText("sTitleExport2") + '-' + sGetTime + '.xlsx';
			}
			var sTitleDocument = ""
			if (this.isEmpty(sAuthor)) {
				sTitleDocument = "";
			} else {
				sTitleDocument = sAuthor;
			}

			oSettings = {
				workbook: {
					context: {
						title: sTitleDocument,
						modifiedBy: sAuthor
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
					label: this.getI18nText("titleProveedor"),
					property: 'Bpname',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titlePedidoCompra"),
					property: 'Ebeln',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleFechPedido"),
					property: 'Fecpedido',
					width: '15'
				},
				{
					label: this.getI18nText("titleEstado"),
					property: 'Status',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleFactuacion"),
					property: 'Facturation',
					width: '15'
				},
				{
					label: this.getI18nText("titleImportPedCompra"),
					property: 'Immecom',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleMoneda"),
					property: 'Waers',
					width: '15'
				},
				{
					label: this.getI18nText("titleImportEntregado"),
					property: 'Iment',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleImportFacturado"),
					property: 'Imfac',
					width: '15'
				},
				{
					label: this.getI18nText("titleCondPago"),
					property: 'Conpag',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleIncoterm"),
					property: 'Inco1',
					width: '15'
				},
				{
					label: this.getI18nText("titleModalidad"),
					property: 'Modalidad',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("titleFechEntrega"),
					property: 'Fecentrega',
					width: '15'
				}

			];
		},
		createColumnConfigDetalle: function () {
			return [
				{
					label: this.getI18nText("TextDetailNumSolPed"),
					property: 'Ebelp',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("TextDetailMaterial"),
					property: 'Material',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("TextDetailDesComp"),
					property: 'Description',
					width: '15'
				},
				{
					label: this.getI18nText("TextDetailOrderQua"),
					property: 'Orderquantity',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("TextDetailQuaDeli"),
					property: 'QuantityDelivered',
					width: '15'
				},
				{
					label: this.getI18nText("TextDetailOutAmon"),
					property: 'Pendingamount',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("TextDetailUM"),
					property: 'Um',
					width: '15'
				},
				{
					label: this.getI18nText("TextDetailUnitPrice"),
					property: 'Unitprice',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("TextDetailCurrency"),
					property: 'Currency',
					width: '15'
				},
				{
					label: this.getI18nText("TextDetailSubTot"),
					property: 'Subtotal',
					width: '20',
					type: 'String'
				},
				{
					label: this.getI18nText("TextDetailLastDateAdmin"),
					property: 'Lastdateadmission',
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

		//Llamadas reutilizables
		_getEstado: function (context) {
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
					if (that.localModel) { resolve(models.JsonEstado(context)); }
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
		_getPedidoDetalle: function (sNumPedido) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = '/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/S4HANA/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = sPath;
					}
					if (that.localModel) { resolve(models.JsonDetalle()); }
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
		_getListCotiSegui: function (sNumPedido) {
			that = this;
			try {
				var oResp = {
					"sEstado": "E",
					"oResults": []
				};
				return new Promise(function (resolve, reject) {
					let sUrl = "";
					if (that.local) {
						const sPath = '/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) + '/S4HANA/sap/opu/odata/sap/ZODATA_PM_SOLICIT_MAQ_Z4_SRV/EtResponsableSet?sap-language=es-ES' + sNumPedido;
						sUrl = sPath;
					}
					if (that.localModel) { resolve(models.JsonDetSeguimiento()); }
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
			var sUi5Lang = langKey === "ing" ? "en" : "es";

			if (langKey === "esp") {
				bundleName = "com.aris.proveedores.pe.pedidocompra.i18n.i18n_esp";
			} else if (langKey === "ing") {
				bundleName = "com.aris.proveedores.pe.pedidocompra.i18n.i18n_ing";
			} else {
				console.warn("Idioma no soportado:", langKey);
				return;
			}

			// Cambia el locale global de SAPUI5
			sap.ui.getCore().getConfiguration().setLanguage(sUi5Lang);

			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleName: bundleName
			});

			// 1) dejarlo en el componente si existe
			var oOwner = this.getOwnerComponent && this.getOwnerComponent();
			if (oOwner) {
				oOwner.setModel(i18nModel, "i18n");
			}

			// 2) dejarlo también en la vista actual para no romper getI18nText/getModel
			var oView = this.getView && this.getView();
			if (oView) {
				oView.setModel(i18nModel, "i18n");
			}

			// 3) persistir idioma
			var oProj = this.getModel && this.getModel("oModelProyect");
			if (oProj) {
				oProj.setProperty("/sIdioma", langKey);
			}

			sap.ui.getCore().applyChanges();
		},

		ChangeMultiImput: function (oEvent) {
			var oSource = oEvent.getSource(),
				oItems = oSource.getSelectedItems(),
				sCustom = oSource.data("custom"),
				sCustomParameter = sCustom.split("/")[0],
				sTextParameter = sCustom.split("/")[1],
				oKey = [],
				oText = [];
			//sObject = oSource.getSelectedItem().getBindingContext("oModelData").getObject();

			if (oItems == 0) {
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, "");
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", "");
			} else {
				oItems.forEach(function (value) {
					oKey.push(value.getKey());
					oText.push(value.getText());
				});

				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter, oKey);
				this.getView().getModel("oModelProyect").setProperty("/Main/filter/" + sCustomParameter + "Text", oText);
			}
		},

		_getProvRUC: function (context) {
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
					if (that.localModel) { resolve(models.JsonProvRUC(context)); }
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
		_getProv: function (context) {
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
					if (that.localModel) { resolve(models.JsonProv(context)); }
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
		_getModalidad: function (context) {
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
					if (that.localModel) { resolve(models.JsonMod(context)); }
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
		_getFacturacion: function (sTargetPath) {
			that = this;
			return new Promise(function (resolve, reject) {
				let oResp = models.JsonFacturacion(that);
				let results = oResp.d.results || [];
				let aResults = results.map(item => ({
					StateKey: item.sKey,
					Display: item.sText
				}));
				that.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
				resolve({ sEstado: "S", oResults: aResults });
			});
		},
		_getState: function (sTargetPath) {
			that = this;
			return new Promise(function (resolve, reject) {
				let oResp = models.JsonState(that);
				let results = oResp.d.results || [];

				let aResults = results.map(item => ({
					StateKey: item.sKey,
					Display: item.sText
				}));

				that.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
				resolve({ sEstado: "S", oResults: aResults });
			});
		},
		_getIntercom: function (sTargetPath) {
			that = this;
			return new Promise(function (resolve, reject) {
				let oResp = models.JsonIntercom();
				let results = oResp.d.results || [];
				let aResults = results.map(item => ({
					StateKey: item.sKey,
					Display: item.sText
				}));
				that.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
				resolve({ sEstado: "S", oResults: aResults });
			});
		},
		_getModalidad: function (sTargetPath) {
			that = this;
			return new Promise(function (resolve, reject) {
				let oResp = models.JsonModalidad(that);
				let results = oResp.d.results || [];
				let aResults = results.map(item => ({
					StateKey: item.sKey,
					Display: item.sText
				}));
				that.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
				resolve({ sEstado: "S", oResults: aResults });
			});
		},
		formatDate: function (vDate) {
			if (!vDate) return "";

			let oDate = null;

			// Si viene como string tipo ABAP /Date(…)/ → conviértelo
			if (typeof vDate === "string") {
				let ms = parseInt(vDate.replace(/[^0-9]/g, ""), 10);
				if (!isNaN(ms)) {
					let tmp = new Date(ms);
					// ✅ Reconstruir como fecha "pura" sin hora
					oDate = new Date(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate());
				}
			}

			// Si ya es un Date válido
			if (vDate instanceof Date) {
				oDate = new Date(vDate.getFullYear(), vDate.getMonth(), vDate.getDate());
			}

			if (!oDate) return "";

			// Formatear en horario Perú (pero ya sin desfase)
			let oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd-MM-yyyy",
				UTC: true   // 👈 importante: evita el corrimiento
			});

			return oDateFormat.format(oDate);
		},

		formatODataDate: function (oDate) {
			if (!(oDate instanceof Date)) return null;
			let oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd'T'HH:mm:ss",
				timeZone: "America/Lima"            // Forzamos UTC para OData
			});

			return "datetime'" + oDateFormat.format(oDate) + "'";
		},
		formatNumber: function (value) {
			if (value === null || value === undefined || value === "") {
				return "";
			}
			let num = Number(value);
			if (isNaN(num)) {
				return value;
			}

			// Usa NumberFormat de SAPUI5
			const oNumberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				minFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ",",
				decimalSeparator: "."
			});
			return oNumberFormat.format(num);
		},
		_getRucProveedor: function (sBpOrRuc) {
			that = this;
			try {
				var oResp = {
					sEstado: "E",
					oResults: []
				};

				return new Promise(function (resolve) {
					let sUrl = "";

					if (that.local) {
						const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" +
							"?$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts" +
							"&$filter=SupplierCode eq '" + sBpOrRuc + "'" +
							"&$format=json&sap-ui-language=ES";
						sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
					} else {
						const sPath = jQuery.sap.getModulePath(that.route) +
							"/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" +
							"?$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts" +
							"&$filter=SupplierCode eq '" + sBpOrRuc + "'" +
							"&$format=json&sap-ui-language=ES";
						sUrl = sPath;
					}

					Services.getoDataERPSync(that, sUrl, function (result) {
						util.response.validateAjaxGetERPNotMessage(result, {
							success: function (oData) {
								let aRaw = oData.data || [];

								aRaw.forEach(item => {
									item.TaxID = that.maskTaxId(item.TaxID1, item.TaxID2);

									const aEmails = item.to_Emails && item.to_Emails.results
										? item.to_Emails.results
										: [];

									aEmails.sort((a, b) => {
										const vA = a.ValidFrom || "";
										const vB = b.ValidFrom || "";

										if (vA !== vB) {
											return vB.localeCompare(vA);
										}

										return ((a.Email || "").toUpperCase())
											.localeCompare((b.Email || "").toUpperCase());
									});

									const oPrincipal = aEmails[0];
									item.MainEmail = oPrincipal ? oPrincipal.Email : "";
								});

								const aBest = that._dedupeSuppliersByBP(aRaw);

								oResp.sEstado = "S";
								oResp.oResults = aBest;
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
		maskTaxId: function (taxid1, taxid2) {
			let taxid = taxid1;

			if (!taxid || String(taxid).trim() === "") {
				taxid = taxid2;
			}

			return String(taxid || "").trim();
		},
		_dedupeSuppliersByBP: function (aData) {
			const m = new Map();

			(aData || []).forEach(item => {
				const key = item.SupplierCode || item.BusinessPartner || item.Supplier || "";
				if (!key) {
					m.set(Symbol(), item);
					return;
				}

				if (!m.has(key)) {
					m.set(key, item);
					return;
				}
				const cur = m.get(key);
				const keep = (this._scoreSupplier(item) > this._scoreSupplier(cur)) ? item : cur;
				m.set(key, keep);
			});

			return Array.from(m.values());
		},

		_applyLanguage: function (langKey) {
			this._setLanguageModel(langKey);

			var oDataModel = this.getView() && this.getView().getModel("oModelData");
			if (oDataModel) {
				this._getState("/oFiltroState");
				this._getFacturacion("/oFiltroFacturacion");
				this._getIntercom("/oFiltroIntercom");
				this._getModalidad("/oFiltroModalidad");
				this._GetFiltroCondPago("/oFiltroCondPago");
			}

			this._refreshReportTranslations();

			if (this.getView()) {
				this.getView().invalidate();
			}
			sap.ui.getCore().applyChanges();
		},
		_GetFiltroCondPago: function (sTargetPath) {
			that = this;
			return new Promise(function (resolve) {
				let oResp = models.JsonCondPago(that);
				let results = oResp.d.results || [];

				let aResults = results.map(item => ({
					Conpag: item.sKey,
					Display: item.sText
				}));

				that.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
				resolve({ sEstado: "S", oResults: aResults });
			});
		},
		_translateStaticValue: function (sType, sValue) {
			const v = String(sValue || "").trim();

			const mMaps = {
				status: {
					"Pendiente de atención": this.getI18nText("TxtEstado1"),
					"Entregado parcialmente": this.getI18nText("TxtEstado2"),
					"Entregado completamente": this.getI18nText("TxtEstado3")
				},
				facturation: {
					"Entregas pendientes de facturación": this.getI18nText("TxtFact1"),
					"Entregas facturadas": this.getI18nText("TxtFact2")
				},
				modalidad: {
					"Aéreo": this.getI18nText("TxtMod1"),
					"Marítimo": this.getI18nText("TxtMod2"),
					"Multimodal": this.getI18nText("TxtMod3")
				},
				conpag: {
					"Factura 7 días": this.getI18nText("TxtCondPago1"),
					"Anticipo y 30 días de BL": this.getI18nText("TxtCondPago2"),
					"Factura 30 días": this.getI18nText("TxtCondPago3"),
					"BL 45 días": this.getI18nText("TxtCondPago4"),
					"Anticipo": this.getI18nText("TxtCondPago5"),
					"Anticipo y factura a 30 días": this.getI18nText("TxtCondPago6"),
					"BL 180 días": this.getI18nText("TxtCondPago7"),
					"BL 90 días": this.getI18nText("TxtCondPago8"),
					"Factura 60 días": this.getI18nText("TxtCondPago9"),
					"C.A.D. (Contra entrega de documentos)": this.getI18nText("TxtCondPago10"),
					"Aviso de mercadería lista": this.getI18nText("TxtCondPago11"),
					"BL 60 días": this.getI18nText("TxtCondPago12"),
					"BL 150 días": this.getI18nText("TxtCondPago13"),
					"Anticipo y aviso de mercadería lista": this.getI18nText("TxtCondPago14"),
					"Anticipo y CAD": this.getI18nText("TxtCondPago15"),
					"Factura 45 días": this.getI18nText("TxtCondPago16"),
					"Anticipo y 60 días de BL": this.getI18nText("TxtCondPago17"),
					"BL 120 días": this.getI18nText("TxtCondPago18"),
					"Anticipo y factura a 7 días": this.getI18nText("TxtCondPago19"),
					"Factura 90 días": this.getI18nText("TxtCondPago20"),
					"Factura 120 días": this.getI18nText("TxtCondPago21")
				}
			};

			return (mMaps[sType] && mMaps[sType][v]) ? mMaps[sType][v] : v;
		},
		_refreshReportTranslations: function () {
			const oProj = this.getModel("oModelProyect");
			const aRows = oProj.getProperty("/oReporte") || [];

			const aUpdated = aRows.map(item => ({
				...item,
				StatusDisplay: this._translateStaticValue("status", item.Status),
				FacturationDisplay: this._translateStaticValue("facturation", item.Facturation),
				ConpagDisplay: this._translateStaticValue("conpag", item.Conpag),
				ModalidadDisplay: this._translateStaticValue("modalidad", item.Modalidad)
			}));

			oProj.setProperty("/oReporte", aUpdated);
		},

	});

});