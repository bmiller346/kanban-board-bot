import { isEqual } from 'lodash';

export enum Status {
    BACKLOG = 'backlog',
    IN_PROGRESS = 'in progress',
    COMPLETE = 'complete'
}

export class Task {
    private _status?: Status;
    private _assignee?: string;

    constructor(public readonly name: string, public readonly creator?: string, status?: Status, public readonly taskId?: number, assignee?: string) {
        this._status = status;
        this._assignee = assignee;
    }

    get status(): Status | undefined {
        return this._status;
    }

    set status(newStatus: Status) {
        this._status = newStatus;
    }

    get assignee(): string | undefined {
        return this._assignee;
    }

    set assignee(newAssignee: string) {
        this._assignee = newAssignee;
    }

    static getTaskFromProperties(taskOrTaskName: Task | string): Task {
        if (taskOrTaskName instanceof Task) {
            return taskOrTaskName;
        }
        return new Task(taskOrTaskName);
    }

    matches(other: Task): boolean {
        if (typeof this.taskId === 'number' && typeof other.taskId === 'number') {
            return this.taskId === other.taskId;
        }
        return this.name === other.name;
    }

    equals(other: Task): boolean {
        return isEqual(this, other);
    }

    toString(): string {
        return `[id: ${this.taskId}, name: "${this.name}", assignee: ${this.assignee}] created by ${this.creator}`;
    }
}