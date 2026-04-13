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

  // 获取桌上所有客人能接受的金额交集
  const tableAcceptable = getTableAcceptableAmounts(table.guests);

  // 如果没有共同可接受的金额（桌上的客人金额存在冲突）
  if (!tableAcceptable || tableAcceptable.length === 0) {
    return { compatible: false, reason: `金额不兼容` };
  }

  const intersection = guest.amounts.filter(a => tableAcceptable.includes(a));

  if (intersection.length === 0) {
    return { compatible: false, reason: `金额不兼容 (${guest.amounts.join('/')}元 vs ${tableAcceptable.join('/')}元)` };
  }

  return { compatible: true, reason: '' };
}

/**
 * 抽烟兼容性检查
 * - 无所谓可以和任何人同桌
 * - 其他人需要同桌所有人抽烟习惯一致（或都是无所谓）
 */
function checkSmokeCompatibility(guest, table) {
  // 如果客人无所谓，可以和任何人同桌
  if (guest.smokeTolerance === 'any') {
    return { compatible: true, reason: '' };
  }

  // 检查同桌是否有无所谓的人（无所谓的人可以和任何人同桌）
  const hasAnyTolerant = table.guests.some(g => g.smokeTolerance === 'any');
  if (hasAnyTolerant) {
    return { compatible: true, reason: '' };
  }

  // 如果客人不接受抽烟，检查同桌是否有人抽烟
  if (guest.smokeTolerance === false) {
    const hasSmoker = table.guests.some(g => g.smokeTolerance === true);
    if (hasSmoker) {
      return { compatible: false, reason: '抽烟冲突（桌上有烟民）' };
    }
  }

  // 如果客人接受抽烟，检查同桌是否有人不接受抽烟
  if (guest.smokeTolerance === true) {
    const hasNonSmoker = table.guests.some(g => g.smokeTolerance === false);
    if (hasNonSmoker) {
      return { compatible: false, reason: '抽烟冲突（桌上有不抽烟的人）' };
    }
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
 * 获取桌面档位（交集，用于判断新客人能否加入）
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
 * 获取桌面可接受档位（交集，用于显示）
 */
function getTableAcceptableAmounts(guests) {
  if (guests.length === 0) return null;
  if (guests.length === 1) return guests[0].amounts;

  // 获取所有客人都能接受的金额（交集）
  let commonAmounts = guests[0].amounts;
  for (const guest of guests) {
    commonAmounts = commonAmounts.filter(a => guest.amounts.includes(a));
  }

  return commonAmounts.length > 0 ? commonAmounts : null;
}

/**
 * 对桌子按兼容性排序
 */
function sortTablesByCompatibility(guest, tables) {
  return tables
    .map(table => ({
      ...table,
      ...checkCompatibility(guest, table),
      acceptableAmounts: getTableAcceptableAmounts(table.guests)
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
            reason: `将 ${guestToMove.name} 从桌${table.id}移到桌${canMoveTo.id}后，${guest.name}可落座`
          });
        }
      }
    }
  }

  return suggestions.slice(0, 3);
}