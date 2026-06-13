sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "../util/utilHttp"
], function(JSONModel, Device, utilHttp) {
    "use strict";

    return {

        // =====================
        // Modelo de dispositivo
        // =====================
        createDeviceModel: function() {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        // =====================
        // OData Async Helpers
        // =====================
        oDataGet: function(sUrl, aFilters = [], that) {
            return new Promise((resolve, reject) => {
                try {
                    let url = "/sap/opu/odata/sap/ZOSDD_CUSTOM_VENDOR_CDS/" + sUrl;
                    if (aFilters.length > 0) {
                        const sFilterStr = aFilters.map(f =>
                            `${f.sPath} ${f.sOperator} ${typeof f.oValue1 === "string" ? `'${f.oValue1}'` : f.oValue1}`
                        ).join(" and ");
                        url += `?$filter=${sFilterStr}`;
                    }
                    OData.read({ requestUri: url, method: "GET" },
                        result => resolve(result),
                        error => reject(error)
                    );
                } catch(err) {
                    reject(err);
                }
            });
        },

        oDataPost: function(sUrl, oData, that) {
            return new Promise((resolve, reject) => {
                try {
                    utilHttp.Post(sUrl, oData, function(result) {
                        resolve(result);
                    }, that);
                } catch(err) { reject(err); }
            });
        },

        oDataMerge: function(sUrl, oData, that) {
            return new Promise((resolve, reject) => {
                try {
                    utilHttp.Merge(sUrl, oData, function(result) {
                        resolve(result);
                    }, that);
                } catch(err) { reject(err); }
            });
        },

        // =====================
        // OData usando drizzleOD
        // =====================
        oDataConsult: function(sType, sUrl, aData, aFilters, sReturn, that, urlParams) {
            return new Promise((resolve, reject) => {
                try {
                    const fnSuccess = result => resolve(result);
                    const fnError = error => reject(error);

                    const oModel = (typeof sap.hybrid !== 'undefined' && navigator.onLine) ? that.getModel("drizzleOD") : that.oModel;

                    if (sType === "read") {
                        const oParams = { filters: aFilters || [], success: fnSuccess, error: fnError };
                        if (urlParams) oParams.urlParameters = urlParams;
                        oModel.read(sUrl, oParams);
                    } else if (sType === "create") {
                        oModel.create(sUrl, aData, { success: fnSuccess, error: fnError });
                    }
                } catch (err) {
                    reject(err);
                }
            });
        },

        // =====================
        // CMIS / FTP / Document Service
        // =====================
        http: function(url) {
            const core = {
                ajax: function(method, url, headers, args) {
                    return new Promise((resolve, reject) => {
                        const client = new XMLHttpRequest();
                        let uri = url;
                        if (args && method === 'GET') {
                            uri += '?' + Object.entries(args).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
                        }
                        client.open(method, uri, true);
                        let data;
                        if (args && (method === 'POST' || method === 'PUT')) data = args;
                        for (let key in headers) client.setRequestHeader(key, headers[key]);
                        client.send(data instanceof FormData ? data : JSON.stringify(data));
                        client.onload = function() {
                            if (this.status === 200 || this.status === 201) {
                                try { resolve(JSON.parse(this.response)); } catch(ex){ resolve(this.response); }
                            } else { reject(this); }
                        };
                        client.onerror = function() { reject(this); };
                    });
                }
            };
            return {
                get: (headers, args) => core.ajax('GET', url, headers, args),
                post: (headers, args) => core.ajax('POST', url, headers, args),
                put: (headers, args) => core.ajax('PUT', url, headers, args),
                delete: (headers, args) => core.ajax('DELETE', url, headers, args)
            };
        },

        createFolder: async function(folderName, option) {
            const form = new FormData();
            form.append("cmisaction", "createFolder");
            form.append("propertyId[0]", "cmis:objectTypeId");
            form.append("propertyValue[0]", "cmis:folder");
            form.append("propertyId[1]", "cmis:name");
            form.append("propertyValue[1]", folderName);

            const repoId = await this.getRepoId();
            const path = option === "2" ? `/root/DRIZZLE` : `/root`;
            return this.http(`/drizzleDS/cmis/json/${repoId}${path}`).post(false, form);
        },

        uploadFile: async function(oFile, sFolder) {
            const form = new FormData();
            form.append("datafile", oFile.FileBase64);
            form.append("cmisaction", "createDocument");
            form.append("propertyId[0]", "cmis:objectTypeId");
            form.append("propertyValue[0]", "cmis:document");
            form.append("propertyId[1]", "cmis:name");
            form.append("propertyValue[1]", oFile.Filename);

            const repoId = await this.getRepoId();
            return this.http(`/drizzleDS/cmis/json/${repoId}/root/${$.FolderPrincipal}/${sFolder}`).post(false, form);
        },

        deleteFile: async function(name) {
            const form = new FormData();
            form.append("cmisaction", "delete");
            const repoId = await this.getRepoId();
            return this.http(`/drizzleDS/cmis/json/${repoId}/root/${$.FolderPrincipal}/${name}`).post(false, form);
        },

        getFiles: async function() {
            const repoId = await this.getRepoId();
            return this.http(`/drizzleDS/cmis/json/${repoId}/root/`).get();
        },

        getRepoId: async function() {
            if (this.RepoId) return this.RepoId;
            const info = await this.getRepoInfo();
            for (let field in info) {
                this.RepoId = info[field].repositoryId;
                break;
            }
            return this.RepoId;
        },

        getRepoInfo: async function() {
            return this.http("/drizzleDS/cmis/json").get();
        },

		

    };
});