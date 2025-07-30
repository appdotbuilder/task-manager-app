
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, usersTable, foldersTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const folderId = folderResult[0].id;

    const testInput: CreateTaskInput = {
      title: 'Test Task',
      description: 'A task for testing',
      status: 'in_progress',
      due_date: new Date('2024-12-31'),
      folder_id: folderId,
      user_id: userId
    };

    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.status).toEqual('in_progress');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.folder_id).toEqual(folderId);
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal fields and defaults', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const testInput: CreateTaskInput = {
      title: 'Minimal Task',
      description: null,
      status: 'todo', // Zod default
      due_date: null,
      folder_id: null,
      user_id: userId
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull();
    expect(result.status).toEqual('todo');
    expect(result.due_date).toBeNull();
    expect(result.folder_id).toBeNull();
    expect(result.user_id).toEqual(userId);
    expect(result.id).toBeDefined();
  });

  it('should save task to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const testInput: CreateTaskInput = {
      title: 'Database Test Task',
      description: 'Testing database persistence',
      status: 'completed',
      due_date: new Date('2024-06-15'),
      folder_id: null,
      user_id: userId
    };

    const result = await createTask(testInput);

    // Query database to verify persistence
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Test Task');
    expect(tasks[0].description).toEqual('Testing database persistence');
    expect(tasks[0].status).toEqual('completed');
    expect(tasks[0].due_date).toEqual(new Date('2024-06-15'));
    expect(tasks[0].folder_id).toBeNull();
    expect(tasks[0].user_id).toEqual(userId);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create task with valid folder reference', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Work Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const folderId = folderResult[0].id;

    const testInput: CreateTaskInput = {
      title: 'Folder Task',
      description: 'Task in a folder',
      status: 'todo',
      due_date: null,
      folder_id: folderId,
      user_id: userId
    };

    const result = await createTask(testInput);

    expect(result.folder_id).toEqual(folderId);
    expect(result.user_id).toEqual(userId);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].folder_id).toEqual(folderId);
  });
});
