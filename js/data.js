// 业务部实习生成长导航智能看板 - 模拟数据

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

// 12周带教计划模板
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

// 生成实习生数据
function generateInterns() {
  const interns = [];
  const today = new Date('2025-05-01');

  for (let i = 0; i < 20; i++) {
    const position = POSITIONS[i % 3];
    const mentor = MENTORS.find(m => m.department === position);
    const currentWeek = Math.floor(Math.random() * 5) + 1; // 1-5周
    const statusRoll = Math.random();
    const status = statusRoll > 0.7 ? STATUS.ADAPTED : statusRoll > 0.3 ? STATUS.ATTENTION : STATUS.RISK;

    interns.push({
      id: i + 1,
      name: NAMES[i],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}&backgroundColor=b6e3f4`,
      position: position,
      mentorId: mentor.id,
      joinDate: '2025-05-01',
      currentWeek: currentWeek,
      status: status,
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

  for (let w = 1; w <= Math.min(currentWeek, 12); w++) {
    const weekPlan = template[w - 1];
    weekPlan.tasks.forEach((taskTitle, idx) => {
      tasks.push({
        id: taskId++,
        internId: internId,
        week: w,
        title: taskTitle,
        description: `${position}岗位第${w}周任务：${taskTitle}`,
        completed: w < currentWeek || (w === currentWeek && idx < 2),
        deadline: getWeekDeadline(w)
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

  for (let w = 1; w < currentWeek; w++) {
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
    // 模拟分数随时间逐步提升的趋势
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

// AI回复模板库
const AI_TEMPLATES = {
  intern: {
    learning: [
      '本周建议你重点学习{topic}。作为{position}实习生，这个阶段打好基础非常关键。推荐资料：内部Wiki「{position}入门指南」。',
      '根据你的当前进度（第{week}周），建议你把精力放在{topic}上。记得每天记录学习心得，周末做一个小复盘。'
    ],
    task: [
      '这个任务可以从以下几步入手：\n1. 先理解需求和背景\n2. 查阅相关文档和代码\n3. 画出大致的实现思路\n4. 小步迭代，及时与导师同步\n遇到困难不要硬扛，主动求助是高效的表现！',
      '做这类任务的关键是"先整体后细节"。建议你先用30分钟梳理清楚目标和约束条件，再动手执行。有卡点随时找导师沟通。'
    ],
    log: [
      '看了你的周记，感触很深！你在{highlight}方面做得特别好。关于你提到的困难，建议：{suggestion}。继续加油！',
      '你的自我反思能力很强！第{week}周能有这样的收获很不容易。针对{difficulty}，推荐你试试{solution}。'
    ]
  },
  mentor: {
    internStatus: [
      '{name}目前处于第{week}周，整体进度{status}。最近完成的{task}质量不错，但在{weakness}方面还有提升空间。建议下周重点关注。',
      '{name}这周的日志写得很有深度，能看出来在认真思考。{strength}是TA的优势，可以多加培养。'
    ],
    teaching: [
      '带教这个阶段的关键是"引导而非代劳"。建议让实习生先独立尝试，你在关键节点给方向性建议。',
      '可以尝试"任务拆解法"：把大任务拆成3-5个小里程碑，每完成一个及时给反馈，建立正循环。'
    ]
  },
  hr: {
    overview: [
      '目前20名实习生中，{adapted}人适应良好，{attention}人需要关注，{risk}人存在风险。建议重点关注{position}岗位的风险人员。',
      '本周日志提交率{logRate}%，整体学习氛围不错。{highlight}的导师带教质量排名靠前，可以考虑作为优秀案例分享。'
    ]
  }
};

// 学习资源
const RESOURCES = {
  '研发': [
    { title: 'Git工作流最佳实践', type: '文档', url: '#' },
    { title: '代码规范手册', type: '文档', url: '#' },
    { title: 'JavaScript高级程序设计', type: '书籍', url: '#' },
    { title: '系统设计入门', type: '视频', url: '#' }
  ],
  '产品': [
    { title: '需求文档撰写规范', type: '文档', url: '#' },
    { title: '用户体验五要素', type: '书籍', url: '#' },
    { title: '数据分析入门', type: '视频', url: '#' },
    { title: 'Axure原型设计教程', type: '视频', url: '#' }
  ],
  '销售': [
    { title: '产品卖点话术手册', type: '文档', url: '#' },
    { title: '商务谈判技巧', type: '视频', url: '#' },
    { title: '客户成功案例分析', type: '文档', url: '#' },
    { title: 'CRM系统使用指南', type: '文档', url: '#' }
  ]
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { POSITIONS, STATUS, MENTORS, TEMPLATES, AI_TEMPLATES, RESOURCES, generateInterns };
}
