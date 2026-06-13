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
                        fNameSupplier: [],                  // Nombre de proveedor
                        fSupplier: [],                      // Código de proveedor
                        sNotification: [],                  // Estado
                        aRequestForQuotationSelected: [],
                        fCreationDate: "",
                        fRequestForQuotationFrom: "",
                        fRequestForQuotationTo: "",
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
                        "displayName": "hsoler",
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
                            "givenName": "Hugo",
                            "familyName": "Soler"
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
                            "givenName": "Hugo",
                            "familyName": "Soler"
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
        JsonReporte: function(){
            var oModel = {
                "d":{
                    "results":[
                        {
                            "txt0": "Cod001",
                            "txt1": "PM0001",
                            "txt2": "03/10/2024",
                            "txt3": "Contado",
                            "txt4": "IN001",
                            "txt5": "Cotizado",
                            "priceUnit": "hestefo",
                            "txt7": "04/11/2024",
                            "txt8": "Humberto Estefo",
                            "txt9": "OF0001",
                            "txt10": "",
                            "txt11": "EXW",
                        },
                        {
                            "txt0": "Cod002",
                            "txt1": "PM0002",
                            "txt2": "13/03/2024",
                            "txt3": "Contado",
                            "txt4": "IN002",
                            "txt5": "Cotizado",
                            "priceUnit": "hsoler",
                            "txt7": "13/04/2024",
                            "txt8": "Hugo Soler",
                            "txt9": "OF0002",
                            "txt10": "",
                            "txt11": "FCA",
                        },
                        {
                            "txt0": "Cod003",
                            "txt1": "PM0003",
                            "txt2": "18/07/2024",
                            "txt3": "Credito",
                            "txt4": "IN003",
                            "txt5": "Cotizado",
                            "priceUnit": "hsoler",
                            "txt7": "18/08/2024",
                            "txt8": "Marlon Estefo",
                            "txt9": "OF0003",
                            "txt10": "",
                            "txt11": "CPT",
                        },
                        {
                            "txt0": "Cod003",
                            "txt1": "PM0004",
                            "txt2": "01/01/2025",
                            "txt3": "Contado",
                            "txt4": "IN004",
                            "txt5": "Pend. Cotización",
                            "priceUnit": "hsoler",
                            "txt7": "01/02/2025",
                            "txt8": "Hugo Soler",
                            "txt9": "OF0004",
                            "txt10": "",
                            "txt11": "EXW",
                            
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
                            "txt1": "PM0001",
                            "txt2": "Tela",
                            "txt3": "Tela para pantalones",
                            "txt4": "150",
                            "txt5": "Fardo",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                            


                        },
                        {
                            "txt1": "PM0001",
                            "txt2": "Tela",
                            "txt3": "Tela camisera",
                            "txt4": "100",
                            "txt5": "Fardo",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },
                        {
                            "txt1": "PM0001",
                            "txt2": "Tela",
                            "txt3": "Tela para saco",
                            "txt4": "80",
                            "txt5": "fardo",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },
                        {
                            "txt1": "PM0001",
                            "txt2": "Hilo",
                            "txt3": "Hilo para terno",
                            "txt4": "400",
                            "txt5": "Carrete",
                            "priceUnit": "",
                            "txt7": "SOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },
                        {
                            "txt1": "PM0002",
                            "txt2": "Quimico",
                            "txt3": "Quimico para ceramicas",
                            "txt4": "200",
                            "txt5": "saco",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },
                        {
                            "txt1": "PM0002",
                            "txt2": "Quimico",
                            "txt3": "Quimico para fertilizantes",
                            "txt4": "40",
                            "txt5": "saco",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },
                        
                        {
                            "txt1": "PM0003",
                            "txt2": "Quimico",
                            "txt3": "Quimico para fumigacion",
                            "txt4": "240",
                            "txt5": "saco",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },
                        {
                            "txt1": "PM0003",
                            "txt2": "Quimico",
                            "txt3": "Quimico fertilizante",
                            "txt4": "500",
                            "txt5": "saco",
                            "priceUnit": "",
                            "txt7": "DOL",
                            "txt8": "Central",
                            "cantCotizada": "",
                            "Discount": "",
                            "SubTotal": "",
                        },

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