sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"../constantes",
	"./utilUI"
], function (JSONModel, History, MessageToast, constantes, utilUI) {
	"use strict";
	return {
		initModelView: function (controller) {
			controller.getView().setModel(new JSONModel({}));
		},
		leftNumberUndefined: function (valor) {
			if (!valor) {
				valor = "0";
			} else {
				valor = valor.toString();
			}
			return valor;
		},
		alignTextJsPDF: function (Doc, Value, CoordX, CoordY, WidthString, Align) {
			var doc = Doc;
			var coordX = CoordX;
			var coordY = CoordY;
			var widthString = WidthString;
			var paragraph = Value;
			var lines = doc.splitTextToSize(paragraph, widthString);
			var dim = doc.getTextDimensions('Text');
			var lineHeight = dim.h;
			var maximoWidth = 0;
			for (var l = 0; l < lines.length; l++) {
				if (doc.getTextWidth(lines[l]) > maximoWidth) {
					maximoWidth = doc.getTextWidth(lines[l]);
				}
			}
			for (var i = 0; i < lines.length; i++) {
				var lineTop = i == 0 ? coordY : ((lineHeight / 3.3) * (i)) + coordY;
				lines[i] = lines[i].toString().replace(/ /g, "|");
				while (doc.getTextWidth(lines[i]) < maximoWidth) {
					if (doc.getTextWidth(lines[i]) * 1.2 <= maximoWidth) {
						break;
					}
					if (!lines[i].toString().includes("|")) {
						lines[i] = lines[i].toString().replace(/ /g, "|");
					}
					lines[i] = lines[i].toString().replace("|", "  ");
				}
				while (lines[i].includes("|")) {
					lines[i] = lines[i].toString().replace("|", " ");
				}
				doc.text(lines[i], coordX, lineTop, {
					maxWidth: widthString,
					align: Align //justify,center,left,rihgt
				}); //see this line
			}
		},
		alignTextHtmlJsPDF: function (Doc, Value, CoordX, CoordY, WidthString, Align) {
			var doc = Doc;
			var coordX = CoordX;
			var coordY = CoordY;
			var widthString = WidthString;
			var paragraph = Value;
			var lines = doc.splitTextToSize(paragraph, widthString);
			var dim = doc.getTextDimensions('Text');
			var lineHeight = dim.h;
			var maximoWidth = 0;
			for (var l = 0; l < lines.length; l++) {
				if (doc.getTextWidth(lines[l]) > maximoWidth) {
					maximoWidth = doc.getTextWidth(lines[l]);
				}
			}
			for (var i = 0; i < lines.length; i++) {
				var lineTop = i == 0 ? coordY : ((lineHeight / 3.3) * (i)) + coordY;
				lines[i] = lines[i].toString().replace(/ /g, "|");
				while (doc.getTextWidth(lines[i]) < maximoWidth) {
					if (doc.getTextWidth(lines[i]) * 1.2 <= maximoWidth) {
						break;
					}
					if (!lines[i].toString().includes("|")) {
						lines[i] = lines[i].toString().replace(/ /g, "|");
					}
					lines[i] = lines[i].toString().replace("|", "  ");
				}
				while (lines[i].includes("|")) {
					lines[i] = lines[i].toString().replace("|", " ");
				}
				
				doc.fromHTML(lines[i], coordX, lineTop, {
					maxWidth: widthString,
					align: Align //justify,center,left,rihgt
				}); //see this line
				//doc.text(
			}
		},
		alignTextJsPDF2: function (Doc, Value, CoordX, CoordY, WidthString, Align) {
			var doc = Doc;
			var coordX = CoordX;
			var coordY = CoordY;
			var widthString = WidthString;
			var paragraph = Value;
			var lines = doc.splitTextToSize(paragraph, widthString);
			var dim = doc.getTextDimensions('Text');
			var lineHeight = dim.h;
			var maximoWidth = 0;
			for (var l = 0; l < lines.length; l++) {
				if (doc.getTextWidth(lines[l]) > maximoWidth) {
					maximoWidth = doc.getTextWidth(lines[l]);
				}
			}
			for (var i = 0; i < lines.length; i++) {
				var lineTop = i == 0 ? coordY : ((lineHeight / 2.1) * (i)) + coordY;
				lines[i] = lines[i].toString().replace(/ /g, "|");
				while (doc.getTextWidth(lines[i]) < maximoWidth) {
					if (doc.getTextWidth(lines[i]) * 1.2 <= maximoWidth) {
						break;
					}
					if (!lines[i].toString().includes("|")) {
						lines[i] = lines[i].toString().replace(/ /g, "|");
					}
					lines[i] = lines[i].toString().replace("|", "  ");
				}
				while (lines[i].includes("|")) {
					lines[i] = lines[i].toString().replace("|", " ");
				}
				doc.text(lines[i], coordX, lineTop, {
					maxWidth: widthString,
					align: Align //justify,center,left,rihgt
				}); //see this line
			}
		},
		valueUndefinedPDF: function (valor) {
			var newValor = valor;
			if (!valor) {
				newValor = "";
			}
			if (newValor.includes) {
				if (newValor.includes("XNA") || newValor.includes("NO APLICA")) {
					newValor = "";
				}
			}
			return newValor;
		},
		setPadString: function (self, model, nameCampo,tamanio, oEvent) {
			var object = oEvent.getSource().getBinding("value");
			var path = oEvent.getSource().getBinding("value").getPath();
			var value = oEvent.getSource().getValue();
			var modValue = value.split("");
			for (var i in modValue) {
				if (!modValue[i].includes("0")) {
					break;
				} else {
					modValue[i] = modValue[i].replace("0", "");
				}
			}
			var valor = modValue.join("");
			var valorPast = self.getView().getModel(model).getProperty(path + "Past");
			if (valor) {
				var valorPad = this.pad(valor, '0', tamanio);
				if (valorPast && valor && (valor.length == 0 || valor.length == tamanio+1) && valor.substring(0, 1) !== "0") {
					return self.getView().getModel(model).setProperty(path, valorPast);
				}
				self.getView().getModel(model).setProperty(path, valorPad);
				self.getView().getModel(model).setProperty(path + "Past", valorPad)
			}
		},
		setPadStringInTable: function (self, model, nameCampo,tamanio, oEvent) {
			var object = oEvent.getSource().getBindingContext(model).getObject();
			var path = oEvent.getSource().getBindingContext(model).getPath();
			var value = oEvent.getSource().getValue();
			var modValue = value.split("");
			for (var i in modValue) {
				if (!modValue[i].includes("0")) {
					break;
				} else {
					modValue[i] = modValue[i].replace("0", "");
				}
			}
			var valor = modValue.join("");
			var valorPast = self.getView().getModel(model).getProperty(path + "/" + nameCampo + "Past");
			if (valor) {
				var valorPad = this.pad(valor, '0', tamanio);
				if (valorPast && valor && (valor.length == 0 || valor.length == tamanio+1) && valor.substring(0, 1) !== "0") {
					return self.getView().getModel(model).setProperty(path + "/" + nameCampo, valorPast);
				}
				self.getView().getModel(model).setProperty(path + "/" + nameCampo, valorPad);
				self.getView().getModel(model).setProperty(path + "/" + nameCampo + "Past", valorPad)
			}
		},
		setPadNumber: function (self, model, nameCampo, oEvent) {
			var object = oEvent.getSource().getBindingContext(model).getObject();
			var path = oEvent.getSource().getBindingContext(model).getPath();
			var value = oEvent.getSource().getValue();
			var objParseInt = parseInt(value);
			if (!objParseInt) {
				return self.getView().getModel(model).setProperty(path + "/" + nameCampo, "");
			}
			var valor = value ? objParseInt.toString() : "";

			var valorPast = self.getView().getModel(model).getProperty(path + "/" + nameCampo + "Past");

			if (valor) {
				var valorPad = this.pad(valor, '0', 11);
				if (valorPast && valor && (valor.length == 0 || valor.length == 12) && valor.substring(0, 1) !== "0") {
					return self.getView().getModel(model).setProperty(path + "/" + nameCampo, valorPast);
				}
				self.getView().getModel(model).setProperty(path + "/" + nameCampo, valorPad);
				self.getView().getModel(model).setProperty(path + "/" + nameCampo + "Past", valorPad)
			}
		},
		setComboGeneral: function (self, nameModel, nameTable, campoKey, campoDescripcion, servDatos) {
			var model = self.getView().getModel(nameModel).getProperty("/" + nameTable);
			var modelSet = model ? model : [];
			var modDatos = servDatos;
			modDatos.Codigo = campoKey;
			if (campoDescripcion.includes("XNA")) {
				modDatos.Descripcion = "--NO APLICA--";
			} else {
				modDatos.Descripcion = campoDescripcion;
			}

			modelSet.push(modDatos);
			self.getView().getModel(nameModel).setProperty("/" + nameTable, modelSet);
			self.getView().getModel(nameModel).refresh(true);
		},
		listaToArbol: function (list) {
			var map = {};
			var node, roots = [];
			var i = 0;
			for (i = 0; i < list.length; i += 1) {
				map[list[i].id] = i; // initialize the map
				list[i].children = []; // initialize the children
			}
			for (i = 0; i < list.length; i += 1) {
				node = list[i];
				if (node.parentId !== "0") {
					// if you have dangling branches check that map[node.parentId] exists
					if (map[node.parentId]) {
						list[map[node.parentId]].children.push(node);
					} else {
						roots.push(node);
					}
				} else {
					roots.push(node);
				}
			}
			return roots;
		},
		uploadFile: function (oEvent, events) {
			var self = this;
			var fileUploader = oEvent.getSource();
			var domRef = fileUploader.getFocusDomRef();
			var file = domRef.files[0];
			var reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = function (ev) {
				var data = {};
				data.resultTotal = ev.target.result;
				data.resultado = data.resultTotal.split(',')[1];
				data.formato = data.resultTotal.split(',')[0];
				data.nombreArchivo = file.name.split('.').slice(0, -1).join('.');
				data.type = file.type;
				data.extension = file.type.split('/')[1];
				//fileUploader.setValue("");
				self.convertirImgToPDF(data.resultado, data.extension, data.formato,
					function (dataPdf) {
						events.uploadFileComplete(data, dataPdf);
					});
			};
		},
		convertirImgToPDF: function (SBase64File, extension, formato, callback) {
			formato = formato + ",";
			var dataPdf = {};
			if (!(extension == "pdf" || extension == "PDF")) {
				var doc = new jsPDF('p', 'pt', 'a4');
				var width = doc.internal.pageSize.width;
				var height = doc.internal.pageSize.height;
				var options = {
					pagesplit: true
				};
				var h1 = 50;
				var aspectwidth1 = (height - h1) * (9 / 16);
				doc.addImage(formato + SBase64File, extension, 10, h1, aspectwidth1, (height - h1), 'monkey');
				dataPdf.ruta = doc.output('datauri');
				dataPdf.extension = "application/pdf";
			}
			callback(dataPdf);
		},
		itemsSelectedTable: function (self, idTable, model, table, event) {
			var tabla = self.getView().byId(idTable);
			var itemsTabla = tabla.getSelectedIndices().length;
			var aItems = [];
			if (itemsTabla > 0) {
				for (var i = itemsTabla - 1; i >= 0; i--) {
					var item = tabla.getSelectedIndices()[i];
					var obj = self.getView().getModel(model).getProperty(table + "/" + item);
					aItems.push(obj);
					//self.removeSelection(idTable);
				}
				event.Seleccionados(aItems);
			} else {
				MessageToast.show('No ha seleccionado ningun item', {
					duration: 3000
				});
				return;
			}
		},
		removeDuplicates: function (originalArray) {
			var modoriginalArray = originalArray;
			var newArray = [];
			for (var i in modoriginalArray) {
				var filterArray = newArray.filter(function (el) {
					return el == modoriginalArray[i];
				});
				if (filterArray.length == 0) {
					newArray.push(modoriginalArray[i]);
				}
			}
			return newArray;
		},
		removeDuplicatesId: function (originalArray) {
			var modoriginalArray = originalArray;
			var newArray = [];
			for (var i in modoriginalArray) {
				var filterArray = newArray.filter(function (el) {
					return el.DTId == modoriginalArray[i].DTId;
				});
				if (filterArray.length == 0) {
					newArray.push(modoriginalArray[i]);
				}
			}
			return newArray;
		},
		removeDuplicatesIdFotos: function (originalArray) {
			var modoriginalArray = originalArray;
			var newArray = [];
			for (var i in modoriginalArray) {
				var filterArray = newArray.filter(function (el) {
					return el.DTId == modoriginalArray[i].DTId && 
						   el.Foto1 == modoriginalArray[i].Foto1 &&
						   el.Foto2 == modoriginalArray[i].Foto2 &&
						   el.Foto3 == modoriginalArray[i].Foto3 &&
						   el.Foto4 == modoriginalArray[i].Foto4;
				});
				if (filterArray.length == 0) {
					newArray.push(modoriginalArray[i]);
				}
			}
			return newArray;
		},
		removeDuplicatesGeneral: function (originalArray, campoFiltro) {
			var modoriginalArray = originalArray;
			var newArray = [];
			for (var i in modoriginalArray) {
				var filterArray = newArray.filter(function (el) {
					return el[campoFiltro] == modoriginalArray[i][campoFiltro];
				});
				if (filterArray.length == 0) {
					newArray.push(modoriginalArray[i]);
				}
			}
			return newArray;
		},
		/*removeDuplicates: function (originalArray) {
			var newArray = [];
			var lookupObject = {};

			for (var i in originalArray) {
				lookupObject[originalArray[i]] = originalArray[i];
			}

			for (i in lookupObject) {
				newArray.push(lookupObject[i]);
			}
			return newArray;
		},*/
		formatterComboBox: function (self, campo, dato, newCampo, nameModel, nametable) {
			var modData = "";
			try {
				if (dato != undefined) {
					var table = self.getView().getModel(nameModel).getProperty(nametable);
					var findObject = table.find(function (el) {
						return el[campo] == dato;
					});
					modData = findObject[newCampo];
				}
			} catch (e) {}
			return modData;
		},
		pad: function (n, padString, length) { //Añadir ceros a la izquierda, length tamaño final que debe tener
			var n = n.toString();
			while (n.length < length) {
				n = padString + n;
			}
			return n;
		},
		isObject: function (a) {
			return (!!a) && (a.constructor === Object);
		},
		formatFechaDDMMAAAAHHMMSS: function (value) {
			var fechaString;
			/////////////////////////////
			if (value) {
				var date = value;
				var yyyy = date.getFullYear().toString();
				var mm = utilController.pad((date.getMonth() + 1).toString(), "0", 2); // getMonth() is zero-based
				var dd = utilController.pad(date.getDate().toString(), "0", 2);
				var h = utilController.pad(date.getHours(), "0", 2);
				var m = utilController.pad(date.getMinutes(), "0", 2);
				var s = utilController.pad(date.getSeconds(), "0", 2);
				fechaString = dd + "/" + mm + "/" + yyyy + " " + h + ":" + m + ":" + s; // padding 
			} else {
				fechaString = "";
			}
			////////////////////////////
			return fechaString;
		},
		formatFechaDDMMAAAAHora: function (date) {
			if (!date) {
				return date;
			}
			var fecha = this.pad(date.getDate(), "0", 2) + "/" + this.pad((date.getMonth() + 1), "0", 2) + "/" + this.pad(date.getFullYear(), "0",
					4) + " " +
				this.pad(date.getHours(), "0", 2) + ":" + this.pad(date.getMinutes(), "0", 2) + ":" + this.pad(date.getSeconds(), "0", 2);
			return fecha;
		},
		formatFechaDDMMAAAA: function (date) {
			if (!date) {
				return date;
			}
			var fecha = this.pad(date.getDate(), "0", 2) + "/" + this.pad((date.getMonth() + 1), "0", 2) + "/" + this.pad(date.getFullYear(), "0",
				4);
			return fecha;
		},
		formatFechaDate: function (date) {
			if (!date) {
				return date;
			}
			var iFecha = date.split("/");
			var fecha = new Date(iFecha[2].split(" ")[0] + "/" + iFecha[1] + "/" + iFecha[0] + " " + iFecha[2].split(" ")[1]);
			return fecha;
		},
		btnMenosTable: function (self, idTable, model, table, event) {
			//var tabla = self.getView().byId(idTable);
			var tabla = sap.ui.getCore().byId(idTable);
			var itemsTabla = tabla.getSelectedIndices().length;
			var aItems = [];
			if (itemsTabla > 0) {
				for (var i = itemsTabla - 1; i >= 0; i--) {
					var item = tabla.getSelectedIndices()[i];
					var obj = tabla.getRows()[item].getBindingContext(model).getObject();
					//var obj = self.getView().getModel(model).getProperty(table + "/" + item);
					aItems.push(obj);
					//self.removeSelection(idTable);
				}
				event.Eliminar(aItems);
			} else {
				MessageToast.show('No ha seleccionado ningun item', {
					duration: 3000
				});
				return;
			}
		},
		valorDefault: function (table, objectDefault) {
			var tableInicial = "/Detail/";
			var valorDefault = "";
			if (table == tableInicial + "Contenedor") {
				valorDefault = "XNA_AEREO";
				objectDefault.Tipo = valorDefault;
				objectDefault.Tamanio = valorDefault;
				objectDefault.Clasificacion = valorDefault;
			} else if (table == tableInicial + "Paquete") {

			} else if (table == tableInicial + "Precinto") {

			} else if (table == tableInicial + "Adjunto") {

			} else if (table == tableInicial + "Flete") {
				valorDefault = "XNAX";
				objectDefault.TipoPago = valorDefault;
				objectDefault.TipoFlete = valorDefault;
				objectDefault.MonedaFlete = valorDefault;
				//objectDefault.DestinacionCarga = valorDefault;
			} else { //DocumentoTransporte Directa, Master e Hija
				valorDefault = "XNAX";
				objectDefault.TipoDocumentoTransporte = valorDefault;
				objectDefault.Indicador = valorDefault;
				objectDefault.TipoBulto = valorDefault;
				//objectDefault.LugarEmision = valorDefault;//Comentado 20-09-2019
				objectDefault.CodModalidad = null;
				objectDefault.PuntoLlegada = 4372;
				objectDefault.DepositoTemporal = valorDefault;
				objectDefault.TerminalOrigen = valorDefault;
				objectDefault.TerminalDestino = valorDefault;
				objectDefault.NaturalezaCarga = valorDefault;
				//objectDefault.CodigoUN = valorDefault; //Comentado Obs 31-07-2019
				objectDefault.IdTipoCondicion = valorDefault;
				objectDefault.AgenteCarga = null;
				//objectDefault.EmbarcadorCodigo = valorDefault; //Comentado Obs 31-07-2019
				//objectDefault.ConsignatarioCodigo = valorDefault; //Comentado Obs 31-07-2019
				///objectDefault.NotificadoCodigo = valorDefault; //Comentado Obs 31-07-2019
				//objectDefault.ConsolidadorCodigo = valorDefault; //Comentado Obs 31-07-2019
				objectDefault.ValorMercanciaMoneda = valorDefault;
				objectDefault.EntidadReguladoraMercPeligrosa = valorDefault;
				objectDefault.DestinacionCarga = valorDefault; //Nuevo

				valorDefault = "XNA_AEREO";
				//objectDefault.Origen = valorDefault;//Comentado 20-09-2019
				//objectDefault.Destino = valorDefault;//Comentado 20-09-2019
				//objectDefault.CodTipoAlmacenamiento = valorDefault;
				//objectDefault.PuertoEmbarque = valorDefault;//Comentado 20-09-2019
				objectDefault.ConsolidadorPuertoDescarga = valorDefault;
			}
			return objectDefault;
		},
		btnMasTable: function (self, model, table, callback) {
			var contenedor = self.getView().getModel(model).getProperty(table);
			contenedor = contenedor ? contenedor : [];
			var objectDefault = {
				enabledInput: true,
				validMostrarPDF: false,
				icon: "sap-icon://save",
				anterior: {}
			};
			if (contenedor.length > 0) {
				var ultimoObj = contenedor[contenedor.length - 1];
				if (ultimoObj.anterior && jQuery.isEmptyObject(ultimoObj.anterior)) {
					return;
				}
				for (var i in contenedor) {
					contenedor[i].icon = "sap-icon://edit";
					contenedor[i].enabledInput = false;
				}
			}
			objectDefault = this.valorDefault(table, objectDefault);
			contenedor.push(objectDefault);
			self.getView().getModel(model).setProperty(table, contenedor);
			self.getView().getModel(model).refresh(true);
			callback();
		},
		btnMasTableUltimo: function (self, model, table) {
			var contenedor = self.getView().getModel(model).getProperty(table);
			contenedor = contenedor ? contenedor : [];
			var valorDefault = {
				enabledInput: true,
				icon: "sap-icon://save",
				anterior: {}
			};
			if (jQuery.isEmptyObject(contenedor)) {
				contenedor = [valorDefault];
			} else {
				var ultimoObj = contenedor[contenedor.length - 1];
				if (ultimoObj.anterior && jQuery.isEmptyObject(ultimoObj.anterior)) {
					return;
				}
				for (var i in contenedor) {
					contenedor[i].icon = "sap-icon://edit";
					contenedor[i].enabledInput = false;
				}
				contenedor.push(valorDefault);

			}
			self.getView().getModel(model).setProperty(table, contenedor);
		},
		changeEditSaveRowTable: function (self, oEvent, model, campoAnterior, campoCondicion, campoIcon, campoEnabled, event) {
			var objDepend = oEvent.getSource().getBindingContext(model).getObject();
			var obj = this.unlink(objDepend);
			var path = oEvent.getSource().getBindingContext(model).getPath();
			if (obj.icon === "sap-icon://edit") {
				var contenedor = obj; //this.unlink(self.getView().getModel(model).getProperty(path));
				self.getView().getModel(model).setProperty(path + "/" + campoAnterior, contenedor);
				self.getView().getModel(model).setProperty(path + "/" + campoIcon, "sap-icon://save");
				self.getView().getModel(model).setProperty(path + "/" + campoEnabled, true);
				self.getView().getModel(model).refresh(true);
				self.mostrarTablas(false);
				self.mostrarTablas(true);
			} else if (obj.icon === "sap-icon://save") {
				obj.path = path;
				if (obj.Id && obj.Id != "") {
					////Editar
					event.Editar(obj);
				} else {
					////Registrar
					event.Registrar(obj);
				}
				////
			}
		},
		changeCancelRowTable: function (self, oEvent, model, table, campoAnterior, campoIcon, campoEnabled) {
			var objDepend = oEvent.getSource().getBindingContext(model).getObject();
			var obj = this.unlink(objDepend);
			var path = oEvent.getSource().getBindingContext(model).getPath();
			if (obj.icon === "sap-icon://save") {
				if (obj.Id && obj.Id != "") {
					////Editar
					var objAnterior = obj[campoAnterior];
					self.getView().getModel(model).setProperty(path, objAnterior);
					self.getView().getModel(model).setProperty(path + "/" + campoIcon, "sap-icon://edit");
					self.getView().getModel(model).setProperty(path + "/" + campoEnabled, false);
				} else {
					////Registrar
					var contenedor = self.getView().getModel(model).getProperty(table);
					contenedor.pop();
					self.getView().getModel(model).setProperty(table, contenedor);
				}
				self.getView().getModel(model).refresh(true);
			}
		},

		btnMenosTable2: function (self, idTable, model, table) {
			var tabla = self.getView().byId(idTable);
			var listTotalGuia = self.getView().getModel(model).getProperty(table);
			var itemsTabla = tabla.getSelectedIndices().length;
			if (itemsTabla > 0) {
				for (var i = itemsTabla - 1; i >= 0; i--) {
					var item = tabla.getSelectedIndices()[i];
					listTotalGuia.splice(item, 1);
					self.getView().getModel(model).setProperty(table, listTotalGuia);
					self.removeSelection(idTable);
				}
				MessageToast.show('Se ha(n) Eliminado el(los) item(s) seleccionado(s)', {
					duration: 3000
				});
				return;
			} else {
				MessageToast.show('No ha seleccionado ningun item', {
					duration: 3000
				});
				return;
			}
		},
		changeEditSaveRowTable2: function (self, oEvent, model, campoAnterior, campoCondicion, campoIcon, campoEnabled, event) {
			var objDepend = oEvent.getSource().getBindingContext(model).getObject();
			var obj = this.unlink(objDepend);
			var path = oEvent.getSource().getBindingContext(model).getPath();
			if (obj.icon === "sap-icon://edit") {
				////Editar
				var contenedor = this.unlink(self.getView().getModel(model).getProperty(path));
				self.getView().getModel(model).setProperty(path + "/" + campoAnterior, contenedor);
				self.getView().getModel(model).setProperty(path + "/" + campoIcon, "sap-icon://save");
				self.getView().getModel(model).setProperty(path + "/" + campoEnabled, true);
				////
			} else if (obj.icon === "sap-icon://save") {
				////Registrar
				var objAnterior = obj[campoAnterior];
				var objAnteriorIsEmpty = jQuery.isEmptyObject(objAnterior);
				if (obj[campoCondicion] === undefined || obj[campoCondicion] === "") { //objAnteriorIsEmpty && (obj[campoCondicion] === undefined)
					MessageToast.show("Por favor llene correctamente los campos.");
				} else {
					self.getView().getModel(model).setProperty(path + "/" + campoIcon, "sap-icon://edit");
					self.getView().getModel(model).setProperty(path + "/" + campoEnabled, false);
					self.getView().getModel(model).setProperty(path + "/" + campoAnterior, contenedor);
				}
				////
			}
		},
		changeCancelRowTable2: function (self, oEvent, model, table, campoAnterior, campoIcon, campoEnabled) {
			var objDepend = oEvent.getSource().getBindingContext(model).getObject();
			var obj = this.unlink(objDepend);
			var path = oEvent.getSource().getBindingContext(model).getPath();
			if (obj.icon === "sap-icon://edit") {
				////
				self.getView().getModel(model).setProperty(path + "/" + campoIcon, "sap-icon://save");
				self.getView().getModel(model).setProperty(path + "/" + campoEnabled, true);
				////
			} else if (obj.icon === "sap-icon://save") {
				////
				var objAnterior = obj[campoAnterior];
				self.getView().getModel(model).setProperty(path + "/" + campoIcon, "sap-icon://edit");
				self.getView().getModel(model).setProperty(path + "/" + campoEnabled, false);
				self.getView().getModel(model).setProperty(path, objAnterior);
				var objAnteriorIsEmpty = jQuery.isEmptyObject(objAnterior);
				if (objAnteriorIsEmpty) {
					var contenedor = this.unlink(self.getView().getModel(model).getProperty(table));
					contenedor.pop();
					self.getView().getModel(model).setProperty(table, contenedor);
				}
				////
			}
		},
		unlink: function (object) {
			var returnJSON = JSON.parse(JSON.stringify(object));
			var keys = Object.entries(object);
			var keysFormat = keys.filter(function (el) {
				return typeof el[1] == "object" && el[1] != null;
			});
			for (var i in keysFormat) {
				returnJSON[keysFormat[i][0]] = keysFormat[i][1];
			}
			return returnJSON;
		},
		createDialog: function (self, idFrag, rutaFrag) {
			try {
				sap.ui.getCore().byId(idFrag).destroy();
			} catch (e) {}
			if (!sap.ui.getCore().byId(idFrag)) {
				self[idFrag] = sap.ui.xmlfragment(
					constantes.idProyecto + rutaFrag,
					self.getView().getController() // associate controller with the fragment            
				);
				self.getView().addDependent(self[idFrag]);
			}
			sap.ui.getCore().byId(idFrag).open();
			Busy.close();
		},
		createTable: function (self, idFrag, rutaFrag, idPanel, create, bHideLoading) {
			try {
				sap.ui.getCore().byId(idFrag).destroy();
			} catch (e) {}
			if (create) {
				if (!sap.ui.getCore().byId(idFrag)) {
					self[idFrag] = sap.ui.xmlfragment(
						constantes.idProyecto + rutaFrag,
						self.getView().getController() // associate controller with the fragment            
					);
					self.getView().byId(idPanel).addContent(self[idFrag]);
				}
				if (bHideLoading) {
					jQuery.sap.delayedCall(3000, self, function () {
						Busy.close();
					});
				}
			}
		},
		createPage: function (view, splitId, viewId, rutaController) {
			var viewDefault = view.getView().byId(viewId).getId();
			view.getView().byId(splitId).to(view.createId(viewDefault));
			//this.callController(rutaController).onRouteMatched();
			/*$.Home.getView().byId(splitId).setMode("ShowMode");
			$.Home.getView().byId(splitId).setMode("HideMode");*/
		},
		callController: function (rutaController) {
			return sap.ui.controller(constantes.idProyecto + ".controller." + rutaController);
		},
		controllerFromView: function (controller, id) {
			var idController = this.byId(controller, id).getId();
			return sap.ui.getCore().byId(idController).getController();
		},
		createPageMaster: function (self, splitId, viewId) {
			var viewDefault = self.getView().byId(viewId).getId();
			self.getView().byId(splitId).toMaster(self.createId(viewDefault));
		},
		getControllerView: function (nameController) {
			if (!this.controllerView) {
				this.controllerView = sap.ui.getCore().byId(sap.ui.controller(constantes.idProyecto + nameController).getId())
					.getController();
			}
			return this.controllerView;
		},
		property: function (controller, root, data, bRefresh) {
			if (data) {
				controller.getView().getModel().setProperty(root, data);
				if (bRefresh === true) {
					this.refreshModel(controller);
				}
				return null;
			} else {
				return controller.getView().getModel().getProperty(root);
			}
		},
		refreshModel: function (controller) {
			controller.getView().getModel().refresh();
		},
		byId: function (controller, id) {
			return controller.getView().byId(id);
		},
		navToPage: function (self, page) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(self);
			oRouter.navTo(page);
			this.getControllerView(page);
		},
		navTo: function (controller, page, data) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(controller);
			//oRouter.navTo(null, data ? data : null, true);
			oRouter.navTo(page, data ? data : null, false);
		},
		navBack: function (controller) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(controller);
				oRouter.navTo(constantes.PaginaHome, true);
			}
		},
		filtroInicialFechasOC: function (self) {
			// Setea los Date Picker de OC a los ultimos 3 meses
			var date = new Date(new Date().getFullYear(), 0, 1);
			var date2 = new Date();
			var dpFin = self.getView().byId("dpFin");
			dpFin.setDateValue(date2);
			var dpIni = self.getView().byId("dpIni");
			dpIni.setDateValue(date);
		},
		filtroInicialFechasComprobantes: function (self) {
			// Setea los Date Picker de Comprobantes a los ultimos 3 meses
			var dateC = new Date(new Date().getFullYear(), 0, 1);
			var dateC2 = new Date();
			var dpFinC = self.getView().byId("dpFinDOA");
			dpFinC.setDateValue(dateC2);
			var dpIniC = self.getView().byId("dpIniDOA");
			dpIniC.setDateValue(dateC);
		},
		getParameter: function (self, oEvent, nameParam, nameView, data) {
			var parametro = oEvent.mParameters ? oEvent.getParameter("arguments")[nameParam] : null;
			if (!parametro) {
				if (nameView) {
					this.navTo(self, nameView, data);
				}
			}
			return parametro;
		},
		alignTextCutPhraseJsPDF: function (Doc, Value, CoordX, CoordY, WidthString, Align) {
			var doc = Doc;
			var coordX = CoordX;
			var coordY = CoordY;
			var widthString = WidthString;
			var paragraph = Value;
			var lines = doc.splitTextToSize(paragraph, widthString);
			var dim = doc.getTextDimensions('Text');
			var lineHeight = dim.h;
			var maximoWidth = 0;
			for (var l = 0; l < lines.length; l++) {
				if (doc.getTextWidth(lines[l]) > maximoWidth) {
					maximoWidth = doc.getTextWidth(lines[l]);
				}
			}
			for (var i = 0; i < lines.length; i++) {
				var lineTop = i == 0 ? coordY : ((lineHeight / 3.3) * (i)) + coordY;
				lines[i] = lines[i].toString().replace(/ /g, "|");
				while (doc.getTextWidth(lines[i]) < maximoWidth) {
					if (doc.getTextWidth(lines[i]) * 1.2 <= maximoWidth) {
						break;
					}
					if (!lines[i].toString().includes("|")) {
						lines[i] = lines[i].toString().replace(/ /g, "|");
					}
					lines[i] = lines[i].toString().replace("|", "  ");
				}
				while (lines[i].includes("|")) {
					lines[i] = lines[i].toString().replace("|", " ");
				}

			}
			doc.text(lines[0], coordX, lineTop, {
				maxWidth: widthString,
				align: Align //justify,center,left,rihgt
			}); //see this line
		},
		valueDiferenciaPeso: function (valor) {
			var newValor = valor;
			if (!valor) {
				newValor = 0;
			}
			if (valor < 0) {
				newValor = Math.abs(valor);
			}
			if(valor > 0 ){
				newValor = valor *-1;
			}
			return newValor;
		},
		setFilterArray: function (self, servDatos, CodigoTabla, oFiltro,callback) {
				for (var i in oFiltro) {
					var nameTable = oFiltro[i].oValue1;
					var modData = servDatos.filter(function (el) {
						return el[CodigoTabla] == nameTable;
					});
					callback(modData,nameTable);
				}
			},
		
	};
});