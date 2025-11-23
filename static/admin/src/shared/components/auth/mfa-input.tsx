import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';

export interface MFAInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  onComplete?: (value: string) => void;
}

/**
 * MFA Code Input Component
 * Supports both TOTP (6 digits) and backup codes (8 characters)
 */
export function MFAInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  placeholder = 'Nhập mã xác thực',
  error,
  onComplete,
}: MFAInputProps) {
  const [showCode, setShowCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-trigger onComplete when code is full length
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // For TOTP codes, only allow digits
    if (length === 6) {
      newValue = newValue.replace(/\D/g, '');
      if (newValue.length > length) {
        newValue = newValue.slice(0, length);
      }
    } else {
      // For backup codes, allow alphanumeric
      newValue = newValue.replace(/[^a-zA-Z0-9]/g, '');
      if (newValue.length > length) {
        newValue = newValue.slice(0, length);
      }
    }

    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace, delete, arrow keys
    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      return;
    }

    // Prevent non-numeric input for TOTP
    if (length === 6 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          type={showCode ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={length}
          className={`text-center text-lg font-mono tracking-widest ${
            error ? 'border-red-500' : ''
          }`}
          style={{ letterSpacing: '0.5em' }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2"
          onClick={() => setShowCode(!showCode)}
          disabled={disabled}
        >
          {showCode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {length === 6 && (
        <p className="text-xs text-gray-500">
          Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
        </p>
      )}
    </div>
  );
}

/**
 * Backup Code Input Component
 */
export function BackupCodeInput({
  value,
  onChange,
  disabled = false,
  error,
  onComplete,
}: Omit<MFAInputProps, 'length' | 'placeholder'>) {
  return (
    <MFAInput
      value={value}
      onChange={onChange}
      length={8}
      disabled={disabled}
      placeholder="Nhập mã dự phòng"
      error={error}
      onComplete={onComplete}
    />
  );
}

