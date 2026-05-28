// 主应用逻辑

const App = {
  currentView: 'select',
  currentRole: null,
  currentUserId: null,

  init() {
    Storage.init();
    const saved = Storage.getRole();
    if (saved.role) {
      this.currentRole = saved.role;
      this.currentUserId = saved.userId;
      this.showDashboard();
    } else {
      this.showRoleSelect();
    }
  },

  // ===== 角色选择 =====
  showRoleSelect() {
    this.currentView = 'select';
    document.getElementById('role-select').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  },

  selectRole(role, userId) {
    this.currentRole = role;
    this.currentUserId = userId;
    Storage.setRole(role, userId);
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

    header.innerHTML = `
      <div class="header-title">${roleLabel}工作台</div>
      <div class="header-user">
        <img src="${user?.avatar || ''}" class="user-avatar" alt="">
        <span class="user-name">${user?.name || roleLabel}</span>
      </div>
    `;
  },

  getCurrentUser() {
    if (this.currentRole === 'intern') {
      return Storage.getIntern(this.currentUserId);
    }
    if (this.currentRole === 'mentor') {
      return Storage.getMentor(this.currentUserId);
    }
    return { name: 'HR管理员', avatar: '' };
  },

  getTabs() {
    const tabs = {
      intern: [
        { id: 'roadmap', label: '成长路线图', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
        { id: 'tasks', label: '本周任务', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
        { id: 'logs', label: '成长日志', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
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
    // 更新侧边栏激活状态
    document.querySelectorAll('.sidebar-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // 渲染对应视图
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="loading">加载中...</div>';

    setTimeout(() => {
      switch (tabId) {
        case 'roadmap': this.renderRoadmap(content); break;
        case 'tasks': this.renderTasks(content); break;
        case 'logs': this.renderLogs(content); break;
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

  logout() {
    this.currentRole = null;
    this.currentUserId = null;
    Storage.setRole(null, null);
    this.showRoleSelect();
  },

  // ===== 实习生视图 =====
  renderRoadmap(container) {
    const intern = Storage.getIntern(this.currentUserId);
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
    const intern = Storage.getIntern(this.currentUserId);
    const currentTasks = intern.tasks.filter(t => t.week === intern.currentWeek);
    const completed = currentTasks.filter(t => t.completed).length;
    const progress = currentTasks.length > 0 ? Math.round((completed / currentTasks.length) * 100) : 0;

    container.innerHTML = `
      <div class="page-header">
        <h2>本周任务</h2>
        <div class="progress-ring">
          <span class="progress-text">${progress}%</span>
        </div>
      </div>
      <div class="tasks-list">
        ${currentTasks.map(task => `
          <div class="task-card ${task.completed ? 'completed' : ''}" onclick="App.toggleTask(${task.id})">
            <div class="task-checkbox">${task.completed ? '☑' : '☐'}</div>
            <div class="task-info">
              <div class="task-title">${task.title}</div>
              <div class="task-desc">${task.description}</div>
              <div class="task-meta">截止：${task.deadline}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ${currentTasks.length === 0 ? '<div class="empty-state">导师还未分配本周任务，稍后再来看看~</div>' : ''}
    `;
  },

  toggleTask(taskId) {
    const intern = Storage.getIntern(this.currentUserId);
    const task = intern.tasks.find(t => t.id === taskId);
    if (task) {
      Storage.updateTask(this.currentUserId, taskId, !task.completed);
      this.renderTasks(document.getElementById('main-content'));
    }
  },

  renderLogs(container) {
    const intern = Storage.getIntern(this.currentUserId);
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
              <p>${log.summary}</p>
            </div>
            <div class="log-section">
              <strong>遇到的困难</strong>
              <p>${log.difficulties}</p>
            </div>
            <div class="log-section">
              <strong>下周计划</strong>
              <p>${log.nextWeekPlan}</p>
            </div>
            ${log.aiFeedback ? `
              <div class="ai-feedback-box">
                <div class="ai-feedback-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>
                  AI 成长反馈
                </div>
                <p>${log.aiFeedback}</p>
              </div>
            ` : ''}
          </div>
        `).join('')}
        ${intern.logs.length === 0 ? '<div class="empty-state">还没有日志记录~</div>' : ''}
      </div>
    `;
  },

  submitLog() {
    const summary = document.getElementById('log-summary').value.trim();
    const difficulties = document.getElementById('log-difficulties').value.trim();
    const plan = document.getElementById('log-plan').value.trim();

    if (!summary) {
      alert('请填写本周总结');
      return;
    }

    const intern = Storage.getIntern(this.currentUserId);
    const week = intern.currentWeek - 1;

    // 生成AI反馈
    const aiFeedback = this.generateLogFeedback(week, summary, difficulties, intern.position);

    const log = {
      week: week,
      summary: summary,
      difficulties: difficulties || '暂无',
      nextWeekPlan: plan || '暂无',
      aiFeedback: aiFeedback,
      submittedAt: new Date().toISOString().split('T')[0]
    };

    Storage.addLog(this.currentUserId, log);
    this.renderLogs(document.getElementById('main-content'));
  },

  generateLogFeedback(week, summary, difficulties, position) {
    const highlights = ['学习态度', '技术能力', '业务理解', '团队协作', '主动思考'];
    const highlight = highlights[week % highlights.length];
    const suggestions = {
      '研发': ['多阅读优秀代码，学习设计模式', '尝试写技术博客沉淀知识', '主动参与Code Review'],
      '产品': ['多和用户交流，培养用户思维', '关注数据指标，用数据说话', '学习竞品分析方法论'],
      '销售': ['多练习话术，提升表达力', '建立客户档案，精细化管理', '复盘每次客户沟通']
    };
    const suggestion = (suggestions[position] || suggestions['研发'])[week % 3];

    return `第${week}周的总结很到位！能主动反思和记录，说明你有很强的自我驱动力。我在你的总结中看到了${highlight}方面的闪光点，这是非常宝贵的特质。关于你提到的"${difficulties.substring(0, 20)}"，建议你在下周的工作中：${suggestion}。继续加油，期待你的持续成长！`;
  },

  renderResources(container) {
    const intern = Storage.getIntern(this.currentUserId);
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
    const mentor = Storage.getMentor(this.currentUserId);
    const interns = Storage.getInterns().filter(i => i.mentorId === mentor.id);

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
    const mentor = Storage.getMentor(this.currentUserId);
    const template = TEMPLATES[mentor.department];

    container.innerHTML = `
      <div class="page-header">
        <h2>${mentor.department}岗位带教计划</h2>
        <button class="btn-primary" onclick="alert('已应用到所有实习生')">一键应用</button>
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

  renderAssignTask(container) {
    const mentor = Storage.getMentor(this.currentUserId);
    const interns = Storage.getInterns().filter(i => i.mentorId === mentor.id);

    container.innerHTML = `
      <div class="page-header">
        <h2>任务分配</h2>
      </div>
      <div class="form-card">
        <div class="form-group">
          <label>选择实习生</label>
          <select id="task-intern">
            ${interns.map(i => `<option value="${i.id}">${i.name}（${i.position}）</option>`).join('')}
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
        <button class="btn-primary" onclick="App.createTask()">分配任务</button>
      </div>
    `;
  },

  createTask() {
    const internId = parseInt(document.getElementById('task-intern').value);
    const week = parseInt(document.getElementById('task-week').value);
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();

    if (!title) { alert('请填写任务标题'); return; }

    const intern = Storage.getIntern(internId);
    const maxId = Math.max(...intern.tasks.map(t => t.id), 0);
    intern.tasks.push({
      id: maxId + 1,
      internId,
      week,
      title,
      description: desc || title,
      completed: false,
      deadline: getWeekDeadline(week)
    });
    Storage.updateIntern(intern);
    alert('任务分配成功！');
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
  },

  renderViewLogs(container) {
    const mentor = Storage.getMentor(this.currentUserId);
    const interns = Storage.getInterns().filter(i => i.mentorId === mentor.id);

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
              <p><strong>总结：</strong>${log.summary}</p>
              <p><strong>困难：</strong>${log.difficulties}</p>
              ${log.aiFeedback ? `
                <div class="ai-feedback-box small">
                  <strong>AI反馈：</strong>${log.aiFeedback}
                </div>
              ` : ''}
            </div>
          `).join('') : '<div class="empty-state">暂无日志</div>'}
        </div>
      `).join('')}
    `;
  },

  renderEvaluate(container) {
    const mentor = Storage.getMentor(this.currentUserId);
    const interns = Storage.getInterns().filter(i => i.mentorId === mentor.id);

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
    const intern = Storage.getIntern(internId);
    if (intern) {
      document.getElementById('score-learning').value = intern.scores.learning;
      document.getElementById('val-learning').textContent = intern.scores.learning;
      document.getElementById('score-business').value = intern.scores.business;
      document.getElementById('val-business').textContent = intern.scores.business;
      document.getElementById('score-teamwork').value = intern.scores.teamwork;
      document.getElementById('val-teamwork').textContent = intern.scores.teamwork;
      document.getElementById('score-output').value = intern.scores.output;
      document.getElementById('val-output').textContent = intern.scores.output;
    }
  },

  submitEval() {
    const internId = parseInt(document.getElementById('eval-intern').value);
    const intern = Storage.getIntern(internId);
    if (intern) {
      intern.scores = {
        learning: parseInt(document.getElementById('score-learning').value),
        business: parseInt(document.getElementById('score-business').value),
        teamwork: parseInt(document.getElementById('score-teamwork').value),
        output: parseInt(document.getElementById('score-output').value)
      };
      // 根据平均分更新状态
      const avg = (intern.scores.learning + intern.scores.business + intern.scores.teamwork + intern.scores.output) / 4;
      intern.status = avg >= 80 ? 'adapted' : avg >= 60 ? 'attention' : 'risk';
      Storage.updateIntern(intern);
      alert('评价提交成功！');
    }
  },

  // ===== HR视图 =====
  renderHRDashboard(container) {
    const interns = Storage.getInterns();
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
      </div>
    `;

    // 延迟初始化图表，确保DOM已渲染
    setTimeout(() => {
      const posCtx = document.getElementById('chart-position');
      const mentorCtx = document.getElementById('chart-mentor');
      const statusCtx = document.getElementById('chart-status');
      const radarCtx = document.getElementById('chart-radar');

      if (posCtx) Charts.positionPie(posCtx);
      if (mentorCtx) Charts.mentorLoadBar(mentorCtx);
      if (statusCtx) Charts.statusBar(statusCtx);
      if (radarCtx) {
        const firstIntern = interns[0];
        Charts.capabilityRadar(radarCtx, firstIntern.scores);
      }
    }, 100);
  },

  updateRadar() {
    const internId = parseInt(document.getElementById('radar-intern').value);
    const intern = Storage.getIntern(internId);
    const ctx = document.getElementById('chart-radar');
    if (ctx && intern) {
      Charts.capabilityRadar(ctx, intern.scores);
    }
  },

  renderRisk(container) {
    const interns = Storage.getInterns();
    const risks = interns.filter(i => i.status === 'risk' || i.status === 'attention');

    container.innerHTML = `
      <div class="page-header">
        <h2>风险预警</h2>
        <span>共 ${risks.length} 人需要关注</span>
      </div>
      <div class="risk-list">
        ${risks.map(i => {
          const mentor = Storage.getMentor(i.mentorId);
          const avg = Math.round((i.scores.learning + i.scores.business + i.scores.teamwork + i.scores.output) / 4);
          return `
            <div class="risk-card ${i.status}">
              <div class="risk-header">
                <img src="${i.avatar}" class="intern-avatar-sm" alt="">
                <div class="risk-info">
                  <div class="risk-name">${i.name}</div>
                  <div class="risk-meta">${i.position} · 第${i.currentWeek}周 · 导师：${mentor?.name || '未知'}</div>
                </div>
                <span class="badge badge-${i.status}">${this.getStatusLabel(i.status)}</span>
              </div>
              <div class="risk-scores">
                <div class="risk-score"><span>学习能力</span><strong>${i.scores.learning}</strong></div>
                <div class="risk-score"><span>业务理解</span><strong>${i.scores.business}</strong></div>
                <div class="risk-score"><span>团队协作</span><strong>${i.scores.teamwork}</strong></div>
                <div class="risk-score"><span>产出质量</span><strong>${i.scores.output}</strong></div>
                <div class="risk-score total"><span>综合</span><strong>${avg}</strong></div>
              </div>
              <div class="risk-reason">
                ${i.logs.length === 0 ? '⚠️ 尚未提交任何成长日志' : ''}
                ${i.scores.learning < 65 ? '⚠️ 学习能力评分偏低' : ''}
                ${i.scores.output < 65 ? '⚠️ 产出质量评分偏低' : ''}
              </div>
            </div>
          `;
        }).join('')}
        ${risks.length === 0 ? '<div class="empty-state">🎉 目前没有需要关注的实习生！</div>' : ''}
      </div>
    `;
  },

  renderLogStats(container) {
    const interns = Storage.getInterns();
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
            const mentor = Storage.getMentor(i.mentorId);
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

    setTimeout(() => {
      const ctx = document.getElementById('chart-log-activity');
      if (ctx) Charts.logActivityBar(ctx);
    }, 100);
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
