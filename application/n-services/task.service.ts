import { Task, ITask } from '../models/task';
import * as cron from 'node-cron';
import { Client, TextChannel, EmbedBuilder } from 'discord.js';

// Placeholder for database service
interface DatabaseService {
  saveTask(task: Task): Promise<void>;
  getTasks(): Promise<Task[]>;
  updateTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
}

export class TaskService {
  private static client: Client;
  private static databaseService: DatabaseService;

  /**
   * Creates a new task and schedules a reminder if it has a due date.
   */
  public static async createTask(taskDetails: ITask): Promise<Task> {
    try {
      const newTask = new Task(taskDetails.name, taskDetails.status, taskDetails.priority, taskDetails.description, taskDetails.dueDate);
      
      if (this.databaseService) {
        await this.databaseService.saveTask(newTask);
      }

      if (newTask.dueDate) {
        this.scheduleReminder(newTask);
      }

      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw new Error("Error creating task.");
    }
  }

  /**
   * Schedules a reminder for the task if it has a due date.
   */
  private static scheduleReminder(task: Task): void {
    if (!task.dueDate) return;

    // Schedule a cron job to send a reminder at 9:00 AM on the due date
    cron.schedule(`0 9 ${task.dueDate.getDate()} ${task.dueDate.getMonth() + 1} *`, async () => {
      try {
        const reminderChannel = this.client.channels.cache.get('CHANNEL_ID') as TextChannel;
        if (!reminderChannel) {
          console.error("Reminder channel not found.");
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('Reminder: Task Due Today')
          .setDescription(`Task: ${task.name}\nDescription: ${task.description || 'No description'}`)
          .addFields({ name: 'Due Date', value: task.dueDate?.toDateString() || 'No due date', inline: true })
          .setColor('#3498db');

        await reminderChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error("Failed to send reminder:", error);
      }
    });
  }

  /**
   * Initializes the service with a Discord client instance.
   */
  public static initialize(client: Client, databaseService?: DatabaseService): void {
    this.client = client;
    if (databaseService) {
      this.databaseService = databaseService;
    }
  }

  /**
   * Gets all tasks
   */
  public static async getTasks(): Promise<Task[]> {
    try {
      if (this.databaseService) {
        return await this.databaseService.getTasks();
      }
      return [];
    } catch (error) {
      console.error("Failed to get tasks:", error);
      return [];
    }
  }

  /**
   * Updates a task
   */
  public static async updateTask(task: Task): Promise<void> {
    try {
      if (this.databaseService) {
        await this.databaseService.updateTask(task);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      throw new Error("Error updating task.");
    }
  }

  /**
   * Deletes a task
   */
  public static async deleteTask(taskId: string): Promise<void> {
    try {
      if (this.databaseService) {
        await this.databaseService.deleteTask(taskId);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw new Error("Error deleting task.");
    }
  }
}
