// Application services - UserBoardsService
export interface IBoard {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  isPrivate: boolean;
}

export class Board implements IBoard {
  constructor(
    public id: string,
    public name: string,
    public ownerId: string,
    public memberIds: string[] = [],
    public isPrivate: boolean = false,
    public description?: string
  ) {}
}

export class UserBoardsService {
  private static boards: Board[] = [];

  static async createBoard(name: string, ownerId: string, description?: string, isPrivate: boolean = false): Promise<Board> {
    const board = new Board(
      Date.now().toString(), // Simple ID generation
      name,
      ownerId,
      [ownerId], // Owner is automatically a member
      isPrivate,
      description
    );
    this.boards.push(board);
    return board;
  }

  static async getBoardsForUser(userId: string): Promise<Board[]> {
    return this.boards.filter(board => 
      board.ownerId === userId || board.memberIds.includes(userId)
    );
  }

  static async getBoardById(id: string): Promise<Board | undefined> {
    return this.boards.find(board => board.id === id);
  }

  static async addMemberToBoard(boardId: string, userId: string): Promise<boolean> {
    const board = this.boards.find(b => b.id === boardId);
    if (board && !board.memberIds.includes(userId)) {
      board.memberIds.push(userId);
      return true;
    }
    return false;
  }

  static async removeMemberFromBoard(boardId: string, userId: string): Promise<boolean> {
    const board = this.boards.find(b => b.id === boardId);
    if (board) {
      const index = board.memberIds.indexOf(userId);
      if (index !== -1) {
        board.memberIds.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  static async deleteBoard(id: string): Promise<boolean> {
    const index = this.boards.findIndex(board => board.id === id);
    if (index !== -1) {
      this.boards.splice(index, 1);
      return true;
    }
    return false;
  }
}