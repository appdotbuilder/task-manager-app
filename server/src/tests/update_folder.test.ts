
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { type UpdateFolderInput } from '../schema';
import { updateFolder } from '../handlers/update_folder';
import { eq } from 'drizzle-orm';

describe('updateFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update folder name', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Original Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    const updateInput: UpdateFolderInput = {
      id: folder.id,
      name: 'Updated Folder Name'
    };

    const result = await updateFolder(updateInput);

    expect(result.id).toEqual(folder.id);
    expect(result.name).toEqual('Updated Folder Name');
    expect(result.parent_id).toEqual(folder.parent_id);
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > folder.updated_at).toBe(true);
  });

  it('should update folder parent_id', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword'
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
    
    const parentFolder = parentResult[0];

    // Create child folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Child Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    const updateInput: UpdateFolderInput = {
      id: folder.id,
      parent_id: parentFolder.id
    };

    const result = await updateFolder(updateInput);

    expect(result.id).toEqual(folder.id);
    expect(result.name).toEqual('Child Folder');
    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword'
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
    
    const parentFolder = parentResult[0];

    // Create test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Original Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    const updateInput: UpdateFolderInput = {
      id: folder.id,
      name: 'Updated Folder',
      parent_id: parentFolder.id
    };

    const result = await updateFolder(updateInput);

    expect(result.id).toEqual(folder.id);
    expect(result.name).toEqual('Updated Folder');
    expect(result.parent_id).toEqual(parentFolder.id);
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set parent_id to null', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword'
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
    
    const parentFolder = parentResult[0];

    // Create child folder with parent
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Child Folder',
        parent_id: parentFolder.id,
        user_id: userId
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    const updateInput: UpdateFolderInput = {
      id: folder.id,
      parent_id: null
    };

    const result = await updateFolder(updateInput);

    expect(result.id).toEqual(folder.id);
    expect(result.name).toEqual('Child Folder');
    expect(result.parent_id).toBeNull();
    expect(result.user_id).toEqual(userId);
  });

  it('should save changes to database', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test folder
    const folderResult = await db.insert(foldersTable)
      .values({
        name: 'Original Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    
    const folder = folderResult[0];

    const updateInput: UpdateFolderInput = {
      id: folder.id,
      name: 'Database Updated'
    };

    await updateFolder(updateInput);

    // Verify changes were saved to database
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folder.id))
      .execute();

    expect(folders).toHaveLength(1);
    expect(folders[0].name).toEqual('Database Updated');
    expect(folders[0].updated_at).toBeInstanceOf(Date);
    expect(folders[0].updated_at > folder.updated_at).toBe(true);
  });

  it('should throw error for non-existent folder', async () => {
    const updateInput: UpdateFolderInput = {
      id: 999,
      name: 'Does Not Exist'
    };

    expect(updateFolder(updateInput)).rejects.toThrow(/folder with id 999 not found/i);
  });
});
