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
                    bEnableCatalogs: false,
                    filter: {
                        sSupplier: "",
                        cbSupplier: [],
                        cbSupplierText: [],
                        sNumberDocumentFact: "",
                        sDocumentExercise: "",
                        sRazonSocial: "",
                        cbRazonSocial: [],
                        sOrder: "",
                        cbOrdenFilter: [],
                        cbRazonSocialText: [],
                        sCompAssociated : "",
                        cbCompAssociated : [],
                        cbState:[],
                        sStateInit:"",
                        sAssociatedReceipt: "",
                        sCompanyCod: "",
                        cbCompany: [],
                        showSeparationDates: false
                    }
                },
                oReporte:[],
                sIdioma:"esp",
                documentos: [],
                cond: {
                    bShowOrigen: false,
                    bShowFlete: false,
                    bShowSeguro: false,
                    sDescOrigen: "",
                    sDescFlete: "",
                    sDescSeguro: ""
                },
                req: {
                    bViajeRequired: false,
                    bShowDatosViajeButton: false,
                    aIncoterms: []
                },
                oCabecera:{
                    bFormEditable : false,
                    sFormFechaFactura : "",
                    sFormClaseDocumento : "",
                    sFormClaseDocumentoText : "",
                    sFormNumeroFactura : "",
                    sFormImporteFactura : "",
                    sFormFechaBase : "",
                    sFormFechaContabilizacion : "",
                    sFormMoneda : "",
                    sFormCondicionPago : "",
                    sFormCondicionPagoOrderDescrip: "",
                    sFormCondicionPagoOrder:"",
                    sFormEstadoCodigo : "",
                    sFormEstadoRegistro : "",
                    sEstadosOrder:"",
                    sEstadoCodigo: "",
                    sEstadoDescripcion: "",
                    sMoneda : "",
                    sRuc : "",
                    sRazonSocial : "",
                    sFactura : "",
                    sCompany: "",
                    Company: "",
                    CONDPAGO: ""
                },
                oDetalle:[],
                oDetalleTotal:[],
                sDetalleSubtTotal: "0.00",
                sDetalleGastoOrigen: "0.00",
                sDetalleFleteInternacional: "0.00",
                sDetalleSeguro: "0.00",
                sDetalleGastosAdicionales: "0.00",
                sTotal: "0.00",
                jDatosCarga: {
                    oBultos: [],
                    oContenido: []
                },
                jDatosViaje: {
                    cbModalidad: "",
                    cbModalidadText: "",
                    sViajeNave: "",
                    sViajeNumBL: "",
                    cbTipoEmision: "",
                    cbTipoEmisionText: "",
                    sPaisEmbarque: "",
                    sPuertaEmbarque: "",
                    sFechaETD: "",
                    sPaisDesembarque: "",
                    sPuertaDesembarque: "",
                    sFechaETA: "",
                },
                jDatosAdjuntos:{
                    cbTipDocument : "",
                    sTipDocumentText : ""
                },
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
                        "displayName": "",
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
                            "givenName": "Kassiel",
                            "familyName": "Estefo"
                        },
                        "groups": [
                            {
                                "value": "LAYT_INT_ENTREGA_MAQUINA",
                                "$ref": "https://azb1ikez3.accounts.ondemand.com/service/scim/Groups/680c41e7ee8f9025895c5aab",
                                "display": "LAYT_INT_ENTREGA_MAQUINA"
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
        oModelPrueba: function(){
            let oModel = { }
            return oModel;
        },

        oMapReporte: function(oResult){
            let oResolved = [];
            oResult.array.forEach(function(element) {
                let jElement = {
                    "txt25": "HES",           
                    "txt1": "1001091316",    
                    "txt14": "10-17-2025",         
                    "txt19": "Talma S.A.C",   
                    "txt4": "345665452334",    // Texto
                    "txt24": "Cuotas",             // Texto
                    "txt15": "E001-00002343", // Texto
                    "txt16": "$ 1,2000.00",    // ObjectNumber
                    "txt27": "Success",     // Estado ObjectNumber
                    "txt26": "Facturado",    // InfoLabel 2
                    "sEjericio": element.EJERCICIO  // Fecha/hora
                }
                oResolved.push(jElement)
            });
            var oModel = {
                "d":{
                    "results":[
                    {
                        "txt25": "HES",           // InfoLabel 1
                        "txt1": "1001091316",    // Link
                        "txt14": "10-17-2025",          // Año
                        "txt19": "Talma S.A.C",   // Texto
                        "txt4": "345665452334",    // Texto
                        "txt24": "Cuotas",             // Texto
                        "txt15": "E001-00002343", // Texto
                        "txt16": "$ 1,2000.00",    // ObjectNumber
                        "txt27": "Success",     // Estado ObjectNumber
                        "txt26": "Facturado",    // InfoLabel 2
                        "txt23": "6/01/25 10:59"  // Fecha/hora
                    },
                    {
                        "txt25": "MIGO",
                        "txt1": "1001091317",
                        "txt14": "10-17-2025",
                        "txt19": "Alicorp S.A.C",
                        "txt4": "34566545331",
                        "txt24": "Adelantado",
                        "txt15": "E001-00002344",
                        "txt16": "$ 1,035.00",
                        "txt27": "Success",
                        "txt26": "Pend. Facturación",
                        "txt23": "6/01/25 10:59"
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
                        "txt25": "HES",           // InfoLabel 1
                        "txt1": "1001091316",    // Link
                        "txt14": "10-17-2025",          // Año
                        "txt19": "Talma S.A.C",   // Texto
                        "txt4": "345665452334",    // Texto
                        "txt24": "Cuotas",             // Texto
                        "txt15": "E001-00002343", // Texto
                        "txt16": "$ 1,2000.00",    // ObjectNumber
                        "txt27": "Success",     // Estado ObjectNumber
                        "txt26": "Facturado",    // InfoLabel 2
                        "txt23": "6/01/25 10:59"  // Fecha/hora
                    },
                    {
                        "txt25": "MIGO",
                        "txt1": "1001091317",
                        "txt14": "10-17-2025",
                        "txt19": "Alicorp S.A.C",
                        "txt4": "34566545331",
                        "txt24": "Adelantado",
                        "txt15": "E001-00002344",
                        "txt16": "$ 1,035.00",
                        "txt27": "Success",
                        "txt26": "Pend. Facturación",
                        "txt23": "6/01/25 10:59"
                    }
                 ]
               }  
            };
            return oModel;
        },
         JsonCabecera: function(){
            var oModel = {
                "d":{
                    "results":[
                    {
                        "txt1": "HES",           // InfoLabel 1
                        "txt2": "1001091316",    // Link
                        "txt3": "10-17-2025",          // Año
                        "txt4": "Talma S.A.C",   // Texto
                        "txt5": "345665452334",    // Texto
                        "txt6": "Cuotas",             // Texto
                        "txt7": "E001-00002343", // Texto
                        "txt8": "$ 1,2000.00",    // ObjectNumber
                        "txt9": "Success",     // Estado ObjectNumber
                        "txt10": "Facturado",    // InfoLabel 2
                        "txt11": "6/01/25 10:59"
                    },
                    {
                        "txt1": "MIGO",
                        "txt2": "1001091317",
                        "txt3": "10-17-2025",
                        "txt4": "Alicorp S.A.C",
                        "txt5": "34566545331",
                        "txt6": "Adelantado",
                        "txt7": "E001-00002344",
                        "txt8": "$ 1,035.00",
                        "txt9": "Success",
                        "txt10": "Pend. Facturación",
                        "txt11": "6/01/25 10:59"
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
                        "txt25": "HES",           // InfoLabel 1
                        "txt1": "1001091316",    // Link
                        "txt14": "10-17-2025",          // Año
                        "txt19": "Talma S.A.C",   // Texto
                        "txt4": "345665452334",    // Texto
                        "txt24": "Cuotas",             // Texto
                        "txt15": "E001-00002343", // Texto
                        "txt16": "$ 1,2000.00",    // ObjectNumber
                        "txt27": "Success",     // Estado ObjectNumber
                        "txt26": "Facturado",    // InfoLabel 2
                        "txt23": "6/01/25 10:59"  // Fecha/hora
                    },
                    {
                        "txt25": "MIGO",
                        "txt1": "1001091317",
                        "txt14": "10-17-2025",
                        "txt19": "Alicorp S.A.C",
                        "txt4": "34566545331",
                        "txt24": "Adelantado",
                        "txt15": "E001-00002344",
                        "txt16": "$ 1,035.00",
                        "txt27": "Success",
                        "txt26": "Pend. Facturación",
                        "txt23": "6/01/25 10:59"
                    }
                 ]
               }  
            };
            return oModel;
        },

         JsonTipDocument: function(context){
            var oModel = {
                "d":{
                    "results": [
                        {
                            "sKey": "1",
                            "sText": this.getI18nText(context,"TxtTipDocument1")
                        },
                        {
                            "sKey": "2",
                            "sText": this.getI18nText(context,"TxtTipDocument2")
                        },
                    ]
                }
            };
            return oModel;
        },

        // Paises de Embarque
        JsonPaiseEmb: function (context) {
            const aCodes = [
                "AD","AE","AF","AG","AI","AL","AM","AO","AQ","AR","AS","AT","AU",
                "AW","AX","AZ","BA","BB","BD","BE","BF","BG","BH","BI","BJ","BL","BM","BN","BO","BQ",
                "BR","BS","BT","BV","BW","BY","BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL","CM",
                "CN","CO","CR","CU","CV","CW","CX","CY","CZ","DE","DJ","DK","DM","DO","DZ","EC","EE",
                "EG","EH","ER","ES","ET","FI","FJ","FK","FM","FO","FR","GA","GB","GD","GE","GF","GG",
                "GH","GI","GL","GM","GN","GP","GQ","GR","GS","GT","GU","GW","GY","HK","HM","HN","HR",
                "HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR","IS","IT","JE","JM","JO","JP","KE",
                "KG","KH","KI","KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC","LI","LK","LR","LS",
                "LT","LU","LV","LY","MA","MC","MD","ME","MF","MG","MH","MK","ML","MM","MN","MO","MP",
                "MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ","NA","NC","NE","NF","NG","NI","NL",
                "NO","NP","NR","NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL","PM","PN","PR","PS",
                "PT","PW","PY","QA","RE","RO","RS","RU","RW","SA","SB","SC","SD","SE","SG","SH","SI",
                "SJ","SK","SL","SM","SN","SO","SR","SS","ST","SV","SX","SY","SZ","TC","TD","TF","TG",
                "TH","TJ","TK","TL","TM","TN","TO","TR","TT","TV","TW","TZ","UA","UG","UM","US","UY",
                "UZ","VA","VC","VE","VG","VI","VN","VU","WF","WS","YE","YT","ZA","ZM","ZW"
            ];

            return {
                d: {
                results: aCodes.map(code => ({
                    sKey: code,
                    sText: this.getI18nText(context, "country." + code)
                }))
                }
            };
        },
        JsonPuertosEmb: function (context) {
            const aCodes = [
                "DEBREMERHAVEN","DEFRANCFORT","DEHAMBURGO",
                "SAKINGABDULAZIZPORT",
                "ARBUENOSAIRES",
                "AWBARCADERA",
                "BBBRIGDETOWN",
                "BEAMBERES",
                "BRITAJAI","BRITAPOA","BRPARANAGUA","BRSANTOS","BRVIRACOPOS","BRRIODEJANEIRO",
                "CAQUEBEC",
                "CLANTOFAGASTA","CLARICA","CLIQUIQUE","CLSANANTONIO","CLSANVICENTE","CLSANTIAGO","CLVALPARAISO",
                "CNBAOTOU","CNCHANGZHOU","CNDALIAN","CNFANGCHENG","CNHONGKONG","CNINTTONGREN","CNJIAOXIN","CNNINGBO",
                "CNQINGDAO","CNSHANDONG","CNSHANGHAI","CNSHEKOU","CNTAICANG","CNTIANJIN","CNWUHAN","CNXIAMEN",
                "CNXINGANG","CNZHANGJIAGANG",
                "COBARRANQUILLA","COBOGOTA","COBUENAVENTURA","COCARTAGENA",
                "KRBUSAN","KRINCHEON","KRPYEONGTAEK",
                "CRCALDERA","CRLIMON",
                "HRDUBROVNIK",
                "AEJEBELALI",
                "ECGUAYAQUIL","ECMANTA","ECQUITO",
                "SVACAJUTLA",
                "SIKOPER",
                "ESALGECIRAS","ESBARCELONA","ESCASTELLON","ESVALENCIA",
                "GTQUETZAL",
                "HTCAPHAITIEN","HTLAFITO","HTPRINCIPE",
                "HNCORTES","HNSANLORENZO",
                "INCHENNAI","INNHAVASHEVA",
                "IDHUSEINSASTRANEGARA",
                "ILASHDOD","ILEILAT",
                "ITGENOVA","ITLASPEZIA","ITMILAN","ITMILANMALPENSA",
                "JMKINGSTON",
                "LVRIGA",
                "MXENSENADA","MXLAZAROCARDENAS","MXMANZANILLO","MXVERACRUZ",
                "NICORINTO",
                "NLROTERDAM","NLAMSTERDAM",
                "PABALBOA","PACRISTOBAL","PAMANZANILLO","PARODMAN",
                "PECALLAO","PECHANCAY","PEPAITA",
                "PRSANJUAN",
                "GBLONDRES","GBLONDRESGATEWAY",
                "DOCAUCEDO","DOHAINA",
                "RUSANPETERSBURGO",
                "ZAJOHANNESBURGO",
                "SRPARAMARIBO",
                "THLAEMCHABANG",
                "TWKAOHSIUNG",
                "TRALIAGA","TRAMBARLI","TRGEBZE",
                "UYMONTEVIDEO",
                "USATLANTAGE","USDAYTON","USDETROIT","USEVERGLADES","USHOUSTON","USLONGBEACHCL","USLOSANGELES","USMIAMI",
                "USNEWYORK","USNORFOLK","USSAVANNAH","USWESTBASIN",
                "VECABELLO","VELAGUAIRA",

                // Aeropuertos
                "ARPISTARINI",
                "AUKINGSFORDSMITH",
                "BOELALTO","BOLAPAZ","BOVIRUVIRU",
                "BRBRASILIA","BRGALEAO","BRGOIABEIRAS","BRLONDRINA","BRNAVEGANTES","BRSALGADOFILHO","BRSAOPAULOGUARULHOS",
                "CALESAGE",
                "CLMATAVERI","CLSANTIAGOA",
                "CNSHANGAI","CNSHENZHEN","CNTIANJINBINHAI",
                "COELDORADO","COMATECANA",
                "CRJUANSANTAMARIA",
                "CZPRAGA",
                "DEDUSSELDORF","DEFRANKFURT",
                "UYCARRASCO",
                "USORLANDO","USOHARE","USMIAMIA","USJFKENNEDY","USCHARLOTTE",
                "TRESTAMBUL",
                "ROBUCAREST",
                "PTPORTOSANTO","PTLISBOA","PTOPORTO",
                "PRLUISMUNOZMARIN","PRCABOROJO",
                "PEJORGECHAVEZ",
                "NIAUGUSTOSANDINO",
                "MXPLAYADEORO","MXVERACRUZA","MXCIUDADDEMEXICO",
                "KRSINCHEON",
                "JPOSAKA",
                "ITNAPOLES","ITMILANA",
                "ESELPRAT","ESMADRID","ESTOLEDO",
                "FRPARISA","FACHARLESG",
                "GBHEATHROW",
                "ILBENGURION",
                "INCHENNAITA"
            ];

            return {
                d: {
                results: aCodes.map(code => ({
                    sKey: code,
                    sText: this.getI18nText(context, "port." + code)
                }))
                }
            };
            },


        getI18nText: function (context,sText) {
			return context.oView.getModel("i18n") === undefined ? false : context.oView.getModel("i18n").getResourceBundle().getText(sText);
		},
        
    };

});