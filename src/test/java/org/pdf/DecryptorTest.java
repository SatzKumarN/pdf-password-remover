package org.pdf;

import static java.nio.file.Files.readAllBytes;
import static java.nio.file.Files.write;
import static java.nio.file.Paths.get;
import static java.nio.file.StandardOpenOption.CREATE;
import static org.hamcrest.CoreMatchers.containsString;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Path;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class DecryptorTest {

	private void writeResourceFileToTemporaryFolder(Path tempDir, String filename) throws IOException {
		Path input = tempDir.resolve(filename);
		Path path = new File(getFromResource(filename).getFile()).toPath();
		write(input, readToBytes(path), CREATE);
	}

	private URL getFromResource(String resource) {
		return this.getClass().getClassLoader().getResource(resource);
	}

	private byte[] readToBytes(Path filePath) throws IOException {
		return readAllBytes(filePath);
	}

	@Test
	void shouldCreatePdfWithoutPwdWhenPwdProtectedPdfIsGiven(@TempDir Path tempDir) throws Exception {
		writeResourceFileToTemporaryFolder(tempDir, "sample.pdf");

		Decryptor.main(new String[] { tempDir.toString(), "sample.pdf", "Dummy12345" });

		byte[] expected = readToBytes(get(getFromResource("unprotected-sample.pdf").toURI()));
		byte[] actual = readToBytes(tempDir.resolve("unprotected-sample.pdf"));
		try (PDDocument expectedDocument = Loader.loadPDF(expected);
				PDDocument actualDocument = Loader.loadPDF(actual)) {
			assertThat(actualDocument.isEncrypted(), is(false));
			assertThat(actualDocument.getNumberOfPages(), is(expectedDocument.getNumberOfPages()));
			String actualText = new PDFTextStripper().getText(actualDocument);
			assertThat(actualText, is(new PDFTextStripper().getText(expectedDocument)));
			assertThat(actualText, containsString("password protected"));
		}
	}
}
