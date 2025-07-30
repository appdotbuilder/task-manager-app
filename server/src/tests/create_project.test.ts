
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, usersTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a project', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        name: 'Project Owner',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreateProjectInput = {
      name: 'My Test Project',
      description: 'A project for testing purposes',
      owner_id: testUser.id
    };

    const result = await createProject(testInput);

    // Basic field validation
    expect(result.name).toEqual('My Test Project');
    expect(result.description).toEqual('A project for testing purposes');
    expect(result.owner_id).toEqual(testUser.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save project to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        name: 'Project Owner',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreateProjectInput = {
      name: 'Database Test Project',
      description: 'Testing database persistence',
      owner_id: testUser.id
    };

    const result = await createProject(testInput);

    // Query using proper drizzle syntax
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    expect(projects[0].name).toEqual('Database Test Project');
    expect(projects[0].description).toEqual('Testing database persistence');
    expect(projects[0].owner_id).toEqual(testUser.id);
    expect(projects[0].created_at).toBeInstanceOf(Date);
    expect(projects[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create project with null description', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        name: 'Project Owner',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreateProjectInput = {
      name: 'Project Without Description',
      description: null,
      owner_id: testUser.id
    };

    const result = await createProject(testInput);

    expect(result.name).toEqual('Project Without Description');
    expect(result.description).toBeNull();
    expect(result.owner_id).toEqual(testUser.id);
    expect(result.id).toBeDefined();
  });
});
