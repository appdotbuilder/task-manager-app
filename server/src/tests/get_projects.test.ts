
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { getProjects } from '../handlers/get_projects';

describe('getProjects', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no projects', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const result = await getProjects(user.id);

    expect(result).toEqual([]);
  });

  it('should return projects owned by user', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        name: 'Owner User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create project owned by user
    await db.insert(projectsTable)
      .values({
        name: 'My Project',
        description: 'A project I own',
        owner_id: user.id
      })
      .execute();

    const result = await getProjects(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('My Project');
    expect(result[0].description).toEqual('A project I own');
    expect(result[0].owner_id).toEqual(user.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return projects where user is a member', async () => {
    // Create owner user
    const [owner] = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        name: 'Owner User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create member user
    const [member] = await db.insert(usersTable)
      .values({
        email: 'member@example.com',
        name: 'Member User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create project owned by owner
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Shared Project',
        description: 'A shared project',
        owner_id: owner.id
      })
      .returning()
      .execute();

    // Add member to project
    await db.insert(projectMembersTable)
      .values({
        project_id: project.id,
        user_id: member.id,
        role: 'member'
      })
      .execute();

    const result = await getProjects(member.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Shared Project');
    expect(result[0].description).toEqual('A shared project');
    expect(result[0].owner_id).toEqual(owner.id);
  });

  it('should deduplicate projects when user is both owner and member', async () => {
    // Create user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create project owned by user
    const [project] = await db.insert(projectsTable)
      .values({
        name: 'Duplicate Project',
        description: 'Project with duplicate membership',
        owner_id: user.id
      })
      .returning()
      .execute();

    // Also add user as explicit member (unusual but possible)
    await db.insert(projectMembersTable)
      .values({
        project_id: project.id,
        user_id: user.id,
        role: 'owner'
      })
      .execute();

    const result = await getProjects(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Duplicate Project');
  });

  it('should return multiple projects from different sources', async () => {
    // Create users
    const [owner1] = await db.insert(usersTable)
      .values({
        email: 'owner1@example.com',
        name: 'Owner 1',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [owner2] = await db.insert(usersTable)
      .values({
        email: 'owner2@example.com',
        name: 'Owner 2',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const [user] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    // Create project owned by user
    await db.insert(projectsTable)
      .values({
        name: 'My Own Project',
        description: 'Project I own',
        owner_id: user.id
      })
      .execute();

    // Create projects owned by others where user is member
    const [project1] = await db.insert(projectsTable)
      .values({
        name: 'Shared Project 1',
        description: 'First shared project',
        owner_id: owner1.id
      })
      .returning()
      .execute();

    const [project2] = await db.insert(projectsTable)
      .values({
        name: 'Shared Project 2',
        description: 'Second shared project',
        owner_id: owner2.id
      })
      .returning()
      .execute();

    // Add user as member to both projects
    await db.insert(projectMembersTable)
      .values([
        {
          project_id: project1.id,
          user_id: user.id,
          role: 'member'
        },
        {
          project_id: project2.id,
          user_id: user.id,
          role: 'member'
        }
      ])
      .execute();

    const result = await getProjects(user.id);

    expect(result).toHaveLength(3);
    
    const projectNames = result.map(p => p.name).sort();
    expect(projectNames).toEqual(['My Own Project', 'Shared Project 1', 'Shared Project 2']);
  });
});
