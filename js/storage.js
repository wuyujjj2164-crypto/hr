// Storage 封装层 - 支持 CloudBase 云函数 + localStorage 降级

const STORAGE_KEY = 'tcamp_intern_dashboard_v1';

const Storage = {
  // 内存缓存
  _cache: null,
  _useCloud: false,
  _initialized: false,

  // 初始化：优先尝试云端，失败则回退 localStorage
  async init() {
    if (this._initialized) return;

    try {
      // 尝试云端初始化
      const initResult = await API.initData();
      if (initResult) {
        this._useCloud = true;
        console.log('Cloud mode enabled');
      }
    } catch (e) {
      console.log('Cloud init failed, falling back to localStorage');
    }

    // 如果云端不可用，使用 localStorage
    if (!this._useCloud) {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        const initialData = {
          interns: generateInterns(),
          mentors: MENTORS,
          currentRole: null,
          currentUserId: null,
          initialized: true
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      } else {
        // 修复已存在的旧数据：删除最新一周预生成日志，留出空间让实习生自己写
        const data = JSON.parse(existing);
        let modified = false;
        for (const intern of data.interns || []) {
          const targetWeek = intern.currentWeek - 1;
          if (intern.logs && intern.logs.some(l => l.week === targetWeek)) {
            intern.logs = intern.logs.filter(l => l.week !== targetWeek);
            modified = true;
          }
        }
        if (modified) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          console.log('Fixed pre-generated logs in localStorage');
        }
      }
    }

    this._initialized = true;
  },

  // 判断当前使用哪种存储（同时检查 API 层的 auth 状态）
  _shouldUseCloud() {
    return this._useCloud && !API._authFailed;
  },

  // 获取完整数据（用于内存缓存同步）
  async _getAllData() {
    if (this._shouldUseCloud()) {
      const interns = await API.getInterns() || [];
      const mentors = await API.getMentors() || [];
      const config = await API.getConfig() || { currentRole: null, currentUserId: null };
      return { interns, mentors, ...config };
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { interns: [], mentors: [], currentRole: null, currentUserId: null };
    }
  },

  // 获取所有实习生
  async getInterns() {
    if (this._shouldUseCloud()) {
      return await API.getInterns() || [];
    }
    return this.getAll()?.interns || [];
  },

  // 获取单个实习生
  async getIntern(id) {
    if (this._shouldUseCloud()) {
      return await API.getIntern(id);
    }
    const data = this.getAll();
    return data?.interns?.find(i => i.id === id);
  },

  // 更新实习生（云端模式只更新指定字段，本地模式全量替换）
  async updateIntern(intern) {
    if (this._shouldUseCloud()) {
      const result = await API.updateIntern(intern.id, intern);
      if (result && result.updated > 0) return result;
      console.log('Cloud updateIntern failed, falling back to localStorage');
    }
    const data = this.getAll();
    const idx = data.interns.findIndex(i => i.id === intern.id);
    if (idx >= 0) {
      data.interns[idx] = intern;
      this.saveAll(data);
    }
  },

  // 获取所有导师
  async getMentors() {
    if (this._shouldUseCloud()) {
      return await API.getMentors() || [];
    }
    return this.getAll()?.mentors || [];
  },

  // 获取单个导师
  async getMentor(id) {
    if (this._shouldUseCloud()) {
      return await API.getMentor(id);
    }
    const data = this.getAll();
    return data?.mentors?.find(m => m.id === id);
  },

  // 设置角色
  async setRole(role, userId) {
    if (this._shouldUseCloud()) {
      const result = await API.setConfig({ currentRole: role, currentUserId: userId });
      if (result) return result;
    }
    const data = this.getAll();
    data.currentRole = role;
    data.currentUserId = userId;
    this.saveAll(data);
  },

  // 获取角色
  async getRole() {
    if (this._shouldUseCloud()) {
      const config = await API.getConfig();
      if (config) return { role: config?.currentRole, userId: config?.currentUserId };
    }
    const data = this.getAll();
    return { role: data?.currentRole, userId: data?.currentUserId };
  },

  // 添加日志
  async addLog(internId, log) {
    if (this._shouldUseCloud()) {
      const result = await API.addLog(internId, log);
      if (result && !result.error) return result;
      console.log('Cloud addLog failed, falling back to localStorage');
    }
    const intern = await this.getIntern(internId);
    if (intern) {
      intern.logs.push(log);
      await this.updateIntern(intern);
    }
  },

  // 更新任务
  async updateTask(internId, taskId, completed) {
    if (this._shouldUseCloud()) {
      const result = await API.updateTask(internId, taskId, completed);
      if (result && !result.error) return result;
      console.log('Cloud updateTask failed, falling back to localStorage');
    }
    const intern = await this.getIntern(internId);
    if (intern) {
      const task = intern.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = completed;
        await this.updateIntern(intern);
      }
    }
  },

  // 添加任务（导师分配）
  async addTask(internId, task) {
    if (this._shouldUseCloud()) {
      const result = await API.addTask(internId, task);
      if (result && !result.error) return result;
      console.log('Cloud addTask failed, falling back to localStorage');
    }
    const intern = await this.getIntern(internId);
    if (intern) {
      intern.tasks = intern.tasks || [];
      intern.tasks.push(task);
      await this.updateIntern(intern);
    }
  },

  // 删除任务
  async deleteTask(internId, taskId) {
    if (this._shouldUseCloud()) {
      const result = await API.deleteTask(internId, taskId);
      if (result && !result.error) return result;
      console.log('Cloud deleteTask failed, falling back to localStorage');
    }
    const intern = await this.getIntern(internId);
    if (intern) {
      intern.tasks = intern.tasks.filter(t => t.id !== taskId);
      await this.updateIntern(intern);
    }
  },

  // 添加聊天记录
  async addChat(role, message, isUser) {
    if (this._shouldUseCloud()) {
      // 云端暂不支持聊天记录，存本地
      const key = `tcamp_chat_${role}`;
      const chats = JSON.parse(localStorage.getItem(key) || '[]');
      chats.push({ message, isUser, time: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(chats));
      return;
    }
    const data = this.getAll();
    if (!data.chats) data.chats = {};
    if (!data.chats[role]) data.chats[role] = [];
    data.chats[role].push({ message, isUser, time: new Date().toISOString() });
    this.saveAll(data);
  },

  // 获取聊天记录
  async getChats(role) {
    if (this._shouldUseCloud()) {
      const key = `tcamp_chat_${role}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
    return this.getAll()?.chats?.[role] || [];
  },

  // 添加日志评论
  async addLogComment(internId, week, comment) {
    if (this._shouldUseCloud()) {
      const result = await API.addLogComment(internId, week, comment);
      if (result && !result.error) return result;
      console.log('Cloud addLogComment failed, falling back to localStorage');
    }
    const intern = await this.getIntern(internId);
    if (intern) {
      const log = intern.logs.find(l => l.week === week);
      if (log) {
        if (!log.comments) log.comments = [];
        log.comments.push(comment);
        await this.updateIntern(intern);
      }
    }
  },

  // ===== 以下方法纯前端计算，不依赖存储后端 =====

  // 通知相关
  getNotifications(role, userId) {
    const notifications = [];
    const today = new Date().toISOString().split('T')[0];

    // 获取实习生数据（从缓存或同步读取）
    const interns = this._getSyncInterns();

    if (role === 'intern') {
      const intern = interns.find(i => i.id === userId);
      if (intern) {
        const overdueTasks = intern.tasks.filter(t => !t.completed && t.deadline < today);
        if (overdueTasks.length > 0) {
          notifications.push({ type: 'warning', text: `你有 ${overdueTasks.length} 个任务已逾期，请尽快完成` });
        }
        const hasCurrentLog = intern.logs.some(l => l.week === intern.currentWeek - 1);
        if (!hasCurrentLog && intern.currentWeek > 1) {
          notifications.push({ type: 'info', text: `别忘了写第${intern.currentWeek - 1}周的日志哦` });
        }
        const newComments = intern.logs.reduce((sum, l) => sum + (l.comments || []).filter(c => c.role === 'mentor').length, 0);
        if (newComments > 0) {
          notifications.push({ type: 'success', text: `导师给你的日志留了 ${newComments} 条评论，快去看看` });
        }
      }
    }

    if (role === 'mentor') {
      const mentors = this._getSyncMentors();
      const mentor = mentors.find(m => m.id === userId);
      if (mentor) {
        const mentees = interns.filter(i => i.mentorId === mentor.id);
        const silentMentees = mentees.filter(i => i.logs.length === 0 && i.currentWeek > 1);
        if (silentMentees.length > 0) {
          notifications.push({ type: 'warning', text: `有 ${silentMentees.length} 名实习生尚未提交日志` });
        }
        mentees.forEach(i => {
          const overdueTasks = i.tasks.filter(t => !t.completed && t.deadline < today);
          if (overdueTasks.length > 0) {
            notifications.push({ type: 'danger', text: `${i.name} 有 ${overdueTasks.length} 个任务已逾期` });
          }
        });
      }
    }

    if (role === 'hr') {
      const silent = interns.filter(i => i.logs.length === 0 && i.currentWeek > 1);
      if (silent.length > 0) {
        notifications.push({ type: 'warning', text: `全公司 ${silent.length} 名实习生尚未提交任何日志` });
      }
      const riskCount = interns.filter(i => i.status === 'risk').length;
      if (riskCount > 0) {
        notifications.push({ type: 'danger', text: `有 ${riskCount} 名实习生被评为风险状态，请关注` });
      }
    }

    return notifications;
  },

  // 同步获取实习生（用于通知计算）
  _getSyncInterns() {
    if (!this._useCloud) {
      return this.getAll()?.interns || [];
    }
    // 云端模式下，通知计算依赖 App 已加载的数据
    return window._appData?.interns || [];
  },

  // 同步获取导师
  _getSyncMentors() {
    if (!this._useCloud) {
      return this.getAll()?.mentors || [];
    }
    return window._appData?.mentors || [];
  },

  // ===== localStorage 兼容方法 =====

  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // 导出所有数据
  exportData() {
    const data = this.getAll();
    return JSON.stringify(data, null, 2);
  },

  // 导入数据
  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data && data.interns && data.mentors) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.init();
  }
};
