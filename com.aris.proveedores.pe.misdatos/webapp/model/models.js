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
                    ui: {
                        hasBankKeyColumn: false,
                        hasIBANColumn: false
                    },
                    Main: {
                        filter: {
                            cbSupplier: "",
                            cbSupplierText: "",
                            cbCodSupplier: "",
                            cbCodSupplierText: "",
                            cbSupplierCode: "",
                            cbSupplierCodeText: ""
                        }
                    },
                    oReporte: [],
                    oDetalleInit: {},
                    oDetalle: {},
                    oCabecera: {},
                    sIdioma: "esp"
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
                            "passwordLoginTime": "2ma025-05-21T02:20:07Z",
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
                                "familyName": "Interno"
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
                                "sText": this.getI18nText(context, "TxtProv01")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxtProv02")
                            },
                            {
                                "sKey": "3",
                                "sText": this.getI18nText(context, "TxtProv03")
                            },
                            {
                                "sKey": "4",
                                "sText": this.getI18nText(context, "TxtProv04")
                            }

                        ]
                    }
                };
                return oModel;
            },
            JsonProvRUC: function (context) {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "sKey": "1",
                                "sText": this.getI18nText(context, "TxtRUC01")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxtRUC02")
                            },
                            {
                                "sKey": "3",
                                "sText": this.getI18nText(context, "TxtRUC03")
                            },
                            {
                                "sKey": "4",
                                "sText": this.getI18nText(context, "TxtRUC04")
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
            JsonFacturacion: function (context) {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "sKey": "1",
                                "sText": this.getI18nText(context, "TxtFacturacion1")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxtFacturacion2")
                            }

                        ]
                    }
                };
                return oModel;
            },
            JsonMod: function (context) {
                var oModel = {
                    "d": {
                        "results": [
                            {
                                "sKey": "1",
                                "sText": this.getI18nText(context, "TxtMod1")
                            },
                            {
                                "sKey": "2",
                                "sText": this.getI18nText(context, "TxtMod2")
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
                                "txt1": "Proveedor01",
                                "txt2": "20421458354",
                                "txt3": "SAP0001",
                                "txt4": "AV. Argentina 3190",
                                "txt5": "pv01@pv01.com.pe",
                                "txt6": "192168598458",
                                "txt7": "BCP",
                                "txt8": "Omar Vera Apian",
                                "txt9": "987589642",

                            },
                            {
                                "txt1": "Proveedor02",
                                "txt2": "20421458564",
                                "txt3": "SAP0002",
                                "txt4": "Urb. Industrial 234 Lima",
                                "txt5": "pv01@pv02.com.pe",
                                "txt6": "193168534458",
                                "txt7": "Interbank",
                                "txt8": "Franco Galan",
                                "txt9": "986985317",
                            },
                            {
                                "txt1": "Proveedor03",
                                "txt2": "20333451394",
                                "txt3": "SAP0003",
                                "txt4": "Fernando Unger 398 La Victoria",
                                "txt5": "pv01@pv03.com.pe",
                                "txt6": "191168596699",
                                "txt7": "BBVA",
                                "txt8": "Luis Alberto Gamarra Fiestas",
                                "txt9": "907559812",
                            },
                            {
                                "txt1": "Proveedor04",
                                "txt2": "20458924734",
                                "txt3": "SAP0004",
                                "txt4": "Urb. La Estrella 585 Ate",
                                "txt5": "pv01@pv04.com.pe",
                                "txt6": "194444598458",
                                "txt7": "Scotiabank",
                                "txt8": "Roger Camayo",
                                "txt9": "987669922",
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
                                "txt1": "Proveedor01",
                                "txt2": "20421458354",
                                "txt3": "SAP0001",
                                "txt4": "AV. Argentina 3190 -Callao",
                                "txt5": "AV. Ramiro Priale 260 - Ate",
                                "txt6": "Casmiro Ulloa 589- Lince",
                                "txt7": "pv01@pv01.com.pe",
                                "txt8": "ad01@pv01.com.pe",
                                "txt9": "ad02@pv01.com.pe",
                                "txt10": "192168598458 - BCP",
                                "txt11": "02598564785 - BBVA",
                                "txt12": "103588452214 - Interbank",
                                "txt13": "Omar Vera Apian",
                                "txt14": "Jorge Fiestas ",
                                "txt15": "Luis Fernando Tume",
                                "txt16": "987589642",
                                "txt17": "995268459",
                                "txt18": "909835891"

                            },
                            {
                                "txt1": "Proveedor02",
                                "txt2": "20421458564",
                                "txt3": "SAP0002",
                                "txt4": "Urb. Industrial 234 Lima",
                                "txt5": "Av. Canta Gallo 589 - Huamantanga",
                                "txt6": "--",
                                "txt7": "pv01@pv02.com.pe",
                                "txt8": "mft01@pv02.com.pe",
                                "txt9": "--",
                                "txt10": "193168534458 - Interbank",
                                "txt11": "191568458655 - BCP",
                                "txt12": "--",
                                "txt13": "Franco Galan",
                                "txt14": "Julio Armas ",
                                "txt15": "--",
                                "txt16": "986985317",
                                "txt17": "995268111",
                                "txt18": "--"
                            },
                            {
                                "txt1": "Proveedor03",
                                "txt2": "20333451394",
                                "txt3": "SAP0003",
                                "txt4": "Fernando Unger 398 La Victoria",
                                "txt5": "--",
                                "txt6": "--",
                                "txt7": "pv03@pv03.com.pe",
                                "txt8": "--",
                                "txt9": "--",
                                "txt10": "191168596699 - BBVA",
                                "txt11": "--",
                                "txt12": "--",
                                "txt13": "Luis Alberto Gamarra Fiestas",
                                "txt14": "--",
                                "txt15": "--",
                                "txt16": "907559812",
                                "txt17": "--",
                                "txt18": "--"
                            },
                            {
                                "txt1": "Proveedor04",
                                "txt2": "20458924734",
                                "txt3": "SAP0004",
                                "txt4": "Urb. La Estrella 585 Ate",
                                "txt5": "Calle Capirona 689 - Chorrillos",
                                "txt6": "La Ensenada 9715 - SJM",
                                "txt7": "pv01@pv04.com",
                                "txt8": "osavala@pv04.com",
                                "txt9": "tosanvela@pv04.com",
                                "txt10": "194444598458 - Scotiabank",
                                "txt11": "01987535245 - BBVA",
                                "txt12": "1098547851412 - Interbank",
                                "txt13": "Roger Camayo",
                                "txt14": "Rosa Tume",
                                "txt15": "Rodolfo Zapata",
                                "txt16": "987669922",
                                "txt17": "967558747",
                                "txt18": "986726475"
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