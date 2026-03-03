export interface PasswordValidationResult {
  isValid: boolean;
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  errors: string[];
}

const COMMON_PASSWORDS = [
  'password',
  '123456',
  '12345678',
  'qwerty',
  'abc123',
  'password123',
  'admin',
  'letmein',
  'welcome',
  'monkey',
  'dragon',
  'sunshine',
  'master',
  'football',
  'iloveyou',
];

/**
 * Validate password according to security policies
 */
export function validatePassword(
  password: string,
  username?: string,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // 1. Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length < 12) {
    score += 20;
  } else if (password.length < 16) {
    score += 30;
  } else {
    score += 40;
  }

  // 2. Character composition checks
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  } else {
    score += 15;
  }

  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  } else {
    score += 15;
  }

  if (!hasNumber) {
    errors.push('Password must contain at least one number (0-9)');
  } else {
    score += 10;
  }

  if (!hasSpecial) {
    errors.push(
      'Password must contain at least one special character (!@#$%^&*...)'
    );
  } else {
    score += 10;
  }

  // 3. Common password check
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password.');
    score -= 20;
  }

  // 4. Personal information check
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Password should not contain your username');
    score -= 15;
  }

  if (email) {
    const emailPart = email.split('@')[0].toLowerCase();
    if (password.toLowerCase().includes(emailPart)) {
      errors.push('Password should not contain your email');
      score -= 15;
    }
  }

  // 5. Sequential characters check
  if (hasSequentialCharacters(password)) {
    errors.push('Password should not contain sequential characters (e.g., 123, abc)');
    score -= 10;
  }

  // 6. Repeated characters check
  if (hasRepeatedCharacters(password)) {
    errors.push('Password should not contain repeated characters (e.g., aaa, 111)');
    score -= 10;
  }

  // Cap score at 100
  score = Math.max(0, Math.min(100, score));

  // Determine strength level
  let strength: PasswordValidationResult['strength'];
  if (score < 30) {
    strength = 'weak';
  } else if (score < 50) {
    strength = 'fair';
  } else if (score < 70) {
    strength = 'good';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0 && score >= 60,
    score,
    strength,
    errors,
  };
}

/**
 * Check for sequential characters
 */
function hasSequentialCharacters(password: string): boolean {
  const lower = password.toLowerCase();

  // Check for 3 or more sequential letters or numbers
  for (let i = 0; i < lower.length - 2; i++) {
    const char1 = lower.charCodeAt(i);
    const char2 = lower.charCodeAt(i + 1);
    const char3 = lower.charCodeAt(i + 2);

    // Check ascending sequence
    if (char2 === char1 + 1 && char3 === char2 + 1) {
      return true;
    }

    // Check descending sequence
    if (char2 === char1 - 1 && char3 === char2 - 1) {
      return true;
    }
  }

  return false;
}

/**
 * Check for repeated characters
 */
function hasRepeatedCharacters(password: string): boolean {
  for (let i = 0; i < password.length - 2; i++) {
    if (
      password[i] === password[i + 1] &&
      password[i + 1] === password[i + 2]
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Generate a strong random password
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;
  let password = '';

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}
