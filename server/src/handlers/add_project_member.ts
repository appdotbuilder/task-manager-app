
import { db } from '../db';
import { projectMembersTable, projectsTable, usersTable } from '../db/schema';
import { type AddProjectMemberInput, type ProjectMember } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addProjectMember = async (input: AddProjectMemberInput): Promise<ProjectMember> => {
  try {
    // Verify project exists
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .execute();
    
    if (existingProject.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Verify user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();
    
    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Check if user is already a member of this project
    const existingMember = await db.select()
      .from(projectMembersTable)
      .where(
        and(
          eq(projectMembersTable.project_id, input.project_id),
          eq(projectMembersTable.user_id, input.user_id)
        )
      )
      .execute();
    
    if (existingMember.length > 0) {
      throw new Error('User is already a member of this project');
    }

    // Insert project member record
    const result = await db.insert(projectMembersTable)
      .values({
        project_id: input.project_id,
        user_id: input.user_id,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add project member failed:', error);
    throw error;
  }
};
