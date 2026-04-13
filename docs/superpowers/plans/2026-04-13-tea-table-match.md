# 茶馆组局系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 帮助茶馆妈妈快速为客人安排座位，自动检测金额、抽烟、社交约束冲突

**Architecture:** 单页Web应用，数据存储在localStorage，使用原生HTML/CSS/JS实现，保持最簡單的技術棲棧

**Tech Stack:** 原生HTML + CSS + JavaScript，localStorage持久化

---

## 文件结构

```
tea-table-match/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式
└── js/
    ├── app.js        # 主应用逻辑
    ├── store.js      # 数据存储抽象
    ├── models.js     # 数据模型定义
    └── utils.js      # 工具函数
```

---

## 任务概览

| 任务 | 描述 |
|------|------|
| Task 1 | 项目结构和基础HTML |
| Task 2 | 数据模型和存储抽象 |
| Task 3 | 首页桌子展示 |
| Task 4 | 添加客人页面和搜索 |
| Task 5 | 派桌逻辑和兼容性检测 |
| Task 6 | 智能迁移提示 |
| Task 7 | 重新派桌和取消落座 |
| Task 8 | 下班按钮和数据清空 |

---

### Task 1: 项目结构和基础HTML

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`
- Create: `js/store.js`
- Create: `js/models.js`
- Create: `js/utils.js`

- [ ] **Step 1: 创建目录结构和空文件**

```bash
mkdir -p tea-table-match/css tea-table-match/js
touch tea-table-match/index.html tea-table-match/css/style.css
touch tea-table-match/js/app.js tea-table-match/js/store.js
touch tea-table-match/js/models.js tea-table-match/js/utils.js
```

- [ ] **Step 2: 编写index.html基础结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>茶馆组局</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="app">
    <!-- 页面内容 -->
  </div>
  <script src="js/models.js"></script>
  <script src="js/store.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: 创建占位CSS**

```css
/* css/style.css */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  min-height: 100vh;
}

#app {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
```

- [ ] **Step 4: 创建占位JS文件**

```js
// js/models.js
// js/store.js
// js/utils.js
// js/app.js
// 占位文件，等待Task2填充
```

- [ ] **Step 5: 提交**

```bash
git add tea-table-match/
git commit -m "chore: 初始化项目结构"
```

---

### Task 2: 数据模型和存储抽象

**Files:**
- Modify: `js/models.js`
- Modify: `js/store.js`

- [ ] **Step 1: 编写数据模型定义**

```javascript
// js/models.js

/**
 * 客人数据模型
 * @typedef {Object} Guest
 * @property {string} id - 唯一标识
 * @property {string} name - 姓名
 * @property {number[]} amounts - 可接受档位 [5], [5,10], [10,20] 等
 * @property {boolean} smokeTolerance - 是否接受抽烟
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
```

- [ ] **Step 2: 编写存储抽象**

```javascript
// js/store.js

const STORE_KEY = 'tea_table_match_state';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getState() {
  const data = localStorage.getItem(STORE_KEY);
  if (data) {
    return JSON.parse(data);
  }
  return getDefaultState();
}

function getDefaultState() {
  return {
    tableCount: 10,
    tables: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      guests: [],
      amount: null
    })),
    guests: []
  };
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function clearAllSeats() {
  const state = getState();
  state.tables = state.tables.map(table => ({
    ...table,
    guests: [],
    amount: null
  }));
  saveState(state);
}

// Guest operations
function saveGuest(guest) {
  const state = getState();
  const existingIndex = state.guests.findIndex(g => g.id === guest.id);
  if (existingIndex >= 0) {
    state.guests[existingIndex] = { ...guest, updatedAt: Date.now() };
  } else {
    state.guests.push({ ...guest, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveState(state);
}

function searchGuests(keyword) {
  const state = getState();
  if (!keyword) return state.guests;
  const lower = keyword.toLowerCase();
  return state.guests.filter(g => g.name.toLowerCase().includes(lower));
}

function getGuestById(id) {
  const state = getState();
  return state.guests.find(g => g.id === id);
}
```

- [ ] **Step 3: 运行验证**

```bash
# 在浏览器控制台测试
console.log('Store loaded');
```

- [ ] **Step 4: 提交**

```bash
git add js/models.js js/store.js
git commit -m "feat: 添加数据模型和存储抽象"
```

---

### Task 3: 首页桌子展示

**Files:**
- Modify: `index.html`
- Modify: `css/style.css`
- Modify: `js/app.js`

- [ ] **Step 1: 更新index.html添加首页模板**

```html
<!-- 在 #app 内添加 -->
<div id="home-page">
  <div class="header">
    <h1>茶馆组局</h1>
    <button id="settings-btn" class="icon-btn">⚙️</button>
  </div>
  
  <div id="tables-container" class="tables-grid">
    <!-- 桌子卡片由JS生成 -->
  </div>
  
  <div class="bottom-actions">
    <button id="add-guest-btn" class="primary-btn">添加客人</button>
    <button id="end-day-btn" class="danger-btn">下班</button>
  </div>
</div>
```

- [ ] **Step 2: 编写CSS样式**

```css
/* css/style.css 添加 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 80px;
}

.table-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  transition: transform 0.2s;
}

.table-card:hover {
  transform: translateY(-2px);
}

.table-card.full {
  background: #e8f5e9;
  border: 2px solid #4caf50;
}

.table-card .table-number {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.table-card .guest-list {
  font-size: 13px;
  line-height: 1.6;
}

.table-card .guest-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-card .guest-name {
  font-weight: 500;
}

.table-card .guest-amount {
  font-size: 11px;
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
  color: #666;
}

.table-card .smoke-icon {
  font-size: 11px;
  margin-left: 4px;
}

.table-card .slots {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: right;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
}

.primary-btn {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.danger-btn {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.danger-btn:active {
  background: #ffebee;
  color: #c62828;
}
```

- [ ] **Step 3: 编写首页JS逻辑**

```javascript
// js/app.js

function renderHomePage() {
  const state = getState();
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="header">
      <h1>茶馆组局</h1>
      <button id="settings-btn" class="icon-btn">⚙️</button>
    </div>
    <div id="tables-container" class="tables-grid"></div>
    <div class="bottom-actions">
      <button id="add-guest-btn" class="primary-btn">添加客人</button>
      <button id="end-day-btn" class="danger-btn">下班</button>
    </div>
  `;
  
  renderTables(state.tables);
  bindHomeEvents();
}

function renderTables(tables) {
  const container = document.getElementById('tables-container');
  container.innerHTML = tables.map(table => {
    const isFull = table.guests.length >= MAX_GUESTS_PER_TABLE;
    return `
      <div class="table-card ${isFull ? 'full' : ''}" data-table-id="${table.id}">
        <div class="table-number">桌 ${table.id}</div>
        <div class="guest-list">
          ${table.guests.map(g => `
            <div class="guest-item" data-guest-id="${g.id}">
              <span class="guest-name">${g.name}</span>
              <span class="guest-amount">${g.amounts.join('/')}元${g.smokeTolerance ? '' : '🚭'}</span>
            </div>
          `).join('')}
        </div>
        <div class="slots">${table.guests.length}/${MAX_GUESTS_PER_TABLE}人</div>
      </div>
    `;
  }).join('');
  
  // 绑定桌子点击事件
  container.querySelectorAll('.table-card').forEach(card => {
    card.addEventListener('click', () => {
      // TODO: 点击桌子进入查看详情
    });
  });
  
  // 绑定客人点击事件
  container.querySelectorAll('.guest-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const guestId = item.dataset.guestId;
      showGuestActionsMenu(guestId);
    });
  });
}

function bindHomeEvents() {
  document.getElementById('add-guest-btn').addEventListener('click', () => {
    renderAddGuestPage();
  });
  
  document.getElementById('end-day-btn').addEventListener('click', () => {
    if (confirm('确定下班？将清空所有座位数据。')) {
      clearAllSeats();
      renderHomePage();
    }
  });
  
  document.getElementById('settings-btn').addEventListener('click', () => {
    // TODO: 设置页面
  });
}

// 客人操作菜单
function showGuestActionsMenu(guestId) {
  const guest = getGuestById(guestId);
  if (!guest) return;
  
  const action = prompt(`${guest.name} 的操作:\n1. 重新派桌\n2. 取消落座\n\n请输入序��:`);
  
  if (action === '1') {
    // TODO: 重新派桌
  } else if (action === '2') {
    removeGuestFromTable(guestId);
    renderHomePage();
  }
}

function removeGuestFromTable(guestId) {
  const state = getState();
  const table = state.tables.find(t => t.guests.some(g => g.id === guestId));
  if (table) {
    table.guests = table.guests.filter(g => g.id !== guestId);
    if (table.guests.length === 0) {
      table.amount = null;
    }
    saveState(state);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  renderHomePage();
});
```

- [ ] **Step 4: 运行验证**

- [ ] **Step 5: 提交**

```bash
git add index.html css/style.css js/app.js
git commit -feat: 实现首页桌子展示功能
```

---

### Task 4: 添加客人页面和搜索

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: 添加搜索功能**

```javascript
// js/app.js 添加

function renderAddGuestPage() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">← 返回</button>
        <h1>添加客人</h1>
      </div>
      
      <div class="form">
        <div class="form-group">
          <label>搜索客人</label>
          <input type="text" id="guest-search" placeholder="输入姓名搜索" autocomplete="off">
          <div id="search-results" class="search-results"></div>
        </div>
        
        <div class="form-group">
          <label>姓名 *</label>
          <input type="text" id="guest-name" placeholder="请输入姓名" required>
        </div>
        
        <div class="form-group">
          <label>茶费档位</label>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" name="amount" value="5">
              <span>5元</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" name="amount" value="10">
              <span>10元</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" name="amount" value="20">
              <span>20元</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>抽烟</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" name="smoke" value="true" checked>
              <span>接受</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="smoke" value="false">
              <span>不接受</span>
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label>不能同桌的客人</label>
          <div id="exclude-list" class="exclude-list">
            <div class="exclude-placeholder">请先搜索并选择需要排除的客人</div>
          </div>
        </div>
        
        <button id="auto-assign-btn" class="primary-btn" disabled>自动派桌</button>
      </div>
    </div>
  `;
  
  bindAddGuestEvents();
}

let currentGuest = null;
let selectedExcludes = new Set();

function bindAddGuestEvents() {
  const searchInput = document.getElementById('guest-search');
  const nameInput = document.getElementById('guest-name');
  const amountCheckboxes = document.querySelectorAll('input[name="amount"]');
  const smokeRadios = document.querySelectorAll('input[name="smoke"]');
  const autoAssignBtn = document.getElementById('auto-assign-btn');
  
  // 搜索输入
  searchInput.addEventListener('input', debounce(() => {
    const results = searchGuests(searchInput.value);
    renderSearchResults(results);
  }, 300));
  
  // 姓名输入变化启用按钮
  nameInput.addEventListener('input', validateForm);
  
  // 档位变化
  amountCheckboxes.forEach(cb => cb.addEventListener('change', validateForm));
  
  // 抽烟选项变化
  smokeRadios.forEach(r => r.addEventListener('change', validateForm));
  
  // 返回
  document.getElementById('back-btn').addEventListener('click', () => {
    renderHomePage();
  });
  
  // 自动派桌
  autoAssignBtn.addEventListener('click', () => {
    const guest = getFormData();
    renderAssignPage(guest);
  });
}

function renderSearchResults(results) {
  const container = document.getElementById('search-results');
  
  if (results.length === 0) {
    container.innerHTML = '<div class="search-empty">未找到匹配的客人，请直接输入姓名添加</div>';
    return;
  }
  
  container.innerHTML = results.map(g => `
    <div class="search-result-item" data-guest-id="${g.id}">
      <span class="guest-name">${g.name}</span>
      <span class="guest-info">${g.amounts.join('/')}元 ${g.smokeTolerance ? '可抽烟' : '不抽'}</span>
    </div>
  `).join('');
  
  container.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const guest = getGuestById(item.dataset.guestId);
      fillFormWithGuest(guest);
    });
  });
}

function fillFormWithGuest(guest) {
  currentGuest = guest;
  
  document.getElementById('guest-search').value = guest.name;
  document.getElementById('guest-name').value = guest.name;
  document.getElementById('search-results').innerHTML = '';
  
  // 设置档位
  document.querySelectorAll('input[name="amount"]').forEach(cb => {
    cb.checked = guest.amounts.includes(parseInt(cb.value));
  });
  
  // 设置抽烟
  document.querySelector(`input[name="smoke"][value="${guest.smokeTolerance}"]`).checked = true;
  
  // 设置排除
  selectedExcludes = new Set(guest.excludeGuestIds || []);
  renderExcludeList();
  
  validateForm();
}

function getFormData() {
  const name = document.getElementById('guest-name').value.trim();
  const amounts = Array.from(document.querySelectorAll('input[name="amount"]:checked'))
    .map(cb => parseInt(cb.value));
  const smokeTolerance = document.querySelector('input[name="smoke"]:checked').value === 'true';
  
  return {
    id: currentGuest?.id || generateId(),
    name,
    amounts,
    smokeTolerance,
    excludeGuestIds: Array.from(selectedExcludes)
  };
}

function validateForm() {
  const name = document.getElementById('guest-name').value.trim();
  const amounts = Array.from(document.querySelectorAll('input[name="amount"]:checked'));
  
  const autoAssignBtn = document.getElementById('auto-assign-btn');
  autoAssignBtn.disabled = !(name && amounts.length > 0);
  
  return name && amounts.length > 0;
}

function renderExcludeList() {
  const container = document.getElementById('exclude-list');
  const allGuests = getState().guests.filter(g => g.id !== currentGuest?.id);
  
  if (allGuests.length === 0) {
    container.innerHTML = '<div class="exclude-placeholder">暂无其他客人</div>';
    return;
  }
  
  container.innerHTML = allGuests.map(g => `
    <label class="exclude-item">
      <input type="checkbox" value="${g.id}" ${selectedExcludes.has(g.id) ? 'checked' : ''}>
      <span>${g.name}</span>
    </label>
  `).join('');
  
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        selectedExcludes.add(cb.value);
      } else {
        selectedExcludes.delete(cb.value);
      }
    });
  });
}

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

- [ ] **Step 2: 添加CSS样式**

```css
/* css/style.css 添加 */

.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.back-btn {
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 16px;
  color: #1976d2;
  cursor: pointer;
}

.form {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.search-results {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 4px;
  cursor: pointer;
}

.search-result-item:hover {
  background: #e3f2fd;
}

.search-empty {
  padding: 12px;
  color: #999;
  text-align: center;
}

.checkbox-group, .radio-group {
  display: flex;
  gap: 12px;
}

.checkbox-item, .radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.exclude-list {
  max-height: 200px;
  overflow-y: auto;
}

.exclude-item {
  display: block;
  padding: 8px;
  margin-bottom: 4px;
  background: #f9f9f9;
  border-radius: 4px;
  cursor: pointer;
}

.exclude-item:hover {
  background: #e3f2fd;
}

.exclude-placeholder {
  padding: 12px;
  color: #999;
  text-align: center;
}
```

- [ ] **Step 3: 提交**

```bash
git add js/app.js css/style.css
git commit -m "feat: 添加客人页面和搜索功能"
```

---

### Task 5: 派桌逻辑和兼容性检测

**Files:**
- Modify: `js/utils.js`
- Modify: `js/app.js`

- [ ] **Step 1: 编写兼容性检测逻辑**

```javascript
// js/utils.js

/**
 * 检测客人能否加入桌子
 * @param {Guest} guest - 要添加的客人
 * @param {Table} table - 目标桌子
 * @returns {Object} { compatible: boolean, reason: string }
 */
function checkCompatibility(guest, table) {
  // 人数检查
  if (table.guests.length >= MAX_GUESTS_PER_TABLE) {
    return { compatible: false, reason: '人数已满' };
  }
  
  // 金额兼容检查
  const amountResult = checkAmountCompatibility(guest, table);
  if (!amountResult.compatible) {
    return amountResult;
  }
  
  // 抽烟冲突检查
  const smokeResult = checkSmokeCompatibility(guest, table);
  if (!smokeResult.compatible) {
    return smokeResult;
  }
  
  // 社交冲突检查
  const socialResult = checkSocialCompatibility(guest, table);
  if (!socialResult.compatible) {
    return socialResult;
  }
  
  return { compatible: true, reason: '' };
}

/**
 * 金额兼容性检查
 * 取所有客人档位的交集
 */
function checkAmountCompatibility(guest, table) {
  if (table.guests.length === 0) {
    return { compatible: true, reason: '' };
  }
  
  // 计算交集
  const tableAmounts = table.amount ? [table.amount] : table.guests[0].amounts;
  const intersection = guest.amounts.filter(a => tableAmounts.includes(a));
  
  if (intersection.length === 0) {
    return { compatible: false, reason: `金额不兼容 (${guest.amounts.join('/')}元 vs ${tableAmounts.join('/')}元)` };
  }
  
  return { compatible: true, reason: '' };
}

/**
 * 抽烟兼容性检查
 * 若guest不接受抽烟，则全桌人都必须接受
 */
function checkSmokeCompatibility(guest, table) {
  if (guest.smokeTolerance) {
    return { compatible: true, reason: '' };
  }
  
  const hasNonTolerant = table.guests.some(g => !g.smokeTolerance);
  if (hasNonTolerant) {
    return { compatible: false, reason: '抽烟冲突（有烟民）' };
  }
  
  return { compatible: true, reason: '' };
}

/**
 * 社交兼容性检查
 * 双向检查：guest不能排斥table上的人，table上的人也不能排斥guest
 */
function checkSocialCompatibility(guest, table) {
  for (const existingGuest of table.guests) {
    // guest排斥existingGuest
    if (guest.excludeGuestIds && guest.excludeGuestIds.includes(existingGuest.id)) {
      const existingName = existingGuest.name;
      return { compatible: false, reason: `${guest.name}不想和${existingName}一桌` };
    }
    
    // existingGuest排斥guest
    if (existingGuest.excludeGuestIds && existingGuest.excludeGuestIds.includes(guest.id)) {
      const existingName = existingGuest.name;
      return { compatible: false, reason: `${existingName}不想和${guest.name}一桌` };
    }
  }
  
  return { compatible: true, reason: '' };
}

/**
 * 获取桌面档位（所有客人档位的交集）
 */
function getTableAmount(guests) {
  if (guests.length === 0) return null;
  
  let amounts = guests[0].amounts;
  for (const guest of guests) {
    amounts = amounts.filter(a => guest.amounts.includes(a));
  }
  
  return amounts.length > 0 ? amounts[0] : null;
}

/**
 * 对桌子按兼容性排序
 * @param {Guest} guest - 要添加的客人
 * @param {Table[]} tables - 桌子列表
 * @returns {Object[]} 排序后的桌子列表，带兼容性信息
 */
function sortTablesByCompatibility(guest, tables) {
  return tables
    .map(table => ({
      ...table,
      ...checkCompatibility(guest, table)
    }))
    .sort((a, b) => {
      // 合适的在前
      if (a.compatible && !b.compatible) return -1;
      if (!a.compatible && b.compatible) return 1;
      // 都合适的话，按空位多的在前
      return b.guests.length - a.guests.length;
    });
}
```

- [ ] **Step 2: 编写派桌结果页面**

```javascript
// js/app.js 添加

function renderAssignPage(guest) {
  const state = getState();
  const sortedTables = sortTablesByCompatibility(guest, state.tables);
  
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">← 返回</button>
        <h1>选择桌子</h1>
      </div>
      
      <div class="guest-info-bar">
        <span class="guest-name">${guest.name}</span>
        <span class="guest-amounts">${guest.amounts.join('/')}元</span>
        <span class="guest-smoke">${guest.smokeTolerance ? '可抽烟' : '不抽'}</span>
        ${guest.excludeGuestIds.length > 0 ? `<span class="guest-excludes">排除${guest.excludeGuestIds.length}人</span>` : ''}
      </div>
      
      <div id="tables-list" class="tables-list"></div>
    </div>
  `;
  
  renderAssignTables(sortedTables);
  bindAssignEvents(guest);
}

function renderAssignTables(sortedTables) {
  const container = document.getElementById('tables-list');
  
  container.innerHTML = sortedTables.map(t => `
    <div class="assign-table-card ${t.compatible ? '' : 'disabled'}" data-table-id="${t.id}">
      <div class="table-header">
        <span class="table-number">桌 ${t.id}</span>
        <span class="table-amount">${t.amount ? t.amount + '元' : '待定'}</span>
      </div>
      <div class="table-guests">
        ${t.guests.map(g => `
          <span class="guest-tag">${g.name}</span>
        `).join('')}
        ${t.guests.length === 0 ? '<span class="empty">空桌</span>' : ''}
      </div>
      <div class="table-slots">${t.guests.length}/${MAX_GUESTS_PER_TABLE}人</div>
      <div class="table-status ${t.compatible ? 'ok' : 'conflict'}">${t.compatible ? '✓ 合适' : t.reason}</div>
    </div>
  `).join('');
  
  container.querySelectorAll('.assign-table-card').forEach(card => {
    card.addEventListener('click', () => {
      const tableId = parseInt(card.dataset.tableId);
      const result = sortedTables.find(t => t.id === tableId);
      
      if (confirm(`确认将 ${guest.name} 派到 桌 ${tableId}？`)) {
        assignGuestToTable(guest, tableId);
        renderHomePage();
      }
    });
  });
}

function assignGuestToTable(guest, tableId) {
  const state = getState();
  const table = state.tables.find(t => t.id === tableId);
  
  if (!table) return;
  
  // 添加客人到桌子
  table.guests.push(guest);
  
  // 如果桌子未确定档位，确定档位
  if (!table.amount) {
    table.amount = getTableAmount(table.guests);
  }
  
  // 保存客人信息
  saveGuest(guest);
  
  saveState(state);
}

function bindAssignEvents(guest) {
  document.getElementById('back-btn').addEventListener('click', () => {
    renderAddGuestPage();
  });
}
```

- [ ] **Step 3: 添加CSS样式**

```css
/* css/style.css 添加 */

.guest-info-bar {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #e3f2fd;
  border-radius: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.guest-info-bar .guest-name {
  font-weight: 600;
}

.guest-info-bar .guest-amounts,
.guest-info-bar .guest-smoke,
.guest-info-bar .guest-excludes {
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
}

.tables-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assign-table-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.assign-table-card:hover {
  background: #e3f2fd;
}

.assign-table-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.assign-table-card.disabled:hover {
  background: white;
}

.table-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.table-number {
  font-size: 18px;
  font-weight: 600;
}

.table-amount {
  color: #666;
}

.table-guests {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.guest-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
}

.table-guests .empty {
  color: #999;
}

.table-slots {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.table-status {
  font-size: 12px;
}

.table-status.ok {
  color: #4caf50;
}

.table-status.conflict {
  color: #f44336;
}
```

- [ ] **Step 4: 提交**

```bash
git add js/utils.js js/app.js css/style.css
git commit -m "feat: 实现派桌逻辑和兼容性检测"
```

---

### Task 6: 智能迁移提示

**Files:**
- Modify: `js/utils.js`
- Modify: `js/app.js`

- [ ] **Step 1: 添加智能迁移检测逻辑**

```javascript
// js/utils.js 添加

/**
 * 智能迁移检测
 * 尝试移动1-2个客人来腾出合适位置
 * @param {Guest} guest - 要添加的客人
 * @param {Table[]} tables - 桌子列表
 * @returns {Object[]} 迁移建议列表
 */
function findMigrationSuggestions(guest, tables) {
  const suggestions = [];
  
  // 先尝试移动1个客人
  for (const table of tables) {
    if (table.guests.length === 0) continue;
    
    for (const guestToMove of table.guests) {
      // 模拟移除这个客人后的桌子
      const tempTable = {
        ...table,
        guests: table.guests.filter(g => g.id !== guestToMove.id)
      };
      
      // 检测新客人能否加入
      const result = checkCompatibility(guest, tempTable);
      if (result.compatible) {
        // 检查这个被移出的客人能否去其他桌
        const otherTables = tables.filter(t => t.id !== table.id);
        const canMoveTo = otherTables.find(t => {
          const r = checkCompatibility(guestToMove, t);
          return r.compatible;
        });
        
        if (canMoveTo) {
          suggestions.push({
            type: 'move_one',
            fromTable: table.id,
            toTable: canMoveTo.id,
            movedGuest: guestToMove,
            targetTable: table,
            reason: `移动 ${guestToMove.name} 后可落座`
          });
        }
      }
    }
  }
  
  // 尝试移动2个客人
  if (suggestions.length === 0) {
    for (const table of tables) {
      if (table.guests.length < 2) continue;
      
      // 获取所有2人组合
      const guests = table.guests;
      for (let i = 0; i < guests.length; i++) {
        for (let j = i + 1; j < guests.length; j++) {
          const guestsToMove = [guests[i], guests[j]];
          const tempTable = {
            ...table,
            guests: guests.filter(g => g.id !== guests[i].id && g.id !== guests[j].id)
          };
          
          const result = checkCompatibility(guest, tempTable);
          if (result.compatible) {
            // 检查这2人能去其他桌
            const canDistribute = checkDistribution(guestsToMove, tables.filter(t => t.id !== table.id));
            if (canDistribute) {
              suggestions.push({
                type: 'move_two',
                fromTable: table.id,
                moves: guestsToMove,
                tables: canDistribute,
                targetTable: table,
                reason: `移动 ${guestsToMove[0].name}、${guestsToMove[1].name} 后可落座`
              });
            }
          }
        }
      }
    }
  }
  
  return suggestions.slice(0, 3); // 最多返回3条建议
}

/**
 * 检查一组客人能否分配到其他桌
 */
function checkDistribution(guests, tables) {
  // 简化的分配检查
  const result = [];
  const available = [...tables].filter(t => t.guests.length < MAX_GUESTS_PER_TABLE);
  
  for (const guest of guests) {
    const table = available.find(t => checkCompatibility(guest, t).compatible);
    if (!table) return null;
    result.push(table);
  }
  
  return result;
}
```

- [ ] **Step 2: 在派桌页面集成智能迁移**

```javascript
// js/app.js 修改 renderAssignPage

function renderAssignPage(guest) {
  const state = getState();
  const sortedTables = sortTablesByCompatibility(guest, state.tables);
  
  // 检查是否有合适的桌子
  const hasCompatible = sortedTables.some(t => t.compatible);
  
  let migrationHTML = '';
  if (!hasCompatible) {
    const suggestions = findMigrationSuggestions(guest, state.tables);
    if (suggestions.length > 0) {
      migrationHTML = `
        <div class="migration-section">
          <h3>💡 智能迁移建议</h3>
          ${suggestions.map(s => `
            <div class="migration-item" data-suggestion='${JSON.stringify(s)}'>
              <div class="migration-reason">${s.reason}</div>
              <button class="migration-btn">执行迁移</button>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
  
  // ... 原有渲染代码 ...
}
```

- [ ] **Step 3: 提交**

```bash
git add js/utils.js js/app.js
git commit -m "feat: 添加智能迁移提示功能"
```

---

### Task 7: 重新派桌功能集成

**Files:**
- Modify: `js/app.js`

- [ ] **Step 1: 修改重新派桌入口**

```javascript
// js/app.js 修改 showGuestActionsMenu

function showGuestActionsMenu(guestId) {
  const guest = getGuestById(guestId);
  if (!guest) return;
  
  // 先找到客人当前所在的桌
  const state = getState();
  const currentTable = state.tables.find(t => t.guests.some(g => g.id === guestId));
  
  const action = prompt(`${guest.name} 的操作:\n1. 重新派桌\n2. 取消落座\n\n请输入序号:`);
  
  if (action === '1') {
    // 临时将客人从当前桌移除，模拟未落座状态
    if (currentTable) {
      currentTable.guests = currentTable.guests.filter(g => g.id !== guestId);
      if (currentTable.guests.length === 0) {
        currentTable.amount = null;
      }
    }
    // 进入派桌页面
    renderAssignPage(guest);
  } else if (action === '2') {
    removeGuestFromTable(guestId);
    renderHomePage();
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add js/app.js
git commit -m "feat: 集成重新派桌功能"
```

---

### Task 8: 设置功能和最终完善

**Files:**
- Modify: `js/app.js`
- Modify: `css/style.css`

- [ ] **Step 1: 添加设置页面（桌子数量配置）**

```javascript
// js/app.js 添加

function renderSettingsPage() {
  const state = getState();
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">← 返回</button>
        <h1>设置</h1>
      </div>
      
      <div class="form">
        <div class="form-group">
          <label>桌子数量</label>
          <input type="number" id="table-count" value="${state.tableCount}" min="1" max="20">
        </div>
        
        <button id="save-settings-btn" class="primary-btn">保存设置</button>
      </div>
    </div>
  `;
  
  document.getElementById('back-btn').addEventListener('click', () => {
    renderHomePage();
  });
  
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const count = parseInt(document.getElementById('table-count').value);
    const newState = getState();
    
    // 如果桌子数量增加，添加新桌子
    if (count > newState.tableCount) {
      for (let i = newState.tableCount + 1; i <= count; i++) {
        newState.tables.push({ id: i, guests: [], amount: null });
      }
    }
    // 如果减少，截断
    newState.tables = newState.tables.slice(0, count);
    newState.tableCount = count;
    
    saveState(newState);
    renderHomePage();
  });
}
```

- [ ] **Step 2: 更新首页绑定**

```javascript
// js/app.js 修改 bindHomeEvents

document.getElementById('settings-btn').addEventListener('click', () => {
  renderSettingsPage();
});
```

- [ ] **Step 3: 提交**

```bash
git add js/app.js css/style.css
git commit -m "feat: 添加设置页面，桌子数量可配置"
```

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-04-13-tea-table-match.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**