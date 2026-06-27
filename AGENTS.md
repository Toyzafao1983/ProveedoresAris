# AGENTS.md

## Repo Shape
- This is not a root npm workspace; run npm commands from one app directory, not from the repo root.
- The six SAP Fiori/UI5 apps are `arisprovmiscomprobantes`, `com.aris.proveedores.facturasexterior.pe`, `com.aris.proveedores.pe.calendario`, `com.aris.proveedores.pe.misdatos`, `com.aris.proveedores.pe.pedidocompra`, and `com.proveedor.peticionoferta.pe`.
- Each app has its own `package.json`, `package-lock.json`, `ui5.yaml`, `ui5-local.yaml`, `ui5-deploy.yaml`, `mta.yaml`, `xs-app.json`, and `webapp/manifest.json`.

## Commands
- Install dependencies per app with `npm install` from that app directory; `mta.yaml` build steps also use `npm install`.
- Start an app with `npm start`; use `npm run start-local` for `ui5-local.yaml` without backend destinations.
- Build one app with `npm run build`; Cloud Foundry preload/zip build is `npm run build:cf`.
- Build an MTAR with `npm run build:mta`; this removes `resources` and `mta_archives` before running `mbt build`.
- Deploy/undeploy are per app: `npm run deploy` uses `fiori cfDeploy`, and `npm run undeploy` calls `cf undeploy ... --delete-services --delete-service-keys --delete-service-brokers`.
- There are no lint or typecheck scripts in these app manifests.

## Testing
- Unit and integration tests are browser-launched Fiori/QUnit pages, not headless CLI suites: `npm run unit-test` opens `test/unit/unitTests.qunit.html`, and `npm run int-test` opens `test/integration/opaTests.qunit.html`.
- Generated tests live under each app's `webapp/test`; verify the specific app you changed rather than assuming a repo-wide test command exists.

## UI5/BTP Details
- Runtime source is under each `webapp/`: `Component.js`, `controller/`, `view/`, `model/`, `services/`, `util/`, and app-specific `manifest.json` routing/models.
- These apps are plain JavaScript UI5 modules using `sap.ui.define`; TypeScript and ESLint were not generated for them.
- `ui5.yaml` uses `fiori-tools-proxy` for `/sap` and `/service/scim`; local launchpad/user behavior often depends on those destinations or mocked branches in `BaseController`.
- `xs-app.json` routes commonly include `/API-USER-IAS`, `/S4HANA`, `/resources`, and `/test-resources`; some apps also add `/SharePointAris` or `/DIGI`, so check the app-local `xs-app.json` before changing service paths.
- `ui5-deploy.yaml` excludes `/test/**` and `/localService/**` and zips each app with `ui5-task-zipper`, including `xs-app.json`.
- Generated/build output is intentionally ignored: `node_modules/`, `dist/`, `build/`, `.tmp/`, `.cache/`, `coverage/`, `resources/`, `mta_archives/`, `*.mtar`, and compressed archives.

## App-Specific Gotchas
- `arisprovmiscomprobantes` uses UI5 `1.138.1` locally; the other apps use `1.140.0` in `ui5-local.yaml`.
- `com.aris.proveedores.facturasexterior.pe` has a directory name with `facturasexterior`, but the app/package/namespace in files is `com.aris.proveedores.facturaexterior.pe`.
- `com.aris.proveedores.pe.calendario`, `com.aris.proveedores.pe.misdatos`, and `com.aris.proveedores.pe.pedidocompra` use `test/flpSandbox.html` intents in their start scripts; the other apps use `test/flp.html#app-preview`.
