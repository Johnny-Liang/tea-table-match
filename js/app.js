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
      <button id="add-guest-btn" class="primary-btn">位置安排</button>
      <button id="end-day-btn" class="danger-btn">清空</button>
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
    const isForceAssigned = table.forceAssigned === true;
    return `
      <div class="table-card ${isFull ? 'full' : ''} ${isForceAssigned ? 'force-assigned' : ''}" data-table-id="${table.id}">
        <div class="table-header-row">
          <span class="table-number">桌 ${table.id}</span>
          <span class="slots">${table.guests.length}/${MAX_GUESTS_PER_TABLE}人</span>
        </div>
        <div class="guest-list">
          ${table.guests.map(g => `
            <div class="guest-item" data-guest-id="${g.id}">
              <span class="guest-name">${escapeHtml(g.name)}</span>
              <span class="guest-amount">${escapeHtml(g.amounts.join('/'))}元${g.smokeTolerance === true ? '' : (g.smokeTolerance === false ? '🚭' : '')}</span>
            </div>
          `).join('')}
        </div>
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

// 客人选择页面
function renderGuestSelectPage() {
  const state = getState();
  const app = document.getElementById('app');

  if (state.guests.length === 0) {
    // 没有客人，直接打开添加页面
    renderAddGuestPage();
    return;
  }

  // 获取客人落座状态
  const seatedGuestIds = new Set();
  state.tables.forEach(table => {
    table.guests.forEach(g => seatedGuestIds.add(g.id));
  });

  // 分离已落座和未落座的客人，并排序（未落座在前）
  const unseatedGuests = state.guests.filter(g => !seatedGuestIds.has(g.id));
  const seatedGuests = state.guests.filter(g => seatedGuestIds.has(g.id));
  const sortedGuests = [...unseatedGuests, ...seatedGuests];

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1>选择客人</h1>
      </div>

      <div class="search-bar">
        <input type="text" id="guest-search" placeholder="搜索客人..." autocomplete="off">
      </div>

      <div id="guest-select-list" class="guest-select-list">
        ${renderGuestSelectItems(sortedGuests, seatedGuestIds)}
      </div>

      <div class="bottom-fixed-btn">
        <button id="new-guest-btn" class="primary-btn">新建客人</button>
      </div>
    </div>
  `;

  // 绑定搜索事件
  document.getElementById('guest-search').addEventListener('input', (e) => {
    const keyword = e.target.value.trim().toLowerCase();
    const filteredGuests = keyword
      ? sortedGuests.filter(g => g.name.toLowerCase().includes(keyword))
      : sortedGuests;
    document.getElementById('guest-select-list').innerHTML = renderGuestSelectItems(filteredGuests, seatedGuestIds);
    bindGuestSelectEvents(seatedGuestIds, state);
  });

  // 绑定选择客人事件
  bindGuestSelectEvents(seatedGuestIds, state);

  // 绑定新建客人事件
  document.getElementById('new-guest-btn').addEventListener('click', () => {
    currentGuest = null;
    selectedExcludes.clear();
    assignReturnTo = 'selectGuest'; // 新建客人后返回选择列表
    renderAddGuestPage();
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    renderHomePage();
  });
}

function renderGuestSelectItems(guests, seatedGuestIds) {
  if (guests.length === 0) {
    return '<div class="guest-select-empty">未找到匹配的客人</div>';
  }
  return guests.map(g => {
    const isSeated = seatedGuestIds.has(g.id);
    return `
      <div class="guest-select-item ${isSeated ? 'seated' : ''}" data-guest-id="${g.id}">
        <div class="guest-select-main">
          <span class="guest-name">${escapeHtml(g.name)}</span>
          <span class="guest-info">${g.amounts.join('/')}元 ${formatSmokeTolerance(g.smokeTolerance)}</span>
        </div>
        <div class="guest-select-actions">
          ${isSeated ? '<span class="seated-badge">已落座</span>' : ''}
          <button class="edit-guest-btn" data-guest-id="${g.id}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function bindGuestSelectEvents(seatedGuestIds, state) {
  // 点击编辑按钮 → 进入编辑表单
  document.querySelectorAll('.edit-guest-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const guestId = btn.dataset.guestId;
      const guest = getGuestById(guestId);
      if (guest) {
        // 记录客人是否从某桌"借"出来，但不立即移除
        guestOriginalTableId = seatedGuestIds.has(guestId)
          ? state.tables.find(t => t.guests.some(g => g.id === guestId))?.id || null
          : null;
        currentGuest = guest;
        fillFormWithGuest(guest);
        assignReturnTo = 'selectGuest'; // 从编辑按钮进入，返回到选择客人列表
        renderAddGuestPage();
      }
    });
  });

  // 点击卡片 → 直接进入派桌页面
  document.querySelectorAll('.guest-select-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // 如果点击的是编辑按钮，不处理
      if (e.target.closest('.edit-guest-btn')) return;

      const guestId = item.dataset.guestId;
      const guest = getGuestById(guestId);
      if (guest) {
        // 如果客人已落座，先从原桌移除
        if (seatedGuestIds.has(guestId)) {
          removeGuestFromTable(guestId);
        }
        // 直接进入派桌页面
        saveGuest(guest);
        assignReturnTo = 'selectGuest'; // 从列表卡片进入，返回到选择客人页面
        renderAssignPage(guest);
      }
    });
  });
}

// 绑定首页按钮事件
function bindHomeEvents() {
  document.getElementById('add-guest-btn').addEventListener('click', () => {
    renderGuestSelectPage();
  });

  document.getElementById('end-day-btn').addEventListener('click', () => {
    if (confirm('确定清空所有座位数据？')) {
      clearAllSeats();
      renderHomePage();
    }
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    renderSettingsPage();
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
    assignReturnTo = 'addGuest'; // 从首页进入，返回首页
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
    // 检查是否需要清除 forceAssigned 标记
    checkAndClearForceAssigned(table, state);
    saveState(state);
  }
}

// 检查桌子是否需要清除强制派桌标记
function checkAndClearForceAssigned(table, state) {
  if (!table.forceAssigned) return;

  // 如果桌子上只有0-1个人，不需要检查，肯定兼容
  if (table.guests.length <= 1) {
    table.forceAssigned = false;
    return;
  }

  // 检查所有客人之间是否两两兼容
  for (let i = 0; i < table.guests.length; i++) {
    for (let j = i + 1; j < table.guests.length; j++) {
      const guestA = table.guests[i];
      const guestB = table.guests[j];

      // 检查金额兼容性
      const amountsA = new Set(guestA.amounts);
      const amountsB = new Set(guestB.amounts);
      const hasCommonAmount = guestA.amounts.some(a => amountsB.has(a));
      if (!hasCommonAmount) return; // 金额不兼容，不清除

      // 检查抽烟兼容性
      if (guestA.smokeTolerance !== 'any' && guestB.smokeTolerance !== 'any' &&
          guestA.smokeTolerance !== guestB.smokeTolerance) {
        return; // 抽烟习惯冲突，不清除
      }

      // 检查社交冲突
      if (guestA.excludeGuestIds?.includes(guestB.id) ||
          guestB.excludeGuestIds?.includes(guestA.id)) {
        return; // 社交冲突，不清除
      }
    }
  }

  // 所有检查通过，清除标记
  table.forceAssigned = false;
}

// 设置页面
function renderSettingsPage() {
  const state = getState();
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  renderHomePage();
});

// 全局变量
let currentGuest = null;
let selectedExcludes = new Set();
let guestOriginalTableId = null; // 记录客人是否从某桌"借"出来，null表示新客人或未落座
let assignReturnTo = 'addGuest'; // 派桌页面返回目标：'addGuest'=添加编辑页面，'selectGuest'=选择客人页面

// 格式化抽烟习惯显示
function formatSmokeTolerance(value) {
  if (value === true) return '抽烟';
  if (value === false) return '不抽';
  if (value === 'any') return '无所谓';
  return '未知';
}

function renderAddGuestPage() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <button id="back-btn" class="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1>${currentGuest ? '编辑客人' : '添加客人'}</h1>
      </div>

      <div class="form">
        <div class="form-group">
          <label>姓名 *</label>
          <input type="text" id="guest-name" placeholder="请输入姓名" required value="${currentGuest ? escapeHtml(currentGuest.name) : ''}">
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
              <input type="radio" name="smoke" value="true">
              <span>接受</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="smoke" value="false">
              <span>不接受</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="smoke" value="any" checked>
              <span>无所谓</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <label>不能同桌的客人</label>
          <div class="search-bar">
            <input type="text" id="exclude-search" placeholder="搜索客人..." autocomplete="off">
          </div>
          <div id="exclude-list" class="exclude-list">
            <div class="exclude-placeholder">暂无其他客人</div>
          </div>
        </div>
      </div>

      <div class="bottom-fixed-btn">
        <button id="auto-assign-btn" class="primary-btn" disabled>自动派桌</button>
      </div>
    </div>
  `;

  bindAddGuestEvents();
}

function bindAddGuestEvents() {
  const nameInput = document.getElementById('guest-name');
  const amountCheckboxes = document.querySelectorAll('input[name="amount"]');
  const smokeRadios = document.querySelectorAll('input[name="smoke"]');
  const autoAssignBtn = document.getElementById('auto-assign-btn');

  // 初始化表单数据（如果是编辑已有客人）
  if (currentGuest) {
    // 如果 currentGuest 有完整数据（包括 name），恢复表单
    if (currentGuest.name) {
      nameInput.value = currentGuest.name;
    }
    // 设置档位
    if (currentGuest.amounts && currentGuest.amounts.length > 0) {
      amountCheckboxes.forEach(cb => {
        cb.checked = currentGuest.amounts.includes(parseInt(cb.value));
      });
    }
    // 设置抽烟
    if (currentGuest.smokeTolerance !== undefined) {
      document.querySelector(`input[name="smoke"][value="${currentGuest.smokeTolerance}"]`).checked = true;
    }
  }

  // 始终渲染排除列表（无论新建还是编辑客人）
  renderExcludeList();
  validateForm();

  // 排除列表搜索
  const excludeSearchInput = document.getElementById('exclude-search');
  excludeSearchInput.addEventListener('input', (e) => {
    renderExcludeList(e.target.value.trim());
  });

  // 姓名输入变化同步到 currentGuest
  nameInput.addEventListener('input', () => {
    if (currentGuest) {
      currentGuest.name = nameInput.value.trim();
    }
    validateForm();
  });

  // 档位变化
  amountCheckboxes.forEach(cb => cb.addEventListener('change', () => {
    if (currentGuest) {
      currentGuest.amounts = Array.from(document.querySelectorAll('input[name="amount"]:checked'))
        .map(c => parseInt(c.value));
    }
    validateForm();
  }));

  // 抽烟选项变化
  smokeRadios.forEach(r => r.addEventListener('change', () => {
    if (currentGuest) {
      const val = document.querySelector('input[name="smoke"]:checked').value;
      currentGuest.smokeTolerance = val === 'true' ? true : (val === 'false' ? false : 'any');
    }
  }));

  // 返回
  document.getElementById('back-btn').addEventListener('click', () => {
    // 根据来源决定返回到哪里
    if (assignReturnTo === 'selectGuest') {
      renderGuestSelectPage();
    } else {
      renderHomePage();
    }
  });

  // 自动派桌
  autoAssignBtn.addEventListener('click', () => {
    const guest = getFormData();
    saveGuest(guest); // 先保存客人数据

    // 检查客人是否已落座
    const state = getState();
    const currentTable = state.tables.find(t => t.guests.some(g => g.id === guest.id));
    if (currentTable) {
      if (confirm(`客人已落座桌${currentTable.id}，重新派桌前会取消落座，是否确认？`)) {
        // 取消落座后再进入派桌页面
        removeGuestFromTable(guest.id);
        guestOriginalTableId = null; // 清除原桌标记，表示是主动取消而非"借出"
        renderAssignPage(guest);
      }
      // 用户取消则留在当前页面
    } else {
      guestOriginalTableId = null;
      renderAssignPage(guest);
    }
  });
}

function fillFormWithGuest(guest) {
  currentGuest = guest;
}

function getFormData() {
  const name = document.getElementById('guest-name').value.trim();
  const amounts = Array.from(document.querySelectorAll('input[name="amount"]:checked'))
    .map(cb => parseInt(cb.value));
  const smokeVal = document.querySelector('input[name="smoke"]:checked').value;
  const smokeTolerance = smokeVal === 'true' ? true : (smokeVal === 'false' ? false : 'any');

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

function renderExcludeList(keyword = '') {
  const container = document.getElementById('exclude-list');
  // 从 state 获取最新客人列表
  const state = getState();
  // 获取当前客人的最新数据（确保 excludeGuestIds 是最新的）
  const currentGuestData = currentGuest?.id ? state.guests.find(g => g.id === currentGuest.id) : null;
  // 如果 state 中有当前客人的数据，使用其 excludeGuestIds
  if (currentGuestData && currentGuestData.excludeGuestIds) {
    selectedExcludes = new Set(currentGuestData.excludeGuestIds);
  }

  let allGuests = state.guests.filter(g => !currentGuest?.id || g.id !== currentGuest.id);

  // 搜索过滤
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    allGuests = allGuests.filter(g => g.name.toLowerCase().includes(lowerKeyword));
  }

  if (allGuests.length === 0) {
    container.innerHTML = `<div class="exclude-placeholder">${keyword ? '未找到匹配的客人' : '暂无其他客人'}</div>`;
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
          <h3>💡 智能换位建议</h3>
          ${suggestions.map(s => `
            <div class="migration-item">
              <div class="migration-reason">${s.reason}</div>
              <button class="migration-btn" data-index="${suggestions.indexOf(s)}">换位</button>
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
        <button id="back-btn" class="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1>选择桌子</h1>
      </div>

      <div class="guest-info-bar">
        <span class="guest-name">${escapeHtml(guest.name)}</span>
        <span class="guest-amounts">${guest.amounts.join('/')}元</span>
        <span class="guest-smoke">${formatSmokeTolerance(guest.smokeTolerance)}</span>
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
        <span class="table-amount">${t.acceptableAmounts ? t.acceptableAmounts.join('/') + '元' : '待定'}</span>
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
      const isDisabled = card.classList.contains('disabled');
      const tableInfo = sortedTables.find(t => t.id === tableId);

      let confirmMessage = `确认将 ${guest.name} 派到 桌 ${tableId}？`;
      if (isDisabled && tableInfo) {
        // 强制派桌时显示额外提醒
        confirmMessage = `⚠️ 强制派桌提醒\n\n${tableInfo.reason}\n\n强制派桌后该桌子将不受「${tableInfo.reason}」限制。\n\n确认将 ${guest.name} 派到 桌 ${tableId}？`;
      }

      if (confirm(confirmMessage)) {
        assignGuestToTable(guest, tableId, isDisabled);
        renderHomePage();
      }
    });
  });
}

function assignGuestToTable(guest, tableId, forceAssigned = false) {
  const state = getState();
  const table = state.tables.find(t => t.id === tableId);

  if (!table) return;

  // 如果客人是从其他桌"借"出来的，先从原桌移除
  if (guestOriginalTableId !== null) {
    const originalTable = state.tables.find(t => t.id === guestOriginalTableId);
    if (originalTable) {
      originalTable.guests = originalTable.guests.filter(g => g.id !== guest.id);
      if (originalTable.guests.length === 0) {
        originalTable.amount = null;
      }
      // 检查原桌是否需要清除强制派桌标记
      checkAndClearForceAssigned(originalTable, state);
    }
    guestOriginalTableId = null; // 清空标记
  }

  table.guests.push(guest);

  // 如果是强制派桌（选择了不兼容的桌子），标记该桌
  if (forceAssigned) {
    table.forceAssigned = true;
  }

  if (!table.amount) {
    table.amount = getTableAmount(table.guests);
  }

  saveGuest(guest);
  saveState(state);
}

function bindAssignEvents(guest, suggestions = []) {
  document.getElementById('back-btn').addEventListener('click', () => {
    // 返回前保存当前表单数据到 currentGuest
    currentGuest = {
      ...guest,
      name: guest.name,
      amounts: guest.amounts,
      smokeTolerance: guest.smokeTolerance,
      excludeGuestIds: guest.excludeGuestIds
    };

    // 根据来源决定返回到哪里
    if (assignReturnTo === 'selectGuest') {
      renderGuestSelectPage();
    } else {
      renderAddGuestPage();
    }
  });

  // 迁移按钮事件
  document.querySelectorAll('.migration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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

  // 检查是否需要清除强制派桌标记
  checkAndClearForceAssigned(fromTable, state);
  checkAndClearForceAssigned(toTable, state);

  // 更新桌面档位
  fromTable.amount = getTableAmount(fromTable.guests);
  toTable.amount = getTableAmount(toTable.guests);

  // 保存客人信息
  saveGuest(newGuest);
  saveGuest(suggestion.movedGuest);

  saveState(state);
}