/**
 * Unit tests for validators middleware
 */

const { validateRequest } = require('../../../middleware/validators');
const { ValidationError } = require('../../../utils/errors');
const { validationResult } = require('express-validator');
const {
  createMockRequest,
  createMockResponse,
  createMockNext,
} = require('../../helpers/mockFactories');

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

describe('validateRequest', () => {
  let req, res, next;

  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    jest.clearAllMocks();
  });

  it('should call next when validation passes', () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });

  it('should throw ValidationError when validation fails', () => {
    const errors = [
      { field: 'email', message: 'Invalid email' },
      { field: 'password', message: 'Password required' },
    ];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors,
    });

    expect(() => {
      validateRequest(req, res, next);
    }).toThrow(ValidationError);

    expect(next).not.toHaveBeenCalled();
  });

  it('should include errors array in ValidationError', () => {
    const errors = [{ field: 'test', message: 'Error' }];

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => errors,
    });

    try {
      validateRequest(req, res, next);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.errors).toEqual(errors);
    }
  });
});

