/* global moment:true */
sap.ui.define([
], function () {
	"use strict";
	return {
		idProyecto: "com.aris.proveedores.pe.calendario",
		PaginaHome: "Main",
		IdApp: "Pedido_Compra",
		modelOdata: "modelOdata",
		root: "/",
		userApi: "API-USER-IAS",
		services: {
			//////////////////////////////////////////////////////////////////////
			//////////////////////////////////////////////////////////////////////
			RegistrarAuditoriaSap:"/Service/RegistrarAuditoriaSap/",
			getoDataEstandar:"/General/Estandar/ConsultarEstandarSimple/",
			postoDataEstandar:"/General/Estandar/InsertarEstandarSimple/"
		}
	};
});