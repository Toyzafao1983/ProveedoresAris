sap.ui.define([
    "com/aris/proveedores/pe/calendario/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/resource/ResourceModel",
    "com/aris/proveedores/pe/calendario/model/models",
    "com/aris/proveedores/pe/calendario/model/formatter",
    "com/aris/proveedores/pe/calendario/services/Services",
    "com/aris/proveedores/pe/calendario/util/util",
    "com/aris/proveedores/pe/calendario/util/utilUI"
], (BaseController, Controller, ResourceModel, models, formatter, Services, util, utilUI) => {
    "use strict";
    var that;
    var tPortal = "", tRol = "";
    return BaseController.extend("com.aris.proveedores.pe.calendario.controller.View", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("View").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdFilterInit = "frgIdFilterInit";
            this._getPrueba();
           // this._onProbarSharePoint();
        },
        handleRouteMatched: function (bInit) {
            sap.ui.core.BusyIndicator.show(0);
            Promise.all([
                this._getUsers(), 
                this._getFechas()
            ]).then((values) => {
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");



                let oFechas = values[1];
                that.oModelProyect.setSizeLimit(99999999);
                that.oModelData.setSizeLimit(99999999);

                // Detectar portal
                let sURL = window.parent.location.href;
                if (sURL.includes("proveedores.pe")) { tPortal = "PROVEEDORES"; }
                let oUser = values[0].Resources[0];
                oUser.groups.forEach(element => {
                    let vRol = element.value;
                    if (vRol.includes(tPortal)) {
                        let aux = vRol.split("_");
                        tRol = aux[1];
                    }
                });

                // 🔎 Agrupación por Año -> MesNum -> Fechas
                let aData = oFechas.oResults || [];
                let oAgrupado = {};

                aData.forEach(item => {
                    let mes = parseInt(item.Period, 10);
                    let anio = parseInt(item.Yeear, 10);
                    let fecha = this._parseABAPDate(item.PaymentDate);

                    if (!oAgrupado[anio]) {
                        oAgrupado[anio] = { Anio: anio, Meses: {} };
                    }

                    if (!oAgrupado[anio].Meses[mes]) {
                        oAgrupado[anio].Meses[mes] = {

                            Fechas: []
                        };
                    }

                    oAgrupado[anio].Meses[mes].Fechas.push({
                        Day: fecha.toLocaleDateString("es-PE", {
                            day: "2-digit",
                            timeZone: "UTC"
                        }),
                        FullDate: fecha.toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            timeZone: "UTC"
                        })
                    });
                });

                // Pasar objeto agrupado a array
                let aAnios = Object.values(oAgrupado).map(oAnio => {
                    return {
                        Anio: oAnio.Anio,
                        Meses: Object.values(oAnio.Meses)
                    };
                });

                // Guardar en el modelo
                that.oModelData.setProperty("/Anios", aAnios);

                // Configurar idioma
                let sIdioma = that.getModel("oModelProyect").getProperty("/sIdioma");
                if (sIdioma == undefined) {
                    that._setLanguageModel("esp");
                } else {
                    that._setLanguageModel(sIdioma);
                }

                // Guardar información de usuario
                that.getModel("oModelUser").setProperty("/Information", values[0].Resources[0]);
                that.getModel("oModelUser").setProperty(
                    "/sNameComp",
                    values[0].Resources[0].name.givenName + " " + values[0].Resources[0].name.familyName
                );

                // Tabla Main
                let sComponentTable = "TableMainDesktop";
                if (!that.fragmentTable) {
                    that.fragmentTable = sap.ui.xmlfragment(
                        this.frgIdTableMain,
                        that.route + ".view.fragments." + sComponentTable,
                        that
                    );
                    this._byId("vbTableMain").addItem(that.fragmentTable);
                }

                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        _getFechas: function () {
            that = this;
            try {
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
                return new Promise(function (resolve, reject) {
                    let sUrl = "",
                        sNumPedido = "";
                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/PaymentSchedule?$format=json";
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/PaymentSchedule?$format=json";
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data;
                                resolve(oResp);
                            },
                            error: function (message) {
                                oResp.oResults = [];
                                resolve(oResp);
                            }
                        });
                    });

                });
            } catch (oError) {
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },
        onLanguageEsp: function () {
            this._setLanguageModel("esp");
        },

        onLanguageEng: function () {
            this._setLanguageModel("ing");
        },
        // para cambiar el idioma
        _setLanguageModel: function (langKey) {
            var bundleName;
            if (langKey === "esp") {
                bundleName = "com.aris.proveedores.pe.calendario.i18n.i18n_esp";
            } else if (langKey === "ing") {
                bundleName = "com.aris.proveedores.pe.calendario.i18n.i18n_ing";
            } else {
                return;
            }

            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleName: bundleName
            });

            // ✅ modelo en la vista (para bindings normales)
            this.getView().setModel(i18nModel, "i18n");

            this.getModel("oModelProyect").setProperty("/sIdioma", langKey);
        },

        _parseABAPDate: function (sABAPDate) {
            if (!sABAPDate) return null;
            let ms = parseInt(sABAPDate.replace(/[^0-9]/g, ""), 10);
            return new Date(ms);
        },
        _getSiteId: function () {
            return new Promise((resolve, reject) => {
                // Intento directo
                const urlDirect = "/SharePointAris/sites/arisindustrial.sharepoint.com:/sites/UA_AF";

                $.ajax({
                    url: urlDirect,
                    method: "GET",
                    success: (data) => {
                        resolve(data.id);
                    },
                    error: (err) => {

                        // Fallback: búsqueda
                        const urlSearch = "/SharePointAris/sites?search=UA_AF";
                        $.ajax({
                            url: urlSearch,
                            method: "GET",
                            success: (data) => {
                                if (data.value && data.value.length > 0) {
                                    const siteId = data.value[0].id;
                                    resolve(siteId);
                                } else {
                                    reject("❌ No se encontró el site UA_AF");
                                }
                            },
                            error: (err2) => {
                                reject(err2);
                            }
                        });
                    }
                });
            });
        },

        // 2) Obtener el driveId (biblioteca de documentos)
        _getDriveId: function (siteId) {
            return new Promise((resolve, reject) => {
                const url = `/SharePointAris/sites/${siteId}/drives`;

                $.ajax({
                    url: url,
                    method: "GET",
                    success: (data) => {
                        const drives = data.value || [];

                        // Buscar por nombre estándar (en ES = Documentos, en EN = Shared Documents)
                        const preferidos = ["Documentos", "Shared Documents", "Documents"];
                        const hit = drives.find(d => preferidos.includes(d.name)) || drives[0];

                        if (hit) {
                            resolve(hit.id);
                        } else {
                            reject("❌ No se encontró drive válido en el site");
                        }
                    },
                    error: (err) => {
                        reject(err);
                    }
                });
            });
        },

        // 3) Listar archivos de una carpeta dentro del drive
        _listarArchivos: function (siteId, driveId) {
            return new Promise((resolve, reject) => {
                // 📂 Ruta relativa dentro del drive
                const subPath = "AF_Sistemas/Documentos/Repositorio Apps/SAP Hana/Portal BTP/clientes/materiales";

                // Codificar espacios y caracteres especiales
                const safe = subPath.split("/").map(encodeURIComponent).join("/");

                const url = `/SharePointAris/sites/${siteId}/drives/${driveId}/root:/${safe}:/children`;

                $.ajax({
                    url,
                    method: "GET",
                    success: (data) => {
                        resolve(data.value || []);
                    },
                    error: (err) => {
                        reject(err);
                    }
                });
            });
        },

        // 4) Flujo de prueba encadenado (para llamar con un botón)
});
});