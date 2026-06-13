
sap.ui.define([
    "arisprovmiscomprobantes/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/resource/ResourceModel",
    "arisprovmiscomprobantes/model/models",
    "arisprovmiscomprobantes/model/formatter",
    "arisprovmiscomprobantes/services/Services",
    "arisprovmiscomprobantes/util/util",
    "arisprovmiscomprobantes/util/utilUI",

    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
], (BaseController, Controller, ResourceModel, models, Formatter, Services, util, utilUI, Fragment, Filter, FilterOperator, MessageToast, JSONModel) => {
    "use strict";
    var that;
    let FacXMl;
    formatter: Formatter;

    return BaseController.extend("arisprovmiscomprobantes.controller.Main", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Main").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            if (!that.oModelProyect || !that.oModelProyect.getData().Main) {
                that.getView().setModel(new sap.ui.model.json.JSONModel(models.createModelProyect()), "oModelProyect");
                that.oModelProyect = that.getView().getModel("oModelProyect");
            }
            const oData = that.oModelProyect.getData();
            oData.Filtros = oData.Filtros || {};
            oData.Filtros.Estado = oData.Filtros.Estado || "";
            that.oModelProyect.setData(oData);
            oData.Main = oData.Main || {};
            oData.Main.filter = oData.Main.filter || {};
            oData.Main.filter.fUnidadNegocio = oData.Main.filter.fUnidadNegocio || [];
            oData.Filtros.Proveedores = oData.Filtros.Proveedores || [];
            oData.Filtros.ReceptorPago = oData.Filtros.ReceptorPago || [];
            oData.Main.filter.fCodSap = oData.Main.filter.fCodSap || [];

            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdDocumentUpload = "frgIdDocumentUpload";

        },

        handleRouteMatched: function (bInit) {

            sap.ui.core.BusyIndicator.show(0);

            Promise.all([
                that._getUsers(),
                that._getMisComprobantesFilter()
            ]).then((values) => {
                that._setLanguageModel("esp");
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");

                that.oModelProyect.setSizeLimit(99999999);
                that.oModelData.setSizeLimit(99999999);

                let oUser = values[0]?.Resources?.[0] || {};
                const oUserProfile = that._applyProveedorUserProfile(oUser);

                console.log("=== DEBUG LOGIN IAS MIS COMPROBANTES ===");
                console.log("groups:", oUserProfile.aGroups);
                console.log("customAttribute4:", oUserProfile.sAttribute4);
                console.log("customAttribute5:", oUserProfile.sAttribute5);
                console.log("bEsExterno:", oUserProfile.bIsExtAyc);
                console.log("bEsInterno:", oUserProfile.bIsInterno);
                console.log("sRolPrincipal:", oUserProfile.sRolPrincipal);
                console.log("sExtBP:", oUserProfile.sExtBP);
                console.log("sInternalBP:", oUserProfile.sInternalBP);

                that.oModelData.setProperty("/oFactura", values[1].oResults);
                that.oModelProyect.setProperty("/oFacturaNroCompro", values[1].aNroCompro);
                that.oModelProyect.setProperty("/oFacturaTipoCompro", values[1].aTipoCompro);
                that.oModelProyect.setProperty("/oFacturaFormaPago", values[1].aFormaPago);
                that.oModelProyect.setProperty("/oFacturaMoneda", values[1].aMoneda);
                that.oModelProyect.setProperty("/oFacturaProveedor", values[1].aProveedor);

                that.getModel("oModelUser").setProperty("/Information", oUser);
                that.getModel("oModelUser").setProperty(
                    "/sNameComp",
                    ((oUser.name && oUser.name.givenName) || "") + " " + ((oUser.name && oUser.name.familyName) || "")
                );

                that._getUnidadesNegocio();
                that._loadProveedoresUnicos();

                let sComponentTable = "";
                sComponentTable = "TableMainDesktop";
                if (!that.fragmentTable) {
                    that.fragmentTable = sap.ui.xmlfragment(this.frgIdTableMain, that.route + ".view.fragments." + sComponentTable, that);
                    this._byId("vbTableMain").addItem(that.fragmentTable);
                }
                that._applyExternalSupplierRestriction();
                this._initFiltroFechaPagado();
                sap.ui.core.BusyIndicator.hide(0);

            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });

            let sIdioma = that.getModel("oModelProyect").getProperty("/sIdioma");

            if (sIdioma == undefined) {
                that._setLanguageModel("esp");
            } else {
                that._setLanguageModel(sIdioma);
            }
        },

        _applyExternalSupplierRestriction: function () {
            const oModelUser = this.getModel("oModelUser");
            const oModel = this.getModel("oModelProyect");

            if (!oModelUser || !oModel) {
                return;
            }

            const bEsExterno = !!oModelUser.getProperty("/bEsExterno");
            const sExtBP = String(oModelUser.getProperty("/sExtBP") || "").trim();

            if (!bEsExterno || !sExtBP) {
                return;
            }

            // El externo solo debe consultar su propio BP.
            oModel.setProperty("/Main/filter/fProveedor", [sExtBP]);
            oModel.setProperty("/Main/filter/fCodSap", []);

            const oMIProveedor = this.byId("miProveedor");
            if (oMIProveedor) {
                oMIProveedor.removeAllTokens();
                oMIProveedor.addToken(new sap.m.Token({
                    key: sExtBP,
                    text: sExtBP
                }));
                oMIProveedor.setValue("");
                oMIProveedor.setEnabled(false);
                oMIProveedor.setShowValueHelp(false);
            }

            const oMICodProveedor = this.byId("miCodProveedor");
            if (oMICodProveedor) {
                oMICodProveedor.removeAllTokens();
                oMICodProveedor.setValue("");
                oMICodProveedor.setEnabled(false);
                oMICodProveedor.setShowValueHelp(false);
            }
        },

        _getSupplierByCodeFromModel: function (sSupplierCode) {
            const oModel = this.getModel("oModelProyect");
            const sCode = String(sSupplierCode || "").trim();

            if (!oModel || !sCode) {
                return null;
            }

            const mSupplierByCode = oModel.getProperty("/oSupplierByCode") || {};
            if (mSupplierByCode[sCode]) {
                return mSupplierByCode[sCode];
            }

            const aAll = oModel.getProperty("/oFacturaProveedorAll") || [];
            return aAll.find(function (p) {
                return String(p.SupplierCode || "").trim() === sCode;
            }) || null;
        },

        _applyExternalSupplierRestriction: function () {
            const oModelUser = this.getModel("oModelUser");
            const oModel = this.getModel("oModelProyect");

            if (!oModelUser || !oModel) {
                return;
            }

            const bEsExterno = !!oModelUser.getProperty("/bEsExterno");
            const sExtBP = String(oModelUser.getProperty("/sExtBP") || "").trim();

            if (!bEsExterno || !sExtBP) {
                return;
            }

            const oSupplier = this._getSupplierByCodeFromModel(sExtBP) || {
                RUC: "",
                SupplierCode: sExtBP,
                SupplierName: ""
            };

            const sRUC = String(oSupplier.RUC || "").trim();
            const sName = String(oSupplier.SupplierName || "").trim();

            // Importante:
            // El BP externo debe ir en Código SAP / Código BP.
            // No debe ir como filtro principal en Proveedor.
            oModel.setProperty("/Main/filter/fProveedor", []);
            oModel.setProperty("/Main/filter/fCodSap", [sExtBP]);

            // Campo Proveedor: mostrar RUC - Nombre, solo visual.
            const oMIProveedor = this.byId("miProveedor");
            if (oMIProveedor) {
                oMIProveedor.removeAllTokens();

                if (sRUC || sName) {
                    oMIProveedor.addToken(new sap.m.Token({
                        key: sExtBP,
                        text: this.formatProveedorTexto(sRUC || sExtBP, sName)
                    }));
                }

                oMIProveedor.setValue("");
                oMIProveedor.setEnabled(false);
                oMIProveedor.setShowValueHelp(false);
            }

            // Campo Código SAP / Código BP: aquí sí va el BP del usuario.
            const oMICodProveedor = this.byId("miCodProveedor");
            if (oMICodProveedor) {
                oMICodProveedor.removeAllTokens();
                oMICodProveedor.addToken(new sap.m.Token({
                    key: sExtBP,
                    text: this.formatProveedorTexto(sExtBP, sName)
                }));

                oMICodProveedor.setValue("");
                oMICodProveedor.setEnabled(false);
                oMICodProveedor.setShowValueHelp(false);
            }
        },


        _onPressFilterInit: function () {
            const tbReporte = this._byId("vbTableMain").getItems().length > 0 ? this._byId("vbTableMain").getItems()[0] : null;
            if (!this.isEmpty(tbReporte)) { tbReporte.removeSelections(true); }
            that.setFragment("_dialogFilterInit", this.frgIdFilterInit, "FilterInit", this);

            that._onClearComponentFilter(that.getI18nText("sStateInit"), [], true);
            that._onClearDataFilter();
        },
        _onClearComponentFilter: function (sState, oComponent, bOtherComponent) {
            if (sState === that.getI18nText("sStateInit")) {
                let oContent = that["_dialogFilterInit"].getContent()[0];
                if (that._validatorComponent(oContent)) {
                    oContent.getItems().forEach(function (value) {
                        if (that._validatorComponent(value)) { that._onClearComponentFilter(that.getI18nText("sStateMiddle"), value.getItems(), false); }
                        else { that._clearComponent(value); }
                    });
                } else { that._clearComponent(value); }
            } else if (sState === that.getI18nText("sStateMiddle")) {
                oComponent.forEach(function (value) {
                    if (that._validatorComponent(value)) { that._onClearComponentFilter(that.getI18nText("sStateMiddle"), value.getItems(), false); }
                    else { that._clearComponent(value); }
                });
            }
        },

        onClearFilters: function (oEvent) {
            const oModel = this.getModel("oModelProyect");

            // 1) Dejar /Main/filter con los valores por defecto del modelo
            const oDefault = models.createModelProyect();  // usa el mismo modelo base
            oModel.setProperty("/Main/filter", oDefault.Main.filter);

            // 2) Limpiar controles visuales del FilterBar

            // Unidad de negocio (MultiComboBox)
            const oMcbUN = this.byId("mcbUnidadNegocio");
            if (oMcbUN) {
                oMcbUN.setSelectedKeys([]);
            }

            // Proveedor (MultiInput)
            const oMIProv = this.byId("miProveedor");
            if (oMIProv) {
                oMIProv.removeAllTokens();
                oMIProv.setValue("");
            }

            // Receptor de pago (MultiInput)
            const oMIRec = this.byId("miReceptorPago");
            if (oMIRec) {
                oMIRec.removeAllTokens();
                oMIRec.setValue("");
            }
            const oMICod = this.byId("miCodProveedor");
            if (oMICod) {
                oMICod.removeAllTokens();
                oMICod.setValue("");
            }
            oModel.setProperty("/Main/filter/fCodSap", []);

            // Estado (ComboBox)
            const oCbEstado = this.byId("cbEstado");
            if (oCbEstado) {
                oCbEstado.setSelectedKey("");
            }

            // Fecha pagado (DateRangeSelection)
            const oDRS = this.byId("dprFilterInitPagado");
            if (oDRS) {
                oDRS.setDateValue(null);
                oDRS.setSecondDateValue(null);
            }

            // Factura (MultiComboBox)
            const oMcbFactura = this.byId("mcbFactura");
            if (oMcbFactura) {
                oMcbFactura.setSelectedKeys([]);
                oMcbFactura.setEnabled(false); // como cuando se inicia
            }

            // 3) Limpiar resultados de la tabla
            oModel.setProperty("/oReporte", []);

            // 4) Por si hubiera filtros en el binding de la tabla, los quitamos
            const oTable = this.byId("TableMain") || this._byId("TableMain");
            if (oTable) {
                const oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter([]);
                }
            }

            this._applyExternalSupplierRestriction();
        },

        _onClearDataFilter: function () {
            that.getModel("oModelProyect").setProperty("/", models.createModelProyect());
        },
        _onPressNavigateDetail: function (oEvent) {
            let oSource = oEvent.getSource();
            let oParentRow = oSource.getParent();
            let jRow = oParentRow.getBindingContext("oModelProyect");
            let jData = jRow.getObject();
            that.oModelProyect.setProperty("/oCabecera", jData);
            that.oModelProyect.setProperty("/oDetalle", [jData]);

            that.oRouter.navTo("Detail", {
                app: jData.txt1
            });
        },
        _onPressExecute: function () {

            // 1) Validar obligatorios
            if (!that._validateMandatoryFilters()) {
                return; // No ejecuta nada si falta algún obligatorio
            }

            // 2) Tomar filtros del modelo
            const jFilter = that.oModelProyect.getProperty("/Main/filter") || {};

            sap.ui.core.BusyIndicator.show(0);

            // 3) Llamar a la CDS con filtros en backend
            that._getData(jFilter)
                .then(function (oResp) {

                    if (oResp.sEstado === "E") {
                        that.getMessageBox("error", that.getI18nText("errorData"));
                        that.oModelProyect.setProperty("/oReporte", []);
                    } else {
                        // ✅ Resultado ya filtrado y (opcionalmente) aplanado
                        that.oModelProyect.setProperty("/oReporte", oResp.oResults || []);
                    }

                    // 🔹 MUY IMPORTANTE: limpiar filtros del binding de la tabla
                    const oTable = that.byId("TableMain") || that._byId("TableMain");
                    if (oTable) {
                        const oBinding = oTable.getBinding("items");
                        if (oBinding) {
                            oBinding.filter([]);   // sin filtros adicionales en el binding
                        }
                    }

                    sap.ui.core.BusyIndicator.hide(0);
                })
                .catch(function (oError) {
                    console.error("❌ Error en _onPressExecute/_getData:", oError);
                    that.getMessageBox("error", that.getI18nText("errorData"));
                    sap.ui.core.BusyIndicator.hide(0);
                });
        },


        _getData: function (jFilter) {
            try {
                const oResp = { sEstado: "E", oResults: [] };
                const thatLocal = this;

                // Si no te pasan jFilter, lo tomas del modelo
                jFilter = jFilter || thatLocal.getModel("oModelProyect").getProperty("/Main/filter") || {};

                // Helper: armar OR de un campo con varios valores
                const addOrGroup = function (sField, aValues, aParts) {
                    if (!Array.isArray(aValues) || !aValues.length) {
                        return;
                    }

                    if (aValues.length === 1) {
                        aParts.push(sField + " eq '" + aValues[0] + "'");
                    } else {
                        const a = aValues.map(function (v) {
                            return sField + " eq '" + v + "'";
                        });
                        aParts.push("(" + a.join(" or ") + ")");
                    }
                };

                // Helper: fechas → YYYYMMDD
                const toYYYYMMDD = function (vDate) {
                    if (!vDate) { return ""; }
                    const d = vDate instanceof Date ? vDate : new Date(vDate);
                    if (isNaN(d.getTime())) { return ""; }

                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, "0");
                    const day = String(d.getDate()).padStart(2, "0");
                    return "" + y + m + day; // ej. 20251121
                };

                // Mapear estado del front (PAGADO / PENDIENTE) al texto de la CDS
                const mapEstadoToSrv = function (sEstadoUI) {
                    if (sEstadoUI === "PAGADO") { return "Pagado"; }
                    if (sEstadoUI === "PENDIENTE") { return "Pendiente"; }
                    return "";
                };


                // Clases de documento que deben mostrar el importe con signo negativo
                const aClasesDocImporteNegativo = ["07", "KG", "97"];

                const normalizeClaseDoc = function (sClaseDoc) {
                    const sValue = String(sClaseDoc || "").trim().toUpperCase();

                    // Si por algún motivo llega como número 7, lo tratamos como "07"
                    if (/^\d+$/.test(sValue)) {
                        return sValue.padStart(2, "0");
                    }

                    return sValue;
                };

                const isClaseDocImporteNegativo = function (sClaseDoc) {
                    return aClasesDocImporteNegativo.includes(normalizeClaseDoc(sClaseDoc));
                };

                const formatImporteDocByClaseDoc = function (vImporte, sClaseDoc) {
                    if (vImporte === undefined || vImporte === null || vImporte === "") {
                        return "";
                    }

                    const sImporte = String(vImporte).replace(/,/g, "");
                    let nImporte = Number(sImporte);

                    if (isNaN(nImporte)) {
                        return vImporte;
                    }

                    if (isClaseDocImporteNegativo(sClaseDoc) && nImporte !== 0) {
                        nImporte = -Math.abs(nImporte);
                    }

                    return thatLocal.formatNumber(nImporte);
                };

                // 🔹 Mapa BP → Nombre de proveedor (para PROVEEDOR y RECEPTOR_PAGO)
                const mSupplierByCode = thatLocal.oModelProyect.getProperty("/oSupplierByCode") || {};
                const mSupByCode = {};

                Object.keys(mSupplierByCode).forEach(function (sCode) {
                    mSupByCode[sCode] = mSupplierByCode[sCode].SupplierName || "";
                });

                // 🔹 Aplanar cabecera + toMisComprobantes, formatear fechas y poner nombres
                const flattenMisComprobantes = function (aHeaders) {
                    const aFlat = [];
                    const aDateFields = [
                        "FECHA_CONTAB",
                        "FECHA_EMISION",
                        "FECHA_EST_PAGO",
                        "FECHA_PAGO",
                        "FECHA_RECEP",
                        "FECHA_VENC"
                    ];

                    (aHeaders || []).forEach(function (oHeader) {
                        const aDet = (oHeader.toMisComprobantes && oHeader.toMisComprobantes.results) || [];

                        const fnEnrichRow = function (oRow) {
                            delete oRow.__metadata;
                            delete oRow.toMisComprobantes;

                            // 🔹 Formatear fechas con your BaseController.formatDate
                            aDateFields.forEach(function (sField) {
                                if (oRow[sField]) {
                                    oRow[sField] = thatLocal.formatDate(oRow[sField]);
                                }
                            });

                            if (oRow.IMPORTE_DOC !== undefined && oRow.IMPORTE_DOC !== null && oRow.IMPORTE_DOC !== "") {
                                oRow.IMPORTE_DOC = formatImporteDocByClaseDoc(oRow.IMPORTE_DOC, oRow.CLASE_DOC);
                            }

                            const sProvCode = String(oRow.PROVEEDOR || "").trim();
                            oRow.PROVEEDOR_NOMBRE = mSupByCode[sProvCode] || oRow.PROVEEDOR_NOMBRE || sProvCode || "";

                            const sRecCode = String(oRow.RECEPTOR_PAGO || "").trim();
                            oRow.RECEPTOR_PAGO_NOMBRE = mSupByCode[sRecCode] || oRow.RECEPTOR_PAGO_NOMBRE || sRecCode || "";

                            return oRow;
                        };

                        // Sin detalle
                        if (!aDet.length) {
                            const oRow = fnEnrichRow(Object.assign({}, oHeader));
                            aFlat.push(oRow);
                        } else {
                            // Con detalle
                            aDet.forEach(function (oItem) {
                                const oRow = fnEnrichRow(Object.assign({}, oHeader, oItem));
                                aFlat.push(oRow);
                            });
                        }
                    });

                    return aFlat;
                };

                return new Promise(function (resolve, reject) {

                    const sEstadoUI = jFilter.fEstado;
                    const sEstadoSrv = mapEstadoToSrv(sEstadoUI);

                    // 🔸 1) Construir la parte base del filtro (SIN PROVEEDOR)
                    const aBaseParts = [];

                    // Siempre: SOCIEDAD (unidad de negocio)
                    addOrGroup("SOCIEDAD", jFilter.fUnidadNegocio, aBaseParts);

                    // Estado
                    if (sEstadoSrv) {
                        aBaseParts.push("ESTADOCOMPROBANTE eq '" + sEstadoSrv + "'");
                    }

                    // Solo si ESTADO = PAGADO → DESDE / HASTA
                    if (sEstadoUI === "PAGADO" &&
                        jFilter.fFechaComproFrom && jFilter.fFechaComproTo) {

                        const sDesde = toYYYYMMDD(jFilter.fFechaComproFrom);
                        const sHasta = toYYYYMMDD(jFilter.fFechaComproTo);

                        if (sDesde) { aBaseParts.push("DESDE eq '" + sDesde + "'"); }
                        if (sHasta) { aBaseParts.push("HASTA eq '" + sHasta + "'"); }
                    }

                    // 🔸 2) Unificar proveedores de AMBOS filtros:
                    // - jFilter.fProveedor (MultiInput Proveedor)
                    // - jFilter.fCodSap   (MultiInput Código SAP)
                    let aProvByProveedor = Array.isArray(jFilter.fProveedor) ? jFilter.fProveedor : [];
                    let aProvByCodSap = Array.isArray(jFilter.fCodSap) ? jFilter.fCodSap : [];

                    const bEsExterno = !!thatLocal.getModel("oModelUser")?.getProperty("/bEsExterno");
                    const sExtBP = String(thatLocal.getModel("oModelUser")?.getProperty("/sExtBP") || "").trim();

                    // Si es externo, se ignoran los filtros manipulables del frontend.
                    // Solo se consulta el BP de customAttribute4.
                    if (bEsExterno && sExtBP) {
                        aProvByProveedor = [sExtBP];
                        aProvByCodSap = [];
                        thatLocal.oModelProyect.setProperty("/Main/filter/fProveedor", [sExtBP]);
                        thatLocal.oModelProyect.setProperty("/Main/filter/fCodSap", []);
                    }

                    const mCodes = {};
                    const aProveedoresToCall = [];

                    aProvByProveedor.forEach(function (c) {
                        if (c && !mCodes[c]) {
                            mCodes[c] = true;
                            aProveedoresToCall.push(c);
                        }
                    });

                    aProvByCodSap.forEach(function (c) {
                        if (c && !mCodes[c]) {
                            mCodes[c] = true;
                            aProveedoresToCall.push(c);
                        }
                    });

                    console.log("🔍 fProveedor:", aProvByProveedor);
                    console.log("🔍 fCodSap  :", aProvByCodSap);
                    console.log("🔍 Proveedores a consultar (unión):", aProveedoresToCall);

                    // 🔸 3) Construcción de la URL base (local vs BTP)
                    let sUrlBase = "";
                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/I_MisComprobantesSet";
                        sUrlBase = thatLocal.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(thatLocal.route) +
                            "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/I_MisComprobantesSet";
                        sUrlBase = sPath;
                    }

                    // 🔸 4) Helper para construir URL por cada proveedor
                    const buildUrlForProveedor = function (sProveedor) {
                        const aParts = aBaseParts.slice(); // copia de base

                        if (sProveedor) {
                            // ❗ Aquí es donde se filtra POR UN SOLO PROVEEDOR
                            aParts.push("PROVEEDOR eq '" + sProveedor + "'");
                        }

                        const sFilterFinal = aParts.join(" and ");
                        const aParams = [];

                        if (sFilterFinal) {
                            aParams.push("$filter=" + encodeURIComponent(sFilterFinal));
                        }
                        aParams.push("$expand=toMisComprobantes");
                        aParams.push("$format=json");
                        aParams.push("sap-language=ES");

                        return sUrlBase + "?" + aParams.join("&");
                    };

                    // 🔸 5) Acumulador de headers de TODAS las llamadas
                    let aHeadersAll = [];

                    const fnCallOneProveedor = function (sProveedor) {
                        return new Promise(function (resolveOne) {
                            const sUrl = buildUrlForProveedor(sProveedor);
                            console.log("➡️ _getData MisComprobantes - URL:", sUrl);

                            Services.getoDataERPSync(thatLocal, sUrl, function (result) {
                                util.response.validateAjaxGetERPNotMessage(result, {
                                    success: function (oData) {

                                        let aHeaders = [];

                                        // Normalizar posibles formas de respuesta
                                        if (oData && oData.data) {
                                            if (Array.isArray(oData.data)) {
                                                aHeaders = oData.data;
                                            } else if (oData.data.d && Array.isArray(oData.data.d.results)) {
                                                aHeaders = oData.data.d.results;
                                            }
                                        } else if (oData && oData.d && Array.isArray(oData.d.results)) {
                                            aHeaders = oData.d.results;
                                        }

                                        if (Array.isArray(aHeaders) && aHeaders.length) {
                                            aHeadersAll = aHeadersAll.concat(aHeaders);
                                        }

                                        console.log("   ➕ Proveedor", sProveedor, "trajo", aHeaders.length, "registros. Total acumulado:", aHeadersAll.length);

                                        resolveOne();
                                    },
                                    error: function (message) {
                                        console.error("❌ Error en servicio MisComprobantes (proveedor:", sProveedor, "):", message);
                                        // No rompemos toda la consulta, seguimos con el resto
                                        resolveOne();
                                    }
                                });
                            });
                        });
                    };

                    // Si no hay proveedores que consultar, devolvemos vacío
                    if (!aProveedoresToCall.length) {
                        console.warn("⚠️ _getData llamado sin proveedores ni código SAP. Devuelvo vacío.");
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        thatLocal.oModelProyect.setProperty("/oReporte", []);
                        resolve(oResp);
                        return;
                    }

                    const aCalls = aProveedoresToCall.map(fnCallOneProveedor);

                    Promise.all(aCalls).then(function () {

                        console.log("✅ Total headers acumulados en todas las llamadas:", aHeadersAll.length);

                        // 1️⃣ Aplanar + fechas + nombres proveedor/receptor
                        const aFlat = flattenMisComprobantes(aHeadersAll);
                        console.log("✅ Registros después de aplanar (aFlat):", aFlat.length);

                        // 2️⃣ Filtro de facturas por MultiCombo (NRO_FACTURA)
                        let aAfterFactura = aFlat;
                        const aFactSel = jFilter.fFactura;
                        if (Array.isArray(aFactSel) && aFactSel.length) {
                            aAfterFactura = aAfterFactura.filter(function (oRow) {
                                return aFactSel.includes(oRow.NRO_FACTURA);
                            });
                        }
                        console.log("✅ Registros después de filtro de facturas (aAfterFactura):", aAfterFactura.length);

                        // 3️⃣ Filtros de front (RECEPTOR_PAGO, FECHA_EMISION, etc.)
                        const aFinal = thatLocal._applyFrontendFilters(aAfterFactura, jFilter);
                        console.log("✅ Registros finales después de filtros front (aFinal):", aFinal.length);



                        /*const aFinal = thatLocal._applyFrontendFilters(aAfterFactura, jFilter);
                        console.log("✅ Registros finales después de filtros front (aFinal):", aFinal.length);*/

                        oResp.sEstado = "S";
                        oResp.oResults = aFinal;
                        thatLocal.oModelProyect.setProperty("/oReporte", aFinal);

                        resolve(oResp);

                    }).catch(function (err) {
                        console.error("❌ Excepción en llamadas múltiples MisComprobantes:", err);
                        oResp.sEstado = "E";
                        oResp.oResults = [];
                        thatLocal.oModelProyect.setProperty("/oReporte", []);
                        resolve(oResp);
                    });

                });

            } catch (oError) {
                console.error("❌ Excepción en _getData:", oError);
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
                return Promise.reject(oError);
            }
        },

        // para cambiar el idioma
        onLanguageEsp: function () {
            this._setLanguageModel("esp");
        },

        onLanguageEng: function () {
            this._setLanguageModel("ing");
        },

        _onPressFacturaExt: function () {

            that.setFragment("_dialogRegistrarFac", this.frgIdRegistrarFac, "RegistrarFacExt", this);

        },

        _onPressFactura: function () {

            that.setFragment("_dialogRegistrarFac1", this.frgIdRegistrarFac1, "RegistrarFac", this);

        },
        ChangeXML: function (e, callback) {
            var identificadorNDAP;
            let self = this,
                file = e.getParameter("files") && e.getParameter("files")[0]

            if (file && window.FileReader) {
                let reader = new FileReader();
                reader.onload = function (evn) {
                    let parser = new DOMParser(),
                        xmlDoc = parser.parseFromString(event.target.result, "text/xml");

                    //----------------------kestefo@06/03/2024------------------------
                    FacXMl = self.xmlToJson(xmlDoc);
                    callback();

                }
                reader.readAsText(file);
            }

        },
        readFileAsync: function (file) {
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = function (event) {
                    resolve(event.target.result);
                };
                reader.onerror = function (error) {
                    reject(error);
                };
                reader.readAsText(file);
            });
        },


        _formatPercent: function (value) {
            const num = parseFloat(value);
            return isNaN(num) ? "" : `${num.toFixed(1)}%`;
        },
        _formatDate: function (sDate) {
            if (!sDate) return "";

            const [year, month, day] = sDate.split("-");
            return `${day}/${month}/${year}`;
        },

        _onPressPrueba: function () {
            that.oRouter.navTo("Detail", {
                app: "2"
            });
        },

        pressPDF: function (oEvent) {

            var oItem = oEvent.getSource().getBindingContext("oModelProyect").getObject();

            if (oItem.txtPDF) {

                var sPath = sap.ui.require.toUrl("arisprovmiscomprobantes/" + oItem.txtPDF);


                if (!this._pdfViewer) {
                    this._pdfViewer = new sap.m.PDFViewer({
                        title: "Factura",
                        source: sPath
                    });
                    this.getView().addDependent(this._pdfViewer);
                } else {
                    this._pdfViewer.setSource(sPath);
                }

                // Abrir visor
                this._pdfViewer.open();

            } else {
                sap.m.MessageToast.show("No hay PDF disponible para esta factura.");
            }
        },
        _onPressUploadDocument: function () {

            that.setFragment("_dialogsDocumentUpload", this.frgIdDocumentUpload, "DocumentUpload", this);

        },

        ChangeXML2: function (oEvent) {
            const that = this;

            // Llama a tu función ChangeXML para obtener el XML ya parseado (FacXMl)
            this.ChangeXML(oEvent, async function () {
                try {
                    const oView = that.getView();
                    const oModel = oView.getModel("oModelProyect");
                    const oOData = oView.getModel("oModelEntity"); // Modelo OData definido en el manifest
                    const aItems = oModel.getProperty("/oReporte") || [];
                    const oFactura = FacXMl?.Invoice;

                    if (!oFactura) {
                        sap.m.MessageToast.show("⚠️ El archivo XML no contiene una estructura válida de factura electrónica (UBL).");
                        return;
                    }

                    // 📦 Extraer campos principales del XML (SUNAT)
                    const sNumeroFactura = oFactura?.ID?.value || "";
                    const sFechaEmision = that._formatDate(oFactura?.IssueDate?.value);
                    const sFechaVencimiento = that._formatDate(oFactura?.DueDate?.value);
                    const sMontoTotal = parseFloat(oFactura?.LegalMonetaryTotal?.PayableAmount?.value || "0");
                    const sRucProveedor = oFactura?.AccountingSupplierParty?.Party?.PartyIdentification?.ID?.value || "";
                    const sRazonSocialProv = oFactura?.AccountingSupplierParty?.Party?.PartyLegalEntity?.RegistrationName?.value || "";
                    const sRucCliente = oFactura?.AccountingCustomerParty?.Party?.PartyIdentification?.ID?.value || "";
                    const sRazonSocialCli = oFactura?.AccountingCustomerParty?.Party?.PartyLegalEntity?.RegistrationName?.value || "";
                    const sMoneda = oFactura?.LegalMonetaryTotal?.PayableAmount?.attributes?.currencyID || "PEN";
                    const sFormaPago = oFactura?.PaymentMeans?.PaymentMeansCode?.value === "1" ? "Contado" : "Crédito";

                    if (!sNumeroFactura || !sRucProveedor) {
                        sap.m.MessageToast.show("❗ Falta información clave en el XML (número de factura o RUC del proveedor).");
                        return;
                    }

                    // 🔁 Evitar duplicados
                    const bDuplicado = aItems.some(item => item.NroCompro === sNumeroFactura);
                    if (bDuplicado) {
                        sap.m.MessageToast.show(`⚠️ La factura ${sNumeroFactura} ya fue cargada anteriormente.`);
                        return;
                    }

                    // 🧩 Función de utilidad para formatear fecha según tipo OData
                    const formatFecPagoPlan = (sFecha, bDateTime = false) => {
                        if (!sFecha) return null;
                        const dVen = new Date(sFecha);
                        if (isNaN(dVen.getTime())) return null;

                        // Si el campo en el servicio es tipo Edm.DateTime → /Date(...)/, caso contrario → YYYY-MM-DD
                        return bDateTime
                            ? `/Date(${dVen.getTime()})/`             // Para Edm.DateTime
                            : dVen.toISOString().split("T")[0];       // Para Edm.Date
                    };

                    // 🕒 Fechas en formato OData
                    const dHoy = new Date();
                    const sFechaCarga = `/Date(${dHoy.getTime()})/`;

                    // 👉 Escoge aquí según lo que uses en el backend:
                    // true  → si tu servicio tiene FecPagoPlan como Edm.DateTime
                    // false → si tu servicio tiene FecPagoPlan como Edm.Date
                    const bUsaDateTime = false; // ⚙️ CAMBIA AQUÍ según tu servicio OData

                    const sFecPagoPlan = formatFecPagoPlan(sFechaVencimiento, bUsaDateTime);

                    // 🧾 Construir objeto para el servicio OData
                    const oPayload = {
                        NroCompro: sNumeroFactura,
                        FecPagoPlan: sFecPagoPlan,
                        TipoCompro: "Factura",
                        Estado: "Facturado",
                        FechaCarga: sFechaCarga,
                        FormaPago: sFormaPago,
                        // CodProveedor: sRucProveedor,
                        NomProveedor: sRazonSocialProv,
                        // CodCliente: sRucCliente,
                        NomCliente: sRazonSocialCli,
                        FacturaEmision: sFechaEmision,
                        Moneda: sMoneda,
                        Total: sMontoTotal.toFixed(2)
                    };

                    sap.ui.core.BusyIndicator.show(0);

                    // 📤 Enviar al servicio OData (POST)
                    await new Promise((resolve, reject) => {
                        oOData.create("/RecordInvoicesSet", oPayload, {
                            success: function (oData, response) {
                                resolve(oData);
                            },
                            error: function (oError) {
                                reject(oError);
                            }
                        });
                    });

                    sap.ui.core.BusyIndicator.hide();

                    // ✅ Si se creó correctamente, agregar a la tabla local
                    aItems.push(oPayload);
                    oModel.setProperty("/oReporte", aItems);
                    oModel.refresh(true);

                    sap.m.MessageToast.show(`✅ Factura ${sNumeroFactura} registrada exitosamente en SAP.`);

                } catch (error) {
                    sap.ui.core.BusyIndicator.hide();
                    console.error("❌ Error al procesar/enviar factura:", error);
                    sap.m.MessageBox.error("Ocurrió un error al enviar la factura. Revisa la consola para más detalles.");
                }
            });
        },
        onChange: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const aFiles = Array.from(oEvent.getParameter("files") || []);
            const aDocs = oModel.getProperty("/documentos") || [];
            aFiles.forEach(file => {
                aDocs.push({
                    fileName: file.name,
                    mimeType: file.type,
                    fileSize: file.size,
                    url: URL.createObjectURL(file), // genera un link temporal
                    uploaded: false
                });
            });
            oModel.setProperty("/documentos", aDocs);
        },

        onUploadComplete: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const sFileName = oEvent.getParameter("files")[0]?.fileName;

            if (sFileName) {
                let aDocs = oModel.getProperty("/documentos") || [];
                aDocs = aDocs.map(doc => {
                    if (doc.fileName === sFileName) {
                        doc.uploaded = true; // marcar como subido
                    }
                    return doc;
                });
                oModel.setProperty("/documentos", aDocs);
            }
        },

        onFileDeleted: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const sFileName = oEvent.getParameter("item").getFileName();

            let aDocs = oModel.getProperty("/documentos") || [];
            aDocs = aDocs.filter(doc => doc.fileName !== sFileName);

            oModel.setProperty("/documentos", aDocs);
        },

        onGuardar: function () {
            const oModel = this.getView().getModel("oModelProyect");

            // 1. Obtener datos del formulario y documentos
            const oInputForm = oModel.getProperty("/inputForm") || {};
            const aDocs = oModel.getProperty("/documentos") || [];

            // 🔹 Generar fecha de carga en formato es-PE
            const sFechaSubida = new Date().toLocaleString("es-PE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }).replace(",", "");

            // 2. Crear el nuevo registro (ajusta claves según tu tabla)
            const oNuevoRegistro = {
                txt15: oInputForm.voucher || "",
                txt25: oInputForm.tipo || "",
                txt24: oInputForm.metodoPago || "",
                txt19: oInputForm.proveedorNombre || "",
                txt18: oInputForm.proveedorCodigo || "",
                txt14: oInputForm.clienteNombre || "",
                txt7: oInputForm.total || "",
                txt16: oInputForm.monto || "",
                txt22: oInputForm.fechaEmision || "",
                txt23: sFechaSubida,   // 🔹 aquí agregamos la fecha de carga
                documentos: [...aDocs]
            };

            // 3. Obtener lista actual de reportes
            const aReporte = oModel.getProperty("/oReporte") || [];

            // 4. Agregar el nuevo registro
            aReporte.push(oNuevoRegistro);

            // 5. Actualizar modelo → Esto repinta la tabla automáticamente
            oModel.setProperty("/oReporte", aReporte);

            // 6. Limpiar formulario y documentos
            oModel.setProperty("/inputForm", {});
            oModel.setProperty("/documentos", []);

            // 7. Cerrar el diálogo fragment
            const oDialog = sap.ui.core.Fragment.byId("frgIdDocumentUpload", "IdDocumentUpload");
            if (oDialog) {
                oDialog.close();
            }
        },
        _onPressExportRespaldo: function () {
            var sIndicador = "Mis Comprobantes";
            var oReporte = this.getModel("oModelProyect").getProperty("/oReporte");
            if (this.isEmpty(oReporte)) {
                this.getMessageBox("error", this.getI18nText("errorNoDataExport"));
                return;
            }
            var sAutorExcel = "HSOLER";
            that.fnExportarExcel(oReporte, [], [], sAutorExcel, sIndicador)
        },
        _getUnidadesNegocio: function () {
            const that = this;
            let sUrl = "";

            if (that.local) {
                const sPath = `/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/DatosEmpresasSet` +
                    `?$select=EMPRESA,DESCRIPCION&$top=8000&$format=json&sap-language=ES`;
                sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
            } else {
                const sPath = jQuery.sap.getModulePath(that.route) +
                    `/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/DatosEmpresasSet` +
                    `?$select=EMPRESA,DESCRIPCION&$top=8000&$format=json&sap-language=ES`;
                sUrl = sPath;
            }

            return new Promise((resolve, reject) => {
                Services.getoDataERPSync(that, sUrl, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: function (oData) {
                            let aEmpresas = [];
                            const aSociedadesExcluir = ["1005", "1050", "1051", "1052"];

                            if (oData && oData.data) {
                                if (Array.isArray(oData.data)) {
                                    aEmpresas = oData.data;
                                } else if (oData.data.d && Array.isArray(oData.data.d.results)) {
                                    aEmpresas = oData.data.d.results;
                                }
                            }

                            aEmpresas = (aEmpresas || []).map(item => {
                                return {
                                    EMPRESA: (item.EMPRESA || "").trim(),
                                    DESCRIPCION: item.DESCRIPCION || ""
                                };
                            }).filter(e =>
                                e.EMPRESA &&
                                e.EMPRESA.trim() !== "" &&
                                !aSociedadesExcluir.includes(e.EMPRESA)
                            );

                            const map = new Map();
                            aEmpresas.forEach(e => map.set(e.EMPRESA, e));
                            const aUnidadNegocioFinal = Array.from(map.values());

                            that.oModelProyect.setProperty("/oUnidadNegocio", aUnidadNegocioFinal);

                            resolve(aUnidadNegocioFinal);
                        },
                        error: function (err) {
                            console.error("❌ Error cargando unidades de negocio:", err);
                            that.oModelProyect.setProperty("/oUnidadNegocio", []);
                            reject(err);
                        }
                    });
                });
            });
        },
        onUnidadNegocioSelectionFinish: function (oEvent) {
            const oMCB = oEvent.getSource();
            const oModel = this.getModel("oModelProyect");

            // Todas las claves seleccionadas actualmente
            let aKeys = oMCB.getSelectedKeys() || [];

            if (!aKeys.length) {
                // Nada seleccionado
                oModel.setProperty("/Main/filter/fUnidadNegocio", []);
                return;
            }

            // 🔹 Nos quedamos solo con la última seleccionada
            const sLastKey = aKeys[aKeys.length - 1];

            // Forzamos que el MultiCombo tenga solo esa
            oMCB.setSelectedKeys([sLastKey]);

            // Y guardamos igual como array en el modelo (consistente con MultiCombo)
            oModel.setProperty("/Main/filter/fUnidadNegocio", [sLastKey]);

            this._updateFacturaFilterState();
        },

        _loadProveedoresUnicos: function () {
            const that = this;
            let sUrl = "";

            if (that.local) {
                const sPath = `/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier` +
                    `?$select=TaxID1,TaxID2,SupplierName,SupplierCode&$top=8000&$format=json&sap-language=ES`;
                sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
            } else {
                const sPath = jQuery.sap.getModulePath(that.route) +
                    `/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/Supplier` +
                    `?$select=TaxID1,TaxID2,SupplierName,SupplierCode&$top=8000&$format=json&sap-language=ES`;
                sUrl = sPath;
            }

            return new Promise((resolve, reject) => {
                Services.getoDataERPSync(that, sUrl, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: function (oData) {
                            let aRaw = [];

                            if (oData && Array.isArray(oData.data)) {
                                aRaw = oData.data;
                            } else if (oData && oData.data && oData.data.d && Array.isArray(oData.data.d.results)) {
                                aRaw = oData.data.d.results;
                            } else if (oData && oData.d && Array.isArray(oData.d.results)) {
                                aRaw = oData.d.results;
                            }

                            let aProveedoresAll = aRaw.map(function (item) {
                                const sRuc = String(item.TaxID1 || item.TaxID2 || "").trim();
                                const sCode = String(item.SupplierCode || "").trim();

                                return {
                                    RUC: sRuc,
                                    SupplierName: item.SupplierName || "",
                                    SupplierCode: sCode
                                };
                            }).filter(function (p) {
                                return p.SupplierCode;
                            });

                            // Mapa completo BP -> datos Supplier.
                            // Este mapa se usa para llenar PROVEEDOR_NOMBRE y RECEPTOR_PAGO_NOMBRE.
                            const mSupplierByCode = {};
                            aProveedoresAll.forEach(function (p) {
                                mSupplierByCode[p.SupplierCode] = p;
                            });

                            that.oModelProyect.setProperty("/oFacturaProveedorAll", aProveedoresAll);
                            that.oModelProyect.setProperty("/oSupplierByCode", mSupplierByCode);

                            // Lista para value help de Proveedor.
                            // Interno: se mantiene lista sin duplicados por RUC.
                            // Externo: solo se deja su BP de customAttribute4.
                            const bEsExterno = !!that.getModel("oModelUser")?.getProperty("/bEsExterno");
                            const sExtBP = String(that.getModel("oModelUser")?.getProperty("/sExtBP") || "").trim();

                            let aProveedorFinal = [];

                            if (bEsExterno && sExtBP) {
                                const oExtSupplier = mSupplierByCode[sExtBP] || {
                                    RUC: "",
                                    SupplierName: "",
                                    SupplierCode: sExtBP
                                };

                                aProveedorFinal = [oExtSupplier];
                            } else {
                                const mapRuc = new Map();

                                aProveedoresAll
                                    .filter(function (p) {
                                        return p.RUC && p.RUC.trim() !== "";
                                    })
                                    .forEach(function (p) {
                                        mapRuc.set(p.RUC, p);
                                    });

                                aProveedorFinal = Array.from(mapRuc.values());
                            }

                            that.oModelProyect.setProperty("/oFacturaProveedor", aProveedorFinal);

                            // Para externo, una vez que Supplier ya cargó, llenar:
                            // Proveedor = RUC
                            // Código BP = BP
                            that._applyExternalSupplierRestriction();

                            console.log("✅ Proveedores cargados:", aProveedorFinal);
                            console.log("✅ Supplier map por BP:", mSupplierByCode);

                            resolve(aProveedorFinal);
                        },
                        error: function (err) {
                            console.error("❌ Error cargando proveedores:", err);
                            that.oModelProyect.setProperty("/oFacturaProveedor", []);
                            that.oModelProyect.setProperty("/oFacturaProveedorAll", []);
                            that.oModelProyect.setProperty("/oSupplierByCode", {});
                            reject(err);
                        }
                    });
                });
            });
        },

        _addProveedorToken: function (sSupplierCode, sTexto) {
            if (!sSupplierCode) { return; }

            const oMI = this.byId("miProveedor");
            const oModel = this.getModel("oModelProyect");

            // Evitar tokens duplicados
            const aTokensActuales = oMI.getTokens() || [];
            const bYaExiste = aTokensActuales.some(t => t.getKey && t.getKey() === sSupplierCode);
            if (!bYaExiste) {
                oMI.addToken(new sap.m.Token({
                    key: sSupplierCode,          // 👈 ahora la key es SupplierCode
                    text: sTexto || sSupplierCode // texto sigue siendo "RUC - Nombre"
                }));
            }

            // Guardar SIEMPRE SupplierCode en /Main/filter/fProveedor
            let aSel = oModel.getProperty("/Main/filter/fProveedor") || [];
            if (!aSel.includes(sSupplierCode)) {
                aSel.push(sSupplierCode);
                oModel.setProperty("/Main/filter/fProveedor", aSel);
            }
            this._updateFacturaFilterState();
        },


        onProveedorSuggestionItemSelected: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) { return; }

            const sSupplierCode = oItem.getKey();  // viene de key="{...>SupplierCode}"
            const sTexto = oItem.getText(); // "RUC - Nombre"

            this._addProveedorToken(sSupplierCode, sTexto);
        },

        onProveedorTokenUpdate: function (oEvent) {
            const sType = oEvent.getParameter("type");
            if (sType !== "removed" && sType !== "removedAll") {
                return;
            }

            const oModel = this.getModel("oModelProyect");
            let aSel = oModel.getProperty("/Main/filter/fProveedor") || [];
            const aRemoved = oEvent.getParameter("removedTokens") || [];

            if (sType === "removedAll") {
                aSel = [];
            } else {
                aRemoved.forEach(oToken => {
                    const sKey = oToken.getKey();
                    aSel = aSel.filter(code => code !== sKey);
                });
            }

            // Actualizamos el modelo
            oModel.setProperty("/Main/filter/fProveedor", aSel);

            // 🔁 Sincronizar el SelectDialog (si existe)
            if (this._oVHProveedor) {
                const aItems = this._oVHProveedor.getItems() || [];
                aItems.forEach(oItem => {
                    const oCtx = oItem.getBindingContext("oModelProyect");
                    if (!oCtx) { return; }
                    const sCode = oCtx.getProperty("SupplierCode");
                    oItem.setSelected(aSel.includes(sCode));
                });
            }

            this._updateFacturaFilterState();
        },

        onValueHelpProveedor: function () {
            const oModel = this.getModel("oModelProyect");

            if (!this._oVHProveedor) {
                this._oVHProveedor = new sap.m.SelectDialog({
                    title: this.getI18nText("filtros.proveedor.vh.title"),
                    multiSelect: true,
                    rememberSelections: true, // podemos dejarlo true, pero sincronizando
                    search: this._onSearchProveedorDialog.bind(this),
                    confirm: this._onConfirmProveedorDialog.bind(this),
                    cancel: this._onConfirmProveedorDialog.bind(this),
                    items: {
                        path: "oModelProyect>/oFacturaProveedor",
                        template: new sap.m.StandardListItem({
                            title: "{oModelProyect>RUC}",
                            description: "{oModelProyect>SupplierName}"
                        })
                    }
                });

                this.getView().addDependent(this._oVHProveedor);
            }

            const aSelCodes = oModel.getProperty("/Main/filter/fProveedor") || [];

            const fnSyncSelection = () => {
                const aItems = this._oVHProveedor.getItems() || [];
                aItems.forEach(oItem => {
                    const oCtx = oItem.getBindingContext("oModelProyect");
                    if (!oCtx) { return; }
                    const sCode = oCtx.getProperty("SupplierCode");
                    oItem.setSelected(aSelCodes.includes(sCode));
                });
            };

            // Sincronizamos una sola vez cada vez que abrimos
            this._oVHProveedor.attachEventOnce("afterOpen", fnSyncSelection);

            this._oVHProveedor.open();
        },

        _onSearchProveedorDialog: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const oBinding = oEvent.getSource().getBinding("items");

            if (!oBinding) { return; }

            let aFilters = [];
            if (sValue) {
                aFilters = [
                    new Filter([
                        new Filter("RUC", FilterOperator.Contains, sValue),
                        new Filter("SupplierName", FilterOperator.Contains, sValue)
                    ], false) // OR
                ];
            }

            oBinding.filter(aFilters);
        },
        _onConfirmProveedorDialog: function (oEvent) {
            const aSelectedItems = oEvent.getParameter("selectedItems") || [];

            const oModel = this.getModel("oModelProyect");
            const oMI = this.byId("miProveedor");

            if (!oMI) { return; }

            // 1. Limpiar tokens actuales
            oMI.removeAllTokens();

            // 2. Nuevo arreglo con los SupplierCode seleccionados
            const aSelCodes = [];

            aSelectedItems.forEach(oItem => {
                const oCtx = oItem.getBindingContext("oModelProyect");
                if (!oCtx) { return; }

                const sRUC = oCtx.getProperty("RUC");
                const sName = oCtx.getProperty("SupplierName");
                const sCode = oCtx.getProperty("SupplierCode");   // 👈 este es el que se manda a la BAPI
                const sTexto = this.formatProveedorTexto(sRUC, sName);

                if (sCode) {
                    // Token con SupplierCode como key
                    oMI.addToken(new sap.m.Token({
                        key: sCode,
                        text: sTexto
                    }));
                    aSelCodes.push(sCode);
                }
            });

            // 3. Guardar en el modelo (lo que usarás en _getData)
            oModel.setProperty("/Main/filter/fProveedor", aSelCodes);
        },



        _addReceptorPagoToken: function (sSupplierCode, sTexto) {
            if (!sSupplierCode) { return; }

            const oMI = this.byId("miReceptorPago");
            const oModel = this.getModel("oModelProyect");
            if (!oMI) { return; }

            // Evitar tokens duplicados
            const aTokensActuales = oMI.getTokens() || [];
            const bYaExiste = aTokensActuales.some(function (t) {
                return t.getKey && t.getKey() === sSupplierCode;
            });

            if (!bYaExiste) {
                oMI.addToken(new sap.m.Token({
                    key: sSupplierCode,          // 👈 KEY = SupplierCode
                    text: sTexto || sSupplierCode // texto visible (RUC - Nombre)
                }));
            }

            // Guardar SIEMPRE SupplierCode en /Main/filter/fReceptorPago
            let aSel = oModel.getProperty("/Main/filter/fReceptorPago") || [];
            if (!aSel.includes(sSupplierCode)) {
                aSel.push(sSupplierCode);
                oModel.setProperty("/Main/filter/fReceptorPago", aSel);
            }
        },


        onReceptorPagoSuggestionItemSelected: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) { return; }

            const sSupplierCode = oItem.getKey();  // 👈 SupplierCode
            const sTexto = oItem.getText(); // "RUC - Nombre"

            this._addReceptorPagoToken(sSupplierCode, sTexto);
        },


        onReceptorPagoTokenUpdate: function (oEvent) {
            const sType = oEvent.getParameter("type");
            if (sType !== "removed" && sType !== "removedAll") {
                return;
            }

            const oModel = this.getModel("oModelProyect");
            let aSel = oModel.getProperty("/Main/filter/fReceptorPago") || [];

            const aRemoved = oEvent.getParameter("removedTokens") || [];
            aRemoved.forEach(oToken => {
                const sKey = oToken.getKey();
                aSel = aSel.filter(ruc => ruc !== sKey);
            });

            oModel.setProperty("/Main/filter/fReceptorPago", aSel);
        },

        onValueHelpReceptorPago: function () {
            if (!this._oVHReceptorPago) {
                this._oVHReceptorPago = new sap.m.SelectDialog({
                    title: this.getI18nText("filtros.receptorPago.vh.title"),
                    multiSelect: true,
                    rememberSelections: true,
                    search: this._onSearchReceptorPagoDialog.bind(this),
                    confirm: this._onConfirmReceptorPagoDialog.bind(this),
                    cancel: this._onConfirmReceptorPagoDialog.bind(this),
                    items: {
                        path: "oModelProyect>/oFacturaProveedor",   // misma CDS que proveedor
                        template: new sap.m.StandardListItem({
                            title: "{oModelProyect>RUC}",
                            description: "{oModelProyect>SupplierName}"
                        })
                    }
                });

                this.getView().addDependent(this._oVHReceptorPago);
            }

            this._oVHReceptorPago.open();
        },

        _onSearchReceptorPagoDialog: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const oBinding = oEvent.getSource().getBinding("items");

            if (!oBinding) { return; }

            let aFilters = [];
            if (sValue) {
                aFilters = [
                    new Filter([
                        new Filter("RUC", FilterOperator.Contains, sValue),
                        new Filter("SupplierName", FilterOperator.Contains, sValue)
                    ], false) // OR
                ];
            }

            oBinding.filter(aFilters);
        },

        _onConfirmReceptorPagoDialog: function (oEvent) {
            const aSelectedItems = oEvent.getParameter("selectedItems") || [];

            const oModel = this.getModel("oModelProyect");
            const oMI = this.byId("miReceptorPago");
            if (!oMI) { return; }

            // Limpiar tokens y arreglo del modelo
            oMI.removeAllTokens();
            oModel.setProperty("/Main/filter/fReceptorPago", []);

            aSelectedItems.forEach(oItem => {
                const oCtx = oItem.getBindingContext("oModelProyect");
                if (!oCtx) { return; }

                const sRUC = oCtx.getProperty("RUC");
                const sName = oCtx.getProperty("SupplierName");
                const sCode = oCtx.getProperty("SupplierCode"); // 👈 clave real para filtrar

                const sTexto = this.formatProveedorTexto(sRUC, sName); // "RUC - Nombre"

                if (sCode) {
                    this._addReceptorPagoToken(sCode, sTexto);
                }
            });
        },


        onChangeEstado: function (oEvent) {
            const oCombo = oEvent.getSource();
            const sKey = oCombo.getSelectedKey();          // "PAGADO" o "PENDIENTE"
            const oModel = this.getModel("oModelProyect");
            const oFilterItem = this.byId("fiFechaPagado");
            const oDRS = this.byId("dprFilterInitPagado");
            const oMCBFactura = this.byId("mcbFactura");

            // 1) Guardar el nuevo estado en el modelo
            oModel.setProperty("/Main/filter/fEstado", sKey);

            // 2) Siempre que cambie el estado, limpiamos el filtro de facturas
            if (oMCBFactura) {
                oMCBFactura.setSelectedKeys([]);
            }
            oModel.setProperty("/Main/filter/fFactura", []);
            oModel.setProperty("/oFacturaLista", []); // 🔁 obliga a recalcular

            if (sKey === "PAGADO") {
                // 🔹 Cuando es PAGADO → fecha de pagado obligatoria y habilitada
                if (oFilterItem) {
                    oFilterItem.setMandatory(true);   // asterisco rojo
                }
                if (oDRS) {
                    oDRS.setEnabled(true);
                    // opcional pero recomendado: limpiar el rango anterior
                    oDRS.setValue("");
                    oDRS.setDateValue(null);
                    oDRS.setSecondDateValue(null);
                }

                // limpiamos en el modelo para que espere un nuevo rango
                oModel.setProperty("/Main/filter/fFechaComproFrom", null);
                oModel.setProperty("/Main/filter/fFechaComproTo", null);

            } else {
                // 🔹 Cuando NO es PAGADO → fecha no obligatoria y deshabilitada
                if (oFilterItem) {
                    oFilterItem.setMandatory(false);
                }
                if (oDRS) {
                    oDRS.setEnabled(false);
                    oDRS.setValue("");
                    oDRS.setDateValue(null);
                    oDRS.setSecondDateValue(null);
                }

                // también dejamos las fechas en null en el modelo
                oModel.setProperty("/Main/filter/fFechaComproFrom", null);
                oModel.setProperty("/Main/filter/fFechaComproTo", null);
            }

            // 3) Recalcular estado del filtro de Facturas.
            //    Si ya se cumplen los obligatorios para el nuevo estado,
            //    _updateFacturaFilterState llamará internamente a _loadFacturasFilter
            this._updateFacturaFilterState();
        },

        _initFiltroFechaPagado: function () {
            const oFilterItem = this.byId("fiFechaPagado");
            const oDRS = this.byId("dprFilterInitPagado");
            const oModel = this.getModel("oModelProyect");

            if (oFilterItem) {
                // Siempre visible en la barra de filtros
                oFilterItem.setVisibleInFilterBar(true);
                // Al inicio NO obligatorio (sin asterisco rojo)
                oFilterItem.setMandatory(false);
            }

            if (oDRS) {
                // Deshabilitado y limpio al inicio
                oDRS.setEnabled(false);
                oDRS.setValue("");
                oDRS.setDateValue(null);
                oDRS.setSecondDateValue(null);
            }

            if (oModel) {
                // Limpia también en el modelo
                oModel.setProperty("/Main/filter/fFechaComproFrom", null);
                oModel.setProperty("/Main/filter/fFechaComproTo", null);
            }
        },

        _validateMandatoryFilters: function () {
            const oModel = this.getModel("oModelProyect");
            const jFilter = oModel.getProperty("/Main/filter") || {};

            let bOk = true;

            // 🔹 Limpiar estados visuales previos
            this.byId("mcbUnidadNegocio")?.setValueState("None");
            this.byId("miProveedor")?.setValueState("None");
            this.byId("miReceptorPago")?.setValueState("None");
            this.byId("cbEstado")?.setValueState("None");
            this.byId("dprFilterInitPagado")?.setValueState("None");
            this.byId("miCodProveedor")?.setValueState("None");

            // 🔸 1. Unidad de negocio (obligatorio)
            if (!jFilter.fUnidadNegocio || !jFilter.fUnidadNegocio.length) {
                const oCtrl = this.byId("mcbUnidadNegocio");
                oCtrl?.setValueState("Error");
                oCtrl?.setValueStateText(this.getI18nText("msgCampoObligatorio"));
                bOk = false;
            }

            // 🔸 2. Proveedor / Código SAP (OBLIGATORIO: al menos uno)
            const aProv = jFilter.fProveedor || [];
            const aCodSap = jFilter.fCodSap || [];

            const hasProveedor = Array.isArray(aProv) && aProv.length > 0;
            const hasCodSap = Array.isArray(aCodSap) && aCodSap.length > 0;

            // Debe haber al menos uno lleno
            if (!hasProveedor && !hasCodSap) {
                const oCtrlProv = this.byId("miProveedor");
                const oCtrlCodSap = this.byId("miCodProveedor");

                oCtrlProv?.setValueState("Error");
                oCtrlProv?.setValueStateText(this.getI18nText("msgCampoObligatorio"));

                oCtrlCodSap?.setValueState("Error");
                oCtrlCodSap?.setValueStateText(this.getI18nText("msgCampoObligatorio"));

                bOk = false;
            }


            // 🔸 3. Estado (obligatorio)
            if (!jFilter.fEstado) {
                const oCtrl = this.byId("cbEstado");
                oCtrl?.setValueState("Error");
                oCtrl?.setValueStateText(this.getI18nText("msgCampoObligatorio"));
                bOk = false;
            }

            // 🔸 4. Fecha desde/hasta (solo cuando Estado = PAGADO)
            const oDRS = this.byId("dprFilterInitPagado");
            if (jFilter.fEstado === "PAGADO") {
                if (!jFilter.fFechaComproFrom || !jFilter.fFechaComproTo) {
                    if (oDRS) {
                        oDRS.setValueState("Error");
                        oDRS.setValueStateText(this.getI18nText("msgCampoObligatorio"));
                    }
                    bOk = false;
                }
            }

            if (!bOk) {
                this.getMessageBox("error", this.getI18nText("msgFiltrosObligatorios"));
            }

            // 🔹 MUY IMPORTANTE:
            // Siempre re-evaluar si el filtro de Facturas debe habilitarse / cargar lista
            this._updateFacturaFilterState();

            return bOk;
        },


        formatProveedorTexto: function (sRUC, sName) {
            sRUC = sRUC || "";
            sName = sName || "";
            if (!sRUC && !sName) { return ""; }
            if (!sRUC) { return sName; }
            if (!sName) { return sRUC; }
            return sRUC + " - " + sName;
        },
        _flattenMisComprobantes: function (aHeaders) {
            const aFlat = [];

            (aHeaders || []).forEach(function (oHead) {
                const oCommon = {
                    DESDE: oHead.DESDE,
                    HASTA: oHead.HASTA,
                    ESTADOCOMPROBANTE: oHead.ESTADOCOMPROBANTE,
                    PROVEEDOR_HEADER: oHead.PROVEEDOR,
                    SOCIEDAD: oHead.SOCIEDAD,
                    ID_CORR_HEADER: oHead.ID_CORR
                };

                const aDetalles =
                    (oHead.toMisComprobantes && oHead.toMisComprobantes.results) || [];

                if (aDetalles.length) {
                    aDetalles.forEach(function (oDet) {
                        aFlat.push(Object.assign({}, oCommon, oDet));
                    });
                }
            });

            return aFlat;
        },
        /**
  * Aplica filtros que no van a la CDS, sobre el arreglo ya aplanado.
  * - Receptor de pago  → RECEPTOR_PAGO
  * - Factura (serie / correlativo) → NRO_FACTURA
  * - Fecha emisión    → FECHA_EMISION
  */
        _applyFrontendFilters: function (aData, jFilter) {
            jFilter = jFilter || this.getModel("oModelProyect").getProperty("/Main/filter") || {};

            let aResult = (aData || []).slice();

            console.log("🎯 _applyFrontendFilters IN:", {
                lenOriginal: aResult.length,
                fReceptorPago: jFilter.fReceptorPago,
                fFacturaSerie: jFilter.fFacturaSerie,
                fFacturaCorrelativo: jFilter.fFacturaCorrelativo,
                fFechaEmision: jFilter.fFechaEmision
            });

            // 🔹 1. Receptor de pago (array de códigos)
            if (Array.isArray(jFilter.fReceptorPago) && jFilter.fReceptorPago.length) {
                const oSetReceptor = new Set(jFilter.fReceptorPago);
                const before = aResult.length;

                aResult = aResult.filter(function (oRow) {
                    return oRow.RECEPTOR_PAGO && oSetReceptor.has(oRow.RECEPTOR_PAGO);
                });

                console.log("   ▶ Después de filtro ReceptorPago:", before, "→", aResult.length);
            }

            // 🔹 2. Factura (Serie / Correlativo) sobre NRO_FACTURA
            const sSerie = (jFilter.fFacturaSerie || "").trim();
            const sCorr = (jFilter.fFacturaCorrelativo || "").trim();

            if (sSerie || sCorr) {
                const before = aResult.length;
                aResult = aResult.filter(function (oRow) {
                    const sNum = (oRow.NRO_FACTURA || "").trim();
                    if (!sNum) { return false; }

                    let bOk = true;

                    if (sSerie) {
                        bOk = bOk && sNum.indexOf(sSerie) !== -1;
                    }
                    if (sCorr) {
                        bOk = bOk && sNum.indexOf(sCorr) !== -1;
                    }

                    return bOk;
                });
                console.log("   ▶ Después de filtro Serie/Correlativo:", before, "→", aResult.length);
            }

            // 🔹 3. Fecha de emisión (FECHA_EMISION)
            if (jFilter.fFechaEmision) {
                const dFiltro = this._parseFilterDate(jFilter.fFechaEmision);
                if (dFiltro) {
                    const oFormatDDMMYYYY = sap.ui.core.format.DateFormat.getDateInstance({
                        pattern: "dd-MM-yyyy"
                    });
                    const sFiltroStr = oFormatDDMMYYYY.format(dFiltro);

                    const before = aResult.length;

                    aResult = aResult.filter(function (oRow) {
                        const sFechaRow = (oRow.FECHA_EMISION || "").trim();
                        return sFechaRow === sFiltroStr;
                    });

                    console.log("   ▶ Después de filtro FechaEmision:", before, "→", aResult.length);
                }
            }

            console.log("🎯 _applyFrontendFilters OUT:", aResult.length);
            return aResult;
        },

        /**
         * Parsear cadenas de fecha tipo "yyyy-MM-dd" (DatePicker) o "dd-MM-yyyy" (tabla),
         * o directamente objetos Date, y devolver un Date normalizado sin hora.
         */
        _parseFilterDate: function (vDate) {
            if (!vDate) {
                return null;
            }

            // Si ya es Date, normalizamos a solo fecha (sin hora)
            if (vDate instanceof Date) {
                return new Date(vDate.getFullYear(), vDate.getMonth(), vDate.getDate());
            }

            if (typeof vDate === "string") {
                // Probamos varios patrones posibles
                var aPatterns = [
                    "yyyy-MM-dd",   // valor por defecto de DatePicker (valueFormat)
                    "dd-MM-yyyy",   // displayFormat o manual
                    "dd/MM/yyyy"    // posible formato por región
                ];

                for (var i = 0; i < aPatterns.length; i++) {
                    var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
                        pattern: aPatterns[i]
                    });
                    var d = oFormat.parse(vDate);
                    if (d) {
                        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                    }
                }
            }

            return null;
        },

        _updateFacturaFilterState: function () {
            const oModel = this.getModel("oModelProyect");
            const jFilter = oModel.getProperty("/Main/filter") || {};
            const oMCB = this.byId("mcbFactura");
            if (!oMCB) { return; }

            const sEstado = jFilter.fEstado;

            const hasUnidad = Array.isArray(jFilter.fUnidadNegocio) && jFilter.fUnidadNegocio.length > 0;

            const hasProveedor = Array.isArray(jFilter.fProveedor) && jFilter.fProveedor.length > 0;
            const hasCodSap = Array.isArray(jFilter.fCodSap) && jFilter.fCodSap.length > 0;

            const hasProveedorDim = hasProveedor || hasCodSap;   // 🔸 NUEVO: Proveedor OR CodSAP
            const hasEstado = !!sEstado;

            let bAllMandatory = false;

            if (sEstado === "PENDIENTE") {
                bAllMandatory = hasUnidad && hasProveedorDim && hasEstado;
            }
            else if (sEstado === "PAGADO") {
                const hasDesde = !!jFilter.fFechaComproFrom;
                const hasHasta = !!jFilter.fFechaComproTo;
                bAllMandatory = hasUnidad && hasProveedorDim && hasEstado && hasDesde && hasHasta;
            }
            if (bAllMandatory) {
                oMCB.setEnabled(true);
                this._loadFacturasFilter(jFilter);
            } else {
                oMCB.setEnabled(false);
                oMCB.setSelectedKeys([]);
                oModel.setProperty("/Main/filter/fFactura", []);
                oModel.setProperty("/oFacturaLista", []);
            }
        },
        _loadFacturasFilter: function (jFilter) {
            const thatLocal = this;
            const oModel = this.getModel("oModelProyect");

            jFilter = jFilter || oModel.getProperty("/Main/filter") || {};

            // Helpers iguales a los de _getData
            const toYYYYMMDD = function (vDate) {
                if (!vDate) { return ""; }
                const d = vDate instanceof Date ? vDate : new Date(vDate);
                if (isNaN(d.getTime())) { return ""; }

                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return "" + y + m + day;
            };

            const mapEstadoToSrv = function (sEstadoUI) {
                if (sEstadoUI === "PAGADO") { return "Pagado"; }
                if (sEstadoUI === "PENDIENTE") { return "Pendiente"; }
                return "";
            };

            // 🔹 Unión de proveedores: filtro Proveedor + filtro CodSap
            let aProvFilter = Array.isArray(jFilter.fProveedor) ? jFilter.fProveedor : [];
            let aCodSapFilter = Array.isArray(jFilter.fCodSap) ? jFilter.fCodSap : [];

            const bEsExterno = !!thatLocal.getModel("oModelUser")?.getProperty("/bEsExterno");
            const sExtBP = String(thatLocal.getModel("oModelUser")?.getProperty("/sExtBP") || "").trim();

            // Si es externo, solo puede cargar facturas de su propio BP.
            if (bEsExterno && sExtBP) {
                aProvFilter = [sExtBP];
                aCodSapFilter = [];
                oModel.setProperty("/Main/filter/fProveedor", [sExtBP]);
                oModel.setProperty("/Main/filter/fCodSap", []);
            }

            const aProveedoresToQuery = Array.from(new Set([
                ...aProvFilter,
                ...aCodSapFilter
            ]));

            console.log("🔍 [Facturas] fProveedor:", aProvFilter);
            console.log("🔍 [Facturas] fCodSap  :", aCodSapFilter);
            console.log("🔍 [Facturas] Proveedores a consultar (unión):", aProveedoresToQuery);

            if (!aProveedoresToQuery.length) {
                // Nada que consultar
                oModel.setProperty("/oFacturaLista", []);
                return Promise.resolve([]);
            }

            return new Promise(function (resolve, reject) {

                const sEstadoUI = jFilter.fEstado;
                const sEstadoSrv = mapEstadoToSrv(sEstadoUI);

                // URL base (igual que antes)
                let sUrlBase = "";
                if (thatLocal.local) {
                    const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/I_MisComprobantesSet";
                    sUrlBase = thatLocal.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    const sPath = jQuery.sap.getModulePath(thatLocal.route) +
                        "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/I_MisComprobantesSet";
                    sUrlBase = sPath;
                }

                const mSeenFacturas = {};
                const aFacturas = [];

                // 🔁 Una llamada por cada proveedor de la unión
                const aPromises = aProveedoresToQuery.map(function (sProvCode) {

                    return new Promise(function (resolveProv) {

                        const aParts = [];

                        // SOCIEDAD (unidad de negocio) – aquí basta con un valor, ya lo controla el filtro
                        if (Array.isArray(jFilter.fUnidadNegocio) && jFilter.fUnidadNegocio.length) {
                            aParts.push("SOCIEDAD eq '" + jFilter.fUnidadNegocio[0] + "'");
                        }

                        // PROVEEDOR (SupplierCode) – uno por llamada
                        aParts.push("PROVEEDOR eq '" + sProvCode + "'");

                        // ESTADO
                        if (sEstadoSrv) {
                            aParts.push("ESTADOCOMPROBANTE eq '" + sEstadoSrv + "'");
                        }

                        // Rango de fechas solo si ESTADO = PAGADO
                        if (sEstadoUI === "PAGADO" &&
                            jFilter.fFechaComproFrom && jFilter.fFechaComproTo) {

                            const sDesde = toYYYYMMDD(jFilter.fFechaComproFrom);
                            const sHasta = toYYYYMMDD(jFilter.fFechaComproTo);

                            if (sDesde) { aParts.push("DESDE eq '" + sDesde + "'"); }
                            if (sHasta) { aParts.push("HASTA eq '" + sHasta + "'"); }
                        }

                        const sFilter = aParts.join(" and ");

                        const aParams = [];
                        if (sFilter) {
                            aParams.push("$filter=" + encodeURIComponent(sFilter));
                        }
                        aParams.push("$expand=toMisComprobantes");
                        aParams.push("$format=json");
                        aParams.push("sap-language=ES");

                        const sUrl = sUrlBase + "?" + aParams.join("&");
                        console.log("➡️ _loadFacturasFilter URL (prov " + sProvCode + "):", sUrl);

                        Services.getoDataERPSync(thatLocal, sUrl, function (result) {
                            util.response.validateAjaxGetERPNotMessage(result, {
                                success: function (oData) {

                                    let aHeaders = [];

                                    if (oData && oData.data) {
                                        if (Array.isArray(oData.data)) {
                                            aHeaders = oData.data;
                                        } else if (oData.data.d && Array.isArray(oData.data.d.results)) {
                                            aHeaders = oData.data.d.results;
                                        }
                                    } else if (oData && oData.d && Array.isArray(oData.d.results)) {
                                        aHeaders = oData.d.results;
                                    }

                                    // De cada header/detalle, solo extraemos NRO_FACTURA (sin duplicar)
                                    (aHeaders || []).forEach(function (oHeader) {
                                        const aDet = (oHeader.toMisComprobantes && oHeader.toMisComprobantes.results) || [];

                                        if (!aDet.length) {
                                            const sNro = oHeader.NRO_FACTURA;
                                            if (sNro && !mSeenFacturas[sNro]) {
                                                mSeenFacturas[sNro] = true;
                                                aFacturas.push({ NRO_FACTURA: sNro });
                                            }
                                        } else {
                                            aDet.forEach(function (oItem) {
                                                const sNro = oItem.NRO_FACTURA || oHeader.NRO_FACTURA;
                                                if (sNro && !mSeenFacturas[sNro]) {
                                                    mSeenFacturas[sNro] = true;
                                                    aFacturas.push({ NRO_FACTURA: sNro });
                                                }
                                            });
                                        }
                                    });

                                    console.log("   ➕ Facturas encontradas para", sProvCode, "→ total acumulado:", aFacturas.length);
                                    resolveProv();
                                },
                                error: function (message) {
                                    console.error("❌ Error en _loadFacturasFilter (prov " + sProvCode + "):", message);
                                    // aunque falle este proveedor, seguimos con los demás
                                    resolveProv();
                                }
                            });
                        });
                    });
                });

                Promise.all(aPromises).then(function () {
                    console.log("✅ [Facturas] Total facturas únicas cargadas:", aFacturas.length);
                    oModel.setProperty("/oFacturaLista", aFacturas);
                    resolve(aFacturas);
                }).catch(function (err) {
                    console.error("❌ Error general en _loadFacturasFilter:", err);
                    oModel.setProperty("/oFacturaLista", []);
                    resolve([]);
                });
            });
        },

        onFacturaSelectionFinish: function (oEvent) {
            const aKeys = oEvent.getSource().getSelectedKeys() || [];
            const oModel = this.getModel("oModelProyect");
            oModel.setProperty("/Main/filter/fFactura", aKeys);
        },
        _onChangeDateRange: function (oEvent) {
            const oDRS = oEvent.getSource();
            const oModel = this.getModel("oModelProyect");

            const dFrom = oDRS.getDateValue();
            const dTo = oDRS.getSecondDateValue();

            oModel.setProperty("/Main/filter/fFechaComproFrom", dFrom);
            oModel.setProperty("/Main/filter/fFechaComproTo", dTo);

            this._updateFacturaFilterState();          // 👈
        },
        // ==================== CÓDIGO SAP (MultiInput) ====================

        _addCodSapToken: function (sSupplierCode, sTexto) {
            if (!sSupplierCode) { return; }

            const oMI = this.byId("miCodProveedor");
            const oModel = this.getModel("oModelProyect");

            if (!oMI) { return; }

            // Evitar tokens duplicados
            const aTokensActuales = oMI.getTokens() || [];
            const bYaExiste = aTokensActuales.some(t => t.getKey && t.getKey() === sSupplierCode);
            if (!bYaExiste) {
                oMI.addToken(new sap.m.Token({
                    key: sSupplierCode,             // 👈 KEY = SupplierCode
                    text: sTexto || sSupplierCode   // texto visible
                }));
            }

            // Guardar en el modelo /Main/filter/fCodSap
            let aSel = oModel.getProperty("/Main/filter/fCodSap") || [];
            if (!aSel.includes(sSupplierCode)) {
                aSel.push(sSupplierCode);
                oModel.setProperty("/Main/filter/fCodSap", aSel);
            }

            this._updateFacturaFilterState(); // para que el filtro de Factura sepa que ya hay proveedor (por CodSAP)
        },

        onCodSapSuggestionItemSelected: function (oEvent) {
            const oItem = oEvent.getParameter("selectedItem");
            if (!oItem) { return; }

            const sSupplierCode = oItem.getKey();   // viene de key="{...>SupplierCode}"
            const sTexto = oItem.getText();         // lo que mostras en el item

            this._addCodSapToken(sSupplierCode, sTexto);
        },

        onCodSapTokenUpdate: function (oEvent) {
            const sType = oEvent.getParameter("type");
            if (sType !== "removed" && sType !== "removedAll") {
                return;
            }

            const oModel = this.getModel("oModelProyect");
            let aSel = oModel.getProperty("/Main/filter/fCodSap") || [];
            const aRemoved = oEvent.getParameter("removedTokens") || [];

            if (sType === "removedAll") {
                aSel = [];
            } else {
                aRemoved.forEach(oToken => {
                    const sKey = oToken.getKey();
                    aSel = aSel.filter(code => code !== sKey);
                });
            }

            oModel.setProperty("/Main/filter/fCodSap", aSel);

            if (this._oVHCodSap) {
                const aItems = this._oVHCodSap.getItems() || [];
                aItems.forEach(oItem => {
                    const oCtx = oItem.getBindingContext("oModelProyect");
                    if (!oCtx) { return; }
                    const sCode = oCtx.getProperty("SupplierCode");
                    oItem.setSelected(aSel.includes(sCode));
                });
            }
        },


        onValueHelpCodSap: function () {
            const oModel = this.getModel("oModelProyect");

            if (!this._oVHCodSap) {
                this._oVHCodSap = new sap.m.SelectDialog({
                    title: this.getI18nText("filtros.codSap.vh.title"),
                    multiSelect: true,
                    rememberSelections: true,
                    search: this._onSearchProveedorDialog.bind(this), // mismo search de proveedor
                    confirm: this._onConfirmCodSapDialog.bind(this),
                    cancel: this._onConfirmCodSapDialog.bind(this),
                    items: {
                        path: "oModelProyect>/oFacturaProveedor",
                        template: new sap.m.StandardListItem({
                            title: "{oModelProyect>SupplierCode}",
                            description: "{oModelProyect>SupplierName}"
                        })
                    }
                });

                this.getView().addDependent(this._oVHCodSap);
            }

            const aSelCodes = oModel.getProperty("/Main/filter/fCodSap") || [];

            const fnSyncSelection = () => {
                const aItems = this._oVHCodSap.getItems() || [];
                aItems.forEach(oItem => {
                    const oCtx = oItem.getBindingContext("oModelProyect");
                    if (!oCtx) { return; }
                    const sCode = oCtx.getProperty("SupplierCode");
                    oItem.setSelected(aSelCodes.includes(sCode));
                });
            };

            this._oVHCodSap.attachEventOnce("afterOpen", fnSyncSelection);

            this._oVHCodSap.open();
        },


        _onSearchCodSapDialog: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            const oBinding = oEvent.getSource().getBinding("items");
            if (!oBinding) { return; }

            let aFilters = [];
            if (sValue) {
                aFilters = [
                    new Filter([
                        new Filter("SupplierCode", FilterOperator.Contains, sValue),
                        new Filter("SupplierName", FilterOperator.Contains, sValue)
                    ], false) // OR
                ];
            }

            oBinding.filter(aFilters);
        },

        _onConfirmCodSapDialog: function (oEvent) {
            const aSelectedItems = oEvent.getParameter("selectedItems") || [];

            const oModel = this.getModel("oModelProyect");
            const oMI = this.byId("miCodProveedor");
            if (!oMI) { return; }

            // Limpiar tokens actuales
            oMI.removeAllTokens();

            const aSelCodes = [];

            aSelectedItems.forEach(oItem => {
                const oCtx = oItem.getBindingContext("oModelProyect");
                if (!oCtx) { return; }

                const sCode = oCtx.getProperty("SupplierCode");
                const sName = oCtx.getProperty("SupplierName");
                const sTexto = this.formatProveedorTexto(sCode, sName); // puedes usar otro formatter si quieres

                if (sCode) {
                    oMI.addToken(new sap.m.Token({
                        key: sCode,
                        text: sTexto
                    }));
                    aSelCodes.push(sCode);
                }
            });

            // Guardar en el modelo
            oModel.setProperty("/Main/filter/fCodSap", aSelCodes);
            this._updateFacturaFilterState();
        }
    });
});
