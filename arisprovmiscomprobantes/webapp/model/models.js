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
                var oModel = {
                    Main: {
                        filter: {
                            fUnidadNegocio: [],
                            fProveedor: [],
                            fReceptorPago: [],
                            fEstado: "",
                            fFechaComproFrom: null,
                            fFechaComproTo: null,
                            fFacturaSerie: "",
                            fFacturaCorrelativo: "",
                            fFechaEmision: null, 
                            fFactura: []
                        }
                    },
                    inputForm: {},
                    oReporte: [],
                    oDetalle: {},
                    oCabecera: {},
                    sIdioma: "esp",
                    documentos: [],
                    oFacturaLista: [], 
                    oUnidadNegocio: [],
                    oFacturaProveedor: []
                };

                return oModel;
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
                                "givenName": "",
                                "familyName": ""
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
            JsonState: function (context) {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "sKey": "1",
                                "sText": this.getI18nText(context, "TxtEstado1")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxtEstado2")
                            }

                        ]
                    }
                };
                return oModel;
            },
            JsonCondPago: function (context) {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "sKey": "1",
                                "sText": this.getI18nText(context, "TxConPago1")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxConPago2")
                            }

                        ]
                    }
                };
                return oModel;
            },
            JsonReporte: function () {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "txt0": "E001-00002345",
                                "txt1": "Factura",
                                "txt2": "Crédito",
                                "txt3": "accept",       // Icono positivo
                                "txt4": "decline",      // Icono negativo
                                "txt5": "pdf-attachment", // Icono PDF
                                "txt6": "Hugo Soler",
                                "txt7": "40184480",
                                "txt8": "30/12/2024",
                                "txt9": "USD",
                                "txt10": "1,035.00",
                                "txt11": "30/12/2024",
                                "txt12": "30/12/2024",
                                "txt13": "30/12/2024 18:08:01",
                                "txt14": "Angel Soler",
                                "txt15": "444233231",
                                "txtPDF": "documentos/facturaprueba.pdf"

                            },
                            {
                                "txt0": "E001-00002346",
                                "txt1": "Factura",
                                "txt2": "Contado",
                                "txt3": "accept",
                                "txt4": "decline",
                                "txt5": "pdf-attachment",
                                "txt6": "Juan Perez",
                                "txt7": "40887744",
                                "txt8": "02/01/2025",
                                "txt9": "USD",
                                "txt10": "750.00",
                                "txt11": "02/01/2025",
                                "txt12": "02/01/2025",
                                "txt13": "02/01/2025 10:15:00",
                                "txt14": "Marlon Estefo",
                                "txt15": "444232421",
                                "txtPDF": "documentos/facturaprueba.pdf"
                            }
                        ]
                    }
                };

                return oModel;
            },

            getI18nText: function (context, sText) {
                return context.oView.getModel("i18n") === undefined ? false : context.oView.getModel("i18n").getResourceBundle().getText(sText);
            },


        };

    });