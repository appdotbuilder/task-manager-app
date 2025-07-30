
import { db } from '../db';
import { tasksTable, taskCollaboratorsTable, remindersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (taskId: number): Promise<boolean> => {
  try {
    // Delete related data first to avoid foreign key constraint violations
    
    // Delete task collaborators
    await db.delete(taskCollaboratorsTable)
      .where(eq(taskCollaboratorsTable.task_id, taskId))
      .execute();

    // Delete reminders
    await db.delete(remindersTable)
      .where(eq(remindersTable.task_id, taskId))
      .execute();

    // Delete the task itself
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .returning()
      .execute();

    // Return true if task was deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};
