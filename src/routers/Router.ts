/* eslint-disable import/prefer-default-export */
import { Request, Response, Router } from 'express';
import { Db } from 'mongodb';
import { BotApiController } from '../controllers/BotApiController';
import { CommandController } from '../controllers/CommandController';

export const createRouter = (token: string, db: Db) => {
  const router = Router();

  router.post(`/webhook/${token}`, (req: Request, res: Response) => {
    let id: string; let username: string; let text: string; let
      messageId: string;
    let isCallbackQuery = false;

    if (req.body.message?.chat) {
      id = req.body.message.chat.id;
      username = req.body.message.chat.username;
      text = req.body.message.text;
    } else {
      messageId = req.body.callback_query.message.message_id;
      id = req.body.callback_query.from.id;
      username = req.body.callback_query.from.username;
      text = req.body.callback_query.data;
      isCallbackQuery = true;
    }

    const [command, parameter] = text.trim().split(/\s+/);
    switch (command) {
      case '/start':
        CommandController.start(token, id, username);
        break;

      case '/help':
        CommandController.help(token, id);
        break;

      case '/listRecent':
        CommandController.listRecent(token, id, { limit: '25' });
        break;

      case command.match(/^\/[A-Z]+$/) ? command : undefined:
        CommandController.currency(token, id, db, {
          symbol: command.replace('/', ''),
        });
        break;

      case '/addToFavorite':
        if (parameter) {
          if (isCallbackQuery) {
            CommandController.addToFavorite(token, id, parameter, db, {
              chat_id: id,
              message_id: messageId!,
            });
          } else {
            CommandController.addToFavorite(token, id, parameter, db);
          }
        } else {
          BotApiController.sendMessage(token, {
            chat_id: id,
            text: `Sorry, but for ${command} need parameter \n(ex. '${command} BTC')`,
          });
        }
        break;

      case '/listFavorite':
        CommandController.listFavorite(token, id, db);
        break;

      case '/deleteFavorite':
        if (parameter) {
          if (isCallbackQuery) {
            CommandController.deleteFavorite(token, id, parameter, db, {
              chat_id: id,
              message_id: messageId!,
            });
          } else {
            CommandController.deleteFavorite(token, id, parameter, db);
          }
        } else {
          BotApiController.sendMessage(token, {
            chat_id: id,
            text: `Sorry, but for ${command} need parameter \n(ex. '${command} BTC')`,
          });
        }
        break;

      default:
        break;
    }

    return res.send();
  });

  return router;
};
