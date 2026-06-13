jQuery.sap.require("sap.ui.core.format.DateFormat");
sap.ui.define([
	"./utilController"
], function (controller) {
	"use strict";
	return {
		registrarManifiesto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					sVia: servDatos.Via,
					sViaje: servDatos.Viaje,
					sMovimiento: servDatos.Movimiento ? servDatos.Movimiento : "",
					sTipoManifiesto: servDatos.TipoManifiesto,
					sNumeroManifiesto: servDatos.NumeroManifiesto ? servDatos.NumeroManifiesto : "",
					sAnioManifiesto: servDatos.AnioManifiesto,

					sCodItinerario: servDatos.CodItinerario,
					iAnioItinerario: servDatos.AnioItinerario,
					iIdItinerarioDetalle: servDatos.IdItinerarioDetalle,
					dFechaHoraLlegada: servDatos.FechaHoraLlegada ? new Date(servDatos.FechaHoraLlegada) : null,
					sEstacionamiento: servDatos.Estacionamiento,

					sJurisdiccionAduanera: servDatos.JurisdiccionAduanera,
					sCapitanTransporte: servDatos.CapitanTransporte,
					sPuertoZarpe: servDatos.PuertoZarpe,
					//
					dFechaTerminoDescarga: servDatos.FechaTerminoDescarga ? new Date(servDatos.FechaTerminoDescarga) : null,
					sTipoLugarDescarga: servDatos.TipoLugarDescarga,
					sLugarDescarga: servDatos.LugarDescarga,
					//
					dFechaHoraLlegadaATA: servDatos.FechaHoraLlegadaATA ? new Date(servDatos.FechaHoraLlegadaATA) : null,
					sMovimientoItineario: servDatos.MovimientoItinerario,
					sMatricula: servDatos.Matricula,
					sNacionalidad: servDatos.Nacionalidad,
					sTipoTransporte: servDatos.TipoTransporte,
					sViaSunat: servDatos.ViaSunat,
					sLugarLLegada: servDatos.LugarLLegada,
					dFechaZarpe: servDatos.FechaZarpe,

					sTransportistaCodigo: servDatos.TransportistaCodigo,
					sTransportistaDescripcion: servDatos.TransportistaDescripcion,
					sTransportistaDireccion: servDatos.TransportistaDireccion,
					
					dFechaNumeracion: servDatos.FechaNumeracion
				}
			};
			return modDatos;
		},
		actualizarManifiesto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iId: servDatos.Id,
					sVia: servDatos.Via,
					sViaje: servDatos.Viaje,
					sMovimiento: servDatos.Movimiento ? servDatos.Movimiento : "",
					sTipoManifiesto: servDatos.TipoManifiesto,
					sNumeroManifiesto: servDatos.NumeroManifiesto ? servDatos.NumeroManifiesto : "",
					sAnioManifiesto: servDatos.AnioManifiesto,
					dFechaTerminoDescarga: servDatos.FechaTerminoDescarga ? new Date(servDatos.FechaTerminoDescarga) : null,
					sCodItinerario: servDatos.CodItinerario,
					iAnioItinerario: servDatos.AnioItinerario,
					iIdItinerarioDetalle: servDatos.IdItinerarioDetalle,
					dFechaHoraLlegada: servDatos.FechaHoraLlegada ? new Date(servDatos.FechaHoraLlegada) : null,
					sEstacionamiento: servDatos.Estacionamiento,
					sMovimientoItineario: servDatos.MovimientoItinerario,
					sJurisdiccionAduanera: servDatos.JurisdiccionAduanera,
					sCapitanTransporte: servDatos.CapitanTransporte,
					sPuertoZarpe: servDatos.PuertoZarpe,
					sTipoLugarDescarga: servDatos.TipoLugarDescarga,
					sLugarDescarga: servDatos.LugarDescarga,
					dFechaHoraLlegadaATA: servDatos.FechaHoraLlegadaATA ? new Date(servDatos.FechaHoraLlegadaATA) : null,

					sMatricula: servDatos.Matricula,
					sNacionalidad: servDatos.Nacionalidad,
					sTipoTransporte: servDatos.TipoTransporte,
					sViaSunat: servDatos.ViaSunat,
					sLugarLLegada: servDatos.LugarLLegada,
					dFechaZarpe: servDatos.FechaZarpe,

					sTransportistaCodigo: servDatos.TransportistaCodigo,
					sTransportistaDescripcion: servDatos.TransportistaDescripcion,
					sTransportistaDireccion: servDatos.TransportistaDireccion,
					
					dFechaNumeracion: servDatos.FechaNumeracion
				}
			};
			return modDatos;
		},
		eliminarManifiesto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aItems: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aItems.push({
					iId: servDatos[i].Id,
					aContenedor: servDatos[i].Contenedor,
					aDocumentoTransporte: servDatos[i].DocumentoTransporte,
					aPaquete: servDatos[i].Paquete,
					aPrecinto: servDatos[i].Precinto,
					aAdjunto: servDatos[i].Adjunto
				});
			}
			return modDatos;
		},
		/////////////////////////////////////////////////////////////////
		registrarContenedor: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					//iId: servDatos.Id,
					sTipo: servDatos.Tipo,
					sTamanio: servDatos.Tamanio,
					sClasificacion: servDatos.Clasificacion,
					sCondicion: servDatos.Condicion ? servDatos.Condicion : "",
					iBultoManifestado: servDatos.BultoManifestado,
					iPesoManifestado: servDatos.PesoManifestado,
					iIdManifiesto: servDatos.IdManifiesto,
					sNumeroContenedor: servDatos.NumeroContenedor
				}
			};
			return modDatos;
		},
		actualizarContenedor: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iId: servDatos.Id,
					sTipo: servDatos.Tipo,
					sTamanio: servDatos.Tamanio,
					sClasificacion: servDatos.Clasificacion,
					sCondicion: servDatos.Condicion ? servDatos.Condicion : "",
					iBultoManifestado: servDatos.BultoManifestado,
					iPesoManifestado: servDatos.PesoManifestado,
					iIdManifiesto: servDatos.IdManifiesto,
					sNumeroContenedor: servDatos.NumeroContenedor
				}
			};
			return modDatos;
		},
		eliminarContenedor: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aItems: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aItems.push({
					iId: servDatos[i].Id
				});
			}
			return modDatos;
		},
		////////////////////////////////////////////////////////////////////////////
		registrarMultiDocumentoTransporte: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					bIsRegistro: 2,
					DocumentoTransporteMadre: this.registrarMultiDocumentoTransporteMadre(datos),
					DocumentoTransporteHija: this.registrarMultiDocumentoTransporteHija(datos)
				}
			};
			return modDatos;
		},
		registrarMultiDocumentoTransporteMadre: function (datos) {
			var servDatos = datos.DocumentoTransporteMadre;
			var response = [];
			for (var i in servDatos) {
				var modDatos = {
					iEsMaster: datos.EsMaster,
					iDocumentoTransporteMadreId: servDatos[i].DocumentoTransporteMadreId ? servDatos[i].DocumentoTransporteMadreId : "",
					sDocumentoTransporteMasterCodigo: servDatos[i].DocumentoTransporteMasterCodigo,
					sDocumentoTransporteCodigo: servDatos[i].DocumentoTransporteCodigo ? servDatos[i].DocumentoTransporteCodigo : "",
					sDescripcion: servDatos[i].Descripcion,
					iBultosManifestados: servDatos[i].BultosManifestados,
					fPesoManifestado: servDatos[i].PesoManifestado,
					sOrigen: servDatos[i].Origen,
					sDestino: servDatos[i].Destino,
					sPuntoLlegada: servDatos[i].PuntoLlegada,
					sTerminalOrigen: servDatos[i].TerminalOrigen,
					sTerminalDestino: servDatos[i].TerminalDestino,
					iIdModalidad: servDatos[i].IdModalidad,
					iIdTipoCarga: servDatos[i].IdTipoCarga,
					iIdTipoAlmacenamiento: servDatos[i].IdTipoAlmacenamiento ? servDatos[i].IdTipoAlmacenamiento : "",
					iIdRegimen: servDatos[i].IdRegimen,
					sAgenteCarga: servDatos[i].AgenteCarga,
					sEmbarcador: servDatos[i].Embarcador,
					sConsignatario: servDatos[i].Consignatario,
					iIdManifiesto: datos.IdManifiesto,
					iIdContenedor: servDatos[i].IdContenedor,
					iEsCargaSuelta: servDatos[i].EsCargaSuelta ? servDatos[i].EsCargaSuelta : "",
					iEsExpo: servDatos[i].EsExpo ? servDatos[i].EsExpo : 0, // siempre se envia 0
					sAdjunto: servDatos[i].Adjunto,
					iEsTCI: servDatos[i].EsTCI,
					sIdTipoCondicion: servDatos[i].IdTipoCondicion,

					dFechaEmision: servDatos[i].FechaEmision,
					sLugarEmision: servDatos[i].LugarEmision,
					dFechaEmbarque: servDatos[i].FechaEmbarque,
					sPuertoEmbarque: servDatos[i].PuertoEmbarque,
					sIndicador: servDatos[i].Indicador,
					sCodigoUN: servDatos[i].CodigoUN,
					sTipoBulto: servDatos[i].TipoBulto,
					sNotificado: servDatos[i].Notificado,
					sTipoDocumentoTransporte: servDatos[i].TipoDocumentoTransporte,
					sVinVehiculos: servDatos[i].VinVehiculos,
					sDepositoTemporal: servDatos[i].DepositoTemporal,
					sNaturalezaCarga: servDatos[i].NaturalezaCarga,
					sCodModalidad: servDatos[i].CodModalidad,
					sCodTipoAlmacenamiento: servDatos[i].CodTipoAlmacenamiento
				};
				response.push(modDatos);
			}
			return response;
		},
		registrarMultiDocumentoTransporteHija: function (datos) {
			var servDatos = datos.DocumentoTransporteHija;
			var response = [];
			for (var i in servDatos) {
				var modDatos = {
					iEsMaster: 2,
					iDocumentoTransporteMadreId: servDatos[i].DocumentoTransporteMadreId ? servDatos[i].DocumentoTransporteMadreId : "",
					sDocumentoTransporteMasterCodigo: servDatos[i].DocumentoTransporteMasterCodigo,
					sDocumentoTransporteCodigo: servDatos[i].DocumentoTransporteCodigo ? servDatos[i].DocumentoTransporteCodigo : "",
					sDescripcion: servDatos[i].Descripcion,
					iBultosManifestados: servDatos[i].BultosManifestados,
					fPesoManifestado: servDatos[i].PesoManifestado,
					sOrigen: servDatos[i].Origen,
					sDestino: servDatos[i].Destino,
					sPuntoLlegada: servDatos[i].PuntoLlegada,
					sTerminalOrigen: servDatos[i].TerminalOrigen,
					sTerminalDestino: servDatos[i].TerminalDestino,
					iIdModalidad: servDatos[i].IdModalidad,
					iIdTipoCarga: servDatos[i].IdTipoCarga,
					iIdTipoAlmacenamiento: servDatos[i].IdTipoAlmacenamiento ? servDatos[i].IdTipoAlmacenamiento : "",
					iIdRegimen: servDatos[i].IdRegimen,
					sAgenteCarga: servDatos[i].AgenteCarga,
					sEmbarcador: servDatos[i].Embarcador,
					sConsignatario: servDatos[i].Consignatario,
					iIdManifiesto: datos.IdManifiesto,
					iIdContenedor: servDatos[i].IdContenedor,
					iEsCargaSuelta: servDatos[i].EsCargaSuelta ? servDatos[i].EsCargaSuelta : "",
					iEsExpo: servDatos[i].EsExpo ? servDatos[i].EsExpo : 0, // siempre se envia 0
					sAdjunto: servDatos[i].Adjunto,
					iEsTCI: servDatos[i].EsTCI,
					sIdTipoCondicion: servDatos[i].IdTipoCondicion,

					dFechaEmision: servDatos[i].FechaEmision,
					sLugarEmision: servDatos[i].LugarEmision,
					dFechaEmbarque: servDatos[i].FechaEmbarque,
					sPuertoEmbarque: servDatos[i].PuertoEmbarque,
					sIndicador: servDatos[i].Indicador,
					sCodigoUN: servDatos[i].CodigoUN,
					sTipoBulto: servDatos[i].TipoBulto,
					sNotificado: servDatos[i].Notificado,
					sTipoDocumentoTransporte: servDatos[i].TipoDocumentoTransporte,
					sVinVehiculos: servDatos[i].VinVehiculos,
					sDepositoTemporal: servDatos[i].DepositoTemporal,
					sNaturalezaCarga: servDatos[i].NaturalezaCarga,
					sCodModalidad: servDatos[i].CodModalidad,
					sCodTipoAlmacenamiento: servDatos[i].CodTipoAlmacenamiento
				};
				response.push(modDatos);
			}
			return response;
		},
		////////////////////////////////////////////////////////////////////////////
		registrarPaquete: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					//iId: servDatos.Id,
					iIdDocumentoTransporte: servDatos.IdDocumentoTransporte,
					sTipoEmpaqueCodigo: servDatos.TipoEmpaqueCodigo,
					iCantidad: servDatos.Cantidad
				}
			};
			return modDatos;
		},
		actualizarPaquete: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iId: servDatos.Id,
					iIdDocumentoTransporte: servDatos.IdDocumentoTransporte,
					sTipoEmpaqueCodigo: servDatos.TipoEmpaqueCodigo,
					iCantidad: servDatos.Cantidad
				}
			};
			return modDatos;
		},
		eliminarPaquete: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aItems: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aItems.push({
					iId: servDatos[i].Id
				});
			}
			return modDatos;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////
		registrarPrecinto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					//iId: servDatos.Id,
					iIdContenedor: servDatos.IdContenedor,
					iNumeroPrecinto: servDatos.NumeroPrecinto ? servDatos.NumeroPrecinto : 0
				}
			};
			return modDatos;
		},
		actualizarPrecinto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iId: servDatos.Id,
					iIdContenedor: servDatos.IdContenedor,
					iNumeroPrecinto: servDatos.NumeroPrecinto ? servDatos.NumeroPrecinto : 0
				}
			};
			return modDatos;
		},
		eliminarPrecinto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aItems: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aItems.push({
					iId: servDatos[i].Id
				});
			}
			return modDatos;
		},
		////////////////////////////////////////////////////////////////////////////////////////////
		registrarAdjunto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					flagAdjunto: servDatos.FileName && servDatos.FileName != "" ? true : false,
					sIdFolder: servDatos.IdTipoAdjunto.split(",")[1],
					sBase64File: servDatos.Base64File,
					sExtension: servDatos.Extension,
					sFileName: servDatos.FileName,
					iIdManifiesto: servDatos.IdManifiesto,
					iIdTipoAdjunto: servDatos.IdTipoAdjunto.split(",")[0]
				}
			};
			return modDatos;
		},
		actualizarAdjunto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					flagAdjunto: servDatos.FileName && servDatos.FileName != "" ? true : false,
					iId: servDatos.Id,
					sIdFolder: servDatos.IdTipoAdjunto.split(",")[1], //servDatos.IdFolder,
					sBase64File: servDatos.Base64File,
					sExtension: servDatos.Extension,
					sFileName: servDatos.FileName,
					iIdManifiesto: servDatos.IdManifiesto,
					iIdTipoAdjunto: servDatos.IdTipoAdjunto.split(",")[0],
					iIdAdjunto: servDatos.IdAdjunto
				}
			};
			return modDatos;
		},
		eliminarAdjunto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aItems: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aItems.push({
					iId: servDatos[i].Id,
					iIdAdjunto: servDatos[i].IdAdjunto,
				});
			}
			return modDatos;
		},
		consultarManifiesto: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iId: servDatos.Id,
					iContenedores: servDatos.Contenedores,
					iDocumentosTransporte: servDatos.DocumentosTransporte,
					iPaquetes: servDatos.Paquetes,
					iPrecintos: servDatos.Precintos,
					iAdjuntos: servDatos.Adjuntos,
					iFletes: servDatos.Fletes
				}
			};
			return modDatos;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		registrarFlete: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iIdDocumentoTransporte: servDatos.IdDocumentoTransporte,
					sTipoPago: servDatos.TipoPago,
					sTipoFlete: servDatos.TipoFlete,
					fMontoFlete: servDatos.MontoFlete,
					sMonedaFlete: servDatos.MonedaFlete,
					sDestinacionCarga: servDatos.DestinacionCarga
				}
			};
			return modDatos;
		},
		actualizarFlete: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iIdDocumentoTransporte: servDatos.IdDocumentoTransporte,
					iId: servDatos.Id,
					sTipoPago: servDatos.TipoPago,
					sTipoFlete: servDatos.TipoFlete,
					fMontoFlete: servDatos.MontoFlete,
					sMonedaFlete: servDatos.MonedaFlete,
					sDestinacionCarga: servDatos.DestinacionCarga
				}
			};
			return modDatos;
		},
		eliminarFlete: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aItems: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aItems.push({
					iId: servDatos[i].Id
				});
			}
			return modDatos;
		},
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		registrarGABL: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					//iId: servDatos.Id,
					bIsRegistro: true,
					iEsMaster: servDatos.EsMaster,
					iDocumentoTransporteMadreId: servDatos.DocumentoTransporteMadreId ? servDatos.DocumentoTransporteMadreId : "",
					sDocumentoTransporteMasterCodigo: servDatos.DocumentoTransporteMasterCodigo,
					sDocumentoTransporteCodigo: servDatos.DocumentoTransporteCodigo ? servDatos.DocumentoTransporteCodigo : "",
					sDescripcion: servDatos.Descripcion,
					iBultosManifestados: servDatos.BultosManifestados,
					fPesoManifestado: servDatos.PesoManifestado,
					fVolumenManifestado: servDatos.VolumenManifestado,
					sOrigen: servDatos.Origen,
					sDestino: servDatos.Destino,
					sPuntoLlegada: servDatos.PuntoLlegada,
					sTerminalOrigen: servDatos.TerminalOrigen,
					sTerminalDestino: servDatos.TerminalDestino,
					iIdModalidad: servDatos.IdModalidad,
					iIdTipoCarga: servDatos.IdTipoCarga,
					iIdTipoAlmacenamiento: servDatos.IdTipoAlmacenamiento ? servDatos.IdTipoAlmacenamiento : "",
					iIdRegimen: servDatos.IdRegimen,
					sAgenteCarga: servDatos.AgenteCarga,
					//sEmbarcador: servDatos.Embarcador,
					//sConsignatario: servDatos.Consignatario,
					iIdManifiesto: servDatos.IdManifiesto,
					iIdContenedor: servDatos.IdContenedor,
					iEsCargaSuelta: servDatos.EsCargaSuelta ? servDatos.EsCargaSuelta : "",
					iEsExpo: servDatos.EsExpo ? servDatos.EsExpo : 0, // siempre se envia 0
					sAdjunto: servDatos.Adjunto,
					iEsTCI: servDatos.EsTCI,
					sIdTipoCondicion: servDatos.IdTipoCondicion,
					//Adjunto
					flagAdjunto: servDatos.FileName && servDatos.FileName != "" ? true : false,

					sBase64File: servDatos.Base64File,
					sExtension: servDatos.Extension,
					sFileName: servDatos.FileName,
					sIdFolder: servDatos.IdTipoAdjunto ? servDatos.IdTipoAdjunto.split(",")[1] : "",
					sIdTipoAdjunto: servDatos.IdTipoAdjunto ? servDatos.IdTipoAdjunto.split(",")[0] : "",

					dFechaEmision: servDatos.FechaEmision,
					sLugarEmision: servDatos.LugarEmision,
					dFechaEmbarque: servDatos.FechaEmbarque,
					sPuertoEmbarque: servDatos.PuertoEmbarque,
					sIndicador: servDatos.Indicador,
					sCodigoUN: servDatos.CodigoUN,
					sTipoBulto: servDatos.TipoBulto,
					sNotificado: servDatos.Notificado,
					sTipoDocumentoTransporte: servDatos.TipoDocumentoTransporte,
					sVinVehiculos: servDatos.VinVehiculos,
					sDepositoTemporal: servDatos.DepositoTemporal,
					sNaturalezaCarga: servDatos.NaturalezaCarga,
					sCodModalidad: servDatos.CodModalidad,
					sCodTipoAlmacenamiento: servDatos.CodTipoAlmacenamiento,

					/*///Nuevos Campos*/
					//sConsignatarioCodigo: servDatos.ConsignatarioCodigo,
					sConsignatarioCodigo: servDatos.ConsignatarioCodigo.replace(/\s/g, ''), //lmora2020
					sConsignatarioDescripcion: servDatos.ConsignatarioDescripcion,
					sConsignatarioTelefono: servDatos.ConsignatarioTelefono,
					sConsignatarioDireccion: servDatos.ConsignatarioDireccion,
					sConsignatarioCorreo: servDatos.ConsignatarioCorreo,
					sConsignatarioTipoDocumento: servDatos.ConsignatarioTipoDocumento,

					sEmbarcadorCodigo: servDatos.EmbarcadorCodigo,
					sEmbarcadorDescripcion: servDatos.EmbarcadorDescripcion,
					sEmbarcadorTelefono: servDatos.EmbarcadorTelefono,
					sEmbarcadorDireccion: servDatos.EmbarcadorDireccion,
					sEmbarcadorCorreo: servDatos.EmbarcadorCorreo,
					sEmbarcadorTipoDocumento: servDatos.EmbarcadorTipoDocumento,

					sNotificadoCodigo: servDatos.NotificadoCodigo,
					sNotificadoDescripcion: servDatos.NotificadoDescripcion,
					sNotificadoTelefono: servDatos.NotificadoTelefono,
					sNotificadoDireccion: servDatos.NotificadoDireccion,
					sNotificadoCorreo: servDatos.NotificadoCorreo,
					sNotificadoTipoDocumento: servDatos.NotificadoTipoDocumento,

					sConsolidadorCodigo: servDatos.ConsolidadorCodigo,
					sConsolidadorTipoDocumento: servDatos.ConsolidadorTipoDocumento,
					sConsolidadorDescripcion: servDatos.ConsolidadorDescripcion,
					sConsolidadorDireccion: servDatos.ConsolidadorDireccion,
					sConsolidadorTelefono: servDatos.ConsolidadorTelefono,
					sConsolidadorCorreo: servDatos.ConsolidadorCorreo,
					sConsolidadorPuertoDescarga: servDatos.ConsolidadorPuertoDescarga,

					//Nuevos Campos
					sConsignatarioCodigoCampo: servDatos.ConsignatarioCodigoCampo,
					sEmbarcadorCodigoCampo: servDatos.EmbarcadorCodigoCampo,
					sNotificadoCodigoCampo: servDatos.NotificadoCodigoCampo,
					//

					iValorMercancia: servDatos.ValorMercancia,
					sValorMercanciaMoneda: servDatos.ValorMercanciaMoneda,

					sEntidadReguladoraMercPeligrosa: servDatos.EntidadReguladoraMercPeligrosa,

					sDestinacionCarga: servDatos.DestinacionCarga,

					iNroDetalle: servDatos.NroDetalle,

					sDAM: servDatos.DAM,
					
					sMarcas: servDatos.Marcas,
					iReceptorCargaId: servDatos.ReceptorCargaId,
					sReceptorCarga: servDatos.ReceptorCarga
						/*///*/
				}
			};
			return modDatos;
		},
		actualizarGABL: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					iId: servDatos.Id,
					bIsRegistro: false,
					iEsMaster: servDatos.EsMaster,
					iDocumentoTransporteMadreId: servDatos.DocumentoTransporteMadreId ? servDatos.DocumentoTransporteMadreId : "",
					sDocumentoTransporteMasterCodigo: servDatos.DocumentoTransporteMasterCodigo,
					sDocumentoTransporteCodigo: servDatos.DocumentoTransporteCodigo ? servDatos.DocumentoTransporteCodigo : "",
					sDescripcion: servDatos.Descripcion,
					iBultosManifestados: servDatos.BultosManifestados,
					fPesoManifestado: servDatos.PesoManifestado,
					fVolumenManifestado: servDatos.VolumenManifestado,
					sOrigen: servDatos.Origen,
					sDestino: servDatos.Destino,
					sPuntoLlegada: servDatos.PuntoLlegada,
					sTerminalOrigen: servDatos.TerminalOrigen,
					sTerminalDestino: servDatos.TerminalDestino,
					iIdModalidad: servDatos.IdModalidad,
					iIdTipoCarga: servDatos.IdTipoCarga,
					iIdTipoAlmacenamiento: servDatos.IdTipoAlmacenamiento ? servDatos.IdTipoAlmacenamiento : "",
					iIdRegimen: servDatos.IdRegimen,
					sAgenteCarga: servDatos.AgenteCarga,
					//sEmbarcador: servDatos.Embarcador,
					//sConsignatario: servDatos.Consignatario,
					iIdManifiesto: servDatos.IdManifiesto,
					iIdContenedor: servDatos.IdContenedor,
					iEsCargaSuelta: servDatos.EsCargaSuelta ? servDatos.EsCargaSuelta : "",
					iEsExpo: servDatos.EsExpo ? servDatos.EsExpo : 0, // siempre se envia 0
					sAdjunto: servDatos.Adjunto,
					iEsTCI: servDatos.EsTCI,
					sIdTipoCondicion: servDatos.IdTipoCondicion,
					//Adjunto
					flagAdjunto: servDatos.FileName && servDatos.FileName != "" ? true : false,
					sIdFolder: servDatos.IdTipoAdjunto ? servDatos.IdTipoAdjunto.split(",")[1] : "",
					sBase64File: servDatos.Base64File,
					sExtension: servDatos.Extension,
					sFileName: servDatos.FileName,
					sIdTipoAdjunto: servDatos.IdTipoAdjunto ? servDatos.IdTipoAdjunto.split(",")[0] : "",

					dFechaEmision: servDatos.FechaEmision,
					sLugarEmision: servDatos.LugarEmision,
					dFechaEmbarque: servDatos.FechaEmbarque,
					sPuertoEmbarque: servDatos.PuertoEmbarque,
					sIndicador: servDatos.Indicador,
					sCodigoUN: servDatos.CodigoUN,
					sTipoBulto: servDatos.TipoBulto,
					sNotificado: servDatos.Notificado,
					sTipoDocumentoTransporte: servDatos.TipoDocumentoTransporte,
					sVinVehiculos: servDatos.VinVehiculos,
					sDepositoTemporal: servDatos.DepositoTemporal,
					sNaturalezaCarga: servDatos.NaturalezaCarga,
					sCodModalidad: servDatos.CodModalidad,
					sCodTipoAlmacenamiento: servDatos.CodTipoAlmacenamiento,

					/*///Nuevos Campos*/

					//sConsignatarioCodigo: servDatos.ConsignatarioCodigo,
					sConsignatarioCodigo: servDatos.ConsignatarioCodigo.replace(/\s/g, ''), //lmora2020
					sConsignatarioDescripcion: servDatos.ConsignatarioDescripcion,
					sConsignatarioTelefono: servDatos.ConsignatarioTelefono,
					sConsignatarioDireccion: servDatos.ConsignatarioDireccion,
					sConsignatarioCorreo: servDatos.ConsignatarioCorreo,
					sConsignatarioTipoDocumento: servDatos.ConsignatarioTipoDocumento,

					sEmbarcadorCodigo: servDatos.EmbarcadorCodigo,
					sEmbarcadorDescripcion: servDatos.EmbarcadorDescripcion,
					sEmbarcadorTelefono: servDatos.EmbarcadorTelefono,
					sEmbarcadorDireccion: servDatos.EmbarcadorDireccion,
					sEmbarcadorCorreo: servDatos.EmbarcadorCorreo,
					sEmbarcadorTipoDocumento: servDatos.EmbarcadorTipoDocumento,

					sNotificadoCodigo: servDatos.NotificadoCodigo,
					sNotificadoDescripcion: servDatos.NotificadoDescripcion,
					sNotificadoTelefono: servDatos.NotificadoTelefono,
					sNotificadoDireccion: servDatos.NotificadoDireccion,
					sNotificadoCorreo: servDatos.NotificadoCorreo,
					sNotificadoTipoDocumento: servDatos.NotificadoTipoDocumento,

					sConsolidadorCodigo: servDatos.ConsolidadorCodigo,
					sConsolidadorTipoDocumento: servDatos.ConsolidadorTipoDocumento,
					sConsolidadorDescripcion: servDatos.ConsolidadorDescripcion,
					sConsolidadorDireccion: servDatos.ConsolidadorDireccion,
					sConsolidadorTelefono: servDatos.ConsolidadorTelefono,
					sConsolidadorCorreo: servDatos.ConsolidadorCorreo,
					sConsolidadorPuertoDescarga: servDatos.ConsolidadorPuertoDescarga,

					//Nuevos Campos
					sConsignatarioCodigoCampo: servDatos.ConsignatarioCodigoCampo,
					sEmbarcadorCodigoCampo: servDatos.EmbarcadorCodigoCampo,
					sNotificadoCodigoCampo: servDatos.NotificadoCodigoCampo,
					//

					iValorMercancia: servDatos.ValorMercancia,
					sValorMercanciaMoneda: servDatos.ValorMercanciaMoneda,

					sEntidadReguladoraMercPeligrosa: servDatos.EntidadReguladoraMercPeligrosa,

					sDestinacionCarga: servDatos.DestinacionCarga,

					iNroDetalle: servDatos.NroDetalle,
					sDAM: servDatos.DAM,
					
					sMarcas: servDatos.Marcas,
					iReceptorCargaId: servDatos.ReceptorCargaId,
					sReceptorCarga: servDatos.ReceptorCarga
						/*///*/
				}
			};
			return modDatos;
		},
		eliminarGABL: function (datos) {
			var servDatos = datos;
			var modDatos = {
				oResults: {
					aIds: []
				}
			};
			for (var i in servDatos) {
				modDatos.oResults.aIds.push(
					servDatos[i].Id
				);
			}
			return modDatos;
		},
		/////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	};
});