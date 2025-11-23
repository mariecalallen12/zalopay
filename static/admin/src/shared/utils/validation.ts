// Validation utilities

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone: string): boolean {
  const re = /^[0-9]{10,11}$/;
  return re.test(phone.replace(/\s+/g, ''));
}

export function validateRequired(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}

