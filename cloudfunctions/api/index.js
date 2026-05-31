// CloudBase 云函数 - Tcamp 后端 API
const cloudbase = require('@cloudbase/node-sdk');

const app = cloudbase.init({});
const db = app.database();

// ========== 常量与数据生成（从 data.js 复制）==========
const POSITIONS = ['研发', '产品', '销售'];
const STATUS = { ADAPTED: 'adapted', ATTENTION: 'attention', RISK: 'risk' };

const NAMES = [
  '张明远', '李思雨', '王浩然', '刘子涵', '陈雨欣',
  '杨博文', '赵梓萱', '周子轩', '吴雨桐', '徐嘉怡',
  '孙宇航', '马欣怡', '朱子墨', '胡雅琪', '林晓峰',
  '郭思涵', '何子睿', '高雨萱', '罗嘉诚', '郑欣怡'
];

const MENTORS = [
  { id: 1, name: '李建国', position: '高级研发工程师', department: '研发', interns: [1, 2, 3, 4] },
  { id: 2, name: '王芳华', position: '产品总监', department: '产品', interns: [5, 6, 7, 8] },
  { id: 3, name: '张伟强', position: '销售总监', department: '销售', interns: [9, 10, 11, 12] },
  { id: 4, name: '陈晓明', position: '技术架构师', department: '研发', interns: [13, 14, 15] },
  { id: 5, name: '刘美玲', position: '高级产品经理', department: '产品', interns: [16, 17, 18, 19, 20] }
];

const TEMPLATES = {
  '研发': [
    { week: 1, title: '环境搭建与团队融入', tasks: ['配置开发环境', '熟悉Git工作流', '参加团队周会'] },
    { week: 2, title: '代码规范与基础功能', tasks: ['阅读代码规范文档', '完成一个小功能练手', 'Code Review学习'] },
    { week: 3, title: '业务理解', tasks: ['阅读业务文档', '画出核心流程图', '与业务方沟通'] },
    { week: 4, title: '独立开发', tasks: ['独立负责一个简单需求', '编写单元测试', '技术分享准备'] },
    { week: 5, title: '代码质量', tasks: ['重构一段旧代码', '性能优化实践', '代码评审他人'] },
    { week: 6, title: '中期答辩', tasks: ['准备中期汇报', '展示阶段性成果', '收集反馈'] },
    { week: 7, title: '复杂需求', tasks: ['负责一个跨模块需求', '技术方案设计', '跨团队协作'] },
    { week: 8, title: '系统思维', tasks: ['了解系统架构', '排查线上问题', '编写技术文档'] },
    { week: 9, title: '项目管理', tasks: ['主导一个小项目', '协调资源与排期', '风险管理'] },
    { week: 10, title: '性能优化', tasks: ['系统性能分析', '优化方案落地', '效果验证'] },
    { week: 11, title: '转正准备', tasks: ['整理实习成果', '准备转正答辩PPT', '导师模拟面试'] },
    { week: 12, title: '总结与交接', tasks: ['撰写实习总结', '知识文档沉淀', '工作交接'] }
  ],
  '产品': [
    { week: 1, title: '产品认知', tasks: ['了解产品线', '体验核心功能', '学习产品文档'] },
    { week: 2, title: '需求分析', tasks: ['学习需求分析方法', '参与用户调研', '撰写需求文档'] },
    { week: 3, title: '原型设计', tasks: ['学习Axure/Figma', '绘制简单原型', '交互说明撰写'] },
    { week: 4, title: '数据分析', tasks: ['学习数据分析工具', '分析一个功能数据', '数据报告撰写'] },
    { week: 5, title: '项目管理', tasks: ['跟进一个需求上线', '协调设计与开发', '进度跟踪'] },
    { week: 6, title: '中期答辩', tasks: ['准备中期汇报', '展示阶段性成果', '收集反馈'] },
    { week: 7, title: '用户研究', tasks: ['设计用户访谈', '执行可用性测试', '产出研究报告'] },
    { week: 8, title: '竞品分析', tasks: ['选择竞品对标', '撰写竞品分析报告', '提出优化建议'] },
    { week: 9, title: '功能迭代', tasks: ['独立负责一个功能迭代', '撰写PRD', '推动上线'] },
    { week: 10, title: '运营协同', tasks: ['配合运营活动', '效果复盘', '迭代优化'] },
    { week: 11, title: '转正准备', tasks: ['整理实习成果', '准备转正答辩PPT', '导师模拟面试'] },
    { week: 12, title: '总结与交接', tasks: ['撰写实习总结', '产品文档沉淀', '工作交接'] }
  ],
  '销售': [
    { week: 1, title: '业务了解', tasks: ['了解产品卖点', '学习销售话术', '旁听客户拜访'] },
    { week: 2, title: '客户画像', tasks: ['学习客户分析方法', '整理目标客户列表', '建立客户档案'] },
    { week: 3, title: '沟通技巧', tasks: ['学习商务沟通', '模拟客户场景', '电话销售练习'] },
    { week: 4, title: '方案撰写', tasks: ['学习方案模板', '撰写客户解决方案', '内部方案评审'] },
    { week: 5, title: '客户拜访', tasks: ['陪同拜访客户', '记录客户需求', '拜访复盘'] },
    { week: 6, title: '中期答辩', tasks: ['准备中期汇报', '展示阶段性成果', '收集反馈'] },
    { week: 7, title: '独立拜访', tasks: ['独立拜访客户', '推进商务谈判', '合同流程学习'] },
    { week: 8, title: '项目管理', tasks: ['跟进交付进度', '协调内部资源', '客户满意度维护'] },
    { week: 9, title: '数据分析', tasks: ['销售数据分析', '客户转化漏斗', '优化销售策略'] },
    { week: 10, title: '大客攻坚', tasks: ['参与大客户服务', '制定客户成功计划', '续约推进'] },
    { week: 11, title: '转正准备', tasks: ['整理实习成果', '准备转正答辩PPT', '导师模拟面试'] },
    { week: 12, title: '总结与交接', tasks: ['撰写实习总结', '客户资料交接', '经验分享'] }
  ]
};

function getCurrentWeekReal() {
  const base = new Date('2025-05-01');
  const now = new Date();
  const diffMs = now - base;
  const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(12, diffWeeks));
}

function generateInterns() {
  const interns = [];
  const currentWeek = getCurrentWeekReal();
  for (let i = 0; i < 20; i++) {
    const position = POSITIONS[i % 3];
    const mentor = MENTORS.find(m => m.department === position);
    const statusRoll = Math.random();
    const status = statusRoll > 0.7 ? STATUS.ADAPTED : statusRoll > 0.3 ? STATUS.ATTENTION : STATUS.RISK;

    interns.push({
      id: i + 1,
      name: NAMES[i],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}&backgroundColor=b6e3f4`,
      position,
      mentorId: mentor.id,
      joinDate: '2025-05-01',
      currentWeek,
      status,
      scores: {
        learning: Math.floor(Math.random() * 30) + 60,
        business: Math.floor(Math.random() * 30) + 60,
        teamwork: Math.floor(Math.random() * 30) + 60,
        output: Math.floor(Math.random() * 30) + 60,
        comment: ''
      },
      scoreHistory: generateScoreHistory(currentWeek),
      tasks: generateTasks(i + 1, position, currentWeek),
      logs: generateLogs(i + 1, currentWeek),
      aiChats: []
    });
  }
  return interns;
}

function generateTasks(internId, position, currentWeek) {
  const tasks = [];
  const template = TEMPLATES[position];
  let taskId = 1;
  // 只预生成前 2 周的基础模板任务，后续任务由导师真实分配
  const maxPreGenWeek = Math.min(2, currentWeek);
  for (let w = 1; w <= maxPreGenWeek; w++) {
    const weekPlan = template[w - 1];
    weekPlan.tasks.forEach((taskTitle) => {
      tasks.push({
        id: taskId++,
        internId,
        week: w,
        title: taskTitle,
        description: `${position}岗位第${w}周基础任务：${taskTitle}`,
        completed: w < currentWeek,
        deadline: getWeekDeadline(w),
        source: 'template'
      });
    });
  }
  return tasks;
}

function generateLogs(internId, currentWeek) {
  const logs = [];
  const summaries = [
    '本周主要熟悉了团队的工作流程和开发环境，对项目架构有了初步了解。',
    '完成了第一个小功能的开发，虽然遇到了一些困难，但在导师的帮助下顺利解决了。',
    '本周参与了需求评审会议，对产品逻辑有了更深入的理解。',
    '独立完成了一个中等复杂度的任务，代码质量得到了导师的认可。',
    '学习了新的技术框架，正在尝试在项目中应用。'
  ];
  const difficulties = [
    '对Git的高级操作还不太熟悉，需要多练习。',
    '业务逻辑比较复杂，理解起来有些吃力。',
    '跨部门沟通效率不高，需要提升协调能力。',
    '时间管理有待改善，任务优先级判断不够准确。',
    '技术深度不足，需要系统学习底层原理。'
  ];
  const plans = [
    '下周计划深入学习代码规范，提升代码质量。',
    '准备独立完成一个完整需求，锻炼全流程能力。',
    '打算多参加技术分享，拓宽技术视野。',
    '计划梳理本周学到的知识，形成文档沉淀。',
    '下周主动向导师请教职业规划相关问题。'
  ];
  for (let w = 1; w < currentWeek - 1; w++) {
    logs.push({
      week: w,
      summary: summaries[w % summaries.length],
      difficulties: difficulties[w % difficulties.length],
      nextWeekPlan: plans[w % plans.length],
      aiFeedback: generateAIFeedback(w, summaries[w % summaries.length], difficulties[w % difficulties.length]),
      submittedAt: getWeekDeadline(w),
      comments: []
    });
  }
  return logs;
}

function generateAIFeedback(week, summary, difficulty) {
  const feedbacks = [
    `第${week}周的总结很到位！能主动反思${difficulty.split('，')[0]}，说明你有很强的自我驱动力。建议你在下周的工作中，尝试将遇到的问题记录下来，形成个人知识库。`,
    `看到你在第${week}周的成长，进步很明显！关于"${difficulty}"，推荐你多利用团队内部的Wiki和文档资源，也可以主动向导师发起一对一交流。`,
    `第${week}周的表现值得肯定！你在${summary.substring(0, 20)}...方面做得很好。面对${difficulty}，建议采用"小步快跑"的策略，先完成再完美。`
  ];
  return feedbacks[week % feedbacks.length];
}

function generateScoreHistory(currentWeek) {
  const history = [];
  const baseScores = {
    learning: Math.floor(Math.random() * 20) + 55,
    business: Math.floor(Math.random() * 20) + 55,
    teamwork: Math.floor(Math.random() * 20) + 55,
    output: Math.floor(Math.random() * 20) + 55
  };
  for (let w = 1; w <= currentWeek; w++) {
    const progress = w / currentWeek;
    history.push({
      week: w,
      learning: Math.min(100, Math.round(baseScores.learning + progress * 15 + Math.random() * 10)),
      business: Math.min(100, Math.round(baseScores.business + progress * 15 + Math.random() * 10)),
      teamwork: Math.min(100, Math.round(baseScores.teamwork + progress * 15 + Math.random() * 10)),
      output: Math.min(100, Math.round(baseScores.output + progress * 15 + Math.random() * 10))
    });
  }
  return history;
}

function getWeekDeadline(week) {
  const base = new Date('2025-05-01');
  base.setDate(base.getDate() + week * 7);
  return base.toISOString().split('T')[0];
}

// ========== 修复预生成日志 ==========
// 把每位实习生最新一周（currentWeek - 1）的预生成日志删掉，留出空间让实习生自己写
async function fixPreGeneratedLogs() {
  try {
    const internsCol = db.collection('interns');
    const res = await internsCol.get();
    let fixedCount = 0;

    for (const doc of res.data) {
      const intern = doc;
      const targetWeek = intern.currentWeek - 1;
      const hasPreGenerated = intern.logs && intern.logs.some(l => l.week === targetWeek);

      if (hasPreGenerated) {
        const newLogs = intern.logs.filter(l => l.week !== targetWeek);
        await internsCol.doc(doc._id).update({ data: { logs: newLogs } });
        fixedCount++;
      }
    }

    return { fixedCount };
  } catch (err) {
    console.error('fixPreGeneratedLogs error:', err);
    return { fixedCount: 0, error: err.message };
  }
}

// ========== 数据库初始化 ==========
async function initDatabase() {
  try {
    // 创建集合（如果不存在则创建）
    try { await db.createCollection('interns'); } catch (e) { /* 已存在则忽略 */ }
    try { await db.createCollection('mentors'); } catch (e) { /* 已存在则忽略 */ }
    try { await db.createCollection('app_config'); } catch (e) { /* 已存在则忽略 */ }

    const internsCol = db.collection('interns');
    const mentorsCol = db.collection('mentors');

    // 检查是否已初始化
    const count = await internsCol.count();
    if (count.total > 0) {
      // 数据库已存在，自动修复预生成日志（幂等操作，可重复执行）
      const fixed = await fixPreGeneratedLogs();
      return { initialized: false, message: 'Database already initialized', fixed };
    }

    // 批量写入实习生
    const interns = generateInterns();
    const batchInterns = interns.map(i => internsCol.add(i));
    await Promise.all(batchInterns);

    // 批量写入导师
    const batchMentors = MENTORS.map(m => mentorsCol.add(m));
    await Promise.all(batchMentors);

    return { initialized: true, interns: interns.length, mentors: MENTORS.length };
  } catch (err) {
    console.error('initDatabase error:', err);
    throw err;
  }
}

// ========== API 路由 ==========
const handlers = {
  // 初始化数据库
  async initData() {
    return await initDatabase();
  },

  // 获取所有实习生
  async getInterns() {
    const res = await db.collection('interns').get();
    return res.data.map(d => ({ ...d, _id: undefined }));
  },

  // 获取单个实习生
  async getIntern({ id }) {
    const res = await db.collection('interns').where({ id: parseInt(id) }).get();
    if (res.data.length === 0) return null;
    const d = res.data[0];
    delete d._id;
    return d;
  },

  // 更新实习生（用 _id 定位文档，比 where 更可靠）
  async updateIntern({ id, data }) {
    try {
      const docs = await db.collection('interns').where({ id: parseInt(id) }).get();
      if (docs.data.length === 0) return { error: 'Intern not found', updated: 0 };
      const docId = docs.data[0]._id;
      const res = await db.collection('interns').doc(docId).update({ data });
      return { updated: res.updated };
    } catch (err) {
      console.error('updateIntern error:', err);
      return { error: err.message, updated: 0 };
    }
  },

  // 添加日志
  async addLog({ internId, log }) {
    const intern = await this.getIntern({ id: internId });
    if (!intern) return { error: 'Intern not found' };
    intern.logs = intern.logs || [];
    intern.logs.push(log);
    return await this.updateIntern({ id: internId, data: { logs: intern.logs } });
  },

  // 更新任务状态
  async updateTask({ internId, taskId, completed }) {
    const intern = await this.getIntern({ id: internId });
    if (!intern) return { error: 'Intern not found' };
    const task = intern.tasks.find(t => t.id === parseInt(taskId));
    if (task) {
      task.completed = completed;
      return await this.updateIntern({ id: internId, data: { tasks: intern.tasks } });
    }
    return { error: 'Task not found' };
  },

  // 添加任务（导师分配）
  async addTask({ internId, task }) {
    const intern = await this.getIntern({ id: internId });
    if (!intern) return { error: 'Intern not found' };
    intern.tasks = intern.tasks || [];
    intern.tasks.push(task);
    return await this.updateIntern({ id: internId, data: { tasks: intern.tasks } });
  },

  // 删除任务
  async deleteTask({ internId, taskId }) {
    const intern = await this.getIntern({ id: internId });
    if (!intern) return { error: 'Intern not found' };
    intern.tasks = intern.tasks.filter(t => t.id !== parseInt(taskId));
    return await this.updateIntern({ id: internId, data: { tasks: intern.tasks } });
  },

  // 获取所有导师
  async getMentors() {
    const res = await db.collection('mentors').get();
    return res.data.map(d => ({ ...d, _id: undefined }));
  },

  // 获取单个导师
  async getMentor({ id }) {
    const res = await db.collection('mentors').where({ id: parseInt(id) }).get();
    if (res.data.length === 0) return null;
    const d = res.data[0];
    delete d._id;
    return d;
  },

  // 获取应用配置
  async getConfig() {
    const res = await db.collection('app_config').limit(1).get();
    if (res.data.length === 0) return { role: null, userId: null };
    return res.data[0];
  },

  // 设置应用配置
  async setConfig({ config }) {
    const col = db.collection('app_config');
    const existing = await col.limit(1).get();
    if (existing.data.length > 0) {
      await col.doc(existing.data[0]._id).update({ data: config });
    } else {
      await col.add(config);
    }
    return { saved: true };
  },

  // 添加日志评论
  async addLogComment({ internId, week, comment }) {
    const intern = await this.getIntern({ id: internId });
    if (!intern) return { error: 'Intern not found' };
    const log = intern.logs.find(l => l.week === parseInt(week));
    if (log) {
      log.comments = log.comments || [];
      log.comments.push(comment);
      return await this.updateIntern({ id: internId, data: { logs: intern.logs } });
    }
    return { error: 'Log not found' };
  }
};

// ========== 云函数入口 ==========
exports.main = async (event, context) => {
  // CORS 处理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  try {
    const { action, data = {} } = event;

    if (!action || !handlers[action]) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid action', available: Object.keys(handlers) })
      };
    }

    const result = await handlers[action](data);

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (err) {
    console.error('API Error:', err);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
