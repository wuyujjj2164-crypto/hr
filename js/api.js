// 前端 API 封装 - 调用 CloudBase 云函数

// 初始化 CloudBase 应用
let cloudApp = null;
if (typeof cloudbase !== 'undefined') {
  cloudApp = cloudbase.init({
    env: 'zuoye-d1gabtew72ef97c74'
  });
}

const API = {
  _useCloud: !!cloudApp,
  _authReady: false,
  _authFailed: false,

  // 匿名登录（CloudBase 云函数调用需要先登录）
  async ensureAuth() {
    if (this._authReady || !cloudApp || this._authFailed) return;
    try {
      const auth = cloudApp.auth();
      if (!auth || typeof auth.signInAnonymously !== 'function') {
        console.log('Anonymous login not supported in this SDK version');
        this._authFailed = true;
        return;
      }
      await auth.signInAnonymously();
      this._authReady = true;
      console.log('CloudBase anonymous login success');
    } catch (e) {
      console.log('Anonymous login failed:', e.message);
      this._authFailed = true;
    }
  },

  // 使用 CloudBase JS SDK 的 callFunction 调用云函数
  async call(action, data = {}) {
    if (!this._useCloud || !cloudApp || this._authFailed) {
      console.log('CloudBase not available, falling back to localStorage');
      return null;
    }

    // 确保已匿名登录
    await this.ensureAuth();

    // 如果登录失败，回退到 localStorage
    if (this._authFailed) {
      console.log('Auth failed, falling back to localStorage');
      return null;
    }

    try {
      const result = await cloudApp.callFunction({
        name: 'api',
        data: { action, data }
      });

      if (result.result && result.result.success) {
        return result.result.data;
      } else {
        console.error('API Error:', result.result);
        return null;
      }
    } catch (err) {
      console.error('Cloud function call failed:', err);
      // 权限错误时标记云端不可用，后续调用直接回退本地
      if (err.message && err.message.includes('PERMISSION_DENIED')) {
        this._authFailed = true;
      }
      return null;
    }
  },

  // 初始化数据库（首次使用）
  async initData() {
    return await this.call('initData');
  },

  // 获取所有实习生
  async getInterns() {
    return await this.call('getInterns');
  },

  // 获取单个实习生
  async getIntern(id) {
    return await this.call('getIntern', { id });
  },

  // 更新实习生
  async updateIntern(id, data) {
    return await this.call('updateIntern', { id, data });
  },

  // 添加日志
  async addLog(internId, log) {
    return await this.call('addLog', { internId, log });
  },

  // 更新任务
  async updateTask(internId, taskId, completed) {
    return await this.call('updateTask', { internId, taskId, completed });
  },

  // 获取所有导师
  async getMentors() {
    return await this.call('getMentors');
  },

  // 获取单个导师
  async getMentor(id) {
    return await this.call('getMentor', { id });
  },

  // 获取配置
  async getConfig() {
    return await this.call('getConfig');
  },

  // 设置配置
  async setConfig(config) {
    return await this.call('setConfig', { config });
  },

  // 添加日志评论
  async addLogComment(internId, week, comment) {
    return await this.call('addLogComment', { internId, week, comment });
  },

  // 添加任务（导师分配）
  async addTask(internId, task) {
    return await this.call('addTask', { internId, task });
  },

  // 删除任务
  async deleteTask(internId, taskId) {
    return await this.call('deleteTask', { internId, taskId });
  }
};
