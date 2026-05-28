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

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    this.init();
  }
};
