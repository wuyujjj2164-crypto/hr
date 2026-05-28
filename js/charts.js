// Chart.js 图表初始化

const Charts = {
  instances: {},

  // 岗位分布饼图
  positionPie(ctx) {
    const interns = Storage.getInterns();
    const counts = {};
    interns.forEach(i => { counts[i.position] = (counts[i.position] || 0) + 1; });

    this.instances.positionPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(counts),
        datasets: [{
          data: Object.values(counts),
          backgroundColor: ['#0052D9', '#00C853', '#FF9100'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  },

  // 导师负载柱状图
  mentorLoadBar(ctx) {
    const mentors = Storage.getMentors();
    const interns = Storage.getInterns();
    const labels = mentors.map(m => m.name);
    const data = mentors.map(m => interns.filter(i => i.mentorId === m.id).length);

    this.instances.mentorLoadBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '带教学员数',
          data,
          backgroundColor: '#0052D9',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  },

  // 适岗雷达图
  capabilityRadar(ctx, scores) {
    if (this.instances.radar) {
      this.instances.radar.destroy();
    }
    this.instances.radar = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['学习能力', '业务理解', '团队协作', '产出质量'],
        datasets: [{
          label: '能力评估',
          data: [scores.learning, scores.business, scores.teamwork, scores.output],
          backgroundColor: 'rgba(0, 82, 217, 0.2)',
          borderColor: '#0052D9',
          pointBackgroundColor: '#0052D9'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 }
          }
        }
      }
    });
  },

  // 日志活跃度柱状图
  logActivityBar(ctx) {
    const interns = Storage.getInterns();
    const mentors = Storage.getMentors();

    // 统计每个导师名下实习生的日志提交率
    const labels = mentors.map(m => m.name);
    const submitRates = mentors.map(m => {
      const ms = interns.filter(i => i.mentorId === m.id);
      const totalPossible = ms.reduce((sum, i) => sum + (i.currentWeek - 1), 0);
      const totalSubmitted = ms.reduce((sum, i) => sum + i.logs.length, 0);
      return totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0;
    });

    this.instances.logActivity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: '日志提交率(%)',
          data: submitRates,
          backgroundColor: submitRates.map(r => r >= 80 ? '#00C853' : r >= 50 ? '#FF9100' : '#F5222D'),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } }
      }
    });
  },

  // 状态分布柱状图
  statusBar(ctx) {
    const interns = Storage.getInterns();
    const counts = { adapted: 0, attention: 0, risk: 0 };
    interns.forEach(i => { counts[i.status]++; });

    this.instances.statusBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['适应良好', '需关注', '存在风险'],
        datasets: [{
          data: [counts.adapted, counts.attention, counts.risk],
          backgroundColor: ['#00C853', '#FF9100', '#F5222D'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  },

  destroyAll() {
    Object.values(this.instances).forEach(chart => chart.destroy());
    this.instances = {};
  }
};
