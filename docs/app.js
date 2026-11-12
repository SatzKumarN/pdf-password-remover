"use strict";

const form = document.querySelector("#form");
const fileInput = document.querySelector("#file");
const drop = document.querySelector("#drop");
const fileLabel = document.querySelector("#file-label");
const fileHint = document.querySelector("#file-hint");
const passwordInput = document.querySelector("#password");
const togglePassword = document.querySelector("#toggle-password");
const submitButton = document.querySelector("#submit");
const statusNode = document.querySelector("#status");
const errorNode = document.querySelector("#error");
const downloadLink = document.querySelector("#download");

const INPUT_PATH = "/in.pdf";
const OUTPUT_PATH = "/out.pdf";
const wasmUrl = new URL("vendor/qpdf.wasm", document.baseURI).href;

const qpdfLines = [];
let capturing = false;
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);

function isQpdfNoise(line) {
  return /this\.program|\/in\.pdf|^WARNING:/.test(line);
}

console.log = (...args) => {
  const line = args.map(String).join(" ");
  if (capturing) qpdfLines.push(line);
  if (!isQpdfNoise(line)) originalLog(...args);
};
console.error = (...args) => {
  const line = args.map(String).join(" ");
  if (capturing) qpdfLines.push(line);
  if (!isQpdfNoise(line)) originalError(...args);
};

let qpdfPromise = null;
let downloadUrl = "";

function loadQpdf() {
  if (!qpdfPromise) {
    if (typeof Module !== "function") {
      qpdfPromise = Promise.reject(new Error("The decryptor script did not load."));
    } else {
      qpdfPromise = Module({
        locateFile: () => wasmUrl,
        noInitialRun: true,
      });
    }
  }
  return qpdfPromise;
}

function setStatus(message) {
  statusNode.textContent = message;
}

function setError(message) {
  if (!message) {
    errorNode.hidden = true;
    errorNode.textContent = "";
    return;
  }
  errorNode.hidden = false;
  errorNode.textContent = message;
}

function clearDownload() {
  downloadLink.hidden = true;
  downloadLink.removeAttribute("href");
  if (downloadUrl) {
    URL.revokeObjectURL(downloadUrl);
    downloadUrl = "";
  }
}

function outputName(filename) {
  const base = (filename || "document.pdf").replace(/^.*[\\/]/, "") || "document.pdf";
  return base.toLowerCase().startsWith("unprotected-") ? base : `unprotected-${base}`;
}

function describeFailure(lines, hadPassword) {
  const text = lines.join("\n");
  if (/invalid password/i.test(text)) {
    return hadPassword
      ? "That password did not open this PDF."
      : "This PDF needs a password.";
  }
  if (/can't find PDF header/i.test(text) || /startxref/i.test(text)) {
    return "That file is not a PDF.";
  }
  const detail = lines
    .map((line) => line
      .replace(/this\.program:\s*/g, "")
      .replace(/WARNING:\s*/g, "")
      .replace(/\/in\.pdf:\s*/g, "")
      .trim())
    .filter(Boolean)
    .join(" ");
  return detail || "Could not remove the password from this PDF.";
}

function unlinkQuietly(qpdf, path) {
  try {
    qpdf.FS.unlink(path);
  } catch (error) {
    // The virtual file is absent on the first run.
  }
}

async function decrypt(bytes, password) {
  const qpdf = await loadQpdf();
  unlinkQuietly(qpdf, INPUT_PATH);
  unlinkQuietly(qpdf, OUTPUT_PATH);
  qpdf.FS.writeFile(INPUT_PATH, bytes);

  qpdfLines.length = 0;
  capturing = true;
  let code;
  try {
    const args = ["--decrypt", INPUT_PATH, OUTPUT_PATH];
    if (password.length > 0) {
      args.unshift(`--password=${password}`);
    }
    code = qpdf.callMain(args);
  } finally {
    capturing = false;
  }

  if (code !== 0) {
    unlinkQuietly(qpdf, INPUT_PATH);
    unlinkQuietly(qpdf, OUTPUT_PATH);
    throw new Error(describeFailure(qpdfLines, password.length > 0));
  }

  const output = qpdf.FS.readFile(OUTPUT_PATH);
  const copy = new Uint8Array(output.byteLength);
  copy.set(output);
  unlinkQuietly(qpdf, INPUT_PATH);
  unlinkQuietly(qpdf, OUTPUT_PATH);
  return copy;
}

function showSelectedFile(file) {
  if (!file) {
    fileLabel.textContent = "Choose a PDF";
    fileHint.textContent = "or drop it here";
    drop.classList.remove("has-file");
    return;
  }
  const kilobytes = Math.max(1, Math.round(file.size / 1024));
  fileLabel.textContent = file.name;
  fileHint.textContent = `${kilobytes.toLocaleString()} KB`;
  drop.classList.add("has-file");
}

fileInput.addEventListener("change", () => {
  showSelectedFile(fileInput.files && fileInput.files[0]);
  clearDownload();
  setError("");
  setStatus("");
});

["dragenter", "dragover"].forEach((eventName) => {
  drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  drop.addEventListener(eventName, (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragover");
  });
});

drop.addEventListener("drop", (event) => {
  const files = event.dataTransfer && event.dataTransfer.files;
  if (!files || files.length === 0) {
    return;
  }
  const transfer = new DataTransfer();
  transfer.items.add(files[0]);
  fileInput.files = transfer.files;
  fileInput.dispatchEvent(new Event("change"));
});

togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  togglePassword.textContent = showing ? "Show" : "Hide";
  togglePassword.setAttribute("aria-pressed", String(!showing));
  passwordInput.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = fileInput.files && fileInput.files[0];
  if (!file) {
    setError("Choose a PDF first.");
    fileInput.focus();
    return;
  }

  submitButton.disabled = true;
  clearDownload();
  setError("");
  setStatus("Removing the password…");

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const unlocked = await decrypt(bytes, passwordInput.value);
    const name = outputName(file.name);
    downloadUrl = URL.createObjectURL(new Blob([unlocked], { type: "application/pdf" }));
    downloadLink.href = downloadUrl;
    downloadLink.download = name;
    downloadLink.textContent = `Download ${name}`;
    downloadLink.hidden = false;
    passwordInput.value = "";
    setStatus("Password removed. The copy opens without it.");
    downloadLink.click();
  } catch (error) {
    setStatus("");
    setError(error && error.message ? error.message : "Could not remove the password from this PDF.");
  } finally {
    submitButton.disabled = false;
  }
});

loadQpdf()
  .then(() => {
    submitButton.disabled = false;
    setStatus("");
  })
  .catch(() => {
    setStatus("");
    setError("The decryptor could not be loaded. Refresh the page and try again.");
  });
