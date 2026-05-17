package com.family.finance.v2;

import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "NativeSecureStorage")
public class NativeSecureStoragePlugin extends Plugin {
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final String KEY_ALIAS = "family_finance_v2_secure_storage";
    private static final String PREFS_NAME = "family_finance_v2_secure_storage";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (isBlank(key)) {
            call.reject("缺少安全存储 key。");
            return;
        }

        try {
            String encrypted = getPrefs().getString(key, null);
            JSObject result = new JSObject();
            result.put("value", encrypted == null ? null : decrypt(encrypted));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("读取安全存储失败。", error);
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (isBlank(key)) {
            call.reject("缺少安全存储 key。");
            return;
        }
        if (value == null) {
            call.reject("缺少安全存储 value。");
            return;
        }

        try {
            getPrefs().edit().putString(key, encrypt(value)).apply();
            call.resolve();
        } catch (Exception error) {
            call.reject("写入安全存储失败。", error);
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (isBlank(key)) {
            call.reject("缺少安全存储 key。");
            return;
        }

        getPrefs().edit().remove(key).apply();
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        getPrefs().edit().clear().apply();
        call.resolve();
    }

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, android.content.Context.MODE_PRIVATE);
    }

    private String encrypt(String value) throws Exception {
        Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateSecretKey());
        byte[] iv = cipher.getIV();
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        byte[] packed = new byte[1 + iv.length + encrypted.length];
        packed[0] = (byte) iv.length;
        System.arraycopy(iv, 0, packed, 1, iv.length);
        System.arraycopy(encrypted, 0, packed, 1 + iv.length, encrypted.length);
        return Base64.encodeToString(packed, Base64.NO_WRAP);
    }

    private String decrypt(String packedValue) throws Exception {
        byte[] packed = Base64.decode(packedValue, Base64.NO_WRAP);
        int ivLength = packed[0] & 0xff;
        byte[] iv = Arrays.copyOfRange(packed, 1, 1 + ivLength);
        byte[] encrypted = Arrays.copyOfRange(packed, 1 + ivLength, packed.length);

        Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, getOrCreateSecretKey(), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
        return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
    }

    private SecretKey getOrCreateSecretKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance(ANDROID_KEYSTORE);
        keyStore.load(null);

        if (keyStore.containsAlias(KEY_ALIAS)) {
            KeyStore.SecretKeyEntry entry = (KeyStore.SecretKeyEntry) keyStore.getEntry(KEY_ALIAS, null);
            return entry.getSecretKey();
        }

        KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        KeyGenParameterSpec keySpec = new KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build();
        keyGenerator.init(keySpec);
        return keyGenerator.generateKey();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
