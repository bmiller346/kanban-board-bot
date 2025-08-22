// Application services - TaskService
import { Task, ITask } from '../models/task';

export class TaskService {
  private static tasks: Task[] = [];

  static async createTask(taskData: ITask): Promise<Task> {
    const newTask = new Task(taskData.name, taskData.status, taskData.priority, taskData.description, taskData.dueDate);
    this.tasks.push(newTask);
    return newTask;
  }

  static async getTasks(): Promise<Task[]> {
    return this.tasks;
  }

  static async getTaskById(id: string): Promise<Task | undefined> {
    return this.tasks.find(task => task.id === id);
  }

  static async updateTask(task: Task): Promise<void> {
    const index = this.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.tasks[index] = task;
    }
  }

  static async deleteTask(id: string): Promise<boolean> {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      return true;
    }
    return false;
  }
}