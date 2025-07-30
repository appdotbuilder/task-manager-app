
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable, remindersTable } from '../db/schema';
import { type CreateReminderInput } from '../schema';
import { createReminder } from '../handlers/create_reminder';
import { eq } from 'drizzle-orm';

describe('createReminder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTaskId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        status: 'todo',
        user_id: testUserId
      })
      .returning()
      .execute();
    testTaskId = taskResult[0].id;
  });

  it('should create a reminder', async () => {
    const reminderTime = new Date('2024-12-25T10:00:00Z');
    const testInput: CreateReminderInput = {
      task_id: testTaskId,
      user_id: testUserId,
      reminder_time: reminderTime
    };

    const result = await createReminder(testInput);

    // Basic field validation
    expect(result.task_id).toEqual(testTaskId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.reminder_time).toEqual(reminderTime);
    expect(result.is_sent).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save reminder to database', async () => {
    const reminderTime = new Date('2024-12-25T10:00:00Z');
    const testInput: CreateReminderInput = {
      task_id: testTaskId,
      user_id: testUserId,
      reminder_time: reminderTime
    };

    const result = await createReminder(testInput);

    // Query database to verify reminder was saved
    const reminders = await db.select()
      .from(remindersTable)
      .where(eq(remindersTable.id, result.id))
      .execute();

    expect(reminders).toHaveLength(1);
    expect(reminders[0].task_id).toEqual(testTaskId);
    expect(reminders[0].user_id).toEqual(testUserId);
    expect(reminders[0].reminder_time).toEqual(reminderTime);
    expect(reminders[0].is_sent).toEqual(false);
    expect(reminders[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple reminders for same task', async () => {
    const reminderTime1 = new Date('2024-12-25T10:00:00Z');
    const reminderTime2 = new Date('2024-12-25T14:00:00Z');

    const testInput1: CreateReminderInput = {
      task_id: testTaskId,
      user_id: testUserId,
      reminder_time: reminderTime1
    };

    const testInput2: CreateReminderInput = {
      task_id: testTaskId,
      user_id: testUserId,
      reminder_time: reminderTime2
    };

    const result1 = await createReminder(testInput1);
    const result2 = await createReminder(testInput2);

    // Verify both reminders were created
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.reminder_time).toEqual(reminderTime1);
    expect(result2.reminder_time).toEqual(reminderTime2);

    // Verify both exist in database
    const reminders = await db.select()
      .from(remindersTable)
      .where(eq(remindersTable.task_id, testTaskId))
      .execute();

    expect(reminders).toHaveLength(2);
  });
});
