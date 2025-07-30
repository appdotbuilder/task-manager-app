
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  loginInputSchema,
  createFolderInputSchema,
  updateFolderInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  createProjectInputSchema,
  updateProjectInputSchema,
  addProjectMemberInputSchema,
  addTaskCollaboratorInputSchema,
  createReminderInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { createFolder } from './handlers/create_folder';
import { getFolders } from './handlers/get_folders';
import { updateFolder } from './handlers/update_folder';
import { deleteFolder } from './handlers/delete_folder';
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { addProjectMember } from './handlers/add_project_member';
import { addTaskCollaborator } from './handlers/add_task_collaborator';
import { createReminder } from './handlers/create_reminder';
import { getPendingReminders } from './handlers/get_pending_reminders';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Folder management
  createFolder: publicProcedure
    .input(createFolderInputSchema)
    .mutation(({ input }) => createFolder(input)),
  
  getFolders: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getFolders(input.userId)),
  
  updateFolder: publicProcedure
    .input(updateFolderInputSchema)
    .mutation(({ input }) => updateFolder(input)),
  
  deleteFolder: publicProcedure
    .input(z.object({ folderId: z.number() }))
    .mutation(({ input }) => deleteFolder(input.folderId)),

  // Task management
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasks: publicProcedure
    .input(z.object({ userId: z.number(), folderId: z.number().optional() }))
    .query(({ input }) => getTasks(input.userId, input.folderId)),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(({ input }) => deleteTask(input.taskId)),

  // Project collaboration
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),
  
  getProjects: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getProjects(input.userId)),
  
  addProjectMember: publicProcedure
    .input(addProjectMemberInputSchema)
    .mutation(({ input }) => addProjectMember(input)),

  // Task collaboration
  addTaskCollaborator: publicProcedure
    .input(addTaskCollaboratorInputSchema)
    .mutation(({ input }) => addTaskCollaborator(input)),

  // Reminders
  createReminder: publicProcedure
    .input(createReminderInputSchema)
    .mutation(({ input }) => createReminder(input)),
  
  getPendingReminders: publicProcedure
    .query(() => getPendingReminders()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
