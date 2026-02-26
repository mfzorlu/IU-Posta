/**
 * IU Posta Cryptography Utilities
 * Uses Web Crypto API for End-to-End Encryption
 */

// Helper to convert ArrayBuffer to Base64
export const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Helper to convert Base64 to ArrayBuffer
export const base64ToArrayBuffer = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * RSA Key Pair Generation (RSA-OAEP)
 */
export const generateRSAKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );

    const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: arrayBufferToBase64(publicKey),
        privateKey: arrayBufferToBase64(privateKey),
    };
};

/**
 * AES Key Generation (AES-GCM 256)
 */
export const generateAESKey = async () => {
    const key = await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt']
    );

    const exported = await window.crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exported);
};

/**
 * Encrypt AES Key with RSA Public Key
 */
export const encryptAESKeyWithRSA = async (aesKeyBase64, rsaPublicKeyBase64) => {
    const publicKeyBuffer = base64ToArrayBuffer(rsaPublicKeyBase64);
    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );

    const aesKeyBuffer = base64ToArrayBuffer(aesKeyBase64);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        aesKeyBuffer
    );

    return arrayBufferToBase64(encrypted);
};

/**
 * Decrypt AES Key with RSA Private Key
 */
export const decryptAESKeyWithRSA = async (encryptedAESKeyBase64, rsaPrivateKeyBase64) => {
    const privateKeyBuffer = base64ToArrayBuffer(rsaPrivateKeyBase64);
    const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
    );

    const encryptedBuffer = base64ToArrayBuffer(encryptedAESKeyBase64);
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedBuffer
    );

    return arrayBufferToBase64(decrypted);
};

/**
 * Encrypt Content with AES-GCM
 */
export const encryptMessage = async (content, aesKeyBase64) => {
    const aesKeyBuffer = base64ToArrayBuffer(aesKeyBase64);
    const key = await window.crypto.subtle.importKey(
        'raw',
        aesKeyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv),
    };
};

/**
 * Decrypt Content with AES-GCM
 */
export const decryptMessage = async (ciphertextBase64, ivBase64, aesKeyBase64) => {
    try {
        const aesKeyBuffer = base64ToArrayBuffer(aesKeyBase64);
        const key = await window.crypto.subtle.importKey(
            'raw',
            aesKeyBuffer,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const iv = base64ToArrayBuffer(ivBase64);
        const ciphertext = base64ToArrayBuffer(ciphertextBase64);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error('Decryption failed:', error);
        return '[Decryption Error]';
    }
};
