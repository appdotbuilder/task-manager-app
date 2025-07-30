
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, tasksTable, taskCollaboratorsTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return tasks owned by user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test task
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A test task',
        status: 'todo',
        due_date: null,
        folder_id: null,
        user_id: user.id
      })
      .returning()
      .execute();

    const result = await getTasks(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(task.id);
    expect(result[0].title).toEqual('Test Task');
    expect(result[0].description).toEqual('A test task');
    expect(result[0].status).toEqual('todo');
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks shared with user through collaboration', async () => {
    // Create test users
    const [owner] = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        name: 'Task Owner',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [collaborator] = await db.insert(usersTable)
      .values({
        email: 'collaborator@example.com',
        name: 'Collaborator',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create task owned by first user
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Shared Task',
        description: 'A shared task',
        status: 'in_progress',
        due_date: null,
        folder_id: null,
        user_id: owner.id
      })
      .returning()
      .execute();

    // Add second user as collaborator
    await db.insert(taskCollaboratorsTable)
      .values({
        task_id: task.id,
        user_id: collaborator.id
      })
      .execute();

    const result = await getTasks(collaborator.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(task.id);
    expect(result[0].title).toEqual('Shared Task');
    expect(result[0].user_id).toEqual(owner.id); // Original owner
  });

  it('should filter tasks by folder when folderId is provided', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test folder
    const [folder] = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        parent_id: null,
        user_id: user.id
      })
      .returning()
      .execute();

    // Create task in folder
    const [taskInFolder] = await db.insert(tasksTable)
      .values({
        title: 'Task in Folder',
        description: null,
        status: 'todo',
        due_date: null,
        folder_id: folder.id,
        user_id: user.id
      })
      .returning()
      .execute();

    // Create task not in folder
    await db.insert(tasksTable)
      .values({
        title: 'Task without Folder',
        description: null,
        status: 'todo',
        due_date: null,
        folder_id: null,
        user_id: user.id
      })
      .execute();

    const result = await getTasks(user.id, folder.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(taskInFolder.id);
    expect(result[0].folder_id).toEqual(folder.id);
  });

  it('should return tasks without folder when folderId is null', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create test folder
    const [folder] = await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        parent_id: null,
        user_id: user.id
      })
      .returning()
      .execute();

    // Create task in folder
    await db.insert(tasksTable)
      .values({
        title: 'Task in Folder',
        description: null,
        status: 'todo',
        due_date: null,
        folder_id: folder.id,
        user_id: user.id
      })
      .execute();

    // Create task not in folder
    const [rootTask] = await db.insert(tasksTable)
      .values({
        title: 'Root Task',
        description: null,
        status: 'todo',
        due_date: null,
        folder_id: null,
        user_id: user.id
      })
      .returning()
      .execute();

    const result = await getTasks(user.id, null);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(rootTask.id);
    expect(result[0].folder_id).toBeNull();
  });

  it('should return empty array when user has no tasks', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const result = await getTasks(user.id);

    expect(result).toHaveLength(0);
  });

  it('should not return duplicate tasks when user owns and collaborates on same task', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create task owned by user
    const [task] = await db.insert(tasksTable)
      .values({
        title: 'Owned Task',
        description: null,
        status: 'todo',
        due_date: null,
        folder_id: null,
        user_id: user.id
      })
      .returning()
      .execute();

    // Add user as collaborator on their own task
    await db.insert(taskCollaboratorsTable)
      .values({
        task_id: task.id,
        user_id: user.id
      })
      .execute();

    const result = await getTasks(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(task.id);
  });
});
