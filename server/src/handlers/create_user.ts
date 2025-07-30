
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash password (simple hash for demo - in production use bcrypt)
    const password_hash = `hashed_${input.password}`;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        name: input.name,
        password_hash: password_hash
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};
