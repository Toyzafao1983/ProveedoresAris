/* global moment:true */
sap.ui.define([
], function () {
	"use strict";
	return {
		idProyecto: "com.aris.proveedores.pe.misdatos",
		PaginaHome: "Main",
		IdApp: "Mis_Datos",
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