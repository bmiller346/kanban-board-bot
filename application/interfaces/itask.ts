// src/interfaces/itask.ts
export interface ITask {
  id?: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'Todo' | 'InProgress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  labels?: string[];
}