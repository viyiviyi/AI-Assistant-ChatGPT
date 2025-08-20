// 类型定义文件
export interface TTSRequestConfig {
  apiUrl: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
}
export interface TTSTask {
  text: string;
  apiUrl: string;
  method: string;
  headers: Record<string, string>;
  audioBuffer: AudioBuffer | null;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'error';
}
export interface VoiceOption {
  value: string;
  label: string;
  gender?: 'male' | 'female' | 'neutral';
  language?: string;
  [key: string]: any;
}
export type DataTransformer<T = any> = (data: T) => VoiceOption[];
// 主类实现
export class TTSService {
  private queue: TTSTask[];
  private isPlaying: boolean;
  private isPaused: boolean;
  private audioContext: AudioContext | null;
  private preloadCount: number;
  private currentSource: AudioBufferSourceNode | null;
  constructor() {
    this.queue = [];
    this.isPlaying = false;
    this.isPaused = false;
    this.audioContext = null;
    this.preloadCount = 2;
    this.currentSource = null;
  }
  /**
   * 初始化音频上下文
   */
  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new window.AudioContext();
    }
  }
  /**
   * 说话接口
   */
  async speak(
    text: string,
    immediate: boolean,
    apiUrl: string,
    method: string = 'GET',
    headers: Record<string, string> = {}
  ): Promise<void> {
    this.initAudioContext();
    const ttsTask: TTSTask = {
      text,
      apiUrl,
      method,
      headers,
      audioBuffer: null,
      status: 'pending',
    };
    if (immediate) {
      this.queue.unshift(ttsTask);
    } else {
      this.queue.push(ttsTask);
    }
    await this.preloadTasks();
    if (!this.isPlaying && !this.isPaused) {
      await this.playNext();
    }
  }
  /**
   * 预加载音频任务
   */
  private async preloadTasks(): Promise<void> {
    const pendingTasks = this.queue.filter((task) => task.status === 'pending' && task.audioBuffer === null);
    const tasksToPreload = pendingTasks.slice(0, this.preloadCount);
    for (const task of tasksToPreload) {
      task.status = 'generating';
      try {
        task.audioBuffer = await this.generateTTS(task.text, task.apiUrl, task.method, task.headers);
        task.status = 'ready';
      } catch (error) {
        console.error('TTS生成失败:', error);
        task.status = 'error';
      }
    }
  }
  /**
   * 生成TTS音频
   */
  private async generateTTS(text: string, apiUrl: string, method: string, headers: Record<string, string>): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext未初始化');
    }
    const response = await fetch(apiUrl.replace('{{text}}', text), {
      method,
      headers: {
        ...headers,
      },
      body: method !== 'GET' ? JSON.stringify({ text }) : undefined,
    });
    if (!response.ok) {
      throw new Error(`TTS请求失败: ${response.status}`);
    }
    const audioData = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(audioData);
  }
  /**
   * 播放下一个任务
   */
  private async playNext(): Promise<void> {
    if (this.isPaused || this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.isPlaying = true;
    const currentTask = this.queue[0];
    if (currentTask.status !== 'ready') {
      currentTask.status = 'generating';
      try {
        currentTask.audioBuffer = await this.generateTTS(currentTask.text, currentTask.apiUrl, currentTask.method, currentTask.headers);
        currentTask.status = 'ready';
      } catch (error) {
        console.error('TTS生成失败:', error);
        this.queue.shift();
        await this.playNext();
        return;
      }
    }
    if (!currentTask.audioBuffer) {
      this.queue.shift();
      await this.playNext();
      return;
    }
    currentTask.status = 'playing';
    const source = this.audioContext!.createBufferSource();
    source.buffer = currentTask.audioBuffer;
    source.connect(this.audioContext!.destination);
    this.currentSource = source;
    await new Promise<void>((resolve) => {
      source.onended = () => {
        this.queue.shift();
        resolve();
      };
      source.start();
    });
    await this.preloadTasks();
    if (this.queue.length > 0 && !this.isPaused) {
      await this.playNext();
    } else {
      this.isPlaying = false;
    }
  }
  /**
   * 清空队列并停止播放
   */
  clearQueue(): void {
    this.queue = [];
    this.isPlaying = false;
    this.isPaused = false;
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
  }
  /**
   * 暂停播放
   */
  pause(): void {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
      if (this.currentSource) {
        this.currentSource.stop();
        this.currentSource = null;
      }
    }
  }
  /**
   * 恢复播放
   */
  async resume(): Promise<void> {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.queue.length > 0) {
        await this.playNext();
      }
    }
  }
  /**
   * 获取发音人列表
   */
  async getVoices<T = any>(
    apiUrl: string,
    method: string = 'GET',
    headers: Record<string, string> = {},
    dataTransformer?: DataTransformer<T>
  ): Promise<VoiceOption[]> {
    try {
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      if (!response.ok) {
        throw new Error(`获取发音人失败: ${response.status}`);
      }
      const data: T = await response.json();
      if (dataTransformer) {
        return dataTransformer(data);
      }
      // 默认转换逻辑
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          value: item.value || item.id || item.name,
          label: item.label || item.name || item.value,
          gender: item.gender,
          language: item.language,
        }));
      }
      throw new Error('返回数据格式不支持');
    } catch (error) {
      console.error('获取发音人失败:', error);
      throw error;
    }
  }
  /**
   * 设置预加载数量
   */
  setPreloadCount(count: number): void {
    this.preloadCount = Math.max(0, count);
  }
  /**
   * 获取当前队列状态
   */
  getQueueStatus(): { length: number; tasks: TTSTask[] } {
    return {
      length: this.queue.length,
      tasks: [...this.queue],
    };
  }
  /**
   * 获取播放状态
   */
  getPlaybackStatus(): { isPlaying: boolean; isPaused: boolean } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
    };
  }
}
// 使用示例
// const ttsService = new TTSService();
// // 设置预加载数量
// ttsService.setPreloadCount(3);
// // 获取发音人列表 - 带自定义转换
// const voices = await ttsService.getVoices(
//   '/api/voices',
//   'GET',
//   { Authorization: 'Bearer token' },
//   (data: { voices: Array<{ id: string; name: string; gender: string }> }) =>
//     data.voices.map((v) => ({
//       value: v.id,
//       label: v.name,
//       gender: v.gender as 'male' | 'female',
//     }))
// );
// // 正常播放
// ttsService.speak('你好，我是黑塔', false, '/api/tts', 'POST', {
//   Authorization: 'Bearer your-token',
//   'Voice-Id': 'voice-id',
// });
// // 获取当前状态
// const status = ttsService.getPlaybackStatus();
// const queueInfo = ttsService.getQueueStatus();
