/**
 * Thiết lập biến môi trường chung cho Jest
 */

if (!process.env.TEST_FORCE_IN_MEMORY) {
  process.env.TEST_FORCE_IN_MEMORY = 'true';
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';


