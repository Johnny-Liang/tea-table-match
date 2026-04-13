// js/test.js
// 茶馆组局 - 派桌规则测试用例

/**
 * 测试辅助函数
 */
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ 失败: ${message}`);
    return false;
  }
  console.log(`✅ 通过: ${message}`);
  return true;
}

function assertEqual(actual, expected, message) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.error(`❌ 失败: ${message}`);
    console.error(`   期望: ${JSON.stringify(expected)}`);
    console.error(`   实际: ${JSON.stringify(actual)}`);
    return false;
  }
  console.log(`✅ 通过: ${message}`);
  return true;
}

/**
 * 创建测试用的桌子
 */
function createTable(id, guests = []) {
  return {
    id,
    guests,
    amount: null
  };
}

/**
 * 创建测试用的客人
 */
function createGuest(id, name, amounts, smokeTolerance, excludeGuestIds = []) {
  return {
    id,
    name,
    amounts,
    smokeTolerance,
    excludeGuestIds
  };
}

/**
 * 测试金额兼容性
 */
function testAmountCompatibility() {
  console.log('\n=== 测试金额兼容性 ===');

  let passed = 0;
  let failed = 0;

  // 空桌应该兼容
  const emptyTable = createTable(1);
  const guest1 = createGuest('g1', '张三', [5, 10], 'any');
  const result1 = checkAmountCompatibility(guest1, emptyTable);
  if (assert(result1.compatible, `空桌应该兼容 - 张三(5/10)`)) passed++; else failed++;

  // 交集有值应该兼容
  const table2 = createTable(2, [
    createGuest('g2', '李四', [5, 10], 'any')
  ]);
  const result2 = checkAmountCompatibility(guest1, table2);
  if (assert(result2.compatible, `交集有值应该兼容 - 张三(5/10) 加入 李四(5/10)`)) passed++; else failed++;

  // 交集为空应该不兼容
  const table3 = createTable(3, [
    createGuest('g3', '王五', [20], 'any')
  ]);
  const result3 = checkAmountCompatibility(guest1, table3);
  if (assert(!result3.compatible, `交集为空应该不兼容 - 张三(5/10) 加入 王五(20)`)) passed++; else failed++;

  // 部分交集应该兼容
  const table4 = createTable(4, [
    createGuest('g4', '赵六', [5, 20], 'any')
  ]);
  const result4 = checkAmountCompatibility(guest1, table4);
  if (assert(result4.compatible, `部分交集应该兼容 - 张三(5/10) 加入 赵六(5/20)，交集为[5]`)) passed++; else failed++;

  // 多客人交集测试
  const table5 = createTable(5, [
    createGuest('g5a', '客A', [5, 10, 20], 'any'),
    createGuest('g5b', '客B', [5, 10], 'any')
  ]);
  const result5 = checkAmountCompatibility(guest1, table5);
  if (assert(result5.compatible, `多客人交集测试 - 张三(5/10) 加入 客A(5/10/20)+客B(5/10)，交集为[5,10]`)) passed++; else failed++;

  // 多客人交集为空 - 无法确定共同金额，新客无法加入
  const table6 = createTable(6, [
    createGuest('g6a', '客C', [10, 20], 'any'),
    createGuest('g6b', '客D', [5], 'any')
  ]);
  const result6 = checkAmountCompatibility(guest1, table6);
  if (assert(!result6.compatible, `多客人交集为空 - 张三(5/10) 加入 客C(10/20)+客D(5)，无法确定共同金额`)) passed++; else failed++;

  console.log(`金额兼容性测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试抽烟兼容性
 */
function testSmokeCompatibility() {
  console.log('\n=== 测试抽烟兼容性 ===');

  let passed = 0;
  let failed = 0;

  // 无所谓的人可以和任何人同桌
  const guestAny = createGuest('gAny', '无所谓客', [5], 'any');
  const tableAccepts = createTable(1, [
    createGuest('gAccepts', '接受抽烟', [5], true)
  ]);
  const result1 = checkSmokeCompatibility(guestAny, tableAccepts);
  if (assert(result1.compatible, `无所谓 + 接受抽烟 = 兼容`)) passed++; else failed++;

  const tableRejects = createTable(2, [
    createGuest('gRejects', '不接受抽烟', [5], false)
  ]);
  const result2 = checkSmokeCompatibility(guestAny, tableRejects);
  if (assert(result2.compatible, `无所谓 + 不接受抽烟 = 兼容`)) passed++; else failed++;

  const mixedTable = createTable(3, [
    createGuest('gAccepts2', '接受抽烟', [5], true),
    createGuest('gRejects2', '不接受抽烟', [5], false)
  ]);
  const result3 = checkSmokeCompatibility(guestAny, mixedTable);
  if (assert(result3.compatible, `无所谓 + 混合桌 = 兼容`)) passed++; else failed++;

  // 接受抽烟的人和不吃烟的人不兼容
  const guestAccepts = createGuest('gAccepts3', '接受抽烟客', [5], true);
  const result4 = checkSmokeCompatibility(guestAccepts, tableRejects);
  if (assert(!result4.compatible, `接受抽烟 + 不接受抽烟 = 不兼容`)) passed++; else failed++;

  // 接受抽烟的人和接受抽烟的人兼容
  const result5 = checkSmokeCompatibility(guestAccepts, tableAccepts);
  if (assert(result5.compatible, `接受抽烟 + 接受抽烟 = 兼容`)) passed++; else failed++;

  // 不接受抽烟的人和接受抽烟的人不兼容
  const guestRejects = createGuest('gRejects3', '不接受抽烟客', [5], false);
  const result6 = checkSmokeCompatibility(guestRejects, tableAccepts);
  if (assert(!result6.compatible, `不接受抽烟 + 接受抽烟 = 不兼容`)) passed++; else failed++;

  // 不接受抽烟的人和不吃烟的人兼容
  const result7 = checkSmokeCompatibility(guestRejects, tableRejects);
  if (assert(result7.compatible, `不接受抽烟 + 不接受抽烟 = 兼容`)) passed++; else failed++;

  // 有无所谓的人在桌，其他人可以加入
  const tableWithAny = createTable(4, [
    createGuest('gAny2', '无所谓', [5], 'any'),
    createGuest('gAccepts4', '接受抽烟', [5], true)
  ]);
  const result8 = checkSmokeCompatibility(guestRejects, tableWithAny);
  if (assert(result8.compatible, `不接受抽烟 + 有无所谓的混合桌 = 兼容`)) passed++; else failed++;

  const result9 = checkSmokeCompatibility(guestAccepts, tableWithAny);
  if (assert(result9.compatible, `接受抽烟 + 有无所谓的混合桌 = 兼容`)) passed++; else failed++;

  console.log(`抽烟兼容性测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试社交冲突
 */
function testSocialCompatibility() {
  console.log('\n=== 测试社交冲突 ===');

  let passed = 0;
  let failed = 0;

  // 无冲突应该兼容
  const table1 = createTable(1, [
    createGuest('g1', '李四', [5], 'any')
  ]);
  const guest1 = createGuest('g2', '张三', [5], 'any', ['g3']);
  const result1 = checkSocialCompatibility(guest1, table1);
  if (assert(result1.compatible, `无冲突应该兼容 - 张三排除g3，李四不是g3`)) passed++; else failed++;

  // 单向冲突
  const table2 = createTable(2, [
    createGuest('g3', '王五', [5], 'any')
  ]);
  const result2 = checkSocialCompatibility(guest1, table2);
  if (assert(!result2.compatible, `单向冲突应该不兼容 - 张三排除了王五`)) passed++; else failed++;

  // 反向冲突
  const guest2 = createGuest('g4', '赵六', [5], 'any', []);
  const table3 = createTable(3, [
    createGuest('g5', '钱七', [5], 'any', ['g4'])
  ]);
  const result3 = checkSocialCompatibility(guest2, table3);
  if (assert(!result3.compatible, `反向冲突应该不兼容 - 钱七排除了赵六`)) passed++; else failed++;

  // 无排除列表
  const guest3 = createGuest('g6', '孙八', [5], 'any', []);
  const result4 = checkSocialCompatibility(guest3, table1);
  if (assert(result4.compatible, `无排除列表应该兼容`)) passed++; else failed++;

  console.log(`社交冲突测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试综合兼容性
 */
function testOverallCompatibility() {
  console.log('\n=== 测试综合兼容性 ===');

  let passed = 0;
  let failed = 0;

  // 所有条件都满足
  const table1 = createTable(1, [
    createGuest('g1', '李四', [5, 10], true)
  ]);
  const guest1 = createGuest('g2', '张三', [5, 10], true, []);
  const result1 = checkCompatibility(guest1, table1);
  if (assert(result1.compatible, `所有条件满足应该兼容`)) passed++; else failed++;

  // 金额不兼容
  const table2 = createTable(2, [
    createGuest('g3', '王五', [20], true)
  ]);
  const result2 = checkCompatibility(guest1, table2);
  if (assert(!result2.compatible, `金额不兼容应该不兼容`)) passed++; else failed++;

  // 抽烟不兼容
  const table3 = createTable(3, [
    createGuest('g4', '赵六', [5, 10], false)
  ]);
  const result3 = checkCompatibility(guest1, table3);
  if (assert(!result3.compatible, `抽烟习惯不兼容应该不兼容`)) passed++; else failed++;

  // 社交冲突
  const table4 = createTable(4, [
    createGuest('g5', '孙八', [5, 10], true)
  ]);
  const guest2 = createGuest('g6', '周九', [5, 10], true, ['g5']);
  const result4 = checkCompatibility(guest2, table4);
  if (assert(!result4.compatible, `社交冲突应该不兼容`)) passed++; else failed++;

  console.log(`综合兼容性测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试桌面金额计算
 */
function testTableAmount() {
  console.log('\n=== 测试桌面金额计算 ===');

  let passed = 0;
  let failed = 0;

  // 空桌
  const result1 = assertEqual(getTableAmount([]), null, `空桌返回null`); if (result1) passed++; else failed++;

  // 单人
  const result2 = assertEqual(getTableAmount([{ amounts: [5, 10] }]), 5, `单人返回第一个金额`); if (result2) passed++; else failed++;

  // 两人交集
  const result3 = assertEqual(
    getTableAmount([{ amounts: [5, 10, 20] }, { amounts: [5, 10] }]),
    5,
    `两人交集(5/10/20 & 5/10)返回5`
  ); if (result3) passed++; else failed++;

  // 两人无交集
  const result4 = assertEqual(
    getTableAmount([{ amounts: [5] }, { amounts: [10] }]),
    null,
    `两人无交集返回null`
  ); if (result4) passed++; else failed++;

  // 可接受金额测试
  const result5 = assertEqual(
    getTableAcceptableAmounts([{ amounts: [5, 10, 20] }, { amounts: [5, 10] }]),
    [5, 10],
    `可接受金额(并集)返回[5,10]`
  ); if (result5) passed++; else failed++;

  const result6 = assertEqual(
    getTableAcceptableAmounts([]),
    null,
    `空桌可接受金额返回null`
  ); if (result6) passed++; else failed++;

  console.log(`桌面金额计算测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试桌子排序
 */
function testTableSorting() {
  console.log('\n=== 测试桌子排序 ===');

  let passed = 0;
  let failed = 0;

  const guest = createGuest('g1', '张三', [5, 10], true, []);
  const tables = [
    createTable(1, []), // 空桌
    createTable(2, [
      createGuest('g2', '李四', [5, 10], true)
    ]),
    createTable(3, [
      createGuest('g3', '王五', [20], true) // 金额不兼容
    ]),
    createTable(4, [
      createGuest('g4', '赵六', [5, 10], false) // 抽烟不兼容
    ])
  ];

  const sorted = sortTablesByCompatibility(guest, tables);

  // 排序规则：兼容优先，人数多的优先
  // 第一应该是1人桌（人数多）
  if (assertEqual(sorted[0].id, 2, `排序后第一是1人桌（人数多的优先）`)) passed++; else failed++;

  // 第二应该是空桌
  if (assertEqual(sorted[1].id, 1, `排序后第二是空桌`)) passed++; else failed++;

  // 不兼容的排在后面
  if (assert(!sorted.find(t => t.id === 3).compatible, `金额不兼容的桌标记为不兼容`)) passed++; else failed++;
  if (assert(!sorted.find(t => t.id === 4).compatible, `抽烟不兼容的桌标记为不兼容`)) passed++; else failed++;

  console.log(`桌子排序测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试智能换位
 */
function testMigration() {
  console.log('\n=== 测试智能换位 ===');

  let passed = 0;
  let failed = 0;

  // 场景：张三(5/10)想加入桌1，但桌1有王五(5/10,无所谓)，可以通过换位解决
  // 王五(5/10,无所谓)可以换到桌2和赵六(5/10,无所谓)同桌
  const guest = createGuest('g1', '张三', [5, 10], true, []);
  const tables = [
    createTable(1, [
      createGuest('g2', '王五', [5, 10], true)
    ]),
    createTable(2, [
      createGuest('g3', '李四', [5, 10], true)
    ])
  ];

  const suggestions = findMigrationSuggestions(guest, tables);

  // 王五无法被移走，因为移到桌2后，桌2有李四(5/10)，王五(5/10)可以加入
  // 但桌1空出来后，张三(5/10)可以加入
  // 所以应该找到换位建议
  if (assert(suggestions.length > 0, `应该找到换位建议`)) passed++; else failed++;

  if (suggestions.length > 0) {
    // 建议应该包含正确的桌号
    const suggestion = suggestions[0];
    if (assertEqual(suggestion.fromTable, 1, `从桌1换出`)) passed++; else failed++;
    if (assertEqual(suggestion.toTable, 2, `换到桌2`)) passed++; else failed++;
  }

  console.log(`智能换位测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 测试智能换位 - 无所谓场景
 */
function testMigrationWithAny() {
  console.log('\n=== 测试智能换位 - 无所谓场景 ===');

  let passed = 0;
  let failed = 0;

  // 场景1：新客(无所谓)加入有(不接受)的桌，需要换位
  // 张三(无所谓)想加入桌1(王五不接受)
  const guest1 = createGuest('g1', '张三', [5, 10], 'any', []);
  const tables1 = [
    createTable(1, [
      createGuest('g2', '王五', [5, 10], false)
    ]),
    createTable(2, [
      createGuest('g3', '李四', [5, 10], true)
    ])
  ];

  // 张三(无所谓)可以直接加入任何桌，不需要换位
  const suggestions1 = findMigrationSuggestions(guest1, tables1);
  // 这个场景不需要换位建议，因为张三可以直接加入
  if (assert(suggestions1.length === 0, `张三无所谓可以直接加入，无需换位`)) passed++; else failed++;

  // 场景2：新客(不接受)加入有(无所谓+接受)的桌
  // 王五(不接受)想加入桌1(张三无所谓+李四接受)
  const guest2 = createGuest('g4', '王五', [5, 10], false, []);
  const tables2 = [
    createTable(1, [
      createGuest('g5', '张三', [5, 10], 'any'),
      createGuest('g6', '李四', [5, 10], true)
    ]),
    createTable(2, [
      createGuest('g7', '赵六', [5, 10], false)
    ])
  ];

  // 移除李四后，王五(不接受)可以和桌1的张三(无所谓)同桌
  // 李四(接受)可以移到桌2和赵六(不接受)... 不行，赵六不接受
  // 所以需要找到能把某个接受的人移走来解决
  const suggestions2 = findMigrationSuggestions(guest2, tables2);
  if (assert(suggestions2.length > 0, `王五(不接受)加入桌1(无所谓+接受)，应找到换位建议`)) passed++; else failed++;

  // 场景3：多人无所谓混合桌
  // 孙七(无所谓)想加入桌1(张三无所谓+李四接受+王五无所谓)
  const guest3 = createGuest('g8', '孙七', [5, 10], false, []);
  const tables3 = [
    createTable(1, [
      createGuest('g9', '张三', [5, 10], 'any'),
      createGuest('g10', '李四', [5, 10], true),
      createGuest('g11', '王五', [5, 10], 'any')
    ]),
    createTable(2, [])
  ];

  const suggestions3 = findMigrationSuggestions(guest3, tables3);
  // 移除李四后，桌1有张三(无所谓)+王五(无所谓)，孙七(无所谓)可以加入
  // 李四(接受)可以移到空桌2
  if (assert(suggestions3.length > 0, `孙七(不接受)加入混合桌，应找到换位建议`)) passed++; else failed++;

  console.log(`智能换位无所谓场景测试: ${passed}/${passed + failed} 通过`);
  return { passed, failed };
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     茶馆组局 - 派桌规则测试用例        ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [
    testAmountCompatibility(),
    testSmokeCompatibility(),
    testSocialCompatibility(),
    testOverallCompatibility(),
    testTableAmount(),
    testTableSorting(),
    testMigration(),
    testMigrationWithAny()
  ];

  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const total = totalPassed + totalFailed;

  console.log('\n╔════════════════════════════════════════╗');
  console.log(`║     测试结果: ${totalPassed}/${total} 通过                   ║`);
  if (totalFailed > 0) {
    console.log(`║     失败: ${totalFailed} 个测试                       ║`);
  }
  console.log('╚════════════════════════════════════════╝');

  return totalFailed === 0;
}

// 运行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境运行
  window.addEventListener('load', () => {
    runAllTests();
  });
} else if (typeof module !== 'undefined') {
  // 在 Node.js 环境运行
  runAllTests();
}
