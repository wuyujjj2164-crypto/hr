// 主应用逻辑

const App = {
  currentView: 'select',
  currentRole: null,
  currentUserId: null,
  _data: { interns: [], mentors: [] },

  async init() {
    await Storage.init();
    await this.loadData();
    const saved = await Storage.getRole();
    if (saved.role) {
      this.currentRole = saved.role;
      this.currentUserId = saved.userId;
      // 恢复角色时非实习生需要验证密码
      if (saved.role !== 'intern' && sessionStorage.getItem('tcamp_auth_' + saved.role) !== 'true') {
        this.showRoleSelect();
        return;
      }
      this.showDashboard();
    } else {
      this.showRoleSelect();
    }
  },

  // 从后端/本地加载所有数据到内存缓存
  async loadData() {
    const data = await Storage._getAllData();
    this._data.interns = data.interns || [];
    this._data.mentors = data.mentors || [];
    window._appData = this._data;
  },

  // 内存同步读取方法
  getInterns() { return this._data.interns; },
  getIntern(id) { return this._data.interns.find(i => i.id === id); },
  getMentors() { return this._data.mentors; },
  getMentor(id) { return this._data.mentors.find(m => m.id === id); },

  // ===== 角色选择 =====
  showRoleSelect() {
    this.currentView = 'select';
    document.getElementById('role-select').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  },

  selectRole(role, userId) {
    if (role !== 'intern') {
      this.showPasswordModal(role, userId);
      return;
    }
    this.doSelectRole(role, userId);
  },

  showPasswordModal(role, userId) {
    if (sessionStorage.getItem('tcamp_auth_' + role) === 'true') {
      this.doSelectRole(role, userId);
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'password-modal';
    overlay.className = 'password-modal';
    overlay.innerHTML = `
      <div class="password-box">
        <h3>${role === 'mentor' ? '导师' : 'HR'}身份验证</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">请输入访问密码</p>
        <input type="password" id="password-input" placeholder="密码" onkeydown="if(event.key==='Enter')App.checkPassword('${role}', ${userId})">
        <div class="password-btns">
          <button class="role-switch-btn" onclick="document.getElementById('password-modal').remove()">取消</button>
          <button class="btn-primary" onclick="App.checkPassword('${role}', ${userId})">确认</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => document.getElementById('password-input').focus(), 50);
  },

  checkPassword(role, userId) {
    const input = document.getElementById('password-input').value;
    const passwords = { mentor: 'mentor2025', hr: 'hr2025' };
    if (input === passwords[role]) {
      sessionStorage.setItem('tcamp_auth_' + role, 'true');
      document.getElementById('password-modal').remove();
      this.doSelectRole(role, userId);
    } else {
      alert('密码错误，请重试');
    }
  },

  // 实习生身份选择弹窗
  showInternSelectModal() {
    const interns = window._appData?.interns || [];
    const overlay = document.createElement('div');
    overlay.id = 'intern-select-modal';
    overlay.className = 'password-modal';
    overlay.innerHTML = `
      <div class="password-box" style="max-width:400px">
        <h3>选择你的身份</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">请选择列表中的你的名字</p>
        <div class="form-group">
          <select id="intern-select-id" style="width:100%;padding:10px;border-radius:6px;border:1px solid #ddd">
            ${interns.map(i => `<option value="${i.id}">${escapeHtml(i.name)}（${escapeHtml(i.position)}）</option>`).join('')}
          </select>
        </div>
        <div class="password-btns">
          <button class="role-switch-btn" onclick="document.getElementById('intern-select-modal').remove()">取消</button>
          <button class="btn-primary" onclick="App.confirmInternSelect()">确认</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  confirmInternSelect() {
    const select = document.getElementById('intern-select-id');
    const internId = parseInt(select.value);
    document.getElementById('intern-select-modal').remove();
    this.doSelectRole('intern', internId);
  },

  async doSelectRole(role, userId) {
    this.currentRole = role;
    this.currentUserId = userId;
    await Storage.setRole(role, userId);
    this.showDashboard();
  },

  // ===== 主仪表盘 =====
  showDashboard() {
    document.getElementById('role-select').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';

    this.updateSidebar();
    this.updateHeader();

    // 默认显示第一个标签
    const tabs = this.getTabs();
    if (tabs.length > 0) {
      this.switchTab(tabs[0].id);
    }

    // 初始化AI助手
    AIAssistant.init(this.currentRole);
    AIAssistant.currentRole = this.currentRole;
    AIAssistant.currentUserId = this.currentUserId;

    // 点击页面其他地方关闭通知面板
    this._notifyOutsideHandler = (e) => {
      const panel = document.getElementById('notify-panel');
      const bell = document.querySelector('.header-notify');
      if (panel && bell && !bell.contains(e.target)) {
        panel.style.display = 'none';
      }
    };
    document.addEventListener('click', this._notifyOutsideHandler);
  },

  updateSidebar() {
    const sidebar = document.getElementById('sidebar');
    const tabs = this.getTabs();

    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="brand-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
        <div class="brand-text">成长导航</div>
      </div>
      ${tabs.map(t => `
        <button class="sidebar-tab" data-tab="${t.id}" onclick="App.switchTab('${t.id}')">
          <span class="tab-icon">${t.icon}</span>
          <span class="tab-label">${t.label}</span>
        </button>
      `).join('')}
      <div class="sidebar-footer">
        <button class="role-switch-btn" onclick="App.logout()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> 切换角色</button>
      </div>
    `;
  },

  updateHeader() {
    const header = document.getElementById('header');
    const user = this.getCurrentUser();
    const roleLabel = { intern: '实习生', mentor: '导师', hr: 'HR' }[this.currentRole];
    const notifications = Storage.getNotifications(this.currentRole, this.currentUserId);

    header.innerHTML = `
      <div class="header-title">${roleLabel}工作台</div>
      <div class="header-actions">
        ${this.currentRole !== 'intern' ? `
          <button class="header-btn" onclick="App.exportData()" title="导出数据">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="header-btn" onclick="App.importData()" title="导入数据">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
        ` : ''}
        <div class="header-notify" onclick="App.toggleNotifyPanel()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          ${notifications.length > 0 ? `<span class="notify-badge">${notifications.length}</span>` : ''}
          <div class="notify-panel" id="notify-panel" style="display:none">
            ${notifications.length === 0 ? '<div class="notify-empty">暂无通知</div>' : notifications.map(n => `<div class="notify-item ${n.type}">${n.text}</div>`).join('')}
          </div>
        </div>
        <div class="header-user">
          <img src="${user?.avatar || ''}" class="user-avatar" alt="">
          <span class="user-name">${user?.name || roleLabel}</span>
        </div>
      </div>
    `;
  },

  toggleNotifyPanel() {
    const panel = document.getElementById('notify-panel');
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  },

  exportData() {
    if (this.currentRole === 'intern') {
      alert('暂无权限');
      return;
    }
    const data = Storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcamp-intern-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData() {
    if (this.currentRole === 'intern') {
      alert('暂无权限');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (Storage.importData(ev.target.result)) {
          alert('数据导入成功，页面即将刷新');
          location.reload();
        } else {
          alert('数据格式错误，导入失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  },

  getCurrentUser() {
    if (this.currentRole === 'intern') {
      return this.getIntern(this.currentUserId);
    }
    if (this.currentRole === 'mentor') {
      return this.getMentor(this.currentUserId);
    }
    return { name: 'HR管理员', avatar: '' };
  },

  getTabs() {
    const tabs = {
      intern: [
        { id: 'roadmap', label: '成长路线图', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
        { id: 'tasks', label: '本周任务', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
        { id: 'logs', label: '成长日志', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
        { id: 'myEval', label: '我的评价', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
        { id: 'resources', label: '学习资源', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' }
      ],
      mentor: [
        { id: 'myInterns', label: '我的实习生', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
        { id: 'teachPlan', label: '带教计划', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
        { id: 'assignTask', label: '任务分配', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' },
        { id: 'viewLogs', label: '日志查看', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
        { id: 'evaluate', label: '评价反馈', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' }
      ],
      hr: [
        { id: 'dashboard', label: '数据大盘', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
        { id: 'risk', label: '风险预警', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
        { id: 'logStats', label: '日志统计', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' }
      ]
    };
    return tabs[this.currentRole] || [];
  },

  switchTab(tabId) {
    // 销毁旧图表，防止内存泄漏
    Charts.destroyAll();

    // 更新侧边栏激活状态
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // 渲染对应视图
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="loading">加载中...</div>';

    requestAnimationFrame(() => {
      switch (tabId) {
        case 'roadmap': this.renderRoadmap(content); break;
        case 'tasks': this.renderTasks(content); break;
        case 'logs': this.renderLogs(content); break;
        case 'myEval': this.renderMyEval(content); break;
        case 'resources': this.renderResources(content); break;
        case 'myInterns': this.renderMyInterns(content); break;
        case 'teachPlan': this.renderTeachPlan(content); break;
        case 'assignTask': this.renderAssignTask(content); break;
        case 'viewLogs': this.renderViewLogs(content); break;
        case 'evaluate': this.renderEvaluate(content); break;
        case 'dashboard': this.renderHRDashboard(content); break;
        case 'risk': this.renderRisk(content); break;
        case 'logStats': this.renderLogStats(content); break;
      }
    }, 100);
  },

  async logout() {
    this.currentRole = null;
    this.currentUserId = null;
    await Storage.setRole(null, null);
    sessionStorage.removeItem('tcamp_auth_mentor');
    sessionStorage.removeItem('tcamp_auth_hr');
    this.showRoleSelect();
  },

  showToast(message) {
    const existing = document.getElementById('toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10B981;color:#fff;padding:10px 24px;border-radius:20px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:fadeInDown 0.3s ease;';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.5s ease';
      setTimeout(() => toast.remove(), 500);
    }, 2500);
  },

  // ===== 实习生视图 =====
  renderRoadmap(container) {
    const intern = this.getIntern(this.currentUserId);
    const template = TEMPLATES[intern.position];

    container.innerHTML = `
      <div class="page-header">
        <h2>成长路线图</h2>
        <span class="badge badge-${intern.status}">${this.getStatusLabel(intern.status)}</span>
      </div>
      <div class="roadmap-timeline">
        ${template.map((week, idx) => {
          const weekNum = idx + 1;
          const isCurrent = weekNum === intern.currentWeek;
          const isPast = weekNum < intern.currentWeek;
          const isFuture = weekNum > intern.currentWeek;
          return `
            <div class="roadmap-item ${isCurrent ? 'current' : ''} ${isPast ? 'completed' : ''}">
              <div class="roadmap-dot">${isPast ? '✓' : weekNum}</div>
              <div class="roadmap-content">
                <div class="roadmap-week">第${weekNum}周 ${isCurrent ? '（当前）' : ''}</div>
                <div class="roadmap-title">${week.title}</div>
                <div class="roadmap-tasks">${week.tasks.map(t => `<span class="task-tag">${t}</span>`).join('')}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderTasks(container) {
    const intern = this.getIntern(this.currentUserId);
    // 按周分组，显示所有任务（不只是本周）
    const tasksByWeek = {};
    for (const task of intern.tasks) {
      if (!tasksByWeek[task.week]) tasksByWeek[task.week] = [];
      tasksByWeek[task.week].push(task);
    }
    const sortedWeeks = Object.keys(tasksByWeek).map(Number).sort((a, b) => a - b);

    const totalTasks = intern.tasks.length;
    const completedTasks = intern.tasks.filter(t => t.completed).length;
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    container.innerHTML = `
      <div class="page-header">
        <h2>我的任务</h2>
        <div class="progress-ring">
          <span class="progress-text">${overallProgress}%</span>
        </div>
      </div>
      <div class="tasks-total-info">共 ${totalTasks} 个任务，已完成 ${completedTasks} 个</div>
      ${sortedWeeks.length === 0 ? '<div class="empty-state">导师还未分配任务，请耐心等待~</div>' : ''}
      ${sortedWeeks.map(week => {
        const weekTasks = tasksByWeek[week];
        const weekCompleted = weekTasks.filter(t => t.completed).length;
        const isCurrentWeek = week === intern.currentWeek;
        return `
          <div class="task-week-section ${isCurrentWeek ? 'current-week' : ''}">
            <div class="task-week-header">
              <span class="task-week-label">第${week}周${isCurrentWeek ? '（本周）' : ''}</span>
              <span class="task-week-progress">${weekCompleted}/${weekTasks.length}</span>
            </div>
            <div class="tasks-list">
              ${weekTasks.map(task => `
                <div class="task-card ${task.completed ? 'completed' : ''}">
                  <div class="task-checkbox" onclick="App.toggleTask(${task.id})">${task.completed ? '☑' : '☐'}</div>
                  <div class="task-info">
                    <div class="task-title-row">
                      <span class="task-title">${escapeHtml(task.title)}</span>
                      ${task.source === 'mentor' ? '<span class="task-source-badge mentor">导师分配</span>' : '<span class="task-source-badge template">基础任务</span>'}
                    </div>
                    <div class="task-desc">${escapeHtml(task.description)}</div>
                    <div class="task-meta">
                      <span>截止：${task.deadline}</span>
                      ${task.assignedBy ? `<span class="task-assigned">分配人：导师</span>` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    `;
  },

  async toggleTask(taskId) {
    await SubmitLock.run(async () => {
      const intern = this.getIntern(this.currentUserId);
      const task = intern.tasks.find(t => t.id === taskId);
      if (!task) return;
      await Storage.updateTask(this.currentUserId, taskId, !task.completed);
      await this.loadData();
      this.renderTasks(document.getElementById('main-content'));
    });
  },

  renderLogs(container) {
    const intern = this.getIntern(this.currentUserId);
    const hasCurrentLog = intern.logs.some(l => l.week === intern.currentWeek - 1);

    container.innerHTML = `
      <div class="page-header">
        <h2>成长日志</h2>
        <span class="log-badge">已写 ${intern.logs.length} 篇</span>
      </div>

      ${!hasCurrentLog && intern.currentWeek > 1 ? `
        <div class="log-editor-card">
          <h3>写第${intern.currentWeek - 1}周成长日记</h3>
          <div class="form-group">
            <label>本周总结</label>
            <textarea id="log-summary" rows="3" placeholder="这周你学到了什么？完成了哪些任务？"></textarea>
          </div>
          <div class="form-group">
            <label>遇到的困难</label>
            <textarea id="log-difficulties" rows="2" placeholder="遇到了哪些挑战？"></textarea>
          </div>
          <div class="form-group">
            <label>下周计划</label>
            <textarea id="log-plan" rows="2" placeholder="下周打算做什么？"></textarea>
          </div>
          <button class="btn-primary" onclick="App.submitLog()">提交日志并获取AI反馈</button>
        </div>
      ` : intern.currentWeek <= 1 ? '<div class="empty-state">第1周还没结束，等周末再来写日志吧~</div>' : '<div class="empty-state">本周日志已提交，AI反馈已生成~</div>'}

      <div class="logs-history">
        <h3>历史日志</h3>
        ${intern.logs.slice().reverse().map(log => `
          <div class="log-card">
            <div class="log-header">
              <span class="log-week">第${log.week}周</span>
              <span class="log-date">${log.submittedAt}</span>
            </div>
            <div class="log-section">
              <strong>本周总结</strong>
              <p>${escapeHtml(log.summary)}</p>
            </div>
            <div class="log-section">
              <strong>遇到的困难</strong>
              <p>${escapeHtml(log.difficulties)}</p>
            </div>
            <div class="log-section">
              <strong>下周计划</strong>
              <p>${escapeHtml(log.nextWeekPlan)}</p>
            </div>
            ${log.aiFeedback ? `
              <div class="ai-feedback-box">
                <div class="ai-feedback-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>
                  AI 成长反馈
                </div>
                <p>${escapeHtml(log.aiFeedback)}</p>
              </div>
            ` : ''}
            ${(log.comments || []).length > 0 ? `
              <div class="log-comments">
                <div class="log-comments-title">导师点评</div>
                ${log.comments.map(c => `
                  <div class="log-comment">
                    <span class="comment-author">${escapeHtml(c.author)}</span>
                    <span class="comment-time">${escapeHtml(c.time)}</span>
                    <p>${escapeHtml(c.content)}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        ${intern.logs.length === 0 ? '<div class="empty-state">还没有日志记录~</div>' : ''}
      </div>
    `;
  },

  async submitLog() {
    await SubmitLock.run(async () => {
      try {
        const summary = document.getElementById('log-summary').value.trim();
        const difficulties = document.getElementById('log-difficulties').value.trim();
        const plan = document.getElementById('log-plan').value.trim();

        if (!summary) {
          alert('请填写本周总结');
          return;
        }

        const intern = this.getIntern(this.currentUserId);
        if (!intern) {
          alert('获取实习生信息失败，请刷新页面重试');
          return;
        }

        const week = intern.currentWeek - 1;
        const aiFeedback = this.generateLogFeedback(week, summary, difficulties, intern.position);

        const log = {
          week: week,
          summary: summary,
          difficulties: difficulties || '暂无',
          nextWeekPlan: plan || '暂无',
          aiFeedback: aiFeedback,
          submittedAt: new Date().toISOString().split('T')[0]
        };

        await Storage.addLog(this.currentUserId, log);
        await this.loadData();
        this.renderLogs(document.getElementById('main-content'));
        this.showToast('日志提交成功！AI反馈已生成');
      } catch (err) {
        console.error('[submitLog] ERROR:', err);
        alert('提交失败: ' + (err.message || '未知错误'));
      }
    });
  },

  generateLogFeedback(week, summary, difficulties, position) {
    const s = summary || '';
    const d = difficulties || '';
    const len = s.length;

    // ===== 1. 内容充实度评级 =====
    let richness = '';
    if (len < 20) {
      richness = '本周总结偏简短，建议下周可以多展开一些具体的案例和收获细节，让复盘更有价值。';
    } else if (len < 60) {
      richness = '总结内容比较清晰，如果能补充1-2个具体的数据或成果，会更具说服力。';
    } else {
      richness = '总结非常充实，能看出你对本周工作做了系统性的梳理，这种复盘习惯值得保持！';
    }

    // ===== 2. 关键词匹配：从总结中提取闪光点 =====
    const keywordMap = [
      { keys: ['bug','修复','debug','调试','性能','优化','重构','代码','git','commit','pr','review','单元测试','接口','api','数据库','sql','架构','设计模式','算法'], dim: '技术攻坚能力', praise: '你在技术细节上很扎实，能独立排查和解决问题。' },
      { keys: ['需求','prd','原型','figma','axure','用户调研','访谈','数据分析','埋点','转化率','ab测试','竞品','流程图','文档'], dim: '产品思维', praise: '你展现出了不错的产品敏感度，能从用户视角思考问题。' },
      { keys: ['客户','拜访','沟通','谈判','方案','合同','签约','成交','销售','话术','回款','客情','渠道'], dim: '业务拓展能力', praise: '你在客户沟通和商务推进上很有主动性，这是销售岗位的核心竞争力。' },
      { keys: ['会议','讨论','协作','配合','跨部门','对齐','同步','团队','分享','评审','反馈'], dim: '沟通协作能力', praise: '你非常注重团队协作，能有效推动信息同步和跨团队合作。' },
      { keys: ['学习','看书','课程','培训','研究','调研','沉淀','总结','文档','wiki','博客'], dim: '主动学习能力', praise: '你保持了很强的学习热情，能把输入转化为可沉淀的知识资产。' },
      { keys: ['独立','主导','负责','推进','落地','闭环','owner','owner意识','责任心'], dim: 'Owner意识', praise: '你有很强的责任心和推动力，能主动对结果负责，这是非常难得的品质。' }
    ];

    let matchedDim = '';
    let matchedPraise = '';
    let maxScore = 0;
    for (const item of keywordMap) {
      const score = item.keys.reduce((sum, k) => sum + (s.includes(k) ? 1 : 0), 0);
      if (score > maxScore) {
        maxScore = score;
        matchedDim = item.dim;
        matchedPraise = item.praise;
      }
    }
    if (!matchedDim) {
      matchedDim = '工作执行力';
      matchedPraise = '你在本周的任务执行上表现出了稳定的输出。';
    }

    // ===== 3. 困难点分析：给出针对性建议 =====
    const diffMap = [
      { keys: ['不熟悉','不懂','不会','第一次','陌生','不了解','没接触'], advice: '面对新领域，建议采用"小步快跑"策略：先跑通最小闭环，再逐步深入。别怕问问题，导师和文档都是你的资源。' },
      { keys: ['时间','来不及','加班','忙','排期','节奏','效率','拖延'], advice: '时间管理是职场必修课。建议每天早上用5分钟列出今日TOP3，把最难的任务放在精力最好的时段攻克。' },
      { keys: ['沟通','协调','对齐','推不动','不配合','信息差','理解偏差'], advice: '沟通问题往往源于信息不对称。建议重要结论都落到书面（邮件/文档），并主动确认对方理解是否一致。' },
      { keys: ['技术','代码','bug','报错','性能','架构','设计','难点'], advice: '技术难点建议先拆解：是知识盲区还是方案选择问题？知识盲区可以补，方案问题可以多和导师讨论trade-off。' },
      { keys: ['压力','焦虑','紧张','担心','害怕','没信心','迷茫'], advice: '有压力说明你在上坡路上。建议把大目标拆解成周目标，每完成一个小目标就给自己正反馈，积累信心。' },
      { keys: ['需求','变更','反复','不确定','老板','产品','客户','想法'], advice: '需求变更是常态。建议养成"变更即记录"的习惯，每次变更都同步到群里并确认影响范围，保护自己 also 保护项目。' }
    ];

    let matchedAdvice = '';
    maxScore = 0;
    for (const item of diffMap) {
      const score = item.keys.reduce((sum, k) => sum + (d.includes(k) ? 1 : 0), 0);
      if (score > maxScore) {
        maxScore = score;
        matchedAdvice = item.advice;
      }
    }
    if (!matchedAdvice) {
      matchedAdvice = '遇到困难是正常的成长信号。建议把问题拆解成"可控的小块"，逐个击破，同时善用团队资源。';
    }

    // ===== 4. 岗位专属建议 =====
    const positionTips = {
      '研发': '技术成长没有捷径，建议每周精读一篇团队优秀代码或技术文章，把学到的 pattern 记录下来，三个月后回头看会有惊喜。',
      '产品': '产品sense需要持续培养，建议多关注用户反馈渠道（客服、社群、评论），真正理解用户的痛点比画原型更重要。',
      '销售': '销售的核心是信任，建议每次客户沟通后都写一段简短的复盘：客户关注点是什么？我回应得怎么样？下次如何更好？'
    };
    const posTip = positionTips[position] || positionTips['研发'];

    // ===== 5. 组装反馈 =====
    return `【第${week}周成长反馈】\n\n${richness}\n\n我在你的总结中重点看到了「${matchedDim}」方面的亮点：${matchedPraise}\n\n关于你提到的困难——"${d.substring(0, 30)}${d.length > 30 ? '...' : ''}"，我的建议是：${matchedAdvice}\n\n【${position}岗位小贴士】${posTip}\n\n期待你在下周继续保持这种复盘节奏，持续成长！`;
  },

  renderMyEval(container) {
    const intern = this.getIntern(this.currentUserId);
    const scores = intern.scores || {};
    const hasEval = scores.learning > 0 || scores.comment;

    container.innerHTML = `
      <div class="page-header">
        <h2>我的评价</h2>
        <span class="badge badge-${intern.status}">${this.getStatusLabel(intern.status)}</span>
      </div>
      ${!hasEval ? '<div class="empty-state">导师尚未对你进行评价，继续努力哦~</div>' : ''}
      ${hasEval ? `
        <div class="chart-card">
          <h3>能力雷达图</h3>
          <div class="chart-container" style="height:300px"><canvas id="chart-my-radar"></canvas></div>
        </div>
        <div class="card" style="margin-top:20px">
          <h3>四维度评分</h3>
          <div class="eval-scores">
            <div class="score-item">
              <label>学习能力</label>
              <div class="score-bar"><div class="score-fill" style="width:${scores.learning || 0}%"></div></div>
              <span>${scores.learning || 0}分</span>
            </div>
            <div class="score-item">
              <label>业务理解</label>
              <div class="score-bar"><div class="score-fill" style="width:${scores.business || 0}%"></div></div>
              <span>${scores.business || 0}分</span>
            </div>
            <div class="score-item">
              <label>团队协作</label>
              <div class="score-bar"><div class="score-fill" style="width:${scores.teamwork || 0}%"></div></div>
              <span>${scores.teamwork || 0}分</span>
            </div>
            <div class="score-item">
              <label>产出质量</label>
              <div class="score-bar"><div class="score-fill" style="width:${scores.output || 0}%"></div></div>
              <span>${scores.output || 0}分</span>
            </div>
          </div>
        </div>
        ${scores.comment ? `
          <div class="card" style="margin-top:20px">
            <h3>导师评语</h3>
            <div class="eval-comment-box">${escapeHtml(scores.comment)}</div>
          </div>
        ` : ''}
      ` : ''}
    `;

    if (hasEval) {
      requestAnimationFrame(() => {
        const ctx = document.getElementById('chart-my-radar');
        if (ctx) Charts.capabilityRadar(ctx, scores);
      });
    }
  },

  renderResources(container) {
    const intern = this.getIntern(this.currentUserId);
    const resources = RESOURCES[intern.position] || [];

    container.innerHTML = `
      <div class="page-header">
        <h2>学习资源</h2>
        <span>${intern.position}岗位推荐</span>
      </div>
      <div class="resources-grid">
        ${resources.map(r => `
          <div class="resource-card">
            <div class="resource-type">${r.type}</div>
            <div class="resource-title">${r.title}</div>
            <a href="${r.url}" class="resource-link" target="_blank">查看 >></a>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ===== 导师视图 =====
  renderMyInterns(container) {
    const mentor = this.getMentor(this.currentUserId);
    const interns = this.getInterns().filter(i => i.mentorId === mentor.id);

    container.innerHTML = `
      <div class="page-header">
        <h2>我的实习生</h2>
        <span>共 ${interns.length} 人</span>
      </div>
      <div class="interns-grid">
        ${interns.map(i => {
          const progress = i.tasks.length > 0 ? Math.round(i.tasks.filter(t => t.completed).length / i.tasks.length * 100) : 0;
          return `
            <div class="intern-card">
              <img src="${i.avatar}" class="intern-avatar" alt="">
              <div class="intern-info">
                <div class="intern-name">${i.name}</div>
                <div class="intern-meta">${i.position} · 第${i.currentWeek}周</div>
                <div class="intern-progress">
                  <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
                  <span>${progress}%</span>
                </div>
              </div>
              <span class="badge badge-${i.status}">${this.getStatusLabel(i.status)}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderTeachPlan(container) {
    const mentor = this.getMentor(this.currentUserId);
    const template = TEMPLATES[mentor.department];

    container.innerHTML = `
      <div class="page-header">
        <h2>${mentor.department}岗位带教计划</h2>
        <button class="btn-primary" onclick="App.applyTeachPlan()">一键应用</button>
      </div>
      <div class="plan-list">
        ${template.map((week, idx) => `
          <div class="plan-week">
            <div class="plan-week-header">
              <span>第${week.week}周</span>
              <strong>${week.title}</strong>
            </div>
            <div class="plan-tasks">
              ${week.tasks.map(t => `<div class="plan-task"><span class="task-check">☐</span>${t}</div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async applyTeachPlan() {
    await SubmitLock.run(async () => {
      const mentor = this.getMentor(this.currentUserId);
      const interns = this.getInterns().filter(i => i.mentorId === mentor.id);
      const template = TEMPLATES[mentor.department];
      if (!template) return;

      if (!confirm(`将为 ${interns.length} 名实习生应用 ${mentor.department} 岗位带教计划，是否继续？`)) return;

      let addedCount = 0;
      for (const intern of interns) {
        const existingWeeks = new Set(intern.tasks.filter(t => t.source === 'template').map(t => t.week));
        let taskId = intern.tasks.length > 0 ? Math.max(...intern.tasks.map(t => t.id)) : 0;

        for (const weekPlan of template) {
          if (existingWeeks.has(weekPlan.week)) continue;
          for (const taskTitle of weekPlan.tasks) {
            taskId++;
            const task = {
              id: taskId,
              internId: intern.id,
              week: weekPlan.week,
              title: taskTitle,
              description: `${mentor.department}岗位第${weekPlan.week}周基础任务：${taskTitle}`,
              completed: false,
              deadline: getWeekDeadline(weekPlan.week),
              source: 'template'
            };
            intern.tasks.push(task);
            addedCount++;
          }
        }
        await Storage.updateIntern(intern);
      }
      await this.loadData();
      this.showToast(`带教计划应用成功！共新增 ${addedCount} 个任务`);
      this.renderTeachPlan(document.getElementById('main-content'));
    });
  },

  renderAssignTask(container) {
    const mentor = this.getMentor(this.currentUserId);
    const interns = this.getInterns().filter(i => i.mentorId === mentor.id);

    // 收集所有已分配的任务（按实习生分组）
    const allAssignedTasks = [];
    for (const intern of interns) {
      for (const task of intern.tasks) {
        if (task.source === 'mentor') {
          allAssignedTasks.push({ ...task, internName: intern.name });
        }
      }
    }
    allAssignedTasks.sort((a, b) => b.id - a.id);

    container.innerHTML = `
      <div class="page-header">
        <h2>任务分配</h2>
        <span>给实习生布置具体任务</span>
      </div>
      <div class="form-card">
        <div class="form-group">
          <label>选择实习生</label>
          <select id="task-intern" onchange="App.onInternSelectChange()">
            ${interns.map(i => `<option value="${i.id}" data-week="${i.currentWeek}">${i.name}（${i.position} · 第${i.currentWeek}周）</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>第几周</label>
          <select id="task-week">
            ${[...Array(12)].map((_, i) => `<option value="${i + 1}">第${i + 1}周</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>任务标题</label>
          <input type="text" id="task-title" placeholder="例如：完成需求文档">
        </div>
        <div class="form-group">
          <label>任务描述</label>
          <textarea id="task-desc" rows="3" placeholder="详细描述任务要求和验收标准"></textarea>
        </div>
        <div class="form-group">
          <label>截止日期</label>
          <input type="date" id="task-deadline">
        </div>
        <button class="btn-primary" onclick="App.createTask()">分配任务</button>
      </div>

      ${allAssignedTasks.length > 0 ? `
        <div class="assigned-tasks-section">
          <h3>已分配任务（${allAssignedTasks.length}个）</h3>
          <div class="assigned-tasks-list">
            ${allAssignedTasks.map(task => `
              <div class="assigned-task-card ${task.completed ? 'completed' : ''}">
                <div class="assigned-task-header">
                  <span class="assigned-task-intern">${task.internName}</span>
                  <span class="assigned-task-week">第${task.week}周</span>
                  <button class="btn-delete" onclick="App.deleteAssignedTask(${task.internId}, ${task.id})">删除</button>
                </div>
                <div class="assigned-task-title">${escapeHtml(task.title)}</div>
                <div class="assigned-task-desc">${escapeHtml(task.description)}</div>
                <div class="assigned-task-meta">
                  <span>截止：${task.deadline}</span>
                  <span class="task-status ${task.completed ? 'done' : 'pending'}">${task.completed ? '已完成' : '进行中'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    // 默认选中第一个实习生的当前周
    this.onInternSelectChange();
    // 默认截止日期为一周后
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const deadlineInput = document.getElementById('task-deadline');
    if (deadlineInput) {
      deadlineInput.value = today.toISOString().split('T')[0];
    }
  },

  onInternSelectChange() {
    const select = document.getElementById('task-intern');
    const weekSelect = document.getElementById('task-week');
    if (!select || !weekSelect) return;
    const selectedOption = select.options[select.selectedIndex];
    const currentWeek = parseInt(selectedOption.dataset.week);
    // 默认选中实习生的当前周
    weekSelect.value = currentWeek;
  },

  async createTask() {
    await SubmitLock.run(async () => {
      try {
        const internId = parseInt(document.getElementById('task-intern').value);
        const week = parseInt(document.getElementById('task-week').value);
        const title = document.getElementById('task-title').value.trim();
        const desc = document.getElementById('task-desc').value.trim();
        const deadline = document.getElementById('task-deadline').value;

        if (!title) { alert('请填写任务标题'); return; }

        const intern = this.getIntern(internId);
        const maxId = intern.tasks.length > 0 ? Math.max(...intern.tasks.map(t => t.id)) : 0;

        const task = {
          id: maxId + 1,
          internId,
          week,
          title,
          description: desc || title,
          completed: false,
          deadline: deadline || getWeekDeadline(week),
          source: 'mentor',
          assignedBy: this.currentUserId,
          assignedAt: new Date().toISOString().split('T')[0]
        };

        await Storage.addTask(internId, task);
        await this.loadData();
        this.showToast('任务分配成功！');
        document.getElementById('task-title').value = '';
        document.getElementById('task-desc').value = '';
        this.renderAssignTask(document.getElementById('main-content'));
      } catch (err) {
        console.error('[createTask] ERROR:', err);
        alert('任务分配失败: ' + (err.message || '未知错误'));
      }
    });
  },

  async deleteAssignedTask(internId, taskId) {
    if (!confirm('确定要删除这个任务吗？')) return;
    await SubmitLock.run(async () => {
      try {
        await Storage.deleteTask(internId, taskId);
        await this.loadData();
        this.showToast('任务已删除');
        this.renderAssignTask(document.getElementById('main-content'));
      } catch (err) {
        console.error('[deleteAssignedTask] ERROR:', err);
        alert('删除失败: ' + (err.message || '未知错误'));
      }
    });
  },

  renderViewLogs(container) {
    const mentor = this.getMentor(this.currentUserId);
    const interns = this.getInterns().filter(i => i.mentorId === mentor.id);

    container.innerHTML = `
      <div class="page-header">
        <h2>实习生日志</h2>
      </div>
      ${interns.map(i => `
        <div class="intern-logs-section">
          <div class="intern-logs-header">
            <img src="${i.avatar}" class="intern-avatar-sm" alt="">
            <span>${i.name}</span>
            <span class="badge badge-${i.status}">${this.getStatusLabel(i.status)}</span>
          </div>
          ${i.logs.length > 0 ? i.logs.slice().reverse().map(log => `
            <div class="log-card compact">
              <div class="log-header">
                <span class="log-week">第${log.week}周</span>
                <span class="log-date">${log.submittedAt}</span>
              </div>
              <p><strong>总结：</strong>${escapeHtml(log.summary)}</p>
              <p><strong>困难：</strong>${escapeHtml(log.difficulties)}</p>
              ${log.aiFeedback ? `
                <div class="ai-feedback-box small">
                  <strong>AI反馈：</strong>${escapeHtml(log.aiFeedback)}
                </div>
              ` : ''}
              ${(log.comments || []).length > 0 ? `
                <div class="log-comments">
                  ${log.comments.map(c => `
                    <div class="log-comment">
                      <span class="comment-author">${escapeHtml(c.author)}</span>
                      <span class="comment-time">${escapeHtml(c.time)}</span>
                      <p>${escapeHtml(c.content)}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              <div class="comment-input-row">
                <input type="text" id="comment-${i.id}-${log.week}" placeholder="写下你的点评..." onkeydown="if(event.key==='Enter')App.addLogComment(${i.id},${log.week})">
                <button class="btn-primary" onclick="App.addLogComment(${i.id},${log.week})">回复</button>
              </div>
            </div>
          `).join('') : '<div class="empty-state">暂无日志</div>'}
        </div>
      `).join('')}
    `;
  },

  async addLogComment(internId, week) {
    await SubmitLock.run(async () => {
      const input = document.getElementById(`comment-${internId}-${week}`);
      const content = input.value.trim();
      if (!content) return;
      const mentor = this.getMentor(this.currentUserId);
      await Storage.addLogComment(internId, week, {
        author: mentor ? mentor.name : '导师',
        role: 'mentor',
        content: content,
        time: new Date().toLocaleString('zh-CN')
      });
      await this.loadData();
      input.value = '';
      this.renderViewLogs(document.getElementById('main-content'));
    });
  },

  renderEvaluate(container) {
    const mentor = this.getMentor(this.currentUserId);
    const interns = this.getInterns().filter(i => i.mentorId === mentor.id);

    container.innerHTML = `
      <div class="page-header">
        <h2>评价反馈</h2>
      </div>
      <div class="form-card">
        <div class="form-group">
          <label>选择实习生</label>
          <select id="eval-intern" onchange="App.loadEvalScores()">
            ${interns.map(i => `<option value="${i.id}">${i.name}（${i.position}）</option>`).join('')}
          </select>
        </div>
        <div class="eval-scores" id="eval-scores">
          <div class="score-item">
            <label>学习能力</label>
            <input type="range" id="score-learning" min="0" max="100" value="70" oninput="document.getElementById('val-learning').textContent=this.value">
            <span id="val-learning">70</span>
          </div>
          <div class="score-item">
            <label>业务理解</label>
            <input type="range" id="score-business" min="0" max="100" value="70" oninput="document.getElementById('val-business').textContent=this.value">
            <span id="val-business">70</span>
          </div>
          <div class="score-item">
            <label>团队协作</label>
            <input type="range" id="score-teamwork" min="0" max="100" value="70" oninput="document.getElementById('val-teamwork').textContent=this.value">
            <span id="val-teamwork">70</span>
          </div>
          <div class="score-item">
            <label>产出质量</label>
            <input type="range" id="score-output" min="0" max="100" value="70" oninput="document.getElementById('val-output').textContent=this.value">
            <span id="val-output">70</span>
          </div>
        </div>
        <div class="form-group">
          <label>综合评价</label>
          <textarea id="eval-comment" rows="3" placeholder="写下你的综合评价和建议..."></textarea>
        </div>
        <button class="btn-primary" onclick="App.submitEval()">提交评价</button>
      </div>
    `;
  },

  loadEvalScores() {
    const internId = parseInt(document.getElementById('eval-intern').value);
    const intern = this.getIntern(internId);
    if (intern) {
      document.getElementById('score-learning').value = intern.scores.learning;
      document.getElementById('val-learning').textContent = intern.scores.learning;
      document.getElementById('score-business').value = intern.scores.business;
      document.getElementById('val-business').textContent = intern.scores.business;
      document.getElementById('score-teamwork').value = intern.scores.teamwork;
      document.getElementById('val-teamwork').textContent = intern.scores.teamwork;
      document.getElementById('score-output').value = intern.scores.output;
      document.getElementById('val-output').textContent = intern.scores.output;
      document.getElementById('eval-comment').value = intern.scores.comment || '';
    }
  },

  async submitEval() {
    await SubmitLock.run(async () => {
      const internId = parseInt(document.getElementById('eval-intern').value);
      const intern = this.getIntern(internId);
      if (intern) {
        const newScores = {
          learning: parseInt(document.getElementById('score-learning').value),
          business: parseInt(document.getElementById('score-business').value),
          teamwork: parseInt(document.getElementById('score-teamwork').value),
          output: parseInt(document.getElementById('score-output').value),
          comment: document.getElementById('eval-comment').value.trim()
        };
        intern.scores = newScores;
        const avg = (newScores.learning + newScores.business + newScores.teamwork + newScores.output) / 4;
        intern.status = avg >= 80 ? 'adapted' : avg >= 60 ? 'attention' : 'risk';
        if (intern.scoreHistory && intern.scoreHistory.length > 0) {
          const latest = intern.scoreHistory[intern.scoreHistory.length - 1];
          latest.learning = newScores.learning;
          latest.business = newScores.business;
          latest.teamwork = newScores.teamwork;
          latest.output = newScores.output;
        }
        await Storage.updateIntern(intern);
        await this.loadData();
        alert('评价提交成功！');
      }
    });
  },

  // ===== HR视图 =====
  renderHRDashboard(container) {
    const interns = this.getInterns();
    const adapted = interns.filter(i => i.status === 'adapted').length;
    const attention = interns.filter(i => i.status === 'attention').length;
    const risk = interns.filter(i => i.status === 'risk').length;

    container.innerHTML = `
      <div class="page-header">
        <h2>数据大盘</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${interns.length}</div>
          <div class="stat-label">实习生总数</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">${adapted}</div>
          <div class="stat-label">适应良好</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${attention}</div>
          <div class="stat-label">需关注</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">${risk}</div>
          <div class="stat-label">存在风险</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>岗位分布</h3>
          <div class="chart-container"><canvas id="chart-position"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>导师负载</h3>
          <div class="chart-container"><canvas id="chart-mentor"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>状态分布</h3>
          <div class="chart-container"><canvas id="chart-status"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>适岗能力雷达</h3>
          <div class="intern-select-row">
            <select id="radar-intern" onchange="App.updateRadar()">
              ${interns.map(i => `<option value="${i.id}">${i.name}（${i.position}）</option>`).join('')}
            </select>
          </div>
          <div class="chart-container"><canvas id="chart-radar"></canvas></div>
        </div>
        <div class="chart-card">
          <h3>评分变化趋势</h3>
          <div class="intern-select-row">
            <select id="trend-intern" onchange="App.updateTrend()">
              ${interns.map(i => `<option value="${i.id}">${i.name}（${i.position}）</option>`).join('')}
            </select>
          </div>
          <div class="chart-container"><canvas id="chart-trend"></canvas></div>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="page-header">
          <h3>批量数据管理</h3>
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <button class="btn-primary" onclick="App.exportData()">导出全部数据</button>
          <button class="btn-primary" onclick="App.importData()">导入数据恢复</button>
          <button class="btn-primary" onclick="App.showBulkImport()">批量导入实习生</button>
        </div>
      </div>
    `;

    // 延迟初始化图表，确保DOM已渲染
    requestAnimationFrame(() => {
      const posCtx = document.getElementById('chart-position');
      const mentorCtx = document.getElementById('chart-mentor');
      const statusCtx = document.getElementById('chart-status');
      const radarCtx = document.getElementById('chart-radar');
      const trendCtx = document.getElementById('chart-trend');

      if (posCtx) Charts.positionPie(posCtx);
      if (mentorCtx) Charts.mentorLoadBar(mentorCtx);
      if (statusCtx) Charts.statusBar(statusCtx);
      if (radarCtx) {
        const firstIntern = interns[0];
        Charts.capabilityRadar(radarCtx, firstIntern.scores);
      }
      if (trendCtx) {
        Charts.scoreTrendLine(trendCtx, interns[0].id);
      }
    }, 100);
  },

  updateRadar() {
    const internId = parseInt(document.getElementById('radar-intern').value);
    const intern = this.getIntern(internId);
    const ctx = document.getElementById('chart-radar');
    if (ctx && intern) {
      Charts.capabilityRadar(ctx, intern.scores);
    }
  },

  updateTrend() {
    const internId = parseInt(document.getElementById('trend-intern').value);
    const ctx = document.getElementById('chart-trend');
    if (ctx) {
      Charts.scoreTrendLine(ctx, internId);
    }
  },

  showBulkImport() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div class="page-header">
        <h2>批量导入实习生</h2>
        <button class="role-switch-btn" onclick="App.switchTab('dashboard')">返回大盘</button>
      </div>
      <div class="form-card" style="max-width:800px">
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">
          粘贴实习生 JSON 数组进行批量导入。格式示例：<br>
          [{"name":"张三","position":"研发","mentorId":1,"currentWeek":3}]
        </p>
        <div class="form-group">
          <label>实习生数据（JSON 数组）</label>
          <textarea id="bulk-import-data" rows="10" placeholder='[{"name":"张三","position":"研发","mentorId":1}]'></textarea>
        </div>
        <button class="btn-primary" onclick="App.processBulkImport()">确认导入</button>
      </div>
    `;
  },

  processBulkImport() {
    const raw = document.getElementById('bulk-import-data').value.trim();
    if (!raw) { alert('请输入数据'); return; }
    try {
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) { alert('数据必须是数组格式'); return; }
      const data = Storage.getAll();
      let added = 0;
      list.forEach(item => {
        if (item.name && item.position) {
          const maxId = Math.max(...data.interns.map(i => i.id), 0);
          const intern = {
            id: maxId + 1,
            name: item.name,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${maxId + 1}&backgroundColor=b6e3f4`,
            position: item.position,
            mentorId: item.mentorId || MENTORS.find(m => m.department === item.position)?.id || 1,
            joinDate: '2025-05-01',
            currentWeek: item.currentWeek || 1,
            status: 'adapted',
            scores: { learning: 70, business: 70, teamwork: 70, output: 70, comment: '' },
            scoreHistory: generateScoreHistory(item.currentWeek || 1),
            tasks: generateTasks(maxId + 1, item.position, item.currentWeek || 1),
            logs: [],
            aiChats: []
          };
          data.interns.push(intern);
          added++;
        }
      });
      Storage.saveAll(data);
      alert(`成功导入 ${added} 名实习生！`);
      this.switchTab('dashboard');
    } catch (e) {
      alert('JSON 格式错误：' + e.message);
    }
  },

  renderRisk(container) {
    const interns = this.getInterns();
    // 多因子风险模型
    const riskList = interns.map(i => {
      const factors = [];
      const avg = (i.scores.learning + i.scores.business + i.scores.teamwork + i.scores.output) / 4;
      const taskRate = i.tasks.length > 0 ? i.tasks.filter(t => t.completed).length / i.tasks.length : 0;
      const logDelay = Math.max(0, (i.currentWeek - 1) - i.logs.length);

      if (avg < 65) factors.push({ level: 'high', text: `综合评分仅${Math.round(avg)}分` });
      else if (avg < 75) factors.push({ level: 'medium', text: `综合评分${Math.round(avg)}分，有待提升` });

      if (logDelay >= 2) factors.push({ level: 'high', text: `日志拖欠${logDelay}周` });
      else if (logDelay >= 1) factors.push({ level: 'medium', text: `日志拖欠${logDelay}周` });
      else if (i.logs.length === 0 && i.currentWeek > 1) factors.push({ level: 'high', text: '从未提交日志' });

      if (taskRate < 0.4) factors.push({ level: 'high', text: `任务完成率仅${Math.round(taskRate * 100)}%` });
      else if (taskRate < 0.7) factors.push({ level: 'medium', text: `任务完成率${Math.round(taskRate * 100)}%` });

      if (!i.scores.comment || i.scores.comment.length < 10) factors.push({ level: 'low', text: '缺少导师过程评语' });

      // 计算风险总分
      const score = factors.reduce((sum, f) => sum + (f.level === 'high' ? 3 : f.level === 'medium' ? 2 : 1), 0);

      return { intern: i, factors, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

    container.innerHTML = `
      <div class="page-header">
        <h2>风险预警</h2>
        <span>共 ${riskList.length} 人需要关注</span>
      </div>
      <div class="risk-list">
        ${riskList.map(({ intern: i, factors, score }) => {
          const mentor = this.getMentor(i.mentorId);
          const avg = Math.round((i.scores.learning + i.scores.business + i.scores.teamwork + i.scores.output) / 4);
          const riskLevel = score >= 6 ? 'risk' : score >= 3 ? 'attention' : 'adapted';
          return `
            <div class="risk-card ${riskLevel}">
              <div class="risk-header">
                <img src="${i.avatar}" class="intern-avatar-sm" alt="">
                <div class="risk-info">
                  <div class="risk-name">${i.name}</div>
                  <div class="risk-meta">${i.position} · 第${i.currentWeek}周 · 导师：${mentor?.name || '未知'}</div>
                </div>
                <span class="badge badge-${riskLevel}">${this.getStatusLabel(riskLevel)}</span>
              </div>
              <div class="risk-scores">
                <div class="risk-score"><span>学习能力</span><strong>${i.scores.learning}</strong></div>
                <div class="risk-score"><span>业务理解</span><strong>${i.scores.business}</strong></div>
                <div class="risk-score"><span>团队协作</span><strong>${i.scores.teamwork}</strong></div>
                <div class="risk-score"><span>产出质量</span><strong>${i.scores.output}</strong></div>
                <div class="risk-score total"><span>综合</span><strong>${avg}</strong></div>
              </div>
              <div class="risk-factors">
                ${factors.map(f => `
                  <span class="risk-factor ${f.level}">${f.text}</span>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
        ${riskList.length === 0 ? '<div class="empty-state">🎉 目前没有需要关注的实习生！</div>' : ''}
      </div>
    `;
  },

  renderLogStats(container) {
    const interns = this.getInterns();
    const totalPossible = interns.reduce((sum, i) => sum + (i.currentWeek - 1), 0);
    const totalSubmitted = interns.reduce((sum, i) => sum + i.logs.length, 0);
    const rate = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0;
    const silent = interns.filter(i => i.logs.length === 0 && i.currentWeek > 1);

    container.innerHTML = `
      <div class="page-header">
        <h2>日志统计</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalSubmitted}</div>
          <div class="stat-label">已提交日志</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${totalPossible}</div>
          <div class="stat-label">应提交日志</div>
        </div>
        <div class="stat-card ${rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'danger'}">
          <div class="stat-value">${rate}%</div>
          <div class="stat-label">提交率</div>
        </div>
        <div class="stat-card ${silent.length === 0 ? 'success' : 'warning'}">
          <div class="stat-value">${silent.length}</div>
          <div class="stat-label">未提交人数</div>
        </div>
      </div>

      <div class="chart-card">
        <h3>各导师组日志提交率</h3>
        <div class="chart-container" style="height:300px"><canvas id="chart-log-activity"></canvas></div>
      </div>

      ${silent.length > 0 ? `
        <div class="risk-list">
          <h3>未提交日志的实习生</h3>
          ${silent.map(i => {
            const mentor = this.getMentor(i.mentorId);
            return `
              <div class="risk-card attention">
                <img src="${i.avatar}" class="intern-avatar-sm" alt="">
                <div class="risk-info">
                  <div class="risk-name">${i.name}</div>
                  <div class="risk-meta">${i.position} · 第${i.currentWeek}周 · 导师：${mentor?.name || '未知'}</div>
                </div>
                <span class="badge badge-attention">未交日志</span>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
    `;

    requestAnimationFrame(() => {
      const ctx = document.getElementById('chart-log-activity');
      if (ctx) Charts.logActivityBar(ctx);
    });
  },

  // ===== 工具方法 =====
  getStatusLabel(status) {
    const labels = { adapted: '适应良好', attention: '需关注', risk: '存在风险' };
    return labels[status] || status;
  }
};

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
