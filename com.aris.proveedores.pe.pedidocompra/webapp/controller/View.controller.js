sap.ui.define([
    "com/aris/proveedores/pe/pedidocompra/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/resource/ResourceModel",
    "com/aris/proveedores/pe/pedidocompra/model/models",
    "com/aris/proveedores/pe/pedidocompra/model/formatter",
    "com/aris/proveedores/pe/pedidocompra/services/Services",
    "com/aris/proveedores/pe/pedidocompra/util/util",
    "com/aris/proveedores/pe/pedidocompra/util/utilUI"
], (BaseController, Controller, ResourceModel, models, formatter, Services, util, utilUI) => {
    "use strict";
    var that;
    var sNumProv = "";
    var sRucProv = "";
    return BaseController.extend("com.aris.proveedores.pe.pedidocompra.controller.View", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("View").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdFilterInit = "frgIdFilterInit";
            this.oFilterBar = this.byId("idFilterBar");

            if (this.oFilterBar) {
                this.oFilterBar.attachFilterChange(this._onFilterBarChange, this);
                this.oFilterBar.attachCancel(this._onPressClear, this);
                this.oFilterBar.attachAfterVariantLoad(this._onPressClear, this);
            }
        },

        handleRouteMatched: function (bInit) {
            sap.ui.core.BusyIndicator.show(0)
            Promise.all([this._getUsers()]).then(async (values) => {
                //this._setLanguageModel("esp");
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");
                //prueba
                this._getState("/oFiltroState");
                this._getFacturacion("/oFiltroFacturacion");
                this._getIntercom("/oFiltroIntercom");
                this._getModalidad("/oFiltroModalidad");
                this._GetFiltroCondPago("/oFiltroCondPago");


                that.oModelProyect.setSizeLimit(99999999);
                that.oModelData.setSizeLimit(99999999);
                let oUser = values[0]?.Resources?.[0] || {};
                const oUserProfile = that._applyProveedorUserProfile(oUser);

                const bRolInterno = oUserProfile.bIsInterno;
                const bEsExterno = oUserProfile.bIsExtAyc;
                const oModelProyect = that.getModel("oModelProyect");
                const oModelUser = that.getModel("oModelUser");

                sNumProv = "";
                sRucProv = "";

                if (!bRolInterno && !bEsExterno) {
                    sap.ui.core.BusyIndicator.hide(0);
                    sap.m.MessageBox.error("El usuario no tiene configurado customAttribute4 ni customAttribute5 en IAS.");
                    return;
                }
                sNumProv = oUserProfile.sExtBP;


                oModelUser.setProperty("/sNumProv", sNumProv);
                oModelUser.setProperty("/sExtBP", sNumProv);
                oModelUser.setProperty("/sRucProv", "");

                if (bEsExterno && sNumProv) {
                    let sResolvedRuc = "";

                    try {
                        const oRucResp = await this._getRucProveedor(sNumProv);

                        if (
                            oRucResp &&
                            oRucResp.sEstado === "S" &&
                            Array.isArray(oRucResp.oResults) &&
                            oRucResp.oResults.length > 0
                        ) {
                            const oProv = oRucResp.oResults[0] || {};

                            sResolvedRuc =
                                oProv.TaxID ||
                                oProv.TaxID1 ||
                                oProv.TaxID2 ||
                                oProv.Ruc ||
                                "";
                        }

                        if (!sResolvedRuc && /^\d{11}$/.test(sNumProv)) {
                            sResolvedRuc = sNumProv;
                        }
                    } catch (e) {
                    }

                    if (!sResolvedRuc) {
                        sap.m.MessageBox.error("No se pudo resolver el RUC del proveedor a partir del BP del usuario.");
                        sap.ui.core.BusyIndicator.hide(0);
                        return;
                    }

                    sRucProv = sResolvedRuc;
                    oModelUser.setProperty("/sRucProv", sRucProv);

                    const jFilter = oModelProyect.getProperty("/Main/filter") || {};
                    jFilter.cbRuc = [sRucProv];
                    jFilter.cbRucText = [sRucProv];
                    oModelProyect.setProperty("/Main/filter", jFilter);
                }

                let sIdioma = that.getModel("oModelProyect").getProperty("/sIdioma");
                if (sIdioma == undefined) {
                    that._setLanguageModel("esp");
                } else {
                    that._setLanguageModel(sIdioma);
                }
                if (bEsExterno && sRucProv) {
                    that.getModel("oModelUser").setProperty("/Information/Ruc", sRucProv);
                }

                that.getModel("oModelUser").setProperty(
                    "/sNameComp",
                    ((oUser.name && oUser.name.givenName) || "") + " " + ((oUser.name && oUser.name.familyName) || "")
                );

                //Tabla del Main
                let sComponentTable = "";
                sComponentTable = "TableMainDesktop";
                if (!that.fragmentTable) {
                    that.fragmentTable = sap.ui.xmlfragment(this.frgIdTableMain, that.route + ".view.fragments." + sComponentTable, that);
                    this._byId("vbTableMain").addItem(that.fragmentTable);
                }

                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        _onPressNavigateDetail: function (oEvent) {

            let oSource = oEvent.getSource();
            let oParentRow = oSource.getParent();
            let jRow = oParentRow.getBindingContext("oModelProyect");
            let jData = jRow.getObject();
            that.oRouter.navTo("Detail", {
                app: jData.Ebeln
            });
        },

        onLanguageEsp: function () {
            this.getOwnerComponent().getModel("oModelProyect").setProperty("/sIdioma", "esp");
            this._applyLanguage("esp");
        },

        onLanguageEng: function () {
            this.getOwnerComponent().getModel("oModelProyect").setProperty("/sIdioma", "ing");
            this._applyLanguage("ing");
        },

        _onPressExportRespaldo: function () {
            var sIndicador = "ReporteMain";
            var oReporte = this.getModel("oModelProyect").getProperty("/oReporte");
            if (this.isEmpty(oReporte)) {
                this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
                return;
            }
            var sAutorExcel = "MESTEFO";
            that.fnExportarExcel(oReporte, [], [], sAutorExcel, sIndicador)
        },
        _GetFiltroProv: function (sValue, sTargetPath) {
            if (!sValue || sValue.length < 2) {
                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                return;
            }

            const buildUrl = (filterExp) => {
                const sSelect = "$select=Bpname";
                const sTop = "$top=3000";
                const sExpand = "$expand=toPurOrdItems";
                let sPath;

                if (that.local) {
                    sPath = `/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sSelect}&${sExpand}&$format=json&sap-language=ES`;
                    return this.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    sPath = jQuery.sap.getModulePath(that.route) +
                        `/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sSelect}&${sExpand}&$format=json&sap-language=ES`;
                    return sPath;
                }
            };

            const sUrl = buildUrl(`substringof('${sValue.toUpperCase()}',toupper(Bpname))`);
            Services.getoDataERPSync(this, sUrl, function (result) {
                util.response.validateAjaxGetERPNotMessage(result, {
                    success: function (oData) {
                        const results =
                            Array.isArray(oData.data) ? oData.data :
                                (oData.data && Array.isArray(oData.data.results) ? oData.data.results : []);

                        if (results.length > 0) {
                            // 🔹 Filtrar proveedores únicos
                            const seen = new Set();
                            const aResults = results
                                .filter(item => {
                                    if (!item.Bpname) return false;
                                    if (seen.has(item.Bpname)) return false;
                                    seen.add(item.Bpname);
                                    return true;
                                })
                                .map(item => ({
                                    Bpname: item.Bpname,
                                    Display: item.Bpname
                                }));

                            this.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
                        } else {
                            this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                        }
                    }.bind(this),
                    error: function () {
                        this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                    }.bind(this)
                });
            }.bind(this));
        },
        _GetFiltroRuc: function (sValue, sTargetPath) {
            if (!sValue || sValue.length < 2) {
                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                return;
            }

            const buildUrl = (filterExp) => {
                const sSelect = "$select=Ruc";
                const sTop = "$top=3000";
                const sExpand = "$expand=toPurOrdItems";
                let sPath;

                if (that.local) {
                    sPath = `/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sSelect}&${sExpand}&$format=json&sap-language=ES`;
                    return this.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    sPath = jQuery.sap.getModulePath(that.route) +
                        `/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sSelect}&${sExpand}&$format=json&sap-language=ES`;
                    return sPath;
                }
            };

            const sUrl = buildUrl(`startswith(Ruc,'${sValue}')`);

            Services.getoDataERPSync(this, sUrl, function (result) {
                util.response.validateAjaxGetERPNotMessage(result, {
                    success: function (oData) {
                        const results =
                            Array.isArray(oData.data) ? oData.data :
                                (oData.data && Array.isArray(oData.data.results) ? oData.data.results : []);

                        if (results.length > 0) {
                            // 🔹 Filtrar RUC únicos
                            const seen = new Set();
                            const aResults = results
                                .filter(item => {
                                    if (!item.Ruc) return false;
                                    if (seen.has(item.Ruc)) return false;
                                    seen.add(item.Ruc);
                                    return true;
                                })
                                .map(item => ({
                                    Ruc: item.Ruc,
                                    Display: item.Ruc
                                }));

                            this.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
                        } else {
                            this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                        }
                    }.bind(this),
                    error: function () {
                        this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                    }.bind(this)
                });
            }.bind(this));
        },
        _GetFiltroNroPedComp: function (sValue, sTargetPath) {
            if (!sValue || sValue.length < 2) {
                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                return;
            }

            const buildUrl = (filterExp) => {
                const sSelect = "$select=Ebeln";
                const sTop = "$top=3000";
                const sExpand = "$expand=toPurOrdItems";
                let sPath;

                if (that.local) {
                    sPath = `/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sSelect}&${sExpand}&$format=json&sap-language=ES`;
                    return this.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    sPath = jQuery.sap.getModulePath(that.route) +
                        `/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sSelect}&${sExpand}&$format=json&sap-language=ES`;
                    return sPath;
                }
            };

            const sUrl = buildUrl(`startswith(Ebeln,'${sValue}')`);

            Services.getoDataERPSync(this, sUrl, function (result) {
                util.response.validateAjaxGetERPNotMessage(result, {
                    success: function (oData) {
                        const results =
                            Array.isArray(oData.data) ? oData.data :
                                (oData.data && Array.isArray(oData.data.results) ? oData.data.results : []);

                        if (results.length > 0) {
                            const aResults = results.map(item => ({
                                Ebeln: item.Ebeln,
                                Display: item.Ebeln
                            }));
                            this.getView().getModel("oModelData").setProperty(sTargetPath, aResults);
                        } else {
                            this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                        }
                    }.bind(this),
                    error: function () {
                        this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                    }.bind(this)
                });
            }.bind(this));
        },

        onChangeProv: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            this._GetFiltroProv(sValue, "/oFiltroProv");
        },
        onChangeRuc: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            this._GetFiltroRuc(sValue, "/oFiltroRuc");
        },

        onChangeNroPedComp: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            this._GetFiltroNroPedComp(sValue, "/oFiltroNroPedComp");
        },

        _onPressExecute: function () {
            let oModel = this.getView().getModel("oModelProyect");

            function extractTokens(oControl, sControlId) {
                if (!oControl) {
                    return { keys: [], texts: [], rawValue: "" };
                }
                let aKeys = [], aTexts = [], rawVal = "";
                try {
                    const aTokens = typeof oControl.getTokens === "function" ? oControl.getTokens() : [];
                    aTokens.forEach(oToken => {
                        aKeys.push(oToken.getKey());
                        aTexts.push(oToken.getText());
                    });
                } catch (e) { /* silencioso */ }
                try { rawVal = oControl.getValue ? oControl.getValue() : ""; } catch (_) { }
                return { keys: aKeys, texts: aTexts, rawValue: rawVal };
            }

            let aWarnings = [];
            let bHasValidTokens = false;
            let invalidRawInputs = [];

            // ==== MultiInputs ====
            let oProv = extractTokens(this.byId("miProv"), "miProv");
            oModel.setProperty("/Main/filter/cbSupplier", oProv.keys);
            oModel.setProperty("/Main/filter/cbSupplierText", oProv.texts);
            if (oProv.keys.length > 0) bHasValidTokens = true;
            if (oProv.keys.length === 0 && oProv.rawValue) {
                invalidRawInputs.push(`Proveedor: "${oProv.rawValue}"`);
                this.byId("miProv").setValue("");
            }

            let oRuc = extractTokens(this.byId("miCodProv"), "miCodProv");
            oModel.setProperty("/Main/filter/cbRuc", oRuc.keys);
            oModel.setProperty("/Main/filter/cbRucText", oRuc.texts);
            if (oRuc.keys.length > 0) bHasValidTokens = true;
            if (oRuc.keys.length === 0 && oRuc.rawValue) {
                invalidRawInputs.push(`RUC: "${oRuc.rawValue}"`);
                this.byId("miCodProv").setValue("");
            }

            let oPed = extractTokens(this.byId("miPedComp"), "miPedComp");
            oModel.setProperty("/Main/filter/cbPedComp", oPed.keys);
            oModel.setProperty("/Main/filter/cbPedCompText", oPed.texts);
            if (oPed.keys.length > 0) bHasValidTokens = true;
            if (oPed.keys.length === 0 && oPed.rawValue) {
                invalidRawInputs.push(`Pedido: "${oPed.rawValue}"`);
                this.byId("miPedComp").setValue("");
            }

            // ==== MultiComboBox ====
            oModel.setProperty("/Main/filter/cbState", this.byId("mcEstado").getSelectedKeys());
            oModel.setProperty("/Main/filter/cbSFacturacion", this.byId("mcFacturacion").getSelectedKeys());
            oModel.setProperty("/Main/filter/sIconTerm", this.byId("mcIntercom").getSelectedKeys());
            oModel.setProperty("/Main/filter/cbModalidad", this.byId("mcModalidad").getSelectedKeys());
            oModel.setProperty("/Main/filter/cbCondPago", this.byId("mcCondPago").getSelectedKeys());

            // ==== DateRangeSelection ====
            let oFechaPedidoCtrl = this.byId("dprFilterInitFechPedido");
            let oFechaEntregaCtrl = this.byId("dprFilterInitFechentrega");
            oModel.setProperty("/Main/filter/sOrderOpenFrom", oFechaPedidoCtrl ? oFechaPedidoCtrl.getDateValue() : null);
            oModel.setProperty("/Main/filter/sOrderOpenTo", oFechaPedidoCtrl ? oFechaPedidoCtrl.getSecondDateValue() : null);
            oModel.setProperty("/Main/filter/sDeliveryFrom", oFechaEntregaCtrl ? oFechaEntregaCtrl.getDateValue() : null);
            oModel.setProperty("/Main/filter/sDeliveryTo", oFechaEntregaCtrl ? oFechaEntregaCtrl.getSecondDateValue() : null);

            let jFilter = oModel.getProperty("/Main/filter");

            // ==== Validaciones de tokens inválidos ====
            const manualTokensTotal = (jFilter.cbSupplier?.length || 0) + (jFilter.cbRuc?.length || 0) + (jFilter.cbPedComp?.length || 0);
            const otherFiltersActive =
                (jFilter.cbCondPago?.length || 0) + (jFilter.cbState?.length || 0) +
                (jFilter.cbSFacturacion?.length || 0) + (jFilter.sIconTerm?.length || 0) +
                (jFilter.cbModalidad?.length || 0) +
                ((jFilter.sOrderOpenFrom && jFilter.sOrderOpenTo) ? 1 : 0) +
                ((jFilter.sDeliveryFrom && jFilter.sDeliveryTo) ? 1 : 0);

            if (invalidRawInputs.length > 0 && manualTokensTotal === 0 && otherFiltersActive === 0) {
                this.getView().getModel("oModelProyect").setProperty("/oReporte", []);
                sap.m.MessageToast.show(
                    "Ningún token válido encontrado para realizar la búsqueda.\nDescartados: " + invalidRawInputs.join("; ")
                );
                return;
            }

            if (invalidRawInputs.length > 0) {
                sap.m.MessageToast.show("Se descartaron: " + invalidRawInputs.join("; "));
            }

            // ==== Determinar Rol ====
            // /bRol === true → INT (interno Aris), false → EXT (proveedor)
            const isInternal = this.getModel("oModelUser").getProperty("/bRol") === true;

            if (!isInternal) {
                const sFixedRuc = this.getModel("oModelUser").getProperty("/sRucProv") || sRucProv;

                if (!sFixedRuc) {
                    sap.m.MessageBox.error("Su usuario no tiene un RUC válido asignado. Contacte con soporte.");
                    return;
                }

                // El externo siempre filtra por su RUC real
                jFilter.cbRuc = [sFixedRuc];
                jFilter.cbRucText = [sFixedRuc];
                oModel.setProperty("/Main/filter/cbRuc", [sFixedRuc]);
                oModel.setProperty("/Main/filter/cbRucText", [sFixedRuc]);
            }


            // ==== Ejecutar ====
            sap.ui.core.BusyIndicator.show();
            this._getData(jFilter).then(oData => {
                try {
                    if (oData.sEstado === "E") {
                        this.getMessageBox("error", this.getI18nText("errorData"));
                        oModel.setProperty("/oReporte", []);
                        return;
                    }

                    let aFinal = [];

                    if (isInternal) {
                        aFinal = oData.oResults || [];
                    } else {
                        const sRucFijo = this.getModel("oModelUser").getProperty("/sRucProv") || sRucProv;
                        aFinal = (oData.oResults || []).filter(x => x.Ruc === sRucFijo);
                    }
                    // Orden por fecha de pedido: más actual primero.
                    aFinal = this._sortByFechaPedidoDesc(aFinal);

                    oModel.setProperty("/oReporte", aFinal);

                    // 👇 Mensaje cuando no hay resultados que cumplan los filtros
                    if (oData.hasAnyFilter && aFinal.length === 0) {
                        sap.m.MessageToast.show(
                            "La tabla está vacía porque ningún registro cumple con los criterios de filtro."
                        );
                    }
                } finally {
                    sap.ui.core.BusyIndicator.hide();
                }
            }).catch(() => {
                this.getMessageBox("error", this.getI18nText("errorData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },

        _sortByFechaPedidoDesc: function (aData) {
            return (Array.isArray(aData) ? aData : []).slice().sort(function (a, b) {
                const nA = typeof a.FecpedidoMs === "number" ? a.FecpedidoMs : -Infinity;
                const nB = typeof b.FecpedidoMs === "number" ? b.FecpedidoMs : -Infinity;

                return nB - nA;
            });
        },

        _getData: function () {
            var that = this;
            try {
                var oResp = { sEstado: "E", oResults: [] };

                return new Promise(function (resolve) {
                    let sUrl = "";
                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?$top=3000&$expand=toPurOrdItems&$format=json&sap-language=ES";
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?$top=3000&$expand=toPurOrdItems&$format=json&sap-language=ES";
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData) {
                                if (!oData || !oData.data) {
                                    oResp.sEstado = "E";
                                    oResp.oResults = [];
                                    resolve(oResp);
                                    return;
                                }

                                const getMs = (rawDate) => {
                                    if (!rawDate) return null;

                                    let d = null;

                                    if (rawDate instanceof Date) {
                                        d = new Date(
                                            rawDate.getFullYear(),
                                            rawDate.getMonth(),
                                            rawDate.getDate()
                                        );
                                    } else if (typeof rawDate === "string") {
                                        const match = /Date\((\d+)\)/.exec(rawDate);
                                        if (match && match[1]) {
                                            const ms = parseInt(match[1], 10);
                                            if (!isNaN(ms)) {
                                                const tmp = new Date(ms);
                                                d = new Date(
                                                    tmp.getUTCFullYear(),
                                                    tmp.getUTCMonth(),
                                                    tmp.getUTCDate()
                                                );
                                            }
                                        } else {
                                            const tmp = new Date(rawDate);
                                            if (!isNaN(tmp.getTime())) {
                                                d = new Date(
                                                    tmp.getFullYear(),
                                                    tmp.getMonth(),
                                                    tmp.getDate()
                                                );
                                            }
                                        }
                                    } else if (typeof rawDate === "number") {
                                        const tmp = new Date(rawDate);
                                        if (!isNaN(tmp.getTime())) {
                                            d = new Date(
                                                tmp.getUTCFullYear(),
                                                tmp.getUTCMonth(),
                                                tmp.getUTCDate()
                                            );
                                        }
                                    }

                                    if (!d || isNaN(d.getTime())) {
                                        return null;
                                    }

                                    return Date.UTC(
                                        d.getFullYear(),
                                        d.getMonth(),
                                        d.getDate()
                                    );
                                };

                                const toUTCDateMs = (val) => {
                                    if (!val) return null;

                                    let d = null;

                                    if (val instanceof Date) {
                                        d = val;
                                    } else if (typeof val === "string") {
                                        const match = /Date\((\d+)\)/.exec(val);
                                        if (match && match[1]) {
                                            const ms = parseInt(match[1], 10);
                                            if (!isNaN(ms)) {
                                                d = new Date(ms);
                                            }
                                        }
                                        if (!d) {
                                            const tmp = new Date(val);
                                            if (!isNaN(tmp.getTime())) {
                                                d = tmp;
                                            }
                                        }
                                    }

                                    if (!d || isNaN(d.getTime())) return null;

                                    return Date.UTC(
                                        d.getFullYear(),
                                        d.getMonth(),
                                        d.getDate()
                                    );
                                };

                                const norm = (v) => String(v || "").trim();

                                let aResults = oData.data.map(item => {
                                    const sStatus = norm(item.Status);
                                    const sFacturation = norm(item.Facturation);
                                    const sConpag = norm(item.Conpag);
                                    const sModalidad = norm(item.Modalidad);

                                    return {
                                        Bpname: norm(item.Bpname),
                                        Ebeln: norm(item.Ebeln),
                                        Fecpedido: that.formatDate(item.Fecpedido),
                                        FecpedidoMs: getMs(item.Fecpedido),

                                        Status: sStatus,
                                        StatusDisplay: that._translateStaticValue("status", sStatus),

                                        Facturation: sFacturation,
                                        FacturationDisplay: that._translateStaticValue("facturation", sFacturation),

                                        Immecom: that.formatNumber(item.Immecom),
                                        Waers: norm(item.Waers),
                                        Iment: that.formatNumber(item.Iment),
                                        Imfac: that.formatNumber(item.Imfac),

                                        Inco1: norm(item.Inco1),

                                        Modalidad: sModalidad,
                                        ModalidadDisplay: that._translateStaticValue("modalidad", sModalidad),

                                        Conpag: sConpag,
                                        ConpagDisplay: that._translateStaticValue("conpag", sConpag),

                                        Fecentrega: that.formatDate(item.Fecentrega),
                                        FecentregaMs: getMs(item.Fecentrega),
                                        Ruc: norm(item.Ruc),
                                        rawDetail: item.toPurOrdItems || []
                                    };
                                });

                                const jFilter = that.getModel("oModelProyect").getProperty("/Main/filter") || {};
                                const isInternal = that.getModel("oModelUser").getProperty("/bRol") === true;
                                const sFixedRuc = norm(that.getModel("oModelUser").getProperty("/sRucProv") || sRucProv);

                                const setOf = (arr, prop) => new Set(
                                    arr.map(x => norm(x[prop])).filter(Boolean)
                                );

                                const sets = {
                                    Bpname: setOf(aResults, "Bpname"),
                                    Ruc: setOf(aResults, "Ruc"),
                                    Ebeln: setOf(aResults, "Ebeln")
                                };

                                const splitValidInvalid = (vals = [], set) => {
                                    const valid = [], invalid = [];
                                    (vals || []).forEach(v => {
                                        const sVal = norm(v);
                                        (set.has(sVal) ? valid : invalid).push(sVal);
                                    });
                                    return { valid, invalid };
                                };

                                const vSup = splitValidInvalid(jFilter.cbSupplier, sets.Bpname);
                                let vRuc = splitValidInvalid(jFilter.cbRuc, sets.Ruc);
                                const vPed = splitValidInvalid(jFilter.cbPedComp, sets.Ebeln);

                                if (!isInternal && sFixedRuc) {
                                    vRuc = {
                                        valid: [sFixedRuc],
                                        invalid: []
                                    };
                                }

                                const requestedManual =
                                    (jFilter.cbSupplier?.length || 0) +
                                    (isInternal ? (jFilter.cbRuc?.length || 0) : 0) +
                                    (jFilter.cbPedComp?.length || 0);

                                const validManualCnt = vSup.valid.length + vRuc.valid.length + vPed.valid.length;

                                const otherFiltersActive =
                                    (jFilter.cbCondPago?.length || 0) +
                                    (jFilter.cbState?.length || 0) +
                                    (jFilter.cbSFacturacion?.length || 0) +
                                    (jFilter.sIconTerm?.length || 0) +
                                    (jFilter.cbModalidad?.length || 0) +
                                    ((jFilter.sOrderOpenFrom && jFilter.sOrderOpenTo) ? 1 : 0) +
                                    ((jFilter.sDeliveryFrom && jFilter.sDeliveryTo) ? 1 : 0);

                                if (requestedManual > 0 && validManualCnt === 0 && otherFiltersActive === 0) {
                                    const descartados = []
                                        .concat((vSup.invalid || []).map(x => `Proveedor: ${x}`))
                                        .concat((isInternal ? (vRuc.invalid || []) : []).map(x => `RUC: ${x}`))
                                        .concat((vPed.invalid || []).map(x => `Pedido: ${x}`));

                                    sap.m.MessageToast.show(
                                        "Ningún token manual coincide con los datos. No se realizará la búsqueda.\nDescartados: " +
                                        descartados.join("; ")
                                    );
                                    oResp.oResults = [];
                                    resolve(oResp);
                                    return;
                                }

                                const descartes = []
                                    .concat((vSup.invalid || []).map(x => `Proveedor: ${x}`))
                                    .concat((isInternal ? (vRuc.invalid || []) : []).map(x => `RUC: ${x}`))
                                    .concat((vPed.invalid || []).map(x => `Pedido: ${x}`));

                                if (descartes.length > 0) {
                                    sap.m.MessageToast.show("Se descartaron tokens sin datos: " + descartes.join("; "));
                                }

                                const asSet = (arr = []) => new Set((arr || []).map(x => norm(x)).filter(Boolean));

                                const k = {
                                    sup: asSet(vSup.valid),
                                    ruc: asSet(vRuc.valid),
                                    ped: asSet(vPed.valid),
                                    cond: asSet(jFilter.cbCondPago || []),
                                    state: asSet(jFilter.cbState || []),
                                    fact: asSet(jFilter.cbSFacturacion || []),
                                    inco: asSet(jFilter.sIconTerm || []),
                                    mod: asSet(jFilter.cbModalidad || [])
                                };

                                const hasAnyFilter =
                                    k.sup.size || k.ruc.size || k.ped.size || k.cond.size || k.state.size ||
                                    k.fact.size || k.inco.size || k.mod.size ||
                                    (jFilter.sOrderOpenFrom && jFilter.sOrderOpenTo) ||
                                    (jFilter.sDeliveryFrom && jFilter.sDeliveryTo);

                                oResp.hasAnyFilter = !!hasAnyFilter;

                                let filtered = aResults;

                                if (hasAnyFilter) {
                                    const from1 = jFilter.sOrderOpenFrom ? toUTCDateMs(jFilter.sOrderOpenFrom) : null;
                                    const to1 = jFilter.sOrderOpenTo ? toUTCDateMs(jFilter.sOrderOpenTo) : null;
                                    const from2 = jFilter.sDeliveryFrom ? toUTCDateMs(jFilter.sDeliveryFrom) : null;
                                    const to2 = jFilter.sDeliveryTo ? toUTCDateMs(jFilter.sDeliveryTo) : null;

                                    const bHasSupplierOrRucGroup = k.sup.size > 0 || k.ruc.size > 0;

                                    filtered = aResults.filter(it => {
                                        const sBpname = norm(it.Bpname);
                                        const sRuc = norm(it.Ruc);
                                        const sEbeln = norm(it.Ebeln);
                                        const sConpag = norm(it.Conpag);
                                        const sStatus = norm(it.Status);
                                        const sFacturation = norm(it.Facturation);
                                        const sInco1 = norm(it.Inco1);
                                        const sModalidad = norm(it.Modalidad);

                                        // Grupo combinado: Razón social OR RUC
                                        if (bHasSupplierOrRucGroup) {
                                            const bMatchSupplier = k.sup.size > 0 && k.sup.has(sBpname);
                                            const bMatchRuc = k.ruc.size > 0 && k.ruc.has(sRuc);

                                            if (!bMatchSupplier && !bMatchRuc) {
                                                return false;
                                            }
                                        }

                                        // Pedido de compra
                                        if (k.ped.size && !k.ped.has(sEbeln)) {
                                            return false;
                                        }

                                        // Condición de pago
                                        if (k.cond.size && !k.cond.has(sConpag)) {
                                            return false;
                                        }

                                        // Estado
                                        if (k.state.size && !k.state.has(sStatus)) {
                                            return false;
                                        }

                                        // Estado facturación
                                        if (k.fact.size && !k.fact.has(sFacturation)) {
                                            return false;
                                        }

                                        // Incoterm
                                        if (k.inco.size && !k.inco.has(sInco1)) {
                                            return false;
                                        }

                                        // Modalidad
                                        if (k.mod.size && !k.mod.has(sModalidad)) {
                                            return false;
                                        }

                                        // Fecha de pedido
                                        if (from1 !== null && to1 !== null) {
                                            if (it.FecpedidoMs === null) {
                                                return false;
                                            }
                                            if (it.FecpedidoMs < from1 || it.FecpedidoMs > to1) {
                                                return false;
                                            }
                                        }

                                        // Fecha de entrega
                                        if (from2 !== null && to2 !== null) {
                                            if (it.FecentregaMs === null) {
                                                return false;
                                            }
                                            if (it.FecentregaMs < from2 || it.FecentregaMs > to2) {
                                                return false;
                                            }
                                        }

                                        return true;
                                    });
                                }

                                // Orden por fecha de pedido: más actual primero.
                                filtered = that._sortByFechaPedidoDesc(filtered);

                                oResp.oResults = filtered;
                                oResp.sEstado = "S";
                                resolve(oResp);
                            },
                            error: function (err) {
                                oResp.oResults = [];
                                resolve(oResp);
                            }
                        });
                    });
                });
            } catch (e) {
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },

        _onPressClear: function () {
            const oModel = this.getOwnerComponent().getModel("oModelProyect");
            const isInternal = this.getModel("oModelUser").getProperty("/bRol") === true;

            // 1. Resetear modelo de filtros
            const jNewFilter = {
                cbSupplier: [],
                cbSupplierText: [],
                cbRuc: [],
                cbRucText: [],
                cbPedComp: [],
                cbPedCompText: [],
                cbCondPago: [],
                cbState: [],
                cbSFacturacion: [],
                sIconTerm: [],
                cbModalidad: [],
                sOrderOpenFrom: null,
                sOrderOpenTo: null,
                sDeliveryFrom: null,
                sDeliveryTo: null
            };

            // 🔹 Si es EXTERNO, volvemos a fijar su BP/RUC en cbRuc
            if (!isInternal) {
                const sFixedRuc = this.getModel("oModelUser").getProperty("/sRucProv") || sRucProv;
                if (sFixedRuc) {
                    jNewFilter.cbRuc = [sFixedRuc];
                    jNewFilter.cbRucText = [sFixedRuc];
                }
            }

            oModel.setProperty("/Main/filter", jNewFilter);

            // 2. Limpiar tabla
            oModel.setProperty("/oReporte", []);

            // 3. Sincronizar controles visuales
            this._syncFilterControls();

            sap.m.MessageToast.show("Filtros y tabla limpiados");
        },


        _syncFilterControls: function () {
            const oModel = this.getOwnerComponent().getModel("oModelProyect");
            const jFilter = oModel.getProperty("/Main/filter");

            // MultiInputs
            this.byId("miProv")?.removeAllTokens();
            this.byId("miProv")?.setValue("");

            this.byId("miCodProv")?.removeAllTokens();
            this.byId("miCodProv")?.setValue("");

            this.byId("miPedComp")?.removeAllTokens();
            this.byId("miPedComp")?.setValue("");

            // MultiComboBox
            this.byId("mcEstado")?.setSelectedKeys(jFilter.cbState || []);
            this.byId("mcFacturacion")?.setSelectedKeys(jFilter.cbSFacturacion || []);
            this.byId("mcIntercom")?.setSelectedKeys(jFilter.sIconTerm || []);
            this.byId("mcModalidad")?.setSelectedKeys(jFilter.cbModalidad || []);
            this.byId("mcCondPago")?.setSelectedKeys(jFilter.cbCondPago || []);

            // DateRangeSelections
            this.byId("dprFilterInitFechPedido")?.setDateValue(jFilter.sOrderOpenFrom || null);
            this.byId("dprFilterInitFechPedido")?.setSecondDateValue(jFilter.sOrderOpenTo || null);
            this.byId("dprFilterInitFechentrega")?.setDateValue(jFilter.sDeliveryFrom || null);
            this.byId("dprFilterInitFechentrega")?.setSecondDateValue(jFilter.sDeliveryTo || null);
        },


        _onFilterBarChange: function () {
            this._syncFilterControls();
        }


    });
});