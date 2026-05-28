// localStorage 封装层

const STORAGE_KEY = 'tcamp_intern_dashboard_v1';

const Storage = {
  init() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const initialData = {
        interns: generateInterns(),
        mentors: MENTORS,
        currentRole: null,
        currentUserId: null,
        initialized: true
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }
  },

  getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  saveAll(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  getInterns() {
    return this.getAll()?.interns || [];
  },

  getIntern(id) {
    return this.getInterns().find(i => i.id === id);
  },

  updateIntern(intern) {
    const data = this.getAll();
    const idx = data.interns.findIndex(i => i.id === intern.id);
    if (idx >= 0) {
      data.interns[idx] = intern;
      this.saveAll(data);
    }
  },

  getMentors() {
    return this.getAll()?.mentors || [];
  },

  getMentor(id) {
    return this.getMentors().find(m => m.id === id);
  },

  setRole(role, userId) {
    const data = this.getAll();
    data.currentRole = role;
    data.currentUserId = userId;
    this.saveAll(data);
  },

  getRole() {
    const data = this.getAll();
    return { role: data?.currentRole, userId: data?.currentUserId };
  },

  addLog(internId, log) {
    const intern = this.getIntern(internId);
    if (intern) {
      intern.logs.push(log);
      this.updateIntern(intern);
    }
  },

  updateTask(internId, taskId, completed) {
    const intern = this.getIntern(internId);
    if (intern) {
      const task = intern.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = completed;
        this.updateIntern(intern);
      }
    }
  },

  addChat(role, message, isUser) {
    const data = this.getAll();
    if (!data.chats) data.chats = {};
    if (!data.chats[role]) data.chats[role] = [];
    data.chats[role].push({ message, isUser, time: new Date().toISOString() });
    this.saveAll(data);
  },

  getChats(role) {
    return this.getAll()?.chats?.[role] || [];
  },

  addLogComment(internId, week, comment) {
    const intern = this.getIntern(internId);
    if (intern) {
      const log = intern.logs.find(l => l.week === week);
      if (log) {
        if (!log.comments) log.comments = [];
        log.comments.push(comment);
        this.updateIntern(intern);
      }
    }
  },

  // 通知相关
  getNotifications(role, userId) {
    const interns = this.getInterns();
    const notifications = [];
    const today = new Date().toISOString().split('T')[0];

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
        // 新评论提醒
        const newComments = intern.logs.reduce((sum, l) => sum + (l.comments || []).filter(c => c.role === 'mentor').length, 0);
        if (newComments > 0) {
          notifications.push({ type: 'success', text: `导师给你的日志留了 ${newComments} 条评论，快去看看` });
        }
      }
    }

    if (role === 'mentor') {
      const mentor = this.getMentor(userId);
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

  // 导出所有数据为 JSON 字符串
  exportData() {
    const data = this.getAll();
    return JSON.stringify(data, null, 2);
  },

  // 导入数据（覆盖当前）
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
