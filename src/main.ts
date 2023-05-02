import {Telegraf, session, Context} from 'telegraf';
import {code} from 'telegraf/format';
import config from 'config';
import {oggConverter} from './ogg';
import {ChatCompletionRoleEnum, openai} from './openai';

interface IMessages {
  role: ChatCompletionRoleEnum;
  content: string;
}

interface IBotContext extends Context {
  session: {
    messages: IMessages[];
  };
}

const bot = new Telegraf<IBotContext>(config.get('TELEGRAM_TOKEN'));
bot.use(session());

bot.command('new', async (context) => {
  context.session = {messages: []};
  await context.reply(code('Сессия очищена. Жду ваше голосовое или текстовое сообщение'));
});

bot.command('start', async (context) => {
  context.session = {messages: []};
  await context.reply(code('Новая сессия. Жду ваше голосовое или текстовое сообщение'));
});

bot.on('voice', async (context) => {
  context.session ??= {messages: []};
  try {
    await context.reply(code('Сообщение принял. Жду ответ...'));
    const link = await context.telegram.getFileLink(context.message.voice.file_id);
    const userId = String(context.message.from.id);
    const oggPath = await oggConverter.create(link.href, userId);
    const mp3Path = await oggConverter.toMp3(oggPath, userId);
    const text = await openai.transcription(mp3Path);
    await context.reply(code(`Ваш запрос: ${text}`));
    context.session.messages.push({role: ChatCompletionRoleEnum.USER, content: text});
    const response = await openai.chat(context.session.messages);
    context.session.messages.push({role: ChatCompletionRoleEnum.ASSISTANT, content: response.content});
    await context.reply(response.content);
  } catch (e) {
    console.error('Voice error: ', e);
  }
});

bot.on('text', async (context) => {
  context.session ??= {messages: []};
  try {
    await context.reply(code('Сообщение принял. Жду ответ...'));
    context.session.messages.push({role: ChatCompletionRoleEnum.USER, content: context.message.text});
    const response = await openai.chat(context.session.messages);
    context.session.messages.push({role: ChatCompletionRoleEnum.ASSISTANT, content: response.content});
    await context.reply(response.content);
  } catch (e) {
    console.error('Text error: ', e);
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
