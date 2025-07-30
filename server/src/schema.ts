
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Folder schema
export const folderSchema = z.object({
  id: z.number(),
  name: z.string(),
  parent_id: z.number().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Folder = z.infer<typeof folderSchema>;

// Folder input schemas
export const createFolderInputSchema = z.object({
  name: z.string().min(1),
  parent_id: z.number().nullable(),
  user_id: z.number()
});

export type CreateFolderInput = z.infer<typeof createFolderInputSchema>;

export const updateFolderInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  parent_id: z.number().nullable().optional()
});

export type UpdateFolderInput = z.infer<typeof updateFolderInputSchema>;

// Task status enum
export const taskStatusSchema = z.enum(['todo', 'in_progress', 'completed']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Task schema
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  due_date: z.coerce.date().nullable(),
  folder_id: z.number().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Task input schemas
export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  status: taskStatusSchema.default('todo'),
  due_date: z.coerce.date().nullable(),
  folder_id: z.number().nullable(),
  user_id: z.number()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: taskStatusSchema.optional(),
  due_date: z.coerce.date().nullable().optional(),
  folder_id: z.number().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Project schema
export const projectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  owner_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Project = z.infer<typeof projectSchema>;

// Project input schemas
export const createProjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  owner_id: z.number()
});

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export const updateProjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;

// Project member schema
export const projectMemberSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  user_id: z.number(),
  role: z.enum(['owner', 'member']),
  created_at: z.coerce.date()
});

export type ProjectMember = z.infer<typeof projectMemberSchema>;

// Project member input schemas
export const addProjectMemberInputSchema = z.object({
  project_id: z.number(),
  user_id: z.number(),
  role: z.enum(['owner', 'member']).default('member')
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberInputSchema>;

// Task collaboration schema
export const taskCollaboratorSchema = z.object({
  id: z.number(),
  task_id: z.number(),
  user_id: z.number(),
  created_at: z.coerce.date()
});

export type TaskCollaborator = z.infer<typeof taskCollaboratorSchema>;

// Task collaborator input schemas
export const addTaskCollaboratorInputSchema = z.object({
  task_id: z.number(),
  user_id: z.number()
});

export type AddTaskCollaboratorInput = z.infer<typeof addTaskCollaboratorInputSchema>;

// Reminder schema
export const reminderSchema = z.object({
  id: z.number(),
  task_id: z.number(),
  user_id: z.number(),
  reminder_time: z.coerce.date(),
  is_sent: z.boolean(),
  created_at: z.coerce.date()
});

export type Reminder = z.infer<typeof reminderSchema>;

// Reminder input schemas
export const createReminderInputSchema = z.object({
  task_id: z.number(),
  user_id: z.number(),
  reminder_time: z.coerce.date()
});

export type CreateReminderInput = z.infer<typeof createReminderInputSchema>;
