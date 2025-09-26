/**
 * Utilidades de encriptación para datos sensibles
 * Proporciona funciones para encriptar/desencriptar datos críticos
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const TAG_LENGTH = 16; // 128 bits

/**
 * Genera una clave de encriptación a partir de una contraseña
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encripta un texto usando AES-256-GCM
 */
export function encrypt(text: string, password: string): string {
  try {
    // Generar salt aleatorio
    const salt = crypto.randomBytes(16);
    
    // Derivar clave
    const key = deriveKey(password, salt);
    
    // Generar IV aleatorio
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Crear cipher explícito para AES-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    cipher.setAAD(salt);

    // Encriptar y obtener tag
    const encryptedBuffer = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Combinar salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encryptedBuffer]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Error al encriptar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Desencripta un texto usando AES-256-GCM
 */
export function decrypt(encryptedData: string, password: string): string {
  try {
    // Decodificar base64
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extraer componentes
    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 16 + IV_LENGTH);
    const tag = combined.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(16 + IV_LENGTH + TAG_LENGTH);
    
    // Derivar clave
    const key = deriveKey(password, salt);
    
    // Crear decipher explícito para AES-GCM
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    // Desencriptar
    const decryptedBuffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decryptedBuffer.toString('utf8');
  } catch (error) {
    throw new Error(`Error al desencriptar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Genera un hash seguro de una contraseña
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verifica una contraseña contra su hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [saltHex, hashHex] = hashedPassword.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
    return hash.toString('hex') === hashHex;
  } catch (error) {
    return false;
  }
}

/**
 * Genera un token seguro aleatorio
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Genera un hash HMAC de un mensaje
 */
export function generateHMAC(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Verifica un hash HMAC
 */
export function verifyHMAC(message: string, secret: string, hash: string): boolean {
  const expectedHash = generateHMAC(message, secret);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

/**
 * Encripta datos sensibles del certificado
 */
export function encryptCertificateData(privateKey: string, certificate: string, password: string): {
  encryptedPrivateKey: string;
  encryptedCertificate: string;
} {
  return {
    encryptedPrivateKey: encrypt(privateKey, password),
    encryptedCertificate: encrypt(certificate, password),
  };
}

/**
 * Desencripta datos sensibles del certificado
 */
export function decryptCertificateData(
  encryptedPrivateKey: string, 
  encryptedCertificate: string, 
  password: string
): {
  privateKey: string;
  certificate: string;
} {
  return {
    privateKey: decrypt(encryptedPrivateKey, password),
    certificate: decrypt(encryptedCertificate, password),
  };
}

/**
 * Genera un nonce único para operaciones críticas
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Valida que un nonce no haya sido usado recientemente
 * (Implementación básica - en producción usar Redis o similar)
 */
const usedNonces = new Set<string>();

export function validateNonce(nonce: string): boolean {
  if (usedNonces.has(nonce)) {
    return false;
  }
  
  // Agregar a la lista de nonces usados
  usedNonces.add(nonce);
  
  // Limpiar nonces antiguos (implementación básica)
  if (usedNonces.size > 1000) {
    const noncesArray = Array.from(usedNonces);
    usedNonces.clear();
    // Mantener solo los últimos 500
    noncesArray.slice(-500).forEach(n => usedNonces.add(n));
  }
  
  return true;
}
