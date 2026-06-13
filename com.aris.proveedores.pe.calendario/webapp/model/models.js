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
        createModelProyect: function(){
            var oModel = {
                Main: {
                    filter: {
                        sOrderOpenFrom: "",
                        sOrderOpenTo: "",
                        sDateOrder: "",
                        cbCondPago: "",
                        cbCondPagoText: "",
                        sIconTerm: "",
                        cbState: "",
                        cbStateText: "",
                        cbProv: "",
                        cbProvText: "",
                        cbSFacturacion: "",
                        cbModalidad:""
                    }
                },
                oReporte:[],
                oDetalle:{},
                oCabecera:{},
                sIdioma:"esp"
            };
            return oModel;
        },
        oModelUser: function(){
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
        oModelUserExt: function(){
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
        oModelPrueba: function(){
            let oModel = { }
            return oModel;
        },
         JsonProv: function(context){
            var oModel = {
                "d":{
                    "results": [
                        {
                            "sKey": "1",
                            "sText": this.getI18nText(context,"TxtProv1")
                        },
                        {
                            "sKey": "2",
                            "sText": this.getI18nText(context,"TxtProv2")
                        }
            
                    ]
                }
            };
            return oModel;
        },
        JsonState: function(context){
            var oModel = {
                "d":{
                    "results": [
                        {
                            "sKey": "1",
                            "sText": this.getI18nText(context,"TxtEstado1")
                        },
                        {
                            "sKey": "2",
                            "sText": this.getI18nText(context,"TxtEstado2")
                        },
                        {
                            "sKey": "3",
                            "sText": this.getI18nText(context,"TxtEstado3")
                        }
            
                    ]
                }
            };
            return oModel;
        },
        JsonCondPago: function(context){
            var oModel = {
                "d":{
                    "results": [
                        {
                            "sKey": "1",
                            "sText": this.getI18nText(context,"TxConPago1")
                        },
                        {
                            "sKey": "2",
                            "sText": this.getI18nText(context,"TxConPago2")
                        }
            
                    ]
                }
            };
            return oModel;
        },
        JsonFacturacion: function(context){
            var oModel = {
                "d":{
                    "results": [
                        {
                            "sKey": "1",
                            "sText": this.getI18nText(context,"TxtFacturacion1")
                        },
                        {
                            "sKey": "2",
                            "sText": this.getI18nText(context,"TxtFacturacion2")
                        }
            
                    ]
                }
            };
            return oModel;
        },
        JsonMod: function(context){
            var oModel = {
                "d":{
                    "results": [
                        {
                            "sKey": "1",
                            "sText": this.getI18nText(context,"TxtMod1")
                        },
                        {
                            "sKey": "2",
                            "sText": this.getI18nText(context,"TxtMod2")
                        }
            
                    ]
                }
            };
            return oModel;
        },
        JsonReporte: function(){
            var oModel = {
                "d":{
                    "results":[
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
        JsonDetalle: function(){
            var oModel = {
                "d":{
                    "results":[
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

        getI18nText: function (context,sText) {
			return context.oView.getModel("i18n") === undefined ? false : context.oView.getModel("i18n").getResourceBundle().getText(sText);
		},
        
    };

});
