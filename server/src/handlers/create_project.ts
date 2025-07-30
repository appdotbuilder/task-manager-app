
import { db } from '../db';
import { projectsTable } from '../db/schema';
import { type CreateProjectInput, type Project } from '../schema';

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  try {
    // Insert project record
    const result = await db.insert(projectsTable)
      .values({
        name: input.name,
        description: input.description,
        owner_id: input.owner_id
      })
      .returning()
      .execute();

    const project = result[0];
    return project;
  } catch (error) {
    console.error('Project creation failed:', error);
    throw error;
  }
};
