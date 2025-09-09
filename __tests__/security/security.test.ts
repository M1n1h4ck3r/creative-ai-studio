/**
 * Security Tests for Creative AI Studio
 */
import { 
  sanitizeInput, 
  validatePrompt, 
  validateApiKey, 
  sanitizeErrorMessage,
  CSRFProtection 
} from '@/lib/security'

import { 
  encryptApiKey, 
  decryptApiKey, 
  generateSecureToken,
  generateCSRFToken,
  verifyCSRFToken 
} from '@/lib/encryption'

describe('Security Functions', () => {
  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World')
    })

    it('should remove javascript protocols', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeInput(input)
      expect(result).toBe('')
    })

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>'
      const result = sanitizeInput(input)
      expect(result).toBe('Click me')
    })

    it('should limit input length', () => {
      const longInput = 'a'.repeat(10000)
      const result = sanitizeInput(longInput)
      expect(result.length).toBeLessThanOrEqual(5000)
    })

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })
  })

  describe('Prompt Validation', () => {
    it('should validate legitimate prompts', () => {
      const result = validatePrompt('Create a beautiful landscape painting')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('Create a beautiful landscape painting')
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty prompts', () => {
      const result = validatePrompt('')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Prompt must be at least 3 characters long')
    })

    it('should reject short prompts', () => {
      const result = validatePrompt('Hi')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Prompt must be at least 3 characters long')
    })

    it('should reject overly long prompts', () => {
      const longPrompt = 'a'.repeat(3000)
      const result = validatePrompt(longPrompt)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Prompt must not exceed 2000 characters')
    })

    it('should detect potentially harmful content', () => {
      const result = validatePrompt('hack the system with sql injection')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Prompt contains potentially harmful content')
    })

    it('should sanitize HTML in prompts', () => {
      const result = validatePrompt('Create <script>alert("xss")</script> a painting')
      expect(result.sanitized).toBe('Create  a painting')
    })
  })

  describe('API Key Validation', () => {
    it('should validate OpenAI API keys', () => {
      const apiKey = 'sk-' + 'a'.repeat(48)
      const result = validateApiKey(apiKey)
      expect(result.valid).toBe(true)
    })

    it('should validate Gemini API keys', () => {
      const apiKey = 'A'.repeat(39)
      const result = validateApiKey(apiKey)
      expect(result.valid).toBe(true)
    })

    it('should reject empty API keys', () => {
      const result = validateApiKey('')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('API key is required')
    })

    it('should reject too short API keys', () => {
      const result = validateApiKey('short')
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('API key appears to be too short')
    })

    it('should reject too long API keys', () => {
      const longKey = 'a'.repeat(300)
      const result = validateApiKey(longKey)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('API key appears to be too long')
    })
  })

  describe('Error Message Sanitization', () => {
    it('should sanitize sensitive information in production', () => {
      const error = new Error('Database password failed')
      const result = sanitizeErrorMessage(error, true)
      expect(result).toBe('An internal error occurred. Please try again later.')
    })

    it('should return original message in development', () => {
      const error = new Error('Database connection failed')
      const result = sanitizeErrorMessage(error, false)
      expect(result).toBe('Database connection failed')
    })

    it('should handle non-error objects', () => {
      const result = sanitizeErrorMessage('Simple error string', true)
      expect(result).toBe('Simple error string')
    })

    it('should handle null/undefined errors', () => {
      expect(sanitizeErrorMessage(null, true)).toBe('An unknown error occurred')
      expect(sanitizeErrorMessage(undefined, true)).toBe('An unknown error occurred')
    })
  })

  describe('CSRF Protection', () => {
    it('should generate and verify CSRF tokens', () => {
      const sessionId = 'test-session-123'
      const token = CSRFProtection.generateToken(sessionId)
      
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
      
      const isValid = CSRFProtection.verifyToken(sessionId, token)
      expect(isValid).toBe(true)
    })

    it('should reject invalid tokens', () => {
      const sessionId = 'test-session-123'
      const token = CSRFProtection.generateToken(sessionId)
      
      const isValid = CSRFProtection.verifyToken(sessionId, 'invalid-token')
      expect(isValid).toBe(false)
    })

    it('should reject tokens for wrong session', () => {
      const sessionId1 = 'test-session-123'
      const sessionId2 = 'test-session-456'
      const token = CSRFProtection.generateToken(sessionId1)
      
      const isValid = CSRFProtection.verifyToken(sessionId2, token)
      expect(isValid).toBe(false)
    })
  })

  describe('Encryption', () => {
    beforeAll(() => {
      // Set test environment variables
      process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long'
      process.env.ENCRYPTION_SALT = 'test-salt'
    })

    it('should encrypt and decrypt API keys', () => {
      const originalKey = 'sk-test-api-key-12345'
      
      const encrypted = encryptApiKey(originalKey)
      expect(encrypted).toBeTruthy()
      expect(encrypted).not.toBe(originalKey)
      expect(encrypted.split(':')).toHaveLength(3) // iv:authTag:encrypted
      
      const decrypted = decryptApiKey(encrypted)
      expect(decrypted).toBe(originalKey)
    })

    it('should fail to decrypt invalid data', () => {
      expect(() => decryptApiKey('invalid:data')).toThrow('Invalid encrypted data format')
    })

    it('should fail to decrypt with wrong format', () => {
      expect(() => decryptApiKey('not-encrypted')).toThrow('Invalid encrypted data format')
    })

    it('should generate secure random tokens', () => {
      const token1 = generateSecureToken(32)
      const token2 = generateSecureToken(32)
      
      expect(token1).toBeTruthy()
      expect(token2).toBeTruthy()
      expect(token1).not.toBe(token2)
      expect(token1.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should generate and verify CSRF tokens', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      
      expect(token1).toBeTruthy()
      expect(token2).toBeTruthy()
      expect(token1).not.toBe(token2)
      expect(token1.length).toBe(64) // 32 bytes = 64 hex chars
      
      // Test verification
      expect(verifyCSRFToken(token1, token1)).toBe(true)
      expect(verifyCSRFToken(token1, token2)).toBe(false)
      expect(verifyCSRFToken('', token1)).toBe(false)
      expect(verifyCSRFToken(token1, '')).toBe(false)
    })
  })

  describe('Security Headers', () => {
    it('should have proper security headers configuration', () => {
      const { securityHeaders } = require('@/lib/security')
      
      expect(securityHeaders).toHaveProperty('X-Content-Type-Options', 'nosniff')
      expect(securityHeaders).toHaveProperty('X-Frame-Options', 'DENY')
      expect(securityHeaders).toHaveProperty('X-XSS-Protection', '1; mode=block')
      expect(securityHeaders).toHaveProperty('Content-Security-Policy')
      expect(securityHeaders).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin')
      
      // Check CSP contains essential directives
      const csp = securityHeaders['Content-Security-Policy']
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("base-uri 'self'")
    })
  })

  describe('Input Validation Edge Cases', () => {
    it('should handle Unicode characters properly', () => {
      const input = 'Hello 世界 🌍'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello 世界 🌍')
    })

    it('should handle mixed content attacks', () => {
      const input = '<img src="x" onerror="alert(1)">Valid content'
      const result = sanitizeInput(input)
      expect(result).toBe('Valid content')
    })

    it('should handle SQL injection patterns', () => {
      const result = validatePrompt("'; DROP TABLE users; --")
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Prompt contains potentially harmful content')
    })

    it('should handle command injection patterns', () => {
      const result = validatePrompt('Image of cat && rm -rf /')
      expect(result.sanitized).not.toContain('rm -rf')
    })
  })
})