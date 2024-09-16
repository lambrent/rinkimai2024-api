const _ = require('lodash');
const moment = require('moment');
const { v4: uuid} = require('uuid');

const { redis } = require('../redis');
const { logger } = require('../utils/logger');
const { get } = require('../utils/getData');
const { extractYoutubeID } = require('../utils/extractYoutubeId');

const env = 'dev';

exports.debates = async (req, res) => {
  try {
    const uid = uuid();
    const response = [];
    // Get cached and updated data.
    const data = await get();
  
    // Get platform by key. If platform not exist, response as "access denied".
    const platform = _.find(data.platforms, (platform) => platform.key === req.params.platform);
    if (!platform) {
      return res.status(400).json({ error: 'Access denied.' });
    }
    if (data.settings.bucket === 'true') logger.info('Request', { request_id: uid, event: 'request', platform_id: platform.id, platform_name: platform.name, env, target: 'debates' });
    if (data.settings.json === 'false') return res.json({
      status: 'STOPPED',
      data: []
    });
  
    // Group debates by round 1 and 2 and check round settings.
    const debatesRoundGrouped = _.groupBy(data.debates, (debate) => debate.round);
    const enambledRounds = [];
    if (data.settings['round-1'] === 'true') {
      enambledRounds.push(1);
      response.push({ round: 1, data: debatesRoundGrouped['1'] || [] });
    }
    if (data.settings['round-2'] === 'true') {
      enambledRounds.push(2);
      response.push({ round: 2, data: debatesRoundGrouped['2'] || [] });
    }
  
    return res.json({
      status: 'OK',
      settings: {
        enabled: data.settings.json,
        mainRound: Number(data.settings.round) || 1,
        enambledRounds: [1, 2],
      },
      data: response.map((group) => ({
        round: group.round,
        data: groupByMunicipality(formatDebate(group.data)),
      })),
    });
  } catch (e) {
    logger.error(JSON.stringify(e));
    return res.status(400).json({
      status: 'ERROR',
      message: 'Sorry something, went wrong',
      data: [],
    });
  }
}

exports.pick = async (req, res) => {
  try {
    const uid = uuid();
    const data = await get();
  
    const platform = _.find(data.platforms, (platform) => platform.key === req.params.platform);
    if (!platform) {
      return res.status(400).json({ error: 'Access denied.' });
    }
  
    if (data.settings.bucket === 'true') logger.info('Request', { request_id: uid, event: 'request', platform_id: platform.id, platform_name: platform.name, env, target: 'pick' });
  
    if (data.settings.json === 'false') return res.json({
      status: 'STOPPED',
      data: []
    });
  
    if (data.settings.statistics === 'true') redis.hincrby(`${platform.id}:${platform.name}:count`, moment().format('YYYY-MM-DDTHH'), 1);
  
    const debate = await getDebate(platform, data.debates, Number(data.settings.round) || 1);
  
    const format = await formatDebate([debate ? debate : await getDebate(platform, data.debates, Number(data.settings.round) || 1)]);
  
    if (data.settings.bucket === 'true') logger.info('Pick', { request_id: uid, debate: format[0], event: 'response', platform_id: platform.id, platform_name: platform.name, env, target: 'pick' });
  
    return res.json({
      status: 'OK',
      data: format,
    });
  } catch (e) {
    logger.error(JSON.stringify(e));
    return res.status(400).json({
      status: 'ERROR',
      message: 'Sorry something, went wrong',
      data: [],
    });
  }
}

function formatDebate(data) {
  return data.map(({ id, type, round, youtube: youtube_url, municipality }) => {
    const youtube_id = extractYoutubeID(youtube_url);
    return ({
      id,
      municipality,
      type,
      round,
      youtube_id,
      youtube_url,
      // youtube_thumbnail: `https://img.youtube.com/vi/${youtube_id}/mq1.jpg`,
      youtube_thumbnail: `https://img.youtube.com/vi/${youtube_id}/mqdefault.jpg`,
    });
  });
}

function groupByMunicipality(array) {
  return Object.values(
    array.reduce((result, obj) => {
      const { municipality, ...data } = obj;
      const dataWithMunicipality = { municipality, ...data };
      result[municipality] = result[municipality] || { municipality, data: [] };
      result[municipality].data.push(dataWithMunicipality);
      return result;
    }, {})
  );
}

async function getDebate(platform, debates, round = 1) {
  let debate_id = await redis.lpop(`${platform.id}:queue`);
  if (!debate_id) {
    const [id, ...ids] = debates.filter((debate) => debate.round === Number(round)).map((debate => debate.id));
    await redis.rpush(`${platform.id}:queue`, ids);
    debate_id = id;
  }
  return _.find(debates, (debate) => debate.id === debate_id);
}