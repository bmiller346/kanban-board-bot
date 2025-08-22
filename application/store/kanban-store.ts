// Zustand store for centralized state management
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Task, Board, Subtask, User } from '../schemas';

interface KanbanState {
  // State
  tasks: Map<string, Task>;
  boards: Map<string, Board>;
  subtasks: Map<string, Subtask>;
  users: Map<string, User>;
  activeBoard: string | null;
  
  // Task actions
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: Task['status']) => void;
  assignTask: (taskId: string, userId: string) => void;
  unassignTask: (taskId: string, userId: string) => void;
  
  // Board actions
  createBoard: (board: Omit<Board, 'id' | 'createdAt'>) => Board;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  setActiveBoard: (boardId: string | null) => void;
  addMemberToBoard: (boardId: string, userId: string) => void;
  removeMemberFromBoard: (boardId: string, userId: string) => void;
  
  // Subtask actions
  createSubtask: (subtask: Omit<Subtask, 'id' | 'createdAt'>) => Subtask;
  updateSubtask: (id: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (id: string) => void;
  toggleSubtask: (id: string) => void;
  
  // User actions
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  
  // Computed getters
  getTasksByBoard: (boardId: string) => Task[];
  getTasksByStatus: (boardId: string, status: Task['status']) => Task[];
  getSubtasksByTask: (taskId: string) => Subtask[];
  getUserBoards: (userId: string) => Board[];
}

const generateId = () => Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

export const useKanbanStore = create<KanbanState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        tasks: new Map(),
        boards: new Map(),
        subtasks: new Map(),
        users: new Map(),
        activeBoard: null,

        // Task actions
        createTask: (taskData) => {
          const task: Task = {
            ...taskData,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          set((state) => {
            state.tasks.set(task.id, task);
          });
          
          return task;
        },

        updateTask: (id, updates) => {
          set((state) => {
            const task = state.tasks.get(id);
            if (task) {
              state.tasks.set(id, {
                ...task,
                ...updates,
                updatedAt: new Date(),
              });
            }
          });
        },

        deleteTask: (id) => {
          set((state) => {
            state.tasks.delete(id);
            // Also delete associated subtasks
            for (const [subtaskId, subtask] of state.subtasks) {
              if (subtask.parentTaskId === id) {
                state.subtasks.delete(subtaskId);
              }
            }
          });
        },

        moveTask: (taskId, newStatus) => {
          set((state) => {
            const task = state.tasks.get(taskId);
            if (task) {
              state.tasks.set(taskId, {
                ...task,
                status: newStatus,
                updatedAt: new Date(),
              });
            }
          });
        },

        assignTask: (taskId, userId) => {
          set((state) => {
            const task = state.tasks.get(taskId);
            if (task && !task.assignedTo.includes(userId)) {
              state.tasks.set(taskId, {
                ...task,
                assignedTo: [...task.assignedTo, userId],
                updatedAt: new Date(),
              });
            }
          });
        },

        unassignTask: (taskId, userId) => {
          set((state) => {
            const task = state.tasks.get(taskId);
            if (task) {
              state.tasks.set(taskId, {
                ...task,
                assignedTo: task.assignedTo.filter(id => id !== userId),
                updatedAt: new Date(),
              });
            }
          });
        },

        // Board actions
        createBoard: (boardData) => {
          const board: Board = {
            ...boardData,
            id: generateId(),
            createdAt: new Date(),
          };
          
          set((state) => {
            state.boards.set(board.id, board);
          });
          
          return board;
        },

        updateBoard: (id, updates) => {
          set((state) => {
            const board = state.boards.get(id);
            if (board) {
              state.boards.set(id, { ...board, ...updates });
            }
          });
        },

        deleteBoard: (id) => {
          set((state) => {
            state.boards.delete(id);
            // Delete all tasks in this board
            for (const [taskId, task] of state.tasks) {
              if (task.boardId === id) {
                state.tasks.delete(taskId);
              }
            }
            // Reset active board if it was deleted
            if (state.activeBoard === id) {
              state.activeBoard = null;
            }
          });
        },

        setActiveBoard: (boardId) => {
          set((state) => {
            state.activeBoard = boardId;
          });
        },

        addMemberToBoard: (boardId, userId) => {
          set((state) => {
            const board = state.boards.get(boardId);
            if (board && !board.memberIds.includes(userId)) {
              state.boards.set(boardId, {
                ...board,
                memberIds: [...board.memberIds, userId],
              });
            }
          });
        },

        removeMemberFromBoard: (boardId, userId) => {
          set((state) => {
            const board = state.boards.get(boardId);
            if (board) {
              state.boards.set(boardId, {
                ...board,
                memberIds: board.memberIds.filter(id => id !== userId),
              });
            }
          });
        },

        // Subtask actions
        createSubtask: (subtaskData) => {
          const subtask: Subtask = {
            ...subtaskData,
            id: generateId(),
            createdAt: new Date(),
          };
          
          set((state) => {
            state.subtasks.set(subtask.id, subtask);
          });
          
          return subtask;
        },

        updateSubtask: (id, updates) => {
          set((state) => {
            const subtask = state.subtasks.get(id);
            if (subtask) {
              state.subtasks.set(id, { ...subtask, ...updates });
            }
          });
        },

        deleteSubtask: (id) => {
          set((state) => {
            state.subtasks.delete(id);
          });
        },

        toggleSubtask: (id) => {
          set((state) => {
            const subtask = state.subtasks.get(id);
            if (subtask) {
              state.subtasks.set(id, {
                ...subtask,
                completed: !subtask.completed,
              });
            }
          });
        },

        // User actions
        addUser: (user) => {
          set((state) => {
            state.users.set(user.id, user);
          });
        },

        updateUser: (id, updates) => {
          set((state) => {
            const user = state.users.get(id);
            if (user) {
              state.users.set(id, { ...user, ...updates });
            }
          });
        },

        // Computed getters
        getTasksByBoard: (boardId) => {
          const { tasks } = get();
          return Array.from(tasks.values()).filter(task => task.boardId === boardId);
        },

        getTasksByStatus: (boardId, status) => {
          const { tasks } = get();
          return Array.from(tasks.values()).filter(
            task => task.boardId === boardId && task.status === status
          );
        },

        getSubtasksByTask: (taskId) => {
          const { subtasks } = get();
          return Array.from(subtasks.values()).filter(
            subtask => subtask.parentTaskId === taskId
          );
        },

        getUserBoards: (userId) => {
          const { boards } = get();
          return Array.from(boards.values()).filter(
            board => board.ownerId === userId || board.memberIds.includes(userId)
          );
        },
      })),
      {
        name: 'kanban-store',
        // Only persist essential data
        partialize: (state) => ({
          tasks: state.tasks,
          boards: state.boards,
          subtasks: state.subtasks,
          users: state.users,
          activeBoard: state.activeBoard,
        }),
      }
    ),
    { name: 'kanban-store' }
  )
);