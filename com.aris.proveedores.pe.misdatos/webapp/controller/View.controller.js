sap.ui.define([
    "com/aris/proveedores/pe/misdatos/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/resource/ResourceModel",
    "com/aris/proveedores/pe/misdatos/model/models",
    "com/aris/proveedores/pe/misdatos/model/formatter",
    "com/aris/proveedores/pe/misdatos/services/Services",
    "com/aris/proveedores/pe/misdatos/util/util",
    "com/aris/proveedores/pe/misdatos/util/utilUI",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], (BaseController, Controller, ResourceModel, models, formatter, Services, util, utilUI, Filter, FilterOperator, JSONModel) => {
    "use strict";
    var that;
    //var tPortal = "", tRol = "";
    return BaseController.extend("com.aris.proveedores.pe.misdatos.controller.View", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("View").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdDetail2 = "frgIdDetail2";
            this.frgIdFilterInit = "frgIdFilterInit";

            let oModelData = new JSONModel({
                suggestedSuppliers: [],
                suggestedCodSuppliers: [],
                suggestedSupplierCodes: []
            });
            this.getView().setModel(oModelData, "oModelData");



        },

        /**
  
        * @param {string} sValue - texto que escribe el usuario
        * @param {string} sField - campo por el cual filtrar (ej: "SupplierName" o "TaxID1")
        * @param {string} sTargetPath - ruta en el modelo donde guardar resultados
        */




        handleRouteMatched: function (bInit) {
            sap.ui.core.BusyIndicator.show(0);
            let sNumPedido = "";
            Promise.all([this._getUsers()]).then((values) => {
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");
                //let sIdioma = that.getModel("oModelProyect").getProperty("/sIdioma");
                that.oModelProyect.setSizeLimit(8000);
                that.oModelData.setSizeLimit(8000);

                let oUser = values[0]?.Resources?.[0] || {};
                const oUserProfile = that._applyProveedorUserProfile(oUser);

                const bIsInterno = oUserProfile.bIsInterno;
                const bIsExtAyc = oUserProfile.bIsExtAyc;

                // Para usuario externo se consulta solamente su propio BP.
                // Este valor sale de customAttribute4.
                sNumPedido = oUserProfile.sExtBP;

                const sIdioma = that.oModelProyect.getProperty("/sIdioma") || "esp";
                that._setLanguageModel(sIdioma);
                //Tabla del Main

                if (bIsInterno) {
                    let sComponentTable = "";
                    sComponentTable = "TableMainDesktop";

                    if (!that.fragmentTable) {
                        that.oModelProyect.setProperty("/", models.createModelProyect());
                        that.fragmentTable = sap.ui.xmlfragment(this.frgIdTableMain, that.route + ".view.fragments." + sComponentTable, that);
                        this._byId("vbTableMain").addItem(that.fragmentTable);
                    }
                } else if (bIsExtAyc) {
                    let sComponentDetail = "";
                    sComponentDetail = "Detail2";

                    Promise.all([this._getDataDetalle(sNumPedido)]).then((values) => {
                        let oDataDetalle = values[0];
                        let aResults = oDataDetalle.oResults || [];

                        that._applyBankColumnsVisibility(aResults);
                        that.getModel("oModelProyect").setProperty("/oDetalle", aResults);

                        if (!that.fragmentDetail) {
                            that.fragmentDetail = sap.ui.xmlfragment(this.frgIdDetail2, that.route + ".view.fragments." + sComponentDetail, that);
                            this._byId("vbDetail2").addItem(that.fragmentDetail);
                        }
                    }).catch(function (oError) {
                        that.getMessageBox("error", that.getI18nText("errorUserData"));
                        sap.ui.core.BusyIndicator.hide(0);
                    });
                } else {
                    that.getMessageBox("error", "El usuario no tiene configurado customAttribute4 ni customAttribute5 en IAS.");
                }
                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        _onClearDataFilter: function () {
            that.getModel("oModelProyect").setProperty("/Main", models.createModelProyect().Main);
        },
        _onPressNavigateDetail: function (oEvent) {

            let oSource = oEvent.getSource();
            let oParentRow = oSource.getParent();
            let jRow = oParentRow.getBindingContext("oModelProyect");
            let jData = jRow.getObject();
            that.oRouter.navTo("Detail", {
                app: jData.SupplierCode
            });
        },

        onLanguageEsp: function () {
            this._setLanguageModel("esp");
        },

        onLanguageEng: function () {
            this._setLanguageModel("ing");
        },
        _onPressExportRespaldo: function () {
            var sIndicador = "ReporteMain";
            var sAutorExcel = "MESTEFO";

            // localizar la tabla
            var oVBox = this.byId("vbTableMain");
            var oScrollContainer = oVBox.getItems()[0];
            var oTable = oScrollContainer.getContent()[0];

            if (!oTable) {
                this.getMessageBox("error", "No se encontró la tabla para exportar.");
                return;
            }

            var aDataToExport;

            // 👉 si hay filtros, usar los filtrados de la tabla
            if (this.aFilter && this.aFilter.length > 0) {
                var aFilteredContexts = oTable.getBinding("items").getCurrentContexts();
                aDataToExport = aFilteredContexts.map(ctx => ctx.getObject());
            } else {
                // 👉 si no hay filtros, exportar TODO el modelo
                aDataToExport = this.getModel("oModelProyect").getProperty("/oReporte") || [];
            }

            if (this.isEmpty(aDataToExport)) {
                this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
                return;
            }

            that.fnExportarExcel(aDataToExport, [], [], sAutorExcel, sIndicador);
        },

        _onPressExportRespaldo2: function () {
            var sIndicador = "ReporteDetalle";
            var oReporte = this.getModel("oModelProyect").getProperty("/oDetalle");
            if (this.isEmpty(oReporte)) {
                this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
                return;
            }
            var sAutorExcel = "MESTEFO";
            that.fnExportarExcelDetalle(oReporte, sAutorExcel, sIndicador);

        },
        _setLanguageModel: function (langKey) {
            var bundleName;
            if (langKey === "esp") {
                bundleName = "com.aris.proveedores.pe.misdatos.i18n.i18n_esp";
            } else if (langKey === "ing") {
                bundleName = "com.aris.proveedores.pe.misdatos.i18n.i18n_ing";
            } else {
                return;
            }

            var i18nModel = new ResourceModel({
                bundleName: bundleName
            });
            this.getView().setModel(i18nModel, "i18n");
            this.getModel("oModelProyect").setProperty("/sIdioma", langKey);

        },
        _getDataDetalle: function (sNumPedido) {
            that = this;
            try {
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
                return new Promise(function (resolve, reject) {
                    let sUrl = "";
                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" +
                            "?$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts" +
                            "&$filter=SupplierCode eq '" + sNumPedido + "'" +
                            "&$format=json&sap-ui-language=ES";
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" +
                            "?$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts" +
                            "&$filter=SupplierCode eq '" + sNumPedido + "'" +
                            "&$format=json&sap-ui-language=ES";
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                oResp.sEstado = "S";
                                oData.data.forEach(item => {
                                    item.TaxID = that.maskTaxId(item.TaxID1, item.TaxID2);
                                });
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

        _doSuggestCodSupplier: function (sValue, sTargetPath) {
            clearTimeout(this._suggestTimer);

            if (!sValue || sValue.length < 2) {
                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                return;
            }

            this._suggestTimer = setTimeout(function () {
                let sUrl = "";
                if (that.local) {
                    sUrl = this.getOwnerComponent().getManifestObject().resolveUri(
                        "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" +
                        "?$top=8000&$select=TaxID1,TaxID2&$format=json&sap-ui-language=ES"
                    );
                } else {
                    sUrl = jQuery.sap.getModulePath(that.route) +
                        "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" +
                        "?$top=8000&$select=TaxID1,TaxID2&$format=json&sap-ui-language=ES";
                }

                Services.getoDataERPAsync(this, sUrl, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: function (oData) {
                            let aResults = (oData.data || [])
                                .map(item => {
                                    const raw = (item.TaxID1 || item.TaxID2 || "").trim();
                                    const display = this.maskTaxId(item.TaxID1, item.TaxID2);
                                    return {
                                        RawTaxID: raw,
                                        TaxID1: item.TaxID1,
                                        TaxID2: item.TaxID2,
                                        Display: display
                                    };
                                })
                                .filter(item => item.Display && item.Display.startsWith(sValue));

                            // ✅ dedupe por RUC crudo
                            aResults = this._uniqueByKey(aResults, x => this._normKey(x.RawTaxID));

                            // opcional: ordenar
                            aResults.sort((a, b) => a.Display.localeCompare(b.Display, "es", { numeric: true }));

                            this.getView().getModel("oModelData").setProperty(sTargetPath, aResults);

                        }.bind(this),
                        error: function () {
                            this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                        }.bind(this)
                    });
                }.bind(this));
            }.bind(this), 250);
        },

        _doSuggestSupplierName: function (sValue, sTargetPath) {
            if (!sValue || sValue.length < 2) {
                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                return;
            }

            const searchValue = sValue.toUpperCase();

            const buildUrl = (filterExp) => {
                const sSelect = "$select=SupplierName";
                const sTop = "$top=8000";
                let sPath;

                if (that.local) {
                    const sFilterEncoded = encodeURIComponent(filterExp);

                    sPath = `/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?${sTop}&$filter=${sFilterEncoded}&${sSelect}&$format=json&sap-ui-language=ES`;
                    return this.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    const sFilterEncoded = encodeURIComponent(filterExp);

                    sPath = jQuery.sap.getModulePath(that.route) +
                        `/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?${sTop}&$filter=${sFilterEncoded}&${sSelect}&$format=json&sap-ui-language=ES`;
                    return sPath;
                }
            };

            const executeRequest = (sUrl, fallbackFn) => {
                Services.getoDataERPAsync(this, sUrl, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: function (oData) {
                            const count = oData.data ? oData.data.length : 0;
                            if (count > 0) {
                                let aResults = (oData.data || []).map(item => ({
                                    SupplierName: (item.SupplierName || "").trim(),
                                    Display: (item.SupplierName || "").trim()
                                })).filter(x => x.SupplierName);

                                // ✅ dedupe (por nombre)
                                aResults = this._uniqueByKey(aResults, x => this._normKey(x.SupplierName));

                                // opcional: ordenar
                                aResults.sort((a, b) => a.Display.localeCompare(b.Display, "es", { sensitivity: "base" }));

                                this.getView().getModel("oModelData").setProperty(sTargetPath, aResults);

                            } else if (fallbackFn) {
                                fallbackFn();
                            } else {
                                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                            }
                        }.bind(this),
                        error: function () {
                            if (fallbackFn) {
                                fallbackFn();
                            } else {
                                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                            }
                        }.bind(this)
                    });
                }.bind(this));
            };


            const url1 = buildUrl(`startswith(toupper(SupplierName),'${searchValue}')`);
            executeRequest(url1, () => {

                const url2 = buildUrl(`startswith(SupplierName,'${sValue}')`);
                executeRequest(url2, () => {

                    const url3 = buildUrl(`substringof('${sValue}',SupplierName)`);
                    executeRequest(url3, null);
                });
            });
        },


        _doSuggestSupplierCode: function (sValue, sTargetPath) {
            if (!sValue || sValue.length < 2) {
                this.getView().getModel("oModelData").setProperty(sTargetPath, []);

                return;
            }

            const searchValue = sValue.toUpperCase();

            const buildUrl = (filterExp) => {
                const sSelect = "$select=SupplierCode";
                const sTop = "$top=8000";
                let sPath;

                if (that.local) {
                    const sFilterEncoded = encodeURIComponent(filterExp);

                    sPath = `/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?${sTop}&$filter=${sFilterEncoded}&${sSelect}&$format=json&sap-ui-language=ES`;
                    return this.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    const sFilterEncoded = encodeURIComponent(filterExp);

                    sPath = jQuery.sap.getModulePath(that.route) +
                        `/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier?${sTop}&$filter=${sFilterEncoded}&${sSelect}&$format=json&sap-ui-language=ES`;
                    return sPath;
                }
            };

            const executeRequest = (sUrl, fallbackFn) => {


                Services.getoDataERPAsync(this, sUrl, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: function (oData) {
                            const count = oData.data ? oData.data.length : 0;

                            if (count > 0) {
                                if (count === 20) {
                                }

                                let aResults = (oData.data || []).map(item => ({
                                    SupplierCode: (item.SupplierCode || "").trim(),
                                    Display: (item.SupplierCode || "").trim()
                                })).filter(x => x.SupplierCode);

                                // ✅ dedupe
                                aResults = this._uniqueByKey(aResults, x => this._normKey(x.SupplierCode));

                                // opcional: ordenar
                                aResults.sort((a, b) =>
                                    b.SupplierCode.localeCompare(a.SupplierCode, "es", { numeric: true })
                                );

                                this.getView().getModel("oModelData").setProperty(sTargetPath, aResults);

                            } else {

                                if (fallbackFn) {
                                    fallbackFn();
                                } else {
                                    this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                                }
                            }
                        }.bind(this),
                        error: function () {
                            if (fallbackFn) {
                                fallbackFn();
                            } else {
                                this.getView().getModel("oModelData").setProperty(sTargetPath, []);
                            }
                        }.bind(this)
                    });
                }.bind(this));
            };


            const url1 = buildUrl(`startswith(toupper(SupplierCode),'${searchValue}')`);
            executeRequest(url1, () => {

                const url2 = buildUrl(`startswith(SupplierCode,'${sValue}')`);
                executeRequest(url2, () => {

                    const url3 = buildUrl(`substringof('${sValue}',SupplierCode)`);
                    executeRequest(url3, null);
                });
            });
        },


        onChangeCodSupplier: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue"); // 👈 texto escrito
            this._doSuggestCodSupplier(sValue, "/suggestedCodSuppliers");

        },

        onChangeSupplier: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            this._doSuggestSupplierName(sValue, "/suggestedSuppliers");

        },
        onChangeSupplierCode: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue");
            this._doSuggestSupplierCode(sValue, "/suggestedSupplierCodes");
        },


        _clearMultiInputs: function () {
            var aIds = ["miCodSupplier", "miSupplier", "miSupplierCode"];
            aIds.forEach(function (sId) {
                var oMultiInput = this.byId(sId);
                if (oMultiInput) {
                    oMultiInput.setValue("");
                    oMultiInput.removeAllTokens();
                }
            }.bind(this));
        },
        _onPressExecute: function () {
            let oMI_Supplier = this.byId("miSupplier");
            let oMI_CodSupplier = this.byId("miCodSupplier");
            let oMI_SupplierCode = this.byId("miSupplierCode");

            let aSupplierTokens = oMI_Supplier.getTokens();
            let aCodSupplierTokens = oMI_CodSupplier.getTokens();
            let aSupplierCodeTokens = oMI_SupplierCode.getTokens();

            // 🔹 Extraer tokens
            function extractTokens(aTokens) {
                let aKeys = [], aTexts = [];
                aTokens.forEach(oToken => {
                    aKeys.push(oToken.getKey());
                    aTexts.push(oToken.getText());
                });
                return { keys: aKeys, texts: aTexts };
            }

            let oSup = extractTokens(aSupplierTokens);
            let oCodSup = extractTokens(aCodSupplierTokens);
            let oSupCode = extractTokens(aSupplierCodeTokens);

            let oModel = this.getView().getModel("oModelProyect");

            oModel.setProperty("/Main/filter/cbSupplier", oSup.keys);
            oModel.setProperty("/Main/filter/cbSupplierText", oSup.texts);

            oModel.setProperty("/Main/filter/cbCodSupplier", oCodSup.keys);
            oModel.setProperty("/Main/filter/cbCodSupplierText", oCodSup.texts);

            oModel.setProperty("/Main/filter/cbSupplierCode", oSupCode.keys);
            oModel.setProperty("/Main/filter/cbSupplierCodeText", oSupCode.texts);

            let jFilter = oModel.getProperty("/Main/filter");
            let aWarnings = [];


            if (aSupplierTokens.length === 0 && oMI_Supplier.getValue()) {
                aWarnings.push("Proveedor");
                oModel.setProperty("/Main/filter/cbSupplier", []);
                oModel.setProperty("/Main/filter/cbSupplierText", []);
                oMI_Supplier.setValue("");
            }

            if (aCodSupplierTokens.length === 0 && oMI_CodSupplier.getValue()) {
                aWarnings.push("RUC");
                oModel.setProperty("/Main/filter/cbCodSupplier", []);
                oModel.setProperty("/Main/filter/cbCodSupplierText", []);
                oMI_CodSupplier.setValue("");
            }

            if (aSupplierCodeTokens.length === 0 && oMI_SupplierCode.getValue()) {
                aWarnings.push("Código SAP");
                oModel.setProperty("/Main/filter/cbSupplierCode", []);
                oModel.setProperty("/Main/filter/cbSupplierCodeText", []);
                oMI_SupplierCode.setValue("");
            }


            const bAllEmptyTokens =
                aSupplierTokens.length === 0 &&
                aCodSupplierTokens.length === 0 &&
                aSupplierCodeTokens.length === 0;

            if (bAllEmptyTokens && aWarnings.length > 0) {
                that.oModelProyect.setProperty("/oReporte", []);
                let sMsg = "No se aplicó ningún filtro válido, no se mostrarán resultados.";
                sMsg += "\nCampos descartados: " + aWarnings.join(", ");
                sap.m.MessageToast.show(sMsg);
                return;
            }


            if (aWarnings.length > 0) {
                let sMsg = "Algunos filtros fueron descartados: " + aWarnings.join(", ");
                sap.m.MessageToast.show(sMsg);
            }


            sap.ui.core.BusyIndicator.show();
            Promise.all([this._getData(jFilter)]).then((values) => {
                let oData = values[0];

                if (oData.sEstado === "E") {
                    that.getMessageBox("error", that.getI18nText("errorData"));
                } else {
                    let aResults = oData.oResults || [];
                    that._applyBankColumnsVisibility(aResults);
                    that.oModelProyect.setProperty("/oReporte", aResults);
                }

                sap.ui.core.BusyIndicator.hide();
            }).catch(function () {
                that.getMessageBox("error", that.getI18nText("errorData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        _getData: function (jFilter, iSkip, iTop) {
            try {
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };

                return new Promise(function (resolve) {
                    that.aFilter = [];
                    let sUrl = "",
                        aArrayFilter = [],
                        aODataParts = [];

                    jFilter = jFilter || that.getModel("oModelProyect").getProperty("/Main/filter") || {};

                    if (
                        (that.isEmpty(jFilter.cbSupplier) &&
                            that.isEmpty(jFilter.cbCodSupplier) &&
                            that.isEmpty(jFilter.cbSupplierCode)) &&
                        (!that.isEmpty(jFilter.cbSupplierText) ||
                            !that.isEmpty(jFilter.cbCodSupplierText) ||
                            !that.isEmpty(jFilter.cbSupplierCodeText))
                    ) {
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        that.getMessageBox("warning", "No se encontró ningún registro con los valores ingresados.");
                        resolve(oResp);
                        return;
                    }

                    const esc = v => String(v || "").replace(/'/g, "''");

                    if (!that.isEmpty(jFilter.cbSupplier)) {
                        jFilter.cbSupplier.forEach(key => {
                            if (!key) { return; }

                            aArrayFilter.push(new Filter({
                                path: 'SupplierName',
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: key
                            }));
                            aODataParts.push(`SupplierName eq '${esc(key)}'`);
                        });
                    }

                    if (!that.isEmpty(jFilter.cbSupplierCode)) {
                        jFilter.cbSupplierCode.forEach(key => {
                            if (!key) { return; }
                            aArrayFilter.push(new Filter({
                                path: 'SupplierCode',
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: key
                            }));
                            aODataParts.push(`SupplierCode eq '${esc(key)}'`);
                        });
                    }

                    if (!that.isEmpty(jFilter.cbCodSupplier)) {
                        jFilter.cbCodSupplier.forEach(key => {
                            if (!key) { return; }
                            aArrayFilter.push(new Filter({
                                path: 'TaxID',
                                operator: sap.ui.model.FilterOperator.EQ,
                                value1: key
                            }));
                            aODataParts.push(`(TaxID1 eq '${esc(key)}' or TaxID2 eq '${esc(key)}')`);
                        });
                    }

                    if (aArrayFilter.length > 0) {
                        that.aFilter = [
                            new Filter({
                                filters: aArrayFilter,
                                and: false
                            })
                        ];
                    } else {
                        that.aFilter = [];
                    }

                    let aParams = [];
                    const top = iTop || 8000;
                    const skip = iSkip || 0;

                    aParams.push(`$top=${top}`);
                    if (skip > 0) {
                        aParams.push(`$skip=${skip}`);
                    }
                    aParams.push("$expand=to_Address,to_Emails,to_BankAccounts,to_Contacts");
                    if (aODataParts.length > 0) {
                        const sFilter = aODataParts.join(" or ");
                        aParams.push(`$filter=${encodeURIComponent(sFilter)}`);
                    }
                    aParams.push("$format=json");
                    aParams.push("sap-ui-language=ES");

                    const sQuery = "?" + aParams.join("&");

                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" + sQuery;
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier" + sQuery;
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData) {
                                oResp.sEstado = "S";

                                (oData.data || []).forEach(item => {
                                    item.TaxID = that.maskTaxId(item.TaxID1, item.TaxID2);
                                    const aEmails = item.to_Emails && item.to_Emails.results
                                        ? item.to_Emails.results
                                        : [];

                                    aEmails.sort((a, b) => {
                                        const vA = a.ValidFrom || "";
                                        const vB = b.ValidFrom || "";

                                        if (vA !== vB) {
                                            return vB.localeCompare(vA);
                                        }

                                        const eA = (a.Email || "").toUpperCase();
                                        const eB = (b.Email || "").toUpperCase();
                                        return eA.localeCompare(eB);
                                    });
                                });
                                let aRaw = oData.data || [];

                                aRaw.forEach(item => {
                                    item.TaxID = that.maskTaxId(item.TaxID1, item.TaxID2);

                                    const aEmails = item.to_Emails && item.to_Emails.results ? item.to_Emails.results : [];
                                    aEmails.sort((a, b) => {
                                        const vA = a.ValidFrom || "";
                                        const vB = b.ValidFrom || "";
                                        if (vA !== vB) return vB.localeCompare(vA);
                                        return ((a.Email || "").toUpperCase()).localeCompare((b.Email || "").toUpperCase());
                                    });
                                });

                                const aUnique = that._dedupeSuppliersByBP(aRaw);

                                oResp.oResults = aUnique;


                                var oScrollContainter = that._byId("vbTableMain").getItems().length > 0
                                    ? that._byId("vbTableMain").getItems()[0]
                                    : null;
                                if (oScrollContainter) {
                                    var oTable = oScrollContainter.getContent()[0];
                                    if (oTable && oTable.getBinding("items")) {
                                        oTable.getBinding("items").filter(that.aFilter);
                                    }
                                }

                                resolve(oResp);
                            },
                            error: function () {
                                oResp.sEstado = "S";
                                oResp.oResults = [];

                                var oScrollContainter = that._byId("vbTableMain").getItems().length > 0
                                    ? that._byId("vbTableMain").getItems()[0]
                                    : null;
                                if (oScrollContainter) {
                                    var oTable = oScrollContainter.getContent()[0];
                                    if (oTable && oTable.getBinding("items")) {
                                        oTable.getBinding("items").filter(that.aFilter);
                                    }
                                }

                                resolve(oResp);
                            }
                        });
                    });
                });
            } catch (oError) {
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },








    });
});