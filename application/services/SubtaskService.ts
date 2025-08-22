// Application services - SubtaskService
export interface ISubtask {
  id: string;
  parentTaskId: string;
  title: string;
  completed: boolean;
}

export class Subtask implements ISubtask {
  constructor(
    public id: string,
    public parentTaskId: string,
    public title: string,
    public completed: boolean = false
  ) {}
}

export class SubtaskService {
  private static subtasks: Subtask[] = [];

  static async createSubtask(parentTaskId: string, subtaskDetails: { title: string }): Promise<Subtask> {
    const subtask = new Subtask(
      Date.now().toString(), // Simple ID generation
      parentTaskId,
      subtaskDetails.title
    );
    this.subtasks.push(subtask);
    return subtask;
  }

  static async getSubtasksByParentId(parentTaskId: string): Promise<Subtask[]> {
    return this.subtasks.filter(subtask => subtask.parentTaskId === parentTaskId);
  }

  static async updateSubtask(subtask: Subtask): Promise<void> {
    const index = this.subtasks.findIndex(s => s.id === subtask.id);
    if (index !== -1) {
      this.subtasks[index] = subtask;
    }
  }

  static async deleteSubtask(id: string): Promise<boolean> {
    const index = this.subtasks.findIndex(subtask => subtask.id === id);
    if (index !== -1) {
      this.subtasks.splice(index, 1);
      return true;
    }
    return false;
  }
}