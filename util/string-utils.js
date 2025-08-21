"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringUtils = void 0;
const lodash_1 = require("lodash");
class StringUtils {
    /**
     * Not ideal, but couldn't find a better alternative
     */
    static areEqualIgnoringCase(first, second) {
        const lowerDeburredFirst = (0, lodash_1.toLower)((0, lodash_1.deburr)(first));
        const lowerDeburredSecond = (0, lodash_1.toLower)((0, lodash_1.deburr)(second));
        return lowerDeburredFirst.localeCompare(lowerDeburredSecond) === 0;
    }
}
exports.StringUtils = StringUtils;
