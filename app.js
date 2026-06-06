// ============================================================
//  学生记账本 - 核心逻辑
// ============================================================

// ---------- 常量 ----------
const STORAGE_KEY_TRANSACTIONS = 'money_transactions';
const STORAGE_KEY_BUDGETS = 'money_budgets';

const EXPENSE_CATEGORIES = [
  { key: 'food',      label: '🍔 餐饮',     icon: '🍔' },
  { key: 'transport', label: '🚌 交通',     icon: '🚌' },
  { key: 'study',     label: '📚 学习',     icon: '📚' },
  { key: 'shopping',  label: '🛍 购物',     icon: '🛍' },
  { key: 'entertain', label: '🎮 娱乐',     icon: '🎮' },
  { key: 'housing',   label: '🏠 住宿',     icon: '🏠' },
  { key: 'medical',   label: '💊 医疗',     icon: '💊' },
  { key: 'digital',   label: '📱 数码',     icon: '📱' },
  { key: 'social',    label: '🎁 社交',     icon: '🎁' },
  { key: 'other',     label: '📦 其他',     icon: '📦' },
];

const INCOME_CATEGORIES = [
  { key: 'salary',    label: '💼 兼职/实习', icon: '💼' },
  { key: 'allowance', label: '🏠 生活费',     icon: '🏠' },
  { key: 'scholarship', label: '🎓 奖学金',  icon: '🎓' },
  { key: 'gift',      label: '🎁 红包/礼物',  icon: '🎁' },
  { key: 'refund',    label: '↩️ 退款',      icon: '↩️' },
  { key: 'other_inc', label: '📦 其他收入',   icon: '📦' },
];

// ---------- 数据存取 ----------
function loadTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_TRANSACTIONS)) || [];
  } catch { return []; }
}

function saveTransactions(txs) {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs));
}

function loadBudgets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_BUDGETS)) || {};
  } catch { return {}; }
}

function saveBudgets(budgets) {
  localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
}

// ---------- 工具函数 ----------
function fmtMoney(n) {
  return '¥' + Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function getYearMonth(d) {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
}

function thisMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}

function getCategoryLabel(type, key) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = list.find(c => c.key === key);
  return found ? found.label : key;
}

function getCategoryIcon(type, key) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const found = list.find(c => c.key === key);
  return found ? found.icon : '📦';
}

// ========== 页面导航 ==========
function initNavigation() {
  // 统一的导航处理
  function handleNav(btn) {
    const page = btn.dataset.page;
    // 同步所有同类按钮的 active 状态
    document.querySelectorAll('.nav-btn, .bottom-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`[data-page="${page}"]`).forEach(b => b.classList.add('active'));
    // 切换页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    refreshPage(page);
  }

  // 桌面侧边栏导航
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => handleNav(btn));
  });

  // 手机底部导航栏
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => handleNav(btn));
  });
}

let currentPage = 'dashboard';

function refreshPage(page) {
  currentPage = page;
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'add': setupAddPage(); break;
    case 'history': renderHistory(); break;
    case 'stats': renderStats(); break;
    case 'budget': renderBudgetPage(); break;
  }
}

// ========== 仪表盘 ==========
function getMonthData(txs, ym) {
  return txs.filter(t => getYearMonth(t.date) === ym);
}

function renderDashboard() {
  const txs = loadTransactions();
  const ym = thisMonth();
  const monthTxs = getMonthData(txs, ym);

  const monthIncome  = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  const totalIncome  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  document.getElementById('monthly-income').textContent = fmtMoney(monthIncome);
  document.getElementById('monthly-expense').textContent = fmtMoney(monthExpense);
  document.getElementById('monthly-balance').textContent = fmtMoney(monthBalance);
  document.getElementById('total-balance').textContent = fmtMoney(totalBalance);

  // 预算进度条
  const budgets = loadBudgets();
  const budget = budgets[ym] || 0;
  document.getElementById('budget-display').textContent = fmtMoney(budget);
  document.getElementById('budget-used').textContent = fmtMoney(monthExpense);
  document.getElementById('budget-remain').textContent = fmtMoney(budget - monthExpense);
  const pct = budget > 0 ? Math.min(100, (monthExpense / budget) * 100) : 0;
  const bar = document.getElementById('budget-bar-fill');
  bar.style.width = pct + '%';
  if (pct >= 100) bar.style.background = '#ef4444';
  else if (pct >= 80) bar.style.background = '#f59e0b';
  else bar.style.background = 'linear-gradient(90deg, #22c55e, #4f6ef7)';

  // 近7天趋势图
  drawTrendChart(txs);
  // 本月分类饼图
  drawCategoryPie(monthTxs, 'categoryChart');
}

function drawTrendChart(txs) {
  const canvas = document.getElementById('trendChart');
  const ctx = canvas.getContext('2d');
  if (canvas._chart) canvas._chart.destroy();

  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(fmtDate(d));
  }

  const incomeData = days.map(day => {
    return txs.filter(t => t.type === 'income' && fmtDate(t.date) === day)
      .reduce((s, t) => s + t.amount, 0);
  });
  const expenseData = days.map(day => {
    return txs.filter(t => t.type === 'expense' && fmtDate(t.date) === day)
      .reduce((s, t) => s + t.amount, 0);
  });

  canvas._chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days.map(d => d.slice(5)),
      datasets: [
        {
          label: '收入',
          data: incomeData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#22c55e',
        },
        {
          label: '支出',
          data: expenseData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#ef4444',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '¥' + v } },
      },
    },
  });
}

function drawCategoryPie(monthTxs, canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  if (canvas._chart) canvas._chart.destroy();

  const expenseByCat = {};
  monthTxs.filter(t => t.type === 'expense').forEach(t => {
    expenseByCat[t.category] = (expenseByCat[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    canvas._chart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: ['暂无数据'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
    return;
  }

  const colors = ['#4f6ef7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

  canvas._chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(e => getCategoryLabel('expense', e[0])),
      datasets: [{
        data: entries.map(e => e[1]),
        backgroundColor: entries.map((_, i) => colors[i % colors.length]),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } },
        tooltip: { callbacks: { label: ctx2 => ctx2.label + ': ' + fmtMoney(ctx2.raw) } },
      },
    },
  });
}

// ========== 记一笔 ==========
function setupAddPage() {
  const typeRadio = document.querySelector('input[name="type"]:checked');
  updateCategorySelect(typeRadio ? typeRadio.value : 'expense');

  document.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener('change', () => updateCategorySelect(radio.value));
  });

  document.getElementById('date').value = fmtDate(new Date());
  document.getElementById('add-msg').className = 'msg';
  document.getElementById('add-msg').textContent = '';

  const form = document.getElementById('add-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const note = document.getElementById('note').value.trim();

    if (!amount || amount <= 0) return showMsg('请输入有效金额', 'error');
    if (!category) return showMsg('请选择分类', 'error');
    if (!date) return showMsg('请选择日期', 'error');

    const txs = loadTransactions();
    txs.push({
      id: Date.now(),
      type,
      amount,
      category,
      date,
      note: note || '',
      createdAt: new Date().toISOString(),
    });
    saveTransactions(txs);

    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    showMsg('✅ 记账成功！', 'success');

    // 如果仪表盘开着就刷新
    if (currentPage === 'dashboard') renderDashboard();
  };
}

function updateCategorySelect(type) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const select = document.getElementById('category');
  select.innerHTML = '<option value="">请选择分类</option>' +
    list.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
}

function showMsg(text, cls) {
  const el = document.getElementById('add-msg');
  el.textContent = text;
  el.className = 'msg ' + cls;
  setTimeout(() => { el.className = 'msg'; }, 3000);
}

// ========== 账目明细 ==========
function renderHistory() {
  populateFilterOptions();
  applyHistoryFilters();
}

function populateFilterOptions() {
  const txs = loadTransactions();

  // 分类筛选
  const catSelect = document.getElementById('filter-category');
  catSelect.innerHTML = '<option value="all">全部分类</option>' +
    [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c =>
      `<option value="${c.key}">${c.label}</option>`
    ).join('');

  // 月份筛选
  const months = [...new Set(txs.map(t => getYearMonth(t.date)))].sort().reverse();
  const monthSelect = document.getElementById('filter-month');
  monthSelect.innerHTML = '<option value="all">全部月份</option>' +
    months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function applyHistoryFilters() {
  const txs = loadTransactions();
  const filterType = document.getElementById('filter-type').value;
  const filterCat = document.getElementById('filter-category').value;
  const filterMonth = document.getElementById('filter-month').value;
  const filterSearch = document.getElementById('filter-search').value.toLowerCase();

  let filtered = [...txs];

  if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);
  if (filterCat !== 'all') filtered = filtered.filter(t => t.category === filterCat);
  if (filterMonth !== 'all') filtered = filtered.filter(t => getYearMonth(t.date) === filterMonth);
  if (filterSearch) filtered = filtered.filter(t => (t.note || '').toLowerCase().includes(filterSearch));

  // 按日期降序排列
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

  document.getElementById('filter-count').textContent = filtered.length;

  const total = filtered.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);
  document.getElementById('filter-total').textContent = fmtMoney(total);

  const listEl = document.getElementById('transaction-list');
  if (filtered.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">没有匹配的记录～</p>';
    return;
  }

  listEl.innerHTML = filtered.map(t => `
    <div class="transaction-item">
      <div class="tx-icon ${t.type}">${getCategoryIcon(t.type, t.category)}</div>
      <div class="tx-info">
        <div class="tx-category">${getCategoryLabel(t.type, t.category)}</div>
        ${t.note ? `<div class="tx-note">${escapeHtml(t.note)}</div>` : ''}
        <div class="tx-date">${fmtDate(t.date)}</div>
      </div>
      <div class="tx-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'}${fmtMoney(t.amount)}
      </div>
      <button class="tx-delete" onclick="deleteTx(${t.id})" title="删除">🗑</button>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function deleteTx(id) {
  if (!confirm('确定删除这条记录吗？此操作不可撤销。')) return;
  const txs = loadTransactions().filter(t => t.id !== id);
  saveTransactions(txs);
  renderHistory();
  if (currentPage === 'dashboard') renderDashboard();
}

function resetFilters() {
  document.getElementById('filter-type').value = 'all';
  document.getElementById('filter-category').value = 'all';
  document.getElementById('filter-month').value = 'all';
  document.getElementById('filter-search').value = '';
  applyHistoryFilters();
}

// 监听筛选变化
document.getElementById('filter-type').addEventListener('change', applyHistoryFilters);
document.getElementById('filter-category').addEventListener('change', applyHistoryFilters);
document.getElementById('filter-month').addEventListener('change', applyHistoryFilters);
document.getElementById('filter-search').addEventListener('input', applyHistoryFilters);

// ========== 统计分析 ==========
function renderStats() {
  const txs = loadTransactions();
  const months = [...new Set(txs.map(t => getYearMonth(t.date)))].sort();
  const select = document.getElementById('stats-month');
  select.innerHTML = '<option value="all">全部时间</option>' +
    months.map(m => `<option value="${m}">${m}</option>`).join('');

  drawStatsCharts(txs);
}

document.getElementById('stats-month').addEventListener('change', () => {
  const txs = loadTransactions();
  const val = document.getElementById('stats-month').value;
  const filtered = val === 'all' ? txs : txs.filter(t => getYearMonth(t.date) === val);
  drawStatsCharts(filtered);
});

function drawStatsCharts(txs) {
  drawMonthlyComparison(txs);
  drawStatsPie(txs);
  drawStatsBar(txs);
}

function drawMonthlyComparison(txs) {
  const canvas = document.getElementById('monthlyChart');
  const ctx = canvas.getContext('2d');
  if (canvas._chart) canvas._chart.destroy();

  const months = [...new Set(txs.map(t => getYearMonth(t.date)))].sort();
  if (months.length === 0) {
    canvas._chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: ['暂无数据'], datasets: [{ data: [0], backgroundColor: '#e2e8f0' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
    return;
  }

  const incomeData = months.map(m =>
    txs.filter(t => getYearMonth(t.date) === m && t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
  );
  const expenseData = months.map(m =>
    txs.filter(t => getYearMonth(t.date) === m && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
  );

  canvas._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: '收入', data: incomeData, backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 6 },
        { label: '支出', data: expenseData, backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: ctx2 => ctx2.dataset.label + ': ' + fmtMoney(ctx2.raw) } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '¥' + v } },
      },
    },
  });
}

function drawStatsPie(txs) {
  drawCategoryPie(txs, 'statsPieChart');
}

function drawStatsBar(txs) {
  const canvas = document.getElementById('statsBarChart');
  const ctx = canvas.getContext('2d');
  if (canvas._chart) canvas._chart.destroy();

  const expenseByCat = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    expenseByCat[t.category] = (expenseByCat[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    canvas._chart = new Chart(ctx, {
      type: 'bar',
      data: { labels: ['暂无数据'], datasets: [{ data: [0], backgroundColor: '#e2e8f0' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    });
    return;
  }

  const colors = ['#4f6ef7','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#6366f1','#14b8a6'];

  canvas._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(e => getCategoryLabel('expense', e[0])),
      datasets: [{
        label: '支出金额',
        data: entries.map(e => e[1]),
        backgroundColor: entries.map((_, i) => colors[i % colors.length]),
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx2 => fmtMoney(ctx2.raw) } },
      },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => '¥' + v } },
      },
    },
  });
}

// ========== 预算管理 ==========
function renderBudgetPage() {
  document.getElementById('budget-month').value = thisMonth();
  document.getElementById('budget-amount').value = '';

  const budgets = loadBudgets();
  const txs = loadTransactions();
  const listEl = document.getElementById('budget-list');

  const entries = Object.entries(budgets).sort((a, b) => b[0].localeCompare(a[0]));
  if (entries.length === 0) {
    listEl.innerHTML = '<h3>已设预算</h3><p class="empty-hint">暂无预算设置</p>';
    return;
  }

  listEl.innerHTML = '<h3>已设预算</h3>' + entries.map(([month, budget]) => {
    const spent = txs.filter(t => getYearMonth(t.date) === month && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
    let fillColor = '#22c55e';
    if (pct >= 100) fillColor = '#ef4444';
    else if (pct >= 80) fillColor = '#f59e0b';

    return `
      <div class="budget-item">
        <div class="budget-item-info">
          <span class="budget-item-month">${month}</span>
          <span class="budget-item-status">${spent > budget ? '⚠️ 超支' : pct >= 80 ? '⚡ 接近上限' : '✅ 正常'}</span>
        </div>
        <div class="budget-item-amounts">
          <div class="budget-item-budget">${fmtMoney(spent)} / ${fmtMoney(budget)}</div>
          <div class="budget-item-progress">
            <div class="budget-item-fill" style="width:${pct}%;background:${fillColor}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setBudget() {
  const month = document.getElementById('budget-month').value;
  const amount = parseFloat(document.getElementById('budget-amount').value);

  if (!month) return alert('请选择月份');
  if (!amount || amount < 0) return alert('请输入有效预算金额');

  const budgets = loadBudgets();
  budgets[month] = amount;
  saveBudgets(budgets);
  alert('✅ 预算设置成功！');
  renderBudgetPage();
}

// ========== 导出 CSV ==========
function exportCSV() {
  const txs = loadTransactions();
  if (txs.length === 0) { alert('暂无数据可导出'); return; }

  const header = '类型,金额,分类,日期,备注';
  const rows = txs.map(t => {
    const type = t.type === 'income' ? '收入' : '支出';
    const cat = getCategoryLabel(t.type, t.category).replace(/^[^\s]+\s/, '');
    return [type, t.amount.toFixed(2), cat, fmtDate(t.date), (t.note || '')].join(',');
  });

  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `记账记录_${thisMonth()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ========== 清空数据 ==========
function clearAll() {
  if (!confirm('⚠️ 确定要清空所有记账数据吗？此操作不可撤销！')) return;
  if (!confirm('再次确认：真的要删除全部数据？')) return;
  localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEY_BUDGETS);
  alert('已清空所有数据');
  refreshPage(currentPage);
}

// ========== 启动 ==========
function init() {
  initNavigation();
  // 默认加载仪表盘
  renderDashboard();
}

document.addEventListener('DOMContentLoaded', init);
