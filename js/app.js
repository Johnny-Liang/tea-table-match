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
              <span class="guest-name">${g.name}</span>
              <span class="guest-amount">${g.amounts.join('/')}元${g.smokeTolerance ? '' : '🚭'}</span>
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
    // TODO: 跳转添加客人页面 Task 4
    console.log('点击添加客人');
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

  const action = prompt(`${guest.name} 的操作:\n1. 重新派桌\n2. 取消落座\n\n请输入序号:`);

  if (action === '1') {
    // TODO: Task 7 重新派桌
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