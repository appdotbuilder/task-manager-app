
import { db } from '../db';
import { foldersTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteFolder(folderId: number): Promise<boolean> {
  try {
    // First, move any tasks in this folder to have no folder (null folder_id)
    await db.update(tasksTable)
      .set({ folder_id: null })
      .where(eq(tasksTable.folder_id, folderId))
      .execute();

    // Move any child folders to have no parent (null parent_id)
    await db.update(foldersTable)
      .set({ parent_id: null })
      .where(eq(foldersTable.parent_id, folderId))
      .execute();

    // Delete the folder itself
    const result = await db.delete(foldersTable)
      .where(eq(foldersTable.id, folderId))
      .execute();

    // Return true if at least one row was deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Folder deletion failed:', error);
    throw error;
  }
}
