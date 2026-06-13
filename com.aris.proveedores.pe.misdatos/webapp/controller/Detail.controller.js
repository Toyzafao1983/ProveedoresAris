sap.ui.define([
    "com/aris/proveedores/pe/misdatos/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "com/aris/proveedores/pe/misdatos/model/models",
    "com/aris/proveedores/pe/misdatos/model/formatter",
    "com/aris/proveedores/pe/misdatos/services/Services",
    "com/aris/proveedores/pe/misdatos/util/util",
    "com/aris/proveedores/pe/misdatos/util/utilUI"
], (BaseController, Controller, models, formatter, Services, util, utilUI) => {
    "use strict";
    var that;

    return BaseController.extend("com.aris.proveedores.pe.misdatos.controller.Detail", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Detail").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            this.frgIdFilterDetail = "frgIdFilterDetail";
        },

        handleRouteMatched: function (bInit) {
            sap.ui.core.BusyIndicator.show(0);
            let sNumPedido = this.oRouter.getHashChanger().hash.split("/")[1];

            Promise.all([
                this._getData(sNumPedido)
            ]).then((values) => {

                const oRespHeader = values[0];
                const oDataDetalle = values[0];
                const oModelProyect = that.getModel("oModelProyect");

                let sIdioma = oModelProyect.getProperty("/sIdioma");
                if (!sIdioma) {
                    that._setLanguageModel("esp");
                } else {
                    that._setLanguageModel(sIdioma);
                }

                const aResults = oDataDetalle.oResults || [];
                that._applyBankColumnsVisibility(aResults);

                const oCabecera = aResults[0] || {};

                oModelProyect.setProperty("/oCabecera", oCabecera);
                oModelProyect.setProperty("/oDetalle", aResults);

                sap.ui.core.BusyIndicator.hide(0);
            }).catch((oError) => {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },

        _onPressNavButtonDetail: function () {
            this.oRouter.navTo("View");
        },

        _getData: function (sNumPedido) {
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

                                    const oPrincipal = aEmails[0];
                                    item.MainEmail = oPrincipal ? oPrincipal.Email : "";
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

                                    const oPrincipal = aEmails[0];
                                    item.MainEmail = oPrincipal ? oPrincipal.Email : "";
                                });

                                const aBest = that._dedupeSuppliersByBP(aRaw);

                                oResp.oResults = aBest;
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

        _onPressExportRespaldo: function () {
            var sIndicador = "ReporteDetalle";
            var oReporte = this.getModel("oModelProyect").getProperty("/oDetalle");

            if (this.isEmpty(oReporte)) {
                this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
                return;
            }

            var sAutorExcel = "MESTEFO";
            that.fnExportarExcelDetalle(oReporte, sAutorExcel, sIndicador);
        }
    });
});
