import { MessageContext } from '@/components/Chat/Chat';
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
  const { ttsService } = useContext(MessageContext);
  const [task, steTask] = useState<string[]>([]);
  const httpTtsServer = useCallback(
    (text: string, stop = false) => {
      if (
        !chatMgt.config.voiceConfigs ||
        chatMgt.config.voiceConfigs.length == 0 ||
        chatMgt.config.voiceConfigs.filter((f) => !f.disabled).length == 0
      )
        return;
      const voices = chatMgt.config.voiceConfigs.filter((f) => !f.disabled);
      let defaultVoc = voices.find((f) => f.default);
      if (!defaultVoc) defaultVoc = voices[0];
      if (stop) ttsService.clearQueue();
      function f(startIdx = 0) {
        let len = text.length - startIdx;
        const txt = text.substring(startIdx);
        let voc: typeof defaultVoc = undefined;
        let speakTxt = '';
        // 匹配tts
        for (let j = 0; j < voices!.length; j++) {
          const v = voices[j];
          if (v.reg) {
            let r = v.reg;
            if (!r.startsWith('^')) r = '^' + r; // 让正则只能从前往后匹配
            if (new RegExp(r).test(txt)) {
              const out = txt.replace(new RegExp(r), (sub: string, ...vals) => {
                len = sub.length;
                if (v.regOut) {
                  speakTxt = v.regOut.replace(/\$\{?(\d+)\}?/g, (a, i) => {
                    let idx = Number(i) - 1;
                    if (vals.length - 2 >= idx) return vals[idx];
                    return '';
                  });
                } else {
                  speakTxt = sub;
                }
                return sub;
              });
              voc = v;
              break;
            }
          }
        }
        if (voc) {
          ttsService.speak(speakTxt, false, voc.url, voc.method, voc.header);
        } else {
          // 正则不能从最前匹配到时，找到能匹配到的最前一个，将这之前的都用默认tts
          let nextIdx = Math.min(...voices.map((v) => txt.match(new RegExp(v.reg))?.index || txt.length));
          ttsService.speak(txt.substring(0, nextIdx), false, defaultVoc!.url, defaultVoc!.method, defaultVoc!.header);
          len = nextIdx;
        }
        if (startIdx + len < text.length) f(startIdx + len);
      }
      f(0);
    },
    [chatMgt, ttsService]
  );
  const speak = useCallback(
    (text: string, stop = false) => {
      if (!chatMgt?.config?.voiceOpen) return;
      if (chatMgt.config.voiceConfigs?.length && chatMgt.config.voiceConfigs.filter((f) => !f.disabled).length) {
        return httpTtsServer(text, stop);
      }
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
    [chatMgt, httpTtsServer, synth, task]
  );
  return speak;
}
