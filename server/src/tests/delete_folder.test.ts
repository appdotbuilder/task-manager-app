
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable, tasksTable } from '../db/schema';
import { deleteFolder } from '../handlers/delete_folder';
import { eq } from 'drizzle-orm';

describe('deleteFolder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a folder successfully', async () => {
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
        name: 'Test Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const folderId = folderResult[0].id;

    // Delete the folder
    const result = await deleteFolder(folderId);

    expect(result).toBe(true);

    // Verify folder is deleted
    const folders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, folderId))
      .execute();

    expect(folders).toHaveLength(0);
  });

  it('should return false when folder does not exist', async () => {
    const result = await deleteFolder(99999);
    expect(result).toBe(false);
  });

  it('should move tasks to null folder when deleting folder', async () => {
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
        name: 'Test Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const folderId = folderResult[0].id;

    // Create tasks in the folder
    const taskResult = await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          status: 'todo',
          due_date: null,
          folder_id: folderId,
          user_id: userId
        },
        {
          title: 'Task 2',
          description: 'Second task',
          status: 'in_progress',
          due_date: null,
          folder_id: folderId,
          user_id: userId
        }
      ])
      .returning()
      .execute();

    // Delete the folder
    const result = await deleteFolder(folderId);

    expect(result).toBe(true);

    // Verify tasks now have null folder_id
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.user_id, userId))
      .execute();

    expect(tasks).toHaveLength(2);
    tasks.forEach(task => {
      expect(task.folder_id).toBeNull();
    });
  });

  it('should move child folders to null parent when deleting folder', async () => {
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
    const parentId = parentResult[0].id;

    // Create child folders
    const childResults = await db.insert(foldersTable)
      .values([
        {
          name: 'Child Folder 1',
          parent_id: parentId,
          user_id: userId
        },
        {
          name: 'Child Folder 2',
          parent_id: parentId,
          user_id: userId
        }
      ])
      .returning()
      .execute();

    // Delete the parent folder
    const result = await deleteFolder(parentId);

    expect(result).toBe(true);

    // Verify parent folder is deleted
    const parentFolders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, parentId))
      .execute();

    expect(parentFolders).toHaveLength(0);

    // Verify child folders now have null parent_id
    const childFolders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.user_id, userId))
      .execute();

    expect(childFolders).toHaveLength(2);
    childFolders.forEach(folder => {
      expect(folder.parent_id).toBeNull();
    });
  });

  it('should handle complex nested structure correctly', async () => {
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

    // Create folder hierarchy: Parent -> Child -> Grandchild
    const parentResult = await db.insert(foldersTable)
      .values({
        name: 'Parent Folder',
        parent_id: null,
        user_id: userId
      })
      .returning()
      .execute();
    const parentId = parentResult[0].id;

    const childResult = await db.insert(foldersTable)
      .values({
        name: 'Child Folder',
        parent_id: parentId,
        user_id: userId
      })
      .returning()
      .execute();
    const childId = childResult[0].id;

    const grandchildResult = await db.insert(foldersTable)
      .values({
        name: 'Grandchild Folder',
        parent_id: childId,
        user_id: userId
      })
      .returning()
      .execute();
    const grandchildId = grandchildResult[0].id;

    // Create tasks in different folders
    await db.insert(tasksTable)
      .values([
        {
          title: 'Parent Task',
          description: 'Task in parent',
          status: 'todo',
          due_date: null,
          folder_id: parentId,
          user_id: userId
        },
        {
          title: 'Child Task',
          description: 'Task in child',
          status: 'todo',
          due_date: null,
          folder_id: childId,
          user_id: userId
        },
        {
          title: 'Grandchild Task',
          description: 'Task in grandchild',
          status: 'todo',
          due_date: null,
          folder_id: grandchildId,
          user_id: userId
        }
      ])
      .execute();

    // Delete the parent folder
    const result = await deleteFolder(parentId);

    expect(result).toBe(true);

    // Verify parent folder is deleted
    const parentFolders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, parentId))
      .execute();

    expect(parentFolders).toHaveLength(0);

    // Verify child folder now has null parent
    const childFolders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, childId))
      .execute();

    expect(childFolders).toHaveLength(1);
    expect(childFolders[0].parent_id).toBeNull();

    // Verify grandchild folder still exists with child as parent
    const grandchildFolders = await db.select()
      .from(foldersTable)
      .where(eq(foldersTable.id, grandchildId))
      .execute();

    expect(grandchildFolders).toHaveLength(1);
    expect(grandchildFolders[0].parent_id).toBe(childId);

    // Verify tasks are reassigned correctly
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.user_id, userId))
      .execute();

    expect(tasks).toHaveLength(3);
    
    // Parent task should now have null folder_id
    const parentTask = tasks.find(t => t.title === 'Parent Task');
    expect(parentTask?.folder_id).toBeNull();

    // Child and grandchild tasks should still be in their folders
    const childTask = tasks.find(t => t.title === 'Child Task');
    expect(childTask?.folder_id).toBe(childId);

    const grandchildTask = tasks.find(t => t.title === 'Grandchild Task');
    expect(grandchildTask?.folder_id).toBe(grandchildId);
  });
});
