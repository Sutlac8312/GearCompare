package com.gearcompare.account;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

final class Passwords {
    private static final String PREFIX = "pbkdf2-sha256$600000$";
    private static final HexFormat HEX = HexFormat.of();
    private static final SecureRandom RANDOM = new SecureRandom();

    private Passwords() {}

    static String hash(String password) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return PREFIX + HEX.formatHex(salt) + "$" + HEX.formatHex(derive(password, salt));
    }

    static boolean matches(String password, String encoded) {
        if (encoded != null && encoded.matches("pbkdf2-sha256\\$600000\\$[0-9a-f]{32}\\$[0-9a-f]{64}")) {
            int separator = PREFIX.length() + 32;
            byte[] salt = HEX.parseHex(encoded.substring(PREFIX.length(), separator));
            byte[] expected = HEX.parseHex(encoded.substring(separator + 1));
            return MessageDigest.isEqual(expected, derive(password, salt));
        }
        derive(password, new byte[16]);
        return false;
    }

    private static byte[] derive(String password, byte[] salt) {
        var key = new PBEKeySpec(password.toCharArray(), salt, 600_000, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(key).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2 is unavailable", e);
        } finally {
            key.clearPassword();
        }
    }
}
