sap.ui.define([
    "com/proveedor/peticionoferta/pe/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "com/proveedor/peticionoferta/pe/model/models",
    "com/proveedor/peticionoferta/pe/model/formatter",
    "com/proveedor/peticionoferta/pe/services/Services",
    "com/proveedor/peticionoferta/pe/util/util",
    "com/proveedor/peticionoferta/pe/util/utilUI"
], (BaseController, Controller, models, formatter, Services, util, utilUI) => {
    "use strict";
    var that;
    formatter: formatter;

    return BaseController.extend("com.proveedor.peticionoferta.pe.controller.Detail", {
        onInit() {
            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Detail").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

        },
        handleRouteMatched: async function () {
            sap.ui.core.BusyIndicator.show(0);

            const oModel = this.getView().getModel("oModelProyect");
            const oHashChanger = this.oRouter.getHashChanger();
            const sHash = (oHashChanger.getHash && oHashChanger.getHash()) || oHashChanger.hash || "";
            const aHash = (sHash || "").split("/");

            const sNumPedido = aHash[1] || "";
            const sSupplier = aHash[2] || "";
            const sSupplierQuotation = aHash[3] || "";

            try {
                console.log("========== [handleRouteMatched] INICIO ==========");
                console.log("[handleRouteMatched] sHash:", sHash);
                console.log("[handleRouteMatched] sNumPedido:", sNumPedido);
                console.log("[handleRouteMatched] sSupplier:", sSupplier);
                console.log("[handleRouteMatched] sSupplierQuotation:", sSupplierQuotation);

                oModel.setProperty("/bEditMode", false);

                const aResults = await Promise.all([
                    this._getPedidoDetalle(sNumPedido, sSupplier, sSupplierQuotation),
                    this._getPetOffert(sNumPedido, sSupplier, sSupplierQuotation),
                    this._getDiscount(sSupplierQuotation)
                ]);

                const oRespDetalle = aResults[0];
                const oRespCab = aResults[1];
                const oRespDiscount = aResults[2];

                console.log("[handleRouteMatched] oRespDetalle:", oRespDetalle);
                console.log("[handleRouteMatched] oRespCab:", oRespCab);
                console.log("[handleRouteMatched] oRespDiscount:", oRespDiscount);

                let aCabecera = oRespCab?.oResults || [];
                let aCabeceraFiltro = aCabecera.filter(item =>
                    String(item.RequestForQuotation || "") === String(sNumPedido || "") &&
                    String(item.Supplier || "") === String(sSupplier || "")
                );

                console.log("[handleRouteMatched] aCabeceraFiltro:", aCabeceraFiltro);

                if (aCabeceraFiltro.length > 0) {
                    const oCabeceraData = aCabeceraFiltro[0];
                    oModel.setProperty("/oClientCabecera", oCabeceraData);
                    oModel.setProperty("/oCabecera/QtnStatus", oCabeceraData.QtnStatus || "");
                }

                let aDetalleBackend = oRespDetalle?.oResults || [];

                let mDetalleBase = {};
                aDetalleBackend.forEach(item => {
                    const sKey = String(item.RequestForQuotationItem || "").padStart(5, "0");
                    mDetalleBase[sKey] = item;
                });

                aDetalleBackend.forEach(function (value) {
                    value.cantCotizada = this.isEmpty(value.cantCotizada) ? "0" : value.cantCotizada;
                    value.priceUnit = this.isEmpty(value.priceUnit) ? "0.00" : value.priceUnit;
                    value.Discount = this.isEmpty(value.Discount) ? "0" : value.Discount;
                    value.SubTotal = this.isEmpty(value.SubTotal) ? "0" : value.SubTotal;
                }.bind(this));

                let aCondiciones = oRespDiscount?.oResults || [];
                let mDescuentos = {};

                aCondiciones.forEach(cond => {
                    if (cond.QtnCondition === "RA01") {
                        let sItem = String(cond.QtnDocumentConditionItem || "").padStart(5, "0");
                        let fValor = parseFloat(cond.QtnDiscountPercentage) || 0;

                        if (!mDescuentos[sItem]) {
                            mDescuentos[sItem] = 0;
                        }

                        mDescuentos[sItem] += fValor;
                    }
                });

                let aDetalleMapeado = aDetalleBackend.map(item => {
                    let sItem = String(item.RequestForQuotationItem || "").padStart(5, "0");
                    let fDiscount = mDescuentos[sItem] || 0;

                    return {
                        RequestForQuotation: item.RequestForQuotation || sNumPedido,
                        RequestForQuotationItem: item.RequestForQuotationItem || "",
                        Material: item.Material || "",
                        MaterialDescription: this._resolveMaterialDescription(item, item, null),
                        OrderQuantityUnit: item.OrderQuantityUnit || "",
                        DocumentCurrency: item.DocumentCurrency || "",
                        cantCotizada: item.QtnQuantity || item.ScheduleLineOrderQuantity || "0.00",
                        priceUnit: item.GrossValue || item.NetPriceAmount || "0.00",
                        Discount: String(fDiscount),
                        SubTotal: item.QtnNetAmount || item.NetAmount || "0.00",
                        ScheduleLineOrderQuantity: item.ScheduleLineOrderQuantity || "0.00",
                        FechaEntrega: this._formatDateDDMMYYYY(item.QtnDeliveryDate || item.ScheduleLineDeliveryDate),
                        NoteTypeListText: item.NoteTypeListText || "",
                        ItemNota: item.ItemNota || "",
                        ItemNotaEdit: item.ItemNotaEdit || item.ItemNota || "",
                        ItemNotaOfepos: item.ItemNotaOfepos || "",
                        ItemNotaLineCount: item.ItemNotaLineCount || 0,
                        _notaItemEditable: false
                    };
                });

                if (!sSupplierQuotation) {
                    const bSinDetalle = !aDetalleMapeado || !aDetalleMapeado.length;
                    const bSinDescripcion = (aDetalleMapeado || []).some(row =>
                        !String(row.MaterialDescription || "").trim()
                    );

                    if (bSinDetalle || bSinDescripcion) {
                        const oDraftInfo = await this._prepareInitialDraftFromRFQ(sNumPedido, sSupplier);

                        console.log("[handleRouteMatched] oDraftInfo:", oDraftInfo);

                        if (oDraftInfo && oDraftInfo.aDetalle && oDraftInfo.aDetalle.length) {
                            const mDraftByItem = {};

                            oDraftInfo.aDetalle.forEach(row => {
                                const sKey = String(
                                    row.RequestForQuotationItem ||
                                    row.SupplierQuotationItem ||
                                    ""
                                ).padStart(5, "0");

                                mDraftByItem[sKey] = row;
                            });

                            if (aDetalleMapeado && aDetalleMapeado.length) {
                                aDetalleMapeado = aDetalleMapeado.map(row => {
                                    const sKey = String(row.RequestForQuotationItem || "").padStart(5, "0");
                                    const oBase = mDetalleBase[sKey] || {};
                                    const oDraftRow = mDraftByItem[sKey] || {};

                                    return {
                                        ...row,
                                        Material: row.Material || oBase.Material || oDraftRow.Material || "",
                                        MaterialDescription: this._resolveMaterialDescription(row, oBase, oDraftRow),
                                        OrderQuantityUnit:
                                            row.OrderQuantityUnit || oBase.OrderQuantityUnit || oDraftRow.OrderQuantityUnit || "",
                                        DocumentCurrency:
                                            row.DocumentCurrency || oBase.DocumentCurrency || oDraftRow.DocumentCurrency || "",
                                        ScheduleLineOrderQuantity:
                                            row.ScheduleLineOrderQuantity || oBase.ScheduleLineOrderQuantity || oDraftRow.ScheduleLineOrderQuantity || "0.00",
                                        cantCotizada:
                                            row.cantCotizada || oDraftRow.cantCotizada || "0.00",
                                        priceUnit:
                                            row.priceUnit || oDraftRow.priceUnit || "0.00",
                                        Discount:
                                            row.Discount || oDraftRow.Discount || "0",
                                        SubTotal:
                                            row.SubTotal || oDraftRow.SubTotal || "0.00",
                                        FechaEntrega:
                                            row.FechaEntrega || oDraftRow.FechaEntrega || ""
                                    };
                                });
                            } else {
                                aDetalleMapeado = oDraftInfo.aDetalle.map(row => {
                                    const sKey = String(
                                        row.RequestForQuotationItem ||
                                        row.SupplierQuotationItem ||
                                        ""
                                    ).padStart(5, "0");

                                    const oBase = mDetalleBase[sKey] || {};

                                    return {
                                        ...row,
                                        Material: row.Material || oBase.Material || "",
                                        MaterialDescription: this._resolveMaterialDescription(row, oBase, row),
                                        OrderQuantityUnit: row.OrderQuantityUnit || oBase.OrderQuantityUnit || "",
                                        DocumentCurrency: row.DocumentCurrency || oBase.DocumentCurrency || "",
                                        ScheduleLineOrderQuantity:
                                            row.ScheduleLineOrderQuantity || oBase.ScheduleLineOrderQuantity || "0.00"
                                    };
                                });
                            }

                            oModel.setProperty("/oCabecera/DraftUUID", oDraftInfo.DraftUUID || "");
                            oModel.setProperty("/aPosicionesSAP", oDraftInfo.aPosicionesSAP || []);
                        }
                    }
                }

                aDetalleMapeado = await this._completeMissingMaterialDescriptions(
                    aDetalleMapeado,
                    sNumPedido
                );

                console.log("[handleRouteMatched] aDetalleBackend:", aDetalleBackend);
                console.log("[handleRouteMatched] aDetalleMapeado antes de setear:", aDetalleMapeado);

                oModel.setProperty("/oDetalle", aDetalleMapeado || []);

                if (!oModel.getProperty("/oCabecera")) {
                    oModel.setProperty("/oCabecera", {});
                }

                oModel.setProperty("/aDeletedPositions", []);
                oModel.setProperty("/_editSnapshot", null);

                const sNotaCabLocal = oModel.getProperty("/oClientCabecera/Nota") || "";
                oModel.setProperty("/oClientCabecera/NotaEdit", sNotaCabLocal);
                oModel.setProperty("/oClientCabecera/_notaEditable", false);

                const aDetalleActual = oModel.getProperty("/oDetalle") || [];
                aDetalleActual.forEach((item, idx) => {
                    oModel.setProperty(`/oDetalle/${idx}/ItemNotaEdit`, item.ItemNota || "");
                    oModel.setProperty(`/oDetalle/${idx}/_notaItemEditable`, false);
                });

                console.log("[handleRouteMatched] /oClientCabecera ANTES de recargar notas:",
                    JSON.parse(JSON.stringify(oModel.getProperty("/oClientCabecera") || {})));
                console.log("[handleRouteMatched] /oDetalle ANTES de recargar notas:",
                    JSON.parse(JSON.stringify(oModel.getProperty("/oDetalle") || [])));

                const sOfertaParaNotas =
                    sSupplierQuotation ||
                    oModel.getProperty("/oCabecera/SupplierQuotation") ||
                    oModel.getProperty("/oClientCabecera/SupplierQuotation") ||
                    "";

                const sDraftUUIDOffer = oModel.getProperty("/oCabecera/DraftUUIDOffer") || "";
                const sLastSavedDraftUUIDOffer = oModel.getProperty("/oCabecera/LastSavedDraftUUIDOffer") || "";
                const sDraftUUID = oModel.getProperty("/oCabecera/DraftUUID") || "";

                const sDraftForHeader =
                    sDraftUUIDOffer ||
                    sLastSavedDraftUUIDOffer ||
                    sDraftUUID ||
                    "";

                console.log("[handleRouteMatched] sOfertaParaNotas:", sOfertaParaNotas);
                console.log("[handleRouteMatched] sDraftUUIDOffer:", sDraftUUIDOffer);
                console.log("[handleRouteMatched] sLastSavedDraftUUIDOffer:", sLastSavedDraftUUIDOffer);
                console.log("[handleRouteMatched] sDraftUUID:", sDraftUUID);
                console.log("[handleRouteMatched] sDraftForHeader:", sDraftForHeader);

                // RECARGA DE NOTAS: SI YA EXISTE SupplierQuotation, LEER COMO DOCUMENTO ACTIVO.
                // SI NO EXISTE AÚN, LEER COMO DRAFT.
                if (sSupplierQuotation) {
                    console.log("[handleRouteMatched] Documento publicado. Se cargarán notas ACTIVAS.");
                    console.log("[handleRouteMatched] sSupplierQuotation:", sSupplierQuotation);

                    const sNotaHeaderActiva = await this._loadPublishedHeaderNote(sSupplierQuotation);
                    console.log("[handleRouteMatched] Nota cabecera ACTIVA:", sNotaHeaderActiva);

                    oModel.setProperty("/oClientCabecera/Nota", sNotaHeaderActiva || "");
                    oModel.setProperty("/oClientCabecera/NotaEdit", sNotaHeaderActiva || "");

                    await this._loadPublishedItemNotes(sSupplierQuotation);

                } else if (sDraftForHeader) {
                    console.log("[handleRouteMatched] Documento en draft. Se cargarán notas DRAFT.");
                    console.log("[handleRouteMatched] sDraftForHeader:", sDraftForHeader);

                    const sObjectIdHeader = this._guidToObjectId(sDraftForHeader);
                    console.log("[handleRouteMatched] Header ObjectID draft:", sObjectIdHeader);

                    const sNotaHeader = await this._loadHeaderNote(sObjectIdHeader);
                    console.log("[handleRouteMatched] Nota cabecera cargada desde draft:", sNotaHeader);

                    oModel.setProperty("/oClientCabecera/Nota", sNotaHeader || "");
                    oModel.setProperty("/oClientCabecera/NotaEdit", sNotaHeader || "");

                    if (sOfertaParaNotas && this._loadItemNotesFromStandardApi) {
                        await this._loadItemNotesFromStandardApi(sOfertaParaNotas, sDraftForHeader);
                    } else if (sOfertaParaNotas) {
                        console.warn("[handleRouteMatched] _loadItemNotesFromStandardApi no existe.");
                    }

                } else {
                    console.warn("[handleRouteMatched] No hay SupplierQuotation ni Draft para recargar notas.");
                }

                console.log("[handleRouteMatched] /oClientCabecera DESPUÉS de recargar notas:",
                    JSON.parse(JSON.stringify(oModel.getProperty("/oClientCabecera") || {})));
                console.log("[handleRouteMatched] /oDetalle DESPUÉS de recargar notas:",
                    JSON.parse(JSON.stringify(oModel.getProperty("/oDetalle") || [])));

                let sIdioma = oModel.getProperty("/sIdioma");
                var oDatePicker = this.byId("dtFechaEntrega");
                if (oDatePicker) {
                    oDatePicker.setDateValue(new Date());
                }

                if (sIdioma == undefined) {
                    this._setLanguageModel("esp");
                } else {
                    this._setLanguageModel(sIdioma);
                }

                oModel.refresh(true);

                console.log("========== [handleRouteMatched] FIN OK ==========");

            } catch (oError) {
                console.error("Error en handleRouteMatched:", oError);
                this.getMessageBox("error", this.getI18nText("errorUserData"));
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },
        _onPressNavButtonDetail: function () {
            const oModel = this.getView().getModel("oModelProyect");
            const bEditMode = !!oModel.getProperty("/bEditMode");
            const bHasPending = this._hasPendingChanges();

            if (bEditMode && bHasPending) {
                sap.m.MessageBox.confirm(
                    "Si regresa, los cambios no guardados se perderán. ¿Desea continuar?",
                    {
                        title: "Confirmar salida",
                        actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                        emphasizedAction: sap.m.MessageBox.Action.OK,
                        onClose: (sAction) => {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                this._resetDetailTransientState(false);
                                this.oRouter.navTo("Main");
                            }
                        }
                    }
                );
                return;
            }

            this._resetDetailTransientState(false);
            this.oRouter.navTo("Main");
        },
        _cloneDeep: function (oData) {
            return JSON.parse(JSON.stringify(oData || null));
        },

        _takeEditSnapshot: function () {
            const oModel = this.getView().getModel("oModelProyect");
            const oSnapshot = {
                oClientCabecera: this._cloneDeep(oModel.getProperty("/oClientCabecera") || {}),
                oCabecera: this._cloneDeep(oModel.getProperty("/oCabecera") || {}),
                oDetalle: this._cloneDeep(oModel.getProperty("/oDetalle") || []),
                aDeletedPositions: this._cloneDeep(oModel.getProperty("/aDeletedPositions") || [])
            };
            oModel.setProperty("/_editSnapshot", oSnapshot);
        },

        _hasPendingChanges: function () {
            const oModel = this.getView().getModel("oModelProyect");
            const oSnapshot = oModel.getProperty("/_editSnapshot");

            if (!oSnapshot) {
                return false;
            }

            const oCurrent = {
                oClientCabecera: this._cloneDeep(oModel.getProperty("/oClientCabecera") || {}),
                oCabecera: this._cloneDeep(oModel.getProperty("/oCabecera") || {}),
                oDetalle: this._cloneDeep(oModel.getProperty("/oDetalle") || []),
                aDeletedPositions: this._cloneDeep(oModel.getProperty("/aDeletedPositions") || [])
            };

            return JSON.stringify(oSnapshot) !== JSON.stringify(oCurrent);
        },

        _resetDetailTransientState: function (bKeepSupplierQuotation) {
            const oModel = this.getView().getModel("oModelProyect");
            const bKeep = !!bKeepSupplierQuotation;

            oModel.setProperty("/bEditMode", false);
            oModel.setProperty("/_editSnapshot", null);
            oModel.setProperty("/aDeletedPositions", []);
            oModel.setProperty("/aPosicionesSAP", []);

            oModel.setProperty("/oCabecera/DraftUUID", "");
            oModel.setProperty("/oCabecera/DraftUUIDOffer", "");

            if (!bKeep) {
                oModel.setProperty("/oCabecera/SupplierQuotation", "");
                oModel.setProperty("/oClientCabecera/SupplierQuotation", "");
            }

            const aDetalle = oModel.getProperty("/oDetalle") || [];
            aDetalle.forEach((item, idx) => {
                oModel.setProperty(`/oDetalle/${idx}/_notaItemEditable`, false);
            });

            oModel.setProperty("/oClientCabecera/_notaEditable", false);
            oModel.refresh(true);
        },

        _createQuotationFromRFQ: async function (bUpdateHash = true) {
            const oModel = this.getView().getModel("oModelProyect");
            const oClientCabecera = oModel.getProperty("/oClientCabecera") || {};
            const aDetalle = oModel.getProperty("/oDetalle") || [];

            const sExistingQtn = this._getCurrentSupplierQuotation();
            if (sExistingQtn) {
                return {
                    SupplierQuotation: sExistingQtn,
                    DraftUUID: oModel.getProperty("/oCabecera/DraftUUID") || "",
                    NewHash: ""
                };
            }

            const oHashChanger = this.oRouter.getHashChanger();
            const sHash = (oHashChanger.getHash && oHashChanger.getHash()) || oHashChanger.hash || "";
            const aHash = (sHash || "").split("/");

            const sNumPedido = aHash[1] || aDetalle?.[0]?.RequestForQuotation || "";
            const sSupplier = aHash[2] || oClientCabecera.Supplier || "";

            if (!sNumPedido || !sSupplier) {
                throw new Error("No se pudo determinar el número de petición o el proveedor para crear la oferta.");
            }

            const sServiceUrl = this._getQtnServiceUrl();

            let sDraftUUID = oModel.getProperty("/oCabecera/DraftUUID") || "";

            if (!sDraftUUID) {
                const draftResp = await Services.postoDataERPAsync(
                    this,
                    sServiceUrl,
                    `${sServiceUrl}AAE13DD33FBFA6553F9ACwr_qtn_from_rfq_all?RequestForQuotation='${sNumPedido}'&Supplier='${sSupplier}'`,
                    {}
                );

                const oDraftData = draftResp?.data || draftResp?.d || {};
                sDraftUUID =
                    oDraftData.DraftUUID ||
                    oDraftData?.results?.[0]?.DraftUUID ||
                    null;

                if (!sDraftUUID) {
                    throw new Error("No se generó DraftUUID al crear la oferta desde la petición.");
                }

                let sQuotationLatestDate =
                    oDraftData.QuotationLatestSubmissionDate ||
                    oDraftData.results?.[0]?.QuotationLatestSubmissionDate ||
                    `/Date(${new Date().getTime()})/`;

                let sDocType =
                    oDraftData.PurchasingDocumentType ||
                    oDraftData.results?.[0]?.PurchasingDocumentType ||
                    "ZQTN";

                let sFollowOnDocType =
                    oDraftData.FollowOnDocumentType ||
                    "ZP01";

                const sUrlMerge =
                    `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                    `SupplierQuotation='',DraftUUID=guid'${sDraftUUID}',IsActiveEntity=false)`;

                const oBodyMerge = {
                    QuotationSubmissionDate: sQuotationLatestDate,
                    FollowOnDocumentCategory: "F",
                    FollowOnDocumentType: sFollowOnDocType,
                    PurchasingDocumentType: sDocType
                };

                await Services.mergeODataAsync(this, sUrlMerge, oBodyMerge);
                oModel.setProperty("/oCabecera/DraftUUID", sDraftUUID);
            }

            const sUrlActivate =
                `${sServiceUrl}C_SuplrQuotationEnhWDActivation?` +
                `SupplierQuotation=''&DraftUUID=guid'${sDraftUUID}'&IsActiveEntity=false`;

            const activeResp = await Services.postoDataERPAsync(
                this,
                sServiceUrl,
                sUrlActivate,
                {}
            );

            const sSupplierQuotation =
                activeResp?.d?.SupplierQuotation ||
                activeResp?.data?.d?.SupplierQuotation ||
                activeResp?.data?.SupplierQuotation ||
                activeResp?.SupplierQuotation ||
                activeResp?.d?.results?.[0]?.SupplierQuotation ||
                null;

            if (!sSupplierQuotation) {
                throw new Error("No se obtuvo número de oferta después de activar el borrador.");
            }

            oModel.setProperty("/oCabecera/SupplierQuotation", sSupplierQuotation);
            oModel.setProperty("/oClientCabecera/SupplierQuotation", sSupplierQuotation);

            aHash[3] = sSupplierQuotation;
            const sNewHash = aHash.join("/");

            if (bUpdateHash) {
                if (oHashChanger.replaceHash) {
                    oHashChanger.replaceHash(sNewHash);
                } else {
                    oHashChanger.setHash(sNewHash);
                }
            }

            return {
                SupplierQuotation: sSupplierQuotation,
                DraftUUID: sDraftUUID,
                NewHash: sNewHash
            };
        },

        _deleteDraftItem: async function (sSupplierQuotation, sSupplierQuotationItem, sDraftUUID) {
            const sServiceUrl = this._getQtnServiceUrl();

            const sDeleteUrl =
                `${sServiceUrl}C_SuplrQuotationItemEnhWD(` +
                `SupplierQuotation='${sSupplierQuotation}',` +
                `SupplierQuotationItem='${sSupplierQuotationItem}',` +
                `DraftUUID=guid'${sDraftUUID}',` +
                `IsActiveEntity=false)`;

            await Services.postNoBodyERPAsync(
                this,
                sServiceUrl,
                sDeleteUrl,
                {
                    "X-HTTP-Method": "DELETE"
                }
            );
        },

        _loadHeaderNote: async function (sObjectId) {
            const sServiceUrl = this._getNoteServiceUrl();

            const sFilterStr =
                `ObjectID eq '${sObjectId}' ` +
                `and ObjectNodeType eq 'SupplierQuotation' ` +
                `and IsActiveEntity eq false ` +
                `and NoteType eq 'NOTE_FROM_SUPPLIER'`;

            const sUrl =
                `${sServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                `?$select=NoteID,Language,NoteType,Content` +
                `&$filter=${encodeURIComponent(sFilterStr)}` +
                `&$format=json`;

            const oResp = await Services.oDataConsultODATAAsync(
                "GET",
                sUrl,
                [],
                [],
                "1",
                this
            );

            const aResults = oResp?.d?.results || [];
            if (!aResults.length) {
                return "";
            }
            return aResults[0].Content || "";
        },
        //restriccion para crear ofertas
        _getCurrentSupplierQuotation: function () {
            const oModel = this.getView().getModel("oModelProyect");
            const oClientCabecera = oModel.getProperty("/oClientCabecera") || {};
            const oCabeceraStd = oModel.getProperty("/oCabecera") || {};

            const sFromClient = (oClientCabecera.SupplierQuotation || "").trim();
            const sFromStd = (oCabeceraStd.SupplierQuotation || "").trim();
            const sResult = sFromClient || sFromStd || "";

            console.log("[_getCurrentSupplierQuotation] oClientCabecera.SupplierQuotation:", sFromClient);
            console.log("[_getCurrentSupplierQuotation] oCabecera.SupplierQuotation:", sFromStd);
            console.log("[_getCurrentSupplierQuotation] resultado:", sResult);

            return sResult;
        },
        _loadNotasDetalleStd: async function (sPurchaseOrder) {
            const oModel = this.getView().getModel("oModelProyect");
            const aDetalle = oModel.getProperty("/oDetalle") || [];
            if (!aDetalle.length || !sPurchaseOrder) {
                console.log("ℹ️ _loadNotasDetalleStd: sin PurchaseOrder o sin detalle, no se cargan notas.");
                return;
            }
            sap.ui.core.BusyIndicator.show(0);
            try {
                const mNotesByItem = await this._getPurOrdNotesMap(sPurchaseOrder);
                aDetalle.forEach((row, idx) => {
                    const rawItem = String(
                        row.PurchaseOrderItem ||
                        row.SupplierQuotationItem ||
                        row.RequestForQuotationItem ||
                        ""
                    );
                    let sItemKey = rawItem;
                    if (!mNotesByItem[sItemKey]) {
                        const sinCeros = rawItem.replace(/^0+/, "") || rawItem;

                        if (mNotesByItem[sinCeros]) {
                            sItemKey = sinCeros;
                        } else {
                            const pad5 = sinCeros.padStart(5, "0");
                            const pad6 = sinCeros.padStart(6, "0");

                            if (mNotesByItem[pad5]) {
                                sItemKey = pad5;
                            } else if (mNotesByItem[pad6]) {
                                sItemKey = pad6;
                            }
                        }
                    }

                    const sNota = mNotesByItem[sItemKey] || "";

                    oModel.setProperty(`/oDetalle/${idx}/ItemNota`, sNota);
                    oModel.setProperty(`/oDetalle/${idx}/ItemNotaEdit`, sNota);
                    oModel.setProperty(`/oDetalle/${idx}/_notaItemEditable`, false);

                    console.log(
                        `Fila ${idx} → rawItem=${rawItem}, keyUsada=${sItemKey}, nota=`,
                        sNota
                    );
                });

                oModel.refresh(true);
                console.log(
                    "📦 Detalle final con notas estándar:",
                    JSON.stringify(oModel.getProperty("/oDetalle"), null, 2)
                );
            } catch (e) {
                console.error("⚠️ Error en _loadNotasDetalleStd (Z):", e);
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },
        _getPurOrdNotesMap: function (sPurchaseOrder) {
            const that = this;
            return new Promise(function (resolve) {
                if (!sPurchaseOrder) {
                    resolve({});
                    return;
                }

                let sUrl = "";
                const sFilter = encodeURIComponent("PurchaseOrder eq '" + sPurchaseOrder + "'");
                const sQuery = "PurOrdNoteSet?$filter=" + sFilter +
                    "&$expand=toPurOrdNoteItem&$format=json";

                if (that.local) {
                    const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/" + sQuery;
                    sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                } else {
                    const sPath = jQuery.sap.getModulePath(that.route) +
                        "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/" + sQuery;
                    sUrl = sPath;
                }

                Services.getoDataERPSync(that, sUrl, function (result) {
                    util.response.validateAjaxGetERPNotMessage(result, {
                        success: function (oData) {

                            console.log("🔍 oData notas PO:", JSON.stringify(oData, null, 2));

                            let aHeaders = [];

                            if (Array.isArray(oData.data)) {
                                aHeaders = oData.data;
                            } else if (oData.data && Array.isArray(oData.data.results)) {
                                aHeaders = oData.data.results;
                            } else if (Array.isArray(oData.results)) {
                                aHeaders = oData.results;
                            } else if (oData.d && Array.isArray(oData.d.results)) {
                                aHeaders = oData.d.results;
                            }

                            console.log("📌 aHeaders notas:", aHeaders);

                            const mNotesByItem = {};
                            const mSeenLines = {};
                            const bHasMultipleHeaders = aHeaders.length > 1;  // 👈 solo en este caso filtramos duplicados

                            aHeaders.forEach(function (oHeader) {
                                const aItems = (oHeader.toPurOrdNoteItem &&
                                    oHeader.toPurOrdNoteItem.results) || [];

                                aItems.forEach(function (oItem) {
                                    const sItemKey = String(oItem.PurchaseOrderItem || "");
                                    const sLinea = String(oItem.Line || oItem.Linea || "");

                                    const sTextLine =
                                        oItem.NoteItem ||      // tu campo Z
                                        oItem.TextLine ||
                                        oItem.NoteText ||
                                        oItem.LongText ||
                                        oItem.Nota ||
                                        oItem.Content ||
                                        "";

                                    if (!sItemKey || !sTextLine) {
                                        return;
                                    }

                                    // 👉 Clave compuesta: Item + Línea + Texto
                                    const sCompositeKey = [
                                        sItemKey,
                                        sLinea,
                                        sTextLine.trim()
                                    ].join("|");

                                    // 🧠 Solo evitamos duplicar cuando hay MÁS DE UNA cabecera
                                    if (bHasMultipleHeaders) {
                                        if (mSeenLines[sCompositeKey]) {
                                            // Esta combinación ya vino de otra cabecera -> la ignoramos
                                            return;
                                        }
                                        mSeenLines[sCompositeKey] = true;
                                    }

                                    if (!mNotesByItem[sItemKey]) {
                                        mNotesByItem[sItemKey] = sTextLine;
                                    } else {
                                        mNotesByItem[sItemKey] += "\n" + sTextLine;
                                    }
                                });
                            });

                            console.log("✅ mNotesByItem construido (controlando duplicados solo si hay varias cabeceras):", mNotesByItem);
                            resolve(mNotesByItem);
                        },
                        error: function () {
                            resolve({});
                        }
                    });
                });
            });
        },
        _loadNotasDetalle: async function (sSupplierQuotation) {
            const oModel = this.getView().getModel("oModelProyect");
            let aDetalle = oModel.getProperty("/oDetalle") || [];

            if (!aDetalle.length || !sSupplierQuotation) {
                return;
            }

            console.log("🧾 _loadNotasDetalle (estándar) - SQ/PurchaseOrder:", sSupplierQuotation);

            try {
                // 1) Traemos todas las notas estándar de esa oferta/pedido
                const mNotesByItem = await this._getPurOrdNotesMap(sSupplierQuotation);
                console.log("📚 Notas estándar por posición:", mNotesByItem);

                // 2) Recorremos el detalle UI y seteamos las notas por línea
                for (let i = 0; i < aDetalle.length; i++) {
                    const row = aDetalle[i];
                    const vItem = row.SupplierQuotationItem || row.RequestForQuotationItem;
                    const sItemPadded = String(vItem).padStart(5, "0");

                    const sNota = mNotesByItem[sItemPadded] || "";

                    const sBasePath = "/oDetalle/" + i;

                    oModel.setProperty(sBasePath + "/ItemNota", sNota);
                    oModel.setProperty(sBasePath + "/ItemNotaEdit", sNota);
                    oModel.setProperty(sBasePath + "/ItemNotaOfepos", sSupplierQuotation + sItemPadded);
                    oModel.setProperty(
                        sBasePath + "/ItemNotaLineCount",
                        sNota ? sNota.split(/\r?\n/).length : 0
                    );
                    oModel.setProperty(sBasePath + "/_notaItemEditable", false);

                    console.log("✅ Nota estándar seteada en", sBasePath, "=>", sNota);
                }

                oModel.refresh(true);
                console.log("📦 Detalle final con notas estándar:",
                    JSON.stringify(oModel.getProperty("/oDetalle"), null, 2));

            } catch (e) {
                console.error("⚠️ Error en _loadNotasDetalle (estándar):", e);
            }
        },
        _splitInChunks: function (sText, nSize) {
            const aChunks = [];
            if (!sText) {
                return aChunks;
            }
            for (let i = 0; i < sText.length; i += nSize) {
                aChunks.push(sText.substring(i, i + nSize));
            }
            return aChunks;
        },
        _getNotDetail: function (sOfepos) {
            that = this;
            try {
                var oResp = {
                    sEstado: "E",
                    oResults: []   // ⬅️ aquí guardaremos directamente el array de líneas
                };

                return new Promise(function (resolve, reject) {
                    if (!sOfepos) {
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        resolve(oResp);
                        return;
                    }

                    let sUrl = "";
                    const sFilter = encodeURIComponent("Ofepos eq '" + sOfepos + "'");
                    const sQuery = "NotaOfertaSet?$filter=" + sFilter + "&$orderby=Linea asc&$format=json";

                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/" + sQuery;
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZSD_PORTAL_PROVEEDORES_SRV/" + sQuery;
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data || oData;
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
        _deleteNotasOferta: async function (sOfepos) {
            const oModelOData = this.getOwnerComponent().getModel("oModelEntityNote");

            const oResp = await this._getNotDetail(sOfepos);
            const aLines = oResp.oResults || [];   // ⬅️ ya es el array

            if (!aLines.length) {
                return;
            }

            const aPromisesDelete = aLines.map(line => {
                return new Promise((resolve, reject) => {
                    const sKey =
                        "/NotaOfertaSet(Ofepos='" +
                        sOfepos +
                        "',Linea=" + line.Linea + ")";

                    oModelOData.remove(sKey, {
                        success: function () {
                            resolve();
                        },
                        error: function (oError) {
                            console.error("❌ Error borrando nota:", oError);
                            reject(oError);
                        }
                    });
                });
            });

            await Promise.all(aPromisesDelete);
        },
        _buildOfeposItemKey: function (sSupplierQuotation, vItem) {
            if (!sSupplierQuotation || vItem == null) {
                return "";
            }
            const sItem = String(vItem).replace(/^0+/, "");
            const sItemPadded = sItem.padStart(5, "0");
            return sSupplierQuotation + sItemPadded;
        },
        collectTableData: function () {
            const oTable = this.byId("TableDetail");
            const aItems = oTable.getItems();
            const oModel = this.getView().getModel("oModelProyect");
            return aItems.map(item => {
                const oContext = item.getBindingContext("oModelProyect");
                const oData = oContext.getObject();
                return {
                    RequestForQuotationItem: oData.RequestForQuotationItem, // clave para mapear
                    NetPriceAmount: oData.priceUnit || "0.00",
                    ScheduleLineOrderQuantity: oData.cantCotizada || "0.00",
                    ConditionRateValue: oData.Discount || "0.00",
                    SubTotal: oData.SubTotal || "1.00",
                    cantCotizada: oData.cantCotizada || "0.00",
                    ScheduleLineDeliveryDate: oData.FechaEntrega,
                    NoteTypeListText: oData.NoteTypeListText || ""
                };
            });
        },
        //Funcion comentada por Marlon Estefo
        onGuardar: function () {
            const oModel = this.getView().getModel("oModelProyect");
            const bEditMode = !!oModel.getProperty("/bEditMode");

            if (!bEditMode) {
                sap.m.MessageBox.warning("Primero active el modo edición.");
                return;
            }

            try {
                const oCabecera = oModel.getProperty("/oClientCabecera") || {};
                const aDetalle = oModel.getProperty("/oDetalle") || [];

                // Cabecera: solo memoria local
                const sNotaCabEdit = (oCabecera.NotaEdit || "").trim();
                oModel.setProperty("/oClientCabecera/Nota", sNotaCabEdit);
                oModel.setProperty("/oClientCabecera/NotaEdit", sNotaCabEdit);
                oModel.setProperty("/oClientCabecera/_notaEditable", false);

                // Detalle: solo memoria local
                aDetalle.forEach((oItem, i) => {
                    const sNotaItemEdit = (oItem.ItemNotaEdit || "").trim();

                    oModel.setProperty(`/oDetalle/${i}/ItemNota`, sNotaItemEdit);
                    oModel.setProperty(`/oDetalle/${i}/ItemNotaEdit`, sNotaItemEdit);
                    oModel.setProperty(`/oDetalle/${i}/_notaItemEditable`, false);
                    oModel.setProperty(
                        `/oDetalle/${i}/ItemNotaLineCount`,
                        sNotaItemEdit ? sNotaItemEdit.split(/\r?\n/).length : 0
                    );
                });

                // Guardado local terminado
                oModel.setProperty("/bEditMode", false);

                if (this._takeEditSnapshot) {
                    this._takeEditSnapshot();
                }

                oModel.refresh(true);

                console.log("=== [onGuardar] SOLO LOCAL - no se envió nada a SAP ===");
                sap.m.MessageToast.show("Cambios guardados localmente. Se enviarán a SAP al publicar la oferta.");
            } catch (e) {
                console.error("❌ Error en guardado local:", e);
                sap.m.MessageBox.error("No se pudieron guardar los cambios localmente.");
            }
        },
        onExecutePetition: async function () {
            const oModel = this.getView().getModel("oModelProyect");

            sap.ui.core.BusyIndicator.show(0);

            try {
                console.log("========== [onExecutePetition] INICIO ==========");

                let sSupplierQuotation = this._getCurrentSupplierQuotation();
                let sNewHashAfterPublish = "";

                console.log("[onExecutePetition] SupplierQuotation inicial:", sSupplierQuotation);

                // 1) Si no existe oferta, crearla primero
                if (!sSupplierQuotation) {
                    const oCreated = await this._createQuotationFromRFQ(false);
                    sSupplierQuotation = oCreated?.SupplierQuotation || "";
                    sNewHashAfterPublish = oCreated?.NewHash || "";

                    console.log("[onExecutePetition] Oferta creada:", oCreated);

                    if (!sSupplierQuotation) {
                        throw new Error("No se pudo generar el número de oferta.");
                    }

                    oModel.setProperty("/oCabecera/SupplierQuotation", sSupplierQuotation);
                    oModel.setProperty("/oClientCabecera/SupplierQuotation", sSupplierQuotation);
                }

                const sServiceUrl = this._getQtnServiceUrl();

                // 2) Asegurar draft único de trabajo
                let sDraftUUID = oModel.getProperty("/oCabecera/DraftUUIDOffer") || "";
                sDraftUUID = await this._ensureOfferDraftForSave(sSupplierQuotation, sDraftUUID);

                oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUID);
                oModel.setProperty("/oCabecera/LastSavedDraftUUIDOffer", sDraftUUID);

                console.log("[onExecutePetition] DraftUUID de trabajo:", sDraftUUID);
                console.log("[onExecutePetition] LastSavedDraftUUIDOffer:", oModel.getProperty("/oCabecera/LastSavedDraftUUIDOffer"));

                // 3) Persistir posiciones del detalle al MISMO draft
                console.log("[onExecutePetition] Persistiendo posiciones del detalle...");
                await this._persistDraftItemsFromLocalModel(sSupplierQuotation);

                // 4) Guardar nota cabecera
                const sNotaCabecera = (oModel.getProperty("/oClientCabecera/NotaEdit") || "").trim();
                console.log("[onExecutePetition] Nota cabecera a guardar:", sNotaCabecera);

                console.log("========== [DEBUG NOTAS] ANTES DE GUARDAR ==========");
                console.log("[DEBUG NOTAS] SupplierQuotation:", sSupplierQuotation);
                console.log("[DEBUG NOTAS] DraftUUID header:", sDraftUUID);
                console.log("[DEBUG NOTAS] Nota cabecera model /oClientCabecera/NotaEdit:", oModel.getProperty("/oClientCabecera/NotaEdit"));
                console.log("[DEBUG NOTAS] Nota cabecera model /oClientCabecera/Nota:", oModel.getProperty("/oClientCabecera/Nota"));
                console.log("[DEBUG NOTAS] Detalle completo:", JSON.parse(JSON.stringify(oModel.getProperty("/oDetalle") || [])));

                const oHeaderSaveResp = await this._saveHeaderNoteStandard(
                    sSupplierQuotation,
                    sDraftUUID,
                    sNotaCabecera
                );
                console.log("[DEBUG NOTAS] Resultado guardado cabecera:", oHeaderSaveResp);

                // 5) Guardar notas de posición
                console.log("[onExecutePetition] Iniciando guardado de notas de posición...");
                await this._saveAllItemNotesStandard(sSupplierQuotation);
                console.log("[DEBUG NOTAS] Fin guardado de notas de posición");

                // 6) ACTIVAR draft antes del submit
                const sActivateUrl =
                    `${sServiceUrl}C_SuplrQuotationEnhWDActivation?` +
                    `SupplierQuotation='${sSupplierQuotation}'` +
                    `&DraftUUID=guid'${sDraftUUID}'` +
                    `&IsActiveEntity=false`;

                console.log("[onExecutePetition] Activate URL:", sActivateUrl);

                const activateResp = await Services.postoDataERPAsync(
                    this,
                    sServiceUrl,
                    sActivateUrl,
                    {}
                );

                console.log("[onExecutePetition] activateResp:", activateResp);

                // CONSERVAR el draft real para la recarga posterior de notas
                oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUID);
                oModel.setProperty("/oCabecera/LastSavedDraftUUIDOffer", sDraftUUID);

                console.log("[onExecutePetition] DraftUUIDOffer conservado para recarga:", sDraftUUID);
                console.log("[onExecutePetition] LastSavedDraftUUIDOffer conservado:", sDraftUUID);

                // 7) Submit final sobre la entidad activa
                const submitResp = await this._submitQuotationWithRetry(
                    sServiceUrl,
                    sSupplierQuotation,
                    3,
                    1200
                );

                console.log("[onExecutePetition] submitResp:", submitResp);

                const sStatus = submitResp?.d?.QtnLifecycleStatus || "02";
                const sStatusText = submitResp?.d?.QtnLifecycleStatus_Text || "Cotizado";

                oModel.setProperty("/bEditMode", false);

                sap.m.MessageBox.success(
                    `Oferta publicada correctamente.\nCotización: ${sSupplierQuotation}\nEstado: ${sStatus} - ${sStatusText}`,
                    { title: "Éxito - Oferta Enviada" }
                );

                if (sNewHashAfterPublish) {
                    const oHashChanger = this.oRouter.getHashChanger();
                    if (oHashChanger.replaceHash) {
                        oHashChanger.replaceHash(sNewHashAfterPublish);
                    } else {
                        oHashChanger.setHash(sNewHashAfterPublish);
                    }
                }

                console.log("========== [onExecutePetition] FIN OK ==========");
            } catch (error) {
                console.error("❌ [onExecutePetition] ERROR:", error);
                sap.m.MessageBox.error(error.message || "Error al publicar la oferta.");
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },
        onGenerarOferta: async function () {
            const oModel = this.getView().getModel("oModelProyect");
            const oClientCabecera = oModel.getProperty("/oClientCabecera") || {};
            const aDetalle = oModel.getProperty("/oDetalle") || [];
            // Si YA tiene oferta, no volvemos a crearla
            const sExistingQtn =
                (oClientCabecera.SupplierQuotation || "").trim() ||
                (oModel.getProperty("/oCabecera/SupplierQuotation") || "").trim();

            if (sExistingQtn) {
                sap.m.MessageBox.information(
                    "Esta petición ya tiene una oferta asociada: " + sExistingQtn +
                    "\n\nActualice la pantalla o vuelva a ingresar para proceder con la edición.",
                    { title: "Oferta ya existente" }
                );
                return;
            }

            // 2) Datos mínimos para crear desde el RFQ
            const oHashChanger = this.oRouter.getHashChanger();
            const sHash = (oHashChanger.getHash && oHashChanger.getHash()) || oHashChanger.hash || "";
            const aHash = (sHash || "").split("/");

            const sNumPedido = aHash[1] || aDetalle[0].RequestForQuotation;
            const sSupplier = aHash[2] || oClientCabecera.Supplier;

            if (!sNumPedido || !sSupplier) {
                sap.m.MessageBox.error(
                    "No se pudo determinar el número de petición u proveedor para generar la oferta."
                );
                return;
            }

            sap.ui.core.BusyIndicator.show(0);
            try {
                const sServiceUrl =
                    jQuery.sap.getModulePath("com.proveedor.peticionoferta.pe") +
                    "/S4HANA/sap/opu/odata/sap/MM_PUR_QTN_MAINTAIN_SRV/";
                const draftResp = await Services.postoDataERPAsync(
                    this,
                    sServiceUrl,
                    `${sServiceUrl}AAE13DD33FBFA6553F9ACwr_qtn_from_rfq_all?` +
                    `RequestForQuotation='${sNumPedido}'&Supplier='${sSupplier}'`,
                    {}
                );

                const oDraftData = draftResp?.data || draftResp?.d || {};
                const sDraftUUID =
                    oDraftData.DraftUUID ||
                    oDraftData?.results?.[0]?.DraftUUID ||
                    null;

                if (!sDraftUUID) {
                    throw new Error("No se generó DraftUUID al crear el borrador de oferta.");
                }

                oModel.setProperty("/oCabecera/DraftUUID", sDraftUUID);

                // 4) Completar datos obligatorios (MERGE sobre cabecera)
                let sQuotationLatestDate =
                    oDraftData.QuotationLatestSubmissionDate ||
                    oDraftData.results?.[0]?.QuotationLatestSubmissionDate ||
                    `/Date(${new Date().getTime()})/`;

                let sDocType =
                    oDraftData.PurchasingDocumentType ||
                    oDraftData.results?.[0]?.PurchasingDocumentType ||
                    "ZQTN";  // Ajustar si en tu sistema usan otro tipo

                let sFollowOnDocType =
                    oDraftData.FollowOnDocumentType ||
                    "ZP01";  // Ajustar si usan otro tipo de doc. seguimiento

                const sUrlMerge =
                    `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                    `SupplierQuotation='',DraftUUID=guid'${sDraftUUID}',IsActiveEntity=false)`;

                const oBodyMerge = {
                    QuotationSubmissionDate: sQuotationLatestDate,
                    FollowOnDocumentCategory: "F",
                    FollowOnDocumentType: sFollowOnDocType,
                    PurchasingDocumentType: sDocType
                };

                await Services.mergeODataAsync(this, sUrlMerge, oBodyMerge);

                // 5) Activar borrador → genera número de oferta (SupplierQuotation)
                const sUrlActivate =
                    `${sServiceUrl}C_SuplrQuotationEnhWDActivation?` +
                    `SupplierQuotation=''&DraftUUID=guid'${sDraftUUID}'&IsActiveEntity=false`;

                const activeResp = await Services.postoDataERPAsync(
                    this,
                    sServiceUrl,
                    sUrlActivate,
                    {}
                );

                const sSupplierQuotation =
                    activeResp?.d?.SupplierQuotation ||
                    activeResp?.data?.d?.SupplierQuotation ||
                    activeResp?.data?.SupplierQuotation ||
                    activeResp?.SupplierQuotation ||
                    activeResp?.d?.results?.[0]?.SupplierQuotation ||
                    null;


                // 6) Actualizar modelos de cabecera para que conozcan la nueva oferta
                oModel.setProperty("/oCabecera/SupplierQuotation", sSupplierQuotation);
                oModel.setProperty("/oClientCabecera/SupplierQuotation", sSupplierQuotation);

                // 7) Actualizar HASH / URL para incluir el nuevo SupplierQuotation
                aHash[3] = sSupplierQuotation; // Detail/{RFQ}/{Supplier}/{SupplierQuotation}
                const sNewHash = aHash.join("/");
                if (oHashChanger.replaceHash) {
                    oHashChanger.replaceHash(sNewHash);
                } else {
                    oHashChanger.setHash(sNewHash);
                }

                // 8) Mensaje al usuario
                sap.m.MessageBox.information(
                    "Se generó la oferta " + sSupplierQuotation +
                    " para la petición " + sNumPedido + "." +
                    "\n\nLa URL ya fue actualizada con el nuevo número de oferta." +
                    "\nPuede actualizar la página o volver a ingresar a la petición para proceder con la edición.",
                    { title: "Oferta creada correctamente" }
                );

            } catch (e) {
                console.error("❌ Error en onGenerarOferta:", e);
                sap.m.MessageBox.error(
                    e.message || "Ocurrió un error al generar la oferta desde la petición."
                );
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },

        onEditar: async function () {
            const oModel = this.getView().getModel("oModelProyect");
            const oCabecera = oModel.getProperty("/oClientCabecera") || {};
            const aDetalle = oModel.getProperty("/oDetalle") || [];

            if (!aDetalle.length) {
                sap.m.MessageToast.show("No hay detalle para editar.");
                return;
            }

            if (oCabecera.QtnStatus && oCabecera.QtnStatus !== "01") {
                sap.m.MessageBox.error("La petición ya no se puede editar.");
                return;
            }

            oModel.setProperty("/bEditMode", true);
            oModel.setProperty("/aDeletedPositions", []);
            oModel.setProperty("/oClientCabecera/_notaEditable", true);

            aDetalle.forEach((item, idx) => {
                oModel.setProperty(`/oDetalle/${idx}/_notaItemEditable`, true);
            });

            if (this._takeEditSnapshot) {
                this._takeEditSnapshot();
            }

            oModel.refresh(true);
            sap.m.MessageToast.show("Modo edición activado.");
        },
        onLiveCalculate: function (oEvent) {
            var oInput = oEvent.getSource();
            var sNewValue = oEvent.getParameter("value");
            var oContext = oInput.getBindingContext("oModelProyect");
            var oModel = oContext.getModel();
            var oData = oContext.getObject();
            var sField = oInput.getBindingPath("value");

            var cantidad = this._parseNumberValue(oData.cantCotizada);
            var precio = this._parseNumberValue(oData.priceUnit);
            var descuento = this._parseNumberValue(oData.Discount);
            var maximo = this._parseNumberValue(oData.ScheduleLineOrderQuantity);

            if (sField === "cantCotizada") {
                cantidad = this._parseNumberValue(sNewValue);

                if (cantidad > maximo) {
                    oInput.setValueState("Error");
                    oInput.setValueStateText("Cantidad excedida. Máximo permitido: " + maximo.toFixed(2));

                    sap.m.MessageBox.error(
                        "La cantidad ingresada (" + cantidad.toFixed(2) +
                        ") excede la cantidad solicitada (" + maximo.toFixed(2) + ").",
                        { title: "Error en cantidad" }
                    );

                    cantidad = maximo;
                    oModel.setProperty(oContext.getPath() + "/cantCotizada", maximo);
                } else {
                    oInput.setValueState("None");
                    oModel.setProperty(oContext.getPath() + "/cantCotizada", cantidad);
                }
            }

            if (sField === "priceUnit") {
                precio = this._parseNumberValue(sNewValue);
                oModel.setProperty(oContext.getPath() + "/priceUnit", precio);
            }

            if (sField === "Discount") {
                descuento = this._parseNumberValue(sNewValue);

                if (descuento < 0) {
                    descuento = 0;
                }

                if (descuento > 100) {
                    descuento = 100;
                }

                oModel.setProperty(oContext.getPath() + "/Discount", descuento);
            }

            var subtotal = cantidad * precio;
            subtotal -= subtotal * descuento / 100;

            // Se guarda como número. El XML se encarga de mostrarlo como 405,000.00
            oModel.setProperty(oContext.getPath() + "/SubTotal", subtotal);
        },
        _onObjectMatched: function (oEvent) {
            // Obtener parámetros desde la URL
            const sRequestForQuotation = oEvent.getParameter("arguments").app;
            const sSupplier = oEvent.getParameter("arguments").supplier;
            // Guardarlos en el modelo
            const oModel = this.getView().getModel("oModelProyect");
            oModel.setProperty("/oCabecera/RequestForQuotation", sRequestForQuotation);
            oModel.setProperty("/oCabecera/Supplier", sSupplier);
            this._loadDetailData(sRequestForQuotation, sSupplier);
        },
        _loadDetailData: function (sRequestForQuotation, sSupplier) {
            const that = this;
            this._getPetOffert(sRequestForQuotation, sSupplier)
                .then(function (oResp) {
                    if (oResp.sEstado === "S" && oResp.oResults.length) {
                        // Guardar los datos en el modelo
                        that.getView().getModel("oModelProyect").setProperty("/oDetailData", oResp.oResults[0]);
                    } else {
                        sap.m.MessageToast.show("No se encontraron datos para este proveedor.");
                    }
                });
        },
        _formatDateForSAP: function (oDate) {
            if (!oDate) return null;
            try {
                if (oDate instanceof Date) {
                    return "/Date(" + oDate.getTime() + ")/";
                }
                if (typeof oDate === "string" && oDate.includes("-")) {
                    const [year, month, day] = oDate.split("-");
                    const d = new Date(year, month - 1, day);
                    return "/Date(" + d.getTime() + ")/";
                }
                if (typeof oDate === "string" && oDate.includes("/")) {
                    const [day, month, year] = oDate.split("/");
                    const d = new Date(year, month - 1, day);
                    return "/Date(" + d.getTime() + ")/";
                }
                return null;
            } catch (e) {
                console.error("❌ Error formateando fecha SAP:", e);
                return null;
            }
        },
        _formatDateDDMMYYYY: function (sapDate) {
            if (!sapDate) return "";

            try {
                if (sapDate.includes("/Date(")) {
                    const timestamp = parseInt(sapDate.replace(/[^0-9]/g, ""), 10);
                    const date = new Date(timestamp);

                    const day = String(date.getUTCDate()).padStart(2, "0");
                    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
                    const year = date.getUTCFullYear();

                    return `${day}/${month}/${year}`;
                }

                // formato yyyy-mm-dd
                if (sapDate.includes("-")) {
                    const [year, month, day] = sapDate.split("-");
                    return `${day}/${month}/${year}`;
                }

                return sapDate;

            } catch (e) {
                console.warn("⚠️ Error parseando fecha:", sapDate, e);
                return sapDate;
            }
        },
        formatPositive: function (value) {
            if (!value) return "0";
            return Math.abs(Number(value)).toString();
        },

        _parseNumberValue: function (vValue) {
            if (vValue === null || vValue === undefined || vValue === "") {
                return 0;
            }

            if (typeof vValue === "number") {
                return isNaN(vValue) ? 0 : vValue;
            }

            let sValue = String(vValue).trim();

            // Soporta negativos SAP tipo 100.00-
            const bNegative = sValue.endsWith("-");
            sValue = sValue.replace(/-/g, "");

            // Si viene con formato europeo 45.000,00
            if (sValue.indexOf(",") > -1 && sValue.indexOf(".") > -1 && sValue.lastIndexOf(",") > sValue.lastIndexOf(".")) {
                sValue = sValue.replace(/\./g, "").replace(",", ".");
            } else {
                // Formato normal 45,000.00
                sValue = sValue.replace(/,/g, "");
            }

            const nValue = Number(sValue);
            if (isNaN(nValue)) {
                return 0;
            }

            return bNegative ? nValue * -1 : nValue;
        },




        // Logica para las notas de posicion 

        _guidToObjectId: function (sGuid) {
            if (!sGuid) return "";
            return String(sGuid).replace(/-/g, "").toUpperCase();
        },
        _getNoteServiceUrl: function () {
            return (
                jQuery.sap.getModulePath("com.proveedor.peticionoferta.pe") +
                "/S4HANA/sap/opu/odata/sap/SGBT_NTE_CDS_API_D_SRV/"
            );
        },
        _ensureItemDraft: async function (sSupplierQuotation, vItem) {
            const sServiceUrl = this._getQtnServiceUrl();

            console.log("========== [_ensureItemDraft] INICIO ==========");
            console.log("[_ensureItemDraft] sSupplierQuotation:", sSupplierQuotation);
            console.log("[_ensureItemDraft] vItem:", vItem);
            console.log("[_ensureItemDraft] sServiceUrl:", sServiceUrl);

            if (!sSupplierQuotation || vItem == null) {
                console.error("[_ensureItemDraft] ERROR: faltan datos", { sSupplierQuotation, vItem });
                throw new Error("Faltan datos para generar borrador de posición (SQ o item).");
            }

            const sUrlEdit =
                `${sServiceUrl}C_SuplrQuotationEnhWDEdit?` +
                `SupplierQuotation='${sSupplierQuotation}'` +
                `&DraftUUID=guid'00000000-0000-0000-0000-000000000000'` +
                `&IsActiveEntity=true`;

            console.log("[_ensureItemDraft] URL edit cabecera:", sUrlEdit);

            const oEditResp = await Services.postoDataERPAsync(
                this,
                sServiceUrl,
                sUrlEdit,
                {}
            );

            console.log("[_ensureItemDraft] Response edit cabecera:", oEditResp);

            const sDraftUUIDHeader =
                oEditResp?.d?.DraftUUID ||
                oEditResp?.data?.d?.DraftUUID ||
                oEditResp?.data?.DraftUUID ||
                oEditResp?.DraftUUID ||
                null;

            console.log("[_ensureItemDraft] sDraftUUIDHeader:", sDraftUUIDHeader);

            if (!sDraftUUIDHeader) {
                console.error("[_ensureItemDraft] ERROR: no se obtuvo DraftUUIDHeader");
                throw new Error("No se obtuvo DraftUUID de cabecera para la oferta.");
            }

            const oModel = this.getView().getModel("oModelProyect");
            oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUIDHeader);
            oModel.setProperty("/oCabecera/SupplierQuotation", sSupplierQuotation);
            oModel.setProperty("/oClientCabecera/SupplierQuotation", sSupplierQuotation);

            const sItemPadded = String(vItem).padStart(5, "0");
            const sUrlItem =
                `${sServiceUrl}C_SuplrQuotationItemEnhWD(` +
                `SupplierQuotation='${sSupplierQuotation}',` +
                `SupplierQuotationItem='${sItemPadded}',` +
                `DraftUUID=guid'00000000-0000-0000-0000-000000000000',` +
                `IsActiveEntity=true)/SiblingEntity?$format=json`;

            console.log("[_ensureItemDraft] sItemPadded:", sItemPadded);
            console.log("[_ensureItemDraft] URL item sibling:", sUrlItem);

            const oItemResp = await Services.oDataConsultODATAAsync(
                "GET",
                sUrlItem,
                [],
                [],
                "1",
                this
            );

            console.log("[_ensureItemDraft] Response item sibling:", oItemResp);

            const sDraftUUIDItem =
                oItemResp?.d?.DraftUUID ||
                oItemResp?.DraftUUID ||
                null;

            console.log("[_ensureItemDraft] sDraftUUIDItem:", sDraftUUIDItem);

            if (!sDraftUUIDItem) {
                console.error("[_ensureItemDraft] ERROR: no se obtuvo DraftUUIDItem");
                throw new Error("No se obtuvo DraftUUID de posición para la oferta.");
            }

            const sObjectIDItem = this._guidToObjectId(sDraftUUIDItem);
            console.log("[_ensureItemDraft] sObjectIDItem:", sObjectIDItem);

            const oResult = {
                DraftUUIDHeader: sDraftUUIDHeader,
                DraftUUIDItem: sDraftUUIDItem,
                ObjectIDItem: sObjectIDItem,
                ItemPadded: sItemPadded
            };

            console.log("[_ensureItemDraft] Resultado:", JSON.parse(JSON.stringify(oResult)));
            console.log("========== [_ensureItemDraft] FIN OK ==========");

            return oResult;
        },
        _saveItemNoteStandard: async function (sSupplierQuotation, oItemDraftInfo, sNota) {
            const sNoteServiceUrl = this._getNoteServiceUrl();

            console.log("========== [_saveItemNoteStandard] INICIO ==========");
            console.log("[_saveItemNoteStandard] sSupplierQuotation:", sSupplierQuotation);
            console.log("[_saveItemNoteStandard] oItemDraftInfo:", JSON.parse(JSON.stringify(oItemDraftInfo || {})));
            console.log("[_saveItemNoteStandard] sNota raw:", sNota);
            console.log("[_saveItemNoteStandard] sNota trim:", (sNota || "").trim());
            console.log("[_saveItemNoteStandard] sNoteServiceUrl:", sNoteServiceUrl);

            if (!oItemDraftInfo || !oItemDraftInfo.ObjectIDItem) {
                console.error("[_saveItemNoteStandard] ERROR: faltan datos de borrador de posición", oItemDraftInfo);
                throw new Error("Faltan datos de borrador de posición para nota estándar.");
            }

            if (!sNota) {
                console.log("[_saveItemNoteStandard] Modo: ELIMINAR nota ITEM_NOTE");

                const sFilterStr =
                    `ObjectID eq '${oItemDraftInfo.ObjectIDItem}' ` +
                    `and ObjectNodeType eq 'SupplierQuotationItem' ` +
                    `and IsActiveEntity eq false ` +
                    `and NoteType eq 'ITEM_NOTE'`;

                const sUrlSelect =
                    `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                    `?$select=NoteID` +
                    `&$filter=${encodeURIComponent(sFilterStr)}` +
                    `&$format=json`;

                console.log("[_saveItemNoteStandard] DELETE filter:", sFilterStr);
                console.log("[_saveItemNoteStandard] DELETE select URL:", sUrlSelect);

                const oResp = await Services.oDataConsultODATAAsync(
                    "GET",
                    sUrlSelect,
                    [],
                    [],
                    "1",
                    this
                );

                console.log("[_saveItemNoteStandard] DELETE select response:", oResp);

                const aResults = oResp?.d?.results || [];
                console.log("[_saveItemNoteStandard] DELETE aResults:", aResults);

                if (aResults.length) {
                    const aDelPromises = aResults.map(oNote => {
                        const sEntityUrl =
                            `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp(` +
                            `NoteID=guid'${oNote.NoteID}',` +
                            `IsActiveEntity=false)`;

                        console.log("[_saveItemNoteStandard] DELETE entity URL:", sEntityUrl);

                        return Services.postoDataERPWithHeadersAsync(
                            this,
                            sNoteServiceUrl,
                            sEntityUrl,
                            {},
                            { "X-HTTP-Method": "DELETE" }
                        );
                    });

                    const aDeleteResp = await Promise.all(aDelPromises);
                    console.log("[_saveItemNoteStandard] DELETE responses:", aDeleteResp);
                } else {
                    console.warn("[_saveItemNoteStandard] No se encontraron notas para eliminar.");
                }
            } else {
                console.log("[_saveItemNoteStandard] Modo: CREAR / ACTUALIZAR nota ITEM_NOTE");

                const sCollectionPath = `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp`;

                const oBody = {
                    "__metadata": {
                        "type": "SGBT_NTE_CDS_API_D_SRV.C_Sgbt_Nte_Cds_ApitpType"
                    },
                    "ObjectNodeType": "SupplierQuotationItem",
                    "ObjectID": oItemDraftInfo.ObjectIDItem,
                    "NoteType": "ITEM_NOTE",
                    "Language": "ES",
                    "Content": sNota,
                    "IsActiveEntity": false
                };

                const oHeaders = {
                    "gbtnte-noteTypes": "ITEM_NOTE",
                    "gbtnte-objectId": sSupplierQuotation + oItemDraftInfo.ItemPadded,
                    "gbtnte-objectNodeType": "SupplierQuotationItem"
                };

                console.log("[_saveItemNoteStandard] POST collection path:", sCollectionPath);
                console.log("[_saveItemNoteStandard] POST body:", JSON.parse(JSON.stringify(oBody)));
                console.log("[_saveItemNoteStandard] POST headers:", JSON.parse(JSON.stringify(oHeaders)));
                console.log("[_saveItemNoteStandard] ObjectIDItem:", oItemDraftInfo.ObjectIDItem);
                console.log("[_saveItemNoteStandard] ItemPadded:", oItemDraftInfo.ItemPadded);
                console.log("[_saveItemNoteStandard] Header gbtnte-objectId:", sSupplierQuotation + oItemDraftInfo.ItemPadded);
                console.log("[_saveItemNoteStandard] DraftUUIDHeader:", oItemDraftInfo.DraftUUIDHeader);
                console.log("[_saveItemNoteStandard] DraftUUIDItem:", oItemDraftInfo.DraftUUIDItem);

                const oPostResp = await Services.postoDataERPWithHeadersAsync(
                    this,
                    sNoteServiceUrl,
                    sCollectionPath,
                    oBody,
                    oHeaders
                );

                console.log("[_saveItemNoteStandard] POST response:", oPostResp);
            }

            // Activar borrador de cabecera
            const sQtnServiceUrl = this._getQtnServiceUrl();
            const sActivateUrl =
                `${sQtnServiceUrl}C_SuplrQuotationEnhWDActivation?` +
                `SupplierQuotation='${sSupplierQuotation}'` +
                `&DraftUUID=guid'${oItemDraftInfo.DraftUUIDHeader}'` +
                `&IsActiveEntity=false`;

            console.log("[_saveItemNoteStandard] Activate service URL:", sQtnServiceUrl);
            console.log("[_saveItemNoteStandard] Activate URL:", sActivateUrl);

            const oActivateResp = await Services.postNoBodyERPAsync(
                this,
                sQtnServiceUrl,
                sActivateUrl
            );

            console.log("[_saveItemNoteStandard] Activate response:", oActivateResp);
            console.log("========== [_saveItemNoteStandard] FIN OK ==========");
        },
        _saveAllItemNotesStandard: async function (sSupplierQuotation) {
            const oModel = this.getView().getModel("oModelProyect");
            const aDetalle = oModel.getProperty("/oDetalle") || [];
            const sServiceUrl = this._getQtnServiceUrl();

            console.log("========== [_saveAllItemNotesStandard] INICIO ==========");
            console.log("[_saveAllItemNotesStandard] SupplierQuotation:", sSupplierQuotation);
            console.log("[_saveAllItemNotesStandard] aDetalle inicial:", JSON.parse(JSON.stringify(aDetalle)));

            if (!sSupplierQuotation || !aDetalle.length) {
                console.log("[_saveAllItemNotesStandard] No hay SupplierQuotation o no hay detalle. Se omite.");
                console.log("========== [_saveAllItemNotesStandard] FIN SIN PROCESAR ==========");
                return;
            }

            let sDraftUUIDHeader = oModel.getProperty("/oCabecera/DraftUUIDOffer") || "";
            console.log("[_saveAllItemNotesStandard] DraftUUIDHeader inicial modelo:", sDraftUUIDHeader);

            sDraftUUIDHeader = await this._ensureOfferDraftForSave(sSupplierQuotation, sDraftUUIDHeader);
            oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUIDHeader);

            console.log("[_saveAllItemNotesStandard] DraftUUIDHeader final:", sDraftUUIDHeader);
            console.log("[_saveAllItemNotesStandard] ObjectID header:", this._guidToObjectId(sDraftUUIDHeader));

            const sItemsUrl =
                `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                `SupplierQuotation='${sSupplierQuotation}',` +
                `DraftUUID=guid'${sDraftUUIDHeader}',` +
                `IsActiveEntity=false)/to_SuplrQuotationItemEnhWD?$format=json`;

            console.log("[_saveAllItemNotesStandard] URL lectura items draft:", sItemsUrl);

            const oItemsResp = await Services.oDataConsultODATAAsync(
                "GET",
                sItemsUrl,
                [],
                [],
                "1",
                this
            );

            const aItemsDraft = oItemsResp?.d?.results || [];
            console.log("[_saveAllItemNotesStandard] aItemsDraft leídos:", JSON.parse(JSON.stringify(aItemsDraft)));

            const mItemsByReqItem = {};
            aItemsDraft.forEach(item => {
                const sReqItem = String(
                    item.RequestForQuotationItem ||
                    item.SupplierQuotationItem ||
                    ""
                ).padStart(5, "0");

                mItemsByReqItem[sReqItem] = item;
            });

            console.log("[_saveAllItemNotesStandard] mItemsByReqItem:", JSON.parse(JSON.stringify(mItemsByReqItem)));

            for (let i = 0; i < aDetalle.length; i++) {
                const oItem = aDetalle[i];
                const sNota = (oItem.ItemNotaEdit || "").trim();

                const sReqItem = String(
                    oItem.RequestForQuotationItem ||
                    oItem.SupplierQuotationItem ||
                    ""
                ).padStart(5, "0");

                console.log("--------------------------------------------------");
                console.log(`[_saveAllItemNotesStandard] Procesando índice ${i}`);
                console.log("[_saveAllItemNotesStandard] oItem modelo:", JSON.parse(JSON.stringify(oItem)));
                console.log("[_saveAllItemNotesStandard] sReqItem:", sReqItem);
                console.log("[_saveAllItemNotesStandard] ItemNota:", oItem.ItemNota);
                console.log("[_saveAllItemNotesStandard] ItemNotaEdit:", oItem.ItemNotaEdit);
                console.log("[_saveAllItemNotesStandard] sNota(trim):", sNota);

                const oItemDraft = mItemsByReqItem[sReqItem];

                if (!oItemDraft) {
                    console.warn("[_saveAllItemNotesStandard] No se encontró item draft para nota:", sReqItem);
                    continue;
                }

                console.log("[_saveAllItemNotesStandard] oItemDraft encontrado:", JSON.parse(JSON.stringify(oItemDraft)));

                const sSupplierQuotationItem = String(
                    oItemDraft.SupplierQuotationItem || sReqItem
                ).padStart(5, "0");

                const sDraftUUIDItem = oItemDraft?.DraftUUID || sDraftUUIDHeader || "";

                console.log("[_saveAllItemNotesStandard] sSupplierQuotationItem:", sSupplierQuotationItem);
                console.log("[_saveAllItemNotesStandard] sDraftUUIDItem:", sDraftUUIDItem);
                console.log("[_saveAllItemNotesStandard] ObjectIDItem:", this._guidToObjectId(sDraftUUIDItem));

                if (!sDraftUUIDItem) {
                    console.warn("[_saveAllItemNotesStandard] No se obtuvo DraftUUIDItem para nota:", sReqItem);
                    continue;
                }

                const oItemDraftInfo = {
                    DraftUUIDHeader: sDraftUUIDHeader,
                    DraftUUIDItem: sDraftUUIDItem,
                    ObjectIDItem: this._guidToObjectId(sDraftUUIDItem),
                    ItemPadded: sSupplierQuotationItem
                };

                console.log("[_saveAllItemNotesStandard] oItemDraftInfo a enviar:", JSON.parse(JSON.stringify(oItemDraftInfo)));

                try {
                    const oRespItem = await this._saveItemNoteStandardNoActivate(
                        sSupplierQuotation,
                        oItemDraftInfo,
                        sNota
                    );

                    console.log("[_saveAllItemNotesStandard] Resultado _saveItemNoteStandardNoActivate:", oRespItem);
                } catch (eItem) {
                    console.error("[_saveAllItemNotesStandard] Error guardando nota de item:", {
                        index: i,
                        sReqItem,
                        sSupplierQuotationItem,
                        sDraftUUIDItem,
                        ObjectIDItem: oItemDraftInfo.ObjectIDItem,
                        error: eItem
                    });
                    throw eItem;
                }

                oModel.setProperty(`/oDetalle/${i}/ItemNota`, sNota);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaEdit`, sNota);
                oModel.setProperty(`/oDetalle/${i}/_notaItemEditable`, false);
                oModel.setProperty(
                    `/oDetalle/${i}/ItemNotaOfepos`,
                    this._buildOfeposItemKey(sSupplierQuotation, sSupplierQuotationItem)
                );
                oModel.setProperty(
                    `/oDetalle/${i}/ItemNotaLineCount`,
                    sNota ? sNota.split(/\r?\n/).length : 0
                );

                console.log("[_saveAllItemNotesStandard] Modelo actualizado para índice:", i, {
                    ItemNota: oModel.getProperty(`/oDetalle/${i}/ItemNota`),
                    ItemNotaEdit: oModel.getProperty(`/oDetalle/${i}/ItemNotaEdit`),
                    _notaItemEditable: oModel.getProperty(`/oDetalle/${i}/_notaItemEditable`),
                    ItemNotaOfepos: oModel.getProperty(`/oDetalle/${i}/ItemNotaOfepos`),
                    ItemNotaLineCount: oModel.getProperty(`/oDetalle/${i}/ItemNotaLineCount`)
                });
            }

            oModel.refresh(true);

            console.log("[_saveAllItemNotesStandard] /oDetalle final modelo:", JSON.parse(JSON.stringify(oModel.getProperty("/oDetalle") || [])));
            console.log("========== [_saveAllItemNotesStandard] FIN OK ==========");
        },
        _saveHeaderNoteStandard: async function (sSupplierQuotation, sDraftUUID, sNota) {
            const sObjectId = this._guidToObjectId(sDraftUUID);
            const sNoteServiceUrl = this._getNoteServiceUrl();

            console.log("========== [_saveHeaderNoteStandard] INICIO ==========");
            console.log("[_saveHeaderNoteStandard] SupplierQuotation:", sSupplierQuotation);
            console.log("[_saveHeaderNoteStandard] DraftUUID:", sDraftUUID);
            console.log("[_saveHeaderNoteStandard] ObjectID convertido:", sObjectId);
            console.log("[_saveHeaderNoteStandard] Nota recibida:", sNota);

            const sFilterStr =
                `ObjectID eq '${sObjectId}' ` +
                `and ObjectNodeType eq 'SupplierQuotation' ` +
                `and IsActiveEntity eq false ` +
                `and NoteType eq 'NOTE_FROM_SUPPLIER'`;

            const sUrlSelect =
                `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                `?$select=NoteID,ObjectID,ObjectNodeType,Content,NoteType,Language,IsActiveEntity` +
                `&$filter=${encodeURIComponent(sFilterStr)}` +
                `&$format=json`;

            console.log("[_saveHeaderNoteStandard] URL búsqueda previa:", sUrlSelect);

            const oPrev = await Services.oDataConsultODATAAsync(
                "GET",
                sUrlSelect,
                [],
                [],
                "1",
                this
            );

            console.log("[_saveHeaderNoteStandard] Notas existentes antes de guardar:", oPrev?.d?.results || []);

            if (!String(sNota || "").trim()) {
                const aResults = oPrev?.d?.results || [];

                for (const oNote of aResults) {
                    const sEntityUrl =
                        `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp(` +
                        `NoteID=guid'${oNote.NoteID}',` +
                        `IsActiveEntity=false)`;

                    console.log("[_saveHeaderNoteStandard] DELETE nota cabecera URL:", sEntityUrl);

                    await Services.postoDataERPWithHeadersAsync(
                        this,
                        sNoteServiceUrl,
                        sEntityUrl,
                        {},
                        { "X-HTTP-Method": "DELETE" }
                    );
                }

                const oAfterDelete = await Services.oDataConsultODATAAsync(
                    "GET",
                    sUrlSelect,
                    [],
                    [],
                    "1",
                    this
                );

                console.log("[_saveHeaderNoteStandard] Notas después de DELETE:", oAfterDelete?.d?.results || []);
                console.log("========== [_saveHeaderNoteStandard] FIN DELETE ==========");
                return oAfterDelete?.d?.results || [];
            }

            const sCollectionPath = `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp`;

            const oBody = {
                "__metadata": {
                    "type": "SGBT_NTE_CDS_API_D_SRV.C_Sgbt_Nte_Cds_ApitpType"
                },
                "ObjectNodeType": "SupplierQuotation",
                "ObjectID": sObjectId,
                "NoteType": "NOTE_FROM_SUPPLIER",
                "Language": "ES",
                "Content": sNota,
                "IsActiveEntity": false
            };

            const oHeaders = {
                "gbtnte-noteTypes": "DETAILED_DESCRIPTION,INTERNAL_MEMO,NOTE_FROM_SUPPLIER",
                "gbtnte-objectId": sSupplierQuotation,
                "gbtnte-objectNodeType": "SupplierQuotation"
            };

            console.log("[_saveHeaderNoteStandard] POST body:", oBody);
            console.log("[_saveHeaderNoteStandard] POST headers:", oHeaders);

            const oPostResp = await Services.postoDataERPWithHeadersAsync(
                this,
                sNoteServiceUrl,
                sCollectionPath,
                oBody,
                oHeaders
            );

            console.log("[_saveHeaderNoteStandard] Respuesta POST:", oPostResp);

            const oAfter = await Services.oDataConsultODATAAsync(
                "GET",
                sUrlSelect,
                [],
                [],
                "1",
                this
            );

            console.log("[_saveHeaderNoteStandard] Notas después de guardar:", oAfter?.d?.results || []);
            console.log("========== [_saveHeaderNoteStandard] FIN OK ==========");

            return oAfter?.d?.results || [];
        },
        onNotaItemEditPress: function () {
            const oView = this.getView();
            const oModel = oView.getModel("oModelProyect");
            const oTable = oView.byId("TableDetail");

            if (!oTable) {
                sap.m.MessageBox.error("No se encontró la tabla de detalle.");
                return;
            }

            const aSelected = oTable.getSelectedItems() || [];

            if (!aSelected.length) {
                sap.m.MessageBox.warning("Seleccione una línea para editar la nota.");
                return;
            }

            if (aSelected.length > 1) {
                sap.m.MessageBox.warning("Solo puede editar la nota de una línea a la vez.");
                return;
            }

            const oCtx = aSelected[0].getBindingContext("oModelProyect");
            if (!oCtx) {
                sap.m.MessageBox.error("No se pudo obtener la información de la línea seleccionada.");
                return;
            }

            const sRowPath = oCtx.getPath();
            const aDetalle = oModel.getProperty("/oDetalle") || [];

            aDetalle.forEach((r, idx) => {
                oModel.setProperty(`/oDetalle/${idx}/_notaItemEditable`, false);
            });

            oModel.setProperty(sRowPath + "/_notaItemEditable", true);
            oModel.refresh(true);

            sap.m.MessageToast.show("La línea se ha activado para editar la nota localmente.");
        },
        onNotaItemSavePress: function () {
            const oView = this.getView();
            const oModel = oView.getModel("oModelProyect");
            const oTable = oView.byId("TableDetail");

            if (!oTable) {
                sap.m.MessageBox.error("No se encontró la tabla de detalle.");
                return;
            }

            const aSelected = oTable.getSelectedItems() || [];

            if (!aSelected.length) {
                sap.m.MessageBox.warning("Seleccione una línea para guardar la nota.");
                return;
            }

            if (aSelected.length > 1) {
                sap.m.MessageBox.warning("Solo puede guardar la nota de una línea a la vez.");
                return;
            }

            const oCtx = aSelected[0].getBindingContext("oModelProyect");
            if (!oCtx) {
                sap.m.MessageBox.error("No se pudo obtener la información de la línea seleccionada.");
                return;
            }

            const sPath = oCtx.getPath();
            const oRow = oCtx.getObject() || {};
            const sNotaNew = (oRow.ItemNotaEdit || "").trim();
            const sNotaOld = (oRow.ItemNota || "").trim();

            if (sNotaNew === sNotaOld) {
                oModel.setProperty(sPath + "/_notaItemEditable", false);
                oModel.refresh(true);
                sap.m.MessageToast.show("No hay cambios en la nota de la línea.");
                return;
            }

            oModel.setProperty(sPath + "/ItemNota", sNotaNew);
            oModel.setProperty(sPath + "/ItemNotaEdit", sNotaNew);
            oModel.setProperty(sPath + "/_notaItemEditable", false);
            oModel.setProperty(
                sPath + "/ItemNotaLineCount",
                sNotaNew ? sNotaNew.split(/\r?\n/).length : 0
            );

            oModel.refresh(true);

            console.log("=== [onNotaItemSavePress] SOLO LOCAL - sin envío a SAP ===");
            sap.m.MessageToast.show("Nota guardada localmente. Se enviará a SAP al publicar la oferta.");
        },
        // oData que sirve para las posiciones 
        _getPetOffert: function (sRequestForQuotation, sSupplier, sSupplierQuotation) {
            try {
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };

                return new Promise(function (resolve, reject) {
                    let sUrl = "";

                    // 🧩 Construimos el $filter dinámico: RFQ + Supplier + SupplierQuotation
                    const aFilterParts = [];

                    if (sSupplier) {
                        aFilterParts.push("Supplier eq '" + sSupplier + "'");
                    }
                    if (sRequestForQuotation) {
                        aFilterParts.push("RequestForQuotation eq '" + sRequestForQuotation + "'");
                    }
                    if (sSupplierQuotation) {
                        aFilterParts.push("SupplierQuotation eq '" + sSupplierQuotation + "'");
                    }

                    if (!aFilterParts.length) {
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        resolve(oResp);
                        return;
                    }

                    const sFilter = aFilterParts.join(" and ");
                    const sFilterEncoded = encodeURIComponent(sFilter);

                    if (that.local) {
                        const sPath =
                            "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVPEOFERTA" +
                            "?$top=10000&$format=json&sap-language=es-ES&$filter=" + sFilterEncoded;
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath =
                            jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVPEOFERTA" +
                            "?$top=10000&$format=json&sap-language=es-ES&$filter=" + sFilterEncoded;
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData, message) {
                                let aResults = oData.data || [];

                                // Por seguridad sigues dejando único por RFQ+Supplier
                                const aFiltered = aResults.filter((obj, index, self) =>
                                    index === self.findIndex(t =>
                                        t.RequestForQuotation === obj.RequestForQuotation &&
                                        t.Supplier === obj.Supplier
                                    )
                                );

                                aFiltered.sort((a, b) => (a.NameSupplier > b.NameSupplier ? 1 : -1));

                                oResp.sEstado = "S";
                                oResp.oResults = aFiltered;
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
        _getPedidoDetalle: function (sNumPedido, sSupplier, sSupplierQuotation) {
            that = this;
            console.log("=== ENTRO A _getPedidoDetalle ===");
            try {
                var oResp = { sEstado: "E", oResults: [] };

                return new Promise(function (resolve, reject) {
                    let sUrl = "";

                    // 👉 Siempre aplicamos RFQ + Supplier
                    const aFilterParts = [];

                    if (sNumPedido) {
                        aFilterParts.push("RequestForQuotation eq '" + sNumPedido + "'");
                    }
                    if (sSupplier) {
                        aFilterParts.push("Supplier eq '" + sSupplier + "'");
                    }
                    // 👇 Solo se añade SupplierQuotation si viene
                    if (sSupplierQuotation) {
                        aFilterParts.push("SupplierQuotation eq '" + sSupplierQuotation + "'");
                    }

                    if (!aFilterParts.length) {
                        // Nada que filtrar → retorno vacío “correcto”
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        resolve(oResp);
                        return;
                    }

                    const sFilter = aFilterParts.join(" and ");
                    const sFilterEncoded = encodeURIComponent(sFilter);

                    if (that.local) {
                        const sPath =
                            "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVDAPOSICION" +
                            "?$top=10000&$format=json&sap-language=es-ES&$filter=" + sFilterEncoded;
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath =
                            jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVDAPOSICION" +
                            "?$top=10000&$format=json&sap-language=es-ES&$filter=" + sFilterEncoded;
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
        _getDiscount: function (sSupplierQuotation) {
            that = this;
            try {
                var oResp = {
                    "sEstado": "E",
                    "oResults": []
                };
                return new Promise(function (resolve, reject) {
                    let sUrl = "";
                    if (that.local) {
                        const sPath = "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ConDes?$top=10000&$format=json&sap-language=es-ES&$filter=SupplierQuotation  eq '" + sSupplierQuotation + "'";
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath = jQuery.sap.getModulePath(that.route) + "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ConDes?$top=10000&$format=json&sap-language=es-ES&$filter=SupplierQuotation  eq '" + sSupplierQuotation + "'";
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

        _getQtnServiceUrl: function () {
            return jQuery.sap.getModulePath("com.proveedor.peticionoferta.pe") +
                "/S4HANA/sap/opu/odata/sap/MM_PUR_QTN_MAINTAIN_SRV/";
        },

        _ensureOfferDraftForSave: async function (sSupplierQuotation, sDraftUUIDOffer) {
            const sServiceUrl = this._getQtnServiceUrl();
            const oModel = this.getView().getModel("oModelProyect");

            console.log("========== [_ensureOfferDraftForSave] INICIO ==========");
            console.log("[_ensureOfferDraftForSave] SupplierQuotation:", sSupplierQuotation);
            console.log("[_ensureOfferDraftForSave] DraftUUIDOffer recibido:", sDraftUUIDOffer);

            if (!sSupplierQuotation) {
                throw new Error("No existe SupplierQuotation para preparar el draft de oferta.");
            }

            // 1) Si vino draft, validar si todavía existe
            if (sDraftUUIDOffer) {
                try {
                    const sCheckUrl =
                        `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                        `SupplierQuotation='${sSupplierQuotation}',` +
                        `DraftUUID=guid'${sDraftUUIDOffer}',` +
                        `IsActiveEntity=false)?$format=json`;

                    console.log("[_ensureOfferDraftForSave] Validando draft existente:", sCheckUrl);

                    const oCheck = await Services.oDataConsultODATAAsync(
                        "GET",
                        sCheckUrl,
                        [],
                        [],
                        "1",
                        this
                    );

                    const oData = oCheck?.d || oCheck?.data || oCheck;
                    if (oData) {
                        console.log("[_ensureOfferDraftForSave] Draft existente válido, se reutiliza.");

                        oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUIDOffer);
                        oModel.setProperty("/oCabecera/SupplierQuotation", sSupplierQuotation);
                        oModel.setProperty("/oClientCabecera/SupplierQuotation", sSupplierQuotation);

                        return sDraftUUIDOffer;
                    }
                } catch (e) {
                    console.warn("[_ensureOfferDraftForSave] Draft inválido o ya activado. Se recreará.", e);

                    // limpiar draft muerto
                    oModel.setProperty("/oCabecera/DraftUUIDOffer", "");
                    sDraftUUIDOffer = "";
                }
            }

            // 2) Crear nuevo draft editable
            const sEditUrl =
                `${sServiceUrl}C_SuplrQuotationEnhWDEdit?` +
                `SupplierQuotation='${sSupplierQuotation}'` +
                `&DraftUUID=guid'00000000-0000-0000-0000-000000000000'` +
                `&IsActiveEntity=true` +
                `&PreserveChanges=false`;

            console.log("[_ensureOfferDraftForSave] Recreando draft con URL:", sEditUrl);

            const oResp = await Services.postoDataERPAsync(
                this,
                sServiceUrl,
                sEditUrl,
                {}
            );

            const sNewDraftUUID =
                oResp?.d?.DraftUUID ||
                oResp?.data?.d?.DraftUUID ||
                oResp?.data?.DraftUUID ||
                oResp?.DraftUUID ||
                oResp?.d?.results?.[0]?.DraftUUID ||
                "";

            console.log("[_ensureOfferDraftForSave] Nuevo DraftUUID:", sNewDraftUUID);

            if (!sNewDraftUUID) {
                throw new Error("No se pudo recrear el borrador editable de la oferta.");
            }

            oModel.setProperty("/oCabecera/DraftUUIDOffer", sNewDraftUUID);
            oModel.setProperty("/oCabecera/SupplierQuotation", sSupplierQuotation);
            oModel.setProperty("/oClientCabecera/SupplierQuotation", sSupplierQuotation);
            oModel.refresh(true);

            console.log("========== [_ensureOfferDraftForSave] FIN OK ==========");

            return sNewDraftUUID;
        },


        onEliminarPosiciones: function () {
            const oTable = this.byId("TableDetail");
            const oModel = this.getView().getModel("oModelProyect");
            const aSelected = oTable.getSelectedItems() || [];

            if (!aSelected.length) {
                sap.m.MessageBox.warning("Seleccione al menos una posición para eliminar.");
                return;
            }

            const bEditMode = !!oModel.getProperty("/bEditMode");
            if (!bEditMode) {
                sap.m.MessageBox.warning("Primero active el modo edición.");
                return;
            }

            let aDetalle = oModel.getProperty("/oDetalle") || [];
            let aDeleted = oModel.getProperty("/aDeletedPositions") || [];

            const aIndexData = aSelected.map(oItem => {
                const oCtx = oItem.getBindingContext("oModelProyect");
                const oRow = oCtx.getObject();
                const iIndex = parseInt(oCtx.getPath().split("/").pop(), 10);

                return {
                    index: iIndex,
                    row: JSON.parse(JSON.stringify(oRow))
                };
            }).sort((a, b) => b.index - a.index);

            aIndexData.forEach(entry => {
                aDeleted.push(entry.row);
                aDetalle.splice(entry.index, 1);
            });

            oModel.setProperty("/aDeletedPositions", aDeleted);
            oModel.setProperty("/oDetalle", aDetalle);

            oTable.removeSelections(true);
            oModel.refresh(true);

            sap.m.MessageToast.show("Posiciones eliminadas de la edición actual.");
        },
        onNotaCabeceraEditPress: function () {
            const oModel = this.getView().getModel("oModelProyect");
            oModel.setProperty("/oClientCabecera/_notaEditable", true);
            sap.m.MessageToast.show("Edición de observación habilitada.");
        },

        onNotaCabeceraSavePress: function () {
            const oModel = this.getView().getModel("oModelProyect");
            const sNota = (oModel.getProperty("/oClientCabecera/NotaEdit") || "").trim();

            oModel.setProperty("/oClientCabecera/Nota", sNota);
            oModel.setProperty("/oClientCabecera/NotaEdit", sNota);
            oModel.setProperty("/oClientCabecera/_notaEditable", false);
            oModel.refresh(true);

            console.log("=== [onNotaCabeceraSavePress] SOLO LOCAL - sin envío a SAP ===");
            sap.m.MessageToast.show("Observación guardada localmente. Se enviará a SAP al publicar la oferta.");
        },
        _prepareInitialDraftFromRFQ: async function (sNumPedido, sSupplier) {
            const oModel = this.getView().getModel("oModelProyect");

            if (!sNumPedido || !sSupplier) {
                throw new Error("No se pudo determinar la petición y el proveedor para preparar el borrador.");
            }

            const sServiceUrl = this._getQtnServiceUrl();

            let sDraftUUID = oModel.getProperty("/oCabecera/DraftUUID") || "";

            // Si todavía no existe draft inicial, crearlo
            if (!sDraftUUID) {
                const oDraftResp = await Services.postoDataERPAsync(
                    this,
                    sServiceUrl,
                    `${sServiceUrl}AAE13DD33FBFA6553F9ACwr_qtn_from_rfq_all?RequestForQuotation='${sNumPedido}'&Supplier='${sSupplier}'`,
                    {}
                );

                const oDraftData = oDraftResp?.data || oDraftResp?.d || {};

                sDraftUUID =
                    oDraftData.DraftUUID ||
                    oDraftData?.results?.[0]?.DraftUUID ||
                    "";

                if (!sDraftUUID) {
                    throw new Error("No se generó DraftUUID al preparar el borrador inicial.");
                }

                let sQuotationLatestDate =
                    oDraftData.QuotationLatestSubmissionDate ||
                    oDraftData?.results?.[0]?.QuotationLatestSubmissionDate ||
                    `/Date(${new Date().getTime()})/`;

                let sDocType =
                    oDraftData.PurchasingDocumentType ||
                    oDraftData?.results?.[0]?.PurchasingDocumentType ||
                    "ZQTN";

                let sFollowOnDocType =
                    oDraftData.FollowOnDocumentType ||
                    "ZP01";

                const sUrlMerge =
                    `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                    `SupplierQuotation='',DraftUUID=guid'${sDraftUUID}',IsActiveEntity=false)`;

                const oBodyMerge = {
                    QuotationSubmissionDate: sQuotationLatestDate,
                    FollowOnDocumentCategory: "F",
                    FollowOnDocumentType: sFollowOnDocType,
                    PurchasingDocumentType: sDocType
                };

                await Services.mergeODataAsync(this, sUrlMerge, oBodyMerge);

                oModel.setProperty("/oCabecera/DraftUUID", sDraftUUID);
            }

            // Consultar posiciones del draft SIN activar todavía la oferta
            const oPosResp = await Services.oDataConsultODATAAsync(
                "GET",
                `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                `SupplierQuotation='',DraftUUID=guid'${sDraftUUID}',IsActiveEntity=false)` +
                `/to_SuplrQuotationItemEnhWD?$format=json`,
                [],
                [],
                "1",
                this
            );

            const aPosicionesSAP = oPosResp?.d?.results || [];

            // Intentar obtener descuentos de cada ítem
            const aDetalle = await Promise.all(aPosicionesSAP.map(async (pos) => {
                const sSupplierQuotationItem = pos.SupplierQuotationItem || "";
                let fDiscount = 0;

                try {
                    const oCondResp = await Services.oDataConsultODATAAsync(
                        "GET",
                        `${sServiceUrl}C_SuplrQuotationItemEnhWD(` +
                        `SupplierQuotation='',` +
                        `SupplierQuotationItem='${sSupplierQuotationItem}',` +
                        `DraftUUID=guid'${sDraftUUID}',` +
                        `IsActiveEntity=false)/to_QTNPricingElementWD?$format=json`,
                        [],
                        [],
                        "1",
                        this
                    );

                    const aPricing = oCondResp?.d?.results || [];
                    aPricing.forEach(c => {
                        if (c.ConditionType === "RA01") {
                            fDiscount += parseFloat(c.ConditionRateValue || c.QtnDiscountPercentage || "0") || 0;
                        }
                    });
                } catch (eCond) {
                    console.warn("No se pudieron leer condiciones del item draft:", sSupplierQuotationItem, eCond);
                }

                const fCantidad = parseFloat(pos.ScheduleLineOrderQuantity || "0");
                const fPrecio = parseFloat(pos.NetPriceAmount || "0");
                const fSubTotal = fCantidad * fPrecio;

                return {
                    RequestForQuotation: pos.RequestForQuotation || sNumPedido,
                    RequestForQuotationItem: pos.RequestForQuotationItem || pos.SupplierQuotationItem || "",
                    Material: pos.Material || "",
                    MaterialDescription:
                        pos.MaterialDescription ||
                        pos.PurchaseOrderItemText ||
                        pos.SupplierProductDescription ||
                        pos.ProductDescription ||
                        pos.MaterialBySupplier ||
                        pos.Product ||
                        "",
                    OrderQuantityUnit: pos.OrderQuantityUnit || "",
                    DocumentCurrency: pos.DocumentCurrency || "",
                    cantCotizada: pos.ScheduleLineOrderQuantity || "0.00",
                    priceUnit: pos.NetPriceAmount || "0.00",
                    Discount: String(fDiscount),
                    SubTotal: fSubTotal.toFixed(2),
                    ScheduleLineOrderQuantity: pos.ScheduleLineOrderQuantity || "0.00",
                    FechaEntrega: this._formatDateDDMMYYYY(pos.ScheduleLineDeliveryDate),
                    NoteTypeListText: pos.NoteTypeListText || "",
                    ItemNota: "",
                    ItemNotaEdit: "",
                    ItemNotaOfepos: "",
                    ItemNotaLineCount: 0,
                    _notaItemEditable: false
                };
            }));

            return {
                DraftUUID: sDraftUUID,
                aPosicionesSAP: aPosicionesSAP,
                aDetalle: aDetalle
            };
        },
        _resolveMaterialDescription: function (oRow, oBase, oDraftRow) {
            return (
                (oRow?.MaterialDescription || "").trim() ||
                (oRow?.PurchaseOrderItemText || "").trim() ||
                (oRow?.ShortText || "").trim() ||
                (oBase?.MaterialDescription || "").trim() ||
                (oBase?.PurchaseOrderItemText || "").trim() ||
                (oBase?.ShortText || "").trim() ||
                (oDraftRow?.MaterialDescription || "").trim() ||
                (oDraftRow?.PurchaseOrderItemText || "").trim() ||
                (oDraftRow?.SupplierProductDescription || "").trim() ||
                (oDraftRow?.ProductDescription || "").trim() ||
                (oDraftRow?.Product || "").trim() ||
                ""
            );
        },

        _getPedidoDetalleBaseRFQ: function (sNumPedido) {
            that = this;
            try {
                var oResp = { sEstado: "E", oResults: [] };

                return new Promise(function (resolve) {
                    if (!sNumPedido) {
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        resolve(oResp);
                        return;
                    }

                    let sUrl = "";
                    const sFilter = encodeURIComponent("RequestForQuotation eq '" + sNumPedido + "'");

                    if (that.local) {
                        const sPath =
                            "/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVDAPOSICION" +
                            "?$top=10000&$format=json&sap-language=es-ES&$filter=" + sFilter;
                        sUrl = that.getOwnerComponent().getManifestObject().resolveUri(sPath);
                    } else {
                        const sPath =
                            jQuery.sap.getModulePath(that.route) +
                            "/S4HANA/sap/opu/odata/sap/ZMMB_PORTALPROVEEDORES/ZC_PROVDAPOSICION" +
                            "?$top=10000&$format=json&sap-language=es-ES&$filter=" + sFilter;
                        sUrl = sPath;
                    }

                    Services.getoDataERPSync(that, sUrl, function (result) {
                        util.response.validateAjaxGetERPNotMessage(result, {
                            success: function (oData) {
                                oResp.sEstado = "S";
                                oResp.oResults = oData.data || [];
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

        _completeMissingMaterialDescriptions: async function (aDetalleMapeado, sNumPedido) {
            const aRows = aDetalleMapeado || [];

            const bHayVacios = aRows.some(row =>
                !String(row.MaterialDescription || "").trim()
            );

            if (!bHayVacios || !sNumPedido) {
                return aRows;
            }

            try {
                const oRespBase = await this._getPedidoDetalleBaseRFQ(sNumPedido);
                const aBase = oRespBase?.oResults || [];

                const mBaseByItem = {};
                aBase.forEach(item => {
                    const sKey = String(item.RequestForQuotationItem || "").padStart(5, "0");
                    mBaseByItem[sKey] = item;
                });

                return aRows.map(row => {
                    const sKey = String(row.RequestForQuotationItem || "").padStart(5, "0");
                    const oBase = mBaseByItem[sKey] || {};

                    return {
                        ...row,
                        MaterialDescription: this._resolveMaterialDescription(row, oBase, null)
                    };
                });
            } catch (e) {
                console.warn("No se pudo completar MaterialDescription antes de publicar:", e);
                return aRows;
            }
        },
        _saveItemNoteStandardNoActivate: async function (sSupplierQuotation, oItemDraftInfo, sNota) {
            const sNoteServiceUrl = this._getNoteServiceUrl();

            console.log("========== [_saveItemNoteStandardNoActivate] INICIO ==========");
            console.log("[_saveItemNoteStandardNoActivate] SupplierQuotation:", sSupplierQuotation);
            console.log("[_saveItemNoteStandardNoActivate] oItemDraftInfo:", oItemDraftInfo);
            console.log("[_saveItemNoteStandardNoActivate] sNota:", sNota);

            if (!oItemDraftInfo || !oItemDraftInfo.ObjectIDItem) {
                throw new Error("Faltan datos de borrador de posición para nota estándar.");
            }

            const oResult = await this._upsertStandardNote({
                sNoteServiceUrl,
                sObjectID: oItemDraftInfo.ObjectIDItem,
                sObjectNodeType: "SupplierQuotationItem",
                sNoteType: "ITEM_NOTE",
                sContent: sNota,
                sHeaderObjectId: sSupplierQuotation + oItemDraftInfo.ItemPadded,
                sHeaderNodeType: "SupplierQuotationItem",
                sLanguage: "ES"
            });

            console.log("[_saveItemNoteStandardNoActivate] Resultado:", oResult);
            console.log("========== [_saveItemNoteStandardNoActivate] FIN OK ==========");

            return oResult;
        },
        _loadItemNotesFromStandardApi: async function (sSupplierQuotation, sDraftUUIDHeader) {
            const oModel = this.getView().getModel("oModelProyect");
            const aDetalle = oModel.getProperty("/oDetalle") || [];

            console.log("========== [_loadItemNotesFromStandardApi] INICIO ==========");
            console.log("[_loadItemNotesFromStandardApi] sSupplierQuotation:", sSupplierQuotation);
            console.log("[_loadItemNotesFromStandardApi] sDraftUUIDHeader PARAM:", sDraftUUIDHeader);
            console.log("[_loadItemNotesFromStandardApi] /oDetalle inicial:", JSON.parse(JSON.stringify(aDetalle)));

            if (!sSupplierQuotation || !aDetalle.length) {
                console.log("[_loadItemNotesFromStandardApi] Sin oferta o sin detalle. Se omite.");
                console.log("========== [_loadItemNotesFromStandardApi] FIN SIN PROCESAR ==========");
                return;
            }

            if (!sDraftUUIDHeader) {
                console.warn("[_loadItemNotesFromStandardApi] No se recibió sDraftUUIDHeader.");
                console.log("========== [_loadItemNotesFromStandardApi] FIN SIN DRAFT ==========");
                return;
            }

            const sServiceUrl = this._getQtnServiceUrl();
            const sNoteServiceUrl = this._getNoteServiceUrl();

            // Mantener el draft correcto en modelo si quieres rastrearlo
            oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUIDHeader);

            // 1. Leer items draft de la oferta usando EL DRAFT RECIBIDO
            const sItemsUrl =
                `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                `SupplierQuotation='${sSupplierQuotation}',` +
                `DraftUUID=guid'${sDraftUUIDHeader}',` +
                `IsActiveEntity=false)/to_SuplrQuotationItemEnhWD?$format=json`;

            console.log("[_loadItemNotesFromStandardApi] URL items draft:", sItemsUrl);

            const oItemsResp = await Services.oDataConsultODATAAsync(
                "GET",
                sItemsUrl,
                [],
                [],
                "1",
                this
            );

            const aItemsDraft = oItemsResp?.d?.results || [];
            console.log("[_loadItemNotesFromStandardApi] aItemsDraft:", JSON.parse(JSON.stringify(aItemsDraft)));

            const mItemDraftByReqItem = {};

            aItemsDraft.forEach(item => {
                const sReqItem = String(
                    item.RequestForQuotationItem ||
                    item.SupplierQuotationItem ||
                    ""
                ).padStart(5, "0");

                mItemDraftByReqItem[sReqItem] = item;
            });

            console.log("[_loadItemNotesFromStandardApi] mItemDraftByReqItem:", JSON.parse(JSON.stringify(mItemDraftByReqItem)));

            // 2. Por cada fila UI, buscar su nota estándar
            for (let i = 0; i < aDetalle.length; i++) {
                const oRow = aDetalle[i];
                const sReqItem = String(
                    oRow.RequestForQuotationItem ||
                    oRow.SupplierQuotationItem ||
                    ""
                ).padStart(5, "0");

                console.log("--------------------------------------------------");
                console.log(`[_loadItemNotesFromStandardApi] Procesando índice ${i}`);
                console.log("[_loadItemNotesFromStandardApi] oRow:", JSON.parse(JSON.stringify(oRow)));
                console.log("[_loadItemNotesFromStandardApi] sReqItem:", sReqItem);

                const oItemDraft = mItemDraftByReqItem[sReqItem];

                if (!oItemDraft) {
                    console.warn("[_loadItemNotesFromStandardApi] No se encontró oItemDraft para:", sReqItem);
                    oModel.setProperty(`/oDetalle/${i}/ItemNota`, "");
                    oModel.setProperty(`/oDetalle/${i}/ItemNotaEdit`, "");
                    oModel.setProperty(`/oDetalle/${i}/ItemNotaLineCount`, 0);
                    oModel.setProperty(`/oDetalle/${i}/_notaItemEditable`, false);
                    continue;
                }

                console.log("[_loadItemNotesFromStandardApi] oItemDraft:", JSON.parse(JSON.stringify(oItemDraft)));

                const sSupplierQuotationItem = String(
                    oItemDraft.SupplierQuotationItem || ""
                ).padStart(5, "0");

                // USAR EL DRAFT DEL ITEM LEÍDO DESDE EL DRAFT CORRECTO
                const sDraftUUIDItem = oItemDraft?.DraftUUID || "";

                console.log("[_loadItemNotesFromStandardApi] sSupplierQuotationItem:", sSupplierQuotationItem);
                console.log("[_loadItemNotesFromStandardApi] sDraftUUIDItem:", sDraftUUIDItem);

                if (!sDraftUUIDItem) {
                    console.warn("[_loadItemNotesFromStandardApi] No se obtuvo sDraftUUIDItem para:", sReqItem);
                    oModel.setProperty(`/oDetalle/${i}/ItemNota`, "");
                    oModel.setProperty(`/oDetalle/${i}/ItemNotaEdit`, "");
                    oModel.setProperty(`/oDetalle/${i}/ItemNotaLineCount`, 0);
                    oModel.setProperty(`/oDetalle/${i}/_notaItemEditable`, false);
                    continue;
                }

                const sObjectIDItem = this._guidToObjectId(sDraftUUIDItem);

                const sFilterStr =
                    `ObjectID eq '${sObjectIDItem}' ` +
                    `and ObjectNodeType eq 'SupplierQuotationItem' ` +
                    `and IsActiveEntity eq false ` +
                    `and NoteType eq 'ITEM_NOTE'`;

                const sUrlNote =
                    `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                    `?$select=NoteID,Content,ObjectID,ObjectNodeType,NoteType,IsActiveEntity` +
                    `&$filter=${encodeURIComponent(sFilterStr)}` +
                    `&$format=json`;

                console.log("[_loadItemNotesFromStandardApi] sObjectIDItem:", sObjectIDItem);
                console.log("[_loadItemNotesFromStandardApi] URL nota item:", sUrlNote);

                const oNoteResp = await Services.oDataConsultODATAAsync(
                    "GET",
                    sUrlNote,
                    [],
                    [],
                    "1",
                    this
                );

                const aNotes = oNoteResp?.d?.results || [];
                const sNota = aNotes.length ? (aNotes[0].Content || "") : "";

                console.log("[_loadItemNotesFromStandardApi] aNotes encontradas:", aNotes);
                console.log("[_loadItemNotesFromStandardApi] sNota final:", sNota);

                oModel.setProperty(`/oDetalle/${i}/ItemNota`, sNota);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaEdit`, sNota);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaOfepos`, sSupplierQuotation + sSupplierQuotationItem);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaLineCount`, sNota ? sNota.split(/\r?\n/).length : 0);
                oModel.setProperty(`/oDetalle/${i}/_notaItemEditable`, false);
            }

            oModel.refresh(true);

            console.log("[_loadItemNotesFromStandardApi] /oDetalle final:", JSON.parse(JSON.stringify(oModel.getProperty("/oDetalle") || [])));
            console.log("========== [_loadItemNotesFromStandardApi] FIN OK ==========");
        },
        _persistDraftItemsFromLocalModel: async function (sSupplierQuotation) {
            const oModel = this.getView().getModel("oModelProyect");
            const sServiceUrl = this._getQtnServiceUrl();

            console.log("========== [_persistDraftItemsFromLocalModel] INICIO ==========");
            console.log("[_persistDraftItemsFromLocalModel] SupplierQuotation:", sSupplierQuotation);

            if (!sSupplierQuotation) {
                throw new Error("No existe SupplierQuotation para persistir posiciones.");
            }

            let sDraftUUID = oModel.getProperty("/oCabecera/DraftUUIDOffer") || "";
            sDraftUUID = await this._ensureOfferDraftForSave(sSupplierQuotation, sDraftUUID);
            oModel.setProperty("/oCabecera/DraftUUIDOffer", sDraftUUID);

            console.log("[_persistDraftItemsFromLocalModel] DraftUUID:", sDraftUUID);

            const aDeletedPositions = oModel.getProperty("/aDeletedPositions") || [];

            // 1) Leer posiciones draft actuales
            const sDraftItemsUrl =
                `${sServiceUrl}C_SuplrQuotationEnhWD(` +
                `SupplierQuotation='${sSupplierQuotation}',` +
                `DraftUUID=guid'${sDraftUUID}',` +
                `IsActiveEntity=false)/to_SuplrQuotationItemEnhWD?$format=json`;

            console.log("[_persistDraftItemsFromLocalModel] Leyendo draft items:", sDraftItemsUrl);

            const oDraftItemsResp = await Services.oDataConsultODATAAsync(
                "GET",
                sDraftItemsUrl,
                [],
                [],
                "1",
                this
            );

            let aPosicionesDraft = oDraftItemsResp?.d?.results || [];
            console.log("[_persistDraftItemsFromLocalModel] aPosicionesDraft:", aPosicionesDraft);

            if (!aPosicionesDraft.length) {
                throw new Error("El borrador no tiene posiciones para guardar.");
            }

            // 2) Eliminar posiciones borradas localmente
            for (const oDeleted of aDeletedPositions) {
                const sReqItemDeleted = String(oDeleted.RequestForQuotationItem || "").padStart(5, "0");

                const oMatchDelete = aPosicionesDraft.find(pos =>
                    String(pos.RequestForQuotationItem || "").padStart(5, "0") === sReqItemDeleted
                );

                if (oMatchDelete) {
                    const sDeleteUrl =
                        `${sServiceUrl}C_SuplrQuotationItemEnhWD(` +
                        `SupplierQuotation='${oMatchDelete.SupplierQuotation || sSupplierQuotation}',` +
                        `SupplierQuotationItem='${oMatchDelete.SupplierQuotationItem}',` +
                        `DraftUUID=guid'${oMatchDelete.DraftUUID || sDraftUUID}',` +
                        `IsActiveEntity=false)`;

                    console.log("[_persistDraftItemsFromLocalModel] Eliminando item draft:", sDeleteUrl);

                    await Services.postNoBodyERPAsync(
                        this,
                        sServiceUrl,
                        sDeleteUrl,
                        { "X-HTTP-Method": "DELETE" }
                    );
                }
            }

            // 3) Releer posiciones draft tras borrados
            const oDraftItemsResp2 = await Services.oDataConsultODATAAsync(
                "GET",
                sDraftItemsUrl,
                [],
                [],
                "1",
                this
            );

            aPosicionesDraft = oDraftItemsResp2?.d?.results || [];
            console.log("[_persistDraftItemsFromLocalModel] aPosicionesDraft final:", aPosicionesDraft);

            const aTableDataUI = this.collectTableData();
            console.log("[_persistDraftItemsFromLocalModel] aTableDataUI:", aTableDataUI);

            const aTableData = await Promise.all(aTableDataUI.map(async (itemUI) => {
                const sReqItemUI = String(itemUI.RequestForQuotationItem || "").padStart(5, "0");

                const oMatch = aPosicionesDraft.find(pos =>
                    String(pos.RequestForQuotationItem || "").padStart(5, "0") === sReqItemUI
                );

                if (!oMatch) {
                    console.warn("[_persistDraftItemsFromLocalModel] No se encontró match draft para item:", sReqItemUI);
                    return null;
                }

                const condUrl =
                    `${sServiceUrl}C_SuplrQuotationItemEnhWD(` +
                    `SupplierQuotation='${oMatch.SupplierQuotation || sSupplierQuotation}',` +
                    `SupplierQuotationItem='${oMatch.SupplierQuotationItem}',` +
                    `DraftUUID=guid'${oMatch.DraftUUID || sDraftUUID}',` +
                    `IsActiveEntity=false)/to_QTNPricingElementWD?$format=json`;

                console.log("[_persistDraftItemsFromLocalModel] Leyendo pricing para item:", condUrl);

                const condResp = await Services.oDataConsultODATAAsync(
                    "GET",
                    condUrl,
                    [],
                    [],
                    "1",
                    this
                );

                const aPricing = condResp?.d?.results || [];
                const oRA01 = aPricing.find(c => c.ConditionType === "RA01") || null;
                const oPBXX = aPricing.find(c => c.ConditionType === "PBXX") || null;

                const sNetPrice = String(itemUI.NetPriceAmount || "0").trim();
                const sQty = String(itemUI.ScheduleLineOrderQuantity || "0").trim();
                const sDiscount = String(itemUI.ConditionRateValue || "0").trim();

                console.log("[_persistDraftItemsFromLocalModel] Item preparado:", {
                    reqItem: sReqItemUI,
                    supplierQuotationItem: oMatch.SupplierQuotationItem,
                    sNetPrice,
                    sQty,
                    sDiscount,
                    fecha: itemUI.ScheduleLineDeliveryDate
                });

                return {
                    SupplierQuotation: oMatch.SupplierQuotation || sSupplierQuotation,
                    SupplierQuotationItem: oMatch.SupplierQuotationItem,
                    DraftUUID: oMatch.DraftUUID || sDraftUUID,
                    NetPriceAmount: sNetPrice,
                    ScheduleLineOrderQuantity: sQty,
                    ScheduleLineDeliveryDate: this._formatDateForSAP(itemUI.ScheduleLineDeliveryDate),
                    NoteTypeListText: itemUI.NoteTypeListText || "",
                    ConditionRateValue: sDiscount,
                    RA01: oRA01 ? {
                        SupplierQuotation: oMatch.SupplierQuotation || sSupplierQuotation,
                        SupplierQuotationItem: oMatch.SupplierQuotationItem,
                        DraftUUID: oRA01.DraftUUID || sDraftUUID,
                        PricingDocument: oRA01.PricingDocument,
                        PricingDocumentItem: oRA01.PricingDocumentItem,
                        PricingProcedureStep: oRA01.PricingProcedureStep,
                        PricingProcedureCounter: oRA01.PricingProcedureCounter,
                        ValorActual: oRA01.ConditionRateValue
                    } : null,
                    PBXX: oPBXX ? {
                        SupplierQuotation: oMatch.SupplierQuotation || sSupplierQuotation,
                        SupplierQuotationItem: oMatch.SupplierQuotationItem,
                        DraftUUID: oPBXX.DraftUUID || sDraftUUID,
                        PricingDocument: oPBXX.PricingDocument,
                        PricingDocumentItem: oPBXX.PricingDocumentItem,
                        PricingProcedureStep: oPBXX.PricingProcedureStep,
                        PricingProcedureCounter: oPBXX.PricingProcedureCounter,
                        ValorActual: oPBXX.ConditionRateValue,
                        ImporteActual: oPBXX.ConditionAmount
                    } : null
                };
            }));

            const aCleanTableData = aTableData.filter(Boolean);

            console.log("[_persistDraftItemsFromLocalModel] aCleanTableData:", aCleanTableData);

            if (!aCleanTableData.length) {
                throw new Error("No se encontraron posiciones válidas para persistir.");
            }

            let sBatchBody = utilUI.buildBatchBody(aCleanTableData, "MERGE");
            console.log("[_persistDraftItemsFromLocalModel] Batch MERGE construido");

            try {
                await Services.postoDataBatchAsync(
                    this,
                    sServiceUrl + "$metadata",
                    sServiceUrl + "$batch",
                    sBatchBody
                );
                console.log("[_persistDraftItemsFromLocalModel] Batch MERGE OK");
            } catch (eBatch1) {
                console.warn("[_persistDraftItemsFromLocalModel] MERGE falló, probando PATCH", eBatch1);

                sBatchBody = utilUI.buildBatchBody(aCleanTableData, "PATCH");

                await Services.postoDataBatchAsync(
                    this,
                    sServiceUrl + "$metadata",
                    sServiceUrl + "$batch",
                    sBatchBody
                );

                console.log("[_persistDraftItemsFromLocalModel] Batch PATCH OK");
            }

            console.log("========== [_persistDraftItemsFromLocalModel] FIN OK ==========");
        },
        _submitQuotationWithRetry: async function (sServiceUrl, sSupplierQuotation, iRetries = 3, iDelayMs = 1200) {
            const sUrlSubmit =
                `${sServiceUrl}C_SuplrQuotationEnhWDSubmit?` +
                `SupplierQuotation='${sSupplierQuotation}'` +
                `&DraftUUID=guid'00000000-0000-0000-0000-000000000000'` +
                `&IsActiveEntity=true`;

            console.log("[_submitQuotationWithRetry] Submit URL:", sUrlSubmit);

            let oLastError = null;

            for (let i = 0; i < iRetries; i++) {
                try {
                    console.log(`[_submitQuotationWithRetry] Intento ${i + 1} de ${iRetries}`);

                    const oResp = await Services.postoDataERPAsync(
                        this,
                        sServiceUrl,
                        sUrlSubmit,
                        null
                    );

                    return oResp;
                } catch (e) {
                    oLastError = e;

                    const sMsg =
                        (e?.message || e?.responseText || JSON.stringify(e || {})).toLowerCase();

                    const bLocked =
                        sMsg.includes("423") ||
                        sMsg.includes("locked") ||
                        sMsg.includes("lock");

                    console.warn(`[_submitQuotationWithRetry] Error intento ${i + 1}:`, e);

                    if (!bLocked || i === iRetries - 1) {
                        throw e;
                    }

                    await new Promise(resolve => setTimeout(resolve, iDelayMs));
                }
            }

            throw oLastError || new Error("No se pudo ejecutar el submit de la oferta.");
        },

        _upsertStandardNote: async function ({
            sNoteServiceUrl,
            sObjectID,
            sObjectNodeType,
            sNoteType,
            sContent,
            sHeaderObjectId,
            sHeaderNodeType,
            sLanguage = "ES"
        }) {
            const sNota = String(sContent || "").trim();

            const sFilterStr =
                `ObjectID eq '${sObjectID}' ` +
                `and ObjectNodeType eq '${sObjectNodeType}' ` +
                `and IsActiveEntity eq false ` +
                `and NoteType eq '${sNoteType}'`;

            const sUrlSelect =
                `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                `?$select=NoteID,Language,NoteType,Content,ObjectID,ObjectNodeType,IsActiveEntity` +
                `&$filter=${encodeURIComponent(sFilterStr)}` +
                `&$format=json`;

            const oResp = await Services.oDataConsultODATAAsync(
                "GET",
                sUrlSelect,
                [],
                [],
                "1",
                this
            );

            const aResults = oResp?.d?.results || [];
            const oNoteExist = aResults.length ? aResults[0] : null;

            const oHeaders = {
                "gbtnte-noteTypes": sNoteType,
                "gbtnte-objectId": sHeaderObjectId,
                "gbtnte-objectNodeType": sHeaderNodeType
            };

            // DELETE
            if (!sNota) {
                if (oNoteExist?.NoteID) {
                    const sEntityUrl =
                        `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp(` +
                        `NoteID=guid'${oNoteExist.NoteID}',` +
                        `IsActiveEntity=false)`;

                    await Services.postoDataERPWithHeadersAsync(
                        this,
                        sNoteServiceUrl,
                        sEntityUrl,
                        {},
                        Object.assign({}, oHeaders, {
                            "X-HTTP-Method": "DELETE"
                        })
                    );
                }

                return {
                    action: "DELETE",
                    existed: !!oNoteExist
                };
            }

            // MERGE
            if (oNoteExist?.NoteID) {
                const sEntityUrl =
                    `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp(` +
                    `NoteID=guid'${oNoteExist.NoteID}',` +
                    `IsActiveEntity=false)`;

                const oBodyUpdate = {
                    "__metadata": {
                        "type": "SGBT_NTE_CDS_API_D_SRV.C_Sgbt_Nte_Cds_ApitpType"
                    },
                    "Content": sNota,
                    "Language": oNoteExist.Language || sLanguage,
                    "NoteType": sNoteType,
                    "ObjectID": sObjectID,
                    "ObjectNodeType": sObjectNodeType,
                    "IsActiveEntity": false
                };

                await Services.postoDataERPWithHeadersAsync(
                    this,
                    sNoteServiceUrl,
                    sEntityUrl,
                    oBodyUpdate,
                    Object.assign({}, oHeaders, {
                        "X-HTTP-Method": "MERGE"
                    })
                );

                return {
                    action: "MERGE",
                    existed: true,
                    noteId: oNoteExist.NoteID
                };
            }

            // CREATE
            const sCollectionPath = `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp`;

            const oBodyCreate = {
                "__metadata": {
                    "type": "SGBT_NTE_CDS_API_D_SRV.C_Sgbt_Nte_Cds_ApitpType"
                },
                "ObjectNodeType": sObjectNodeType,
                "ObjectID": sObjectID,
                "NoteType": sNoteType,
                "Language": sLanguage,
                "Content": sNota,
                "IsActiveEntity": false
            };

            await Services.postoDataERPWithHeadersAsync(
                this,
                sNoteServiceUrl,
                sCollectionPath,
                oBodyCreate,
                oHeaders
            );

            return {
                action: "CREATE",
                existed: false
            };
        },

        _loadPublishedHeaderNote: async function (sObjectId) {
            const sServiceUrl = this._getNoteServiceUrl();

            console.log("========== [_loadPublishedHeaderNote] INICIO ==========");
            console.log("[_loadPublishedHeaderNote] sObjectId:", sObjectId);

            const sFilterStr =
                `ObjectID eq '${sObjectId}' ` +
                `and ObjectNodeType eq 'SupplierQuotation' ` +
                `and IsActiveEntity eq true ` +
                `and NoteType eq 'NOTE_FROM_SUPPLIER'`;

            const sUrl =
                `${sServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                `?$select=NoteID,Language,NoteType,Content,ObjectID,ObjectNodeType,IsActiveEntity` +
                `&$filter=${encodeURIComponent(sFilterStr)}` +
                `&$format=json`;

            console.log("[_loadPublishedHeaderNote] URL:", sUrl);

            const oResp = await Services.oDataConsultODATAAsync(
                "GET",
                sUrl,
                [],
                [],
                "1",
                this
            );

            const aResults = oResp?.d?.results || [];
            console.log("[_loadPublishedHeaderNote] aResults:", aResults);

            const sNota = aResults.length ? (aResults[0].Content || "") : "";
            console.log("[_loadPublishedHeaderNote] sNota:", sNota);
            console.log("========== [_loadPublishedHeaderNote] FIN ==========");

            return sNota;
        },

        _loadPublishedItemNotes: async function (sSupplierQuotation) {
            const oModel = this.getView().getModel("oModelProyect");
            const aDetalle = oModel.getProperty("/oDetalle") || [];
            const sNoteServiceUrl = this._getNoteServiceUrl();

            console.log("========== [_loadPublishedItemNotes] INICIO ==========");
            console.log("[_loadPublishedItemNotes] sSupplierQuotation:", sSupplierQuotation);
            console.log("[_loadPublishedItemNotes] /oDetalle inicial:", JSON.parse(JSON.stringify(aDetalle)));

            if (!sSupplierQuotation || !aDetalle.length) {
                console.log("[_loadPublishedItemNotes] Sin oferta o sin detalle. Se omite.");
                console.log("========== [_loadPublishedItemNotes] FIN SIN PROCESAR ==========");
                return;
            }

            for (let i = 0; i < aDetalle.length; i++) {
                const oRow = aDetalle[i];
                const sItem = String(
                    oRow.RequestForQuotationItem ||
                    oRow.SupplierQuotationItem ||
                    ""
                ).padStart(5, "0");

                const sObjectId = sSupplierQuotation + sItem;

                const sFilterStr =
                    `ObjectID eq '${sObjectId}' ` +
                    `and ObjectNodeType eq 'SupplierQuotationItem' ` +
                    `and IsActiveEntity eq true ` +
                    `and NoteType eq 'ITEM_NOTE'`;

                const sUrl =
                    `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp` +
                    `?$select=NoteID,Content,ObjectID,ObjectNodeType,NoteType,IsActiveEntity` +
                    `&$filter=${encodeURIComponent(sFilterStr)}` +
                    `&$format=json`;

                console.log("[_loadPublishedItemNotes] Item:", sItem);
                console.log("[_loadPublishedItemNotes] ObjectID:", sObjectId);
                console.log("[_loadPublishedItemNotes] URL:", sUrl);

                const oResp = await Services.oDataConsultODATAAsync(
                    "GET",
                    sUrl,
                    [],
                    [],
                    "1",
                    this
                );

                const aResults = oResp?.d?.results || [];
                const sNota = aResults.length ? (aResults[0].Content || "") : "";

                console.log("[_loadPublishedItemNotes] aResults:", aResults);
                console.log("[_loadPublishedItemNotes] sNota:", sNota);

                oModel.setProperty(`/oDetalle/${i}/ItemNota`, sNota);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaEdit`, sNota);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaOfepos`, sObjectId);
                oModel.setProperty(`/oDetalle/${i}/ItemNotaLineCount`, sNota ? sNota.split(/\r?\n/).length : 0);
                oModel.setProperty(`/oDetalle/${i}/_notaItemEditable`, false);
            }

            oModel.refresh(true);

            console.log("[_loadPublishedItemNotes] /oDetalle final:", JSON.parse(JSON.stringify(oModel.getProperty("/oDetalle") || [])));
            console.log("========== [_loadPublishedItemNotes] FIN OK ==========");
        },

    });
});