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
    if (postbackDataObj.action === 'house_location') {
      const echo: LocationMessage = {
        type: 'location',
        title: event.message.address,
        address: '東京都府中市西府町1-40-12',
        latitude: 35.6735238,
        longitude: 139.4516319,
      };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (postbackDataObj.action === 'request_reserve') {
      const now = new Date();
      const echo: TemplateMessage = {
        type: 'template',
        altText: 'Input start datetime will be reserved',
        template: {
          type: 'buttons',
          text: '利用開始はいつからですか?',
          actions: [
            {
              type: 'datetimepicker',
              data: stringify({ action: 'reserve_input_start_datetime' }),
              mode: 'datetime',
              label: '日時を入力',
            },
          ],
        },
      };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (postbackDataObj.action === 'reserve_input_start_datetime') {
      const startDate = new Date(event.postback.params.datetime);
      console.log(startDate);
      const echo: TemplateMessage = {
        type: 'template',
        altText: 'Input end datetime will be reserved',
        template: {
          type: 'buttons',
          text: '利用終了はいつですか?',
          actions: [
            {
              type: 'datetimepicker',
              data: stringify({ action: 'reserve_input_end_datetime' }),
              mode: 'datetime',
              label: '日時を入力',
              min: event.postback.params.datetime,
            },
          ],
        },
      };
      //      const echo: TextMessage = { type: 'text', text: event.message.text };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (postbackDataObj.action === 'reserve_input_end_datetime') {
      const echo: TemplateMessage = {
        type: 'template',
        altText: 'Input end datetime will be reserved',
        template: {
          type: 'confirm',
          text: '予約しますか??',
          actions: [
            {
              type: 'postback',
              label: '予約する',
              data: stringify({ action: 'reserve' }),
            },
            {
              type: 'postback',
              label: '予約しない',
              data: stringify({ action: 'unreserve' }),
            },
          ],
        },
      };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (postbackDataObj.action === 'reserve') {
      const echo: TextMessage = { type: 'text', text: '予約が完了しました' };
      await lineBotClient.replyMessage(event.replyToken, echo);
    } else if (postbackDataObj.action === 'unreserve') {
      const echo: TextMessage = { type: 'text', text: '予約しませんでした' };
      await lineBotClient.replyMessage(event.replyToken, echo);
    }
  } else if (event.type === 'message') {
    if (event.message.type === 'text') {
      const now = new Date();
      const echo: TemplateMessage = {
        type: 'template',
        altText: 'will reserve date',
        template: {
          type: 'buttons',
          text: '利用開始はいつからですか?',
          actions: [
            {
              type: 'postback',
              data: stringify({ action: 'request_reserve' }),
              label: '予約を開始する',
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
        address: '東京都府中市西府町1-40-12',
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
