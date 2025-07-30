
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable, remindersTable } from '../db/schema';
import { type CreateUserInput, type CreateTaskInput, type CreateReminderInput } from '../schema';
import { getPendingReminders } from '../handlers/get_pending_reminders';

// Test data
const testUser: CreateUserInput = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'password123'
};

const testTask: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing',
  status: 'todo',
  due_date: null,
  folder_id: null,
  user_id: 1 // Will be set after user creation
};

describe('getPendingReminders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no reminders exist', async () => {
    const result = await getPendingReminders();
    expect(result).toEqual([]);
  });

  it('should return pending reminders that are due', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create task
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Create overdue reminder (1 hour ago)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await db.insert(remindersTable)
      .values({
        task_id: taskId,
        user_id: userId,
        reminder_time: oneHourAgo,
        is_sent: false
      })
      .execute();

    const result = await getPendingReminders();

    expect(result).toHaveLength(1);
    expect(result[0].task_id).toEqual(taskId);
    expect(result[0].user_id).toEqual(userId);
    expect(result[0].is_sent).toBe(false);
    expect(result[0].reminder_time).toBeInstanceOf(Date);
    expect(result[0].reminder_time <= new Date()).toBe(true);
  });

  it('should not return reminders that are not yet due', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create task
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Create future reminder (1 hour from now)
    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    await db.insert(remindersTable)
      .values({
        task_id: taskId,
        user_id: userId,
        reminder_time: oneHourFromNow,
        is_sent: false
      })
      .execute();

    const result = await getPendingReminders();

    expect(result).toHaveLength(0);
  });

  it('should not return reminders that have already been sent', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create task
    const taskResult = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: userId
      })
      .returning()
      .execute();
    const taskId = taskResult[0].id;

    // Create overdue reminder that has been sent
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await db.insert(remindersTable)
      .values({
        task_id: taskId,
        user_id: userId,
        reminder_time: oneHourAgo,
        is_sent: true // Already sent
      })
      .execute();

    const result = await getPendingReminders();

    expect(result).toHaveLength(0);
  });

  it('should return multiple pending reminders', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values({
        email: testUser.email,
        name: testUser.name,
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create tasks
    const task1Result = await db.insert(tasksTable)
      .values({
        ...testTask,
        title: 'Task 1',
        user_id: userId
      })
      .returning()
      .execute();

    const task2Result = await db.insert(tasksTable)
      .values({
        ...testTask,
        title: 'Task 2',
        user_id: userId
      })
      .returning()
      .execute();

    // Create multiple overdue reminders
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    await db.insert(remindersTable)
      .values([
        {
          task_id: task1Result[0].id,
          user_id: userId,
          reminder_time: twoHoursAgo,
          is_sent: false
        },
        {
          task_id: task2Result[0].id,
          user_id: userId,
          reminder_time: oneHourAgo,
          is_sent: false
        }
      ])
      .execute();

    const result = await getPendingReminders();

    expect(result).toHaveLength(2);
    expect(result.every(r => r.is_sent === false)).toBe(true);
    expect(result.every(r => r.reminder_time <= new Date())).toBe(true);
  });
});
