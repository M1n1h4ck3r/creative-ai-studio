import crypto from 'crypto'

const algorithm = 'aes-256-gcm'
const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!'

// Ensure the key is 32 bytes
const key = crypto.scryptSync(secretKey, 'salt', 32)

export function encryptApiKey(text: string): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(algorithm, key)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Combine iv, authTag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt API key')
  }
}

export function decryptApiKey(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':')
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipher(algorithm, key)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt API key')
  }
}

// Fallback simple encryption for development
export function simpleEncrypt(text: string): string {
  return Buffer.from(text).toString('base64')
}

export function simpleDecrypt(encryptedText: string): string {
  return Buffer.from(encryptedText, 'base64').toString('utf8')
}

// Use simple encryption in development, proper encryption in production
export const encrypt = process.env.NODE_ENV === 'production' ? encryptApiKey : simpleEncrypt
export const decrypt = process.env.NODE_ENV === 'production' ? decryptApiKey : simpleDecrypt