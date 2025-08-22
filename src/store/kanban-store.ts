// Modern Zustand store for the Kanban Bot
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { Board, Task, User, Subtask, Column } from '../schemas';

// Store State Interface
interface KanbanBotState {
  // Core Data
  boards: Map<string, Board>;
  tasks: Map<string, Task>;
  users: Map<string, User>;
  subtasks: Map<string, Subtask>;
  
  // UI State
  selectedBoard: string | null;
  activeGuild: string | null;
  loading: boolean;
  error: string | null;
  
  // Actions - Boards
  addBoard: (board: Board) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  getBoardsByGuild: (guildId: string) => Board[];
  getBoardsByUser: (userId: string) => Board[];
  setSelectedBoard: (boardId: string | null) => void;
  
  // Actions - Tasks
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, newColumnId: string, newPosition?: number) => void;
  deleteTask: (taskId: string) => void;
  getTasksByBoard: (boardId: string) => Task[];
  getTasksByColumn: (boardId: string, columnId: string) => Task[];
  getTasksByUser: (userId: string) => Task[];
  
  // Actions - Subtasks
  addSubtask: (subtask: Subtask) => void;
  updateSubtask: (subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (subtaskId: string) => void;
  getSubtasksByTask: (taskId: string) => Subtask[];
  toggleSubtask: (subtaskId: string) => void;
  
  // Actions - Users
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
  getUsersByBoard: (boardId: string) => User[];
  
  // Actions - Board Management
  addMemberToBoard: (boardId: string, userId: string) => void;
  removeMemberFromBoard: (boardId: string, userId: string) => void;
  updateBoardColumn: (boardId: string, columnId: string, updates: Partial<Column>) => void;
  addColumnToBoard: (boardId: string, column: Column) => void;
  deleteColumnFromBoard: (boardId: string, columnId: string) => void;
  reorderColumns: (boardId: string, columnIds: string[]) => void;
  
  // Actions - Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveGuild: (guildId: string | null) => void;
  clearAll: () => void;
  
  // Analytics/Stats
  getStats: () => {
    totalBoards: number;
    totalTasks: number;
    totalUsers: number;
    tasksByStatus: Record<string, number>;
    tasksByPriority: Record<string, number>;
  };
}

// Create the Zustand store with middleware
export const useKanbanStore = createStore<KanbanBotState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial State
        boards: new Map(),
        tasks: new Map(),
        users: new Map(),
        subtasks: new Map(),
        selectedBoard: null,
        activeGuild: null,
        loading: false,
        error: null,
        
        // Board Actions
        addBoard: (board) => set((state) => {
          state.boards.set(board.id, board);
        }),
        
        updateBoard: (boardId, updates) => set((state) => {
          const board = state.boards.get(boardId);
          if (board) {
            state.boards.set(boardId, { ...board, ...updates, updatedAt: new Date() });
          }
        }),
        
        deleteBoard: (boardId) => set((state) => {
          state.boards.delete(boardId);
          // Clean up related tasks
          for (const [taskId, task] of state.tasks) {
            if (task.boardId === boardId) {
              state.tasks.delete(taskId);
            }
          }
          if (state.selectedBoard === boardId) {
            state.selectedBoard = null;
          }
        }),
        
        getBoardsByGuild: (guildId) => {
          const { boards } = get();
          return Array.from(boards.values()).filter(board => board.guildId === guildId);
        },
        
        getBoardsByUser: (userId) => {
          const { boards } = get();
          return Array.from(boards.values()).filter(board => 
            board.ownerId === userId || board.memberIds.includes(userId)
          );
        },
        
        setSelectedBoard: (boardId) => set((state) => {
          state.selectedBoard = boardId;
        }),
        
        // Task Actions
        addTask: (task) => set((state) => {
          state.tasks.set(task.id, task);
          // Add task to board column
          const board = state.boards.get(task.boardId);
          if (board) {
            const column = board.columns.find(c => c.id === task.columnId);
            if (column && !column.taskIds.includes(task.id)) {
              column.taskIds.push(task.id);
            }
          }
        }),
        
        updateTask: (taskId, updates) => set((state) => {
          const task = state.tasks.get(taskId);
          if (task) {
            state.tasks.set(taskId, { ...task, ...updates, updatedAt: new Date() });
          }
        }),
        
        moveTask: (taskId, newColumnId, newPosition) => set((state) => {
          const task = state.tasks.get(taskId);
          if (!task) return;
          
          const board = state.boards.get(task.boardId);
          if (!board) return;
          
          // Remove from old column
          const oldColumn = board.columns.find(c => c.id === task.columnId);
          if (oldColumn) {
            oldColumn.taskIds = oldColumn.taskIds.filter(id => id !== taskId);
          }
          
          // Add to new column
          const newColumn = board.columns.find(c => c.id === newColumnId);
          if (newColumn) {
            if (newPosition !== undefined) {
              newColumn.taskIds.splice(newPosition, 0, taskId);
            } else {
              newColumn.taskIds.push(taskId);
            }
          }
          
          // Update task
          task.columnId = newColumnId;
          task.updatedAt = new Date();
        }),
        
        deleteTask: (taskId) => set((state) => {
          const task = state.tasks.get(taskId);
          if (task) {
            // Remove from board column
            const board = state.boards.get(task.boardId);
            if (board) {
              const column = board.columns.find(c => c.id === task.columnId);
              if (column) {
                column.taskIds = column.taskIds.filter(id => id !== taskId);
              }
            }
            state.tasks.delete(taskId);
            
            // Clean up subtasks
            for (const [subtaskId, subtask] of state.subtasks) {
              if (subtask.parentTaskId === taskId) {
                state.subtasks.delete(subtaskId);
              }
            }
          }
        }),
        
        getTasksByBoard: (boardId) => {
          const { tasks } = get();
          return Array.from(tasks.values()).filter(task => task.boardId === boardId);
        },
        
        getTasksByColumn: (boardId, columnId) => {
          const { tasks, boards } = get();
          const board = boards.get(boardId);
          if (!board) return [];
          
          const column = board.columns.find(c => c.id === columnId);
          if (!column) return [];
          
          return column.taskIds
            .map(taskId => tasks.get(taskId))
            .filter(Boolean) as Task[];
        },
        
        getTasksByUser: (userId) => {
          const { tasks } = get();
          return Array.from(tasks.values()).filter(task => task.assigneeId === userId);
        },
        
        // Subtask Actions
        addSubtask: (subtask) => set((state) => {
          state.subtasks.set(subtask.id, subtask);
          // Add to parent task
          const parentTask = state.tasks.get(subtask.parentTaskId);
          if (parentTask && !parentTask.subtasks.includes(subtask.id)) {
            parentTask.subtasks.push(subtask.id);
          }
        }),
        
        updateSubtask: (subtaskId, updates) => set((state) => {
          const subtask = state.subtasks.get(subtaskId);
          if (subtask) {
            state.subtasks.set(subtaskId, { ...subtask, ...updates, updatedAt: new Date() });
          }
        }),
        
        deleteSubtask: (subtaskId) => set((state) => {
          const subtask = state.subtasks.get(subtaskId);
          if (subtask) {
            // Remove from parent task
            const parentTask = state.tasks.get(subtask.parentTaskId);
            if (parentTask) {
              parentTask.subtasks = parentTask.subtasks.filter(id => id !== subtaskId);
            }
            state.subtasks.delete(subtaskId);
          }
        }),
        
        getSubtasksByTask: (taskId) => {
          const { subtasks } = get();
          return Array.from(subtasks.values()).filter(subtask => subtask.parentTaskId === taskId);
        },
        
        toggleSubtask: (subtaskId) => set((state) => {
          const subtask = state.subtasks.get(subtaskId);
          if (subtask) {
            subtask.completed = !subtask.completed;
            subtask.updatedAt = new Date();
          }
        }),
        
        // User Actions
        addUser: (user) => set((state) => {
          state.users.set(user.id, user);
        }),
        
        updateUser: (userId, updates) => set((state) => {
          const user = state.users.get(userId);
          if (user) {
            state.users.set(userId, { ...user, ...updates });
          }
        }),
        
        removeUser: (userId) => set((state) => {
          state.users.delete(userId);
        }),
        
        getUsersByBoard: (boardId) => {
          const { users, boards } = get();
          const board = boards.get(boardId);
          if (!board) return [];
          
          const memberIds = [board.ownerId, ...board.memberIds];
          return memberIds
            .map(userId => users.get(userId))
            .filter(Boolean) as User[];
        },
        
        // Board Management Actions
        addMemberToBoard: (boardId, userId) => set((state) => {
          const board = state.boards.get(boardId);
          if (board && !board.memberIds.includes(userId)) {
            board.memberIds.push(userId);
            board.updatedAt = new Date();
          }
        }),
        
        removeMemberFromBoard: (boardId, userId) => set((state) => {
          const board = state.boards.get(boardId);
          if (board) {
            board.memberIds = board.memberIds.filter(id => id !== userId);
            board.updatedAt = new Date();
          }
        }),
        
        updateBoardColumn: (boardId, columnId, updates) => set((state) => {
          const board = state.boards.get(boardId);
          if (board) {
            const column = board.columns.find(c => c.id === columnId);
            if (column) {
              Object.assign(column, updates);
              board.updatedAt = new Date();
            }
          }
        }),
        
        addColumnToBoard: (boardId, column) => set((state) => {
          const board = state.boards.get(boardId);
          if (board) {
            column.boardId = boardId;
            board.columns.push(column);
            board.updatedAt = new Date();
          }
        }),
        
        deleteColumnFromBoard: (boardId, columnId) => set((state) => {
          const board = state.boards.get(boardId);
          if (board) {
            // Move tasks from deleted column to first column
            const deletedColumn = board.columns.find(c => c.id === columnId);
            if (deletedColumn && deletedColumn.taskIds.length > 0) {
              const firstColumn = board.columns[0];
              if (firstColumn && firstColumn.id !== columnId) {
                firstColumn.taskIds.push(...deletedColumn.taskIds);
                // Update tasks
                for (const taskId of deletedColumn.taskIds) {
                  const task = state.tasks.get(taskId);
                  if (task) {
                    task.columnId = firstColumn.id;
                  }
                }
              }
            }
            
            board.columns = board.columns.filter(c => c.id !== columnId);
            board.updatedAt = new Date();
          }
        }),
        
        reorderColumns: (boardId, columnIds) => set((state) => {
          const board = state.boards.get(boardId);
          if (board) {
            const reorderedColumns = columnIds.map(id => 
              board.columns.find(c => c.id === id)
            ).filter(Boolean) as Column[];
            
            board.columns = reorderedColumns;
            board.updatedAt = new Date();
          }
        }),
        
        // Utility Actions
        setLoading: (loading) => set((state) => {
          state.loading = loading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        setActiveGuild: (guildId) => set((state) => {
          state.activeGuild = guildId;
        }),
        
        clearAll: () => set((state) => {
          state.boards.clear();
          state.tasks.clear();
          state.users.clear();
          state.subtasks.clear();
          state.selectedBoard = null;
          state.activeGuild = null;
          state.loading = false;
          state.error = null;
        }),
        
        // Analytics
        getStats: () => {
          const { boards, tasks, users } = get();
          const tasksArray = Array.from(tasks.values());
          
          const tasksByStatus = tasksArray.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const tasksByPriority = tasksArray.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          return {
            totalBoards: boards.size,
            totalTasks: tasks.size,
            totalUsers: users.size,
            tasksByStatus,
            tasksByPriority,
          };
        },
      })),
      {
        name: 'kanban-bot-store',
        // Only persist essential data
        partialize: (state) => ({
          boards: Array.from(state.boards.entries()),
          tasks: Array.from(state.tasks.entries()),
          users: Array.from(state.users.entries()),
          subtasks: Array.from(state.subtasks.entries()),
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Convert arrays back to Maps
            state.boards = new Map(state.boards as any);
            state.tasks = new Map(state.tasks as any);
            state.users = new Map(state.users as any);
            state.subtasks = new Map(state.subtasks as any);
          }
        },
      }
    )
  )
);

// Export store type for TypeScript
export type KanbanStore = typeof useKanbanStore;