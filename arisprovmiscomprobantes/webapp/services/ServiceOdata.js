sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		oDataConsultODATA: function (sType, sUrl, aData, aFilters, sReturn, that) {
			try {
				OData.defaultHttpClient.enableJsonpCallback = true;
				var oHeaders = {};
				var url = "";
				var request = {
					headers: oHeaders,
					requestUri: url,
					method: sType
				};
				var iEnd = "";
				var sFilters = "";
				url = "/sap/opu/odata/sap/ZOSDD_CUSTOM_VENDOR_CDS/" + sUrl;

				var promise = new Promise(function (resolve, reject) {
					switch (sType) {
					case "GET":
						if (aFilters.length > 0 && sReturn === "1") {
							sFilters = "";
							request.url = url + "?$";
							for (var i = 0; i < aFilters.length; i++) {
								sFilters = aFilters[i].sPath + " " + aFilters[i].sOperator + " " + typeof aFilters[i].oValue1 === "string" ? "'" + aFilters[i]
									.oValue1 + "'" : String(aFilters[i].oValue1) + " and " + sFilters;
							}
							var iEnd = sFilters.lastIndexOf("and");
							sFilters.substring(0, iEnd);
							request.url = request + sFilters;
							OData.read(request, function (result) {
								resolve(result);
							}, function (error) {
								reject(error);
							});
						} else if (sReturn === "1") {
							OData.read(request, function (result) {
								resolve(result);
							}, function (error) {
								reject(error);
							});

						} else if (aFilters.length > 0 && sReturn === "2") {
							request.url = url + "?$";
							sFilters = "";
							request.url = url + "?$";
							for (var i = 0; i < aFilters.length; i++) {
								sFilters = aFilters[i].sPath + " " + aFilters[i].sOperator + " " + typeof aFilters[i].oValue1 === "string" ? "'" + aFilters[i]
									.oValue1 + "'" : String(aFilters[i].oValue1) + " and " + sFilters;
							}
							iEnd = sFilters.lastIndexOf("and");
							sFilters.substring(0, iEnd);
							request.url = request + sFilters;
							OData.read(request, function (result) {
								var resultG = [];
								resultG.push(result);
								resultG.push(aData);
								resolve(resultG);
							}, function (error) {
								reject(error);
							});

						}

						break;
					case "POST":

						oHeaders['Content-Type'] = "application/json";
						oHeaders['accept'] = "application/json";
						oHeaders['If-Match'] = "*"; //Some services needs If-Match Header for Update/delete
						request.headers = oHeaders;
						request.data = aData;
						OData.request(request, function (result) {
							resolve(result);
						}, function (error) {
							reject(error);
						});
						break;
					default:
					}

				});
				return promise;
			} catch (error) {
				that.getMessageBox("error", that.getI18nText("error"));
				$.oLog.push({
					error: error,
					date: new Date()
				});
			}

		},
		oDataConsult: function (sType, sUrl, aData, aFilters, sReturn, that, urlParams) {
			try {
				return new Promise(function (resolve, reject) {
					if (typeof sap.hybrid !== 'undefined' && navigator.onLine) {
						switch (sType) {
						case "read":
							if (urlParams != undefined) {
								that.getModel("drizzleOD").read(sUrl, {
									filters: aFilters,
									urlParameters: urlParams,
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (aFilters.length > 0 && sReturn === "1") {
								that.getModel("drizzleOD").read(sUrl, {
									filters: aFilters,
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (sReturn === "1") {
								that.getModel("drizzleOD").read(sUrl, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (aFilters.length > 0 && sReturn === "2") {
								that.getModel("drizzleOD").read(sUrl, {
									filters: aFilters,
									success: function (result) {
										var resultG = [];
										resultG.push(result);
										resultG.push(aData);
										resolve(resultG);
									},
									error: function (error) {
										reject(error);
									}
								});
							}

							break;
						case "create":
							that.getModel("drizzleOD").create(sUrl, aData, {
								success: function (result) {
									resolve(result);
								},
								error: function (error) {
									reject(error);
								}
							});
							break;
						default:
						}
					} else {
						switch (sType) {
						case "read":
							if (urlParams !== undefined && urlParams !== "") {
								that.oModel[sType](sUrl, {
									filters: aFilters,
									urlParameters: urlParams,
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (aFilters.length > 0 && sReturn === "1") {
								that.oModel[sType](sUrl, {
									filters: aFilters,
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (sReturn === "1") {
								that.oModel[sType](sUrl, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (aFilters.length > 0 && sReturn === "2") {
								that.oModel[sType](sUrl, {
									filters: aFilters,
									success: function (result) {
										var resultG = [];
										resultG.push(result);
										resultG.push(aData);
										resolve(resultG);
									},
									error: function (error) {
										reject(error);
									}
								});
							}

							break;
						case "create":
							that.oModel[sType](sUrl, aData, {
								success: function (result) {
									resolve(result);
								},
								error: function (error) {
									reject(error);
								}
							});
							break;
						default:
						}
					}
				});
			} catch (error) {
				that.getMessageBox("error", that.getI18nText("error"));
				$.oLog.push({
					error: error,
					date: new Date()
				});
			}

		},
		oFTP: function (sType, sUrl, aData, aFilters, sReturn, that, oHeader) {
			try {
				return new Promise(function (resolve, reject) {

					if (typeof sap.hybrid !== 'undefined' && navigator.onLine) {
						switch (sType) {
						case "read":
							if (aFilters.length > 0 && sReturn === "1") {
								that.getModel("drizzleOD").read(sUrl, {
									filters: aFilters,
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (sReturn === "1") {
								that.getModel("drizzleOD").read(sUrl, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							}

							break;
						case "create":
							if (sReturn === "1") {
								that.getModel("drizzleOD").create(sUrl, aData, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (sReturn === "2") {
								that.getModel("drizzleOD").create(sUrl, aData, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							}
							break;
						default:
						}
					} else {
						switch (sType) {
						case "read":
							if (aFilters.length > 0 && sReturn === "1") {
								that.oModel[sType](sUrl, {
									filters: aFilters,
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (sReturn === "1") {
								that.oModel[sType](sUrl, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							}

							break;
						case "create":
							if (sReturn === "1") {
								that.oModel[sType](sUrl, aData, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							} else if (sReturn === "2") {
								that.oModel[sType](sUrl, aData, {
									success: function (result) {
										resolve(result);
									},
									error: function (error) {
										reject(error);
									}
								});
							}
							break;
						default:
						}
					}
				});
			} catch (error) {
				that.getMessageBox("error", that.getI18nText("error"));
				$.oLog.push({
					error: error,
					date: new Date()
				});
			}
		},
		/*
		 * 
		 * DOCUMENT SERVICE
		 * 
		 */
		http: function (url) {
			var core = {
				ajax: function (method, url, headers, args) {
					//Creating a promise
					var promise = new Promise(function (resolve, reject) {
						//Instantiates the XMLHttpRequest
						var client = new XMLHttpRequest();
						var uri = url;
						if (args && method === 'GET') {
							uri += '?';
							var argcount = 0;
							for (var key in args) {
								if (args.hasOwnProperty(key)) {
									if (argcount++) {
										uri += '&';
									}
									uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
								}
							}
						}

						client.open(method, uri, true);

						if (args && (method === 'POST' || method === 'PUT')) {
							var data = args;
						}
						for (var keyh in headers) {
							if (headers.hasOwnProperty(keyh)) {
								client.setRequestHeader(keyh, headers[keyh]);
							}
						}
						if (data) {
							client.send(data instanceof FormData ? data : JSON.stringify(data));
						} else {
							client.send();
						}
						client.onload = function () {
							if (this.status == 200 || this.status == 201) {
								//Performs the function "resolve" when this.status is equal to 200
								try {
									resolve(JSON.parse(this.response));
								} catch (ex) {
									resolve(this.response);
								}
							} else {
								// Performs the function "reject" when this.status is different than 200
								reject(this);
							}
						};
						client.onerror = function () {
							reject(this);
						};
					});

					//Return the promise
					return promise;
				}
			};

			//Adapter pattern

			return {
				'get': function (headers, args) {
					return core.ajax('GET', url, headers, args);
				},
				'post': function (headers, args) {
					return core.ajax('POST', url, headers, args);
				},
				'put': function (headers, args) {
					return core.ajax('PUT', url, headers, args);
				},
				'delete': function (headers, args) {
					return core.ajax('DELETE', url, headers, args);
				}
			};
		},
		createFolder: function (folderName, option) {
			var form = new FormData();
			form.append("cmisaction", "createFolder");
			form.append("propertyId[0]", "cmis:objectTypeId");
			form.append("propertyValue[0]", "cmis:folder");
			form.append("propertyId[1]", "cmis:name");
			form.append("propertyValue[1]", folderName);
			if (option === "2") {
				return this.getRepoId().then(function (ReposId) {
					return this.http("/drizzleDS/cmis/json/" + ReposId + "/root/DRIZZLE").post(false, form);
				});
			}
			if (option === "1") {
				var _this = this;
				return new Promise(function (resolve, reject) {
					try {
						_this.getRepoId().then(function (ReposId) {
							resolve(_this.http("/drizzleDS/cmis/json/" + ReposId + "/root").post(false, form));
						});
					} catch (error) {
						reject(error);
					}

				});

			}

		},
		uploadFile: function (oFile, sFolder) {
			var form = new FormData();
			form.append("datafile", oFile.FileBase64);
			form.append("cmisaction", "createDocument");
			form.append("propertyId[0]", "cmis:objectTypeId");
			form.append("propertyValue[0]", "cmis:document");
			form.append("propertyId[1]", "cmis:name");
			form.append("propertyValue[1]", oFile.Filename);

			return this.getRepoId().then(function (ReposId) {
				return this.http("/drizzleDS/cmis/json/" + ReposId + "/root/" + $.FolderPrincipal + "/" + sFolder).post(false, form);
			}.bind(this));
		},
		deleteFile: function (name) {
			var form = new FormData();
			form.append("cmisaction", "delete");
			return this.getRepoId().then(function (ReposId) {
				return this.http("/drizzleDS/cmis/json/" + ReposId + "/root/" + $.FolderPrincipal + "/" + name).post(false, form);
			}.bind(this));
		},
		getFiles: function () {
			return this.getRepoId().then(function (ReposId) {
				return this.http("/drizzleDS/cmis/json/" + ReposId + "/root/").get();
			}.bind(this));
		},
		getRepoId: function () {
			if (this.RepoId) {
				return Promise.resolve(this.RepoId);
			}
			return this.getRepoInfo().then(function (info) {
				for (var field in info) {
					this.ReposId = info[field].repositoryId;
					break;
				}
				return this.ReposId;
			}.bind(this));
		},
		getRepoInfo: function () {
			return this.http("/drizzleDS/cmis/json").get();
		}
	};
});