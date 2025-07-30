
import { db } from '../db';
import { foldersTable } from '../db/schema';
import { type Folder } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFolders(userId: number): Promise<Folder[]> {
  try {
    const result = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.user_id, userId))
      .execute();

    return result;
  } catch (error) {
    console.error('Get folders failed:', error);
    throw error;
  }
}
