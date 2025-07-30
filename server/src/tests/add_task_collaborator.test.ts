
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tasksTable, taskCollaboratorsTable } from '../db/schema';
import { type AddTaskCollaboratorInput } from '../schema';
import { addTaskCollaborator } from '../handlers/add_task_collaborator';
import { eq, and } from 'drizzle-orm';

// Test users
const testUser1 = {
  email: 'user1@example.com',
  name: 'Test User 1',
  password_hash: 'hashed_password_1'
};

const testUser2 = {
  email: 'user2@example.com',
  name: 'Test User 2',
  password_hash: 'hashed_password_2'
};

// Test task
const testTask = {
  title: 'Test Task',
  description: 'A task for collaboration testing',
  status: 'todo' as const,
  due_date: null,
  folder_id: null,
  user_id: 1 // Will be set to created user ID
};

describe('addTaskCollaborator', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a task collaborator', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test task
    const tasks = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: users[0].id
      })
      .returning()
      .execute();

    const input: AddTaskCollaboratorInput = {
      task_id: tasks[0].id,
      user_id: users[1].id
    };

    const result = await addTaskCollaborator(input);

    // Basic field validation
    expect(result.task_id).toEqual(tasks[0].id);
    expect(result.user_id).toEqual(users[1].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task collaborator to database', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test task
    const tasks = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: users[0].id
      })
      .returning()
      .execute();

    const input: AddTaskCollaboratorInput = {
      task_id: tasks[0].id,
      user_id: users[1].id
    };

    const result = await addTaskCollaborator(input);

    // Query using proper drizzle syntax
    const collaborators = await db.select()
      .from(taskCollaboratorsTable)
      .where(eq(taskCollaboratorsTable.id, result.id))
      .execute();

    expect(collaborators).toHaveLength(1);
    expect(collaborators[0].task_id).toEqual(tasks[0].id);
    expect(collaborators[0].user_id).toEqual(users[1].id);
    expect(collaborators[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const input: AddTaskCollaboratorInput = {
      task_id: 999, // Non-existent task ID
      user_id: users[0].id
    };

    await expect(addTaskCollaborator(input)).rejects.toThrow(/task not found/i);
  });

  it('should throw error when user does not exist', async () => {
    // Create test user and task
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const tasks = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: users[0].id
      })
      .returning()
      .execute();

    const input: AddTaskCollaboratorInput = {
      task_id: tasks[0].id,
      user_id: 999 // Non-existent user ID
    };

    await expect(addTaskCollaborator(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when collaboration already exists', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    // Create test task
    const tasks = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: users[0].id
      })
      .returning()
      .execute();

    // Create existing collaboration
    await db.insert(taskCollaboratorsTable)
      .values({
        task_id: tasks[0].id,
        user_id: users[1].id
      })
      .execute();

    const input: AddTaskCollaboratorInput = {
      task_id: tasks[0].id,
      user_id: users[1].id
    };

    await expect(addTaskCollaborator(input)).rejects.toThrow(/already a collaborator/i);
  });

  it('should allow multiple different collaborators on same task', async () => {
    // Create test users
    const testUser3 = {
      email: 'user3@example.com',
      name: 'Test User 3',
      password_hash: 'hashed_password_3'
    };

    const users = await db.insert(usersTable)
      .values([testUser1, testUser2, testUser3])
      .returning()
      .execute();

    // Create test task
    const tasks = await db.insert(tasksTable)
      .values({
        ...testTask,
        user_id: users[0].id
      })
      .returning()
      .execute();

    // Add first collaborator
    const input1: AddTaskCollaboratorInput = {
      task_id: tasks[0].id,
      user_id: users[1].id
    };

    const result1 = await addTaskCollaborator(input1);

    // Add second collaborator
    const input2: AddTaskCollaboratorInput = {
      task_id: tasks[0].id,
      user_id: users[2].id
    };

    const result2 = await addTaskCollaborator(input2);

    // Verify both collaborations exist
    const collaborators = await db.select()
      .from(taskCollaboratorsTable)
      .where(eq(taskCollaboratorsTable.task_id, tasks[0].id))
      .execute();

    expect(collaborators).toHaveLength(2);
    expect(collaborators.map(c => c.user_id).sort()).toEqual([users[1].id, users[2].id].sort());
  });
});
