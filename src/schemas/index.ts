// Modern Zod schemas for the Kanban Bot
import { z } from 'zod';

// Core Schema Types
export const TaskStatusSchema = z.enum(['Todo', 'InProgress', 'Done']);
export const TaskPrioritySchema = z.enum(['Low', 'Medium', 'High']);

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: z.date().optional(),
  assigneeId: z.string().optional(),
  boardId: z.string(),
  columnId: z.string(),
  tags: z.array(z.string()).default([]),
  subtasks: z.array(z.string()).default([]), // References to subtask IDs
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SubtaskSchema = z.object({
  id: z.string(),
  parentTaskId: z.string(),
  title: z.string().min(1, 'Subtask title is required'),
  completed: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Board and Column Schemas
export const ColumnSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Column name is required'),
  position: z.number(),
  boardId: z.string(),
  taskIds: z.array(z.string()).default([]),
});

export const BoardSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Board name is required'),
  description: z.string().optional(),
  guildId: z.string(), // Discord server ID
  ownerId: z.string(), // Discord user ID
  memberIds: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(false),
  columns: z.array(ColumnSchema).default([
    { id: 'todo', name: 'To Do', position: 0, boardId: '', taskIds: [] },
    { id: 'inprogress', name: 'In Progress', position: 1, boardId: '', taskIds: [] },
    { id: 'done', name: 'Done', position: 2, boardId: '', taskIds: [] },
  ]),
  settings: z.object({
    autoArchiveDone: z.boolean().default(false),
    notificationsEnabled: z.boolean().default(true),
    allowComments: z.boolean().default(true),
    dueReminders: z.boolean().default(true),
  }).default(() => ({
    autoArchiveDone: false,
    notificationsEnabled: true,
    allowComments: true,
    dueReminders: true
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User and Permission Schemas
export const UserRoleSchema = z.enum(['Owner', 'Admin', 'Member', 'Viewer']);

export const UserSchema = z.object({
  id: z.string(), // Discord user ID
  username: z.string(),
  discriminator: z.string(),
  avatar: z.string().optional(),
  role: UserRoleSchema.default('Member'),
  permissions: z.object({
    canCreateBoards: z.boolean().default(true),
    canEditTasks: z.boolean().default(true),
    canDeleteTasks: z.boolean().default(false),
    canManageUsers: z.boolean().default(false),
  }).default(() => ({
    canCreateBoards: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canManageUsers: false
  })),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
    notifications: z.boolean().default(true),
    timezone: z.string().default('UTC'),
  }).default(() => ({
    theme: 'auto' as const,
    notifications: true,
    timezone: 'UTC'
  })),
});

// Discord Interaction Schemas
export const SlashCommandSchema = z.object({
  name: z.string(),
  description: z.string(),
  guildId: z.string().optional(),
  userId: z.string(),
  channelId: z.string(),
  options: z.record(z.string(), z.any()).default(() => ({})),
});

// API Response Schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
});

// Export TypeScript types
export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type Column = z.infer<typeof ColumnSchema>;
export type User = z.infer<typeof UserSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type SlashCommand = z.infer<typeof SlashCommandSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;

// Validation helpers
export const validateTask = (data: unknown) => TaskSchema.safeParse(data);
export const validateBoard = (data: unknown) => BoardSchema.safeParse(data);
export const validateUser = (data: unknown) => UserSchema.safeParse(data);
export const validateSubtask = (data: unknown) => SubtaskSchema.safeParse(data);