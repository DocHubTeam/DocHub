  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru
  Copyright (C) 2023 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

          https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Nefedov, Sber - 2023
  */


export default {
    methods: {
        // Очищает состояние движка анимации
        animationActionClean() {
            this.cleanSelectedNodes();
            this.cleanSelectedTracks();
            this.animation.information = null;
        },
        // Фокусирует линк диаграммы
        animationActionFocusLink(from, to) {
            const regexFrom = new RegExp(from);
            const regexTo = new RegExp(to);
            for (const track of this.presentation.tracks) {
                if(regexFrom.test(track.link.from), regexTo.test(track.link.to))
                  this.onTrackClick(track);
            }
        },
        // Фокусирует объект диаграммы
        animationActionFocusNode(target) {
            const regex = new RegExp(target);
            for (const nodeID in this.presentation.map) {
                if (regex.test(nodeID)) this.selectNode(this.presentation.map[nodeID]);
            }
        },
        // Фокусирует объекты диаграммы
        animationActionFocusNeighbors(target) {
            const regex = new RegExp(target);
            for (const nodeID in this.presentation.map) {
                if (regex.test(nodeID)) this.selectNodeAndNeighbors(this.presentation.map[nodeID]);
            }
        },
        // Выводит информацию по субъекту
        // eslint-disable-next-line no-unused-vars
        animationActionInfo(text, voice, subject) {
            this.animation.information = text;
            if (this.voice && window.speechSynthesis && !this.isFirefox) {
                const utterThis = new SpeechSynthesisUtterance(text);
                utterThis.voice = this.animationVoice;
                utterThis.pitch = 1;
                utterThis.rate = 1;
                this.animation.spiking = true;
                utterThis.onend = () => this.animation.spiking = false;
                utterThis.onerror = (error) => {
                    this.animation.spiking = false;
                    // eslint-disable-next-line no-console
                    console.error('SpeechSynthesisUtterance.onerror', error);
                };
                window.speechSynthesis.speak(utterThis);
            }
        },
        // Выполнение действия
        animationExecAction(action) {
            action.map((command) => {
                switch((command.action || '$unknown$').toLowerCase()) {
                    case 'clean': this.animationActionClean(); break;
                    case 'focus-node': this.animationActionFocusNode(command.target); break;
                    case 'focus-link': this.animationActionFocusLink(command.from, command.to); break;
                    case 'focus-neighbors': this.animationActionFocusNeighbors(command.target); break;
                    case 'info': this.animationActionInfo(command.text, command.subject); break;
                    default: throw `Не известная команда "${command.action}"`;
                }
            });
            this.updateNodeView();
            this.updateTracksView();
        },
        // Выполнение шага сценария
        animationExecStep() {
            const scenario = this.animation.scenario;
            const actionID = scenario[this.animation.currentStep].action || '$unknown$';
            const action = this.data.animation.actions[scenario[this.animation.currentStep].action];
            if (!action) throw `Неизвестное действие для шага ${this.animation.currentStep} действия "${actionID}"`;

            // Исполняем шаг
            this.animationExecAction(action);

            const todo = (scenario) => {
                // Если синтезатор голоса не успел закончить рассказ, ждем...
                if (this.animation.spiking) {
                    this.animation.execution = setTimeout(() => todo(scenario, this.animation.currentStep), 100);
                    return;
                }
                // Выполняем
                if (this.animation.currentStep < scenario.length)
                    this.animationExecStep(scenario, this.animation.currentStep);
                else
                    this.animationStop();
            };

            const delay = scenario[this.animation.currentStep++].delay;
            if (delay)
                this.animation.execution = setTimeout(() => todo(scenario), delay);
            else
                todo(scenario);
        },
        // Запуск сценария
        animateRun(id) {
            this.animationStop();
            this.animation.scenario = this.data.animation?.scenarios[id]?.steps;
            if (!this.animation.scenario || !this.animation.scenario.length) throw `Нет сценария "${id}"`;
            this.animation.currentStep = 0;
            this.animationExecStep();
        },
        // Прервать выполнение сценария
        animationStop() {
            if (this.animation.execution)
                clearTimeout(this.animation.execution);
            this.animationActionClean();
            this.animationVoiceStop();
            this.animation.execution = null;
            this.animation.scenario = null;
        },
        // Перейти на следующий шаг сценария немедленно
        animationNext() {
            this.animationVoiceStop();
            this.animation.execution && clearTimeout(this.animation.execution);
            this.animationExecStep();
        },
        // Перейти на предыдущий шаг сценария немедленно
        animationPrev() {
            this.animationVoiceStop();
            this.animation.execution && clearTimeout(this.animation.execution);
            this.animation.currentStep -= this.animation.currentStep > 2 ? 3 : this.animation.currentStep;
            this.animationExecStep();
        },
        // Остановить воспроизведение голоса
        animationVoiceStop() {
            window.speechSynthesis && window.speechSynthesis.cancel();
        }
    },
    computed: {
        // Получаем голосовой профиль
        animationVoice() {
            const voices = window.speechSynthesis?.getVoices() || [];
            for (let i = 0; i < voices.length; i++) {
                if (voices[i].lang === 'ru-RU') return voices[i];
            }
            return null;
        }
    },
    watch: {
        'animation.execution'(value) {
            value ? this.$emit('playstart') : this.$emit('playstop');
        }
    },
    mounted() {
        this.$on('play', (scenario) => {
            this.animateRun(scenario);
        });
        this.$on('stop', () => {
            this.animationStop();
        });
        this.$on('next', () => {
            this.animationNext();
        });
        this.$on('prev', () => {
            this.animationPrev();
        });
    },
    data() {
        return {
            animation: {
                scenario: null,		// Текущий сценарий
                currentStep: null,	// Текущий шаг сценария
                spiking: false,		// Признак воспроизведение голоса
                information: null,	// Информация выводимая при проигрывании для пользователя
                execution: null, 	// Активный сценарий исполнения
                chains: []			// Здесь находятся активные, проигрываемые сценарии
            }
        };
    },
    destroyed() {
        this.animationStop();
    }

};
