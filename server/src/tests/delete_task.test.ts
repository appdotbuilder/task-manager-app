
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable, taskCollaboratorsTable, remindersTable } from '../db/schema';
import { type CreateTaskInput, type CreateReminderInput, type AddTaskCollaboratorInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let collaboratorId: number;
  let taskId: number;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'owner@test.com',
          name: 'Task Owner',
          password_hash: 'hash1'
        },
        {
          email: 'collaborator@test.com',
          name: 'Collaborator',
          password_hash: 'hash2'
        }
      ])
      .returning()
      .execute();

    userId = users[0].id;
    collaboratorId = users[1].id;

    // Create a test task
    const tasks = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task to be deleted',
        status: 'todo',
        due_date: new Date('2024-12-31'),
        folder_id: null,
        user_id: userId
      })
      .returning()
      .execute();

    taskId = tasks[0].id;
  });

  it('should delete a task without related data', async () => {
    const result = await deleteTask(taskId);

    expect(result).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should delete task and its collaborators', async () => {
    // Add a collaborator
    await db.insert(taskCollaboratorsTable)
      .values({
        task_id: taskId,
        user_id: collaboratorId
      })
      .execute();

    const result = await deleteTask(taskId);

    expect(result).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasks).toHaveLength(0);

    // Verify collaborator relationship was deleted
    const collaborators = await db.select()
      .from(taskCollaboratorsTable)
      .where(eq(taskCollaboratorsTable.task_id, taskId))
      .execute();
    expect(collaborators).toHaveLength(0);
  });

  it('should delete task and its reminders', async () => {
    // Add a reminder
    await db.insert(remindersTable)
      .values({
        task_id: taskId,
        user_id: userId,
        reminder_time: new Date('2024-12-30T10:00:00Z'),
        is_sent: false
      })
      .execute();

    const result = await deleteTask(taskId);

    expect(result).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasks).toHaveLength(0);

    // Verify reminder was deleted
    const reminders = await db.select()
      .from(remindersTable)
      .where(eq(remindersTable.task_id, taskId))
      .execute();
    expect(reminders).toHaveLength(0);
  });

  it('should delete task with both collaborators and reminders', async () => {
    // Add collaborator and reminder
    await db.insert(taskCollaboratorsTable)
      .values({
        task_id: taskId,
        user_id: collaboratorId
      })
      .execute();

    await db.insert(remindersTable)
      .values({
        task_id: taskId,
        user_id: userId,
        reminder_time: new Date('2024-12-30T10:00:00Z'),
        is_sent: false
      })
      .execute();

    const result = await deleteTask(taskId);

    expect(result).toBe(true);

    // Verify all data was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();
    expect(tasks).toHaveLength(0);

    const collaborators = await db.select()
      .from(taskCollaboratorsTable)
      .where(eq(taskCollaboratorsTable.task_id, taskId))
      .execute();
    expect(collaborators).toHaveLength(0);

    const reminders = await db.select()
      .from(remindersTable)
      .where(eq(remindersTable.task_id, taskId))
      .execute();
    expect(reminders).toHaveLength(0);
  });

  it('should return false when task does not exist', async () => {
    const nonExistentTaskId = 99999;
    const result = await deleteTask(nonExistentTaskId);

    expect(result).toBe(false);
  });

  it('should not affect other tasks when deleting', async () => {
    // Create another task
    const otherTasks = await db.insert(tasksTable)
      .values({
        title: 'Other Task',
        description: 'Should remain after deletion',
        status: 'in_progress',
        due_date: null,
        folder_id: null,
        user_id: userId
      })
      .returning()
      .execute();

    const otherTaskId = otherTasks[0].id;

    // Delete the first task
    const result = await deleteTask(taskId);
    expect(result).toBe(true);

    // Verify other task still exists
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, otherTaskId))
      .execute();
    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].title).toEqual('Other Task');
  });
});
