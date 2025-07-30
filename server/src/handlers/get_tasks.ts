
import { db } from '../db';
import { tasksTable, taskCollaboratorsTable } from '../db/schema';
import { type Task } from '../schema';
import { eq, or, and, isNull } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export async function getTasks(userId: number, folderId?: number | null): Promise<Task[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Get tasks owned by user OR tasks where user is a collaborator
    const userConditions: SQL<unknown>[] = [
      eq(tasksTable.user_id, userId)
    ];

    // Handle folder filtering
    if (folderId !== undefined) {
      if (folderId === null) {
        conditions.push(isNull(tasksTable.folder_id));
      } else {
        conditions.push(eq(tasksTable.folder_id, folderId));
      }
    }

    // Query for owned tasks
    let ownedQuery = db.select().from(tasksTable).where(eq(tasksTable.user_id, userId));
    
    if (conditions.length > 0) {
      ownedQuery = db.select().from(tasksTable).where(and(eq(tasksTable.user_id, userId), ...conditions));
    }

    // Query for collaborated tasks
    let collaboratedQuery = db.select({
      id: tasksTable.id,
      title: tasksTable.title,
      description: tasksTable.description,
      status: tasksTable.status,
      due_date: tasksTable.due_date,
      folder_id: tasksTable.folder_id,
      user_id: tasksTable.user_id,
      created_at: tasksTable.created_at,
      updated_at: tasksTable.updated_at
    })
    .from(tasksTable)
    .innerJoin(taskCollaboratorsTable, eq(tasksTable.id, taskCollaboratorsTable.task_id))
    .where(eq(taskCollaboratorsTable.user_id, userId));

    if (conditions.length > 0) {
      collaboratedQuery = db.select({
        id: tasksTable.id,
        title: tasksTable.title,
        description: tasksTable.description,
        status: tasksTable.status,
        due_date: tasksTable.due_date,
        folder_id: tasksTable.folder_id,
        user_id: tasksTable.user_id,
        created_at: tasksTable.created_at,
        updated_at: tasksTable.updated_at
      })
      .from(tasksTable)
      .innerJoin(taskCollaboratorsTable, eq(tasksTable.id, taskCollaboratorsTable.task_id))
      .where(and(eq(taskCollaboratorsTable.user_id, userId), ...conditions));
    }

    // Execute both queries
    const ownedTasks = await ownedQuery.execute();
    const collaboratedTasks = await collaboratedQuery.execute();

    // Combine results and remove duplicates
    const allTasks = [...ownedTasks, ...collaboratedTasks];
    const uniqueTasks = allTasks.filter((task, index, arr) => 
      arr.findIndex(t => t.id === task.id) === index
    );

    return uniqueTasks;
  } catch (error) {
    console.error('Get tasks failed:', error);
    throw error;
  }
}
