import crypto from 'crypto'

const algorithm = 'aes-256-gcm'

// Validate encryption key
function getEncryptionKey(): Buffer {
  const secretKey = process.env.ENCRYPTION_KEY
  
  if (!secretKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  
  if (secretKey.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long')
  }
  
  // Use secure key derivation
  return crypto.scryptSync(secretKey, process.env.ENCRYPTION_SALT || 'default-salt-should-be-changed', 32)
}

export function encryptApiKey(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipherGCM(algorithm, key, iv)
    
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
    
    const key = getEncryptionKey()
    const decipher = crypto.createDecipherGCM(algorithm, key, iv)
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

// Always use secure encryption (removed insecure development fallback)
export const encrypt = encryptApiKey
export const decrypt = decryptApiKey

// Secure random token generation
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Secure password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

// Verify password against hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const [salt, hash] = hashedPassword.split(':')
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex')
    return hash === testHash
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Verify CSRF token
export function verifyCSRFToken(token: string, expected: string): boolean {
  if (!token || !expected) return false
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}