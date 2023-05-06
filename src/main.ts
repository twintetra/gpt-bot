import {Telegraf, session, Context} from 'telegraf';
import {code} from 'telegraf/format';
import config from 'config';
import {oggConverter} from './ogg';
import {ChatCompletionRoleEnum, openai} from './openai';
import {validID} from './utils';

interface IMessages {
  role: ChatCompletionRoleEnum;
  content: string;
}

interface IBotContext extends Context {
  session: {
    [key: string]: {
      messages: IMessages[];
    };
  };
}

const bot = new Telegraf<IBotContext>(config.get('TELEGRAM_TOKEN'));
bot.use(session());

bot.command('new', async (context) => {
  const id = context.message.from.id;
  if (validID(id)) {
    await context.reply(code('Your ID was not found in the database. Please contact the admin.'));
    return;
  }
  context.session = {[id]: {messages: []}};
  await context.reply(code('The session has been cleared. I am waiting for your voice or text message.'));
});

bot.command('start', async (context) => {
  const id = context.message.from.id;
  if (validID(id)) {
    await context.reply(code('Your ID was not found in the database. Please contact the admin.'));
    return;
  }
  context.session = {[id]: {messages: []}};
  await context.reply(
    code('New session. Waiting for your voice or text message. Use the command /new to clear the session.')
  );
});

bot.command('id', async (context) => {
  await context.reply(`Your telegram ID: ${context.message.from.id}`);
});

bot.on('voice', async (context) => {
  const id = context.message.from.id;
  if (validID(id)) {
    await context.reply(code('Your ID was not found in the database. Please contact the admin.'));
    return;
  }
  context.session = {[id]: {messages: []}};
  try {
    await context.reply(code('Message received. Waiting for a response...'));
    const link = await context.telegram.getFileLink(context.message.voice.file_id);
    const userId = String(context.message.from.id);
    const oggPath = await oggConverter.create(link.href, userId);
    const mp3Path = await oggConverter.toMp3(oggPath, userId);
    const text = await openai.transcription(mp3Path);
    await context.reply(code(`Your request: ${text}`));
    context.session[id].messages.push({role: ChatCompletionRoleEnum.USER, content: text});
    const response = await openai.chat(context.session[id].messages);
    context.session[id].messages.push({role: ChatCompletionRoleEnum.ASSISTANT, content: response.content});
    await context.reply(response.content);
  } catch (e) {
    console.log('Voice error: ', e);
  }
});

bot.on('text', async (context) => {
  const id = context.message.from.id;
  if (validID(context.message.from.id)) {
    await context.reply(code('Your ID was not found in the database. Please contact the admin.'));
    return;
  }
  context.session ??= {[id]: {messages: []}};
  try {
    await context.reply(code('Message received. Waiting for a response...'));
    context.session[id].messages.push({role: ChatCompletionRoleEnum.USER, content: context.message.text});
    const response = await openai.chat(context.session[id].messages);
    context.session[id].messages.push({role: ChatCompletionRoleEnum.ASSISTANT, content: response.content});
    await context.reply(response.content);
  } catch (e) {
    console.log('Text error: ', e);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
