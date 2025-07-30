
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let folderId: number;
  let taskId: number;

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
    userId = userResult[0].id;

    // Create test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    folderId = folderResult[0].id;

    // Create test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Original Task',
        description: 'Original description',
        status: 'todo',
        due_date: new Date('2024-12-31'),
        folder_id: folderId,
        user_id: userId
      })
      .returning()
      .execute();
    taskId = taskResult[0].id;
  });

  it('should update task title', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Updated Task Title'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.status).toEqual('todo'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task status', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      status: 'completed'
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.status).toEqual('completed');
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const newDueDate = new Date('2025-01-15');
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Multi Update Task',
      description: 'Updated description',
      status: 'in_progress',
      due_date: newDueDate
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Multi Update Task');
    expect(result.description).toEqual('Updated description');
    expect(result.status).toEqual('in_progress');
    expect(result.due_date).toEqual(newDueDate);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      description: null,
      due_date: null,
      folder_id: null
    };

    const result = await updateTask(input);

    expect(result.id).toEqual(taskId);
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.folder_id).toBeNull();
  });

  it('should save updates to database', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Database Update Test',
      status: 'completed'
    };

    await updateTask(input);

    // Verify changes were persisted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Update Test');
    expect(tasks[0].status).toEqual('completed');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const input: UpdateTaskInput = {
      id: 99999,
      title: 'Non-existent Task'
    };

    expect(updateTask(input)).rejects.toThrow(/not found/i);
  });

  it('should update only provided fields', async () => {
    const input: UpdateTaskInput = {
      id: taskId,
      title: 'Partial Update'
    };

    const result = await updateTask(input);

    // Only title should change
    expect(result.title).toEqual('Partial Update');
    expect(result.description).toEqual('Original description');
    expect(result.status).toEqual('todo');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.folder_id).toEqual(folderId);
  });
});
