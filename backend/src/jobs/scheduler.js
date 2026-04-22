const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../shared/utils/logger');

const jobs = [];

function register(name, schedule, fn) {
  const task = cron.schedule(schedule, async () => {
    logger.info({ job: name }, 'Job started');
    try {
      await fn();
      logger.info({ job: name }, 'Job completed');
    } catch (err) {
      logger.error({ err, job: name }, 'Job failed');
    }
  });
  jobs.push({ name, task });
  logger.info({ job: name, schedule }, 'Job registered');
}

function startAll() {
  const { runComplianceAlerts } = require('./complianceAlerts.job');
  const { runAiDigest } = require('./aiDigest.job');

  register('compliance-alerts', env.cron.complianceAlerts, runComplianceAlerts);
  register('ai-digest', env.cron.aiDigest, runAiDigest);

  logger.info({ count: jobs.length }, 'All jobs registered');
}

function stopAll() {
  for (const { task } of jobs) task.stop();
}

module.exports = { startAll, stopAll };
