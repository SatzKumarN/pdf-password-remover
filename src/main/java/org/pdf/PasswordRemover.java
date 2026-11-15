package org.pdf;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;

class PasswordRemover {

	byte[] pwdProtectedFile;
	String pwd;

	PasswordRemover(byte[] pwdProtectedFile, String pwd) {
		this.pwdProtectedFile = pwdProtectedFile;
		this.pwd = pwd;
	}

	public byte[] remove() throws IOException {
		try (PDDocument pdd = Loader.loadPDF(pwdProtectedFile, pwd)) {
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			pdd.setAllSecurityToBeRemoved(true);
			pdd.save(bos);
			return bos.toByteArray();
		}
	}
}
