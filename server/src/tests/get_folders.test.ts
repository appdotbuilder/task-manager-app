
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { getFolders } from '../handlers/get_folders';

describe('getFolders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no folders', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getFolders(userId);

    expect(result).toEqual([]);
  });

  it('should return folders for specific user', async () => {
    // Create users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        name: 'User 1',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        name: 'User 2',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create folders for both users
    await db.insert(foldersTable)
      .values([
        {
          name: 'User 1 Folder 1',
          parent_id: null,
          user_id: user1Id
        },
        {
          name: 'User 1 Folder 2',
          parent_id: null,
          user_id: user1Id
        },
        {
          name: 'User 2 Folder',
          parent_id: null,
          user_id: user2Id
        }
      ])
      .execute();

    const result = await getFolders(user1Id);

    expect(result).toHaveLength(2);
    expect(result.every(folder => folder.user_id === user1Id)).toBe(true);
    expect(result.some(folder => folder.name === 'User 1 Folder 1')).toBe(true);
    expect(result.some(folder => folder.name === 'User 1 Folder 2')).toBe(true);
    expect(result.some(folder => folder.name === 'User 2 Folder')).toBe(false);
  });

  it('should return folders with hierarchical structure', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create parent folder
    const parentResult = await db.insert(foldersTable)
      .values({
        name: 'Parent Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();

    const parentId = parentResult[0].id;

    // Create child folder
    await db.insert(foldersTable)
      .values({
        name: 'Child Folder',
        parent_id: parentId,
        user_id: userId
      })
      .execute();

    const result = await getFolders(userId);

    expect(result).toHaveLength(2);
    
    const parentFolder = result.find(folder => folder.name === 'Parent Folder');
    const childFolder = result.find(folder => folder.name === 'Child Folder');

    expect(parentFolder).toBeDefined();
    expect(childFolder).toBeDefined();
    expect(parentFolder!.parent_id).toBeNull();
    expect(childFolder!.parent_id).toBe(parentId);
  });

  it('should return folders with correct timestamps', async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create folder
    await db.insert(foldersTable)
      .values({
        name: 'Test Folder',
        parent_id: null,
        user_id: userId
      })
      .execute();

    const result = await getFolders(userId);

    expect(result).toHaveLength(1);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });
});
