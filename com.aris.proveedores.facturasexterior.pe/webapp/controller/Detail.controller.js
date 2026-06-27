sap.ui.define([
    "com/aris/proveedores/facturaexterior/pe/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "com/aris/proveedores/facturaexterior/pe/model/models",
    "com/aris/proveedores/facturaexterior/pe/model/formatter",
    "com/aris/proveedores/facturaexterior/pe/services/Services",
    "com/aris/proveedores/facturaexterior/pe/util/util",
    'com/aris/proveedores/facturaexterior/pe/util/utilUI',

    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/ui/core/HTML",
    "sap/ui/Device"
], (BaseController, Controller, models, formatter, Services, util, utilUI, MessageBox, Dialog, Button, HTML, Device) => {
    "use strict";
    var that;

    return BaseController.extend("com.aris.proveedores.facturaexterior.pe.controller.Detail", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Detail").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            this.frgIdDatosCarga = "frgIdDatosCarga";
            this.frgIdDatosViaje = "frgIdDatosViaje";
            this.frgIdAdjuntarDocumentos = "frgIdAdjuntarDocumentos";
            this._initDialogState();
            this._lastContextKey = "";
            this._lastIdSapLoaded = "";
            this._loadingByIdSap = false;

        },
        handleRouteMatched: function (oEvent) {
            sap.ui.core.BusyIndicator.show(0);

            that.oModelProyect = that.getModel("oModelProyect");
            that.oModelData = that.getModel("oModelData");

            that._setLanguageModel(that._getCurrentLanguageKey());

            const oData = (oEvent && oEvent.getParameter) ? (oEvent.getParameter("data") || {}) : {};
            let sIdSap = "";
            try {
                const oQuery = (oData["?query"] || oData.query || {});
                sIdSap = (oQuery.IdSap ? String(oQuery.IdSap) : "").trim();
            } catch (e) {
                sIdSap = "";
            }
            if (!sIdSap) {
                const sHash = (this.oRouter.getHashChanger().getHash && this.oRouter.getHashChanger().getHash()) ||
                    this.oRouter.getHashChanger().hash || "";
                const aHash = sHash.split("?");
                if (aHash.length > 1) {
                    const oParams = new URLSearchParams(aHash[1]);
                    sIdSap = (oParams.get("IdSap") || "").trim();
                }
            }
            if (sIdSap) {
                that.oModelProyect.setProperty("/appContext/bFromIdSap", true);
                that.oModelProyect.setProperty("/appContext/sIdSap", sIdSap);

                that._restoreStateByIdSap(sIdSap);
                that._ensureUserProfile()
                    .then(() => {
                        sap.ui.core.BusyIndicator.hide(0);
                        that._loadByIdSap(sIdSap);
                    })
                    .catch(() => {
                        sap.ui.core.BusyIndicator.hide(0);
                        that._loadByIdSap(sIdSap);
                    });

                return;
            } else {
                that.oModelProyect.setProperty("/appContext/bFromIdSap", false);
                that.oModelProyect.setProperty("/appContext/sIdSap", "");
                if (typeof that._removeIdSapFromUrl === "function") {
                    that._removeIdSapFromUrl();
                }
                if (typeof that._resetCargaViajeAdjuntosForNewEntry === "function") {
                    that._resetCargaViajeAdjuntosForNewEntry();
                }
            }
            let sRouteParam = (oData && oData.app) ? String(oData.app) : "";
            if (!sRouteParam) {
                const sHash = (this.oRouter.getHashChanger().getHash && this.oRouter.getHashChanger().getHash()) ||
                    this.oRouter.getHashChanger().hash || "";
                const a = sHash.split("/");
                sRouteParam = (a && a.length > 1) ? a[a.length - 1] : "";
            }
            if (!sRouteParam || sRouteParam.indexOf("-") === -1) {
                sap.ui.core.BusyIndicator.hide(0);
                that.getMessageBox("error", "No se pudo determinar el parámetro de navegación (app).");
                return;
            }
            that.oModelProyect.setProperty("/appContext/sAppParam", sRouteParam);
            const sFactura = sRouteParam.split("-")[1];
            const oOrdenes = sRouteParam.split("-")[0].split(",");
            const _esc = (v) => String(v ?? "").trim().replace(/'/g, "''");
            const aOCs = (oOrdenes || [])
                .map(v => String(v ?? "").trim())
                .filter(Boolean);
            that.oModelProyect.setProperty("/appContext/aPurchaseOrders", aOCs);
            that.oModelProyect.setProperty("/appContext/sPurchaseOrders", aOCs.join(","));
            that.oModelProyect.setProperty("/oCabecera/PurchaseOrder", aOCs[0] || "");
            that.oModelProyect.setProperty("/oCabecera/Ebeln", aOCs[0] || "");

            let sFiltroEbeln = "";
            aOCs.forEach(function (value, index) {
                const v = _esc(value);
                if (index === 0) { sFiltroEbeln += "Ebeln eq '" + v + "' "; }
                else { sFiltroEbeln += "or Ebeln eq '" + v + "' "; }
            });

            let sFiltroPO = "";
            aOCs.forEach(function (value, index) {
                const v = _esc(value);
                if (index === 0) { sFiltroPO += "PurchaseOrder eq '" + v + "' "; }
                else { sFiltroPO += "or PurchaseOrder eq '" + v + "' "; }
            });

            Promise.all([
                that._getCabecera(sFiltroEbeln), that._getOrdenes(sFiltroEbeln),
                that._getTipoBulto(""), that._getTipoContenido(""),
                that._getModalidad(""), that._getTipoEmision(""),
                that._getClaseDocumento(""), that._getCountriesEmb(""),
                that._getPuertoEmb(""), that._getAdjuntarDatos(""),
                that._getStatusOrder(""), that._getFilterFactExt(sFiltroPO),
                that._getUsers(), that._getConditionsDetail(oOrdenes)
            ]).then((values) => {

                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelData.setSizeLimit(5000);

                let oCabecera = that._asResults(values[0]?.oResults),
                    oDetalle = that._asResults(values[1]?.oResults),
                    oTipoBulto = that._asResults(values[2]?.oResults),
                    oTipoContenido = that._asResults(values[3]?.oResults),
                    oModalidad = that._asResults(values[4]?.oResults),
                    oTipoEmision = that._asResults(values[5]?.oResults),
                    oClaseDocumento = that._asResults(values[6]?.oResults),
                    oPaisesEmbDes = that._asResults(values[7]?.oResults),
                    oPuertoEmb = that._asResults(values[8]?.oResults),
                    oAdjuntarDatos = that._asResults(values[9]?.oResults),
                    oStatus = that._asResults(values[10]?.oResults),
                    oFactExt = that._asResults(values[11]?.oResults),
                    oDetallePosicion = [];
                const oCondResp = values[13];
                const aCond = that._asResults(oCondResp?.oResults);
                that._applyPendingConditionsFromPOCondition(aCond);
                that._applyViajeRequirementFromOrdenes(oDetalle);
                that.oModelData.setProperty("/oStatusOrder", oStatus || []);
                let oUser = values[12].Resources[0];
                const oUserProfile = that._applyProveedorUserProfile(oUser);


                // Estado inicial UI
                const sEstado = "00";
                const sEstadoDesc = that._getStatusDescription
                    ? that._getStatusDescription(sEstado, true)
                    : "Pendiente Facturación";
                if (typeof that._applyEditabilityByEstado === "function") {
                    that._applyEditabilityByEstado("00");
                } else {
                    that.oModelProyect.setProperty("/oCabecera/bLockedByStatus", false);
                    that.oModelProyect.setProperty("/oCabecera/bFormEditable", true);
                }
                that.oModelProyect.setProperty("/oCabecera/sEstadoCodigo", sEstado);
                that.oModelProyect.setProperty("/oCabecera/sEstadoDescripcion", sEstadoDesc);
                that.oModelProyect.setProperty("/oCabecera/sFormEstadoRegistro", sEstadoDesc);

                if (!Array.isArray(oDetalle) || oDetalle.length === 0) {
                    sap.ui.core.BusyIndicator.hide(0);
                    that.getMessageBox("error", "No se encontraron órdenes para el filtro enviado.");
                    return;
                }

                let dDatePedido = formatter.formatDDMMYYYYDateAbapDateSlash(oDetalle[0].Fecpedido);
                let dToday = new Date();
                let sToday = formatter.getDDMMYYYYPeru ? formatter.getDDMMYYYYPeru(dToday) : (
                    ("0" + dToday.getDate()).slice(-2) + "/" +
                    ("0" + (dToday.getMonth() + 1)).slice(-2) + "/" +
                    dToday.getFullYear()
                );
                that.oModelProyect.setProperty("/oCabecera/sMoneda", oDetalle[0].Waers);
                that.oModelProyect.setProperty("/oCabecera/sRuc", oDetalle[0].Supplier);
                that.oModelProyect.setProperty("/oCabecera/sRazonSocial", oDetalle[0].Bpname);
                that.oModelProyect.setProperty("/oCabecera/sFactura", sFactura);
                that.oModelProyect.setProperty("/oCabecera/sFormCondicionPagoOrder", oDetalle[0].Paymentterms);
                that.oModelProyect.setProperty("/oCabecera/sFormCondicionPagoOrderDescrip", oDetalle[0].Conpag);

                const sCompanyPrev = String(
                    that.oModelProyect.getProperty("/oCabecera/sCompany") ||
                    that.oModelProyect.getProperty("/oCabecera/Company") || ""
                ).trim();
                const sCompanySrv = String(oDetalle?.[0]?.Company || oDetalle?.[0]?.Bukrs || "").trim();
                const sCompanyFinal = sCompanyPrev || sCompanySrv;

                that.oModelProyect.setProperty("/oCabecera/sCompany", sCompanyFinal);
                that.oModelProyect.setProperty("/oCabecera/Company", sCompanyFinal);

                that.oModelProyect.setProperty("/oCabecera/sFormFechaFactura", sToday);
                that.oModelProyect.setProperty("/oCabecera/sFormFechaBase", sToday);
                that.oModelProyect.setProperty("/oCabecera/sFormFechaContabilizacion", "");
                that.oModelProyect.setProperty("/oCabecera/sFormMoneda", oDetalle[0].Waers);
                const _toNum = (v) => {
                    let s = String(v ?? "").trim();
                    if (!s) return 0;
                    s = s.replace(/\s/g, "");
                    const hasComma = s.includes(",");
                    const hasDot = s.includes(".");
                    if (hasComma && hasDot) s = s.replace(/,/g, "");
                    else if (hasComma && !hasDot) s = s.replace(/,/g, ".");
                    s = s.replace(/[^0-9.\-]/g, "");
                    const n = parseFloat(s);
                    return isNaN(n) ? 0 : n;
                };

                const _round3 = (n) => {
                    const x = Number(n) || 0;
                    return Math.round((x + Number.EPSILON) * 1000) / 1000;
                };

                oDetalle.forEach(function (value) {
                    const sPO = String(value.Ebeln || "").trim();
                    const aItems = that._asResults(value.toPurOrdItems);

                    aItems.forEach(function (value2) {
                        delete value2["__metadata"];

                        const nOrderQty = _toNum(value2.Orderquantity ?? value2.OrderQuantity);
                        const nPendingRaw = _toNum(value2.Pendingamount ?? value2.PendingAmount);

                        let nCanPen = 0;

                        /*
                            Regla:
                            - Si Pendingamount viene positivo, SAP ya está enviando la cantidad pendiente.
                              Ejemplo: Orderquantity 150 / Pendingamount 150 => queda 150.
                            - Si Pendingamount viene negativo, representa cantidad ya usada/facturada.
                              Ejemplo: Orderquantity 150 / Pendingamount -50 => queda 100.
                            - Si viene vacío o cero, no queda pendiente.
                        */
                        if (nPendingRaw > 0) {
                            nCanPen = nPendingRaw;
                        } else if (nPendingRaw < 0) {
                            nCanPen = nOrderQty - Math.abs(nPendingRaw);
                        } else {
                            nCanPen = 0;
                        }

                        nCanPen = _round3(nCanPen);

                        if (nCanPen < 0) {
                            nCanPen = 0;
                        }

                        if (nCanPen > nOrderQty) {
                            nCanPen = nOrderQty;
                        }

                        // Si ya no queda cantidad disponible, no se muestra la posición
                        if (nCanPen <= 0) {
                            return;
                        }

                        value2.Bpname = value.Bpname;
                        value2.Conpag = value.Conpag;
                        value2.Ebeln = value.Ebeln;
                        value2.Facturation = value.Facturation;
                        value2.Fecentrega = value.Fecentrega;
                        value2.Fecpedido = value.Fecpedido;
                        value2.Iment = value.Iment;
                        value2.Imfac = value.Imfac;
                        value2.Immecom = value.Immecom;
                        value2.Inco1 = value.Inco1;
                        value2.Modalidad = value.Modalidad;
                        value2.Ruc = value.Ruc;
                        value2.Status = value.Status;
                        value2.Supplier = value.Supplier;
                        value2.Waers = value.Waers;
                        value2.Paymentterms = value.Paymentterms;

                        value2.OrderquantityOriginal = nOrderQty;

                        // Valor original que vino desde SAP.
                        // Puede venir positivo o negativo.
                        value2.PendingamountOriginal = nPendingRaw;

                        // Cantidad realmente disponible para facturar.
                        // Esta es la cantidad que se mostrará y se enviará.
                        value2.Pendingamount = nCanPen;

                        // Cantidad editable en la tabla.
                        value2.Orderquantity = nCanPen;

                        // Máximo permitido en el input.
                        value2.OrderquantityMax = nCanPen;

                        value2.BaseQuantity = formatter._toNumUI(value2.BaseQuantity);
                        if (!value2.BaseQuantity || value2.BaseQuantity <= 0) {
                            value2.BaseQuantity = 1;
                        }

                        value2.Unitprice = formatter._toNumUI(value2.Unitprice);
                        value2.Subtotal = formatter._round2((value2.Orderquantity * value2.Unitprice) / value2.BaseQuantity);

                        oDetallePosicion.push(value2);
                    });
                });

                that.getModel("oModelProyect").setProperty("/oDetalle", oDetallePosicion);
                that.getModel("oModelProyect").setProperty("/oDetalleTotal", oDetallePosicion);
                if (!oDetallePosicion.length) {
                    that.getModel("oModelProyect").setProperty("/oDetalle", []);
                    that.getModel("oModelProyect").setProperty("/oDetalleTotal", []);
                    that._onCalculator();

                    sap.ui.core.BusyIndicator.hide(0);

                    that.getMessageBox(
                        "warning",
                        "La orden seleccionada ya no tiene items pendientes por facturar."
                    );

                    that.oRouter.navTo("Main", {}, true);
                    return;
                }

                that.oModelData.setProperty("/oTipoBulto", oTipoBulto);
                that.oModelData.setProperty("/oTipoContenido", oTipoContenido);
                that.oModelData.setProperty("/oModalidad", oModalidad);
                that.oModelData.setProperty("/oTipoEmision", oTipoEmision);
                that.oModelData.setProperty("/oClaseDocumento", oClaseDocumento);
                that._localizeClaseDocumentoCatalog();
                that._setDefaultClaseDocumento91();

                that.oModelData.setProperty("/oPaisesEmbDes", oPaisesEmbDes);
                that.oModelData.setProperty("/oPuertosEmbDes", oPuertoEmb);
                that._applyPortFiltersFromModel();
                that._applyDefaultDesembarquePE();
                that.oModelData.setProperty("/oAdjuntDat", oAdjuntarDatos);
                that.oModelData.setProperty("/oStatusOrder", oStatus || []);

                that._onCalculator();
                sap.ui.core.BusyIndicator.hide(0);

            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        // edición por perfiles 

        _resetCargaViajeAdjuntosForNewEntry: function () {
            const oMP = this.getModel("oModelProyect") || this.getOwnerComponent().getModel("oModelProyect");
            if (!oMP) return;
            if (typeof this._initDialogState === "function") {
                this._initDialogState();
            } else {
                oMP.setProperty("/appContext/dialogState", {
                    DatosCarga: { saved: false, savedOnce: false, dirty: false },
                    DatosViaje: { saved: false, savedOnce: false, dirty: false },
                    AdjuntarDocumentos: { saved: false, savedOnce: false, dirty: false }
                });
            }
            oMP.setProperty("/jDatosCarga", {
                oBultos: [],
                oContenido: [],
                bSavedOnce: false
            });
            oMP.setProperty("/jDatosCarga/oBultos", []);
            oMP.setProperty("/jDatosCarga/oContenido", []);

            oMP.setProperty("/jDatosViaje", {
                cbModalidad: "",
                cbModalidadKey: "",
                sViajeNave: "",
                sViajeNumBL: "",
                cbTipoEmision: "",
                cbTipoEmisionKey: "",
                sPaisEmbarque: "",
                sPuertaEmbarque: "",
                sFechaETD: "",
                sPaisDesembarque: "PE",   // 
                sPuertaDesembarque: "",   // 
                sFechaETA: "",
                bSavedOnce: false
            });

            // 3) Adjuntos (vacío)
            oMP.setProperty("/documentos", []);
            oMP.setProperty("/jDatosAdjuntos", {
                cbTipDocument: "",
                sTipDocumentText: "",
                bPendienteSubirSP: false
            });
            try {
                oMP.refresh(true);
                oMP.updateBindings(true);
            } catch (e) { /* noop */ }
        },
        _asResults: function (x) {
            if (Array.isArray(x)) return x;
            if (x && Array.isArray(x.results)) return x.results;
            if (x && x.d && Array.isArray(x.d.results)) return x.d.results;
            return [];
        },
        _isDialogSaved: function (oMP, sKey) {
            const oState = oMP.getProperty("/appContext/dialogState") || {};
            const st = oState[sKey] || {};
            return !!st.saved || !!st.savedOnce;
        },
        _initDialogState: function () {
            const oMP = this.getModel("oModelProyect");
            if (!oMP) return;

            const sBase = "/appContext/dialogState";
            const oCurr = oMP.getProperty(sBase) || {};

            const def = () => ({
                saved: false,
                savedOnce: false,   // IMPORTANTE
                dirty: false
            });

            oMP.setProperty(sBase, Object.assign({
                DatosCarga: def(),
                DatosViaje: def(),
                AdjuntarDocumentos: def()
            }, oCurr));
        },
        _onPressNavButtonDetail: function () {
            // Limpia el contexto del Detail para que no se quede pegado
            if (typeof this._resetProyectOnlyFacturaContext === "function") {
                this._resetProyectOnlyFacturaContext();
            } else {
                // mínimo viable si no quieres el helper completo
                const oMP = this.getModel("oModelProyect");
                if (oMP) {
                    oMP.setProperty("/oCabecera", {});
                    oMP.setProperty("/oDetalle", []);
                    oMP.setProperty("/oDetalleTotal", []);
                    oMP.setProperty("/sDetalleGastoOrigen", "0.00");
                    oMP.setProperty("/sDetalleFleteInternacional", "0.00");
                    oMP.setProperty("/sDetalleSeguro", "0.00");
                    oMP.setProperty("/sDetalleSubtTotal", "0.00");
                    oMP.setProperty("/sTotal", "0.00");
                    this._ensureCondModel();
                    oMP.setProperty("/cond/bShowOrigen", false);
                    oMP.setProperty("/cond/bShowFlete", false);
                    oMP.setProperty("/cond/bShowSeguro", false);
                }
            }

            this.oRouter.navTo("Main", {}, true);
        },

        _localizeClaseDocumentoCatalog: function () {
            const oMD = this.getModel("oModelData");
            const oMP = this.getModel("oModelProyect");

            if (!oMD) {
                return;
            }

            const aDocs = oMD.getProperty("/oClaseDocumento") || [];

            aDocs.forEach((oDoc) => {
                const sClass = String(oDoc.DocumentClass || "").trim();
                const sSapText = String(oDoc.DocumentClassDescription || "").trim();

                let sTranslated = "";
                if (sClass) {
                    sTranslated = this._getTextSafe
                        ? this._getTextSafe("documentClass" + sClass, "")
                        : "";
                }

                oDoc.DocumentClassDescriptionI18n = sTranslated || sSapText;
            });

            oMD.setProperty("/oClaseDocumento", aDocs);

            if (oMP) {
                const sSelectedClass = String(oMP.getProperty("/oCabecera/sFormClaseDocumento") || "").trim();
                const oSelected = aDocs.find((oDoc) => String(oDoc.DocumentClass || "").trim() === sSelectedClass);

                if (oSelected) {
                    oMP.setProperty(
                        "/oCabecera/sFormClaseDocumentoText",
                        String(oSelected.DocumentClassDescriptionI18n || oSelected.DocumentClassDescription || "").trim()
                    );
                }
            }
        },

        // Coloca por defecto al seleccion del documento 91 
        _setDefaultClaseDocumento91: function () {
            const oMP = this.getModel("oModelProyect");
            const oMD = this.getModel("oModelData");
            if (!oMP || !oMD) return;

            const sCurr = String(oMP.getProperty("/oCabecera/sFormClaseDocumento") || "").trim();
            if (sCurr) return;

            const a = oMD.getProperty("/oClaseDocumento") || [];
            const sKey = "91";
            const o91 = (a || []).find(x => String(x?.DocumentClass || "").trim() === sKey);

            oMP.setProperty("/oCabecera/sFormClaseDocumento", sKey);
            oMP.setProperty(
                "/oCabecera/sFormClaseDocumentoText",
                o91 ? String(o91.DocumentClassDescriptionI18n || o91.DocumentClassDescription || "").trim() : ""
            );
        },
        // Agarra el valor de IdSaP
        _onEnableCabecera: function () {
            const s = formatter._normalizeStatusCode(
                that.oModelProyect.getProperty("/oCabecera/sEstadoCodigo")
            );
            const oMU = that.getOwnerComponent().getModel("oModelUser");
            const bIsComex = !!oMU?.getProperty("/bIsIntComex");

            // 04: nadie
            if (s === "04") {
                that.getMessageBox("error", "No se puede modificar: la orden ya está en estado Contabilizado.");
                that.oModelProyect.setProperty("/oCabecera/bFormEditable", false);
                return;
            }

            // 03: nadie
            if (s === "03") {
                that.getMessageBox("error", "No se puede modificar: la orden está en estado Aprobado.");
                that.oModelProyect.setProperty("/oCabecera/bFormEditable", false);
                return;
            }

            // 02: solo Aris/Comex
            if (s === "02" && !bIsComex) {
                that.getMessageBox("error", "No se puede modificar: la orden está en estado Facturado.");
                that.oModelProyect.setProperty("/oCabecera/bFormEditable", false);
                return;
            }

            that.oModelProyect.setProperty("/oCabecera/bFormEditable", true);
        },
        _onCalculator: function () {
            let iTotalGlobal = 0.00,
                iSubTotal = 0.00;
            const aDetalleTotal = that.oModelProyect.getProperty("/oDetalleTotal") || [];
            const aDetalle = that.oModelProyect.getProperty("/oDetalle") || [];
            aDetalleTotal.forEach(v => { iTotalGlobal += parseFloat(v.Subtotal) || 0; });
            aDetalle.forEach(v => { iSubTotal += parseFloat(v.Subtotal) || 0; });
            const fToNum = (v) => formatter._toNumUI(v);
            const iAdicional = fToNum(that.oModelProyect.getProperty("/sDetalleGastosAdicionales"));
            const iOrigen = fToNum(that.oModelProyect.getProperty("/sDetalleGastoOrigen"));
            const iFlete = fToNum(that.oModelProyect.getProperty("/sDetalleFleteInternacional"));
            const iSeguro = fToNum(that.oModelProyect.getProperty("/sDetalleSeguro"));
            // Total = Subtotal + 4 gastos
            const iTotalFinal = iSubTotal + iAdicional + iOrigen + iFlete + iSeguro;
            that.oModelProyect.setProperty("/oCabecera/sFormImporteFactura", that.formatTwoDecimalsMonto(iTotalGlobal));
            that.oModelProyect.setProperty("/sDetalleSubtTotal", that.formatTwoDecimalsMonto(iSubTotal));
            that.oModelProyect.setProperty("/sTotal", that.formatTwoDecimalsMonto(iTotalFinal));
        },
        liveChangeFormatFloat: function (oEvent) {
            if (typeof that._onCalculator === "function") {
                that._onCalculator();
            }
        },
        _onLiveChangeCondAmount: function (oEvent) {
            try {
                const oInput = oEvent.getSource();
                const oMP = that.getModel("oModelProyect");
                if (!oMP) return;

                const sValuePath = oInput.data("valuePath");
                const sMaxPath = oInput.data("maxPath");
                const sLabel = oInput.data("label") || "importe";

                let nValue = formatter._toNumUI(oEvent.getParameter("value"));
                if (nValue < 0) nValue = 0;

                const vMaxRaw = sMaxPath ? oMP.getProperty(sMaxPath) : "";
                const bHasMax = vMaxRaw !== null && vMaxRaw !== undefined && String(vMaxRaw).trim() !== "";
                const nMax = bHasMax ? formatter._toNumUI(vMaxRaw) : null;

                if (bHasMax && nMax >= 0 && nValue > nMax) {
                    const sMax = that._formatAmount2(nMax);

                    if (sValuePath) {
                        oMP.setProperty(sValuePath, sMax);
                    }

                    oInput.setValue(sMax);
                    oInput.setValueState("Error");
                    oInput.setValueStateText(
                        "El importe de " + sLabel + " no puede exceder el monto disponible por facturar: " + sMax
                    );
                } else {
                    oInput.setValueState("None");
                    oInput.setValueStateText("");

                    if (sValuePath) {
                        oMP.setProperty(sValuePath, oEvent.getParameter("value"));
                    }
                }

                if (typeof that._onCalculator === "function") {
                    that._onCalculator();
                }
            } catch (e) {
            }
        },

        _findCondInputByValuePath: function (sValuePath) {
            const oView = this.getView && this.getView();
            if (!oView || !oView.findAggregatedObjects) return null;

            const aInputs = oView.findAggregatedObjects(true, function (oControl) {
                return oControl &&
                    oControl.isA &&
                    oControl.isA("sap.m.Input") &&
                    oControl.data &&
                    oControl.data("valuePath") === sValuePath;
            });

            return aInputs && aInputs.length ? aInputs[0] : null;
        },

        _validateOneCondAmountByMax: function (sValuePath, sMaxPath, sShowPath, sLabel) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return true;

            if (sShowPath && !oMP.getProperty(sShowPath)) return true;

            const vMaxRaw = oMP.getProperty(sMaxPath);
            const bHasMax = vMaxRaw !== null && vMaxRaw !== undefined && String(vMaxRaw).trim() !== "";
            if (!bHasMax) return true;

            const nValue = formatter._toNumUI(oMP.getProperty(sValuePath));
            const nMax = formatter._toNumUI(vMaxRaw);

            if (nValue <= nMax) return true;

            const sMax = that._formatAmount2(nMax);
            oMP.setProperty(sValuePath, sMax);

            const oInput = that._findCondInputByValuePath(sValuePath);
            if (oInput) {
                oInput.setValue(sMax);
                oInput.setValueState("Error");
                oInput.setValueStateText(
                    "El importe de " + sLabel + " no puede exceder el monto disponible por facturar: " + sMax
                );
                oInput.focus();
            }

            if (typeof that._onCalculator === "function") {
                that._onCalculator();
            }

            that.getMessageBox(
                "error",
                "El importe de " + sLabel + " no puede exceder el monto disponible por facturar: " + sMax
            );

            return false;
        },

        _validateCondAmountsByMax: function () {
            return this._validateOneCondAmountByMax("/sDetalleGastoOrigen", "/cond/nMaxOrigen", "/cond/bShowOrigen", "Gastos Origen") &&
                this._validateOneCondAmountByMax("/sDetalleFleteInternacional", "/cond/nMaxFlete", "/cond/bShowFlete", "Flete Internacional") &&
                this._validateOneCondAmountByMax("/sDetalleSeguro", "/cond/nMaxSeguro", "/cond/bShowSeguro", "Seguro");
        },
        //---Dialogs. Datos Carga---
        _onPressCompletarDatosCarga: function () {
            const bEdit = !!that.oModelProyect.getProperty("/oCabecera/bFormEditable");
            if (!bEdit) {
                that.getMessageBox("warning", "El documento se encuentra bloqueado para edición.");
                return;
            }

            this.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosCarga/saved", false);
            this.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosCarga/dirty", false);
            that.setFragment("_dialogDatosCarga", this.frgIdDatosCarga, "DatosCarga", this);
        },
        fnPressAddBultos: function (oEvent) {
            let cTable = that._byId("frgIdDatosCarga--tableBultos");

            const aCurr = that.oModelProyect.getProperty("/jDatosCarga/oBultos") || [];
            if (aCurr.length >= 1) {
                MessageBox.warning("Solo se permite registrar 1 bulto.");
                return;
            }

            var obj;
            var items = [];
            var maximo = 0;
            var maxEmb = 0;

            if (cTable.getBinding().getModel("oModelProyect").getData().jDatosCarga.oBultos != undefined) {
                items = cTable.getBinding().getModel("oModelProyect").getData().jDatosCarga.oBultos;
                for (var i = 0, len = items.length; i < len; i++) {
                    if (maximo < items[i].key) {
                        maximo = items[i].key;
                    }
                    if (maxEmb < items[i].nBulto) { maxEmb = items[i].nBulto; }
                }
            }

            obj = {
                "key": maximo + 1,
                "nBulto": maxEmb + 1,
                "qBulto": "",
                "selectedKey": "",
                "tipoBulto": "",
                "desctipoBulto": "",
                "pesoBulto": "",
                "longitudBulto": "",
                "anchoBulto": "",
                "alturaBulto": "",
                "cwBulto": ""
            };

            items.push(obj);
            that.oModelProyect.setProperty("/jDatosCarga/oBultos", items);
        },
        fnPressDeleteBultos: function () {
            let cTable = that._byId("frgIdDatosCarga--tableBultos");
            var index = cTable.getSelectedIndices()[0];

            var sPath = "/jDatosCarga/oBultos/" + (index).toString();
            var objTabla = that.oModelProyect.getProperty("/jDatosCarga/oBultos");
            var objSelected = that.oModelProyect.getProperty(sPath);

            for (var i = 0; i < objTabla.length; i++) {
                var indice = objTabla.indexOf(objSelected);
                if (indice != -1)
                    objTabla.splice(indice, 1);
            }
            var maximo = 0;
            objTabla.forEach(function (value) {
                value.key = maximo + 1;
                value.nBulto = maximo + 1;
                maximo++;
            });

            cTable.removeSelectionInterval(index, index);
            that.oModelProyect.setProperty("/jDatosCarga/oBultos", objTabla);
            that.getMessageBox("success", "Eliminado Correctamente.");
        },
        fnSelectedTipoBulto: function (oEvent) {
            var tipoemb = oEvent.getSource().getSelectedItem().getBindingContext("oModelData").getObject();
            var cell = oEvent.getSource().getParent().getBindingContext("oModelProyect").getObject();
            var arr = that.oModelProyect.getProperty("/jDatosCarga/oBultos");
            for (var i = 0; i < arr.length; i++) {
                if (cell.key == arr[i].key) {
                    arr[i].tipoBulto = tipoemb.Vegr2;
                    arr[i].desctipoBulto = tipoemb.Bezei;
                }
            }
            that.oModelProyect.setProperty("/jDatosCarga/oBultos", arr);
        },
        fnPressAddContenido: function (oEvent) {
            let cTable = that._byId("frgIdDatosCarga--tableContenido");
            const aCurr = that.oModelProyect.getProperty("/jDatosCarga/oContenido") || [];
            if (aCurr.length >= 2) {
                MessageBox.warning("Solo se permite registrar 2 contenedores.");
                return;
            }

            var obj;
            var items = [];
            var maximo = 0;
            var maxEmb = 0;

            if (cTable.getBinding().getModel("oModelProyect").getData().jDatosCarga.oContenido != undefined) {
                items = cTable.getBinding().getModel("oModelProyect").getData().jDatosCarga.oContenido;
                for (var i = 0, len = items.length; i < len; i++) {
                    if (maximo < items[i].key) {
                        maximo = items[i].key;
                    }
                    if (maxEmb < items[i].nContenido) { maxEmb = items[i].nContenido; }
                }
            }

            obj = {
                "key": maximo + 1,
                "nContenido": maxEmb + 1,
                "qContenido": "",
                "selectedKey": "",
                "tipoContenido": "",
                "descContenido": ""
            };

            items.push(obj);
            that.oModelProyect.setProperty("/jDatosCarga/oContenido", items);
        },
        fnSelectedTipoContenido: function (oEvent) {
            const oSelect = oEvent.getSource();
            const oItem = oSelect.getSelectedItem();
            if (!oItem) return;

            const oTipo = oItem.getBindingContext("oModelData").getObject();
            const oCtx = oSelect.getBindingContext("oModelProyect");
            if (!oCtx) return;

            const sRowPath = oCtx.getPath();

            that.oModelProyect.setProperty(sRowPath + "/tipoContenido", String(oTipo.Vegr2 || "").trim());
            that.oModelProyect.setProperty(sRowPath + "/descContenido", String(oTipo.Bezei || "").trim());
        },
        fnPressDeleteContenido: function () {
            let cTable = that._byId("frgIdDatosCarga--tableContenido");

            const aSel = cTable.getSelectedIndices ? cTable.getSelectedIndices() : [];
            if (!aSel || !aSel.length) {
                utilUI?.onMessageErrorDialogPress2 ? utilUI.onMessageErrorDialogPress2("No se ha seleccionado ningún Contenedor")
                    : that.getMessageBox("error", "No se ha seleccionado ningún Contenedor");
                return;
            }

            let objTabla = that.oModelProyect.getProperty("/jDatosCarga/oContenido") || [];
            const aSorted = aSel.slice().sort((a, b) => b - a);
            aSorted.forEach(function (idx) {
                if (idx >= 0 && idx < objTabla.length) {
                    objTabla.splice(idx, 1);
                }
            });

            var maximo = 0;
            objTabla.forEach(function (value) {
                value.key = maximo + 1;
                value.nContenido = maximo + 1;
                maximo++;
            });

            try {
                cTable.clearSelection();
            } catch (e) {

                aSel.forEach(i => cTable.removeSelectionInterval(i, i));
            }

            that.oModelProyect.setProperty("/jDatosCarga/oContenido", objTabla);
            that.getMessageBox("success", "Eliminado Correctamente.");
        },

        // Datos Adjuntos
        _onPressAdjuntarDocumentos: async function () {
            // Bloqueo si NO está en modo edición
            const bEdit = !!that.oModelProyect.getProperty("/oCabecera/bFormEditable");
            //const scode = that.oModelData.getProperty("/oStatusOrder");
            if (!bEdit) {
                that.getMessageBox("warning", "Debe presionar 'Editar' antes de adjuntar documentos.");
                return;
            }

            // ✅ Si ya existe IdSap, traer docs desde SharePoint y pintarlos en /documentos
            const sIdSap = String(
                that.oModelProyect.getProperty("/appContext/sIdSap") ||
                that.oModelProyect.getProperty("/oCabecera/IdSap") || ""
            ).trim();

            if (sIdSap && that.routeSharepoint && that.driveId) {
                try {
                    await that._loadSharePointDocsByIdSap(sIdSap);
                } catch (e) {
                    // no bloquees el diálogo por esto
                }
            }

            this.getModel("oModelProyect").setProperty("/appContext/dialogState/AdjuntarDocumentos/saved", false);
            this.getModel("oModelProyect").setProperty("/appContext/dialogState/AdjuntarDocumentos/dirty", false);
            that.setFragment("_dialogAdjuntarDocumentos", this.frgIdAdjuntarDocumentos, "AdjuntarDocumentos", this);
        },
        _onPressDeleteDetalleRow: function (oEvent) {
            try {
                const oBtn = oEvent.getSource();
                const oCtx = oBtn.getBindingContext("oModelProyect");
                if (!oCtx) {
                    that.getMessageBox("error", "No se pudo determinar la fila a eliminar (sin contexto).");
                    return;
                }
                const sPath = oCtx.getPath();
                const aPathParts = sPath.split("/");
                const iIndex = parseInt(aPathParts[aPathParts.length - 1], 10);
                if (isNaN(iIndex)) {
                    that.getMessageBox("error", "No se pudo determinar el índice de la fila.");
                    return;
                }
                MessageBox.confirm("¿Desea eliminar esta fila del detalle?", {
                    actions: ["Eliminar", "Cancelar"],
                    emphasizedAction: "Eliminar",
                    onClose: function (sAction) {
                        if (sAction !== "Eliminar") return;
                        const aDetalle = (that.oModelProyect.getProperty("/oDetalle") || []).slice();
                        if (iIndex < 0 || iIndex >= aDetalle.length) {
                            that.getMessageBox("error", "Índice fuera de rango al eliminar.");
                            return;
                        }
                        aDetalle.splice(iIndex, 1);
                        that.oModelProyect.setProperty("/oDetalle", aDetalle);
                        if (typeof that._onCalculator === "function") {
                            that._onCalculator();
                        }

                        that.getMessageBox("success", "Fila eliminada correctamente.");
                    }
                });

            } catch (e) {
                that.getMessageBox("error", "Error al intentar eliminar la fila.");
            }
        },
        _onPressConfirmCarga: function (oEvent) {
            let oSource = oEvent.getSource(),
                cTable = that._byId("frgIdDatosCarga--tableContenido");

            let jDatosCarga = that.oModelProyect.getProperty("/jDatosCarga") || {};
            try {
                const oBindModel = cTable?.getBinding()?.getModel?.("oModelProyect");
                const oData = oBindModel?.getData?.();
                if (oData?.jDatosCarga) jDatosCarga = oData.jDatosCarga;
            } catch (e) { /* noop */ }

            const oBultos = Array.isArray(jDatosCarga.oBultos) ? jDatosCarga.oBultos : [];
            const oContenido = Array.isArray(jDatosCarga.oContenido) ? jDatosCarga.oContenido : [];

            if (oBultos.length > 0) {
                for (var i = 0; i < oBultos.length; i++) {
                    var b = oBultos[i];
                    if (oBultos.length > 1) {
                        that.getMessageBox("error", "Solo se permite registrar 1 bulto.");
                        return;
                    }
                    if (oContenido.length > 2) {
                        that.getMessageBox("error", "Solo se permite registrar 2 contenedores.");
                        return;
                    }

                    // Q. Bulto
                    if (that.isEmpty(b.qBulto)) {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo vacio: Bulto N°" + b.nBulto + "\n Campo Q. Bulto");
                        return;
                    }

                    // T. Bulto
                    if (b.tipoBulto == "" || b.tipoBulto == "0") {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo no Seleccionado: Bulto N°" + b.nBulto + "\n Campo Tipo de Bulto");
                        return;
                    }

                    // Peso KGS
                    if (that.isEmpty(b.pesoBulto)) {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo vacio: Bulto N°" + b.nBulto + "\n Campo KGS");
                        return;
                    }
                    if (parseFloat(String(b.pesoBulto).replace(/,/g, "")) < 1) {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo 0 no admitido: Bulto N°" + b.nBulto + "\n Campo KGS");
                        return;
                    }

                    // Longitud
                    if (that.isEmpty(b.longitudBulto)) {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo vacio: Bulto N°" + b.nBulto + "\n Campo Longuitud(Cm)");
                        return;
                    }
                    if (parseFloat(String(b.longitudBulto).replace(/,/g, "")) < 1) {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo 0 no admitido: Bulto N°" + b.nBulto + "\n Campo Longuitud(Cm)");
                        return;
                    }

                    // CW
                    if (that.isEmpty(b.cwBulto)) {
                        that.getMessageBox("error", "Tabla: Bulto \n Campo vacio: Bulto N°" + b.nBulto + "\n Campo CW.");
                        return;
                    }
                }
            }
            // ===== Validar CONTENEDOR =====
            if (oContenido.length > 0) {
                for (var j = 0; j < oContenido.length; j++) {
                    var c = oContenido[j];

                    // Q. Contenido
                    if (that.isEmpty(c.qContenido)) {
                        that.getMessageBox("error", "Tabla: Contenido \n Campo vacio: Contenido N°" + c.nContenido + "\n Campo Q. Contenido");
                        return;
                    }

                    // T. Contenido
                    if (c.tipoContenido == "" || c.tipoContenido == "0") {
                        that.getMessageBox("error", "Tabla: Contenido \n Campo no Seleccionado: Contenido N°" + c.nContenido + "\n Campo Tipo de Contenido");
                        return;
                    }
                }
            }
            var oMP = this.getModel("oModelProyect") || this.getOwnerComponent().getModel("oModelProyect");

            oMP.setProperty("/appContext/dialogState/DatosCarga/saved", true);
            oMP.setProperty("/appContext/dialogState/DatosCarga/savedOnce", true);
            oMP.setProperty("/appContext/dialogState/DatosCarga/dirty", false);

            oMP.setProperty("/jDatosCarga/bSavedOnce", true);
            oMP.setProperty("/jDatosCarga/oBultos", oBultos);
            oMP.setProperty("/jDatosCarga/oContenido", oContenido);

            oSource.getParent().close();
            that.getMessageBox("success", "informacion Guardada en memoria.");
        },
        //---Dialogs. Datos Viaje---
        _onPressCompletarDatosViaje: function () {
            const bEdit = !!that.oModelProyect.getProperty("/oCabecera/bFormEditable");
            if (!bEdit) {
                that.getMessageBox("warning", "El documento se encuentra bloqueado para edición.");
                return;
            }

            this.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosViaje/saved", false);
            this.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosViaje/dirty", false);
            that.setFragment("_dialogDatosViaje", this.frgIdDatosViaje, "DatosViaje", this);
        },
        _onPressConfirmViaje: function (oEvent) {
            let oSource = oEvent.getSource();
            const v = that.oModelProyect.getProperty("/jDatosViaje") || {};

            // Modalidad
            if (that.isEmpty(v.cbModalidad)) { that.getMessageBox("error", "Campo Modalidad no Seleccionado."); return; }

            //Nave/Vuelo
            if (that.isEmpty(v.sViajeNave)) { that.getMessageBox("error", "Campo Nave/Vuelo vacio."); return; }

            //Número BL/AWB
            if (that.isEmpty(v.sViajeNumBL)) { that.getMessageBox("error", "Campo Número BL/AWB vacio."); return; }

            // Tipo Emision
            if (that.isEmpty(v.cbTipoEmision)) { that.getMessageBox("error", "Campo Tipo Emision no Seleccionado."); return; }

            //Pais Embarque
            if (that.isEmpty(v.sPaisEmbarque)) { that.getMessageBox("error", "Campo Pais Embarque vacio."); return; }

            //Puerta Embarque
            if (that.isEmpty(v.sPuertaEmbarque)) { that.getMessageBox("error", "Campo Puerta Embarque vacio."); return; }

            //Fecha ETD
            if (that.isEmpty(v.sFechaETD)) { that.getMessageBox("error", "Campo Fecha ETD vacio."); return; }

            //Fecha ETA
            if (that.isEmpty(v.sFechaETA)) { that.getMessageBox("error", "Campo Fecha ETA vacio."); return; }

            that.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosViaje/saved", true);
            that.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosViaje/savedOnce", true);
            that.getModel("oModelProyect").setProperty("/appContext/dialogState/DatosViaje/dirty", false);
            that.getModel("oModelProyect").setProperty("/jDatosViaje/bSavedOnce", true);

            oSource.getParent().close();
            that.getMessageBox("success", "informacion Guardada en memoria.");
        },
        // Calcular los totales de Ordenes
        _syncDetalleTotalByKey: function (sEbeln, sEbelp, nQty, nSub, nBaseQty) {
            const aTotal = that.oModelProyect.getProperty("/oDetalleTotal") || [];
            const i = aTotal.findIndex(x =>
                String(x.Ebeln) === String(sEbeln) &&
                String(x.Ebelp) === String(sEbelp)
            );

            if (i >= 0) {
                aTotal[i].Orderquantity = nQty;
                aTotal[i].Subtotal = nSub;
                if (nBaseQty !== undefined && nBaseQty !== null) {
                    aTotal[i].BaseQuantity = nBaseQty;
                } else {
                    const b = formatter._toNumUI(aTotal[i].BaseQuantity);
                    aTotal[i].BaseQuantity = (!b || b <= 0) ? 1 : b;
                }

                that.oModelProyect.setProperty("/oDetalleTotal", aTotal);
            }
        },
        _onLiveChangeOrderQty: function (oEvent) {
            try {
                const oInput = oEvent.getSource();
                let sVal = String(oEvent.getParameter("value") || "");

                // No actualizar el modelo aquí.
                // Solo limpiamos caracteres inválidos para permitir escritura normal.
                let sClean = sVal.replace(/,/g, ".");
                sClean = sClean.replace(/[^0-9.]/g, "");

                const aParts = sClean.split(".");
                if (aParts.length > 2) {
                    sClean = aParts[0] + "." + aParts.slice(1).join("");
                }

                const aDecimal = sClean.split(".");
                if (aDecimal.length === 2 && aDecimal[1].length > 2) {
                    sClean = aDecimal[0] + "." + aDecimal[1].substring(0, 2);
                }

                if (sClean !== sVal) {
                    oInput.setValue(sClean);
                }

                const oCtx = oInput.getBindingContext("oModelProyect");
                if (!oCtx) return;

                const sPath = oCtx.getPath();
                const nQty = formatter._toNumUI(sClean);

                const vMaxRaw = that.oModelProyect.getProperty(sPath + "/OrderquantityMax");
                const bHasMax = vMaxRaw !== null && vMaxRaw !== undefined && String(vMaxRaw).trim() !== "";
                const nMax = bHasMax ? formatter._toNumUI(vMaxRaw) : null;

                if (bHasMax && nQty > nMax) {
                    oInput.setValueState("Warning");
                    oInput.setValueStateText("La cantidad no puede exceder la cantidad disponible por facturar: " + nMax);
                } else {
                    oInput.setValueState("None");
                    oInput.setValueStateText("");
                }

            } catch (e) {
            }
        },

        _onChangeOrderQty: function (oEvent) {
            try {
                const oInput = oEvent.getSource();
                const oCtx = oInput.getBindingContext("oModelProyect");
                if (!oCtx) return;

                const sPath = oCtx.getPath();
                const sVal = String(oInput.getValue() || "");

                let nQty = formatter._toNumUI(sVal);
                if (nQty < 0) nQty = 0;

                const vMaxRaw = that.oModelProyect.getProperty(sPath + "/OrderquantityMax");
                const bHasMax = vMaxRaw !== null && vMaxRaw !== undefined && String(vMaxRaw).trim() !== "";
                const nMax = bHasMax ? formatter._toNumUI(vMaxRaw) : null;

                let bExceeded = false;

                if (bHasMax && nQty > nMax) {
                    nQty = nMax;
                    bExceeded = true;
                }

                const nUnit = formatter._toNumUI(that.oModelProyect.getProperty(sPath + "/Unitprice"));

                let nBase = formatter._toNumUI(that.oModelProyect.getProperty(sPath + "/BaseQuantity"));
                if (!nBase || nBase <= 0) {
                    nBase = 1;
                }

                const nSub = formatter._round2((nQty / nBase) * nUnit);

                that.oModelProyect.setProperty(sPath + "/Orderquantity", nQty);
                that.oModelProyect.setProperty(sPath + "/Subtotal", nSub);

                const oRow = that.oModelProyect.getProperty(sPath) || {};
                that._syncDetalleTotalByKey(oRow.Ebeln, oRow.Ebelp, nQty, nSub, nBase);

                oInput.setValue(nQty.toFixed(2));

                if (bExceeded) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText("La cantidad no puede exceder la cantidad disponible por facturar: " + nMax);
                } else {
                    oInput.setValueState("None");
                    oInput.setValueStateText("");
                }

                that._onCalculator();

            } catch (e) {
            }
        },

        //Imprementación para registro de la factura,viaje, carga y bultos
        // HSoler
        _buildPayloadRegFacExt: function (sTipOperaOverride) {
            const oCab = that.oModelProyect.getProperty("/oCabecera") || {};
            const aDetalle = that.oModelProyect.getProperty("/oDetalle") || [];
            const jCarga = that.oModelProyect.getProperty("/jDatosCarga") || {};
            const aBultos = (jCarga.oBultos || []);
            const aCont = (jCarga.oContenido || []);
            const jViaje = that.oModelProyect.getProperty("/jDatosViaje") || {};

            const toNum = (v) => {
                if (v === null || v === undefined) return 0;
                let s = String(v).trim();
                if (!s) return 0;
                const hasComma = s.includes(",");
                const hasDot = s.includes(".");
                if (hasComma && hasDot) s = s.replace(/,/g, "");
                else if (hasComma && !hasDot) s = s.replace(/,/g, ".");
                s = s.replace(/\s/g, "").replace(/[^0-9.\-]/g, "");
                const n = parseFloat(s);
                return isNaN(n) ? 0 : n;
            };

            const toODataNumStr = (v, decimals = 2) => {
                const n = toNum(v);
                return (isNaN(n) ? 0 : n).toFixed(decimals);
            };

            const fToODataNumber = (v) => formatter.formatNumberForOData(v).toString();
            const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

            const prorratearPorSubtotal = (aDet, total) => {
                const nTotal = toNum(total);
                const nSumSub = aDet.reduce((acc, it) => acc + toNum(it.Subtotal), 0);

                if (nTotal === 0 || nSumSub <= 0 || !aDet.length) {
                    return aDet.map(() => 0);
                }

                const aOut = [];
                let acum = 0;

                for (let i = 0; i < aDet.length; i++) {
                    const nSub = toNum(aDet[i].Subtotal);
                    const ratio = nSub / nSumSub;
                    let val;

                    if (i === aDet.length - 1) {
                        val = round2(nTotal - acum);
                    } else {
                        val = round2(nTotal * ratio);
                        acum = round2(acum + val);
                    }
                    aOut.push(val);
                }
                return aOut;
            };

            const nSubTotalItems = aDetalle.reduce((acc, it) => acc + toNum(it.Subtotal), 0);
            const nGasAdicional = toNum(that.oModelProyect.getProperty("/sDetalleGastosAdicionales"));
            const nGasOrigen = toNum(that.oModelProyect.getProperty("/sDetalleGastoOrigen"));
            const nFlete = toNum(that.oModelProyect.getProperty("/sDetalleFleteInternacional"));
            const nSeguro = toNum(that.oModelProyect.getProperty("/sDetalleSeguro"));

            const nTotalUI = toNum(that.oModelProyect.getProperty("/sTotal"));
            const nInvoiceAmount = round2(
                nTotalUI || (nSubTotalItems + nGasAdicional + nGasOrigen + nFlete + nSeguro)
            );

            const aGasOrigenIt = prorratearPorSubtotal(aDetalle, nGasOrigen);
            const aFleteIt = prorratearPorSubtotal(aDetalle, nFlete);
            const aSeguroIt = prorratearPorSubtotal(aDetalle, nSeguro);

            const sInvoiceTxtCab = (oCab.sFormNumeroFactura || "").trim();
            const sCurrency = (oCab.sFormMoneda || oCab.sMoneda || "").toString();
            const sSupplier = (oCab.sRuc || "").toString();
            const sCompany = (oCab.sCompany || oCab.Company || "").toString();

            const oMP = that.getModel("oModelProyect");
            const sIdSapUrl = String(oMP.getProperty("/appContext/sIdSap") || "").trim();
            const sIdSapCab = String(oCab.IdSap || oCab.Idsap || oCab.IDSAP || "").trim();
            const sIdSapFinal = sIdSapUrl || sIdSapCab;
            const bFaltaUM = aDetalle.some(it => !String(it.Quantitybaseunit || it.QuantityBaseunit || it.Um || "").trim());
            if (bFaltaUM) {
                that.getMessageBox("error", "Hay items sin Unidad de Medida (Quantitybaseunit). Revise el detalle.");
                return;
            }
            const oHeader = {
                TipOpera: (String(sTipOperaOverride || "").trim() || oCab.TipOpera || "01"),
                IdSap: sIdSapFinal || "",
                Company: sCompany,
                Supplier: sSupplier,

                // Texto de cabecera: va exactamente como el usuario lo escribió.
                // Este sí llena el texto de cabecera en SAP.
                TxtCab: sInvoiceTxtCab,

                // IMPORTANTE:
                // No enviar ReferenceInvoice.
                // Ese campo no se llena desde este portal y el OData lo rechaza si viaja en el payload.

                InvoiceDate: formatter.toODataDateSafe(oCab.sFormFechaFactura),
                BaseDate: formatter.toODataDateSafe(oCab.sFormFechaBase),
                AccountingDate: formatter.toODataDateSafe(oCab.sFormFechaContabilizacion),
                DocumentClass: (oCab.sFormClaseDocumentoKey || oCab.sFormClaseDocumento || "").toString(),
                Currency: sCurrency,
                PaymentTerms: (oCab.sFormCondicionPagoOrder || "").toString(),
                InvoiceAmount: fToODataNumber(nInvoiceAmount),
                GasAdicional: fToODataNumber(nGasAdicional),
                GasOrigen: fToODataNumber(nGasOrigen),
                FleIntern: fToODataNumber(nFlete),
                Seguro: fToODataNumber(nSeguro)
            };

            const aItems = aDetalle.map((it, idx) => ({
                IdSap: "",
                Purchasedocument: (it.Ebeln || "").toString(),
                Purchasedocumentitem: (it.Ebelp || "").toString(),
                Material: (it.Material || "").toString(),
                Quantity: toODataNumStr(it.Orderquantity, 3),
                Quantitybaseunit: (it.Quantitybaseunit || it.QuantityBaseunit || it.Um || "").toString(),
                Unitprice: fToODataNumber(it.Unitprice),
                Currency: (it.Waers || oHeader.Currency || "").toString(),
                Totalamount: fToODataNumber(it.Subtotal),

                GasOrigen: fToODataNumber(aGasOrigenIt[idx] || 0),
                FleIntern: fToODataNumber(aFleteIt[idx] || 0),
                Seguro: fToODataNumber(aSeguroIt[idx] || 0)
            }));

            const c1 = aCont?.[0] || null;
            const c2 = aCont?.[1] || null;

            const qCont1 = c1 ? toODataNumStr(c1.qContenido, 2) : "0.00";
            const tipCont1 = c1 ? String(c1.tipoContenido || "").trim() : "";

            const qCont2 = c2 ? toODataNumStr(c2.qContenido, 2) : "0.00";
            const tipCont2 = c2 ? String(c2.tipoContenido || "").trim() : "";

            const bHasContenedor =
                tipCont1 ||
                tipCont2 ||
                toNum(qCont1) > 0 ||
                toNum(qCont2) > 0;

            const buildCarDatRow = function (b, idx) {
                return {
                    IdSap: "",
                    Posbulto: String(b?.nBulto || (idx + 1)).padStart(6, "0"),
                    Cantbulto: toODataNumStr(b?.qBulto, 0),
                    Tipobulto: (b?.tipoBulto || "").toString(),
                    Cms: (b?.longitudBulto === null || b?.longitudBulto === undefined) ? "" : String(b?.longitudBulto || ""),
                    Kgs: toODataNumStr(b?.pesoBulto, 2),
                    Cw: toODataNumStr(b?.cwBulto, 2),

                    // Los contenedores se mandan en la primera fila técnica de carga.
                    Qcontenedor: idx === 0 ? qCont1 : "0.00",
                    Tipocontenedor: idx === 0 ? tipCont1 : "",
                    Qcontenedor2: idx === 0 ? qCont2 : "0.00",
                    Tipocontenedor2: idx === 0 ? tipCont2 : ""
                };
            };

            let aCarDat = [];

            if (aBultos.length > 0) {
                aCarDat = aBultos.map(function (b, idx) {
                    return buildCarDatRow(b, idx);
                });
            } else if (bHasContenedor) {
                // Caso importante:
                // Si el usuario llena solo Contenedor y no llena Bultos,
                // igual se debe enviar una fila técnica a toCarDat para que SAP guarde los campos de contenedor.
                aCarDat = [{
                    IdSap: "",
                    Posbulto: "000001",
                    Cantbulto: "0",
                    Tipobulto: "",
                    Cms: "",
                    Kgs: "0.00",
                    Cw: "0.00",

                    Qcontenedor: qCont1,
                    Tipocontenedor: tipCont1,
                    Qcontenedor2: qCont2,
                    Tipocontenedor2: tipCont2
                }];
            }

            const oVia = {
                IdSap: "",
                Modalidad: (jViaje.cbModalidadKey || jViaje.cbModalidad || "").toString(),
                NaveVuelo: (jViaje.sViajeNave || "").toString(),
                NroBlAwb: (jViaje.sViajeNumBL || "").toString(),
                TipoEmision: (jViaje.cbTipoEmisionKey || jViaje.cbTipoEmision || "").toString(),
                PaisEmb: (jViaje.cbPaisesEmb || jViaje.sPaisEmbarque || "").toString(),
                PuertoEmb: (jViaje.sPuertaEmbarque || "").toString(),
                FechaEtd: formatter.toODataDateSafe(jViaje.sFechaETD),
                PaisDest: (jViaje.sPaisDesembarque || "").toString(),
                PuertoDest: (jViaje.sPuertaDesembarque || "").toString(),
                FechaEta: formatter.toODataDateSafe(jViaje.sFechaETA)
            };

            return {
                ...oHeader,
                toRegFacExtItem: { results: aItems },
                toCarDat: { results: aCarDat },
                toDatVia: { results: [oVia] }
            };
        },

        //Sirve para cuando se recarga la pagina se mantenga el IdSap al momento de que se genera
        _extractIdSapFromCreateResponse: function (oResp, oRawResponse) {
            const pick = (...keys) => {
                for (let i = 0; i < keys.length; i++) {
                    const k = keys[i];
                    const v = oResp?.[k] ?? oResp?.d?.[k];
                    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
                }
                return "";
            };
            let sId = pick("IdSap", "IDSAP", "Idsap", "ID_SAP");
            if (sId) return sId;
            try {
                const loc = oRawResponse?.headers?.["location"] || oRawResponse?.headers?.["Location"];
                if (loc && typeof loc === "string") {
                    let m = /\('([^']+)'\)/.exec(loc);
                    if (m?.[1]) return String(m[1]).trim();
                    m = /IDSAP='([^']+)'/i.exec(loc);
                    if (m?.[1]) return String(m[1]).trim();
                }
            } catch (e) { /* noop */ }

            const sMsg = pick("Msg", "MSG", "Message", "mensaje");
            if (sMsg) {
                let m = /(\d{6,})\s*$/.exec(String(sMsg).trim());
                if (m?.[1]) return String(m[1]).trim();
                m = /n(?:ú|u)mero\s+(\d{6,})/i.exec(String(sMsg));
                if (m?.[1]) return String(m[1]).trim();
            }

            return "";
        },
        _updateUrlWithIdSap: function (sIdSap) {
            const s = String(sIdSap || "").trim();
            if (!s) return false;

            try {
                const hc = this.oRouter.getHashChanger();
                const sHash = (hc.getHash && hc.getHash()) || hc.hash || window.location.hash.replace(/^#/, "");
                const a = String(sHash || "").split("?");
                const sBase = a[0] || "";
                const oParams = new URLSearchParams(a[1] || "");
                oParams.set("IdSap", s);
                const sNewHash = sBase + "?" + oParams.toString();
                if (hc && typeof hc.replaceHash === "function") {
                    hc.replaceHash(sNewHash);
                } else {
                    window.location.hash = "#" + sNewHash;
                }
                return true;
            } catch (e) {
                return false;
            }
        },
        _switchToIdSapMode: function (sIdSap) {
            const s = String(sIdSap || "").trim();
            if (!s) return;
            this.oModelProyect.setProperty("/appContext/bFromIdSap", true);
            this.oModelProyect.setProperty("/appContext/sIdSap", s);
            this.oModelProyect.setProperty("/oCabecera/IdSap", s);
            if (typeof this._persistStateByIdSap === "function") {
                this._persistStateByIdSap(s);
            }
            this._updateUrlWithIdSap(s);
        },
        // Finaliza aqui 
        _onPressEnviarFacturaExterior: function () {
            const that = this;

            try {
                const sCurr = formatter._normalizeStatusCode(
                    that.oModelProyect.getProperty("/oCabecera/sEstadoCodigo")
                );
                const oMU = that.getOwnerComponent().getModel("oModelUser");
                const bIsComex = !!oMU?.getProperty("/bIsIntComex");

                if (sCurr === "04") {
                    that.getMessageBox(
                        "warning",
                        "No se puede guardar porque el documento está en estado 04 (Contabilizado)."
                    );
                    return;
                }

                if (sCurr === "03") {
                    that.getMessageBox(
                        "warning",
                        "No se puede guardar porque el documento está en estado 03 (Aprobado)."
                    );
                    return;
                }

                if (sCurr === "02" && !bIsComex) {
                    that.getMessageBox(
                        "warning",
                        "No se puede guardar porque el documento está en estado 02 (" +
                        (that.oModelProyect.getProperty("/oCabecera/sFormEstadoRegistro") || "Facturado") + ")."
                    );
                    return;
                }


                const bEdit = !!that.oModelProyect.getProperty("/oCabecera/bFormEditable");
                if (!bEdit) {
                    that.getMessageBox("warning", "Primero debe presionar 'Editar' para habilitar cambios antes de guardar.");
                    return;
                }

                //codigo Marlon Estefo
                const oView = this.getView();

                const toNum = (v) => {
                    const s = String(v ?? "").trim().replace(/,/g, "");
                    const n = parseFloat(s);
                    return Number.isFinite(n) ? n : 0;
                };

                const bShowOrigen = !!that.oModelProyect.getProperty("/cond/bShowOrigen");
                const bShowFlete = !!that.oModelProyect.getProperty("/cond/bShowFlete");
                const bShowSeguro = !!that.oModelProyect.getProperty("/cond/bShowSeguro");

                // ✅ rutas correctas según tu fragment
                const nOrigen = toNum(that.oModelProyect.getProperty("/sDetalleGastoOrigen"));
                const nFlete = toNum(that.oModelProyect.getProperty("/sDetalleFleteInternacional"));
                const nSeguro = toNum(that.oModelProyect.getProperty("/sDetalleSeguro"));

                if (bShowOrigen && nOrigen <= 0) {
                    that.getMessageBox("error", "Debe ingresar un valor mayor a 0 en 'Gastos Origen'.");
                    return;
                }
                if (bShowFlete && nFlete <= 0) {
                    that.getMessageBox("error", "Debe ingresar un valor mayor a 0 en 'Flete Internacional'.");
                    return;
                }
                if (bShowSeguro && nSeguro <= 0) {
                    that.getMessageBox("error", "Debe ingresar un valor mayor a 0 en 'Seguro'.");
                    return;
                }
                if (!that._validateDetalleQtyByMax()) {
                    return;
                }
                if (!that._validateCondAmountsByMax()) {
                    return;
                }

                const sCurrEstado = formatter._normalizeStatusCode(
                    that.oModelProyect.getProperty("/oCabecera/sEstadoCodigo")
                ) || "";

                // Guardar normal:
                // - Si es nuevo o registrado, asegura fecha de registro.
                // - Si está facturado y Comex edita, conserva fecha de facturado.
                if (!sCurrEstado || sCurrEstado === "00" || sCurrEstado === "01") {
                    that._applyAccountingDateByStatus("01");
                } else {
                    that._applyAccountingDateByStatus(sCurrEstado);
                }
                const oDpFechaBase = that.byId("dpFechaBase");
                if (oDpFechaBase) {
                    const sFechaBaseUI = oDpFechaBase.getValue();
                    that.oModelProyect.setProperty("/oCabecera/sFormFechaBase", sFechaBaseUI);
                }
                const oPayload = that._buildPayloadRegFacExt();

                if (bIsComex && sCurr === "02") {
                    oPayload.Status = sCurr;
                }

                //codigo implementado Marlon Estefo

                const sFromModel = (that.oModelProyect.getProperty("/oCabecera/sFormNumeroFactura") || "").trim();
                const sFromUI = (that.byId("inpNumeroFactura")?.getValue?.() || "").trim();


                if (!oPayload?.TxtCab) {
                    that.getMessageBox("error", "Número de factura vacío.");
                    return;
                }

                if (!oPayload?.DocumentClass) {
                    that.getMessageBox("error", "Clase de documento no seleccionada.");
                    return;
                }
                if (!oPayload?.toRegFacExtItem?.results?.length) {
                    that.getMessageBox("error", "No hay items en el detalle.");
                    return;
                }
                if (!String(oPayload.Company || "").trim()) {
                    that.getMessageBox("error", "Company vacío. No se guardó correctamente en cabecera.");
                    return;
                }
                if (!String(oPayload.Supplier || "").trim()) {
                    that.getMessageBox("error", "Supplier vacío. No se guardó correctamente en cabecera.");
                    return;
                }

                const oModel = that.getOwnerComponent().getModel("oModelEntity");
                if (!oModel || !oModel.create) {
                    that.getMessageBox("error", "No existe el modelo 'oModelEntity' o no es un ODataModel.");
                    return;
                }

                // IDSAP actual (si ya existiera)
                const sIdSapActual = String(
                    that.oModelProyect.getProperty("/appContext/sIdSap") ||
                    that.oModelProyect.getProperty("/oCabecera/IdSap") ||
                    oPayload.IdSap || ""
                ).trim();

                sap.ui.core.BusyIndicator.show(0);


                oModel.create("/RegFacExtSet", oPayload, {
                    success: async function (oResp, oRawResponse) {
                        try {
                            const sMsgSrv = String(
                                oResp?.Msg ||
                                oResp?.msg ||
                                oResp?.d?.Msg ||
                                oResp?.d?.msg ||
                                ""
                            ).trim();

                            const sStatusSrv = String(
                                oResp?.Status ||
                                oResp?.status ||
                                oResp?.d?.Status ||
                                oResp?.d?.status ||
                                ""
                            ).trim();

                            if (sStatusSrv === "E") {
                                sap.ui.core.BusyIndicator.hide(0);
                                sap.m.MessageBox.error(sMsgSrv || "Error devuelto por SAP.");
                                that.oModelProyect.setProperty("/oCabecera/bFormEditable", true);
                                return;
                            }

                            let sNewIdSap = "";
                            if (!sIdSapActual) {
                                sNewIdSap = that._extractIdSapFromCreateResponse(oResp, oRawResponse);
                                if (sNewIdSap) {
                                    that._switchToIdSapMode(sNewIdSap);
                                }
                            }

                            const sFinalIdSap = String(sIdSapActual || sNewIdSap || "").trim();

                            if (!sFinalIdSap) {
                                sap.ui.core.BusyIndicator.hide(0);

                                const sMsgBackend = String(
                                    sMsgSrv ||
                                    oResp?.Msg ||
                                    oResp?.msg ||
                                    oResp?.d?.Msg ||
                                    oResp?.d?.msg ||
                                    ""
                                ).trim();

                                sap.m.MessageBox.error(
                                    sMsgBackend || "No se generó IDSAP. Revise el mensaje devuelto por el servicio."
                                );

                                that.oModelProyect.setProperty("/oCabecera/bFormEditable", true);
                                return;
                            }
                            that.oModelProyect.setProperty("/oCabecera/bFormEditable", false);

                            if (typeof that._loadByIdSap === "function") {
                                that._loadByIdSap(sFinalIdSap);
                            }

                            let oUpResult = null;

                            try {
                                const aDocs = that.oModelProyect.getProperty("/documentos") || [];
                                const aPend = aDocs.filter(d => d && d.fileObject && !d.uploaded);

                                if (sFinalIdSap && aPend.length) {
                                    if (!that.routeSharepoint || !that.driveId) {
                                        oUpResult = { sEstado: "E", msg: "Falta configuración SharePoint (routeSharepoint/driveId)" };
                                    } else {
                                        const aFolderChain = [`AF${String(sFinalIdSap).trim()}`];
                                        const oFolderResp = await that._ensureSharePointFolderChain(aFolderChain);

                                        if (!oFolderResp || oFolderResp.sEstado !== "S") {
                                            oUpResult = { sEstado: "E", msg: "No se pudo preparar carpeta en SharePoint", detail: oFolderResp };
                                        } else {
                                            let iOk = 0;

                                            for (let i = 0; i < aPend.length; i++) {
                                                const d = aPend[i];
                                                try {
                                                    const resp = await that._uploadSharepoint(d.fileObject, function () { }, aFolderChain);
                                                    if (resp?.sEstado === "S") {
                                                        iOk++;
                                                        const sWebUrl = resp?.oResults?.webUrl || "";
                                                        const aNew = (that.oModelProyect.getProperty("/documentos") || []).map(x => {
                                                            if (x.fileName === d.fileName) {
                                                                x.uploaded = true;
                                                                if (sWebUrl) x.url = sWebUrl;
                                                            }
                                                            return x;
                                                        });
                                                        that.oModelProyect.setProperty("/documentos", aNew);
                                                    } else {
                                                    }
                                                } catch (e2) {
                                                }
                                            }
                                            oUpResult = {
                                                sEstado: (iOk === aPend.length ? "S" : "E"),
                                                subidos: iOk,
                                                total: aPend.length
                                            };
                                        }
                                    }
                                }
                            } catch (eUp) {
                                oUpResult = { sEstado: "E", msg: "Excepción subiendo adjuntos a SharePoint" };
                            }

                            const sInfoId = "\nnúmero de registro: " + sFinalIdSap;
                            const sInfoSrv = sMsgSrv ? ("\n" + sMsgSrv) : "";

                            let sInfoSP = "";
                            if (oUpResult) {
                                if (oUpResult.sEstado === "S") {
                                    sInfoSP = `\nAdjuntos SharePoint: ${oUpResult.subidos}/${oUpResult.total} subidos.`;
                                } else if (oUpResult.sEstado === "E") {
                                    sInfoSP = `\nAdjuntos SharePoint: no se pudieron subir todos (revise consola).`;
                                }
                            }

                            sap.ui.core.BusyIndicator.hide(0);
                            that.getMessageBox(
                                "success",
                                "Su factura del exterior se guardó correctamente con el siguiente" + sInfoId + sInfoSrv + sInfoSP
                            );

                        } catch (e) {
                            sap.ui.core.BusyIndicator.hide(0);
                            that.getMessageBox("error", "Factura enviada, pero ocurrió un error en el post-proceso (adjuntos/estado).");
                        }
                    },
                    error: function (e) {
                        sap.ui.core.BusyIndicator.hide(0);
                        that.getMessageBox("error", "Error al enviar a SAP.");
                    }
                });

            } catch (e) {
                sap.ui.core.BusyIndicator.hide(0);
                that.getMessageBox("error", "Error armando payload de factura exterior.");
            }
        },
        _onPressEliminarSolicitudFacturacion: function () {
            const that = this;

            try {
                const oMP = that.getModel("oModelProyect");

                // Bloqueo por estado: 04 = Contabilizado
                const sEstado = formatter._normalizeStatusCode(
                    oMP.getProperty("/oCabecera/sEstadoCodigo")
                );
                switch (sEstado) {
                    case "02":
                        that.getMessageBox(
                            "error",
                            "No se puede eliminar la solicitud: la orden ya se encuentra en estado Facturado ."
                        );
                        return;

                    case "03":
                        that.getMessageBox(
                            "error",
                            "No se puede eliminar la solicitud: la orden ya se encuentra en estado Aprobado ."
                        );
                        return;

                    case "04":
                        that.getMessageBox(
                            "error",
                            "No se puede eliminar la solicitud: la orden ya se encuentra en estado Contabilizado ."
                        );
                        return;

                    default:
                        break;
                }
                const sIdSap = String(
                    oMP.getProperty("/appContext/sIdSap") ||
                    oMP.getProperty("/oCabecera/IdSap") ||
                    ""
                ).trim();

                if (!sIdSap) {
                    that.getMessageBox(
                        "error",
                        "No existe codigo de registro para eliminar. Primero debe haberse generado/guardado la solicitud."
                    );
                    return;
                }

                MessageBox.confirm(
                    "¿Desea eliminar la solicitud de facturación?\n\nIDSAP: " + sIdSap,
                    {
                        actions: ["Eliminar", "Cancelar"],
                        emphasizedAction: "Eliminar",
                        onClose: function (sAction) {
                            if (sAction !== "Eliminar") return;
                            that._deleteSolicitudFacturacionSAP(sIdSap);
                        }
                    }
                );
            } catch (e) {
                this.getMessageBox("error", "Ocurrió un error al intentar iniciar la eliminación.");
            }
        },

        _deleteSolicitudFacturacionSAP: function (sIdSap) {
            const that = this;

            try {
                const oModel = that.getOwnerComponent().getModel("oModelEntity");
                if (!oModel || !oModel.create) {
                    that.getMessageBox("error", "No existe el modelo 'oModelEntity' o no es un ODataModel.");
                    return;
                }
                const oPayload = that._buildPayloadRegFacExt("02");
                oPayload.IdSap = String(sIdSap || oPayload.IdSap || "").trim();
                if (!oPayload.IdSap) {
                    that.getMessageBox("error", "IdSap vacío. No se puede eliminar.");
                    return;
                }
                sap.ui.core.BusyIndicator.show(0);
                oModel.create("/RegFacExtSet", oPayload, {
                    success: function (oResp) {
                        sap.ui.core.BusyIndicator.hide(0);
                        try {
                            if (typeof that._getStateKeyByIdSap === "function") {
                                const k = that._getStateKeyByIdSap(sIdSap);
                                sessionStorage.removeItem(k);
                            }
                        } catch (e) { /* noop */ }
                        const oMP = that.getModel("oModelProyect");
                        oMP.setProperty("/appContext/bFromIdSap", false);
                        oMP.setProperty("/appContext/sIdSap", "");
                        oMP.setProperty("/oCabecera/IdSap", "");
                        if (typeof that._removeIdSapFromUrl === "function") {
                            that._removeIdSapFromUrl();
                        }
                        that.oRouter.navTo("Main", {}, true);
                        const sMsgSrv = (oResp && oResp.d && oResp.d.Msg) ? String(oResp.d.Msg) : "";
                        that.getMessageBox("success", "Solicitud eliminada correctamente." + (sMsgSrv ? ("\n" + sMsgSrv) : ""));
                    },
                    error: function (e) {
                        sap.ui.core.BusyIndicator.hide(0);
                        that.getMessageBox("error", "Error al eliminar en SAP.");
                    }
                });

            } catch (e) {
                sap.ui.core.BusyIndicator.hide(0);
                that.getMessageBox("error", "Error preparando eliminación (TipOpera=02).");
            }
        },
        _removeIdSapFromUrl: function () {
            try {
                const hc = this.oRouter.getHashChanger();
                const sHash = (hc.getHash && hc.getHash()) || hc.hash || window.location.hash.replace(/^#/, "");
                const a = String(sHash || "").split("?");
                const sBase = a[0] || "";
                const oParams = new URLSearchParams(a[1] || "");
                oParams.delete("IdSap");
                const sNewHash = oParams.toString() ? (sBase + "?" + oParams.toString()) : sBase;

                if (hc && typeof hc.replaceHash === "function") {
                    hc.replaceHash(sNewHash);
                } else {
                    window.location.hash = "#" + sNewHash;
                }
            } catch (e) {
                // no bloquear flujo por esto
            }
        },
        // Adjuntar Datos 
        onChangeTipoAdjunto: function (oEvent) {
            const oCB = oEvent.getSource();
            const oItem = oCB.getSelectedItem();
            const sKey = oItem ? (oItem.getKey ? oItem.getKey() : oItem.getProperty("key")) : "";
            const sText = oItem ? (oItem.getText ? oItem.getText() : oItem.getProperty("text")) : "";
            const oModel = this.getModel("oModelProyect");
            oModel.setProperty("/jDatosAdjuntos/cbTipDocument", sKey);
            oModel.setProperty("/jDatosAdjuntos/sTipDocumentText", sText);
        },
        onChange: function (oEvent) {
            const aFiles = oEvent.getParameter("files") || [];
            if (!aFiles.length) return;

            const oFile = aFiles[0];
            const oModel = this.getModel("oModelProyect");

            const sTipoKey = (oModel.getProperty("/jDatosAdjuntos/cbTipDocument") || "").trim();
            const sTipoText = (oModel.getProperty("/jDatosAdjuntos/sTipDocumentText") || "").trim();

            if (!sTipoKey && !sTipoText) {
                sap.m.MessageBox.error("Seleccione un tipo de documento antes de adjuntar el archivo.");
                return;
            }

            const sPrefix = sTipoText || sTipoKey;

            // ✅ Mantener extensión
            const sOriginalName = oFile.name || "archivo";
            const iDot = sOriginalName.lastIndexOf(".");
            const sExt = (iDot > -1) ? sOriginalName.substring(iDot) : "";
            const sFinalName = `${sPrefix}${sExt}`;

            const oRenamedFile = new File([oFile], sFinalName, { type: oFile.type });

            const aDocs = (oModel.getProperty("/documentos") || []).slice();
            aDocs.push({
                fileName: sFinalName,
                originalFileName: sOriginalName,
                mimeType: oRenamedFile.type || "",
                fileSize: oRenamedFile.size || 0,
                fileObject: oRenamedFile,     // ⚠️ En memoria
                tipoKey: sTipoKey,
                tipoText: sTipoText,
                uploaded: false,
                url: ""
            });

            oModel.setProperty("/documentos", aDocs);
            sap.m.MessageToast.show("Documento agregado: " + sFinalName);
        },
        // Para Guardar los key de los documentos 
        onGuardar: function () {
            const oMP = this.getModel("oModelProyect");
            const aDocs = oMP.getProperty("/documentos") || [];

            if (!aDocs.length) {
                sap.m.MessageBox.error("Debe adjuntar al menos un documento.");
                return;
            }

            oMP.setProperty("/jDatosAdjuntos/bPendienteSubirSP", true);

            // Cierra el diálogo (usa tu mecanismo habitual)
            const oDlg = this._byId("frgIdAdjuntarDocumentos--IdDocumentUpload") || sap.ui.getCore().byId("frgIdAdjuntarDocumentos--IdDocumentUpload");
            oMP.setProperty("/appContext/dialogState/AdjuntarDocumentos/saved", true);
            oMP.setProperty("/appContext/dialogState/AdjuntarDocumentos/savedOnce", true); // NUEVO
            oMP.setProperty("/appContext/dialogState/AdjuntarDocumentos/dirty", false);
            if (oDlg) oDlg.close();

            sap.m.MessageToast.show("Documentos guardados en memoria. Se subirán cuando se genere el IDSAP.");
        },
        onUploadComplete: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const aFiles = oEvent.getParameter("files") || [];
            const sFileName = aFiles[0]?.fileName;

            if (!sFileName) return;

            let aDocs = oModel.getProperty("/documentos") || [];
            aDocs = aDocs.map(doc => {
                if (doc.fileName === sFileName) {
                    doc.uploaded = true;
                }
                return doc;
            });

            oModel.setProperty("/documentos", aDocs);
        },

        // Para Guardar datos en el sharepotin 
        _uploadPendientesSharePointByIdSap: async function (sIdSap) {
            const oMP = this.getModel("oModelProyect");
            const aDocs = oMP.getProperty("/documentos") || [];

            if (!aDocs.length) return { sEstado: "S", subidos: 0 };
            const aPend = aDocs.filter(d => d && d.fileObject && !d.uploaded);

            if (!aPend.length) return { sEstado: "S", subidos: 0 };
            const aFolderChain = [`AF${String(sIdSap).trim()}`];
            const oFolderResp = await this._ensureSharePointFolderChain(aFolderChain);
            if (!oFolderResp || oFolderResp.sEstado !== "S") {
                return { sEstado: "E", msg: "No se pudo crear/validar carpeta en SharePoint", detail: oFolderResp };
            }
            let iOk = 0;
            for (let i = 0; i < aPend.length; i++) {
                const d = aPend[i];
                try {
                    const resp = await this._uploadSharepoint(
                        d.fileObject,
                            /* onProgress */ function () { },
                        aFolderChain
                    );

                    if (resp?.sEstado === "S") {
                        iOk++;
                        const sWebUrl = resp?.oResults?.webUrl || "";
                        const aNew = (oMP.getProperty("/documentos") || []).map(x => {
                            if (x.fileName === d.fileName) {
                                x.uploaded = true;
                                x.url = sWebUrl || x.url || "";
                            }
                            return x;
                        });
                        oMP.setProperty("/documentos", aNew);
                    } else {
                    }
                } catch (e) {
                }
            }

            return { sEstado: (iOk === aPend.length ? "S" : "E"), subidos: iOk, total: aPend.length };
        },
        onFileDeleted: function (oEvent) {
            const oModel = this.getView().getModel("oModelProyect");
            const sFileName = oEvent.getParameter("item").getFileName();

            let aDocs = oModel.getProperty("/documentos") || [];
            aDocs = aDocs.filter(doc => doc.fileName !== sFileName);

            oModel.setProperty("/documentos", aDocs);
        },

        // Controla el primer ingreso para que todos los campos sean editables
        _applyEditabilityByEstado: function (sCode) {
            const code = formatter._normalizeStatusCode(sCode) || "00";
            const oMU = this.getOwnerComponent().getModel("oModelUser");
            const bIsComex = !!oMU?.getProperty("/bIsIntComex");
            const bIsProveedorExt = !!oMU?.getProperty("/bIsExtAyc");

            // APROBADO o CONTABILIZADO: nadie edita
            if (code === "03" || code === "04") {
                this.oModelProyect.setProperty("/oCabecera/bLockedByStatus", true);
                this.oModelProyect.setProperty("/oCabecera/bFormEditable", false);
                return;
            }

            // FACTURADO: proveedor exterior NO edita (comex puede)
            if (code === "02" && bIsProveedorExt && !bIsComex) {
                this.oModelProyect.setProperty("/oCabecera/bLockedByStatus", true);
                this.oModelProyect.setProperty("/oCabecera/bFormEditable", false);
                return;
            }

            // default: editable
            this.oModelProyect.setProperty("/oCabecera/bLockedByStatus", false);
            this.oModelProyect.setProperty("/oCabecera/bFormEditable", true);
        },
        _setEstadoUI: function (sCode, sDesc) {
            const code = formatter._normalizeStatusCode(sCode) || "00";

            const sDescI18n = that._getStatusDescription
                ? that._getStatusDescription(code, true)
                : "";

            const desc = sDescI18n || String(sDesc || "").trim() || (
                code === "00" ? "Pendiente Facturación" : ""
            );

            that.oModelProyect.setProperty("/oCabecera/sEstadoCodigo", code);
            that.oModelProyect.setProperty("/oCabecera/sEstadoDescripcion", desc);
            that.oModelProyect.setProperty("/oCabecera/sFormEstadoRegistro", desc);

            if (typeof that._applyEditabilityByEstado === "function") {
                that._applyEditabilityByEstado(code);
            } else {
                const bLock = (code === "02" || code === "03" || code === "04");
                that.oModelProyect.setProperty("/oCabecera/bLockedByStatus", bLock);
                that.oModelProyect.setProperty("/oCabecera/bFormEditable", !bLock);
            }
        },
        _getStatusDescFromCatalog: function (sCode) {
            const code = formatter._normalizeStatusCode(sCode);

            const sDescI18n = that._getStatusDescription
                ? that._getStatusDescription(code, true)
                : "";

            if (sDescI18n) {
                return sDescI18n;
            }

            const a = that.oModelData.getProperty("/oStatusOrder") || [];
            const o = (a || []).find(x => formatter._normalizeStatusCode(x.Status) === code);

            return o ? String(o.StatusDescription || "").trim() : "";
        },

        _pick: function (obj, aKeys) {
            for (let i = 0; i < aKeys.length; i++) {
                const k = aKeys[i];
                const v = obj ? obj[k] : undefined;
                if (v !== undefined && v !== null && String(v).trim() !== "") return v;
            }
            return "";
        },

        _toNum: function (v) {
            const n = parseFloat(String(v || "0").replace(/,/g, ""));
            return isNaN(n) ? 0 : n;
        },

        _toStr: function (v) {
            return (v === null || v === undefined) ? "" : String(v);
        },
        _norm: function (v) {
            return String(v || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // quita acentos
                .toUpperCase()
                .trim();
        },
        _getStateKeyByIdSap: function (sIdSap) {
            return "FACT_EXT_STATE_" + String(sIdSap || "").trim();
        },
        _persistStateByIdSap: function (sIdSap) {
            try {

                const k = this._getStateKeyByIdSap(sIdSap);
                const oState = {
                    oCabecera: that.oModelProyect.getProperty("/oCabecera") || {},
                    oDetalle: that.oModelProyect.getProperty("/oDetalle") || [],
                    oDetalleTotal: that.oModelProyect.getProperty("/oDetalleTotal") || [],
                    sDetalleGastosAdicionales: that.oModelProyect.getProperty("/sDetalleGastosAdicionales") || "0.00",
                    sDetalleGastoOrigen: that.oModelProyect.getProperty("/sDetalleGastoOrigen") || "0.00",
                    sDetalleFleteInternacional: that.oModelProyect.getProperty("/sDetalleFleteInternacional") || "0.00",
                    sDetalleSeguro: that.oModelProyect.getProperty("/sDetalleSeguro") || "0.00",
                    sDetalleSubtTotal: that.oModelProyect.getProperty("/sDetalleSubtTotal") || "0.00",
                    sTotal: that.oModelProyect.getProperty("/sTotal") || "0.00",
                    jDatosCarga: that.oModelProyect.getProperty("/jDatosCarga") || {},
                    jDatosViaje: that.oModelProyect.getProperty("/jDatosViaje") || {},
                    documentos: that.oModelProyect.getProperty("/documentos") || [],
                    cond: that.oModelProyect.getProperty("/cond") || {}
                };
                sessionStorage.setItem(k, JSON.stringify(oState));
            } catch (e) {
            }
        },
        _restoreStateByIdSap: function (sIdSap) {
            try {
                const k = this._getStateKeyByIdSap(sIdSap);
                const raw = sessionStorage.getItem(k);
                if (!raw) return false;

                const oState = JSON.parse(raw);

                that.oModelProyect.setProperty("/oCabecera", oState.oCabecera || {});
                that.oModelProyect.setProperty("/oDetalle", oState.oDetalle || []);
                that.oModelProyect.setProperty("/oDetalleTotal", oState.oDetalleTotal || []);
                that.oModelProyect.setProperty("/sDetalleGastosAdicionales", oState.sDetalleGastosAdicionales || "0.00");
                that.oModelProyect.setProperty("/sDetalleGastoOrigen", oState.sDetalleGastoOrigen || "0.00");
                that.oModelProyect.setProperty("/sDetalleFleteInternacional", oState.sDetalleFleteInternacional || "0.00");
                that.oModelProyect.setProperty("/sDetalleSeguro", oState.sDetalleSeguro || "0.00");
                that.oModelProyect.setProperty("/sDetalleSubtTotal", oState.sDetalleSubtTotal || "0.00");
                that.oModelProyect.setProperty("/sTotal", oState.sTotal || "0.00");
                that.oModelProyect.setProperty("/jDatosCarga", oState.jDatosCarga || {});
                that.oModelProyect.setProperty("/jDatosViaje", oState.jDatosViaje || {});
                that.oModelProyect.setProperty("/documentos", oState.documentos || []);

                // NUEVO: restaurar cond
                that._ensureCondModel();
                that.oModelProyect.setProperty(
                    "/cond",
                    oState.cond || that.oModelProyect.getProperty("/cond")
                );

                // (Opcional) asegurar visibilidad por montos si cond viene vacío/incompleto
                if (typeof that._applyCondVisibilityFromAmounts === "function") {
                    that._applyCondVisibilityFromAmounts();
                }

                // recalcula por si el UI depende
                if (typeof that._onCalculator === "function") that._onCalculator();

                return true;
            } catch (e) {
                return false;
            }
        },
        _ensureUserProfile: function () {
            const oMU = this.getOwnerComponent().getModel("oModelUser");
            if (oMU && oMU.getProperty("/_loaded")) return Promise.resolve(true);

            return this._getUsers().then((u) => {
                const oUser = u?.Resources?.[0];
                this._applyProveedorUserProfile(oUser);
                return true;
            });
        },
        _getArr: function (r) {
            return (r && (r.oResults || r.results || (r.d && r.d.results))) || [];
        },
        _ensureCatalog: function (propPath, fnGet) {
            const aCurrent = this.oModelData.getProperty(propPath);
            if (Array.isArray(aCurrent) && aCurrent.length) {
                return Promise.resolve(aCurrent);
            }
            return fnGet.call(this, "").then((r) => {
                const a = this._getArr(r);
                this.oModelData.setProperty(propPath, a);
                return a;
            });
        },
        _resolveKeyFromCatalog: function (aCatalog, value, keyField = "sKey", textField = "sText") {
            const nVal = this._norm(value);
            if (!nVal) return "";

            const oMatch = (aCatalog || []).find(x =>
                this._norm(x[keyField]) === nVal || this._norm(x[textField]) === nVal
            );
            return oMatch ? String(oMatch[keyField] || "") : String(value || "");
        },
        // Esto seria para cuando ingresas con Id Sap para los input de condiciones 
        _ensureCondModel: function () {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;

            const oCond = oMP.getProperty("/cond") || {};

            oMP.setProperty("/cond", Object.assign({
                bShowOrigen: false,
                bShowFlete: false,
                bShowSeguro: false,
                sDescOrigen: "",
                sDescFlete: "",
                sDescSeguro: "",
                nMaxOrigen: "",
                nMaxFlete: "",
                nMaxSeguro: ""
            }, oCond));
        },
        // Cuando se ingresa por IdSap para los incoterm
        _ensureReqModel: function () {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;

            if (!oMP.getProperty("/req")) {
                oMP.setProperty("/req", {
                    bViajeRequired: false,
                    bShowDatosViajeButton: false,
                    aIncoterms: []
                });
            }
        },
        _loadAndApplyConditionsByOrders: function (aOrdenes) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return Promise.resolve();

            this._ensureCondModel();
            const aOCsAll = Array.from(new Set((aOrdenes || [])
                .map(x => String(x || "").trim())
                .filter(Boolean)
            ));

            if (!aOCsAll.length) {
                if (typeof that._applyCondVisibilityFromAmounts === "function") {
                    that._applyCondVisibilityFromAmounts();
                }
                return Promise.resolve();
            }
            oMP.setProperty("/appContext/aPurchaseOrders", aOCsAll);
            oMP.setProperty("/appContext/sPurchaseOrders", aOCsAll.join(","));
            oMP.setProperty("/oCabecera/PurchaseOrder", aOCsAll[0] || "");
            oMP.setProperty("/oCabecera/Ebeln", aOCsAll[0] || "");
            const sPOForCond = aOCsAll[0];
            const aOCsForCond = [sPOForCond];

            return that._getConditionsDetail(aOCsForCond)
                .then((oCondResp) => {
                    that._applyConditionsFromCondResponse(oCondResp);
                })
                .catch(() => {
                    // fallback si el servicio falla
                    if (typeof that._applyCondVisibilityFromAmounts === "function") {
                        that._applyCondVisibilityFromAmounts();
                    }
                });
        },
        _applyConditionsFromCondResponse: function (oCondResp) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;

            this._ensureCondModel();

            const aCond = that._asResults(oCondResp?.oResults || oCondResp?.results || (oCondResp?.d?.results));
            const pickDesc = (sClass, sFallback) => {
                const o = (aCond || []).find(x => String(x?.ConditionClass || "").trim() === sClass);
                const s = o ? String(o.ConditionDescription || "").trim() : "";
                return s || sFallback || "";
            };
            const has = (sClass) => (aCond || []).some(x => String(x?.ConditionClass || "").trim() === sClass);

            const bZI03 = has("ZI03"); // Origen
            const bZI04 = has("ZI04"); // Flete
            const bZI05 = has("ZI05"); // Seguro

            const nOrigenPend = that._getPendingConditionAmount(aCond, "ZI03");
            const nFletePend = that._getPendingConditionAmount(aCond, "ZI04");
            const nSeguroPend = that._getPendingConditionAmount(aCond, "ZI05");

            const nOrigenActual = formatter._toNumUI(oMP.getProperty("/sDetalleGastoOrigen"));
            const nFleteActual = formatter._toNumUI(oMP.getProperty("/sDetalleFleteInternacional"));
            const nSeguroActual = formatter._toNumUI(oMP.getProperty("/sDetalleSeguro"));

            const nMaxOrigen = nOrigenActual + nOrigenPend;
            const nMaxFlete = nFleteActual + nFletePend;
            const nMaxSeguro = nSeguroActual + nSeguroPend;

            oMP.setProperty("/cond/bShowOrigen", bZI03);
            oMP.setProperty("/cond/bShowFlete", bZI04);
            oMP.setProperty("/cond/bShowSeguro", bZI05);

            oMP.setProperty("/cond/sDescOrigen", pickDesc("ZI03", "Gasto Origen"));
            oMP.setProperty("/cond/sDescFlete", pickDesc("ZI04", "Flete Internacional"));
            oMP.setProperty("/cond/sDescSeguro", pickDesc("ZI05", "Seguro"));

            oMP.setProperty("/cond/nMaxOrigen", nMaxOrigen > 0 ? that._formatAmount2(nMaxOrigen) : "");
            oMP.setProperty("/cond/nMaxFlete", nMaxFlete > 0 ? that._formatAmount2(nMaxFlete) : "");
            oMP.setProperty("/cond/nMaxSeguro", nMaxSeguro > 0 ? that._formatAmount2(nMaxSeguro) : "");

            if (!bZI03) oMP.setProperty("/sDetalleGastoOrigen", "0.00");
            if (!bZI04) oMP.setProperty("/sDetalleFleteInternacional", "0.00");
            if (!bZI05) oMP.setProperty("/sDetalleSeguro", "0.00");

            if (typeof that._onCalculator === "function") that._onCalculator();
        },
        _applyCondVisibilityFromAmounts: function () {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;

            this._ensureCondModel();

            const toNum = (v) => {
                let s = String(v ?? "").trim();
                if (!s) return 0;
                s = s.replace(/\s/g, "");
                const hasComma = s.includes(",");
                const hasDot = s.includes(".");
                if (hasComma && hasDot) s = s.replace(/,/g, "");
                else if (hasComma && !hasDot) s = s.replace(/,/g, ".");
                s = s.replace(/[^0-9.\-]/g, "");
                const n = parseFloat(s);
                return isNaN(n) ? 0 : n;
            };

            const nOrigen = toNum(oMP.getProperty("/sDetalleGastoOrigen"));
            const nFlete = toNum(oMP.getProperty("/sDetalleFleteInternacional"));
            const nSeguro = toNum(oMP.getProperty("/sDetalleSeguro"));

            const bOrigen = nOrigen > 0;
            const bFlete = nFlete > 0;
            const bSeguro = nSeguro > 0;

            oMP.setProperty("/cond/bShowOrigen", bOrigen);
            oMP.setProperty("/cond/bShowFlete", bFlete);
            oMP.setProperty("/cond/bShowSeguro", bSeguro);

            // Si quieres limpiar cuando no aplica:
            if (!bOrigen) oMP.setProperty("/sDetalleGastoOrigen", "0.00");
            if (!bFlete) oMP.setProperty("/sDetalleFleteInternacional", "0.00");
            if (!bSeguro) oMP.setProperty("/sDetalleSeguro", "0.00");
            if (!String(oMP.getProperty("/cond/sDescOrigen") || "").trim()) {
                oMP.setProperty("/cond/sDescOrigen", "Gasto Origen");
            }
            if (!String(oMP.getProperty("/cond/sDescFlete") || "").trim()) {
                oMP.setProperty("/cond/sDescFlete", "Flete Internacional");
            }
            if (!String(oMP.getProperty("/cond/sDescSeguro") || "").trim()) {
                oMP.setProperty("/cond/sDescSeguro", "Seguro");
            }
        },
        //Validación del Incoterms cuando se ingresa por IdSap
        _isIncotermViajeRequired: function (sInco1) {
            const s = String(sInco1 || "").trim().toUpperCase();
            if (!s) return false;
            const aReq = ["CFR", "CPT", "CIF", "CIP", "DDP", "DAP", "DDU"];
            return aReq.includes(s);
        },

        _applyViajeRequirementFromOrdenes: function (aOrdenes) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;

            this._ensureReqModel();

            const aIncos = Array.from(new Set((aOrdenes || [])
                .map(o => String(o?.Inco1 || "").trim().toUpperCase())
                .filter(Boolean)
            ));

            const bReq = aIncos.some(s => this._isIncotermViajeRequired(s));

            oMP.setProperty("/req/aIncoterms", aIncos);
            oMP.setProperty("/req/bViajeRequired", bReq);
            oMP.setProperty("/req/bShowDatosViajeButton", bReq);
            if (!bReq) {
                oMP.setProperty("/jDatosViaje", oMP.getProperty("/jDatosViaje") || {});
                oMP.setProperty("/appContext/dialogState/DatosViaje/saved", false);
                oMP.setProperty("/appContext/dialogState/DatosViaje/dirty", false);
            }
        },

        _loadOrdenesAndApplyViajeByOCs: function (aOCs) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return Promise.resolve();

            this._ensureReqModel();

            const _esc = (v) => String(v ?? "").trim().replace(/'/g, "''");
            const a = Array.from(new Set((aOCs || []).map(x => String(x || "").trim()).filter(Boolean)));

            if (!a.length) {
                this._applyViajeRequirementFromOrdenes([]);
                return Promise.resolve();
            }

            let sFiltroEbeln = "";
            a.forEach((value, index) => {
                const v = _esc(value);
                sFiltroEbeln += (index === 0) ? `Ebeln eq '${v}' ` : `or Ebeln eq '${v}' `;
            });

            return that._getOrdenes(sFiltroEbeln)
                .then((r) => {
                    const aOrdenes = that._asResults(r?.oResults || r?.results || (r?.d?.results));
                    that._applyViajeRequirementFromOrdenes(aOrdenes);
                    return aOrdenes;
                })
                .catch(() => {
                    that._applyViajeRequirementFromOrdenes([]);
                    return [];
                });
        },
        _loadByIdSap: function (sIdSap) {
            const _esc = (v) => String(v || "").replace(/'/g, "''");

            that.oModelProyect = that.getModel("oModelProyect");
            that.oModelData = that.getModel("oModelData");
            that.oModelData.setSizeLimit(5000);

            const pCatalogos = Promise.all([
                that._ensureCatalog("/oClaseDocumento", that._getClaseDocumento),
                that._ensureCatalog("/oModalidad", that._getModalidad),
                that._ensureCatalog("/oTipoEmision", that._getTipoEmision),
                that._ensureCatalog("/oPaisesEmbDes", that._getCountriesEmb),
                that._ensureCatalog("/oPuertosEmbDes", that._getPuertoEmb),
                that._ensureCatalog("/oTipoBulto", that._getTipoBulto),
                that._ensureCatalog("/oTipoContenido", that._getTipoContenido),
                that._ensureCatalog("/oAdjuntDat", that._getAdjuntarDatos),
                that._ensureCatalog("/oStatusOrder", that._getStatusOrder)
            ]);

            const sPath = jQuery.sap.getModulePath("com.aris.proveedores.facturaexterior.pe") +
                "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/DatFacExt" +
                "?$expand=to_RegFacExtDet,to_DatCar,to_DatVia" +
                "&$top=100&$skip=0&$format=json" +
                "&$filter=IDSAP eq '" + _esc(sIdSap) + "'";

            sap.ui.core.BusyIndicator.show(0);

            pCatalogos.then((aCats) => {
                const [
                    aClaseDoc, aModalidad, aTipoEmi,
                    aPaises, aPuertos,
                    aTipoBulto, aTipoCont,
                    aAdj, aStatusCat
                ] = aCats;

                that._localizeClaseDocumentoCatalog();

                Services.getoDataERPSync(that, sPath, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: async function (oData) {
                            const a =
                                (oData && Array.isArray(oData.data) && oData.data) ||
                                (oData && oData.d && Array.isArray(oData.d.results) && oData.d.results) ||
                                (oData && Array.isArray(oData.results) && oData.results) ||
                                [];

                            const h = a.length ? a[0] : null;
                            if (!h) {
                                sap.ui.core.BusyIndicator.hide(0);

                                MessageBox.error("No se encontró información para IdSap: " + sIdSap, {
                                    actions: [MessageBox.Action.OK],
                                    emphasizedAction: MessageBox.Action.OK,
                                    onClose: function () {
                                        try {
                                            const oMP = that.getModel("oModelProyect");
                                            if (oMP) {
                                                oMP.setProperty("/appContext/bFromIdSap", false);
                                                oMP.setProperty("/appContext/sIdSap", "");
                                                oMP.setProperty("/oCabecera/IdSap", "");
                                            }
                                            if (typeof that._removeIdSapFromUrl === "function") {
                                                that._removeIdSapFromUrl();
                                            }
                                        } catch (e) { /* noop */ }

                                        that.oRouter.navTo("Main", {}, true);
                                    }
                                });

                                return;
                            }

                            const pick = (obj, ...keys) => that._pick(obj, keys);
                            const toNum = (v) => that._toNum(v);
                            const toStr = (v) => that._toStr(v);

                            const sCompanySrv = String(pick(h, "Company", "Bukrs")).trim();
                            const sSupplierSrv = String(pick(h, "Supplier")).trim();

                            const sCompanyPrev = String(
                                that.oModelProyect.getProperty("/oCabecera/sCompany") ||
                                that.oModelProyect.getProperty("/oCabecera/Company") || ""
                            ).trim();
                            const sSupplierPrev = String(that.oModelProyect.getProperty("/oCabecera/sRuc") || "").trim();

                            const sCompany = sCompanySrv || sCompanyPrev;
                            const sSupplier = sSupplierSrv || sSupplierPrev;

                            const sNumFactura = toStr(pick(h, "Invoice", "Numfac", "NumFac"));
                            const sRefFactura = toStr(pick(h, "HeaderText", "HeaderText"));

                            that.oModelProyect.setProperty("/oCabecera/IdSap", toStr(pick(h, "IDSAP", "IdSap")) || toStr(sIdSap));
                            that.oModelProyect.setProperty("/oCabecera/sFactura", toStr(pick(h, "ReferenceInvoice", "Referenceinvoice")));
                            that.oModelProyect.setProperty("/oCabecera/sFormClaseDocumento", toStr(pick(h, "DocumentClass", "Documentclass")));
                            that.oModelProyect.setProperty("/oCabecera/sFormNumeroFactura", sRefFactura);
                            that.oModelProyect.setProperty("/oCabecera/sFormMoneda", toStr(pick(h, "Currency")));
                            that.oModelProyect.setProperty("/oCabecera/sMoneda", toStr(pick(h, "Currency")));
                            that.oModelProyect.setProperty("/oCabecera/sFormCondicionPagoOrder", toStr(pick(h, "PaymentTerms", "Paymentterms")));
                            that.oModelProyect.setProperty("/oCabecera/sFormCondicionPagoOrderDescrip", toStr(pick(h, "PaymentTermsDescription", "PaymentTermsDescription")));
                            that.oModelProyect.setProperty("/oCabecera/sCompany", sCompany);
                            that.oModelProyect.setProperty("/oCabecera/Company", sCompany);
                            that.oModelProyect.setProperty("/oCabecera/sRuc", sSupplier);
                            that.oModelProyect.setProperty("/oCabecera/sFormImporteFactura", toStr(pick(h, "InvoiceAmount", "Invoiceamount")));

                            const sStatusRaw = toStr(pick(h, "Status"));
                            const sStatus = formatter._normalizeStatusCode(sStatusRaw) || "01";

                            let sStatusDesc = "";
                            if (typeof that._getStatusDescFromCatalog === "function") {
                                sStatusDesc = that._getStatusDescFromCatalog(sStatus);
                            }
                            if (!sStatusDesc) {
                                if (sStatus === "01") sStatusDesc = "Registrado";
                                else if (sStatus === "02") sStatusDesc = "Facturado";
                                else if (sStatus === "03") sStatusDesc = "Aprobado";
                                else if (sStatus === "04") sStatusDesc = "Contabilizado";
                            }

                            if (typeof that._setEstadoUI === "function") {
                                that._setEstadoUI(sStatus, sStatusDesc);
                            } else {
                                that.oModelProyect.setProperty("/oCabecera/sEstadoCodigo", sStatus);
                                that.oModelProyect.setProperty("/oCabecera/sEstadoDescripcion", sStatusDesc);
                                that.oModelProyect.setProperty("/oCabecera/sFormEstadoRegistro", sStatusDesc);
                            }

                            that.oModelProyect.setProperty("/oCabecera/sFormFechaFactura",
                                formatter.toDDMMYYYYFromOData(pick(h, "InvoiceDate", "Invoicedate"))
                            );
                            that.oModelProyect.setProperty("/oCabecera/sFormFechaBase",
                                formatter.toDDMMYYYYFromOData(pick(h, "BaseDate", "Basedate"))
                            );
                            const sAccDate = formatter.toDDMMYYYYFromOData(pick(h, "AccountingDate", "Accountingdate"));

                            that.oModelProyect.setProperty(
                                "/oCabecera/sFormFechaContabilizacion",
                                sAccDate || ""
                            );

                            that.oModelProyect.setProperty("/oCabecera/bFormEditable", false);

                            const gasAdic = pick(h, "GasAdicional", "GasAdic", "GasAdi", "Gasadicional");
                            const gasOrg = pick(h, "GasOrigen", "GasOrg", "Gasorigen");
                            const flete = pick(h, "FleIntern", "FleteInternacional", "Flete", "Fleintern");
                            const seguro = pick(h, "Seguro");

                            that.oModelProyect.setProperty("/sDetalleGastosAdicionales", toStr(gasAdic) || "0.00");
                            that.oModelProyect.setProperty("/sDetalleGastoOrigen", toStr(gasOrg) || "0.00");
                            that.oModelProyect.setProperty("/sDetalleFleteInternacional", toStr(flete) || "0.00");
                            that.oModelProyect.setProperty("/sDetalleSeguro", toStr(seguro) || "0.00");

                            const aDetRaw = (h.to_RegFacExtDet && h.to_RegFacExtDet.results) ? h.to_RegFacExtDet.results : [];
                            const aDet = aDetRaw.map(r => ({
                                Ebeln: toStr(pick(r, "PurchaseDocument", "Purchasedocument")),
                                Ebelp: toStr(pick(r, "PurchasedocumentItem", "Purchasedocumentitem")),
                                Material: toStr(pick(r, "Mterial", "Material")),
                                Description: toStr(pick(r, "MaterialDescription", "Maktx")),
                                Orderquantity: toStr(pick(r, "Quantity")),
                                OrderquantityMax: (pick(r, "OrderquantityMax") !== "" ? toNum(pick(r, "OrderquantityMax")) : ""),
                                Um: toStr(pick(r, "QuantityBaseunit", "QuantityBaseunit")),
                                Unitprice: toNum(pick(r, "UnitPrice", "Unitprice")),
                                Waers: toStr(pick(r, "Currency")) || toStr(pick(h, "Currency")),
                                Subtotal: toNum(pick(r, "TotalAmount", "Totalamount"))
                            }));

                            that.oModelProyect.setProperty("/oDetalle", aDet);
                            that.oModelProyect.setProperty("/oDetalleTotal", aDet);

                            const aOCsFromDet = Array.from(new Set((aDet || [])
                                .map(it => String(it?.Ebeln || "").trim())
                                .filter(Boolean)
                            ));

                            Promise.all([
                                that._loadAndApplyItemMaxByOrders(aOCsFromDet),
                                that._loadAndApplyConditionsByOrders(aOCsFromDet),
                                that._loadOrdenesAndApplyViajeByOCs(aOCsFromDet)
                            ]).then(function () {
                                if (typeof that._onCalculator === "function") {
                                    that._onCalculator();
                                }
                            });

                            const aVia = (h.to_DatVia && h.to_DatVia.results) ? h.to_DatVia.results : [];
                            const v0 = aVia.length ? aVia[0] : null;

                            if (v0) {
                                const sModalSrv = toStr(pick(v0, "Modalidad", "Modal"));
                                const sModalKey = that._resolveKeyFromCatalog(aModalidad, sModalSrv, "sKey", "sText");
                                that.oModelProyect.setProperty("/jDatosViaje/cbModalidad", sModalKey);

                                that.oModelProyect.setProperty("/jDatosViaje/sViajeNave", toStr(pick(v0, "NaveVuelo", "Navevuelo")));
                                that.oModelProyect.setProperty("/jDatosViaje/sViajeNumBL", toStr(pick(v0, "NroBlAwb", "Nroblawb")));
                                that.oModelProyect.setProperty("/jDatosViaje/cbTipoEmision", toStr(pick(v0, "TipoEmision", "Tipoemision")));

                                const sPaisEmbSrv = toStr(pick(v0, "PaisEmb", "Paisemb"));
                                const sPaisEmbKey = that._resolveKeyFromCatalog(aPaises, sPaisEmbSrv, "sKey", "sText");
                                that.oModelProyect.setProperty("/jDatosViaje/sPaisEmbarque", sPaisEmbKey);

                                const sPuertoEmbSrv = toStr(pick(v0, "PuertoEmb", "Puertoemb"));
                                const sPuertoEmbKey = that._resolveKeyFromCatalog(aPuertos, sPuertoEmbSrv, "sKey", "sText");
                                that.oModelProyect.setProperty("/jDatosViaje/sPuertaEmbarque", sPuertoEmbKey);

                                const sPaisDestSrv = toStr(pick(v0, "PaisDest", "Paisdest"));
                                const sPaisDestKey = that._resolveKeyFromCatalog(aPaises, sPaisDestSrv, "sKey", "sText");
                                that.oModelProyect.setProperty("/jDatosViaje/sPaisDesembarque", sPaisDestKey);

                                const sPuertoDestSrv = toStr(pick(v0, "PuertoDest", "Puertodest"));
                                const sPuertoDestKey = that._resolveKeyFromCatalog(aPuertos, sPuertoDestSrv, "sKey", "sText");
                                that.oModelProyect.setProperty("/jDatosViaje/sPuertaDesembarque", sPuertoDestKey);

                                if (typeof that._applyPortFiltersFromModel === "function") {
                                    that._applyPortFiltersFromModel();
                                } else if (typeof that._filterPortsByCountryPrefix === "function") {
                                    const sPaisDes = String(that.oModelProyect.getProperty("/jDatosViaje/sPaisDesembarque") || "").trim().toUpperCase();
                                    that._filterPortsByCountryPrefix(sPaisDes, false);
                                }
                                if (typeof that._applyDefaultDesembarquePE === "function") {
                                    that._applyDefaultDesembarquePE();
                                }

                                that.oModelProyect.setProperty("/jDatosViaje/sFechaETD",
                                    formatter.toDDMMYYYYFromOData(pick(v0, "FechaEtd", "FechaETD"))
                                );
                                that.oModelProyect.setProperty("/jDatosViaje/sFechaETA",
                                    formatter.toDDMMYYYYFromOData(pick(v0, "FechaETA", "FechaEta"))
                                );

                            } else {
                                if (typeof that._applyPortFiltersFromModel === "function") {
                                    that._applyPortFiltersFromModel();
                                }
                                if (typeof that._applyDefaultDesembarquePE === "function") {
                                    that._applyDefaultDesembarquePE();
                                }
                            }

                            const aCar = (h.to_DatCar && h.to_DatCar.results) ? h.to_DatCar.results : [];

                            const hasBultoReal = function (b) {
                                const qBulto = toStr(pick(b, "CantBulto", "Cantbulto", "CantBultop"));
                                const tipoBulto = toStr(pick(b, "TipoBulto", "Tipobulto", "TipoBultop"));
                                const kgs = toStr(pick(b, "Kgs", "KGS"));
                                const cms = toStr(pick(b, "Cms", "CMS"));
                                const cw = toStr(pick(b, "Cw", "CW"));

                                return !!tipoBulto ||
                                    toNum(qBulto) > 0 ||
                                    toNum(kgs) > 0 ||
                                    toNum(cms) > 0 ||
                                    toNum(cw) > 0;
                            };

                            const aBultos = aCar
                                .filter(hasBultoReal)
                                .map((b, idx) => ({
                                    key: idx + 1,
                                    nBulto: parseInt(pick(b, "PosBultop", "Posbulto", "PosBulto"), 10) || (idx + 1),
                                    qBulto: toStr(pick(b, "CantBulto", "Cantbulto", "CantBultop")),
                                    tipoBulto: toStr(pick(b, "TipoBulto", "Tipobulto", "TipoBultop")),
                                    desctipoBulto: "",
                                    pesoBulto: toStr(pick(b, "Kgs", "KGS")),
                                    longitudBulto: toStr(pick(b, "Cms", "CMS")),
                                    anchoBulto: toStr(pick(b, "Ancho", "AnchoCm")),
                                    alturaBulto: toStr(pick(b, "Altura", "AlturaCm")),
                                    cwBulto: toStr(pick(b, "Cw", "CW"))
                                }));

                            let aContenido = [];
                            if (aCar.length) {
                                const c0 = aCar[0];

                                const q1 = toStr(pick(c0, "ContainerQuantity", "Qcontenedor", "QContenedor"));
                                const t1 = toStr(pick(c0, "TipoContenedor", "Tipocontenedor", "TipoCont"));

                                const q2 = toStr(pick(c0, "ContainerQuantity2", "Qcontenedor2", "QContenedor2"));
                                const t2 = toStr(pick(c0, "TipoContenedor2", "Tipocontenedor2", "TipoCont2"));

                                const hasValue = (q, t) => {
                                    const nq = toNum(q);
                                    const qt = String(q || "").trim();
                                    const tt = String(t || "").trim();
                                    return (tt !== "") || (qt !== "" && nq > 0);
                                };

                                if (hasValue(q1, t1)) {
                                    aContenido.push({
                                        key: 1,
                                        nContenido: 1,
                                        qContenido: q1,
                                        tipoContenido: t1,
                                        descContenido: ""
                                    });
                                }

                                if (hasValue(q2, t2)) {
                                    aContenido.push({
                                        key: 2,
                                        nContenido: 2,
                                        qContenido: q2,
                                        tipoContenido: t2,
                                        descContenido: ""
                                    });
                                }
                            }

                            that.oModelProyect.setProperty("/jDatosCarga/oBultos", aBultos);
                            that.oModelProyect.setProperty("/jDatosCarga/oContenido", aContenido);

                            if (typeof that._onCalculator === "function") that._onCalculator();

                            that.oModelData.refresh(true);
                            that.oModelProyect.refresh(true);
                            that.oModelProyect.updateBindings(true);
                            that.oModelData.updateBindings(true);

                            if (typeof that._persistStateByIdSap === "function") {
                                that._persistStateByIdSap(sIdSap);
                            }

                            try {
                                await that._loadSharePointDocsByIdSap(sIdSap);
                            } catch (e) { /* no bloquear la carga por docs */ }

                            sap.ui.core.BusyIndicator.hide(0);
                        },
                        error: function (msg) {
                            sap.ui.core.BusyIndicator.hide(0);
                            that.getMessageBox("error", "Error consultando DatFacExt por IDSAP.");
                        }
                    });
                });

            }).catch((e) => {
                sap.ui.core.BusyIndicator.hide(0);
                that.getMessageBox("error", "Error cargando catálogos para la vista.");
            });
        },
        // Para el estado 
        _postFacturaExteriorConStatus: function (sStatus) {
            const that = this;

            try {
                const sCode = formatter._normalizeStatusCode(sStatus);
                if (!sCode) {
                    that.getMessageBox("error", "Status inválido para enviar.");
                    return Promise.reject("Status inválido");
                }
                that.oModelData = that.getModel("oModelData");
                const aStatus = that.oModelData.getProperty("/oStatusOrder") || [];
                const pEnsureStatusCat = (Array.isArray(aStatus) && aStatus.length)
                    ? Promise.resolve(aStatus)
                    : that._getStatusOrder("").then((r) => {
                        const arr = (r && (r.oResults || r.results || (r.d && r.d.results))) || [];
                        that.oModelData.setProperty("/oStatusOrder", arr);
                        return arr;
                    });
                that._applyAccountingDateByStatus(sCode);

                const oPayload = that._buildPayloadRegFacExt();
                oPayload.Status = sCode;
                if (!String(oPayload.IdSap || "").trim()) {
                    that.getMessageBox("error", "IdSap vacío. No se puede actualizar estado.");
                    return Promise.reject("IdSap vacío");
                }
                const oModel = that.getOwnerComponent().getModel("oModelEntity");
                if (!oModel || !oModel.create) {
                    that.getMessageBox("error", "No existe el modelo 'oModelEntity' o no es un ODataModel.");
                    return Promise.reject("oModelEntity inválido");
                }

                sap.ui.core.BusyIndicator.show(0);

                return pEnsureStatusCat.then(() => {
                    return new Promise((resolve, reject) => {
                        oModel.create("/RegFacExtSet", oPayload, {
                            success: function (oResp) {
                                sap.ui.core.BusyIndicator.hide(0);
                                const sDesc = that._getStatusDescFromCatalog(sCode) || "";
                                that._setEstadoUI(sCode, sDesc);
                                const sIdSap = String(that.getModel("oModelProyect").getProperty("/appContext/sIdSap") || oPayload.IdSap || "").trim();
                                if (sIdSap && typeof that._persistStateByIdSap === "function") {
                                    that._persistStateByIdSap(sIdSap);
                                }

                                resolve(oResp);
                            },
                            error: function (e) {
                                sap.ui.core.BusyIndicator.hide(0);
                                that.getMessageBox("error", "Error al enviar a SAP (actualización de estado).");
                                reject(e);
                            }
                        });
                    });
                });

            } catch (e) {
                sap.ui.core.BusyIndicator.hide(0);
                that.getMessageBox("error", "Error preparando POST con Status.");
                return Promise.reject(e);
            }
        },
        // Para Proveedor
        _onPressGenerarFactura: async function () {
            const that = this;
            const sStatus = "02";

            const sCurr = formatter._normalizeStatusCode(
                that.oModelProyect.getProperty("/oCabecera/sEstadoCodigo")
            );

            if (sCurr === "02" || sCurr === "03" || sCurr === "04") {
                that.getMessageBox(
                    "warning",
                    "La factura ya fue procesada. Estado actual: " +
                    (that.oModelProyect.getProperty("/oCabecera/sFormEstadoRegistro") || sCurr)
                );
                return;
            }
            const bDocOk = await this._validateFacturaComercial1BeforeFacturar();
            if (!bDocOk) return;
            const bReqViaje = !!that.oModelProyect.getProperty("/req/bViajeRequired");

            if (bReqViaje) {
                const v = that.oModelProyect.getProperty("/jDatosViaje") || {};
                const bViajeCamposOK =
                    !that.isEmpty(v.cbModalidad) &&
                    !that.isEmpty(v.sViajeNave) &&
                    !that.isEmpty(v.sViajeNumBL) &&
                    !that.isEmpty(v.cbTipoEmision) &&
                    !that.isEmpty(v.sPaisEmbarque) &&
                    !that.isEmpty(v.sPuertaEmbarque) &&
                    !that.isEmpty(v.sFechaETD) &&
                    !that.isEmpty(v.sFechaETA);

                if (!bViajeCamposOK) {
                    sap.m.MessageBox.error(
                        "Para esta(s) orden(es) (Incoterm: " +
                        ((that.oModelProyect.getProperty("/req/aIncoterms") || []).join(", ") || "N/D") +
                        ") es obligatorio completar y guardar los Datos de Viaje."
                    );
                    return;
                }
            }

            that._postFacturaExteriorConStatus(sStatus)
                .then(() => {
                    that.getMessageBox(
                        "success",
                        "Su factura del exterior se generó correctamente con el siguiente número de registro: " +
                        String(
                            that.oModelProyect.getProperty("/appContext/sIdSap") ||
                            that.oModelProyect.getProperty("/oCabecera/IdSap") || ""
                        ).trim()
                    );
                })
                .catch(() => {
                    that.getMessageBox("warning", "Ocurrió un error al enviar a Facturar.");
                });
        },

        // Para Comex
        _onPressGenerarComex: function () {
            const that = this;

            const oMU = that.getOwnerComponent().getModel("oModelUser");
            const bIsComex = !!oMU?.getProperty("/bIsIntComex");

            const sStatus = "03";
            const sCurr = formatter._normalizeStatusCode(
                that.oModelProyect.getProperty("/oCabecera/sEstadoCodigo")
            );

            if (!bIsComex) {
                that.getMessageBox("error", "No tiene permisos para marcar Revisado Comex.");
                return;
            }

            if (sCurr !== "02") {
                that.getMessageBox(
                    "warning",
                    "Para enviar a Comex, el estado debe ser 'Facturado'. Estado actual: " +
                    (that.oModelProyect.getProperty("/oCabecera/sFormEstadoRegistro") || sCurr)
                );
                return;
            }

            that._postFacturaExteriorConStatus(sStatus)
                .then(() => that.getMessageBox("success", "La solicitud de Facturación fue Aprobada."))
                .catch(() => that.getMessageBox("warning", "Ocurrió un error al realizar envío Comex."));
        },

        //filtro para los puertos y paises 
        _filterPortsByCountryPrefix: function (sCountry, bIsEmb) {
            const oMD = that.getModel("oModelData");
            if (!oMD) return [];

            const aAllPorts = oMD.getProperty("/oPuertosEmbDes") || [];
            const sPref = String(sCountry || "").trim().toUpperCase();
            if (!sPref) {
                const sPathNo = bIsEmb ? "/oPuertosEmbEmb" : "/oPuertosEmbDesFil";
                oMD.setProperty(sPathNo, aAllPorts.slice());
                return aAllPorts;
            }

            const aFiltered = aAllPorts.filter(p => {
                const k = String(p?.sKey || "").toUpperCase();
                return k.startsWith(sPref);
            });

            const sTargetPath = bIsEmb ? "/oPuertosEmbEmb" : "/oPuertosEmbDesFil";
            oMD.setProperty(sTargetPath, aFiltered);
            return aFiltered;
        },
        _portExistsInList: function (aPorts, sKey) {
            const k = String(sKey || "").trim().toUpperCase();
            return (aPorts || []).some(p => String(p?.sKey || "").trim().toUpperCase() === k);
        },
        _applyDefaultDesembarquePE: function () {
            const oMP = that.getModel("oModelProyect");
            const oMD = that.getModel("oModelData");
            if (!oMP || !oMD) return;
            let sPaisDes = String(oMP.getProperty("/jDatosViaje/sPaisDesembarque") || "").trim().toUpperCase();
            if (!sPaisDes) {
                sPaisDes = "PE";
                oMP.setProperty("/jDatosViaje/sPaisDesembarque", sPaisDes);
            }
            that._filterPortsByCountryPrefix(sPaisDes, false);
            const aPortsDes = oMD.getProperty("/oPuertosEmbDesFil") || [];

            const sDefaultPort = "PECALLAO";
            const sPuertoDesCurr = String(oMP.getProperty("/jDatosViaje/sPuertaDesembarque") || "").trim().toUpperCase();

            if (!sPuertoDesCurr || !that._portExistsInList(aPortsDes, sPuertoDesCurr)) {
                if (that._portExistsInList(aPortsDes, sDefaultPort)) {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", sDefaultPort);
                } else if (aPortsDes.length) {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", aPortsDes[0].sKey);
                } else {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", "");
                }
            }
        },
        _applyPortFiltersFromModel: function () {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;
            const sPaisEmb = String(oMP.getProperty("/jDatosViaje/sPaisEmbarque") || "").trim().toUpperCase();
            const sPaisDes = String(oMP.getProperty("/jDatosViaje/sPaisDesembarque") || "").trim().toUpperCase();
            that._filterPortsByCountryPrefix(sPaisEmb, true);
            that._filterPortsByCountryPrefix(sPaisDes, false);
        },
        onChangePaisEmbarque: function (oEvent) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;
            const sKey = String(oEvent.getSource().getSelectedKey() || "").trim().toUpperCase();
            oMP.setProperty("/jDatosViaje/sPaisEmbarque", sKey);
            const aPortsEmb = that._filterPortsByCountryPrefix(sKey, true);
            const sPuertoCurr = String(oMP.getProperty("/jDatosViaje/sPuertaEmbarque") || "").trim().toUpperCase();
            if (!that._portExistsInList(aPortsEmb, sPuertoCurr)) {
                oMP.setProperty("/jDatosViaje/sPuertaEmbarque", "");
            }
            // Si quedó vacío y hay puertos, selecciona el primero (sin forzar Callao)
            const sNow = String(oMP.getProperty("/jDatosViaje/sPuertaEmbarque") || "").trim();
            if (!sNow && aPortsEmb.length) {
                oMP.setProperty("/jDatosViaje/sPuertaEmbarque", aPortsEmb[0].sKey);
            }
        },
        onChangePaisDesembarque: function (oEvent) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return;

            const sKey = String(oEvent.getSource().getSelectedKey() || "").trim().toUpperCase();
            oMP.setProperty("/jDatosViaje/sPaisDesembarque", sKey);

            const aPortsDes = that._filterPortsByCountryPrefix(sKey, false);

            const sDefaultPort = "PECALLAO";
            const sPuertoCurr = String(oMP.getProperty("/jDatosViaje/sPuertaDesembarque") || "").trim().toUpperCase();

            if (!that._portExistsInList(aPortsDes, sPuertoCurr)) {
                oMP.setProperty("/jDatosViaje/sPuertaDesembarque", "");
            }

            if (sKey === "PE") {
                if (that._portExistsInList(aPortsDes, sDefaultPort)) {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", sDefaultPort);
                } else if (aPortsDes.length) {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", aPortsDes[0].sKey);
                } else {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", "");
                }
            } else {
                const sNow = String(oMP.getProperty("/jDatosViaje/sPuertaDesembarque") || "").trim();
                if (!sNow && aPortsDes.length) {
                    oMP.setProperty("/jDatosViaje/sPuertaDesembarque", aPortsDes[0].sKey);
                }
            }
        },
        onOnlyMeasure: function (oEvent) {
            const oInput = oEvent.getSource();

            const sRaw = (oEvent.getParameter("newValue")
                ?? oEvent.getParameter("value")
                ?? oInput.getValue()
                ?? "");

            const sNormalized = String(sRaw).replace(/[×✕✖✗]/g, "x");
            const sFiltered = sNormalized.replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\sxX]/g, "");

            if (sFiltered !== sRaw) {
                oInput.setValue(sFiltered);
            }

            const sCompact = sFiltered.replace(/\s+/g, "");
            const bOk = sCompact === "" || /^(\d+)(x\d+){0,2}$/i.test(sCompact);

            if (!bOk) {
                oInput.setValueState("Warning");
                oInput.setValueStateText("Formato permitido: 10x20x30 (usa 'x' entre números).");
            } else {
                oInput.setValueState("None");
                oInput.setValueStateText("");
            }
        },
        _getPreviewDialog: function () {
            if (this._oPreviewDialog) return this._oPreviewDialog;

            const that = this;
            this._oPreviewHtml = new sap.ui.core.HTML({
                sanitizeContent: true,
                content: "<div style='width:100%;height:100%'></div>"
            });

            this._oPreviewDialog = new sap.m.Dialog({
                title: "Previsualización",
                contentWidth: "80vw",
                contentHeight: "80vh",
                resizable: true,
                draggable: true,
                verticalScrolling: false,
                horizontalScrolling: false,
                content: [this._oPreviewHtml],
                beginButton: new sap.m.Button({
                    text: "Abrir en pestaña",
                    icon: "sap-icon://action",
                    press: function () {
                        const sUrl = that._sLastPreviewUrl || "";
                        if (sUrl) {
                            sap.m.URLHelper.redirect(sUrl, true);
                        } else {
                            sap.m.MessageToast.show("No hay URL.");
                        }
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Cerrar",
                    icon: "sap-icon://decline",
                    press: function () {
                        that._oPreviewDialog.close();
                    }
                }),
                afterClose: function () {
                    that._setPreviewIframeUrl("");
                }
            });
            this.getView().addDependent(this._oPreviewDialog);

            return this._oPreviewDialog;
        },
        _setPreviewIframeUrl: function (sUrl) {
            const safeUrl = String(sUrl || "").trim();
            this._sLastPreviewUrl = safeUrl;
            const sHtml = safeUrl
                ? `<iframe
                        src="${encodeURI(safeUrl)}"
                        style="width:100%;height:100%;border:0;"
                        allow="clipboard-read; clipboard-write; fullscreen"
                    ></iframe>`
                : "<div style='padding:1rem;'>Sin documento para mostrar.</div>";

            if (this._oPreviewHtml) {
                this._oPreviewHtml.setContent(sHtml);
            }
        },
        onDocSelectionChange: async function (oEvent) {
            const oUC = oEvent.getSource();
            const oItem = oEvent.getParameter("selectedItem")
                || (oEvent.getParameter("selectedItems") || [])[0];

            if (!oItem) return;
            if (oUC && typeof oUC.removeSelections === "function") {
                oUC.removeSelections(true);
            }

            const oCtx = oItem.getBindingContext("oModelProyect");
            const oDoc = oCtx ? oCtx.getObject() : null;
            if (!oDoc) return;

            try {
                sap.ui.core.BusyIndicator.show(0);

                let sUrl = "";
                if (oDoc.uploaded === true && oDoc.spId) {
                    sUrl = await this._getSharePointPreviewUrlByItemId(oDoc.spId);
                }
                if (!sUrl) {
                    sUrl = (oDoc.previewUrl || oDoc.url || "").trim();
                }
                if (!sUrl) {
                    sap.m.MessageToast.show("No hay URL para previsualizar este documento.");
                    return;
                }
                const oDlg = this._getPreviewDialog();
                this._setPreviewIframeUrl(sUrl);
                oDlg.open();

            } catch (e) {
                sap.m.MessageToast.show("No se pudo generar la previsualización (Graph/SharePoint).");
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },
        _hasFacturaComercial1: function (aDocs) {
            const norm = (v) => String(v || "")
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .toUpperCase().trim();

            return (aDocs || []).some(d => {
                const sName = norm(d?.fileName || d?.originalFileName || "");
                const sTipo = norm(d?.tipoText || d?.tipoKey || "");
                if (sName.includes("FACTURA COMERCIAL 1")) return true;
                if (sTipo.includes("FACTURA COMERCIAL") && (sTipo.startsWith("1") || sTipo.includes(" 1"))) return true;
                if (sName.includes("FACTURA COMERCIAL") && (sName.startsWith("1 -") || sName.startsWith("1-"))) return true;

                return false;
            });
        },
        _validateFacturaComercial1BeforeFacturar: async function () {
            const oMP = this.getModel("oModelProyect");

            const sIdSap = String(
                oMP.getProperty("/appContext/sIdSap") ||
                oMP.getProperty("/oCabecera/IdSap") || ""
            ).trim();
            if (!sIdSap) {
                sap.m.MessageBox.error("Primero debe guardar/enviar para generar el IDSAP antes de facturar.");
                return false;
            }
            try {
                await this._loadSharePointDocsByIdSap(sIdSap);
            } catch (e) {
                const sCode = e?.responseJSON?.error?.code || e?.error?.code || e?.code || "";
                if (String(sCode).toLowerCase() === "itemnotfound") {
                    oMP.setProperty("/documentos", []);
                } else {
                    sap.m.MessageBox.error("No se pudo validar documentos en SharePoint. Intente nuevamente.");
                    return false;
                }
            }
            const aDocs = oMP.getProperty("/documentos") || [];

            const bOk = this._hasFacturaComercial1(aDocs);
            if (!bOk) {
                sap.m.MessageBox.error(
                    "Falta adjuntar el documento obligatorio:\n\n1 - Factura Comercial 1\n\nAdjúntelo en 'Adjuntar Documentos' para poder facturar."
                );
                return false;
            }

            return true;
        },

        _onPressGuardaCarga: function (oEvent) {
            this._onPressConfirmCarga(oEvent);
            this._onPressClose(oEvent);
        },

        _onPressGuardaViaje: function (oEvent) {
            this._onPressConfirmViaje(oEvent);
            this._onPressClose(oEvent);
        },
        _toNumCondAmount: function (v) {
            let s = String(v ?? "").trim();

            if (!s) {
                return 0;
            }

            s = s.replace(/\s/g, "");

            const hasComma = s.includes(",");
            const hasDot = s.includes(".");

            if (hasComma && hasDot) {
                s = s.replace(/,/g, "");
            } else if (hasComma && !hasDot) {
                s = s.replace(/,/g, ".");
            }

            s = s.replace(/[^0-9.\-]/g, "");

            const n = parseFloat(s);
            return isNaN(n) ? 0 : n;
        },

        _formatAmount2: function (n) {
            const x = Number(n) || 0;
            return formatter._round2
                ? formatter._round2(x).toFixed(2)
                : (Math.round((x + Number.EPSILON) * 100) / 100).toFixed(2);
        },

        _getPendingConditionAmount: function (aCond, sClass) {
            const mByCondDoc = {};

            (aCond || [])
                .filter(c => String(c?.ConditionClass || "").trim() === sClass)
                .forEach((c) => {
                    const sSalesDocument = String(
                        c?.SalesDocument ??
                        c?.PurchaseOrder ??
                        c?.Ebeln ??
                        ""
                    ).trim();

                    const sNumberConditionDocument = String(
                        c?.NumberConditionDocument ??
                        c?.ConditionDocument ??
                        c?.ConditionRecord ??
                        ""
                    ).trim();

                    // El nuevo servicio devuelve una línea por posición.
                    // TotalAmount sí debe sumarse por línea; UsedAmount viene repetido
                    // para el mismo documento de condición y solo debe descontarse una vez.
                    const sKey = [sSalesDocument, sNumberConditionDocument, sClass].join("|");

                    if (!mByCondDoc[sKey]) {
                        mByCondDoc[sKey] = {
                            total: 0,
                            used: 0,
                            usedSet: false
                        };
                    }

                    mByCondDoc[sKey].total += this._toNumCondAmount(
                        c.TotalAmount ??
                        c.Totalamount ??
                        c.TOTALAMOUNT
                    );

                    const nUsed = Math.abs(this._toNumCondAmount(
                        c.UsedAmount ??
                        c.Usedamount ??
                        c.USEDAMOUNT
                    ));

                    if (!mByCondDoc[sKey].usedSet || nUsed > mByCondDoc[sKey].used) {
                        mByCondDoc[sKey].used = nUsed;
                        mByCondDoc[sKey].usedSet = true;
                    }
                });

            return Object.keys(mByCondDoc).reduce((sum, sKey) => {
                const oCond = mByCondDoc[sKey];
                const nPending = oCond.total - oCond.used;
                return sum + (nPending > 0 ? nPending : 0);
            }, 0);
        },
        _applyPendingConditionsFromPOCondition: function (aCond) {
            const oMP = this.getModel("oModelProyect");
            if (!oMP) {
                return;
            }

            this._ensureCondModel();

            const nOrigen = this._getPendingConditionAmount(aCond, "ZI03");
            const nFlete = this._getPendingConditionAmount(aCond, "ZI04");
            const nSeguro = this._getPendingConditionAmount(aCond, "ZI05");

            const pickDesc = function (sClass, sFallback) {
                const o = (aCond || []).find(x => String(x?.ConditionClass || "").trim() === sClass);
                const s = o ? String(o.ConditionDescription || "").trim() : "";
                return s || sFallback || "";
            };

            // Se muestra solo lo pendiente. Si ya no queda saldo, se oculta.
            oMP.setProperty("/cond/bShowOrigen", nOrigen > 0);
            oMP.setProperty("/cond/bShowFlete", nFlete > 0);
            oMP.setProperty("/cond/bShowSeguro", nSeguro > 0);

            oMP.setProperty("/cond/sDescOrigen", pickDesc("ZI03", "Gasto Origen"));
            oMP.setProperty("/cond/sDescFlete", pickDesc("ZI04", "Flete Internacional"));
            oMP.setProperty("/cond/sDescSeguro", pickDesc("ZI05", "Seguro"));
            oMP.setProperty("/cond/nMaxOrigen", nOrigen > 0 ? this._formatAmount2(nOrigen) : "");
            oMP.setProperty("/cond/nMaxFlete", nFlete > 0 ? this._formatAmount2(nFlete) : "");
            oMP.setProperty("/cond/nMaxSeguro", nSeguro > 0 ? this._formatAmount2(nSeguro) : "");

            oMP.setProperty("/sDetalleGastoOrigen", this._formatAmount2(nOrigen));
            oMP.setProperty("/sDetalleFleteInternacional", this._formatAmount2(nFlete));
            oMP.setProperty("/sDetalleSeguro", this._formatAmount2(nSeguro));

            if (typeof this._onCalculator === "function") {
                this._onCalculator();
            }
        },
        _getTodayDDMMYYYYPeru: function () {
            if (formatter.getDDMMYYYYPeru) {
                return formatter.getDDMMYYYYPeru();
            }

            const oParts = new Intl.DateTimeFormat("es-PE", {
                timeZone: "America/Lima",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }).formatToParts(new Date());

            const dd = oParts.find(p => p.type === "day")?.value || "";
            const mm = oParts.find(p => p.type === "month")?.value || "";
            const yyyy = oParts.find(p => p.type === "year")?.value || "";

            return `${dd}/${mm}/${yyyy}`;
        },

        _applyAccountingDateByStatus: function (sTargetStatus) {
            const oMP = this.getModel("oModelProyect") || this.oModelProyect;
            if (!oMP) {
                return "";
            }

            const sCurr = formatter._normalizeStatusCode(
                oMP.getProperty("/oCabecera/sEstadoCodigo")
            ) || "";

            const sTarget = formatter._normalizeStatusCode(sTargetStatus || sCurr) || "";

            const sActual = formatter.normalizeToDDMMYYYY
                ? formatter.normalizeToDDMMYYYY(oMP.getProperty("/oCabecera/sFormFechaContabilizacion"))
                : String(oMP.getProperty("/oCabecera/sFormFechaContabilizacion") || "").trim();

            const sToday = this._getTodayDDMMYYYYPeru();

            let sFinal = sActual;

            switch (sTarget) {
                case "01":
                    // Registrado:
                    // Si es nuevo registro, toma hoy.
                    // Si se modifica después, conserva la fecha original.
                    sFinal = sActual || sToday;
                    break;

                case "02":
                    // Facturado:
                    // Cuando pasa a Facturado, toma hoy.
                    // Si ya estaba Facturado y solo se edita, conserva fecha.
                    if (sCurr !== "02" && sCurr !== "03" && sCurr !== "04") {
                        sFinal = sToday;
                    } else {
                        sFinal = sActual || sToday;
                    }
                    break;

                case "03":
                    // Aprobado:
                    // Cuando pasa a Aprobado, toma hoy.
                    // Esta será la fecha final para SAP.
                    if (sCurr !== "03" && sCurr !== "04") {
                        sFinal = sToday;
                    } else {
                        sFinal = sActual || sToday;
                    }
                    break;

                case "04":
                    // Contabilizado:
                    // Debe conservar la fecha de aprobación.
                    sFinal = sActual || sToday;
                    break;

                default:
                    sFinal = sActual || sToday;
                    break;
            }

            oMP.setProperty("/oCabecera/sFormFechaContabilizacion", sFinal);
            return sFinal;
        },
        _getPendingAvailableQtyDetail: function (oItem) {
            const _toNum = function (v) {
                let s = String(v ?? "").trim();
                if (!s) return 0;

                s = s.replace(/\s/g, "");

                const bHasComma = s.includes(",");
                const bHasDot = s.includes(".");

                if (bHasComma && bHasDot) {
                    s = s.replace(/,/g, "");
                } else if (bHasComma && !bHasDot) {
                    s = s.replace(/,/g, ".");
                }

                s = s.replace(/[^0-9.\-]/g, "");

                const n = parseFloat(s);
                return isNaN(n) ? 0 : n;
            };

            const _round3 = function (n) {
                const x = Number(n) || 0;
                return Math.round((x + Number.EPSILON) * 1000) / 1000;
            };

            const nOrderQty = _toNum(oItem.Orderquantity ?? oItem.OrderQuantity);
            const nPendingRaw = _toNum(oItem.Pendingamount ?? oItem.PendingAmount);

            let nCanPen = 0;

            if (nPendingRaw > 0) {
                nCanPen = nPendingRaw;
            } else if (nPendingRaw < 0) {
                nCanPen = nOrderQty - Math.abs(nPendingRaw);
            } else {
                nCanPen = 0;
            }

            nCanPen = _round3(nCanPen);

            if (nCanPen < 0) {
                nCanPen = 0;
            }

            if (nOrderQty > 0 && nCanPen > nOrderQty) {
                nCanPen = nOrderQty;
            }

            return nCanPen;
        },

        _loadAndApplyItemMaxByOrders: function (aOrdenes) {
            const oMP = that.getModel("oModelProyect");
            if (!oMP) return Promise.resolve();

            const aOCs = Array.from(new Set((aOrdenes || [])
                .map(x => String(x || "").trim())
                .filter(Boolean)
            ));

            if (!aOCs.length) return Promise.resolve();

            const _esc = function (v) {
                return String(v ?? "").trim().replace(/'/g, "''");
            };

            let sFiltroEbeln = "";

            aOCs.forEach(function (sOrden, i) {
                const sPO = _esc(sOrden);
                if (!sPO) return;

                sFiltroEbeln += (i === 0)
                    ? "Ebeln eq '" + sPO + "' "
                    : "or Ebeln eq '" + sPO + "' ";
            });

            return that._getOrdenes(sFiltroEbeln).then(function (oResp) {
                const aCab = that._asResults(oResp?.oResults || oResp?.results || oResp?.d?.results);

                const mPendingByKey = {};

                aCab.forEach(function (oCab) {
                    const sPO = String(oCab.Ebeln || "").trim();
                    const aItems = that._asResults(oCab.toPurOrdItems);

                    aItems.forEach(function (oItem) {
                        const sPos = String(oItem.Ebelp || oItem.PurchaseOrderItem || "").trim();
                        const sKey = sPO + "|" + sPos;
                        mPendingByKey[sKey] = that._getPendingAvailableQtyDetail(oItem);
                    });
                });

                const aDetalle = oMP.getProperty("/oDetalle") || [];

                aDetalle.forEach(function (oRow) {
                    const sPO = String(oRow.Ebeln || "").trim();
                    const sPos = String(oRow.Ebelp || "").trim();
                    const sKey = sPO + "|" + sPos;

                    const nQtyActual = formatter._toNumUI(oRow.Orderquantity);
                    const nPendienteActual = formatter._toNumUI(mPendingByKey[sKey]);

                    /*
                        En edición:
                        máximo = cantidad guardada en este registro + saldo pendiente actual.
                        Así no se pierde el máximo aunque SAP ya haya descontado lo registrado.
                    */
                    const nMax = nQtyActual + nPendienteActual;

                    oRow.OrderquantityMax = nMax > 0 ? nMax : nQtyActual;
                });

                oMP.setProperty("/oDetalle", aDetalle);
                oMP.setProperty("/oDetalleTotal", aDetalle);

                if (typeof that._onCalculator === "function") {
                    that._onCalculator();
                }
            }).catch(function () {
                const aDetalle = oMP.getProperty("/oDetalle") || [];

                // Fallback seguro: si falla la consulta de OC, no permitir aumentar más de lo ya guardado.
                aDetalle.forEach(function (oRow) {
                    oRow.OrderquantityMax = formatter._toNumUI(oRow.Orderquantity);
                });

                oMP.setProperty("/oDetalle", aDetalle);
                oMP.setProperty("/oDetalleTotal", aDetalle);
            });
        },
        _validateDetalleQtyByMax: function () {
            const oMP = that.getModel("oModelProyect");
            const aDetalle = oMP.getProperty("/oDetalle") || [];

            for (let i = 0; i < aDetalle.length; i++) {
                const oRow = aDetalle[i];

                const nQty = formatter._toNumUI(oRow.Orderquantity);
                const vMaxRaw = oRow.OrderquantityMax;
                const bHasMax = vMaxRaw !== null &&
                    vMaxRaw !== undefined &&
                    String(vMaxRaw).trim() !== "";

                if (!bHasMax) {
                    continue;
                }

                const nMax = formatter._toNumUI(vMaxRaw);

                if (nQty > nMax) {
                    oRow.Orderquantity = nMax;

                    const nUnit = formatter._toNumUI(oRow.Unitprice);
                    let nBase = formatter._toNumUI(oRow.BaseQuantity);
                    if (!nBase || nBase <= 0) nBase = 1;

                    oRow.Subtotal = formatter._round2((nMax / nBase) * nUnit);

                    oMP.setProperty("/oDetalle/" + i, oRow);

                    that.getMessageBox(
                        "error",
                        "La cantidad de la posición " + (oRow.Ebelp || "") +
                        " no puede exceder la cantidad disponible por facturar: " + nMax
                    );

                    if (typeof that._onCalculator === "function") {
                        that._onCalculator();
                    }

                    return false;
                }
            }

            return true;
        },

    });
});