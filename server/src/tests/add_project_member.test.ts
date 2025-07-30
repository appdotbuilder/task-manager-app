
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, projectsTable, projectMembersTable } from '../db/schema';
import { type AddProjectMemberInput } from '../schema';
import { addProjectMember } from '../handlers/add_project_member';
import { eq, and } from 'drizzle-orm';

// Test data setup
const testUser = {
  email: 'member@example.com',
  name: 'Test Member',
  password_hash: 'hashed_password'
};

const testOwner = {
  email: 'owner@example.com',
  name: 'Project Owner',
  password_hash: 'hashed_password'
};

const testProject = {
  name: 'Test Project',
  description: 'A project for testing',
  owner_id: 1 // Will be set after creating owner
};

describe('addProjectMember', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a member to a project', async () => {
    // Create owner user
    const ownerResult = await db.insert(usersTable)
      .values(testOwner)
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create member user
    const memberResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        owner_id: ownerId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const input: AddProjectMemberInput = {
      project_id: projectId,
      user_id: memberId,
      role: 'member'
    };

    const result = await addProjectMember(input);

    // Basic field validation
    expect(result.project_id).toEqual(projectId);
    expect(result.user_id).toEqual(memberId);
    expect(result.role).toEqual('member');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save project member to database', async () => {
    // Create owner user
    const ownerResult = await db.insert(usersTable)
      .values(testOwner)
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create member user
    const memberResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        owner_id: ownerId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const input: AddProjectMemberInput = {
      project_id: projectId,
      user_id: memberId,
      role: 'owner'
    };

    const result = await addProjectMember(input);

    // Query using proper drizzle syntax
    const members = await db.select()
      .from(projectMembersTable)
      .where(eq(projectMembersTable.id, result.id))
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].project_id).toEqual(projectId);
    expect(members[0].user_id).toEqual(memberId);
    expect(members[0].role).toEqual('owner');
    expect(members[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when project does not exist', async () => {
    // Create member user
    const memberResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    const input: AddProjectMemberInput = {
      project_id: 999, // Non-existent project
      user_id: memberId,
      role: 'member'
    };

    await expect(addProjectMember(input)).rejects.toThrow(/project.*not found/i);
  });

  it('should throw error when user does not exist', async () => {
    // Create owner user
    const ownerResult = await db.insert(usersTable)
      .values(testOwner)
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        owner_id: ownerId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const input: AddProjectMemberInput = {
      project_id: projectId,
      user_id: 999, // Non-existent user
      role: 'member'
    };

    await expect(addProjectMember(input)).rejects.toThrow(/user.*not found/i);
  });

  it('should throw error when user is already a member', async () => {
    // Create owner user
    const ownerResult = await db.insert(usersTable)
      .values(testOwner)
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create member user
    const memberResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        owner_id: ownerId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    const input: AddProjectMemberInput = {
      project_id: projectId,
      user_id: memberId,
      role: 'member'
    };

    // Add member first time
    await addProjectMember(input);

    // Try to add same member again
    await expect(addProjectMember(input)).rejects.toThrow(/already a member/i);
  });

  it('should query project members correctly', async () => {
    // Create owner user
    const ownerResult = await db.insert(usersTable)
      .values(testOwner)
      .returning()
      .execute();
    const ownerId = ownerResult[0].id;

    // Create member user
    const memberResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const memberId = memberResult[0].id;

    // Create project
    const projectResult = await db.insert(projectsTable)
      .values({
        ...testProject,
        owner_id: ownerId
      })
      .returning()
      .execute();
    const projectId = projectResult[0].id;

    // Add member
    await addProjectMember({
      project_id: projectId,
      user_id: memberId,
      role: 'member'
    });

    // Query members for this project
    const members = await db.select()
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.project_id, projectId),
          eq(projectMembersTable.user_id, memberId)
        )
      )
      .execute();

    expect(members).toHaveLength(1);
    expect(members[0].project_id).toEqual(projectId);
    expect(members[0].user_id).toEqual(memberId);
    expect(members[0].role).toEqual('member');
  });
});
