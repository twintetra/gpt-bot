import {Configuration, OpenAIApi, ChatCompletionRequestMessage, ChatCompletionResponseMessage} from 'openai';
import config from 'config';
import {createReadStream} from 'fs';

interface IOpenAi {
  chat(messages: ChatCompletionRequestMessage[]): Promise<ChatCompletionResponseMessage>;
  transcription(filePath: string): Promise<string>;
}

export enum ChatCompletionRoleEnum {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

class OpenAI implements IOpenAi {
  openai;
  constructor(apiKey: string) {
    const configuration = new Configuration({
      apiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async chat(messages: ChatCompletionRequestMessage[]): Promise<ChatCompletionResponseMessage> {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages,
      });
      return response.data.choices[0].message as ChatCompletionResponseMessage;
    } catch (e) {
      console.log('Error gpt chat: ', e);
      throw e;
    }
  }

  async transcription(filePath: string): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const response = await this.openai.createTranscription(createReadStream(filePath), 'whisper-1');
      return response.data.text;
    } catch (e) {
      console.log('Error transcription: ', e);
      throw e;
    }
  }
}

export const openai = new OpenAI(config.get('OPENAI_KEY'));
