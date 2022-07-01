package org.pdf;

import static java.nio.file.Files.readAllBytes;
import static java.nio.file.Files.write;
import static java.nio.file.Paths.get;
import static java.nio.file.StandardOpenOption.CREATE;

import java.nio.file.Path;

public class Decryptor {

	private Decryptor() {
		// To avoid object creation
	}

	public static void main(String[] args) throws Exception {
		String filepath = args[0];
		String filename = args[1];
		String pwd = args[2];
		PasswordRemover pwdRemover = new PasswordRemover(readAllBytes(normalizePath(filepath, filename)), pwd);
		write(normalizePath(filepath, "unprotected-" + filename), pwdRemover.remove(), CREATE);
	}

	private static Path normalizePath(String filepath, String filename) {
		return get(filepath, filename).normalize();
	}
}
