package org.pdf;

import static org.apache.pdfbox.pdmodel.PDDocument.load;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;

class PasswordRemover {

	byte[] pwdProtectedFile;
	String pwd;

	PasswordRemover(byte[] pwdProtectedFile, String pwd) {
		this.pwdProtectedFile = pwdProtectedFile;
		this.pwd = pwd;
	}

	public byte[] remove() throws IOException {
		try (PDDocument pdd = load(pwdProtectedFile, pwd)) {
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			pdd.setAllSecurityToBeRemoved(true);
			pdd.save(bos);
			return bos.toByteArray();
		}
	}
}
