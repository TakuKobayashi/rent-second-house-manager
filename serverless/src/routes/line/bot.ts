import { setupFireStore } from '../../common/firestore';
import { TextMessage, LocationMessage, TemplateMessage } from '@line/bot-sdk';
import { lineBotRichmenuRouter } from './extends/richmenu';
import { lineBotClient, lineUsersCollectionName } from '../../types/line';
import fs from 'fs';
import { parse, stringify } from 'query-string';

const firestore = setupFireStore();

export async function lineBotRouter(app, opts): Promise<void> {
  app.get('/', async (req, res) => {
    res.send('hello line');
  });
  app.get('/push_message', async (req, res) => {
    const message: TextMessage = {
      type: 'text',
      text: 'これはテストです',
    };
    const firestore = setupFireStore();
    const docsQuery = await firestore.collection(lineUsersCollectionName).get();
    const result = await Promise.all(
      docsQuery.docs.map((doc) => {
        return lineBotClient.pushMessage(doc.id, message);
      }),
    );
    console.log(result);
    return 'hello line';
  });
  app.post('/message', async (req, res) => {
    const messageEvent = req.body;
    const eventReplyPromises: Promise<void>[] = [];
    for (const event of messageEvent.events) {
      eventReplyPromises.push(handleEvent(event));
    }

    await Promise.all(eventReplyPromises);
    return messageEvent;
  });
  app.register(lineBotRichmenuRouter, { prefix: '/richmenu' });
}

async function handleEvent(event): Promise<void> {
  console.log(event);
  if (event.type === 'follow') {
    const profile = await lineBotClient.getProfile(event.source.userId);
    await firestore.collection(lineUsersCollectionName).doc(event.source.userId).set({
      line_user_id: event.source.userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl,
    });
  } else if (event.type === 'unfollow') {
    await firestore.collection(lineUsersCollectionName).doc(event.source.userId).delete();
  } else if (event.type === 'postback') {
    const postbackDataObj = parse(event.postback.data);
    if (postbackDataObj.action === "house_location") {
    }else if (postbackDataObj.action === "request_reserve") {
    }else if (postbackDataObj.action === "reserve_input_start_datetime") {
      const startDate = new Date(event.postback.params.datetime);
      const echo: TemplateMessage = {
        type: 'template',
        altText: 'will reserve date',
        template: {
          type: 'buttons',
          text: '予約したい日時を入力してください',
          actions: [
            {
              type: "datetimepicker",
              data: stringify({action: "reserve_input_end_datetime"}),
              mode: "datetime",
              label: '予約終了日時を入力してください',
              min: event.postback.params.datetime,
            },
          ],
        },
      };
//      const echo: TextMessage = { type: 'text', text: event.message.text };
      await lineBotClient.replyMessage(event.replyToken, echo);
    }else if (postbackDataObj.action === "reserve_input_end_datetime") {
    }else if (postbackDataObj.action === "reserve") {
    }
  } else if (event.type === 'message') {
    if (event.message.type === 'text') {
      const now  = new Date()
      const echo: TemplateMessage = {
        type: 'template',
        altText: 'will reserve date',
        template: {
          type: 'buttons',
          text: '予約したい日時を入力してください',
          actions: [
            {
              type: "datetimepicker",
              /**
               * String returned via webhook in the `postback.data` property of the
               * postback event (Max: 300 characters)
               */
              data: stringify({action: "reserve_input_start_datetime"}),
              mode: "datetime",
              /**
               * Initial value of date or time
               */
              label: '予約開始日時を入力してください',
            },
          ],
        },
      };
//      const echo: TextMessage = { type: 'text', text: event.message.text };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (event.message.type === 'image') {
      const content = await lineBotClient.getMessageContent(event.message.id);
      content.pipe(fs.createWriteStream(event.message.id + '.jpg'));
      const echo: TextMessage = { type: 'text', text: event.message.id + '.jpg image save complete' };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (event.message.type === 'location') {
      const echo: LocationMessage = {
        type: 'location',
        title: event.message.address,
        address: "東京都府中市西府町1-40-12",
        latitude: 35.6735238,
        longitude: 139.4516319,
      };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (event.message.type === 'audio') {
      const content = await lineBotClient.getMessageContent(event.message.id);
      content.pipe(fs.createWriteStream(event.message.id + '.wav'));
      const echo: TextMessage = { type: 'text', text: event.message.id + '.wav audio save complete' };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (event.message.type === 'sticker') {
      const echo: TextMessage = { type: 'text', text: 'sticker message received' };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (event.message.type === 'video') {
      const content = await lineBotClient.getMessageContent(event.message.id);
      content.pipe(fs.createWriteStream(event.message.id + '.mp4'));
      const echo: TextMessage = { type: 'text', text: event.message.id + '.mp4 video save complete' };
      await lineBotClient.replyMessage(event.replyToken, echo);
    }
  }
}
