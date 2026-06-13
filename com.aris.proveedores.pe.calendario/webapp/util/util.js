sap.ui.define([
    "./utilResponse",
    "./utilController",
    "./utilFormatter",
    "./utilHttp",
    "./utilUI",
    "./utilValidation",
    "./utilAPI",
	"./utilEnvioDatos",
	"./utilMoldearDatos",
    "./utilMetodos",
    "./utilCreateView"
], function(utilResponse,utilController,utilFormatter,utilHttp,utilUI,utilValidation,utilAPI,utilEnvioDatos,utilMoldearDatos,utilMetodos,utilCreateView) {
    "use strict";
    return {
        response: utilResponse,
        controller: utilController,
        http:  utilHttp,
        formatter: utilFormatter,
        ui: utilUI,
        validation: utilValidation,
        api: utilAPI,
        envioDatos:utilEnvioDatos,
        moldearDatos:utilMoldearDatos,
        met:utilMetodos,
        createView:utilCreateView
    };
});