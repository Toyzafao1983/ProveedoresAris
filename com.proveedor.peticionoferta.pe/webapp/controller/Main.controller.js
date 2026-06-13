
sap.ui.define([
    "com/proveedor/peticionoferta/pe/controller/BaseController",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/resource/ResourceModel",
    "com/proveedor/peticionoferta/pe/model/models",
    "com/proveedor/peticionoferta/pe/model/formatter",
    "com/proveedor/peticionoferta/pe/services/Services",
    "com/proveedor/peticionoferta/pe/util/util",
    "com/proveedor/peticionoferta/pe/util/utilUI",

    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
], (BaseController, Controller, ResourceModel, models, Formatter, Services, util, utilUI, Filter, FilterOperator) => {
    "use strict";
    var that;
    var sBpProv = "";
    formatter: Formatter;
    return BaseController.extend("com.proveedor.peticionoferta.pe.controller.Main", {
        onInit() {

            that = this;
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter.getTarget("Main").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
            // this._loadDriveId();
            this.frgIdTableMain = "frgIdTableMain";
            this.frgIdFilterInit = "frgIdFilterInit";
        },
        handleRouteMatched: function (bInit) {
            sap.ui.core.BusyIndicator.show(0);

            Promise.all([
                that._getUsers(),
                that._getPrueba(),
                that._getState(this),
                that._getCondPago(this),
                that._getNotCabecera()
            ]).then(async (values) => {
                that._setLanguageModel("esp");
                that.oModelProyect = that.getModel("oModelProyect");
                that.oModelData = that.getModel("oModelData");
                that.oModelUser = that.getModel("oModelUser");
                that.oModelDevice = that.getModel("oModelDevice");

                if (!that.oModelProyect || !that.oModelProyect.getData().Main) {
                    that.getView().setModel(new sap.ui.model.json.JSONModel(models.createModelProyect()), "oModelProyect");
                    that.oModelProyect = that.getView().getModel("oModelProyect");
                }

                let oUser = values[0]?.Resources?.[0] || {};
                const oUserProfile = that._applyProveedorUserProfile(oUser);

                that.getModel("oModelUser").setProperty(
                    "/sNameComp",
                    ((oUser.name && oUser.name.givenName) || "") + " " + ((oUser.name && oUser.name.familyName) || "")
                );

                that.oModelData.setProperty("/oState", values[2].d.results);
                that.oModelData.setProperty("/oCondPago", values[3].d.results);

                const bEsExterno = oUserProfile.bIsExtAyc;
                const bEsInterno = oUserProfile.bIsInterno;

                // El BP del proveedor externo solo debe salir de customAttribute4.
                sBpProv = oUserProfile.sExtBP;

                if (!bEsExterno && !bEsInterno) {
                    sap.ui.core.BusyIndicator.hide(0);
                    that.getMessageBox("error", "El usuario no tiene configurado customAttribute4 ni customAttribute5 en IAS.");
                    return;
                }

                // Si es externo, fijar su BP en el filtro.
                if (bEsExterno && sBpProv) {
                    that.oModelProyect.setProperty("/Main/filter/fSupplier", [sBpProv]);
                    that.oModelProyect.setProperty("/Main/filter/fNameSupplier", []);
                }

                // Cargar solo RFQ del BP cuando es externo.
                const oRespPetOffert = await that._getPetOffertFilter(
                    null,
                    bEsExterno ? sBpProv : null
                );

                console.log("=== DEBUG LOGIN IAS PETICIÓN OFERTA ===");
                console.log("groups:", oUserProfile.aGroups);
                console.log("customAttribute4:", oUserProfile.sAttribute4);
                console.log("customAttribute5:", oUserProfile.sAttribute5);
                console.log("bEsExterno:", bEsExterno);
                console.log("bEsInterno:", bEsInterno);
                console.log("sRolPrincipal:", oUserProfile.sRolPrincipal);
                console.log("sBpProv:", sBpProv);
                console.log("sInternalBP:", oUserProfile.sInternalBP);

                if (oRespPetOffert.sEstado === "S") {
                    that.oModelProyect.setProperty("/EstadosDisponibles", oRespPetOffert.aEstados);
                    that.oModelProyect.setProperty("/RFQDisponibles", oRespPetOffert.aRFQDisponibles);
                    that.oModelProyect.setProperty("/SupplierDisponibles", oRespPetOffert.aSupplierDisponibles);
                    that.oModelProyect.setProperty("/NameSupplierDisponibles", oRespPetOffert.aNameSupplierDisponibles);
                    that.oModelData.setProperty("/PetInitOffert", oRespPetOffert.oResults);
                }

                that.oModelProyect.setSizeLimit(99999999);
                that.oModelData.setSizeLimit(99999999);

                let sComponentTable = "TableMainDesktop";
                if (!that.fragmentTable) {
                    that.fragmentTable = sap.ui.xmlfragment(this.frgIdTableMain, that.route + ".view.fragments." + sComponentTable, that);
                    this._byId("vbTableMain").addItem(that.fragmentTable);
                }
                sap.ui.core.BusyIndicator.hide(0);
            }).catch(function (oError) {
                console.error("Error handleRouteMatched:", oError);
                that.getMessageBox("error", that.getI18nText("errorUserData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        // Para Cargar las notas
        onSelectItemNota: async function (oEvent) {
            try {
                const oItem = oEvent.getParameter("listItem");
                if (!oItem) return;

                const oContext = oItem.getBindingContext("oModelProyect");
                const oRow = oContext.getObject();

                const sSupplierQuotation = oRow.SupplierQuotation;
                if (!sSupplierQuotation) {
                    sap.m.MessageToast.show("La fila no tiene oferta asociada");
                    return;
                }

                sap.ui.core.BusyIndicator.show(0);

                // 1️⃣ Garantizar Draft (estándar SAP)
                const oDraft = await this._ensureQtnDraft(sSupplierQuotation);
                const sDraftUUID = oDraft.DraftUUID;
                const sObjectId = this._guidToObjectId(sDraftUUID);

                // 2️⃣ Leer nota estándar NOTE_FROM_SUPPLIER
                const sNote = await this._loadHeaderNote(sObjectId);

                // 3️⃣ Actualizar SOLO la fila seleccionada
                oRow.Nota = sNote || "";
                oRow.NotaEdit = sNote || "";
                oRow._notaEditable = false;

                this.getView().getModel("oModelProyect").refresh(true);

                sap.ui.core.BusyIndicator.hide(0);

            } catch (e) {
                console.error("Error leyendo nota estándar:", e);
                sap.ui.core.BusyIndicator.hide(0);
                sap.m.MessageBox.error("Error al obtener la nota estándar.");
            }
        },
        _loadHeaderNotesForReporte: async function () {
            const that = this;
            const oModelProyect = this.getView().getModel("oModelProyect");
            let aReporte = oModelProyect.getProperty("/oReporte") || [];

            // 🔒 Opcional: limitar cantidad para no matar al backend
            const MAX_FILAS = 50; // o el número que quieras
            const aToProcess = aReporte.slice(0, MAX_FILAS);

            for (const oRow of aToProcess) {
                const sSupplierQuotation = oRow.SupplierQuotation;

                if (!sSupplierQuotation) {
                    continue; // sin oferta no tiene nota estándar
                }

                try {
                    // 1) Aseguramos borrador de la QTN → paso 1 que pusiste
                    const oDraftInfo = await that._ensureQtnDraft(sSupplierQuotation);
                    const sDraftUUID = oDraftInfo.DraftUUID;
                    const sObjectId = that._guidToObjectId(sDraftUUID);

                    // 2) Leemos la nota estándar NOTE_FROM_SUPPLIER → tu paso 3/5
                    const sNota = await that._loadHeaderNote(sObjectId);

                    // 3) Actualizamos la fila en memoria
                    oRow.Nota = sNota || "";
                    oRow.NotaEdit = sNota || "";
                    oRow._notaEditable = false; // por defecto no editable

                } catch (e) {
                    console.error("⚠️ Error cargando nota estándar para oferta", sSupplierQuotation, e);
                    // No cortamos el loop, seguimos con las demás
                }
            }

            // 4) Grabar nuevamente el array en el modelo
            oModelProyect.setProperty("/oReporte", aReporte);
            oModelProyect.refresh(true);
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
        _onClearDataFilter: function () {
            that.getModel("oModelProyect").setProperty("/", models.createModelProyect());
        },
        _onPressNavigateDetail: function (oEvent) {
            let oSource = oEvent.getSource();
            let oParentRow = oSource.getParent();
            let jRow = oParentRow.getBindingContext("oModelProyect");
            let jData = jRow.getObject();
            that.oModelProyect.setProperty("/oCabecera", jData);
            that.oRouter.navTo("Detail", {
                app: jData.RequestForQuotation,
                supplier: jData.Supplier,
                SupplierQuotation: jData.SupplierQuotation
            });
        },
        _filterLocal: function (aData, aFilters) {
            const parseSAPDate = (val) => {
                if (!val) return null;
                if (typeof val === "string" && val.includes("/Date(")) {
                    return new Date(parseInt(val.replace(/[^\d]/g, ""), 10));
                }
                return new Date(val);
            };
            const validateOR = (item, f) => {
                return f.aFilters.some(orFilter => validateSingle(item, orFilter));
            };
            const validateSingle = (item, f) => {
                const field = item[f.sPath];
                const op = f.sOperator;
                if (op === FilterOperator.EQ) {
                    return field == f.oValue1;
                }
                if (op === FilterOperator.GE) {
                    return parseSAPDate(field) >= parseSAPDate(f.oValue1);
                }
                if (op === FilterOperator.LE) {
                    return parseSAPDate(field) <= parseSAPDate(f.oValue1);
                }
                if (op === FilterOperator.BT) {
                    return (
                        parseSAPDate(field) >= parseSAPDate(f.oValue1) &&
                        parseSAPDate(field) <= parseSAPDate(f.oValue2)
                    );
                }
                return true;
            };
            return aData.filter(item => {
                return aFilters.every(f => {
                    if (f.aFilters && Array.isArray(f.aFilters)) {
                        return validateOR(item, f);
                    } else {
                        return validateSingle(item, f);
                    }
                });
            });
        },
        _onPressExecute: function () {
            const jFilter = that.oModelProyect.getProperty("/Main/filter") || {};
            const isExternal = that.getModel("oModelUser").getProperty("/bExterno") === true;
            const sFixedBp = String(that.getModel("oModelUser").getProperty("/sBpProv") || sBpProv || "").trim();

            if (isExternal) {
                if (!sFixedBp) {
                    sap.m.MessageBox.error("Su usuario no tiene un BP asignado. Contacte con soporte.");
                    return;
                }

                jFilter.fSupplier = [sFixedBp];
                jFilter.fNameSupplier = [];
                that.oModelProyect.setProperty("/Main/filter/fSupplier", [sFixedBp]);
                that.oModelProyect.setProperty("/Main/filter/fNameSupplier", []);
            }

            sap.ui.core.BusyIndicator.show(0);

            Promise.all([
                that._getData(),
                that._getPetOffertMain(null, isExternal ? sFixedBp : null)
            ]).then((values) => {
                const oData = values[0];
                const oDataPet = values[1];

                if (oData.sEstado === "E") {
                    that.getMessageBox("error", that.getI18nText("errorData"));
                    sap.ui.core.BusyIndicator.hide(0);
                    return;
                }

                let aReporte = oDataPet.oResults || [];

                if (that.aFilter.length > 0) {
                    aReporte = that._filterLocal(aReporte, that.aFilter);
                }

                // Seguridad extra: si es externo, dejar solo su BP
                if (isExternal && sFixedBp) {
                    aReporte = aReporte.filter(row => String(row.Supplier || "").trim() === sFixedBp);
                }

                aReporte = aReporte.map(function (row) {
                    return Object.assign({}, row, {
                        NotaEdit: row.Nota || "",
                        _notaEditable: false
                    });
                });

                // Orden por Fecha de Petición: más actual primero.
                aReporte = that._sortByFechaPeticionDesc(aReporte);

                const aDebugFine = (aReporte || [])
                    .filter(x => String(x.RequestForQuotation).trim() === "7000000102")
                    .map(x => ({
                        RequestForQuotation: x.RequestForQuotation,
                        Supplier: x.Supplier,
                        NameSupplier: x.NameSupplier,
                        SupplierQuotation: x.SupplierQuotation,
                        CreationDate: x.CreationDate,
                        QuotationDate: x.QuotationDate,
                        DscStatus: x.DscStatus,
                        QtnStatus: x.QtnStatus,
                        PartnerCounter: x.PartnerCounter,
                        PartnerFunction: x.PartnerFunction
                    }));

                console.log("==== DEBUG FINO RFQ 7000000102 ====");
                console.table(aDebugFine);

                that.oModelProyect.setProperty("/oReporte", aReporte);
                sap.ui.core.BusyIndicator.hide(0);
            }).catch((oError) => {
                console.error("Error _onPressExecute:", oError);
                that.getMessageBox("error", that.getI18nText("errorData"));
                sap.ui.core.BusyIndicator.hide(0);
            });
        },
        _getData: function () {
            try {
                var oResp = { sEstado: "E", oResults: [] };

                return new Promise(function (resolve, reject) {
                    that.aFilter = [];

                    const jFilter = that.getModel("oModelProyect").getProperty("/Main/filter") || {};
                    const isExternal = that.getModel("oModelUser").getProperty("/bExterno") === true;
                    const sFixedBp = String(that.getModel("oModelUser").getProperty("/sBpProv") || sBpProv || "").trim();

                    let aSupplier = Array.isArray(jFilter.fSupplier) ? jFilter.fSupplier.slice() : [];

                    if (isExternal && sFixedBp) {
                        aSupplier = [sFixedBp];
                        that.getModel("oModelProyect").setProperty("/Main/filter/fSupplier", [sFixedBp]);
                    }

                    if (Array.isArray(aSupplier) && aSupplier.length > 0) {
                        const aSupplierFilters = aSupplier.map(val =>
                            new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, val)
                        );
                        that.aFilter.push(new sap.ui.model.Filter(aSupplierFilters, false));
                    }

                    if (!isExternal && Array.isArray(jFilter.fNameSupplier) && jFilter.fNameSupplier.length > 0) {
                        const aNameFilters = jFilter.fNameSupplier.map(val =>
                            new sap.ui.model.Filter("NameSupplier", sap.ui.model.FilterOperator.EQ, val)
                        );
                        that.aFilter.push(new sap.ui.model.Filter(aNameFilters, false));
                    }

                    if (Array.isArray(jFilter.sNotification) && jFilter.sNotification.length > 0) {
                        const aStatusFilters = jFilter.sNotification.map(val =>
                            new sap.ui.model.Filter("DscStatus", sap.ui.model.FilterOperator.EQ, val)
                        );
                        that.aFilter.push(new sap.ui.model.Filter(aStatusFilters, false));
                    }

                    if (jFilter.fCreationDateFrom && jFilter.fCreationDateTo) {
                        const oFrom = new Date(jFilter.fCreationDateFrom);
                        const oTo = new Date(jFilter.fCreationDateTo);

                        const fromUtc = Date.UTC(
                            oFrom.getFullYear(),
                            oFrom.getMonth(),
                            oFrom.getDate(),
                            0, 0, 0, 0
                        );

                        const toUtc = Date.UTC(
                            oTo.getFullYear(),
                            oTo.getMonth(),
                            oTo.getDate(),
                            23, 59, 59, 999
                        );

                        that.aFilter.push(new sap.ui.model.Filter(
                            "CreationDate",
                            sap.ui.model.FilterOperator.BT,
                            `/Date(${fromUtc})/`,
                            `/Date(${toUtc})/`
                        ));
                    } else if (jFilter.fCreationDateFrom) {
                        const oFrom = new Date(jFilter.fCreationDateFrom);

                        const fromUtc = Date.UTC(
                            oFrom.getFullYear(),
                            oFrom.getMonth(),
                            oFrom.getDate(),
                            0, 0, 0, 0
                        );

                        that.aFilter.push(new sap.ui.model.Filter(
                            "CreationDate",
                            sap.ui.model.FilterOperator.GE,
                            `/Date(${fromUtc})/`
                        ));
                    } else if (jFilter.fCreationDateTo) {
                        const oTo = new Date(jFilter.fCreationDateTo);

                        const toUtc = Date.UTC(
                            oTo.getFullYear(),
                            oTo.getMonth(),
                            oTo.getDate(),
                            23, 59, 59, 999
                        );

                        that.aFilter.push(new sap.ui.model.Filter(
                            "CreationDate",
                            sap.ui.model.FilterOperator.LE,
                            `/Date(${toUtc})/`
                        ));
                    }

                    if (Array.isArray(jFilter.aRequestForQuotationSelected) && jFilter.aRequestForQuotationSelected.length > 0) {
                        const aPetitionFilters = jFilter.aRequestForQuotationSelected.map(val =>
                            new sap.ui.model.Filter("RequestForQuotation", sap.ui.model.FilterOperator.EQ, val)
                        );
                        that.aFilter.push(new sap.ui.model.Filter(aPetitionFilters, false));
                    }

                    oResp.sEstado = "S";
                    oResp.oResults = [];
                    resolve(oResp);
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
        _onPressExectudEdit: function () {
            let oTable = sap.ui.core.Fragment.byId("frgIdTableMain", "miTablaPrincipal");
            let aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length !== 1) {
                sap.m.MessageToast.show("Seleccione una única petición para editar.");
                return;
            }
            let oContext = aSelectedItems[0].getBindingContext("oModelProyect");
            let oData = oContext.getObject();

            if (oData.estado === "Bloqueado") {
                sap.m.MessageBox.warning(
                    `La petición ${oData.txt1} está bloqueada y no puede ser editada.`
                );
                return;
            }
            if (!this._oEditDialog) {
                this._oEditDialog = sap.ui.xmlfragment(this.getView().getId(), "com.proveedor.peticionoferta.pe.view.dialogs.EditPeticion", this);
                this.getView().addDependent(this._oEditDialog);
            }
            this._oEditDialog.setBindingContext(oContext, "oModelProyect");
            this._oEditDialog.open();
        },
        _onEditPeticionConfirm: function () {
            this._oEditDialog.close();
            sap.m.MessageToast.show("Petición actualizada con éxito.");
        },
        _onCloseEditDialog: function () {
            this._oEditDialog.close();
        },
        onClearFilters: function (oEvent) {
            let oModel = this.getModel("oModelProyect");
            const isExternal = this.getModel("oModelUser").getProperty("/bExterno") === true;
            const sFixedBp = String(this.getModel("oModelUser").getProperty("/sBpProv") || sBpProv || "").trim();

            const oNewFilter = {
                fNameSupplier: [],
                fSupplier: [],
                fCreationDate: "",
                fCreationDateFrom: null,
                fCreationDateTo: null,
                sNotification: [],
                aRequestForQuotationSelected: [],
                fRequestForQuotationFrom: "",
                fRequestForQuotationTo: ""
            };

            if (isExternal && sFixedBp) {
                oNewFilter.fSupplier = [sFixedBp];
            }

            oModel.setProperty("/Main/filter", oNewFilter);
            oModel.setProperty("/oReporte", []);

            let oTable = sap.ui.getCore().byId("frgIdTableMain--miTablaPrincipal") || this.byId("miTablaPrincipal");
            if (oTable) {
                let oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.filter([]);
                }
            }
        },
        onReset: function (oEvent) {
            this.onClearFilters();
        },
        handleFUChange: async function (oEvent) {
            const oFU = oEvent.getSource();
            const aFiles =
                oEvent.getParameter("files") ||
                (oFU.oFileUpload && oFU.oFileUpload.files) ||
                [];
            if (!aFiles.length) {
                sap.m.MessageToast.show("No hay archivos seleccionados.");
                return;
            }
            if (!this.routeSharepoint || !this.driveId) {
                sap.m.MessageBox.error("Falta configuración de SharePoint (routeSharepoint/driveId).");
                return;
            }
            const oCtx = oFU.getBindingContext("oModelProyect");
            if (!oCtx) {
                sap.m.MessageBox.error("No se pudo determinar la petición/oferta desde la fila seleccionada.");
                return;
            }
            const oRow = oCtx.getObject() || {};
            const sCodigoPeticion = oRow.RequestForQuotation || "";   // Nº de petición
            const sCodigoOferta = oRow.SupplierQuotation || "";   // Nº de oferta

            if (!sCodigoPeticion || !sCodigoOferta) {
                sap.m.MessageBox.error(
                    "No se puede subir el archivo.\n" +
                    "Debe existir número de petición y número de oferta para crear la carpeta en SharePoint."
                );
                return;
            }
            const aFolderChain = [
                `RFQ_${sCodigoPeticion}`,
                `Q_${sCodigoOferta}`
            ];
            try {
                const oFolderResp = await this._ensureSharePointFolderChain(aFolderChain);
                if (!oFolderResp || oFolderResp.sEstado !== "S") {
                    console.error("❌ Error garantizando carpetas en SharePoint:", oFolderResp);
                    sap.m.MessageBox.error("No se pudo preparar la carpeta destino en SharePoint.");
                    return;
                }
                for (const file of aFiles) {
                    try {
                        const resp = await this._uploadSharepoint(
                            file,
                            /* onProgress */() => { },
                            aFolderChain
                        );

                        if (resp.sEstado === "S" && resp.oResults && resp.oResults.id) {
                            sap.m.MessageToast.show(`✅ ${file.name} subido correctamente`);
                        } else {
                            console.error("❌ Error al subir:", resp.oResults);
                            sap.m.MessageToast.show(`❌ Error subiendo ${file.name}`);
                        }
                    } catch (e) {
                        console.error("❌ Excepción al subir:", e);
                        sap.m.MessageToast.show(`❌ Error subiendo ${file.name}`);
                    }
                }

            } catch (e) {
                console.error("❌ Error general en handleFUChange:", e);
                sap.m.MessageBox.error("Ocurrió un error al preparar o subir archivos a SharePoint.");
            }
            if (oFU.clear) {
                oFU.clear();
            }
            if (typeof this.handleUploadComplete === "function") {
                this.handleUploadComplete({ files: aFiles, rowData: oRow });
            }
        },
        // Para las notas 
        _getNotCabecera: function (sOfepos) {
            that = this;
            try {
                var oResp = {
                    sEstado: "E",
                    oResults: []
                };

                return new Promise(function (resolve, reject) {
                    if (!sOfepos) {
                        // si no hay oferta, devolvemos vacío
                        oResp.sEstado = "S";
                        oResp.oResults = [];
                        resolve(oResp);
                        return;
                    }

                    let sUrl = "";
                    // armamos el filtro dinámico
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
                                oResp.oResults = oData.data; // luego lo “normalizamos”
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
        _deleteNotasOferta: function (sOfepos) {
            const that = this;
            if (!sOfepos) {
                // No hay oferta → nada que borrar
                return Promise.resolve();
            }

            return this._getNotCabecera(sOfepos).then(function (oNotasResp) {
                let aNotas = [];
                const d = oNotasResp && oNotasResp.oResults;

                if (d) {
                    if (d.d && Array.isArray(d.d.results)) {
                        aNotas = d.d.results;
                    } else if (Array.isArray(d.results)) {
                        aNotas = d.results;
                    } else if (Array.isArray(d)) {
                        aNotas = d;
                    }
                }

                if (!aNotas.length) {
                    // No hay notas Z → nada que borrar
                    return Promise.resolve();
                }

                const oModelOData = that.getOwnerComponent().getModel("oModelEntityNote");

                const aDelPromises = aNotas.map(function (note) {
                    return new Promise(function (resolve, reject) {

                        // 🔐 Blindaje: si faltan claves, no llamamos al backend
                        if (!note.Ofepos || note.Linea === undefined || note.Linea === null) {
                            console.warn("⚠️ Nota Z sin claves válidas, se omite borrado:", note);
                            resolve();
                            return;
                        }

                        const sKeyPath =
                            "/NotaOfertaSet(Ofepos='" + note.Ofepos + "',Linea=" + note.Linea + ")";

                        console.log("🗑️ Borrando nota Z:", sKeyPath);

                        oModelOData.remove(sKeyPath, {
                            success: function () {
                                resolve();
                            },
                            error: function (oError) {
                                console.error("❌ Error eliminando nota Z:", oError);
                                reject(oError);
                            }
                        });
                    });
                });

                return Promise.all(aDelPromises);
            });
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
        onNotaEditPress: async function () {
            const oTable = sap.ui.core.Fragment.byId(this.frgIdTableMain, "miTablaPrincipal");
            const oModel = this.getView().getModel("oModelProyect");

            if (!oTable) {
                sap.m.MessageBox.error("No se encontró la tabla de peticiones.");
                return;
            }

            const aSelected = oTable.getSelectedItems() || [];
            if (!aSelected.length) {
                sap.m.MessageBox.warning("Seleccione una fila para agregar o editar la nota.");
                return;
            }
            if (aSelected.length > 1) {
                sap.m.MessageBox.warning("Solo puede editar la nota de una línea a la vez.");
                return;
            }

            const oCtx = aSelected[0].getBindingContext("oModelProyect");
            if (!oCtx) {
                sap.m.MessageBox.error("No se pudo obtener la información de la fila seleccionada.");
                return;
            }

            const oRow = oCtx.getObject() || {};

            if (!oRow.SupplierQuotation) {
                sap.m.MessageBox.error(
                    "Todavía no hay una oferta asociada al pedido.\n" +
                    "Primero genere la oferta, guárdela (sin publicar) y luego podrá agregar notas."
                );
                return;
            }
            const sDscStatus = (oRow.DscStatus || "").trim();
            const sQtnStatus = (oRow.QtnStatus || "").trim();
            const bEstadoValido =
                sDscStatus.toUpperCase() === "PENDIENTE" &&
                sQtnStatus === "01";
            if (!bEstadoValido) {
                sap.m.MessageBox.warning(
                    "Solo puede editar notas cuando la petición está en estado 'Pendiente' " +
                    "y la oferta tiene QtnStatus = '01'.\n\n" +
                    "Estado actual:\n" +
                    " - DscStatus: " + (sDscStatus || "(vacío)") + "\n" +
                    " - QtnStatus: " + (sQtnStatus || "(vacío)")
                );
                return;
            }
            const sSupplierQuotation = oRow.SupplierQuotation;
            try {
                sap.ui.core.BusyIndicator.show(0);

                // 1️⃣ Aseguramos borrador estándar de la cotización
                const oDraftInfo = await this._ensureQtnDraft(sSupplierQuotation);
                const sDraftUUID = oDraftInfo.DraftUUID;
                const sObjectId = this._guidToObjectId(sDraftUUID);

                // 2️⃣ Leemos la nota estándar NOTE_FROM_SUPPLIER
                const sNotaActual = await this._loadHeaderNote(sObjectId);

                // 3️⃣ Activamos edición solo en esa fila
                const aReporte = oModel.getProperty("/oReporte") || [];
                aReporte.forEach(r => r._notaEditable = false);

                oRow.Nota = sNotaActual;
                oRow.NotaEdit = sNotaActual;
                oRow._notaEditable = true;
                oRow.DraftUUIDHeader = sDraftUUID; // para reutilizar en el guardado

                oModel.setProperty("/oReporte", aReporte);

                sap.m.MessageToast.show("Nota de cabecera cargada. Ya puede editar el texto.");
            } catch (e) {
                console.error("❌ Error en onNotaEditPress (estándar):", e);
                sap.m.MessageBox.error("Ocurrió un error al preparar el borrador o leer la nota estándar de cabecera.");
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },

        onNotaSavePress: async function () {
            const oView = this.getView();
            const oModelProyect = oView.getModel("oModelProyect");
            const oTable = sap.ui.core.Fragment.byId(this.frgIdTableMain, "miTablaPrincipal");

            if (!oTable) {
                sap.m.MessageBox.error("No se encontró la tabla de peticiones.");
                return;
            }

            const aSelected = oTable.getSelectedItems() || [];
            if (!aSelected.length) {
                sap.m.MessageBox.warning("Seleccione una fila para guardar la nota.");
                return;
            }
            if (aSelected.length > 1) {
                sap.m.MessageBox.warning("Solo puede guardar la nota de una línea a la vez.");
                return;
            }

            const oCtx = aSelected[0].getBindingContext("oModelProyect");
            if (!oCtx) {
                sap.m.MessageBox.error("No se pudo obtener la información de la fila seleccionada.");
                return;
            }

            const oRow = oCtx.getObject() || {};

            if (!oRow.SupplierQuotation) {
                sap.m.MessageBox.error(
                    "Todavía no hay una oferta asociada al pedido.\n" +
                    "Primero genere la oferta, guárdela (sin publicar) y luego podrá agregar notas."
                );
                return;
            }
            const sDscStatus = (oRow.DscStatus || "").trim();
            const sQtnStatus = (oRow.QtnStatus || "").trim();

            const bEstadoValido =
                sDscStatus.toUpperCase() === "PENDIENTE" &&
                sQtnStatus === "01";

            if (!bEstadoValido) {
                sap.m.MessageBox.warning(
                    "Solo puede guardar notas cuando la petición está en estado 'Pendiente' " +
                    "y la oferta tiene QtnStatus = '01'.\n\n" +
                    "Estado actual:\n" +
                    " - DscStatus: " + (sDscStatus || "(vacío)") + "\n" +
                    " - QtnStatus: " + (sQtnStatus || "(vacío)")
                );
                return;
            }
            const sSupplierQuotation = oRow.SupplierQuotation;
            const sNotaNew = (oRow.NotaEdit || "").trim();  // texto en el input
            const sNotaOld = (oRow.Nota || "").trim();      // último texto guardado

            // 0️⃣ Si NO cambió la nota → no llamamos a nada
            if (sNotaNew === sNotaOld) {
                sap.m.MessageToast.show("No hay cambios en la nota. No se envió nada.");
                return;
            }

            // 1️⃣ Si la nueva nota está vacía → BORRAR solo en estándar
            if (!sNotaNew) {
                sap.m.MessageBox.confirm(
                    "El texto de la nota está vacío.\n¿Desea borrar la nota estándar de esta oferta?",
                    {
                        title: "Borrar nota de cabecera",
                        onClose: async function (sAction) {
                            if (sAction !== sap.m.MessageBox.Action.OK) {
                                return;
                            }

                            sap.ui.core.BusyIndicator.show(0);
                            try {
                                let sDraftUUID = oRow.DraftUUIDHeader;
                                if (!sDraftUUID) {
                                    const oDraftInfo = await this._ensureQtnDraft(sSupplierQuotation);
                                    sDraftUUID = oDraftInfo.DraftUUID;
                                }

                                // Guardar nota vacía = borrar NOTE_FROM_SUPPLIER
                                await this._saveHeaderNoteStandard(
                                    sSupplierQuotation,
                                    sDraftUUID,
                                    ""   // vacío = borrar estándar
                                );

                                // Limpiar modelo local
                                oRow._notaEditable = false;
                                oRow.Nota = "";
                                oRow.NotaEdit = "";
                                oCtx.getModel().refresh(true);

                                sap.m.MessageToast.show("Nota de cabecera borrada correctamente en estándar.");
                            } catch (e) {
                                console.error("❌ Error borrando nota estándar de cabecera:", e);
                                sap.m.MessageBox.error("Ocurrió un error al borrar la nota estándar de cabecera.");
                            } finally {
                                sap.ui.core.BusyIndicator.hide(0);
                            }
                        }.bind(this)
                    }
                );
                return;
            }

            // 2️⃣ Texto nuevo ≠ texto viejo y NO vacío → actualizar solo estándar
            sap.ui.core.BusyIndicator.show(0);
            try {
                let sDraftUUID = oRow.DraftUUIDHeader;
                if (!sDraftUUID) {
                    const oDraftInfo = await this._ensureQtnDraft(sSupplierQuotation);
                    sDraftUUID = oDraftInfo.DraftUUID;
                }

                await this._saveHeaderNoteStandard(
                    sSupplierQuotation,
                    sDraftUUID,
                    sNotaNew
                );

                // Actualizar modelo local
                oRow._notaEditable = false;
                oRow.Nota = sNotaNew;     // ahora esto es la nota "vieja"
                oRow.NotaEdit = sNotaNew;
                oCtx.getModel().refresh(true);

                sap.m.MessageBox.success("Nota de cabecera guardada/modificada correctamente en estándar.");
            } catch (e) {
                console.error("❌ Error al guardar nota estándar de cabecera:", e);
                sap.m.MessageBox.error(
                    "Ocurrió un error al guardar la nota estándar de cabecera."
                );
            } finally {
                sap.ui.core.BusyIndicator.hide(0);
            }
        },



        _formatDateDDMMYYYY: function (sapDate) {
            if (!sapDate) return "";
            try {
                if (typeof sapDate === "string" && sapDate.includes("/Date(")) {
                    const timestamp = parseInt(sapDate.replace(/[^0-9]/g, ""), 10);
                    const date = new Date(timestamp);
                    const day = String(date.getUTCDate()).padStart(2, "0");
                    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
                    const year = date.getUTCFullYear();
                    return `${day}/${month}/${year}`;
                }
                if (typeof sapDate === "string" && sapDate.includes("-")) {
                    const sOnlyDate = sapDate.split("T")[0];
                    const [year, month, day] = sOnlyDate.split("-");
                    if (year && month && day) {
                        return `${day}/${month}/${year}`;
                    }
                }
                return sapDate;
            } catch (e) {
                console.warn("⚠️ Error parseando fecha:", sapDate, e);
                return sapDate;
            }
        },

        // Crear un boton de eliminar todas las notas si se requiere utilizar este codigo
        onNotaDeletePress: function () {
            // Simplemente vaciamos NotaEdit y reutilizamos onNotaSavePress
            const oTable = sap.ui.core.Fragment.byId(this.frgIdTableMain, "miTablaPrincipal");
            if (!oTable) {
                sap.m.MessageBox.error("No se encontró la tabla de peticiones.");
                return;
            }

            const aSelected = oTable.getSelectedItems() || [];
            if (!aSelected.length) {
                sap.m.MessageBox.warning("Seleccione una fila para borrar la nota.");
                return;
            }
            if (aSelected.length > 1) {
                sap.m.MessageBox.warning("Solo puede borrar la nota de una línea a la vez.");
                return;
            }

            const oCtx = aSelected[0].getBindingContext("oModelProyect");
            if (!oCtx) {
                sap.m.MessageBox.error("No se pudo obtener la información de la fila seleccionada.");
                return;
            }

            const oRow = oCtx.getObject() || {};
            oRow.NotaEdit = "";   // disparará el flujo de borrado en onNotaSavePress
            this.onNotaSavePress();
        },

        _guidToObjectId: function (sGuid) {
            if (!sGuid) { return ""; }
            return String(sGuid).replace(/-/g, "").toUpperCase();
        },
        _getNoteServiceUrl: function () {
            let sUrl;
            if (this.local) {
                const sPath = "/sap/opu/odata/sap/SGBT_NTE_CDS_API_D_SRV/";
                sUrl = this.getOwnerComponent().getManifestObject().resolveUri(sPath);
            } else {
                const sPath = jQuery.sap.getModulePath(this.route) +
                    "/S4HANA/sap/opu/odata/sap/SGBT_NTE_CDS_API_D_SRV/";
                sUrl = sPath;
            }
            return sUrl;
        },
        _getQtnServiceUrl: function () {
            return jQuery.sap.getModulePath("com.proveedor.peticionoferta.pe") +
                "/S4HANA/sap/opu/odata/sap/MM_PUR_QTN_MAINTAIN_SRV/";
        },
        _ensureQtnDraft: async function (sSupplierQuotation) {
            const sServiceUrl = this._getQtnServiceUrl();

            const sPath =
                `${sServiceUrl}C_SuplrQuotationEnhWDEdit?` +
                `SupplierQuotation='${sSupplierQuotation}'` +
                `&DraftUUID=guid'00000000-0000-0000-0000-000000000000'` +
                `&IsActiveEntity=true`;

            const oResp = await Services.postoDataERPAsync(
                this,
                sServiceUrl,
                sPath,
                {},   // body vacío
                null  // callback
            );

            const oData =
                oResp?.data ||
                oResp?.d ||
                oResp || {};

            const sDraftUUID = oData.DraftUUID;
            if (!sDraftUUID) {
                throw new Error("No se obtuvo DraftUUID al crear/editar el borrador de la cotización.");
            }

            return {
                SupplierQuotation: oData.SupplierQuotation || sSupplierQuotation,
                DraftUUID: sDraftUUID
            };
        },


        //reemplazo de la funcion de arriba Marlon Estefo
        _saveHeaderNoteStandard2: async function (sSupplierQuotation, sDraftUUID, sNota) {
            const sObjectId = this._guidToObjectId(sDraftUUID);
            const sNoteServiceUrl = this._getNoteServiceUrl();

            const sFilterStr =
                `ObjectID eq '${sObjectId}' ` +
                `and ObjectNodeType eq 'SupplierQuotation' ` +
                `and IsActiveEntity eq false ` +
                `and NoteType eq 'NOTE_FROM_SUPPLIER'`;

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

            const oContextHeaders = {
                "gbtnte-noteTypes": "DETAILED_DESCRIPTION,INTERNAL_MEMO,NOTE_FROM_SUPPLIER",
                "gbtnte-objectId": sSupplierQuotation,
                "gbtnte-objectNodeType": "SupplierQuotation"
            };

            // 1) BORRAR si el texto viene vacío
            if (!sNota || !String(sNota).trim()) {
                if (oNoteExist && oNoteExist.NoteID) {
                    const sEntityUrl =
                        `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp(` +
                        `NoteID=guid'${oNoteExist.NoteID}',` +
                        `IsActiveEntity=false)`;

                    await Services.postoDataERPWithHeadersAsync(
                        this,
                        sNoteServiceUrl,
                        sEntityUrl,
                        {},
                        Object.assign({}, oContextHeaders, {
                            "X-HTTP-Method": "DELETE"
                        })
                    );
                }

                return true;
            }

            // 2) UPDATE si ya existe
            if (oNoteExist && oNoteExist.NoteID) {
                const sEntityUrl =
                    `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp(` +
                    `NoteID=guid'${oNoteExist.NoteID}',` +
                    `IsActiveEntity=false)`;

                const oBodyUpdate = {
                    "__metadata": {
                        "type": "SGBT_NTE_CDS_API_D_SRV.C_Sgbt_Nte_Cds_ApitpType"
                    },
                    "Content": sNota,
                    "Language": oNoteExist.Language || "ES",
                    "NoteType": "NOTE_FROM_SUPPLIER",
                    "ObjectID": sObjectId,
                    "ObjectNodeType": "SupplierQuotation",
                    "IsActiveEntity": false
                };

                try {
                    await Services.postoDataERPWithHeadersAsync(
                        this,
                        sNoteServiceUrl,
                        sEntityUrl,
                        oBodyUpdate,
                        Object.assign({}, oContextHeaders, {
                            "X-HTTP-Method": "MERGE"
                        })
                    );

                    return true;
                } catch (eMerge) {
                    console.warn("⚠️ MERGE de nota falló, se intentará recreate:", eMerge);

                    // fallback: borrar y volver a crear
                    await Services.postoDataERPWithHeadersAsync(
                        this,
                        sNoteServiceUrl,
                        sEntityUrl,
                        {},
                        Object.assign({}, oContextHeaders, {
                            "X-HTTP-Method": "DELETE"
                        })
                    );
                }
            }

            // 3) CREATE si no existe o si el MERGE falló y se borró
            const sCollectionPath = `${sNoteServiceUrl}C_Sgbt_Nte_Cds_Apitp`;

            const oBodyCreate = {
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

            await Services.postoDataERPWithHeadersAsync(
                this,
                sNoteServiceUrl,
                sCollectionPath,
                oBodyCreate,
                oContextHeaders
            );

            return true;
        },
    });
});
