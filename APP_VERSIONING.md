# TomEng app version

The user-facing app version is declared once as `APP_VERSION` in `app.js`. The UI renders it from that constant in the desktop rail and compact header.

Use `MAJOR.MINOR.PATCH`: increment MAJOR for significant breaking changes, MINOR for a new feature, and PATCH for fixes or content updates. Keep this separate from `schemaVersion` and `contentVersion`, which describe persisted data and learning content, and from the service-worker cache name, which controls asset refresh.

After changing app assets, increment the service-worker cache version and the registration query in `index.html` together so a deployed client can load the matching UI version.
