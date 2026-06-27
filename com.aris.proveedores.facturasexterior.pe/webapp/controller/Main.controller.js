
sap.ui.define([
    "com/aris/proveedores/facturaexterior/pe/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "com/aris/proveedores/facturaexterior/pe/model/models",
    "com/aris/proveedores/facturaexterior/pe/model/formatter",
    "com/aris/proveedores/facturaexterior/pe/services/Services",
    "com/aris/proveedores/facturaexterior/pe/util/util",
    "com/aris/proveedores/facturaexterior/pe/util/utilUI",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
], (BaseController, Controller, models, formatter, Services, util, utilUI, Filter, FilterOperator, Fragment, MessageToast, JSONModel) => {
    "use strict";
    var that;
    let FacXMl;

    return BaseController.extend("com.aris.proveedores.facturaexterior.pe.controller.Main", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Main").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdDocumentUpload = "frgIdDocumentUpload"
            this.frgIdFilterInit = "frgIdFilterInit";
        },
        handleRouteMatched: function (bInit) {
            if (typeof this._resetProyectOnlyFacturaContext === "function") {
                this._resetProyectOnlyFacturaContext();
            }
            sap.ui.core.BusyIndicator.show(0)
            Promise.all([
                that._getUsers(), that._getStatusOrder(""),
                that._getFilterFactExt()
            ]).then((values) => {
                that._setLanguageModel(that._getCurrentLanguageKey());
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");
                that.oModelProyect.setSizeLimit(99999999);
                that.oModelData.setSizeLimit(99999999);
                that._resetCatalogs();

                let oUser = values[0].Resources[0];
                const oUserProfile = that._applyProveedorUserProfile(oUser);

                let StateInit = values[1].oResults;
                const aStatesRaw =
                    (StateInit && StateInit.d && Array.isArray(StateInit.d.results)) ? StateInit.d.results :
                        (StateInit && Array.isArray(StateInit.results)) ? StateInit.results :
                            (Array.isArray(StateInit)) ? StateInit : [];

                const _normStatus = (v) => {
                    const s = String(v ?? "").trim();
                    if (!s) return "";
                    return (s.length === 1) ? s.padStart(2, "0") : s;
                };
                const aStatesNorm = (aStatesRaw || [])
                    .map(x => ({
                        Status: _normStatus(x?.Status),
                        StatusDescription: String(x?.StatusDescription ?? "").trim()
                    }))
                    .filter(x => !!x.Status);
                const mStatusByCode = {};
                aStatesNorm.forEach(x => {
                    if (x.Status) {
                        mStatusByCode[x.Status] = x.StatusDescription || x.Status;
                    }
                });
                if (!mStatusByCode["00"]) {
                    mStatusByCode["00"] = "Pendiente";
                }
                const bHas00 = aStatesNorm.some(x => x.Status === "00");
                if (!bHas00) {
                    aStatesNorm.unshift({ Status: "00", StatusDescription: "Pendiente" });
                }
                that.oModelData.setProperty("/oStateInit", aStatesNorm);
                that.oModelData.setProperty("/mStatusByCode", mStatusByCode);
                //Tabla del Main
                let sComponentTable = "";
                if (that.oModelDevice.getData().system.phone) { sComponentTable = "TableMainDesktop"; }
                else { sComponentTable = "TableMainDesktop"; }
                if (!that.fragmentTable) {
                    that.fragmentTable = sap.ui.xmlfragment(this.frgIdTableMain, that.route + ".view.fragments." + sComponentTable, that);
                    this._byId("vbTableMain").addItem(that.fragmentTable);
                    that._onClearDataFilter();
                    that._applyExtSupplierFilterLock();
                } else {
                    that._applyExtSupplierFilterLock();
                }
                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });

            that._refreshTextsAfterLanguageChange();

            that._setLanguageModel(that._getCurrentLanguageKey());
        },
        _resetProyectOnlyFacturaContext: function () {
            const oMP = this.getModel("oModelProyect") || this.getOwnerComponent().getModel("oModelProyect");
            if (!oMP) return;
            oMP.setProperty("/oCabecera", {});
            oMP.setProperty("/oDetalle", []);
            oMP.setProperty("/oDetalleTotal", []);
            oMP.setProperty("/sDetalleGastoOrigen", "0.00");
            oMP.setProperty("/sDetalleFleteInternacional", "0.00");
            oMP.setProperty("/sDetalleSeguro", "0.00");
            oMP.setProperty("/sDetalleSubtTotal", "0.00");
            oMP.setProperty("/sTotal", "0.00");
            if (typeof this._ensureCondModel === "function") {
                this._ensureCondModel();
            } else {
                if (!oMP.getProperty("/cond")) oMP.setProperty("/cond", {});
            }

            oMP.setProperty("/cond/bShowOrigen", false);
            oMP.setProperty("/cond/bShowFlete", false);
            oMP.setProperty("/cond/bShowSeguro", false);
            if (oMP.getProperty("/oConditionsPay")) oMP.setProperty("/oConditionsPay", []);
            if (oMP.getProperty("/oConditionsPayByOrder")) oMP.setProperty("/oConditionsPayByOrder", {});
            if (oMP.getProperty("/appContext/dialogState")) {
                oMP.setProperty("/appContext/dialogState/DatosCarga/saved", false);
                oMP.setProperty("/appContext/dialogState/DatosCarga/dirty", false);
            }
        },
        _onClearHeaderMain: function (oEvent) {
            that._onClearComponentGlobal(that.getI18nText("sStateInit"), this._byId("idFilterBar"), false);
            that._onClearDataFilter();
            that._resetCatalogs();

            // Si es EXT, reponer siempre el BP del usuario
            that._applyExtSupplierFilterLock();
        },
        _onPressNavigateDetail: function () {
            const that = this;

            let oTable = sap.ui.core.Fragment.byId("frgIdTableMain", "TableMainDesktop");
            if (!oTable) { that.getMessageBox("error", "No se encontró la tabla"); return; }

            const aSelected = oTable.getSelectedContexts("oModelProyect").map(c => c.getObject());
            if (!aSelected.length) {
                that.getMessageBox("error", "Debe seleccionar una orden para poder Facturar");
                return;
            }

            const _norm = (v) => String(v ?? "").trim();

            const proveedoresUnicos = [...new Set(aSelected.map(x => _norm(x.PROVEEDOR)).filter(Boolean))];
            if (proveedoresUnicos.length > 1) { that.getMessageBox("error", "Selecciona solo un proveedor"); return; }

            const estadosUnicos = [...new Set(aSelected.map(x => _norm(x.ESTADO)).filter(Boolean))];
            if (estadosUnicos.length > 1) { that.getMessageBox("error", "Los estados deben coincidir"); return; }

            const monedaUnicos = [...new Set(aSelected.map(x => _norm(x.MONEDA)).filter(Boolean))];
            if (monedaUnicos.length > 1) { that.getMessageBox("error", "Las monedas deben coincidir"); return; }

            const aSinCondPago = aSelected
                .filter(x => !_norm(x.CONDPAGO))
                .map(x => _norm(x.ORDENCOMPRA))
                .filter(Boolean);

            if (aSinCondPago.length) {
                that.getMessageBox(
                    "error",
                    "No se puede continuar. Hay órdenes sin Condición de Pago (CONDPAGO).\n" +
                    "Órdenes: " + aSinCondPago.join(", ")
                );
                return;
            }

            const aCondPagoUnicos = [...new Set(aSelected.map(x => _norm(x.CONDPAGO)).filter(Boolean))];
            if (aCondPagoUnicos.length > 1) {
                const sDetalle = aSelected
                    .map(x => `${_norm(x.ORDENCOMPRA)}: ${_norm(x.CONDPAGO)}`)
                    .filter(s => !s.startsWith(":"))
                    .join("\n");

                that.getMessageBox(
                    "error",
                    "No se puede facturar porque las órdenes seleccionadas tienen distintas Condiciones.\n" +
                    "Condiciones detectadas: " + aCondPagoUnicos.join(", ") + "\n\n" +
                    "Detalle:\n" + sDetalle
                );
                return;
            }

            const aSinCompany = aSelected
                .filter(x => !_norm(x.Company))
                .map(x => _norm(x.ORDENCOMPRA))
                .filter(Boolean);

            if (aSinCompany.length) {
                that.getMessageBox(
                    "error",
                    "No se puede continuar. Hay órdenes sin Sociedad (Company).\n" +
                    "Órdenes: " + aSinCompany.join(", ")
                );
                return;
            }

            const aCompanyUnicos = [...new Set(aSelected.map(x => _norm(x.Company)).filter(Boolean))];
            if (aCompanyUnicos.length > 1) {
                const sDetalle = aSelected
                    .map(x => `${_norm(x.ORDENCOMPRA)}: ${_norm(x.Company)}`)
                    .filter(s => !s.startsWith(":"))
                    .join("\n");

                that.getMessageBox(
                    "error",
                    "No se puede facturar porque las órdenes seleccionadas tienen distinta Sociedad (Company).\n" +
                    "Sociedades detectadas: " + aCompanyUnicos.join(", ") + "\n\n" +
                    "Detalle:\n" + sDetalle
                );
                return;
            }

            const _getIdSap = (x) => _norm(x?.IdSap || x?.IDSAP || x?.IdSAP || x?.Id_sap);

            const _normStatus = (v) => {
                const s = String(v ?? "").trim();
                if (!s) return "";
                return (s.length === 1) ? s.padStart(2, "0") : s;
            };
            const mBlock = { "01": [], "02": [], "03": [], "04": [] };
            aSelected.forEach(x => {
                const orden = _norm(x.ORDENCOMPRA);
                if (!orden) return;

                const st = _normStatus(x.Status);
                if (st === "00" || st === "") return;

                if (mBlock[st]) {
                    mBlock[st].push({
                        orden,
                        idSap: _getIdSap(x)
                    });
                }
            });
            const aHasBlocks = Object.keys(mBlock).filter(k => mBlock[k].length > 0);
            if (aHasBlocks.length) {
                const _msgByStatus = (code) => {
                    switch (code) {
                        case "01": return "La orden ya tiene una solicitud asociada (Registrado).";
                        case "02": return "La orden está Facturada. Debe finalizar la solicitud asociada.";
                        case "03": return "La orden está Aprobada. Debe finalizar la solicitud asociada.";
                        case "04": return "La orden está Contabilizada. No se puede facturar.";
                        default: return "Estado no permitido para facturar.";
                    }
                };
                const sDetalle = aHasBlocks.map(code => {
                    const a = mBlock[code];
                    const sDesc = (that._getStatusDescription && that._getStatusDescription(code)) || code;

                    const sOrdenes = a
                        .map(it => it.orden + (it.idSap ? ` (IdSap: ${it.idSap})` : ""))
                        .join(", ");

                    return `- ${sDesc} (${code}): ${_msgByStatus(code)}\n  Órdenes: ${sOrdenes}`;
                }).join("\n\n");

                that.getMessageBox(
                    "error",
                    "No se puede continuar.\n\n" + sDetalle
                );
                return;
            }
            that.oModelProyect.setProperty("/oCabecera/sFormCondicionPago", aCondPagoUnicos[0]);
            that.oModelProyect.setProperty("/oCabecera/CONDPAGO", aCondPagoUnicos[0]);
            that.oModelProyect.setProperty("/oCabecera/sCompany", aCompanyUnicos[0]);
            that.oModelProyect.setProperty("/oCabecera/Company", aCompanyUnicos[0]);

            const aOrdenes = [...new Set(aSelected.map(x => _norm(x.ORDENCOMPRA)).filter(Boolean))];
            if (!aOrdenes.length) {
                that.getMessageBox("error", "No se encontraron órdenes de compra válidas en la selección.");
                return;
            }
            sap.ui.core.BusyIndicator.show(0);
            const _t = (v) => (v === undefined || v === null) ? "" : String(v).trim();
            const _pickRelevant = (aConds) => {
                const a = Array.isArray(aConds) ? aConds : [];
                return a.filter(c => {
                    const cc = _t(c?.ConditionClass);
                    return cc === "ZI03" || cc === "ZI04" || cc === "ZI05";
                });
            };
            const _classSetSignature = (aConds) => {
                const aRel = _pickRelevant(aConds);
                const set = [...new Set(aRel.map(c => _t(c.ConditionClass)).filter(Boolean))].sort();
                return set.join("|");
            };
            const _toNumCondAmount = (v) => {
                let s = String(v ?? "").trim();
                if (!s) return 0;

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
                return Number.isFinite(n) ? n : 0;
            };

            const _round2 = (n) => Math.round(((Number(n) || 0) + Number.EPSILON) * 100) / 100;

            const _fullConditionsSignature = (aConds) => {
                const mByCondDoc = {};

                _pickRelevant(aConds).forEach((c) => {
                    const cc = _t(c?.ConditionClass);
                    const sSalesDocument = _t(c?.SalesDocument || c?.PurchaseOrder || c?.Ebeln);
                    const sNumberConditionDocument = _t(c?.NumberConditionDocument || c?.ConditionDocument || c?.ConditionRecord);
                    const sKey = [sSalesDocument, sNumberConditionDocument, cc].join("|");

                    if (!mByCondDoc[sKey]) {
                        mByCondDoc[sKey] = {
                            conditionClass: cc,
                            total: 0,
                            used: 0,
                            usedSet: false
                        };
                    }

                    // El servicio ahora retorna una línea por posición: TotalAmount se suma,
                    // pero UsedAmount viene repetido por documento de condición y se toma una sola vez.
                    mByCondDoc[sKey].total += _toNumCondAmount(
                        c?.TotalAmount ??
                        c?.Totalamount ??
                        c?.TOTALAMOUNT
                    );

                    const nUsed = Math.abs(_toNumCondAmount(
                        c?.UsedAmount ??
                        c?.Usedamount ??
                        c?.USEDAMOUNT
                    ));

                    if (!mByCondDoc[sKey].usedSet || nUsed > mByCondDoc[sKey].used) {
                        mByCondDoc[sKey].used = nUsed;
                        mByCondDoc[sKey].usedSet = true;
                    }
                });

                const mByClass = {};

                Object.keys(mByCondDoc).forEach((sKey) => {
                    const oCond = mByCondDoc[sKey];
                    const cc = oCond.conditionClass;

                    if (!mByClass[cc]) {
                        mByClass[cc] = {
                            total: 0,
                            used: 0,
                            pending: 0
                        };
                    }

                    const nPending = oCond.total - oCond.used;

                    mByClass[cc].total += oCond.total;
                    mByClass[cc].used += oCond.used;
                    mByClass[cc].pending += nPending > 0 ? nPending : 0;
                });

                return Object.keys(mByClass)
                    .sort()
                    .map((cc) => {
                        const o = mByClass[cc];

                        return [
                            cc,
                            _round2(o.total).toFixed(2),
                            _round2(o.used).toFixed(2),
                            _round2(o.pending).toFixed(2)
                        ].join("|");
                    })
                    .join("||");
            };

            const aReq = aOrdenes.map((sOrden) => {
                return that._getConditionsOrderMain(sOrden).then((r) => ({
                    orden: sOrden,
                    estado: r?.sEstado,
                    conds: r?.oResults
                })).catch(() => ({
                    orden: sOrden,
                    estado: "E",
                    conds: []
                }));
            });
            Promise.all(aReq).then((aRes) => {
                const aConCond = aRes
                    .filter(x => x.estado === "S" && _pickRelevant(x.conds).length > 0)
                    .map(x => x.orden);

                const aSinCond = aRes
                    .filter(x => x.estado !== "S" || _pickRelevant(x.conds).length === 0)
                    .map(x => x.orden);

                if (aConCond.length > 0 && aSinCond.length > 0) {
                    sap.ui.core.BusyIndicator.hide(0);
                    that.getMessageBox(
                        "error",
                        "No se puede continuar. Hay órdenes con condiciones (ZI03/ZI04/ZI05) y otras sin condiciones.\n\n" +
                        "Con condiciones: " + aConCond.join(", ") + "\n" +
                        "Sin condiciones: " + aSinCond.join(", ")
                    );
                    return;
                }
                const sBaseOrden = aRes[0].orden;
                const sBaseClassSet = _classSetSignature(aRes[0].conds);

                const aDiffClassSet = aRes
                    .slice(1)
                    .filter(x => _classSetSignature(x.conds) !== sBaseClassSet)
                    .map(x => x.orden);

                if (aDiffClassSet.length) {
                    sap.ui.core.BusyIndicator.hide(0);

                    const sDetalle = aRes
                        .map(x => `${x.orden}: ${_classSetSignature(x.conds) || "(sin clases)"}`)
                        .join("\n");

                    that.getMessageBox(
                        "error",
                        "No se puede continuar. Las órdenes seleccionadas no tienen las mismas clases de condición (ZI03/ZI04/ZI05).\n\n" +
                        "Orden base: " + sBaseOrden + " => " + (sBaseClassSet || "(vacío)") + "\n" +
                        "Órdenes con clases distintas: " + aDiffClassSet.join(", ") + "\n\n" +
                        "Detalle por orden:\n" + sDetalle
                    );
                    return;
                }

                const sBaseFullSig = _fullConditionsSignature(aRes[0].conds);
                const aDiffFullSig = aRes
                    .slice(1)
                    .filter(x => _fullConditionsSignature(x.conds) !== sBaseFullSig)
                    .map(x => x.orden);

                if (aDiffFullSig.length) {
                    sap.ui.core.BusyIndicator.hide(0);
                    that.getMessageBox(
                        "error",
                        "No se puede continuar. Aunque las clases coinciden (" + sBaseClassSet + "),\n" +
                        "los valores de las condiciones son distintos entre órdenes.\n\n" +
                        "Orden base: " + sBaseOrden + "\n" +
                        "Órdenes con valores distintos: " + aDiffFullSig.join(", ")
                    );
                    return;
                }

                const oByOrder = {};
                aRes.forEach(x => { oByOrder[x.orden] = x.conds; });
                that.oModelProyect.setProperty("/oConditionsPayByOrder", oByOrder);
                that.oModelProyect.setProperty("/oConditionsPay", aRes[0].conds);

                const jData = aSelected[0];
                that.oModelProyect.setProperty("/oCabecera/sEstadoCodigo", _norm(jData.ESTADO));
                that.oModelProyect.setProperty("/oCabecera/sEstadoDescripcion", _norm(jData.ESTADO_DESC));
                that.oModelProyect.setProperty("/oCabecera/sMoneda", _norm(jData.MONEDA));
                that.oModelProyect.setProperty("/oCabecera/sRuc", _norm(jData.PROVEEDOR));
                that.oModelProyect.setProperty("/oCabecera/sRazonSocial", _norm(jData.RAZONSOCIAL));
                that.oModelProyect.setProperty("/oCabecera/sFactura", _norm(jData.FACTURAASOCIADA));
                that.oModelProyect.setProperty("/oCabecera/sFormEstadoRegistro", _norm(jData.ESTADO_DESC));
                that.oModelProyect.setProperty("/oCabecera/sFormEstadoRegistro", _norm(jData.ESTADO_DESC));

                that._validatePendingItemsBeforeFacturar(aOrdenes).then(function (oPending) {
                    sap.ui.core.BusyIndicator.hide(0);

                    if (!oPending.bHasAnyPending) {
                        that.getMessageBox(
                            "warning",
                            "La orden seleccionada ya no tiene items pendientes por facturar."
                        );
                        return;
                    }

                    if (oPending.aOrdenesSinPendiente && oPending.aOrdenesSinPendiente.length > 0) {
                        that.getMessageBox(
                            "warning",
                            "No se puede continuar porque existen órdenes sin items pendientes por facturar.\n\n" +
                            "Órdenes sin pendiente: " + oPending.aOrdenesSinPendiente.join(", ")
                        );
                        return;
                    }

                    oTable.removeSelections(true);

                    that.oRouter.navTo("Detail", {
                        app: aOrdenes.join().toString() + "-" + _norm(jData.FACTURAASOCIADA)
                    });
                }).catch(function () {
                    sap.ui.core.BusyIndicator.hide(0);
                    that.getMessageBox(
                        "error",
                        "No se pudo validar si la orden tiene items pendientes por facturar."
                    );
                });

            }).catch(() => {
                sap.ui.core.BusyIndicator.hide(0);
                that.getMessageBox("error", "Error al validar condiciones de las órdenes seleccionadas.");
            });
        },
        //hsoler
        // Controla los filtros
        _validateMandatoryFiltersMain: function () {
            var oDRS = sap.ui.core.Fragment.byId(this.frgIdFilterInit, "sDocumentExercise")
                || this.byId("sDocumentExercise");
            if (!oDRS) {
                return true;
            }
            oDRS.setValueState("None");
            oDRS.setValueStateText("");
            var sVal = (oDRS.getValue() || "").trim();
            if (!sVal) {
                const sDefault = this._getDefaultLast3MonthsRange();
                that.oModelProyect.setProperty("/Main/filter/sDocumentExercise", sDefault);
                oDRS.setValue(sDefault);
                return true;
            }
            var a = sVal.replace(/\s/g, "").split("-");
            if (a.length < 2 || !a[0] || !a[1]) {
                oDRS.setValueState("Error");
                oDRS.setValueStateText("Seleccione un rango de fechas (Desde / Hasta).");
                return false;
            }
            return true;
        },
        _getDefaultLast3MonthsRange: function () {
            const oTo = new Date();
            const oFrom = new Date(oTo);
            oFrom.setMonth(oFrom.getMonth() - 3);
            return `${formatter.formatDDMMYYYY(oFrom)} - ${formatter.formatDDMMYYYY(oTo)}`;
        },
        _resetCatalogs: function () {
            if (that.oModelData) {
                that.oModelData.setProperty("/oSupplier", []);
                that.oModelData.setProperty("/oRazonSocial", []);
                that.oModelData.setProperty("/oCompany", []);

                // No limpiar /oOrdenCompra.
                // Ese catálogo debe mantenerse completo para que el filtro
                // Pedido de Compra pueda seguir buscando nuevas órdenes.
            }

            if (that.oModelProyect) {
                that.oModelProyect.setProperty("/Main/bEnableCatalogs", false);
            }
        },
        _enableCatalogs: function () {
            if (that.oModelProyect) {
                that.oModelProyect.setProperty("/Main/bEnableCatalogs", true);
            }
        },
        // Controla los estados
        _getStatusDescription: function (vStatus) {
            const _normStatus = (v) => {
                const s = String(v ?? "").trim();
                if (!s) return "";
                return (s.length === 1) ? s.padStart(2, "0") : s;
            };

            const sKey = _normStatus(vStatus);

            const mI18n = {
                "00": "status00",
                "01": "status01",
                "02": "status02",
                "03": "status03",
                "04": "status04"
            };

            if (mI18n[sKey]) {
                const sText = this.getI18nText(mI18n[sKey]);
                if (sText) return sText;
            }

            const m = this.getModel("oModelData").getProperty("/mStatusByCode") || {};
            return m[sKey] || sKey || "";
        },
        _onPressExecute: function () {
            let jFilter = that.oModelProyect.getProperty("/Main/filter"),
                bFilter = false;

            const _formatDDMMYYYY = (oDate) => {
                const dd = String(oDate.getDate()).padStart(2, "0");
                const mm = String(oDate.getMonth() + 1).padStart(2, "0");
                const yyyy = oDate.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            };

            const _getDefaultLast3MonthsRange = () => {
                const oTo = new Date();
                const oFrom = new Date(oTo);
                oFrom.setMonth(oFrom.getMonth() - 3);
                return `${_formatDDMMYYYY(oFrom)} - ${_formatDDMMYYYY(oTo)}`;
            };

            if (that.isEmpty(jFilter.sDocumentExercise)) {
                const sDefault = _getDefaultLast3MonthsRange();
                that.oModelProyect.setProperty("/Main/filter/sDocumentExercise", sDefault);

                const oDRS = sap.ui.core.Fragment.byId(this.frgIdFilterInit, "sDocumentExercise")
                    || this.byId("sDocumentExercise");
                if (oDRS) {
                    oDRS.setValue(sDefault);
                    oDRS.setValueState("None");
                    oDRS.setValueStateText("");
                }
                jFilter = that.oModelProyect.getProperty("/Main/filter");
            }
            if (!this._validateMandatoryFiltersMain()) {
                return;
            }

            if (jFilter.cbSupplier && jFilter.cbSupplier.length > 0) { bFilter = true; }
            if (!that.isEmpty(jFilter.sNumberDocumentFact)) { bFilter = true; }
            if (!that.isEmpty(jFilter.sDocumentExercise)) { bFilter = true; }
            if (jFilter.cbRazonSocial && jFilter.cbRazonSocial.length > 0) { bFilter = true; }
            if (jFilter.cbCompAssociated && jFilter.cbCompAssociated.length > 0) { bFilter = true; }
            if (jFilter.cbOrdenFilter && jFilter.cbOrdenFilter.length > 0) { bFilter = true; }
            if (jFilter.cbState && jFilter.cbState.length > 0) { bFilter = true; }

            that._resetCatalogs();

            sap.ui.core.BusyIndicator.show();
            Promise.all([this._getData(jFilter)]).then((values) => {
                let oData = values[0];
                if (oData.sEstado === "E") {
                    that.getMessageBox("error", that.getI18nText("errorData"));
                } else {
                    let oReporte = [];
                    oData.oResults.forEach(function (value) {
                        value.ToConsultasOrdCompras.results.forEach(function (value2) {
                            value2.ESTADO_SISTEM = that._getStatusDescription(value2.Status);
                            delete value2.__metadata;
                            oReporte.push(value2);
                        });
                    });
                    const _s = (v) => String(v ?? "").trim();
                    oReporte.sort((a, b) => {
                        const oa = _s(a.ORDENCOMPRA);
                        const ob = _s(b.ORDENCOMPRA);

                        if (!oa && !ob) return 0;
                        if (!oa) return 1;
                        if (!ob) return -1;
                        return ob.localeCompare(oa, undefined, { numeric: true, sensitivity: "base" });
                    });

                    that.oModelProyect.setProperty("/oReporte", oReporte);

                    const aMapProvRaz = new Map();
                    const aSetRaz = new Set();
                    const aSetCompany = new Set();
                    const aSetOrdenCompra = new Set();
                    const aSetCompAssociated = new Set();
                    oReporte.forEach(r => {
                        if (r.PROVEEDOR) {
                            if (!aMapProvRaz.has(r.PROVEEDOR)) {
                                aMapProvRaz.set(r.PROVEEDOR, r.RAZONSOCIAL || "");
                            }
                        }
                        if (r.RAZONSOCIAL) aSetRaz.add(r.RAZONSOCIAL);
                        if (r.Company) aSetCompany.add(r.Company);
                        if (r.ORDENCOMPRA) aSetOrdenCompra.add(r.ORDENCOMPRA);
                        if (r.PurchaseOrder) aSetOrdenCompra.add(r.PurchaseOrder);
                        if (r.FACTURAASOCIADA) aSetCompAssociated.add(r.FACTURAASOCIADA);
                    });

                    const aSupplier = Array.from(aMapProvRaz.entries()).map(([SupplierCode, SupplierName]) => ({
                        SupplierCode,
                        SupplierName
                    }));
                    const aRazon = Array.from(aSetRaz).map(SupplierName => ({ SupplierName }));
                    const aCompany = Array.from(aSetCompany).map(Company => ({ Company }));
                    const aOrdenCompra = Array.from(aSetOrdenCompra).map(OrdenCompra => ({ OrdenCompra }));
                    const aCompAssociated = Array.from(aSetCompAssociated).map(FACTURAASOCIADA => ({ FACTURAASOCIADA }));

                    that.oModelData.setProperty("/oSupplier", aSupplier);
                    that.oModelData.setProperty("/oRazonSocial", aRazon);
                    that.oModelData.setProperty("/oCompany", aCompany);

                    // No sobrescribir el catálogo completo de pedidos con el resultado filtrado.
                    // Si se sobreescribe, el MultiComboBox queda limitado al último resultado.
                    const aOrdenCompraActual = that.oModelData.getProperty("/oOrdenCompra") || [];
                    if (!aOrdenCompraActual.length) {
                        that.oModelData.setProperty("/oOrdenCompra", aOrdenCompra);
                    }

                    that.oModelData.setProperty("/oComprobanteAsociado", aCompAssociated);

                    that._enableCatalogs();
                }

                sap.ui.core.BusyIndicator.hide();
            }).catch(function (oError) {
                that.getMessageBox("error", that.getI18nText("errorData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        _getData: function (jFilterParam) {
            try {
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
                return new Promise(function (resolve, reject) {
                    that.aFilter = [];
                    let sFilter = "";
                    let jFilter = jFilterParam || that.getModel("oModelProyect").getProperty("/Main/filter") || {};
                    const _esc = (v) => String(v || "").replace(/'/g, "''");

                    const oMU = that.getOwnerComponent().getModel("oModelUser");
                    const bIsExtAyc = !!oMU?.getProperty("/bIsExtAyc");
                    const sExtBP = String(oMU?.getProperty("/sExtBP") || "").trim();

                    if (bIsExtAyc && sExtBP) {
                        jFilter.sSupplier = sExtBP;
                        jFilter.cbSupplier = [sExtBP];
                    }


                    const _add = (cond) => {
                        if (!cond) return;
                        sFilter += (sFilter ? " and " : "") + cond;
                    };
                    const _buildOr = (field, arr) => {
                        const a = (arr || []).filter(Boolean);
                        if (!a.length) return "";
                        return "(" + a.map(v => `${field} eq '${_esc(v)}'`).join(" or ") + ")";
                    };
                    let sEjercicioInit = "";
                    let sEjercicioEnd = "";

                    if (!that.isEmpty(jFilter.sDocumentExercise)) {
                        let oEjercicio = jFilter.sDocumentExercise.replace(/\s/g, '').split("-");
                        sEjercicioInit = oEjercicio.length == 0 ? "" :
                            that.reverseStringForParameter(oEjercicio[0], "/").replaceAll("/", "");
                        sEjercicioEnd = oEjercicio.length == 0 ? "" :
                            that.reverseStringForParameter(oEjercicio[1], "/").replaceAll("/", "");
                    }
                    if (!that.isEmpty(sEjercicioInit)) _add(`EJERCICIO_DESDE eq '${_esc(sEjercicioInit)}'`);
                    if (!that.isEmpty(sEjercicioEnd)) _add(`EJERCICIO_HASTA eq '${_esc(sEjercicioEnd)}'`);
                    const sProvOr = _buildOr("PROVEEDOR", jFilter.cbSupplier);
                    if (sProvOr) {
                        _add(sProvOr);
                    } else if (!that.isEmpty(jFilter.sSupplier)) {
                        _add(`PROVEEDOR eq '${_esc(jFilter.sSupplier)}'`);
                    }
                    if (!that.isEmpty(jFilter.sNumberDocumentFact)) {
                        _add(`TIPO eq '${_esc(jFilter.sNumberDocumentFact)}'`);
                    }
                    const sRazOr = _buildOr("RAZONSOCIAL", jFilter.cbRazonSocial);
                    if (sRazOr) {
                        _add(sRazOr);
                    } else if (!that.isEmpty(jFilter.sRazonSocial)) {
                        _add(`RAZONSOCIAL eq '${_esc(jFilter.sRazonSocial)}'`);
                    }
                    const sStateInitFilter = _buildOr("Status", jFilter.cbState);
                    if (sStateInitFilter) {
                        _add(sStateInitFilter);
                    } else if (!that.isEmpty(jFilter.sStateInit)) {
                        _add(`Status eq '${_esc(jFilter.sStateInit)}'`);
                    }
                    const sAssociatedCommit = _buildOr("FACTURAASOCIADA", jFilter.cbCompAssociated);
                    if (sAssociatedCommit) {
                        _add(sAssociatedCommit);
                    } else if (!that.isEmpty(jFilter.sCompAssociated)) {
                        _add(`FACTURAASOCIADA eq '${_esc(jFilter.sCompAssociated)}'`);
                    }
                    const sCompOr = _buildOr("Company", jFilter.cbCompany);
                    if (sCompOr) {
                        _add(sCompOr);
                    } else if (!that.isEmpty(jFilter.sCompanyCod)) {
                        _add(`Company eq '${_esc(jFilter.sCompanyCod)}'`);
                    }
                    const sOrder = _buildOr("PurchaseOrder", jFilter.cbOrdenFilter);
                    if (sOrder) {
                        _add(sOrder);
                    } else if (!that.isEmpty(jFilter.sOrder)) {
                        _add(`PurchaseOrder eq '${_esc(jFilter.sOrder)}'`);
                    }
                    var sPathinit = jQuery.sap.getModulePath("com.aris.proveedores.facturaexterior.pe") +
                        "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/INPUT_CONSULTAS_ORDCOMPRASSET?$expand=ToConsultasOrdCompras,toCanPenFac&$filter=";
                    if (that.isEmpty(sFilter)) {
                        sFilter = "ID_CORR ne ''"; // fallback seguro
                    }
                    let sPath = sPathinit + sFilter + "&$format=json&sap-language=es-ES";


                    Services.getoDataERPSync(that, sPath, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data;
                                resolve(oResp);
                            },
                            error: function (message) {
                                oResp.oResults = [];
                                // temporal
                                oResp.sEstado = "S";
                                oResp.oResults = models.JsonReporte().d.results;
                                // temporal
                                const oScroll = that._byId("vbTableMain").getItems()[0];
                                const oTable = oScroll && oScroll.getContent && oScroll.getContent()[0];
                                const oBinding = oTable && oTable.getBinding("items");
                                if (oBinding) { oBinding.filter(that.aFilter || []); }
                                resolve(oResp);
                            }
                        });
                    });
                });

            } catch (oError) {
                that.getMessageBox("error", that.getI18nText("sErrorTry"));
            }
        },
        onPressIdSap: function (oEvent) {
            try {
                const oCtx = oEvent.getSource().getBindingContext("oModelProyect");
                const sIdSap = (oCtx && oCtx.getProperty("IdSap")) ? String(oCtx.getProperty("IdSap")).trim() : "";

                if (!sIdSap) {
                    that.getMessageBox("error", "El registro no tiene IdSap.");
                    return;
                }
                this.oRouter.navTo("Detail", {
                    app: "NA-NA",
                    "?query": { IdSap: sIdSap }
                }, false);

            } catch (e) {
                that.getMessageBox("error", "Error al navegar con IdSap.");
            }
        },
        // para cambiar el idioma
        onLanguageEsp: function () {
            this._setLanguageModel("esp");
            this._refreshTextsAfterLanguageChange();
        },

        onLanguageEng: function () {
            this._setLanguageModel("ing");
            this._refreshTextsAfterLanguageChange();
        },

        _refreshTextsAfterLanguageChange: function () {
            const oData = this.getModel("oModelData");
            const oMP = this.getModel("oModelProyect");

            if (typeof this._refreshFilterBarStandardButtons === "function") {
                this._refreshFilterBarStandardButtons();
            }

            if (oData) {
                const aState = oData.getProperty("/oStateInit") || [];
                if (Array.isArray(aState)) {
                    aState.forEach((oStatus) => {
                        oStatus.StatusDescription = this._getStatusDescription(oStatus.Status);
                    });
                    oData.setProperty("/oStateInit", aState);
                }
            }

            if (oMP) {
                const aReporte = oMP.getProperty("/oReporte") || [];
                if (Array.isArray(aReporte)) {
                    aReporte.forEach((oRow) => {
                        oRow.ESTADO_SISTEM = this._getStatusDescription(oRow.Status);
                    });
                    oMP.setProperty("/oReporte", aReporte);
                }
            }
        },

        _getConditionsOrderMain: function (sSalesDocument) {
            const that = this;
            try {
                const oResp = { sEstado: "E", oResults: [] };
                const _escOData = (v) => String(v ?? "").trim().replace(/'/g, "''");
                const sDoc = _escOData(sSalesDocument);
                const sFilterRaw =
                    `SalesDocument eq '${sDoc}' and (` +
                    `ConditionClass eq 'ZI03' or ConditionClass eq 'ZI04' or ConditionClass eq 'ZI05'` +
                    `)`;
                return new Promise(function (resolve) {
                    let sUrl = "";
                    if (that.local) {
                        const sPath =
                            "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/POCondition" + "?$filter=" + encodeURIComponent(sFilterRaw) + "&$format=json";

                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath =
                            jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/POCondition" + "?$filter=" + encodeURIComponent(sFilterRaw) + "&$format=json";

                        sUrl = sPath;
                    }
                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data;
                                resolve(oResp);
                            },
                            error: function () {
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
        _getScimCustomAttributes: function (oUser) {
            return oUser?.["urn:sap:cloud:scim:schemas:extension:custom:2.0:User"] || {};
        },


        _applyExtSupplierFilterLock: function () {
            const oMU = this.getOwnerComponent().getModel("oModelUser");
            const oMP = this.getModel("oModelProyect");

            const bIsExtAyc = !!oMU?.getProperty("/bIsExtAyc");
            const sExtBP = String(oMU?.getProperty("/sExtBP") || "").trim();


            if (!bIsExtAyc || !sExtBP || !oMP) {
                return;
            }

            oMP.setProperty("/Main/filter/sSupplier", sExtBP);
            oMP.setProperty("/Main/filter/cbSupplier", [sExtBP]);
            oMP.setProperty("/Main/filter/cbSupplierText", [sExtBP]);

        },
        _getPendingAvailableQtyMain: function (oItem) {
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

            /*
                Regla:
                - Pendingamount positivo: cantidad pendiente disponible.
                - Pendingamount negativo: cantidad ya usada/facturada.
                - Pendingamount cero: ya no queda pendiente.
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

            if (nOrderQty > 0 && nCanPen > nOrderQty) {
                nCanPen = nOrderQty;
            }

            return nCanPen;
        },

        _validatePendingItemsBeforeFacturar: function (aOrdenes) {
            const that = this;

            const _asResults = function (x) {
                if (Array.isArray(x)) return x;
                if (x && Array.isArray(x.results)) return x.results;
                if (x && x.d && Array.isArray(x.d.results)) return x.d.results;
                return [];
            };

            const _esc = function (v) {
                return String(v ?? "").trim().replace(/'/g, "''");
            };

            let sFiltroEbeln = "";

            aOrdenes.forEach(function (sOrden, i) {
                const sPO = _esc(sOrden);
                if (!sPO) return;

                if (i === 0) {
                    sFiltroEbeln += "Ebeln eq '" + sPO + "' ";
                } else {
                    sFiltroEbeln += "or Ebeln eq '" + sPO + "' ";
                }
            });

            return that._getOrdenes(sFiltroEbeln).then(function (oResp) {
                const aCabeceras = _asResults(oResp && oResp.oResults);

                const mOrdenConPendiente = {};
                aOrdenes.forEach(function (sOrden) {
                    mOrdenConPendiente[String(sOrden).trim()] = false;
                });

                let iItemsPendientes = 0;

                aCabeceras.forEach(function (oCab) {
                    const sPO = String(oCab.Ebeln || oCab.PurchaseOrder || "").trim();
                    const aItems = _asResults(oCab.toPurOrdItems);

                    const bTienePendiente = aItems.some(function (oItem) {
                        return that._getPendingAvailableQtyMain(oItem) > 0;
                    });

                    if (sPO) {
                        mOrdenConPendiente[sPO] = bTienePendiente;
                    }

                    if (bTienePendiente) {
                        iItemsPendientes++;
                    }
                });

                const aOrdenesSinPendiente = Object.keys(mOrdenConPendiente).filter(function (sOrden) {
                    return !mOrdenConPendiente[sOrden];
                });

                return {
                    bHasAnyPending: iItemsPendientes > 0,
                    aOrdenesSinPendiente: aOrdenesSinPendiente
                };
            });
        },

    });
});
