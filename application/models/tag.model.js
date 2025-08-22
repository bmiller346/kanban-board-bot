"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagService = exports.Tag = void 0;
class Tag {
    id;
    name;
    description;
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
exports.Tag = Tag;
// src/services/tag.service.ts
const tag_model_1 = require("../models/tag.model");
const uuid_1 = require("uuid");
class TagService {
    static tags = [];
    static addTag(name, description) {
        const tag = new tag_model_1.Tag((0, uuid_1.v4)(), name, description);
        this.tags.push(tag);
        return tag;
    }
    static editTag(id, name, description) {
        const tagIndex = this.tags.findIndex(tag => tag.id === id);
        if (tagIndex === -1)
            return undefined;
        const tag = this.tags[tagIndex];
        tag.name = name;
        if (description)
            tag.description = description;
        this.tags[tagIndex] = tag;
        return tag;
    }
    static listTags() {
        return this.tags;
    }
    static deleteTag(id) {
        const tagIndex = this.tags.findIndex(tag => tag.id === id);
        if (tagIndex === -1)
            return false;
        this.tags.splice(tagIndex, 1);
        return true;
    }
    static findTagById(id) {
        return this.tags.find(tag => tag.id === id);
    }
    static findTagsByName(name) {
        return this.tags.filter(tag => tag.name === name);
    }
}
exports.TagService = TagService;
