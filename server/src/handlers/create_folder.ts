
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput, type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export const createFolder = async (input: CreateFolderInput): Promise<Folder> => {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // If parent_id is provided, verify parent folder exists and belongs to the same user
    if (input.parent_id !== null) {
      const parentFolder = await db.select()
        .from(foldersTable)
        .where(eq(foldersTable.id, input.parent_id))
        .execute();

      if (parentFolder.length === 0) {
        throw new Error('Parent folder not found');
      }

      if (parentFolder[0].user_id !== input.user_id) {
        throw new Error('Parent folder does not belong to the specified user');
      }
    }

    // Insert folder record
    const result = await db.insert(foldersTable)
      .values({
        name: input.name,
        parent_id: input.parent_id,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Folder creation failed:', error);
    throw error;
  }
};
