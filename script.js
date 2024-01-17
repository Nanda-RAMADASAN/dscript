(async function() {
    // Converters
    function buf2base64(buf) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
    }

    function base642buf(base64) {
        let binary_string = atob(base64);
        let len = binary_string.length;
        let bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function generateKey(keyString) {
        let enc = new TextEncoder();
        let hash = await window.crypto.subtle.digest('SHA-256', enc.encode(keyString));
        return window.crypto.subtle.importKey(
            "raw",
            hash,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );
    }

    // Encryption
    async function encrypt(text, keyString) {
        let iv = window.crypto.getRandomValues(new Uint8Array(12));
        let textEncoded = new TextEncoder().encode(text);
        let key = await generateKey(keyString);
        let encryptedText = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            textEncoded
        );
        return buf2base64(encryptedText) + ":" + buf2base64(iv);
    }

    // Decryption
    async function decrypt(encryptedText, keyString) {
        let parts = encryptedText.split(":");
        if (parts.length !== 2) {
            throw new Error("Invalid format");
        }

        let [cipherData, iv] = parts.map(base642buf);
        let key = await generateKey(keyString);
        let result = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(iv) },
            key,
            cipherData
        );
        return new TextDecoder().decode(result);
    }

    // User Interaction
    try {
        let keyString = prompt("Enter your private key:", "");
        let action = prompt("Type 'C' to encrypt or 'D' to decrypt:", "");

        if (action === 'C') {
            let text = prompt("Enter the text to encrypt:", "");
            let encryptedText = await encrypt(text, keyString);
            console.log('Encrypted Text:', encryptedText);
        } else if (action === 'D') {
            let encryptedText = prompt("Enter the text to decrypt:", "");
            let result = await decrypt(encryptedText, keyString);
            console.log('Decrypted Text:', result);
        } else {
            console.log("Action not recognized.");
        }
    } catch (e) {
        console.error('Error:', e);
    }
})();
