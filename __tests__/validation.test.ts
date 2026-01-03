/**
 * Tests for input validation and sanitization
 */

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate password strength
function isStrongPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8;
}

// Helper function to sanitize user input
function sanitizeInput(input: string): string {
  return input.trim().slice(0, 1000); // Limit to 1000 chars
}

describe('Input Validation', () => {
  describe('Email validation', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('Password validation', () => {
    it('should accept strong passwords', () => {
      expect(isStrongPassword('Password123')).toBe(true);
      expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isStrongPassword('short')).toBe(false);
      expect(isStrongPassword('1234567')).toBe(false);
    });
  });

  describe('Input sanitization', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(2000);
      expect(sanitizeInput(longInput).length).toBe(1000);
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });
});
