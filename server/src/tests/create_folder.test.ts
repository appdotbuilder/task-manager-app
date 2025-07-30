
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foldersTable, usersTable } from '../db/schema';
import { type CreateFolderInput } from '../schema';
import { createFolder } from '../handlers/create_folder';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password_hash: 'hashed_password'
};

// Simple test input
const testInput: CreateFolderInput = {
  name: 'Test Folder',
  parent_id: null,
  user_id: 1
};

describe('createFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a folder', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    const result = await createFolder(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Folder');
    expect(result.parent_id).toBeNull();
    expect(result.user_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save folder to database', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    const result = await createFolder(testInput);

    // Query database to verify folder was saved
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, result.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toEqual('Test Folder');
    expect(folders[0].parent_id).toBeNull();
    expect(folders[0].user_id).toEqual(1);
    expect(folders[0].created_at).toBeInstanceOf(Date);
    expect(folders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create folder with parent folder', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    // Create parent folder
    const parentFolder = await createFolder({
      name: 'Parent Folder',
      parent_id: null,
      user_id: 1
    });

    // Create child folder
    const childInput: CreateFolderInput = {
      name: 'Child Folder',
      parent_id: parentFolder.id,
      user_id: 1
    };

    const result = await createFolder(childInput);

    expect(result.name).toEqual('Child Folder');
    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.user_id).toEqual(1);

    // Verify in database
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, result.id))
      .execute();

    expect(folders[0].parent_id).toEqual(parentFolder.id);
  });

  it('should throw error when user does not exist', async () => {
    // Don't create user - test with non-existent user_id
    const invalidInput: CreateFolderInput = {
      name: 'Test Folder',
      parent_id: null,
      user_id: 999
    };

    await expect(createFolder(invalidInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when parent folder does not exist', async () => {
    // Create test user first
    await db.insert(usersTable).values(testUser).execute();

    const invalidInput: CreateFolderInput = {
      name: 'Test Folder',
      parent_id: 999, // Non-existent parent
      user_id: 1
    };

    await expect(createFolder(invalidInput)).rejects.toThrow(/parent folder not found/i);
  });

  it('should throw error when parent folder belongs to different user', async () => {
    // Create two test users
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(usersTable).values({
      email: 'other@example.com',
      name: 'Other User',
      password_hash: 'other_hash'
    }).execute();

    // Create folder for user 1
    const parentFolder = await createFolder({
      name: 'User 1 Folder',
      parent_id: null,
      user_id: 1
    });

    // Try to create child folder for user 2 under user 1's folder
    const invalidInput: CreateFolderInput = {
      name: 'User 2 Child',
      parent_id: parentFolder.id,
      user_id: 2
    };

    await expect(createFolder(invalidInput)).rejects.toThrow(/parent folder does not belong to the specified user/i);
  });
});
