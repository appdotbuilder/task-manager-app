
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function loginUser(input: LoginInput): Promise<User> {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // In a real implementation, you would use bcrypt to compare passwords
    // For this example, we'll do a simple comparison
    // Note: This is NOT secure for production use
    if (user.password_hash !== input.password) {
      throw new Error('Invalid password');
    }

    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
