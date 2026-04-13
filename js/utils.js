// js/utils.js

/**
 * HTML转义防止XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
 */
function checkAmountCompatibility(guest, table) {
  if (table.guests.length === 0) {
    return { compatible: true, reason: '' };
  }

  const tableAmounts = table.amount ? [table.amount] : table.guests[0].amounts;
  const intersection = guest.amounts.filter(a => tableAmounts.includes(a));

  if (intersection.length === 0) {
    return { compatible: false, reason: `金额不兼容 (${guest.amounts.join('/')}元 vs ${tableAmounts.join('/')}元)` };
  }

  return { compatible: true, reason: '' };
}

/**
 * 抽烟兼容性检查
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
 */
function checkSocialCompatibility(guest, table) {
  for (const existingGuest of table.guests) {
    if (guest.excludeGuestIds && guest.excludeGuestIds.includes(existingGuest.id)) {
      return { compatible: false, reason: `${guest.name}不想和${existingGuest.name}一桌` };
    }

    if (existingGuest.excludeGuestIds && existingGuest.excludeGuestIds.includes(guest.id)) {
      return { compatible: false, reason: `${existingGuest.name}不想和${guest.name}一桌` };
    }
  }

  return { compatible: true, reason: '' };
}

/**
 * 获取桌面档位
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
 */
function sortTablesByCompatibility(guest, tables) {
  return tables
    .map(table => ({
      ...table,
      ...checkCompatibility(guest, table)
    }))
    .sort((a, b) => {
      if (a.compatible && !b.compatible) return -1;
      if (!a.compatible && b.compatible) return 1;
      return b.guests.length - a.guests.length;
    });
}

/**
 * 智能迁移检测
 * 尝试移动1个客人来腾出合适位置
 */
function findMigrationSuggestions(guest, tables) {
  const suggestions = [];

  // 先尝试移动1个客人
  for (const table of tables) {
    if (table.guests.length === 0) continue;

    for (const guestToMove of table.guests) {
      const tempTable = {
        ...table,
        guests: table.guests.filter(g => g.id !== guestToMove.id)
      };

      const result = checkCompatibility(guest, tempTable);
      if (result.compatible) {
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
            reason: `移动 ${guestToMove.name} 后可落座`
          });
        }
      }
    }
  }

  return suggestions.slice(0, 3);
}