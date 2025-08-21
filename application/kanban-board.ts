import { Kanban } from './namespaces/kanban-board';
import { Task } from './models/task';

export class KanbanBoard {

    constructor(private _backlog = new KanbanBoard.InnerColumn('Backlog'),
        private _inProgress = new KanbanBoard.InnerColumn('In Progress'),
        private _complete = new KanbanBoard.InnerColumn('Complete'),
        private currentTaskId = 0) { }

    /**
     * Getters
     */
    public get backlog(): Kanban.Board.Column { return this._backlog; }
    public get inProgress(): Kanban.Board.Column { return this._inProgress; }
    public get complete(): Kanban.Board.Column { return this._complete; }

    /**
     * Adders
     * @param task to add
     */
    public addToBacklog(task: Task) {
		this._backlog.add(Object.assign(new Task(''), task, { taskId: ++this.currentTaskId }));
	}
    public addToInProgress(task: Task) {
        const taskToAdd = (typeof task.taskId === 'number') ? task : Object.assign(new Task(''), task, { taskId: ++this.currentTaskId });
        this._inProgress.add(taskToAdd);
    }
    public addToComplete(task: Task) {
        const taskToAdd = (typeof task.taskId === 'number') ? task : Object.assign(new Task(''), task, { taskId: ++this.currentTaskId });
        this._complete.add(taskToAdd);
    }

    /**
     * Removers
     * @param task to remove.
     * Equality is determined by comparing name and author.
     */
    public removeFromBacklog(task: Task): void { this._backlog.remove(task); }
    public removeFromInProgress(task: Task): void { this._inProgress.remove(task); }
    public removeFromComplete(task: Task): void { this._complete.remove(task); }

    public remove(task: Task): void {
		this.removeFromBacklog(task);
		this.removeFromInProgress(task);
		this.removeFromComplete(task);
    }

    public clearBoard() {
        this._backlog.clear();
        this._inProgress.clear();
        this._complete.clear();
    }

    private getColumns(): Kanban.Board.Column[] {
        return [this._backlog, this._inProgress, this._complete];
	}
	
	private getAllTasks(): Task[] {
		return [...this._backlog.getTasks(), ...this._inProgress.getTasks(), ...this._complete.getTasks()];
	}

    public containsTask(task: Task): boolean;
    public containsTask(taskName: string): boolean;
    public containsTask(taskOrTaskName: Task | string): boolean {
        try {
            const task: Task = Task.getTaskFromProperties(taskOrTaskName);
            const columns: Kanban.Board.Column[] = this.getColumns();
            return columns.some(column => column.contains(task));
        } catch (error) {
            return false;
        }
    }
	
	public async findMatch(task: Task): Promise<Task>;
	public async findMatch(taskName: string): Promise<Task>;
	public async findMatch(taskOrTaskName: Task | string): Promise<Task> {
		const task = Task.getTaskFromProperties(taskOrTaskName);
		const match: Task | undefined = this.getAllTasks().find(item => item.matches(task));
		if (match) return match;
		throw new Error('No match found');
	}

    // have to do it this way for method overloading
    public checkColumnsForMatchingEntry(task: Task): string;
    public checkColumnsForMatchingEntry(taskName: string): string;
    public checkColumnsForMatchingEntry(taskOrTaskName: Task | string): string {
        const task: Task = Task.getTaskFromProperties(taskOrTaskName);
        for (const column of this.getColumns()) {
            if (column.contains(task)) {
                return column.getName();
            }
        }
        return 'None';
    }

    static InnerColumn = class implements Kanban.Board.Column {

        private _name: string;
        private _tasks: Task[];

        constructor(name: string, tasks: Task[] = []) {
            this._name = name;
            this._tasks = tasks;
        }

        getName(): string { return this._name; }
        getTasks(): Task[] { return this._tasks; }

        add(task: Task): void {
            this._tasks.push(task);

            console.log(this._tasks);
        }

        remove(task: Task): void {
            if (typeof task.taskId === 'number') {
                this._tasks = this._tasks.filter(t => t.taskId !== task.taskId);
            } else {
                const index = this._tasks.findIndex(item => item.matches(task));
                if (index !== -1) this._tasks.splice(index, 1);
            }
        }

        clear(): void {
            this._tasks = [];
        }

        contains(task: Task): boolean {
            return !!this.findMatch(task);
		}
		
		findMatch(task: Task): Task | undefined {
			return this._tasks.find(item => item.matches(task));
		}
    };
};

// const board = new KanbanBoard();
// board.addToBacklog(new Task('a'));
// board.addToBacklog({ name: 'a' } as Task);
// board.findMatch('a').then(value => console.log(value)).catch(() => console.log('fuck'));