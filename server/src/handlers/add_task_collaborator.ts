
import { db } from '../db';
import { taskCollaboratorsTable, tasksTable, usersTable } from '../db/schema';
import { type AddTaskCollaboratorInput, type TaskCollaborator } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addTaskCollaborator = async (input: AddTaskCollaboratorInput): Promise<TaskCollaborator> => {
  try {
    // Verify task exists
    const task = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.task_id))
      .execute();

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Check if collaboration already exists
    const existingCollaboration = await db.select()
      .from(taskCollaboratorsTable)
      .where(and(
        eq(taskCollaboratorsTable.task_id, input.task_id),
        eq(taskCollaboratorsTable.user_id, input.user_id)
      ))
      .execute();

    if (existingCollaboration.length > 0) {
      throw new Error('User is already a collaborator on this task');
    }

    // Insert task collaborator record
    const result = await db.insert(taskCollaboratorsTable)
      .values({
        task_id: input.task_id,
        user_id: input.user_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task collaborator creation failed:', error);
    throw error;
  }
};
