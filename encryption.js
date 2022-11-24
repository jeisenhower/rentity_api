

const encrypt = (text, iv) => {
    if (iv === undefined) {
        iv = crypto.randomBytes(16);
    }
    const cipher = crypto.createCipheriv(process.env.ENCRYPTION_ALGORITHM, process.env.SECRET_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        encryptedContent: encrypted.toString('hex'),
        iv: iv.toString('hex')
    };
};


const decrypt = (content, iv) => {
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'))
  
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()])
  
    return decrpyted.toString()
  }


const hash = {
    encrypt,
    decrypt
};

export default hash;