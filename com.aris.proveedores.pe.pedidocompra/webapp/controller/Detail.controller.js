sap.ui.define([
    "com/aris/proveedores/pe/pedidocompra/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "com/aris/proveedores/pe/pedidocompra/model/models",
    "com/aris/proveedores/pe/pedidocompra/model/formatter",
    "com/aris/proveedores/pe/pedidocompra/services/Services",
    "com/aris/proveedores/pe/pedidocompra/util/util",
    "com/aris/proveedores/pe/pedidocompra/util/utilUI"
], (BaseController, Controller, models, formatter, Services, util, utilUI) => {
    "use strict";
    var that;

    return BaseController.extend("com.aris.proveedores.pe.pedidocompra.controller.Detail", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Detail").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            this.frgIdFilterDetail = "frgIdFilterDetail";
        },

        handleRouteMatched: function () {
            sap.ui.core.BusyIndicator.show(0);

            let sNumPedido = this.oRouter.getHashChanger().hash.split("/")[1];
            const oModel = this.getOwnerComponent().getModel("oModelProyect");

            this._ensureProveedorUserProfile().then(() => {
                return this._getData(sNumPedido);
            }).then((oResp) => {
                if (oResp.sEstado === "E" || !oResp.oCabecera) {
                    this.getMessageBox("error", this.getI18nText("errorData"));
                    sap.ui.core.BusyIndicator.hide(0);
                    return;
                }

                // === Roles ===
                const sIdioma = oModel.getProperty("/sIdioma") || "esp";
                // === Idioma ===

                this._applyLanguage(sIdioma);

                // === Cabecera y detalle ===
                oModel.setProperty("/oCabecera", oResp.oCabecera);
                oModel.setProperty("/oDetalle", oResp.oDetalle);
                oModel.setProperty("/oDetalleFiltrado", oResp.oDetalle);

                // === Construir listas únicas para filtros ===
                const aDetalle = oResp.oDetalle || [];

                // 👉 FILTRO A: ahora basado en BANFN (Num. Sol. Pedido)
                const aUniqueBanfn = [...new Set(aDetalle.map(item => item.Banfn))]
                    .map(val => ({ key: val, text: val }));

                const aUniqueMaterial = [...new Set(aDetalle.map(item => item.Material))]
                    .map(val => ({ key: val, text: val }));

                // Guardar en el modelo para MultiInput
                oModel.setProperty("/allBanfn", aUniqueBanfn);
                oModel.setProperty("/oFiltroBanfn", aUniqueBanfn);

                oModel.setProperty("/allMaterial", aUniqueMaterial);
                oModel.setProperty("/oFiltroMaterial", aUniqueMaterial);

                sap.ui.core.BusyIndicator.hide(0);
            }).catch((oError) => {
                this.getMessageBox("error", this.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },

        _onPressNavButtonDetail: function () {
            let jData = undefined;
            that.getModel("oModelProyect").setProperty("/oCabecera", jData);
            const oView = this.getView();
            const oModel = oView.getModel("oModelProyect");

            this.byId("miBanfn")?.removeAllTokens();
            this.byId("miMaterial")?.removeAllTokens();
            this.byId("miBanfn")?.setValue("");
            this.byId("miMaterial")?.setValue("");

            oModel.setProperty("/Main/filter/cbBanfn", []);
            oModel.setProperty("/Main/filter/cbMaterial", []);

            this.oRouter.navTo("View");
        },


        _getData: function (sNumPedido) {
            const that = this;
            try {
                return new Promise(function (resolve) {
                    let sUrl = "";
                    const sTop = "$top=3000";
                    const sExpand = "$expand=toPurOrdItems";
                    const filterExp = `Ebeln eq '${sNumPedido}'`;

                    if (that.local) {
                        const sPath = `/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sExpand}&$format=json&sap-language=ES`;
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) +
                            `/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/PurOrdHeaderSet?${sTop}&$filter=${filterExp}&${sExpand}&$format=json&sap-language=ES`;
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData) {
                                let oCabecera = (oData.data && oData.data.length > 0) ? oData.data[0] : null;

                                // Aplanar detalle
                                let aDetalle = [];
                                if (oCabecera?.toPurOrdItems?.results) {
                                    aDetalle = oCabecera.toPurOrdItems.results.map(item => {
                                        const orderQty = parseFloat(item.Orderquantity) || 0;
                                        const pending = parseFloat(item.Pendingamount) || 0;

                                        return {
                                            Ebeln: item.Ebeln,
                                            Ebelp: item.Ebelp,   // posición (se mantiene)
                                            Banfn: item.Banfn,   // Nro Sol. Pedido (filtro estándar)
                                            Description: item.Description,
                                            QuantityDelivered: that.formatNumber(orderQty - pending),
                                            Orderquantity: that.formatNumber(orderQty),
                                            Pendingamount: that.formatNumber(pending),
                                            Subtotal: that.formatNumber(item.Subtotal),
                                            Material: item.Material,
                                            Um: item.Um,
                                            Unitprice: that.formatNumber(item.Unitprice),
                                            Currency: item.Currency,
                                            Lastdateadmission: that.formatDate(item.Lastdateadmission)
                                        };
                                    });
                                }

                                resolve({
                                    sEstado: "S",
                                    oCabecera: oCabecera,
                                    oDetalle: aDetalle
                                });
                            },
                            error: function () {
                                resolve({ sEstado: "E", oCabecera: null, oDetalle: [] });
                            }
                        });
                    });
                });
            } catch (oError) {
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },

        _onPressExportRespaldo: function () {
            var sIndicador = "ReporteDetalle";
            var oReporte = this.getModel("oModelProyect").getProperty("/oDetalleFiltrado");
            if (this.isEmpty(oReporte)) {
                this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
                return;
            }
            var sAutorExcel = "MESTEFO";
            that.fnExportarExcel(oReporte, [], [], sAutorExcel, sIndicador);
        },

        // --- SUGERENCIAS ---


        onSuggestBanfn: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue") || "";
            const oBinding = oEvent.getSource().getBinding("suggestionItems");
            if (oBinding) {
                oBinding.filter([
                    new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, sValue)
                ]);
            }
        },

        onSuggestMaterial: function (oEvent) {
            const sValue = oEvent.getParameter("suggestValue") || "";
            const oBinding = oEvent.getSource().getBinding("suggestionItems");
            if (oBinding) {
                oBinding.filter([
                    new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, sValue)
                ]);
            }
        },

        onTokenUpdateBanfn: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const aTokens = oEvent.getSource().getTokens();
            const aKeys = aTokens.map(t => t.getKey() || t.getText());
            const aTexts = aTokens.map(t => t.getText());
            oModel.setProperty("/Main/filter/cbBanfn", aKeys);
            oModel.setProperty("/Main/filter/cbBanfnText", aTexts);
        },

        onTokenUpdateMaterial: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const aTokens = oEvent.getSource().getTokens();
            const aKeys = aTokens.map(t => t.getKey() || t.getText());
            const aTexts = aTokens.map(t => t.getText());
            oModel.setProperty("/Main/filter/cbMaterial", aKeys);
            oModel.setProperty("/Main/filter/cbMaterialText", aTexts);
        },

        // --- RESET ---

        onReset: function () {
            const oModel = this.getView().getModel("oModelProyect");

            const miB = this.byId("miBanfn");
            const miM = this.byId("miMaterial");
            miB && (miB.removeAllTokens(), miB.setValue(""));
            miM && (miM.removeAllTokens(), miM.setValue(""));

            oModel.setProperty("/Main/filter/cbBanfn", []);
            oModel.setProperty("/Main/filter/cbBanfnText", []);
            oModel.setProperty("/Main/filter/cbMaterial", []);
            oModel.setProperty("/Main/filter/cbMaterialText", []);

            const aDetalle = Array.isArray(oModel.getProperty("/oDetalle")) ? oModel.getProperty("/oDetalle") : [];
            oModel.setProperty("/oDetalleFiltrado", aDetalle);

            sap.m.MessageToast.show("Filtros limpiados. Mostrando todos los registros.");
        },

        // --- APLICAR FILTROS ---

        _onGoDetail: function () {
            const oModel = this.getView().getModel("oModelProyect");

            const aDetalle = Array.isArray(oModel.getProperty("/oDetalle")) ? oModel.getProperty("/oDetalle") : [];

            const miBanfn = this.byId("miBanfn");
            const miMaterial = this.byId("miMaterial");

            const tokB = miBanfn ? miBanfn.getTokens() : [];
            const tokM = miMaterial ? miMaterial.getTokens() : [];

            const freeB = miBanfn ? (miBanfn.getValue() || "").trim() : "";
            const freeM = miMaterial ? (miMaterial.getValue() || "").trim() : "";

            let reqBanfn = tokB.map(t => t.getKey() || t.getText());
            let reqMaterial = tokM.map(t => t.getKey() || t.getText());

            if (freeB) { reqBanfn.push(freeB); }
            if (freeM) { reqMaterial.push(freeM); }


            if (reqBanfn.length === 0 && reqMaterial.length === 0) {
                oModel.setProperty("/oDetalleFiltrado", aDetalle);
                sap.m.MessageToast.show("No se indicó ningún filtro. Se muestran todos los registros.");
                return;
            }

            const setB = new Set(reqBanfn.map(String));
            const setM = new Set(reqMaterial.map(String));

            const aFiltrado = aDetalle.filter(it =>
                (setB.size && setB.has(String(it.Banfn))) ||
                (setM.size && setM.has(String(it.Material)))
            );

            oModel.setProperty("/oDetalleFiltrado", aFiltrado);

            if (aFiltrado.length === 0) {
                sap.m.MessageToast.show("No se encontraron registros para los filtros ingresados.");
            }
        },
        onLanguageEsp: function () {
            this._applyLanguage("esp");
        },

        onLanguageEng: function () {
            this._applyLanguage("ing");
        },
    });
});
