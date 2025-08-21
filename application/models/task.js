"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = exports.Status = void 0;
const lodash_1 = require("lodash");
var Status;
(function (Status) {
    Status["BACKLOG"] = "backlog";
    Status["IN_PROGRESS"] = "in progress";
    Status["COMPLETE"] = "complete";
})(Status || (exports.Status = Status = {}));
class Task {
    constructor(name, creator, status, taskId, assignee) {
        this.name = name;
        this.creator = creator;
        this.taskId = taskId;
        this._status = status;
        this._assignee = assignee;
    }
    set status(newStatus) {
        this._status = newStatus;
    }
    set assignee(newAssignee) {
        this._assignee = newAssignee;
    }
    static getTaskFromProperties(taskOrTaskName) {
        if (taskOrTaskName instanceof Task) {
            return taskOrTaskName;
        }
        return new Task(taskOrTaskName);
    }
    /**
     * Compare by name for now - in the future, enforce by id
     */
    matches(other) {
        return this.name === other.name;
    }
    equals(other) {
        return (0, lodash_1.isEqual)(this, other);
    }
    toString() {
        return `[id: ${this.taskId}, name: "${this.name}", assignee: ${this.assignee}] created by ${this.creator}`;
    }
}
exports.Task = Task;
