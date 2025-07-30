
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'completed']);
export const projectRoleEnum = pgEnum('project_role', ['owner', 'member']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Folders table for hierarchical organization
export const foldersTable = pgTable('folders', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  parent_id: integer('parent_id'), // Self-referencing for hierarchy
  user_id: integer('user_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable
  status: taskStatusEnum('status').notNull().default('todo'),
  due_date: timestamp('due_date'), // Nullable
  folder_id: integer('folder_id'), // Nullable - tasks can exist without folders
  user_id: integer('user_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Projects table for collaboration
export const projectsTable = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable
  owner_id: integer('owner_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Project members table for collaboration
export const projectMembersTable = pgTable('project_members', {
  id: serial('id').primaryKey(),
  project_id: integer('project_id').notNull(),
  user_id: integer('user_id').notNull(),
  role: projectRoleEnum('role').notNull().default('member'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Task collaborators table for shared tasks
export const taskCollaboratorsTable = pgTable('task_collaborators', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull(),
  user_id: integer('user_id').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Reminders table for notifications
export const remindersTable = pgTable('reminders', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull(),
  user_id: integer('user_id').notNull(),
  reminder_time: timestamp('reminder_time').notNull(),
  is_sent: boolean('is_sent').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  folders: many(foldersTable),
  tasks: many(tasksTable),
  ownedProjects: many(projectsTable),
  projectMemberships: many(projectMembersTable),
  taskCollaborations: many(taskCollaboratorsTable),
  reminders: many(remindersTable)
}));

export const foldersRelations = relations(foldersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [foldersTable.user_id],
    references: [usersTable.id]
  }),
  parent: one(foldersTable, {
    fields: [foldersTable.parent_id],
    references: [foldersTable.id]
  }),
  children: many(foldersTable),
  tasks: many(tasksTable)
}));

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [tasksTable.user_id],
    references: [usersTable.id]
  }),
  folder: one(foldersTable, {
    fields: [tasksTable.folder_id],
    references: [foldersTable.id]
  }),
  collaborators: many(taskCollaboratorsTable),
  reminders: many(remindersTable)
}));

export const projectsRelations = relations(projectsTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [projectsTable.owner_id],
    references: [usersTable.id]
  }),
  members: many(projectMembersTable)
}));

export const projectMembersRelations = relations(projectMembersTable, ({ one }) => ({
  project: one(projectsTable, {
    fields: [projectMembersTable.project_id],
    references: [projectsTable.id]
  }),
  user: one(usersTable, {
    fields: [projectMembersTable.user_id],
    references: [usersTable.id]
  })
}));

export const taskCollaboratorsRelations = relations(taskCollaboratorsTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [taskCollaboratorsTable.task_id],
    references: [tasksTable.id]
  }),
  user: one(usersTable, {
    fields: [taskCollaboratorsTable.user_id],
    references: [usersTable.id]
  })
}));

export const remindersRelations = relations(remindersTable, ({ one }) => ({
  task: one(tasksTable, {
    fields: [remindersTable.task_id],
    references: [tasksTable.id]
  }),
  user: one(usersTable, {
    fields: [remindersTable.user_id],
    references: [usersTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  folders: foldersTable,
  tasks: tasksTable,
  projects: projectsTable,
  projectMembers: projectMembersTable,
  taskCollaborators: taskCollaboratorsTable,
  reminders: remindersTable
};
