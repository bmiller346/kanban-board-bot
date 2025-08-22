// src/models/tag.model.ts
import { v4 as uuidv4 } from 'uuid';

export interface ITag {
  id: string;
  name: string;
  description?: string;
}

export class Tag implements ITag {
  id: string;
  name: string;
  description?: string;

  constructor(id: string, name: string, description?: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }
}

export class TagService {
  private static tags: Tag[] = [];

  public static addTag(name: string, description?: string): Tag {
    const tag = new Tag(uuidv4(), name, description);
    this.tags.push(tag);
    return tag;
  }

  public static editTag(id: string, name: string, description?: string): Tag | undefined {
    const tagIndex = this.tags.findIndex(tag => tag.id === id);
    if (tagIndex === -1) return undefined;

    const tag = this.tags[tagIndex];
    tag.name = name;
    if (description) tag.description = description;
    this.tags[tagIndex] = tag;

    return tag;
  }

  public static listTags(): Tag[] {
    return this.tags;
  }

  public static deleteTag(id: string): boolean {
    const tagIndex = this.tags.findIndex(tag => tag.id === id);
    if (tagIndex === -1) return false;

    this.tags.splice(tagIndex, 1);
    return true;
  }

  public static findTagById(id: string): Tag | undefined {
    return this.tags.find(tag => tag.id === id);
  }

  public static findTagsByName(name: string): Tag[] {
    return this.tags.filter(tag => tag.name === name);
  }
}
