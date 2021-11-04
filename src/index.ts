import { badImplementation } from '@hapi/boom';
import Express from 'express';
import { MongoClient } from 'mongodb';
import { BotApiController } from './controllers/BotApiController';
import { createRouter } from './routers/Router';

require('dotenv').config();

const {
  TOKEN, PORT, SERVER_URL, DB_URI, CMC_API_KEY,
} = process.env;

if (!TOKEN || !PORT || !SERVER_URL || !DB_URI || !CMC_API_KEY) {
  throw new Error('Some config data is absent');
}

const app = Express();

app.use(Express.json());

const client = new MongoClient(DB_URI);

const start = async () => {
  try {
    await client.connect();
    const db = client.db('TelegramUsersData');
    app.use(await createRouter(TOKEN, db));
    return app.listen(PORT, async () => {
      await BotApiController.setWebhook(
        `${SERVER_URL}/webhook/${TOKEN}`,
        TOKEN,
      );
    });
  } catch (e) {
    throw badImplementation('Start failed');
  }
};

start();

process.on('SIGINT', async () => {
  await BotApiController.deleteWebhook(TOKEN);
  client.close();
  process.exit();
});
