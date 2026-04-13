// js/app.js

// 首页渲染
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

// 渲染桌子列表
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
              <span class="guest-name">${escapeHtml(g.name)}</span>
              <span class="guest-amount">${escapeHtml(g.amounts.join('/'))}元${g.smokeTolerance ? '' : '🚭'}</span>
            </div>
          `).join('')}
        </div>
        <div class="slots">${table.guests.length}/${MAX_GUESTS_PER_TABLE}人</div>
      </div>
    `;
  }).join('');

  // 绑定客人点击事件
  container.querySelectorAll('.guest-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const guestId = item.dataset.guestId;
      showGuestActionsMenu(guestId);
    });
  });
}

// 绑定首页按钮事件
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
    // TODO: 跳转设置页面 Task 8
    console.log('点击设置');
  });
}

// 客人操作菜单
function showGuestActionsMenu(guestId) {
  const guest = getGuestById(guestId);
  if (!guest) return;

  // 先找到客人当前所在的桌
  const state = getState();
  const currentTable = state.tables.find(t => t.guests.some(g => g.id === guestId));

  const action = prompt(`${guest.name} 的操作:\n1. 重新派桌\n2. 取消落座\n\n请输入序号:`);

  if (action === '1') {
    // 临时将客人从当前桌移除（模拟未落座状态）
    if (currentTable) {
      currentTable.guests = currentTable.guests.filter(g => g.id !== guestId);
      if (currentTable.guests.length === 0) {
        currentTable.amount = null;
      }
      saveState(state);
    }
    // 进入派桌页面（用新客人身份，这样可以重新选桌）
    renderAssignPage(guest);
  } else if (action === '2') {
    removeGuestFromTable(guestId);
    renderHomePage();
  }
}

// 从桌子移除客人
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

// 全局变量
let currentGuest = null;
let selectedExcludes = new Set();

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

function bindAddGuestEvents() {
  const searchInput = document.getElementById('guest-search');
  const nameInput = document.getElementById('guest-name');
  const amountCheckboxes = document.querySelectorAll('input[name="amount"]');
  const smokeRadios = document.querySelectorAll('input[name="smoke"]');
  const autoAssignBtn = document.getElementById('auto-assign-btn');

  // 搜索输入 (debounce)
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const results = searchGuests(searchInput.value);
      renderSearchResults(results);
    }, 300);
  });

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
      <span class="guest-name">${escapeHtml(g.name)}</span>
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
  const allGuests = getState().guests.filter(g => !currentGuest || g.id !== currentGuest.id);

  if (allGuests.length === 0) {
    container.innerHTML = '<div class="exclude-placeholder">暂无其他客人</div>';
    return;
  }

  container.innerHTML = allGuests.map(g => `
    <label class="exclude-item">
      <input type="checkbox" value="${g.id}" ${selectedExcludes.has(g.id) ? 'checked' : ''}>
      <span>${escapeHtml(g.name)}</span>
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

function renderAssignPage(guest) {
  const state = getState();
  const sortedTables = sortTablesByCompatibility(guest, state.tables);

  const hasCompatible = sortedTables.some(t => t.compatible);

  let migrationHTML = '';
  if (!hasCompatible) {
    const suggestions = findMigrationSuggestions(guest, state.tables);
    if (suggestions.length > 0) {
      migrationHTML = `
        <div class="migration-section">
          <h3>💡 智能迁移建议</h3>
          ${suggestions.map(s => `
            <div class="migration-item">
              <div class="migration-reason">${s.reason}</div>
              <button class="migration-btn" data-index="${suggestions.indexOf(s)}">执行迁移</button>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">← 返回</button>
        <h1>选择桌子</h1>
      </div>

      <div class="guest-info-bar">
        <span class="guest-name">${escapeHtml(guest.name)}</span>
        <span class="guest-amounts">${guest.amounts.join('/')}元</span>
        <span class="guest-smoke">${guest.smokeTolerance ? '可抽烟' : '不抽'}</span>
        ${guest.excludeGuestIds.length > 0 ? `<span class="guest-excludes">排除${guest.excludeGuestIds.length}人</span>` : ''}
      </div>

      ${migrationHTML}

      <div id="tables-list" class="tables-list"></div>
    </div>
  `;

  const suggestions = hasCompatible ? [] : findMigrationSuggestions(guest, state.tables);
  renderAssignTables(sortedTables, guest);
  bindAssignEvents(guest, suggestions);
}

function renderAssignTables(sortedTables, guest) {
  const container = document.getElementById('tables-list');

  container.innerHTML = sortedTables.map(t => `
    <div class="assign-table-card ${t.compatible ? '' : 'disabled'}" data-table-id="${t.id}">
      <div class="table-header">
        <span class="table-number">桌 ${t.id}</span>
        <span class="table-amount">${t.amount ? t.amount + '元' : '待定'}</span>
      </div>
      <div class="table-guests">
        ${t.guests.map(g => `<span class="guest-tag">${escapeHtml(g.name)}</span>`).join('')}
        ${t.guests.length === 0 ? '<span class="empty">空桌</span>' : ''}
      </div>
      <div class="table-slots">${t.guests.length}/${MAX_GUESTS_PER_TABLE}人</div>
      <div class="table-status ${t.compatible ? 'ok' : 'conflict'}">${t.compatible ? '✓ 合适' : t.reason}</div>
    </div>
  `).join('');

  container.querySelectorAll('.assign-table-card').forEach(card => {
    card.addEventListener('click', () => {
      const tableId = parseInt(card.dataset.tableId);
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

  table.guests.push(guest);

  if (!table.amount) {
    table.amount = getTableAmount(table.guests);
  }

  saveGuest(guest);
  saveState(state);
}

function bindAssignEvents(guest, suggestions = []) {
  document.getElementById('back-btn').addEventListener('click', () => {
    renderAddGuestPage();
  });

  // 迁移按钮事件
  document.querySelectorAll('.migration-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(btn.dataset.index);
      const suggestion = suggestions[index];
      if (confirm(`确认迁移？\n${suggestion.reason}`)) {
        executeMigration(suggestion, guest);
        renderHomePage();
      }
    });
  });
}

function executeMigration(suggestion, newGuest) {
  const state = getState();

  // 从原桌移除客人
  const fromTable = state.tables.find(t => t.id === suggestion.fromTable);
  fromTable.guests = fromTable.guests.filter(g => g.id !== suggestion.movedGuest.id);

  // 添加到新桌
  const toTable = state.tables.find(t => t.id === suggestion.toTable);
  suggestion.movedGuest.tableId = suggestion.toTable;
  toTable.guests.push(suggestion.movedGuest);

  // 新客人添加到原桌
  newGuest.tableId = suggestion.fromTable;
  fromTable.guests.push(newGuest);

  // 更新桌面档位
  fromTable.amount = getTableAmount(fromTable.guests);
  toTable.amount = getTableAmount(toTable.guests);

  // 保存客人信息
  saveGuest(newGuest);
  saveGuest(suggestion.movedGuest);

  saveState(state);
}