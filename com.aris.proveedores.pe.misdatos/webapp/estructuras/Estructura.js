sap.ui.define([
	"../util/utilFormatter"
], function (utilFormatter) {
	"use strict";
	return {
		maestro: {
			mapComboGeneral: function (self, nameModel, nameTable, campoKey, campoDescripcion, servDatos) {
				var model = self.getView().getModel(nameModel).getProperty("/" + nameTable);
				var modelSet = model ? model : [];
				var modDatos = servDatos;
				modDatos.Codigo = campoKey;
				modDatos.Descripcion = campoDescripcion;

				modelSet.push(modDatos);
				self.getView().getModel(nameModel).setProperty("/" + nameTable, modelSet);
				self.getView().getModel(nameModel).refresh(true);
			},
			mapVGenericaCampo: function (self, datos) {
				var servDatos = datos;
				// var via = self.getView().getModel("DetailModel").getProperty("/Itinerario/CodVia");
				self.getView().getModel("maestroModel").setData({});
				for (var i in servDatos) {
					// if (servDatos[i].CodigoTabla == "T_AEROPUERTOS") {
					// 	if (servDatos[i].PadreDescripcion == via) {
					// 		this.mapComboGeneral(self, "maestroModel", servDatos[i].CodigoTabla, servDatos[i].Campo, servDatos[i].DescripcionCampo,
					// 			servDatos[i]);
					// 	}
					// }else
					if (servDatos[i].CodigoTabla == "estado") {
						if (servDatos[i].PadreDescripcion == "TE_ITINERARIO") {
							this.mapComboGeneral(self, "maestroModel", servDatos[i].CodigoTabla, servDatos[i].Id, servDatos[i].DescripcionCampo,
								servDatos[i]);
						}
					}else{
						//if (servDatos[i].PadreDescripcion == via) {
							this.mapComboGeneral(self, "maestroModel", servDatos[i].CodigoTabla, servDatos[i].Campo, servDatos[i].DescripcionCampo, servDatos[i]);
						//}
					}
				}
			},
		},
		masterPage: {
			masterImportacion: function (datos) {
				var servDatos = datos;
				var arrayDatos = [];
				for (var i in servDatos) {

					var modDatos = {
						sCodigoTransportista: servDatos[i].TRANSPORTISTA,
						sNroViaje: servDatos[i].NROVIAJE,
						iAnioViaje: parseInt(servDatos[i].PERIODO, 10),
						sMatricula: servDatos[i].MATRICULA,
						sMovimiento: servDatos[i].MOVIMIENTO,
						sOrigen: servDatos[i].ORIGEN,
						sDestino: servDatos[i].DESTINO,
						sDias: servDatos[i].DIAS,
						sHora: servDatos[i].HORA,
						sProceso: servDatos[i].PROCESO
					};

					if (!modDatos.sMatricula) {
						modDatos.sMatricula = "";
					}

					console.log(modDatos);
					arrayDatos.push(modDatos);
				}
				return {
					oResults: {
						Itinerarios: arrayDatos
					}
				};
			}
		},
		detailPage: {
			editar: function (datos) {
				var servDatos = datos;
				var modDatos = {
					iId: servDatos.Id,
					sCodigoTransportista: servDatos.CodigoTransportista,
					sNroViaje: servDatos.NroViaje,
					iAnioViaje: parseInt(servDatos.AnioViaje, 10),
					sMatricula: servDatos.Matricula,
					sMovimiento: servDatos.Movimiento,
					sOrigen: servDatos.Origen,
					sDestino: servDatos.Destino,
					sDias: servDatos.Dias ?servDatos.Dias.replace(/_/g, ''):'',
					sHora: servDatos.Hora,
					iIdEstado: parseInt(servDatos.IdEstado, 10),
					sCodNave: servDatos.CodNave
				};

				return {
					oResults: {
						Itinerarios: [modDatos]
					}
				};
			},
			eliminar: function (datos) {
				var servDatos = datos;

				return {
					oResults: {
						Ids: [servDatos.Id]
					}
				};
			},
			addMov: function (datos) {
				return {
					oResults: datos
				};
			},
			editMov: function (datos) {
				return {
					oResults: {
						iId: datos.Id,
						dFechaHora: datos.FechaHoraDate,
						sEstacionamiento: datos.Estacionamiento
					}
				};
			},
			delMov: function (datos) {
				return {
					oResults: {
						Ids: [datos.Id]
					}
				};
			}
		}
	};
});