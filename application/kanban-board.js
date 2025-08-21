"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanBoard = void 0;
const task_1 = require("./models/task");
const lodash_1 = require("lodash");
class KanbanBoard {
    constructor(_backlog = new KanbanBoard.InnerColumn('Backlog'), _inProgress = new KanbanBoard.InnerColumn('In Progress'), _complete = new KanbanBoard.InnerColumn('Complete'), currentTaskId = 0) {
        this._backlog = _backlog;
        this._inProgress = _inProgress;
        this._complete = _complete;
        this.currentTaskId = currentTaskId;
    }
    /**
     * Getters
     */
    get backlog() {
        return this._backlog;
    }
    get inProgress() {
        return this._inProgress;
    }
    get complete() {
        return this._complete;
    }
    /**
     * Adders
     * @param task to add
     */
    addToBacklog(task) {
        this._backlog.add(Object.assign(new task_1.Task(''), task, { taskId: ++this.currentTaskId }));
    }
    addToInProgress(task) {
        this._inProgress.add(task);
    }
    addToComplete(task) {
        this._complete.add(task);
    }
    /**
     * Removers
     * @param task to remove.
     * Equality is determined by comparing name and author.
     */
    removeFromBacklog(task) {
        this._backlog.remove(task);
    }
    removeFromInProgress(task) {
        this._inProgress.remove(task);
    }
    removeFromComplete(task) {
        this._complete.remove(task);
    }
    remove(task) {
        this.removeFromBacklog(task);
        this.removeFromInProgress(task);
        this.removeFromComplete(task);
    }
    clearBoard() {
        this._backlog.clear();
        this._inProgress.clear();
        this._complete.clear();
    }
    getColumns() {
        return [this._backlog, this._inProgress, this._complete];
    }
    getAllTasks() {
        return [...this._backlog.getTasks(), ...this._inProgress.getTasks(), ...this._complete.getTasks()];
    }
    containsTask(taskOrTaskName) {
        try {
            const task = task_1.Task.getTaskFromProperties(taskOrTaskName);
            const columns = [...this.getColumns().values()];
            return columns.some((column) => column.contains(task));
        }
        catch (error) {
            // unable to determine task, so return false
            return false;
        }
    }
    findMatch(taskOrTaskName) {
        try {
            const task = task_1.Task.getTaskFromProperties(taskOrTaskName);
            const match = this.getAllTasks().find((item) => item.matches(task));
            if (!!match) {
                return Promise.resolve(match);
            }
            return Promise.reject(new Error('No match found'));
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    checkColumnsForMatchingEntry(taskOrTaskName) {
        const task = task_1.Task.getTaskFromProperties(taskOrTaskName);
        this.getColumns().forEach((column) => {
            if (column.contains(task)) {
                return column.getName();
            }
        });
        return 'None';
    }
}
exports.KanbanBoard = KanbanBoard;
KanbanBoard.InnerColumn = class {
    constructor(name, tasks = []) {
        this._name = name;
        this._tasks = tasks;
    }
    getName() {
        return this._name;
    }
    getTasks() {
        return this._tasks;
    }
    add(task) {
        this._tasks.push(task);
        console.log(this._tasks);
    }
    remove(task) {
        (0, lodash_1.remove)(this._tasks, task);
    }
    clear() {
        this._tasks = [];
    }
    contains(task) {
        return !!this.findMatch(task);
    }
    findMatch(task) {
        return this._tasks.find((item) => item.matches(task));
    }
};
// const board = new KanbanBoard();
// board.addToBacklog(new Task('a'));
// board.addToBacklog({ name: 'a' } as Task);
// board.findMatch('a').then(value => console.log(value)).catch(() => console.log('fuck'));
