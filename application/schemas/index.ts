// Modern state management and validation schemas
import { z } from 'zod';

// Core Zod schemas for validation
export const TaskStatusSchema = z.enum(['Todo', 'InProgress', 'Done']);
export const TaskPrioritySchema = z.enum(['Low', 'Medium', 'High']);

export const TaskSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  dueDate: z.date().optional(),
  boardId: z.string().min(1),
  assignedTo: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const SubtaskSchema = z.object({
  id: z.string().min(1),
  parentTaskId: z.string().min(1),
  title: z.string().min(1).max(100),
  completed: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export const BoardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  ownerId: z.string().min(1),
  memberIds: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(false),
  columns: z.array(z.string()).default(['Todo', 'InProgress', 'Done']),
  createdAt: z.date().default(() => new Date()),
});

export const UserSchema = z.object({
  id: z.string().min(1),
  discordId: z.string().min(1),
  username: z.string().min(1),
  displayName: z.string().optional(),
  preferences: z.object({
    notifications: z.boolean().default(true),
    timezone: z.string().default('UTC'),
    theme: z.enum(['dark', 'light']).default('dark'),
  }).default({}),
});

// Type inference from schemas
export type Task = z.infer<typeof TaskSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type Board = z.infer<typeof BoardSchema>;
export type User = z.infer<typeof UserSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

// Validation helpers
export const validateTask = (data: unknown) => TaskSchema.parse(data);
export const validateSubtask = (data: unknown) => SubtaskSchema.parse(data);
export const validateBoard = (data: unknown) => BoardSchema.parse(data);
export const validateUser = (data: unknown) => UserSchema.parse(data);

// Partial schemas for updates
export const TaskUpdateSchema = TaskSchema.partial().required({ id: true });
export const BoardUpdateSchema = BoardSchema.partial().required({ id: true });