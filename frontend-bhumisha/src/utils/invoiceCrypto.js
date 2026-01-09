import CryptoJS from "crypto-js";

const SECRET_KEY = "INVOICE_PUBLIC_SECRET_123";
// ⚠️ keep same key on frontend + backend

export const encryptInvoicePayload = (payload) => {
  const cipher = CryptoJS.AES.encrypt(
    JSON.stringify(payload),
    SECRET_KEY
  ).toString();

  return encodeURIComponent(cipher);
};

export const decryptInvoicePayload = (token) => {
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(token), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    return JSON.parse(decrypted);
  } catch (err) {
    console.error("Invalid invoice token", err);
    return null;
  }
};
