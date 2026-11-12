# pdf-password-remover

Remove a known password from a PDF, either with the Java command-line tool or in the browser.

The browser page does not guess passwords. It only opens a PDF with the password you type, then saves a copy with the password removed. The file stays on your device.

##### In the browser #####

The page lives in `docs/`. GitHub Pages can host it with no build step.

1. Merge this folder to the default branch.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose the default branch and the `/docs` folder, then save.

The site is published at `https://satzkumarn.github.io/pdf-password-remover/`. Pick a PDF, enter its password, and download `unprotected-<filename>`.

To try the page locally, serve `docs/` over HTTP (opening the file directly will not load WebAssembly):

`python3 -m http.server 8000 --directory docs`

Then open `http://127.0.0.1:8000`.

##### To Build #####

`mvn clean install`

##### To Run #####

After building, the jar is in the `target` folder.

`java -jar pdf-password-remover.jar <absolute_path> <filename> <password>`

###### Example ######

`java -jar pdf-password-remover.jar D:\folder pwd-protected.pdf dummy-password`