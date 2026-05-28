// AI 智能助手逻辑

const AIAssistant = {
  isOpen: false,
  currentRole: 'intern',

  init(role) {
    this.currentRole = role;
    this.renderButton();
    this.renderPanel();
  },

  renderButton() {
    if (document.getElementById('ai-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'ai-btn';
    btn.className = 'ai-float-btn';
    btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
    btn.onclick = () => this.toggle();
    document.body.appendChild(btn);
  },

  renderPanel() {
    if (document.getElementById('ai-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.className = 'ai-panel';
    panel.innerHTML = `
      <div class="ai-header">
        <span>AI 智能助手</span>
        <button onclick="AIAssistant.toggle()">✕</button>
      </div>
      <div class="ai-messages" id="ai-messages"></div>
      <div class="ai-quick-btns" id="ai-quick-btns"></div>
      <div class="ai-input-area">
        <input type="text" id="ai-input" placeholder="输入你的问题..." onkeydown="if(event.key==='Enter')AIAssistant.send()">
        <button onclick="AIAssistant.send()">发送</button>
      </div>
    `;
    document.body.appendChild(panel);
    this.renderQuickButtons();
  },

  renderQuickButtons() {
    const container = document.getElementById('ai-quick-btns');
    if (!container) return;

    const buttons = {
      intern: [
        '我本周该学什么？',
        '帮我看看这篇日志',
        '这个任务怎么做？',
        '我目前的进度如何？'
      ],
      mentor: [
        '张三最近怎么样？',
        '怎么带教更有效？',
        '如何评价实习生？',
        '推荐一个带教模板'
      ],
      hr: [
        '这批人整体情况如何？',
        '哪些人需要关注？',
        '导师带教质量排名',
        '日志提交率统计'
      ]
    };

    container.innerHTML = (buttons[this.currentRole] || []).map(q =>
      `<button class="ai-quick-btn" onclick="AIAssistant.send('${q}')">${q}</button>`
    ).join('');
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('ai-panel');
    if (panel) panel.classList.toggle('open', this.isOpen);
  },

  send(text) {
    const input = document.getElementById('ai-input');
    const message = text || input.value.trim();
    if (!message) return;

    this.addMessage(message, true);
    if (!text) input.value = '';

    // 模拟AI思考延迟
    setTimeout(() => {
      const response = this.generateResponse(message);
      this.addMessage(response, false);
    }, 600 + Math.random() * 800);
  },

  addMessage(text, isUser) {
    const container = document.getElementById('ai-messages');
    if (!container) return;

    const msg = document.createElement('div');
    msg.className = `ai-message ${isUser ? 'user' : 'ai'}`;
    msg.innerHTML = `
      <div class="ai-msg-content">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>
      <div class="ai-msg-time">${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    Storage.addChat(this.currentRole, text, isUser);
  },

  generateResponse(input) {
    const lower = input.toLowerCase();
    const role = this.currentRole;
    const data = Storage.getAll();
    const interns = data.interns;
    const currentUserId = data.currentUserId;

    // 实习生角色
    if (role === 'intern') {
      const intern = interns.find(i => i.id === currentUserId);
      if (!intern) return '请先选择你的身份。';

      if (lower.includes('学') || lower.includes('学什么')) {
        const topic = this.getLearningTopic(intern.position, intern.currentWeek);
        let response = AI_TEMPLATES.intern.learning[Math.floor(Math.random() * AI_TEMPLATES.intern.learning.length)];
        response = response.replace(/\{topic\}/g, topic);
        response = response.replace(/\{position\}/g, intern.position);
        response = response.replace(/\{week\}/g, intern.currentWeek);
        return response;
      }

      if (lower.includes('任务') || lower.includes('怎么做')) {
        return AI_TEMPLATES.intern.task[Math.floor(Math.random() * AI_TEMPLATES.intern.task.length)];
      }

      if (lower.includes('日志') || lower.includes('周记')) {
        const latestLog = intern.logs[intern.logs.length - 1];
        if (latestLog) {
          let resp = AI_TEMPLATES.intern.log[Math.floor(Math.random() * AI_TEMPLATES.intern.log.length)];
          resp = resp.replace(/\{week\}/g, latestLog.week);
          resp = resp.replace(/\{highlight\}/g, latestLog.summary.substring(0, 15));
          resp = resp.replace(/\{difficulty\}/g, latestLog.difficulties.substring(0, 15));
          resp = resp.replace(/\{suggestion\}/g, '可以主动向导师请教或查阅内部文档');
          return resp;
        }
        return '你还没有提交日志呢！快去写本周的成长日记吧，AI助手会给你个性化反馈哦。';
      }

      if (lower.includes('进度')) {
        const completed = intern.tasks.filter(t => t.completed).length;
        const total = intern.tasks.length;
        return `你目前处于第${intern.currentWeek}周，已完成 ${completed}/${total} 个任务，进度约 ${total > 0 ? Math.round(completed/total*100) : 0}%。整体状态：${intern.status === 'adapted' ? '适应良好，继续保持！' : intern.status === 'attention' ? '需要加油，有任何困难及时求助。' : '需要重点关注，建议主动约导师沟通。'}`;
      }
    }

    // 导师角色
    if (role === 'mentor') {
      const mentor = Storage.getMentor(currentUserId);
      if (!mentor) return '请先选择导师身份。';

      if (lower.includes('怎么样') || lower.includes('最近')) {
        const menteeId = this.extractName(input, interns);
        const mentee = menteeId ? interns.find(i => i.id === menteeId) : interns.find(i => i.mentorId === mentor.id);
        if (mentee) {
          let resp = AI_TEMPLATES.mentor.internStatus[0];
          resp = resp.replace(/\{name\}/g, mentee.name);
          resp = resp.replace(/\{week\}/g, mentee.currentWeek);
          resp = resp.replace(/\{status\}/g, mentee.status === 'adapted' ? '正常' : '需要关注');
          resp = resp.replace(/\{task\}/g, mentee.tasks.filter(t => t.completed).pop()?.title || '基础任务');
          resp = resp.replace(/\{weakness\}/g, '技术深度');
          return resp;
        }
      }

      if (lower.includes('带教') || lower.includes('教')) {
        return AI_TEMPLATES.mentor.teaching[Math.floor(Math.random() * AI_TEMPLATES.mentor.teaching.length)];
      }

      if (lower.includes('评价')) {
        return '评价实习生时建议从四个维度考虑：\n1. 学习能力：是否主动学习、举一反三\n2. 业务理解：对产品/业务的理解深度\n3. 团队协作：沟通是否顺畅、是否乐于助人\n4. 产出质量：任务完成的质量和效率\n\n建议在每周五下午进行简要评价。';
      }

      if (lower.includes('模板')) {
        const template = TEMPLATES[mentor.department];
        if (template) {
          return `${mentor.department}岗位12周带教计划已准备好！当前第${template[0].week}周：${template[0].title}，包含${template[0].tasks.length}个任务。可以在「带教计划」模块一键应用。`;
        }
      }
    }

    // HR角色
    if (role === 'hr') {
      if (lower.includes('整体') || lower.includes('情况')) {
        const adapted = interns.filter(i => i.status === 'adapted').length;
        const attention = interns.filter(i => i.status === 'attention').length;
        const risk = interns.filter(i => i.status === 'risk').length;
        const totalPossible = interns.reduce((sum, i) => sum + (i.currentWeek - 1), 0);
        const totalSubmitted = interns.reduce((sum, i) => sum + i.logs.length, 0);
        const logRate = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0;

        let resp = AI_TEMPLATES.hr.overview[0];
        resp = resp.replace(/\{adapted\}/g, adapted);
        resp = resp.replace(/\{attention\}/g, attention);
        resp = resp.replace(/\{risk\}/g, risk);
        resp = resp.replace(/\{position\}/g, risk > 0 ? interns.find(i => i.status === 'risk')?.position : '各');
        resp = resp.replace(/\{logRate\}/g, logRate);
        return resp;
      }

      if (lower.includes('关注') || lower.includes('风险')) {
        const risks = interns.filter(i => i.status === 'risk' || i.status === 'attention');
        if (risks.length === 0) return '目前没有需要特别关注的实习生，整体状态良好！';
        return `需要关注的有 ${risks.length} 人：\n${risks.map(i =>
          `• ${i.name}（${i.position}，第${i.currentWeek}周）- ${i.status === 'risk' ? '存在风险' : '需关注'}`
        ).join('\n')}\n\n建议本周安排一次1v1沟通。`;
      }

      if (lower.includes('排名') || lower.includes('质量')) {
        const mentorQuality = MENTORS.map(m => {
          const ms = interns.filter(i => i.mentorId === m.id);
          const avgProgress = ms.reduce((sum, i) => sum + i.currentWeek, 0) / (ms.length || 1);
          const avgScore = ms.reduce((sum, i) => sum + (i.scores.learning + i.scores.business + i.scores.teamwork + i.scores.output) / 4, 0) / (ms.length || 1);
          return { name: m.name, score: Math.round((avgProgress * 5 + avgScore) / 2) };
        }).sort((a, b) => b.score - a.score);

        return `导师带教质量排名：\n${mentorQuality.map((m, i) => `${i + 1}. ${m.name} - 综合评分 ${m.score}`).join('\n')}`;
      }

      if (lower.includes('日志') || lower.includes('提交')) {
        const totalPossible = interns.reduce((sum, i) => sum + (i.currentWeek - 1), 0);
        const totalSubmitted = interns.reduce((sum, i) => sum + i.logs.length, 0);
        const rate = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0;
        const silent = interns.filter(i => i.logs.length === 0 && i.currentWeek > 1);

        return `日志提交率：${rate}%（${totalSubmitted}/${totalPossible}）\n${silent.length > 0 ? `未提交日志：${silent.map(i => i.name).join('、')}` : '所有人已提交日志，状态良好！'}`;
      }
    }

    // 默认回复
    return this.getDefaultResponse(role);
  },

  getLearningTopic(position, week) {
    const topics = {
      '研发': ['Git工作流', '代码规范', '业务架构', '单元测试', '性能优化', '系统设计'],
      '产品': ['需求分析', '原型设计', '数据分析', '用户研究', '竞品分析', '项目管理'],
      '销售': ['产品卖点', '客户沟通', '方案撰写', '谈判技巧', '数据分析', '客户成功']
    };
    const list = topics[position] || topics['研发'];
    return list[Math.min(week - 1, list.length - 1)];
  },

  extractName(input, interns) {
    for (const intern of interns) {
      if (input.includes(intern.name)) return intern.id;
    }
    return null;
  },

  getDefaultResponse(role) {
    const defaults = {
      intern: '我是你的AI成长助手，可以帮你：\n• 查询本周学习重点\n• 解答任务疑问\n• 点评你的成长日志\n• 查看当前进度\n\n试试点击上方快捷按钮吧！',
      mentor: '我是导师AI助手，可以帮你：\n• 了解实习生近况\n• 获取带教建议\n• 查看评价参考\n• 推荐带教模板\n\n有什么我可以帮你的吗？',
      hr: '我是HR数据助手，可以帮你：\n• 查看整体情况\n• 识别风险人员\n• 导师质量排名\n• 日志提交统计\n\n需要看什么数据？'
    };
    return defaults[role] || defaults.intern;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
