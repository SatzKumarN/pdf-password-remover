# pdf-password-remover

This repository contains two applications. Each one removes a known password from a PDF and writes a copy that opens without one.

| Application | Code | Engine | Where it runs |
| --- | --- | --- | --- |
| Command-line tool | `src/main/java` | Apache PDFBox | Your machine, via `java -jar` |
| Browser page | `docs/` | qpdf, compiled to WebAssembly | The browser, hosted by GitHub Pages |

Both applications use the password you supply. qpdf is loaded from `docs/vendor/` on this site and runs in the browser. The PDF and password stay on that device.

## Browser page

Static files in `docs/`. GitHub Pages hosts them with no build.

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose the default branch and the `/docs` folder, then save.

The site is `https://satzkumarn.github.io/pdf-password-remover/`. Choose a PDF, enter its password, and download `unprotected-<filename>`.

To try it locally, serve `docs/` over HTTP. A `file://` URL cannot load the WebAssembly module.

`python3 -m http.server 8000 --directory docs`

Then open `http://127.0.0.1:8000`.

## Command-line tool

Build with Maven:

`mvn clean install`

The jar is written to `target/`.

`java -jar pdf-password-remover.jar <absolute_path> <filename> <password>`

Example:

`java -jar pdf-password-remover.jar D:\folder pwd-protected.pdf dummy-password`
