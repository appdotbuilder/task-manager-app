
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'test_password' // In real app, this would be a bcrypt hash
};

const loginInput: LoginInput = {
  email: 'test@example.com',
  password: 'test_password'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await loginUser(loginInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.password_hash).toEqual('test_password');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent user', async () => {
    // Don't create any users
    
    await expect(loginUser(loginInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for invalid password', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const wrongPasswordInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    await expect(loginUser(wrongPasswordInput)).rejects.toThrow(/invalid password/i);
  });

  it('should authenticate user with correct email case sensitivity', async () => {
    // Create test user first
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    // Test with exact email match
    const result = await loginUser(loginInput);
    expect(result.email).toEqual('test@example.com');
  });
});
