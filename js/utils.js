// 通用工具函数

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击
 */
function escapeHtml(str) {
  if (str == null) return '';
  if (typeof str !== 'string') str = String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 简化的防抖/节流锁，防止按钮重复提交
 */
const SubmitLock = {
  _locked: false,

  isLocked() {
    return this._locked;
  },

  lock() {
    this._locked = true;
  },

  unlock() {
    this._locked = false;
  },

  async run(fn) {
    if (this._locked) {
      console.log('[SubmitLock] 操作被阻止：上一个请求未完成');
      return;
    }
    this._locked = true;
    try {
      return await fn();
    } finally {
      this._locked = false;
    }
  }
};

/**
 * 计算当前周数（基于入职日期）
 * @param {string} joinDate - 入职日期，如 '2025-05-01'
 * @param {number} maxWeek - 最大周数，默认12
 * @returns {number} 当前周数 1~maxWeek
 */
function calculateCurrentWeek(joinDate, maxWeek = 12) {
  const base = new Date(joinDate);
  const now = new Date();
  const diffMs = now - base;
  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(maxWeek, diffWeeks));
}
