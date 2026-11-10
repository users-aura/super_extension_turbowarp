
(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("SUPER EXTENSION needs Unsandboxed mode.");
  }

  const runtime = Scratch.vm.runtime;
  let audio = null;
  let video = null;
  let lastAIResponse = "";
  let timerStarted = Date.now();

  const savedValues = Object.create(null);

  const clamp = (n, min, max) =>
    Math.min(max, Math.max(min, Number(n) || 0));

  const getTarget = () => runtime.getEditingTarget();

  class SuperExtension {
    getInfo() {
      return {
        id: "superextension",
        name: "SUPER EXTENSION",
        color1: "#6546D7",
        color2: "#5034B5",
        color3: "#3E278F",

        blocks: [
          {
            opcode: "openWebsite",
            blockType: Scratch.BlockType.COMMAND,
            text: "відкрити сайт [URL]",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://turbowarp.org"
              }
            }
          },
          {
            opcode: "copyText",
            blockType: Scratch.BlockType.COMMAND,
            text: "скопіювати текст [TEXT]",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Привіт!"
              }
            }
          },
          {
            opcode: "openMail",
            blockType: Scratch.BlockType.COMMAND,
            text: "створити лист на [ADDRESS]",
            arguments: {
              ADDRESS: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "example@example.com"
              }
            }
          },
          {
            opcode: "currentURL",
            blockType: Scratch.BlockType.REPORTER,
            text: "адреса цієї сторінки"
          },
          {
            opcode: "browserName",
            blockType: Scratch.BlockType.REPORTER,
            text: "інформація про браузер"
          },
          {
            opcode: "isOnline",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "є підключення до мережі?"
          },

          {
            opcode: "playAudio",
            blockType: Scratch.BlockType.COMMAND,
            text: "відтворити аудіо [URL]",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://example.com/audio.mp3"
              }
            }
          },
          {
            opcode: "pauseAudio",
            blockType: Scratch.BlockType.COMMAND,
            text: "пауза аудіо"
          },
          {
            opcode: "resumeAudio",
            blockType: Scratch.BlockType.COMMAND,
            text: "продовжити аудіо"
          },
          {
            opcode: "stopAudio",
            blockType: Scratch.BlockType.COMMAND,
            text: "зупинити аудіо"
          },
          {
            opcode: "setAudioVolume",
            blockType: Scratch.BlockType.COMMAND,
            text: "гучність аудіо [VOLUME] %",
            arguments: {
              VOLUME: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 70
              }
            }
          },
          {
            opcode: "audioEnded",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "аудіо завершилося?"
          },

          {
            opcode: "playVideo",
            blockType: Scratch.BlockType.COMMAND,
            text: "показати відео [URL]",
            arguments: {
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://example.com/video.mp4"
              }
            }
          },
          {
            opcode: "pauseVideo",
            blockType: Scratch.BlockType.COMMAND,
            text: "пауза відео"
          },
          {
            opcode: "stopVideo",
            blockType: Scratch.BlockType.COMMAND,
            text: "зупинити відео"
          },

          {
            opcode: "askAI",
            blockType: Scratch.BlockType.COMMAND,
            text: "запитати AI endpoint [ENDPOINT] ключ [KEY] повідомлення [PROMPT]",
            arguments: {
              ENDPOINT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://api.openai.com/v1/chat/completions"
              },
              KEY: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ""
              },
              PROMPT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Привіт! Розкажи щось цікаве."
              }
            }
          },
          {
            opcode: "aiResponse",
            blockType: Scratch.BlockType.REPORTER,
            text: "відповідь AI"
          },

          {
            opcode: "randomNumber",
            blockType: Scratch.BlockType.REPORTER,
            text: "випадкове число від [MIN] до [MAX]",
            arguments: {
              MIN: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              },
              MAX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          },
          {
            opcode: "distanceTo",
            blockType: Scratch.BlockType.REPORTER,
            text: "відстань до спрайта [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Спрайт2"
              }
            }
          },
          {
            opcode: "setSpriteXY",
            blockType: Scratch.BlockType.COMMAND,
            text: "перемістити спрайт x [X] y [Y]",
            arguments: {
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          {
            opcode: "changeSpriteSize",
            blockType: Scratch.BlockType.COMMAND,
            text: "встановити розмір [SIZE] %",
            arguments: {
              SIZE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 100
              }
            }
          },
          {
            opcode: "setSpriteEffect",
            blockType: Scratch.BlockType.COMMAND,
            text: "ефект [EFFECT] значення [VALUE]",
            arguments: {
              EFFECT: {
                type: Scratch.ArgumentType.STRING,
                menu: "effects"
              },
              VALUE: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 25
              }
            }
          },
          {
            opcode: "clearSpriteEffects",
            blockType: Scratch.BlockType.COMMAND,
            text: "очистити ефекти спрайта"
          },
          {
            opcode: "pointDirection",
            blockType: Scratch.BlockType.COMMAND,
            text: "повернути спрайт у напрямку [DIRECTION]",
            arguments: {
              DIRECTION: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 90
              }
            }
          },

          {
            opcode: "currentDate",
            blockType: Scratch.BlockType.REPORTER,
            text: "поточна дата"
          },
          {
            opcode: "currentTime",
            blockType: Scratch.BlockType.REPORTER,
            text: "поточний час"
          },
          {
            opcode: "startTimer",
            blockType: Scratch.BlockType.COMMAND,
            text: "перезапустити секундомір"
          },
          {
            opcode: "elapsedTime",
            blockType: Scratch.BlockType.REPORTER,
            text: "час секундоміра (сек)"
          },
          {
            opcode: "waitSeconds",
            blockType: Scratch.BlockType.COMMAND,
            text: "почекати [SECONDS] секунд",
            arguments: {
              SECONDS: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },

          {
            opcode: "saveValue",
            blockType: Scratch.BlockType.COMMAND,
            text: "зберегти [VALUE] під назвою [NAME]",
            arguments: {
              VALUE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "текст"
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "мій_текст"
              }
            }
          },
          {
            opcode: "loadValue",
            blockType: Scratch.BlockType.REPORTER,
            text: "завантажити значення [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "мій_текст"
              }
            }
          },
          {
            opcode: "deleteValue",
            blockType: Scratch.BlockType.COMMAND,
            text: "видалити значення [NAME]",
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "мій_текст"
              }
            }
          },
          {
            opcode: "joinText",
            blockType: Scratch.BlockType.REPORTER,
            text: "об'єднати [A] і [B]",
            arguments: {
              A: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Привіт"
              },
              B: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: " світе"
              }
            }
          },
          {
            opcode: "textLength",
            blockType: Scratch.BlockType.REPORTER,
            text: "довжина тексту [TEXT]",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "TurboWarp"
              }
            }
          },
          {
            opcode: "containsText",
            blockType: Scratch.BlockType.BOOLEAN,
            text: "текст [TEXT] містить [PART]?",
            arguments: {
              TEXT: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "TurboWarp"
              },
              PART: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Warp"
              }
            }
          }
        ],

        menus: {
          effects: {
            acceptReporters: false,
            items: [
              "колір",
              "риб'яче око",
              "вихор",
              "пікселізація",
              "мозаїка",
              "яскравість",
              "прозорість"
            ]
          }
        }
      };
    }

    openWebsite(args) {
      const url = String(args.URL || "").trim();
      if (/^https?:\/\//i.test(url)) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }

    async copyText(args) {
      try {
        await navigator.clipboard.writeText(String(args.TEXT ?? ""));
      } catch (e) {}
    }

    openMail(args) {
      window.open(
        "mailto:" + encodeURIComponent(String(args.ADDRESS || "")),
        "_blank"
      );
    }

    currentURL() {
      return location.href;
    }

    browserName() {
      return navigator.userAgent;
    }

    isOnline() {
      return navigator.onLine;
    }

    playAudio(args) {
      if (audio) {
        audio.pause();
      }
      audio = new Audio(String(args.URL || ""));
      audio.play().catch(() => {});
    }

    pauseAudio() {
      if (audio) audio.pause();
    }

    resumeAudio() {
      if (audio) audio.play().catch(() => {});
    }

    stopAudio() {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }

    setAudioVolume(args) {
      if (audio) {
        audio.volume = clamp(args.VOLUME, 0, 100) / 100;
      }
    }

    audioEnded() {
      return !!audio && audio.ended;
    }

    playVideo(args) {
      this.stopVideo();

      video = document.createElement("video");
      video.src = String(args.URL || "");
      video.controls = true;
      video.autoplay = true;

      video.style.cssText =
        "position:fixed;z-index:999999;left:5%;top:5%;" +
        "width:90%;height:90%;background:#000;object-fit:contain";

      video.addEventListener("ended", () => {
        if (video) {
          video.remove();
          video = null;
        }
      }, { once: true });

      document.body.appendChild(video);
      video.play().catch(() => {});
    }

    pauseVideo() {
      if (video) video.pause();
    }

    stopVideo() {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video.remove();
        video = null;
      }
    }

    async askAI(args) {
      lastAIResponse = "Очікую відповідь AI…";

      const endpoint = String(args.ENDPOINT || "").trim();
      const key = String(args.KEY || "").trim();
      const prompt = String(args.PROMPT || "");

      if (!/^https:\/\//i.test(endpoint)) {
        lastAIResponse = "Помилка: endpoint має починатися з https://";
        return;
      }

      try {
        const headers = {
          "Content-Type": "application/json"
        };

        if (key) {
          headers.Authorization = "Bearer " + key;
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error?.message || ("HTTP " + response.status)
          );
        }

        lastAIResponse =
          data.choices?.[0]?.message?.content || JSON.stringify(data);

      } catch (e) {
        lastAIResponse =
          "Не вдалося отримати відповідь: " + e.message +
          ". Можливо, сервер блокує запит CORS.";
      }
    }

    aiResponse() {
      return lastAIResponse;
    }

    randomNumber(args) {
      let min = Math.ceil(Number(args.MIN) || 0);
      let max = Math.floor(Number(args.MAX) || 0);

      if (max < min) {
        [min, max] = [max, min];
      }

      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    distanceTo(args) {
      const from = getTarget();
      const name = String(args.NAME || "");

      const to = runtime.targets.find(
        t => !t.isStage && t.sprite.name === name
      );

      if (!from || !to) return 0;

      return Math.hypot(from.x - to.x, from.y - to.y);
    }

    setSpriteXY(args) {
      const t = getTarget();
      if (t) {
        t.setXY(Number(args.X) || 0, Number(args.Y) || 0);
      }
    }

    changeSpriteSize(args) {
      const t = getTarget();
      if (t) {
        t.setSize(clamp(args.SIZE, 1, 1000));
      }
    }

    setSpriteEffect(args) {
      const t = getTarget();
      if (!t) return;

      const map = {
        "колір": "color",
        "риб'яче око": "fisheye",
        "вихор": "whirl",
        "пікселізація": "pixelate",
        "мозаїка": "mosaic",
        "яскравість": "brightness",
        "прозорість": "ghost"
      };

      t.setEffect(
        map[args.EFFECT] || "color",
        Number(args.VALUE) || 0
      );
    }

    clearSpriteEffects() {
      const t = getTarget();
      if (t) t.clearEffects();
    }

    pointDirection(args) {
      const t = getTarget();
      if (t) {
        t.setDirection(Number(args.DIRECTION) || 90);
      }
    }

    currentDate() {
      return new Date().toLocaleDateString();
    }

    currentTime() {
      return new Date().toLocaleTimeString();
    }

    startTimer() {
      timerStarted = Date.now();
    }

    elapsedTime() {
      return (Date.now() - timerStarted) / 1000;
    }

    waitSeconds(args) {
      const ms = clamp(args.SECONDS, 0, 3600) * 1000;
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    saveValue(args) {
      const name = String(args.NAME || "");
      savedValues[name] = String(args.VALUE ?? "");

      try {
        localStorage.setItem(
          "superextension:" + name,
          savedValues[name]
        );
      } catch (e) {}
    }

    loadValue(args) {
      const name = String(args.NAME || "");

      if (Object.prototype.hasOwnProperty.call(savedValues, name)) {
        return savedValues[name];
      }

      try {
        return localStorage.getItem("superextension:" + name) ?? "";
      } catch (e) {
        return "";
      }
    }

    deleteValue(args) {
      const name = String(args.NAME || "");

      delete savedValues[name];

      try {
        localStorage.removeItem("superextension:" + name);
      } catch (e) {}
    }

    joinText(args) {
      return String(args.A ?? "") + String(args.B ?? "");
    }

    textLength(args) {
      return Array.from(String(args.TEXT ?? "")).length;
    }

    containsText(args) {
      return String(args.TEXT ?? "").includes(
        String(args.PART ?? "")
      );
    }
  }

  Scratch.extensions.register(new SuperExtension());

})(Scratch);
