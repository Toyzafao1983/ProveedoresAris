sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            createModelProyect: function () {
                var oData = {
                    Main: {
                        filter: {
                            cbSupplier: [],
                            cbSupplierText: [],
                            cbRuc: [],
                            cbRucText: [],
                            cbPedComp: [],
                            cbPedCompText: [],
                            cbCondPago: [],
                            cbCondPagoText: [],
                            cbState: [],
                            cbStateText: [],
                            cbSFacturacion: [],
                            sIconTerm: [],
                            cbModalidad: [],
                            sOrderOpenFrom: null,
                            sOrderOpenTo: null,
                            sDeliveryFrom: null,
                            sDeliveryTo: null,
                            cbProv: [],
                            cbProvText: [],
                            cbEbelp: [],
                            cbEbelpText: [],
                            cbMaterial: [],
                            cbMaterialText: []

                        }
                    },
                    oReporte: [],
                    oDetalle: [],
                    oCabecera: {},
                    sIdioma: "esp"
                };
                return new JSONModel(oData);
            },
            oModelUser: function () {
                let oModel = {
                    "schemas": [
                        "urn:ietf:params:scim:api:messages:2.0:ListResponse"
                    ],
                    "totalResults": 1,
                    "itemsPerPage": 100,
                    "Resources": [
                        {
                            "id": "P000178",
                            "userUuid": "1da90deb-d81a-4684-855a-90714c179f89",
                            "userName": "latencio",
                            "displayName": "mestefo",
                            "userType": "public",
                            "sourceSystem": "15",
                            "passwordStatus": "enabled",
                            "mailVerified": "TRUE",
                            "passwordPolicy": "https://accounts.sap.com/policy/passwords/sap/enterprise/1.0",
                            "passwordFailedLoginAttempts": "0",
                            "passwordLoginTime": "2025-05-21T02:20:07Z",
                            "loginTime": "2025-05-21T02:20:07Z",
                            "passwordSetTime": "2025-01-29T23:18:31Z",
                            "schemas": [
                                "urn:ietf:params:scim:schemas:core:2.0:User",
                                "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
                                "urn:sap:cloud:scim:schemas:extension:custom:2.0:User"
                            ],
                            "active": true,
                            "meta": {
                                "location": "https://azb1ikez3.accounts.ondemand.com/service/scim/Users/P000178",
                                "resourceType": "User",
                                "version": "1.0",
                                "created": "2025-01-29T22:44:19Z",
                                "lastModified": "2025-04-25T16:32:27Z"
                            },
                            "emails": [
                                {
                                    "value": "kestefo@ravaconsulting.com.pe",
                                    "primary": true
                                }
                            ],
                            "name": {
                                "givenName": "Usuario",
                                "familyName": "Interno"
                            },
                            "groups": [
                                {
                                    "value": "LAYT_INT_ADM",
                                    "$ref": "https://azb1ikez3.accounts.ondemand.com/service/scim/Groups/680c41e7ee8f9025895c5aab",
                                    "display": "LAYT_INT_ADM"
                                }
                            ],
                            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {}
                        }
                    ]
                }
                return oModel;
            },
            oModelUserExt: function () {
                let oModel = {
                    "schemas": [
                        "urn:ietf:params:scim:api:messages:2.0:ListResponse"
                    ],
                    "totalResults": 1,
                    "itemsPerPage": 100,
                    "Resources": [
                        {
                            "id": "P000178",
                            "userUuid": "1da90deb-d81a-4684-855a-90714c179f89",
                            "userName": "latencio",
                            "displayName": "msoler",
                            "userType": "public",
                            "sourceSystem": "15",
                            "passwordStatus": "enabled",
                            "mailVerified": "TRUE",
                            "passwordPolicy": "https://accounts.sap.com/policy/passwords/sap/enterprise/1.0",
                            "passwordFailedLoginAttempts": "0",
                            "passwordLoginTime": "2025-05-21T02:20:07Z",
                            "loginTime": "2025-05-21T02:20:07Z",
                            "passwordSetTime": "2025-01-29T23:18:31Z",
                            "schemas": [
                                "urn:ietf:params:scim:schemas:core:2.0:User",
                                "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
                                "urn:sap:cloud:scim:schemas:extension:custom:2.0:User"
                            ],
                            "active": true,
                            "meta": {
                                "location": "https://azb1ikez3.accounts.ondemand.com/service/scim/Users/P000178",
                                "resourceType": "User",
                                "version": "1.0",
                                "created": "2025-01-29T22:44:19Z",
                                "lastModified": "2025-04-25T16:32:27Z"
                            },
                            "emails": [
                                {
                                    "value": "kestefo@ravaconsulting.com.pe",
                                    "primary": true
                                }
                            ],
                            "name": {
                                "givenName": "Usuario",
                                "familyName": "Externo"
                            },
                            "groups": [
                                {
                                    "value": "LAYT_INT_EXT",
                                    "$ref": "https://azb1ikez3.accounts.ondemand.com/service/scim/Groups/680c41e7ee8f9025895c5aab",
                                    "display": "LAYT_INT_EXT"
                                }
                            ],
                            "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {}
                        }
                    ]
                }
                return oModel;
            },
            oModelPrueba: function () {
                let oModel = {}
                return oModel;
            },
            JsonProv: function (context) {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "sKey": "1",
                                "sText": this.getI18nText(context, "TxtProv1")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxtProv2")
                            }

                        ]
                    }
                };
                return oModel;
            },
            JsonState: function (context) {
                return {
                    d: {
                        results: [
                            { sKey: "Pendiente de atención", sText: this.getI18nText(context, "TxtEstado1") },
                            { sKey: "Entregado parcialmente", sText: this.getI18nText(context, "TxtEstado2") },
                            { sKey: "Entregado completamente", sText: this.getI18nText(context, "TxtEstado3") }
                        ]
                    }
                };
            },
            JsonIntercom: function (context) {
                return {
                    d: {
                        results: [
                            { sKey: "CFR", sText: "CFR" },
                            { sKey: "CIF", sText: "CIF" },
                            { sKey: "CIP", sText: "CIP" },
                            { sKey: "CPT", sText: "CPT" },
                            { sKey: "DAF", sText: "DAF" },
                            { sKey: "DAP", sText: "DAP" },
                            { sKey: "DAT", sText: "DAT" },
                            { sKey: "DDP", sText: "DDP" },
                            { sKey: "DDU", sText: "DDU" },
                            { sKey: "DEQ", sText: "DEQ" },
                            { sKey: "DES", sText: "DES" },
                            { sKey: "DPU", sText: "DPU" },
                            { sKey: "EXW", sText: "EXW" },
                            { sKey: "FAS", sText: "FAS" },
                            { sKey: "FCA", sText: "FCA" },
                            { sKey: "FH", sText: "FH" },
                            { sKey: "FOB", sText: "FOB" },
                            { sKey: "UN", sText: "UN" },
                        ]
                    }
                };
            },
            JsonFacturacion: function (context) {
                return {
                    d: {
                        results: [
                            { sKey: "Entregas pendientes de facturación", sText: this.getI18nText(context, "TxtFact1") },
                            { sKey: "Entregas facturadas", sText: this.getI18nText(context, "TxtFact2") }
                        ]
                    }
                };
            },
            JsonModalidad: function (context) {
                return {
                    d: {
                        results: [
                            { sKey: "Marítimo", sText: this.getI18nText(context, "TxtMod1") },
                            { sKey: "Aéreo", sText: this.getI18nText(context, "TxtMod2") },
                            { sKey: "Multimodal", sText: this.getI18nText(context, "TxtMod3") }
                        ]
                    }
                };
            },
            JsonReporte: function () {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "txt1": "Proveedor01",
                                "txt2": "PC0001",
                                "txt3": "25-02-2025",
                                "txt4": "Pendiente",
                                "txt5": "Pendiente",
                                "txt6": "3000",
                                "txt7": "USD",
                                "txt8": "2000",
                                "txt9": "3000",
                                "txt10": "Credito",
                                "txt11": "I0001",
                                "txt12": "Aereo",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "Proveedor02",
                                "txt2": "PC0002",
                                "txt3": "12-01-2025",
                                "txt4": "Parcial",
                                "txt5": "Pendiente",
                                "txt6": "10000",
                                "txt7": "USD",
                                "txt8": "5000",
                                "txt9": "5000",
                                "txt10": "Contado",
                                "txt11": "I0002",
                                "txt12": "Maritimo",
                                "txt13": "25-04-2025"
                            },
                            {
                                "txt1": "Proveedor01",
                                "txt2": "PC0003",
                                "txt3": "15-04-2025",
                                "txt4": "Atendido",
                                "txt5": "100% Facturado",
                                "txt6": "8000",
                                "txt7": "USD",
                                "txt8": "8000",
                                "txt9": "8000",
                                "txt10": "Credito",
                                "txt11": "I0003",
                                "txt12": "Maritimo",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "Proveedor02",
                                "txt2": "PC0004",
                                "txt3": "08-03-2025",
                                "txt4": "Pendiente",
                                "txt5": "Pendiente",
                                "txt6": "4500",
                                "txt7": "USD",
                                "txt8": "2000",
                                "txt9": "2000",
                                "txt10": "Contado",
                                "txt11": "I0004",
                                "txt12": "Aereo",
                                "txt13": "25-05-2025"
                            }
                        ]
                    }
                };
                return oModel;
            },
            JsonDetalle: function () {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "txt1": "SP0001",
                                "txt2": "Proveedor01",
                                "txt3": "PC0001",
                                "txt4": "Tela",
                                "txt5": "Tela para pantalones",
                                "txt6": "200",
                                "txt7": "150",
                                "txt8": "50",
                                "txt9": "Fardo",
                                "txt10": "120",
                                "txt11": "USD",
                                "txt12": "18000",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "SP0002",
                                "txt2": "Proveedor01",
                                "txt3": "PC0001",
                                "txt4": "Tela",
                                "txt5": "Tela camisera",
                                "txt6": "100",
                                "txt7": "50",
                                "txt8": "50",
                                "txt9": "Fardo",
                                "txt10": "50",
                                "txt11": "USD",
                                "txt12": "2500",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "SP0003",
                                "txt2": "Proveedor01",
                                "txt3": "PC0001",
                                "txt4": "Tela",
                                "txt5": "Tela para saco",
                                "txt6": "300",
                                "txt7": "150",
                                "txt8": "150",
                                "txt9": "fardo",
                                "txt10": "70",
                                "txt11": "USD",
                                "txt12": "10500",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "SP0004",
                                "txt2": "Proveedor01",
                                "txt3": "PC0001",
                                "txt4": "Hilo",
                                "txt5": "Hilo para terno",
                                "txt6": "400",
                                "txt7": "330",
                                "txt8": "70",
                                "txt9": "Carrete",
                                "txt10": "600",
                                "txt11": "USD",
                                "txt12": "198000",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "SP0005",
                                "txt2": "Proveedor02",
                                "txt3": "PC0002",
                                "txt4": "Quimico",
                                "txt5": "Quimico para ceramicas",
                                "txt6": "200",
                                "txt7": "100",
                                "txt8": "100",
                                "txt9": "saco",
                                "txt10": "200",
                                "txt11": "USD",
                                "txt12": "20000",
                                "txt13": "25-04-2025"
                            },
                            {
                                "txt1": "SP0006",
                                "txt2": "Proveedor02",
                                "txt3": "PC0002",
                                "txt4": "Quimico",
                                "txt5": "Quimico para fertilizantes",
                                "txt6": "40",
                                "txt7": "15",
                                "txt8": "25",
                                "txt9": "saco",
                                "txt10": "120",
                                "txt11": "USD",
                                "txt12": "1800",
                                "txt13": "25-04-2025"
                            },

                            {
                                "txt1": "SP0007",
                                "txt2": "Proveedor01",
                                "txt3": "PC0003",
                                "txt4": "Quimico",
                                "txt5": "Quimico para fumigacion",
                                "txt6": "240",
                                "txt7": "200",
                                "txt8": "40",
                                "txt9": "saco",
                                "txt10": "340",
                                "txt11": "USD",
                                "txt12": "68000",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "SP0008",
                                "txt2": "Proveedor01",
                                "txt3": "PC0003",
                                "txt4": "Quimico",
                                "txt5": "Quimico fertilizante",
                                "txt6": "500",
                                "txt7": "400",
                                "txt8": "100",
                                "txt9": "saco",
                                "txt10": "90",
                                "txt11": "USD",
                                "txt12": "36000",
                                "txt13": "25-03-2025"
                            },
                            {
                                "txt1": "SP0009",
                                "txt2": "Proveedor02",
                                "txt3": "PC0004",
                                "txt4": "Tela",
                                "txt5": "Tela para polos",
                                "txt6": "420",
                                "txt7": "100",
                                "txt8": "300",
                                "txt9": "fardo",
                                "txt10": "100",
                                "txt11": "USD",
                                "txt12": "10000",
                                "txt13": "25-05-2025"
                            },
                            {
                                "txt1": "SP0010",
                                "txt2": "Proveedor02",
                                "txt3": "PC0004",
                                "txt4": "Tela",
                                "txt5": "Tela para medias",
                                "txt6": "250",
                                "txt7": "100",
                                "txt8": "150",
                                "txt9": "fardos",
                                "txt10": "200",
                                "txt11": "USD",
                                "txt12": "20000",
                                "txt13": "25-05-2025"
                            },
                            {
                                "txt1": "SP0011",
                                "txt2": "Proveedor02",
                                "txt1": "PC0004",
                                "txt2": "Botones",
                                "txt3": "Botones para camisa",
                                "txt4": "100",
                                "txt7": "90",
                                "txt8": "10",
                                "txt5": "saco",
                                "txt6": "350",
                                "txt7": "USD",
                                "txt6": "31500",
                                "txt13": "25-05-2025"
                            }
                        ]
                    }
                };
                return oModel;
            },

            getI18nText: function (context, sText) {
                return context.oView.getModel("i18n") === undefined ? false : context.oView.getModel("i18n").getResourceBundle().getText(sText);
            },
            JsonCondPago: function (context) {
                return {
                    d: {
                        results: [
                            { sKey: "Factura 7 días", sText: this.getI18nText(context, "TxtCondPago1") },
                            { sKey: "Anticipo y 30 días de BL", sText: this.getI18nText(context, "TxtCondPago2") },
                            { sKey: "Factura 30 días", sText: this.getI18nText(context, "TxtCondPago3") },
                            { sKey: "BL 45 días", sText: this.getI18nText(context, "TxtCondPago4") },
                            { sKey: "Anticipo", sText: this.getI18nText(context, "TxtCondPago5") },
                            { sKey: "Anticipo y factura a 30 días", sText: this.getI18nText(context, "TxtCondPago6") },
                            { sKey: "BL 180 días", sText: this.getI18nText(context, "TxtCondPago7") },
                            { sKey: "BL 90 días", sText: this.getI18nText(context, "TxtCondPago8") },
                            { sKey: "Factura 60 días", sText: this.getI18nText(context, "TxtCondPago9") },
                            { sKey: "C.A.D. (Contra entrega de documentos)", sText: this.getI18nText(context, "TxtCondPago10") },
                            { sKey: "Aviso de mercadería lista", sText: this.getI18nText(context, "TxtCondPago11") },
                            { sKey: "BL 60 días", sText: this.getI18nText(context, "TxtCondPago12") },
                            { sKey: "BL 150 días", sText: this.getI18nText(context, "TxtCondPago13") },
                            { sKey: "Anticipo y aviso de mercadería lista", sText: this.getI18nText(context, "TxtCondPago14") },
                            { sKey: "Anticipo y CAD", sText: this.getI18nText(context, "TxtCondPago15") },
                            { sKey: "Factura 45 días", sText: this.getI18nText(context, "TxtCondPago16") },
                            { sKey: "Anticipo y 60 días de BL", sText: this.getI18nText(context, "TxtCondPago17") },
                            { sKey: "BL 120 días", sText: this.getI18nText(context, "TxtCondPago18") },
                            { sKey: "Anticipo y factura a 7 días", sText: this.getI18nText(context, "TxtCondPago19") },
                            { sKey: "Factura 90 días", sText: this.getI18nText(context, "TxtCondPago20") },
                            { sKey: "Factura 120 días", sText: this.getI18nText(context, "TxtCondPago21") }
                        ]
                    }
                };
            },

        };

    });
