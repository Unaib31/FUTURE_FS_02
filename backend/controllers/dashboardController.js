import { Lead } from '../models/index.js';
import sequelize from '../config/db.js';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. High-Level Counts
    const totalLeads = await Lead.count();
    const activeLeads = await Lead.count({
      where: {
        status: ['New', 'Contacted', 'Qualified', 'Proposal Sent']
      }
    });
    const wonLeads = await Lead.count({ where: { status: 'Won' } });
    const lostLeads = await Lead.count({ where: { status: 'Lost' } });

    // 2. Financial Pipelines
    const totalPipelineResult = await Lead.findAll({
      attributes: [[sequelize.fn('SUM', sequelize.col('value')), 'totalValue']]
    });
    const totalPipeline = parseFloat(totalPipelineResult[0]?.getDataValue('totalValue')) || 0;

    const activePipelineResult = await Lead.findAll({
      where: {
        status: ['New', 'Contacted', 'Qualified', 'Proposal Sent']
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('value')), 'totalValue']]
    });
    const activePipeline = parseFloat(activePipelineResult[0]?.getDataValue('totalValue')) || 0;

    // 3. Conversion Rate Calculation (Won / (Won + Lost))
    const closedCount = wonLeads + lostLeads;
    const conversionRate = closedCount > 0 ? Math.round((wonLeads / closedCount) * 100) : 0;

    // 4. Stage-by-Stage Breakdown
    // Since SQL GROUP BY can return incomplete sets depending on the database,
    // we initialize all stages to guarantee consistency on the frontend dashboard.
    const stages = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
    const stageCounts = {};
    const stageValues = {};
    
    stages.forEach(stage => {
      stageCounts[stage] = 0;
      stageValues[stage] = 0;
    });

    const stageBreakdown = await Lead.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('value')), 'value']
      ],
      group: ['status']
    });

    stageBreakdown.forEach(item => {
      const status = item.getDataValue('status');
      if (stages.includes(status)) {
        stageCounts[status] = parseInt(item.getDataValue('count')) || 0;
        stageValues[status] = parseFloat(item.getDataValue('value')) || 0;
      }
    });

    const stageData = stages.map(stage => ({
      stage,
      count: stageCounts[stage],
      value: stageValues[stage]
    }));

    // 5. Source Breakdown
    const sourceBreakdown = await Lead.findAll({
      attributes: [
        'source',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['source']
    });

    const sourceData = sourceBreakdown.map(item => ({
      source: item.getDataValue('source'),
      count: parseInt(item.getDataValue('count')) || 0
    }));

    // 6. 5 Most Recent Leads
    const recentLeads = await Lead.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      summary: {
        totalLeads,
        activeLeads,
        wonLeads,
        lostLeads,
        totalPipeline,
        activePipeline,
        conversionRate
      },
      stageDistribution: stageData,
      sourceDistribution: sourceData,
      recentLeads
    });
  } catch (error) {
    console.error('Error generating dashboard analytics:', error);
    return res.status(500).json({ message: 'Error retrieving dashboard analytics', error: error.message });
  }
};
