// js/models.js

/**
 * 客人数据模型
 * @typedef {Object} Guest
 * @property {string} id - 唯一标识
 * @property {string} name - 姓名
 * @property {number[]} amounts - 可接受档位 [5], [5,10], [10,20] 等
 * @property {boolean|string} smokeTolerance - 是否接受抽烟 (true=接受, false=不接受, 'any'=无所谓)
 * @property {string[]} excludeGuestIds - 不能同桌的客人ID列表
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 */

/**
 * 桌子数据模型
 * @typedef {Object} Table
 * @property {number} id - 桌号
 * @property {Guest[]} guests - 当前落座客人
 * @property {number|null} amount - 当前桌统一档位
 */

/**
 * 应用状态
 * @typedef {Object} AppState
 * @property {number} tableCount - 桌子数量
 * @property {Table[]} tables - 桌子列表
 * @property {Guest[]} guests - 已存储客人列表
 */

// 常量定义
const AMOUNTS = [5, 10, 20];
const MAX_GUESTS_PER_TABLE = 4;
