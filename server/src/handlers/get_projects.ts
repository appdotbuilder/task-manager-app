
import { db } from '../db';
import { projectsTable, projectMembersTable } from '../db/schema';
import { type Project } from '../schema';
import { eq, or } from 'drizzle-orm';

export async function getProjects(userId: number): Promise<Project[]> {
  try {
    // Get projects where user is owner OR member
    const ownedProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.owner_id, userId))
      .execute();

    const memberProjects = await db.select({
      id: projectsTable.id,
      name: projectsTable.name,
      description: projectsTable.description,
      owner_id: projectsTable.owner_id,
      created_at: projectsTable.created_at,
      updated_at: projectsTable.updated_at
    })
      .from(projectsTable)
      .innerJoin(projectMembersTable, eq(projectsTable.id, projectMembersTable.project_id))
      .where(eq(projectMembersTable.user_id, userId))
      .execute();

    // Combine results and deduplicate by project id
    const allProjects = [...ownedProjects, ...memberProjects];
    const uniqueProjects = allProjects.filter((project, index, array) => 
      array.findIndex(p => p.id === project.id) === index
    );

    return uniqueProjects;
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
}
