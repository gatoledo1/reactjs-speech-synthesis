import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';

export const SplitStringToSpeak = (content: any) => {
  // Split up the string and use `reduce`
  // to iterate over it
  const temp = content.split('.').reduce(
    (acc: any, c: string) => {
      // Get the number of nested arrays
      const currIndex = acc.length - 1;

      // Join up the last array and get its length
      const currLen = acc[currIndex].join('').length;

      // If the length of that content and the new word
      // in the iteration exceeds 200 chars push the new
      // word to a new array
      if (currLen + c.length > 200) {
        acc.push([c]);

        // otherwise add it to the existing array
      } else {
        acc[currIndex].push(c);
      }

      return acc;
    },
    [[]]
  );

  // Join up all the nested arrays
  const out = temp.map((arr: string[]) => arr.join(' '));

  return out;
};

interface VoicesTypes {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
  voiceURI: string;
}
interface Utterance {
  lang: string;
  pitch: number;
  rate: number;
  text: string;
  voice: VoicesTypes[];
  volume: number;
}

export const SpeechText = () => {
  const titleToSpeech = 'Feature synthesizer ReactJS'
  const contentToSpeech = 'This voice synthesizer has paragraph breaking in arrays, thus solving a problem found in Android, which does not allow speech of more than 4000 characters. At each end of speech, the array index is updated, so the synthesizer only sees paragraph by paragraph. The pause also follows the paragraph break, because in the synthesizer web API the pause does not work very well, after 4 seconds, the audio is canceled and returns to the beginning. Another bug found on Android is that the language has a name with underline, instead of hyphen, which causes a problem when picking up the voices.';
  const shortenStringWithoutCuttingWords = SplitStringToSpeak(contentToSpeech);
  const [voices, setVoices] = useState<VoicesTypes[]>([]);
  const [supported, setSupported] = useState<string | boolean>('');
  const [synth, setSynth] = useState<any>();
  const [speaking, setSpeaking] = useState(0); //0 = parado, 1 = falando, 2 = pausado
  const [text, setText] = useState([titleToSpeech, shortenStringWithoutCuttingWords].flat(1));
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(0.86);
  const stateRef = useRef<number>(2);
  const [openConfig, setOpenConfig] = useState(false);

  //Função obrigatória, executada após todo fim de fala ou cancelamento
  function handleEnd() {
    if (speaking === 2) {
      //Text deve permanecer com seu index na mesma posição
      setCurrentTextIndex(currentTextIndex);
    }
    if (text[currentTextIndex] && stateRef.current !== 2) {
      setCurrentTextIndex(currentTextIndex + 1);
    }
    if (!text[currentTextIndex] && stateRef.current !== 2) {
      setSpeaking(0);
      setCurrentTextIndex(0);
    }
  }

  function say(texts: string) {
    if (texts) {
      //@ts-ignore
      const utterThis: Utterance = new SpeechSynthesisUtterance();
      utterThis.text = texts;
      utterThis.voice = voices;
      utterThis.rate = rate;
      utterThis.pitch = pitch;
      synth.speak(utterThis);

      setSpeaking(1);
      stateRef.current = 1;
      //@ts-ignore
      utterThis.onend = handleEnd;
    }
  }

  useEffect(() => {
    //Speaking mudou, então verifique se está em PAUSE
    if (speaking == 2) {
      stateRef.current = speaking;
      synth.cancel();
    }
  }, [speaking]);

  // useEffect(() => {
  //   setText([title, shortenStringWithoutCuttingWords].flat(1))
  //   setCurrentTextIndex(0)
  // }, [slug])

  //Depois do onEnd, o currentIndex é atualizado
  useEffect(() => {
    //Se tiver proximo texto no array e estiver falando, execute mais um fala
    if (text[currentTextIndex] && speaking == 1) {
      say(text[currentTextIndex]);
    }
    //Se não tiver proximo texto, reinicie o index do texto
    if (!text[currentTextIndex]) {
      setSpeaking(0);
      setCurrentTextIndex(0);
    }
  }, [currentTextIndex]);

  //PEGA AS VOZES, FUNÇÃO ACIONADA PELA 2ª ETAPA
  function populateVoiceList() {
    setVoices(synth.getVoices());
    if (voices) {
      const EnUsVoice = synth
        .getVoices()
        .filter(
          (voice: { lang: string }) =>
            voice.lang == 'en-US' || voice.lang == 'en_US'
        );
      setVoices(EnUsVoice[0]);
      setSupported(true);
    } else {
      setSupported(false);
    }
  }

  //SEGUNDA ETAPA
  useEffect(() => {
    if (synth) {
      populateVoiceList();
      //Verifica se a voz foi setada, senão force tentar setar uma voz
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
      }
    }
  }, [synth]);

  //INICIO
  useEffect(() => {
    setSynth(window.speechSynthesis);
  }, [contentToSpeech]);

  //Ativando ações de cancelamento
  useEffect(() => {
    window.onblur = function () {
      //Verifica se perdeu o foco
      setSpeaking(2);
    };

    window.onbeforeunload = function () {
      //Executa depois da pagina desmontar
      setSpeaking(2);
    };
    //Se o texto alterar (trocando de noticia), cancele o que estava rodando
    setSpeaking(2);
    stateRef.current = 2;
    window.speechSynthesis.cancel();
    setCurrentTextIndex(0);
  }, [text]);

  return (
    <div className={styles.audioContainer}>
      {!supported && (
        <p>Sinto muito, seu dispositivo não suporta leitura de texto</p>
      )}
      {supported && (
        <>
          <div className={styles.firstRow}>
            {(speaking === 0 || speaking === 2) && ( //Estado = Parado, mostre Play
              <button
                className={styles.btnAudioPlayer}
                type="button"
                onClick={() => {
                  //Play
                  say(text[currentTextIndex]);
                }}
              >
                <img width={30} height={30} alt="Iniciar" src="/play.svg" />
              </button>
            )}
            {speaking === 1 && ( //Estado = Play, mostre Pause
              <>
                <strong>{text[0]}</strong>
                
                <button
                  className={styles.btnAudioPlayer}
                  type="button"
                  onClick={() => {
                    //Pause
                    setSpeaking(2);
                  }}
                >
                  <img width={30} height={30} alt="Pausar" src="/pause.svg" />
                </button>
              </>
            )}

            <div>
              <span>
                <p>Listen the content</p>
              </span>
            </div>

            <button
              className={styles.btnConfigs}
              type="button"
              onClick={() => {
                openConfig ? setOpenConfig(false) : setOpenConfig(true);
              }}
            >
              <img
                width={30}
                height={30}
                alt="Configurações"
                src="/settings.svg"
              />
            </button>
          </div>

          {openConfig && (
            <div className={styles.secondRow}>
              <div>
                <span>Velocidade</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  defaultValue="0.86"
                  step="0.01"
                  id="rate"
                  onChange={(event) => {
                    setRate(Number(event.target.value));
                  }}
                />
                <output style={{ width: 32, color: "#fff" }}>{rate}</output>
              </div>

              <div>
                <span>Tom da voz</span>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  defaultValue="1"
                  step="0.1"
                  id="pitch"
                  onChange={(event) => {
                    setPitch(Number(event.target.value));
                  }}
                />
                <output style={{ width: 32, color: "#fff" }}>{pitch}</output>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
