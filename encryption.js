import CryptoJS from 'crypto-js';

/*const encrypt = (text, iv) => {
    if (iv === undefined) {
        //iv = crypto.randomBytes(16);
        iv = CryptoJS
    }
    const cipher = crypto.createCipheriv(process.env.ENCRYPTION_ALGORITHM, process.env.SECRET_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        encryptedContent: encrypted.toString('hex'),
        iv: iv.toString('hex')
    };
};*/

const encrypt = (content) => {
    var ciphertext = CryptoJS.AES.encrypt(content, process.env.SECRET_KEY).toString();
    return ciphertext;
}


/*const decrypt = (content, iv) => {
    const decipher = crypto.createDecipheriv(process.env.ENCRYPTION_ALGORITHM, process.env.SECRET_KEY, Buffer.from(iv, 'hex'))
  
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()])
  
    return decrpyted.toString()
};*/

const decrypt = (encryptedContent) => {
    var bytes  = CryptoJS.AES.decrypt(encryptedContent, process.env.SECRET_KEY);
    var originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText;
}


const hash = {
    encrypt,
    decrypt
};

export default hash;