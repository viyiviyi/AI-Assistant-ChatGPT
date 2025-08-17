import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../ChatManagement';

export function useSpeechSynthesis() {
  const [synth, setObj] = useState<SpeechSynthesis>();
  const retrieved = useRef(false);
  useEffect(() => {
    if (retrieved.current) return;
    retrieved.current = true;
    setObj(window.speechSynthesis);
  }, []);

  return synth;
}

export function useSpeak() {
  const synth = useSpeechSynthesis();
  const { chatMgt } = useContext(ChatContext);
  const [task, steTask] = useState<string[]>([]);
  const speak = useCallback(
    (text: string, stop = false) => {
      if (!synth) return;
      if (synth.speaking) {
        if (stop) {
          synth.cancel();
          steTask([]);
        } else {
          steTask((v) => {
            v.push(text);
            return v;
          });
          return;
        }
      }
      if (!chatMgt?.config?.voiceOpen) return;
      if (synth.getVoices().length > 0 && !chatMgt?.config?.voiceName) return;
      if (text !== '') {
        text = text.replace(/[\*\#]/g, '');
        // 创建一个SpeechSynthesisUtterance对象
        const utterance = new SpeechSynthesisUtterance(text);
        if (chatMgt?.config?.voiceName) {
          let v = synth.getVoices().find((f) => f.name == chatMgt?.config?.voiceName);
          if (v) {
            utterance.voice = v;
          }
        }
        // 设置语言（可选）
        // utterance.lang = 'zh-CN'; // 中文普通话
        // 设置语速（0.1-10，默认1）
        // utterance.rate = 1;
        // 设置音高（0-2，默认1）
        // utterance.pitch = 1;
        // volume属性控制音量(0-1)
        // utterance.volume = 1;
        // onend回调函数 -当朗读结束时触发
        utterance.onend = function (event) {
          if (task.length) {
            speak(task.splice(0, 1)[0]);
          }
        };
        synth.speak(utterance);
      }
      return synth;
    },
    [chatMgt?.config?.voiceName, synth, task]
  );
  return speak;
}
