<script setup lang="ts">
import { reactive } from 'vue'
import type { RacePresetOptions } from '../model/raceGenerator'
import { raceAudio } from '../media/sound/audioDirector'

const emit = defineEmits<{
  close: []
  create: [options: RacePresetOptions]
}>()

const draft = reactive<RacePresetOptions>({
  track: 'straight',
  length: 1,
  carShape: 'sport',
  color: 'red',
  motion: 'clean',
  sound: 'sport',
  opponents: 2,
  difficulty: 'normal',
})

function choose(action: () => void) {
  raceAudio.playUi('select')
  action()
}

function close() {
  raceAudio.playUi('select')
  emit('close')
}

function create() {
  raceAudio.playUi('confirm')
  emit('create', { ...draft })
}
</script>

<template>
  <div class="wizard-backdrop" @click.self="close">
    <section class="race-composer-card">
      <header class="wizard-header">
        <div>
          <span class="wizard-kicker">快速创建比赛</span>
          <h2>拼一场可以马上开的赛车</h2>
        </div>
        <button class="icon-button" @click="close">×</button>
      </header>

      <div class="race-composer-body">
        <section>
          <h3>赛道</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.track === 'straight' }" @click="choose(() => { draft.track='straight' })">直道</button>
            <button :class="{ selected: draft.track === 'curve' }" @click="choose(() => { draft.track='curve' })">缓弯</button>
            <button :class="{ selected: draft.track === 'circuit' }" @click="choose(() => { draft.track='circuit' })">环形</button>
          </div>
        </section>

        <section>
          <h3>长度</h3>
          <div class="preset-row two">
            <button :class="{ selected: draft.length === 1 }" @click="choose(() => { draft.length=1 })">1 km</button>
            <button :class="{ selected: draft.length === 2 }" @click="choose(() => { draft.length=2 })">2 km</button>
          </div>
        </section>

        <section>
          <h3>赛车</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.carShape === 'classic' }" @click="choose(() => { draft.carShape='classic' })">Classic</button>
            <button :class="{ selected: draft.carShape === 'sport' }" @click="choose(() => { draft.carShape='sport' })">Sport</button>
            <button :class="{ selected: draft.carShape === 'boxy' }" @click="choose(() => { draft.carShape='boxy' })">Boxy</button>
          </div>
        </section>

        <section>
          <h3>颜色</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.color === 'red' }" @click="choose(() => { draft.color='red' })">红</button>
            <button :class="{ selected: draft.color === 'blue' }" @click="choose(() => { draft.color='blue' })">蓝</button>
            <button :class="{ selected: draft.color === 'yellow' }" @click="choose(() => { draft.color='yellow' })">黄</button>
          </div>
        </section>

        <section>
          <h3>动效</h3>
          <div class="preset-row two">
            <button :class="{ selected: draft.motion === 'clean' }" @click="choose(() => { draft.motion='clean' })">Clean</button>
            <button :class="{ selected: draft.motion === 'dynamic' }" @click="choose(() => { draft.motion='dynamic' })">Dynamic</button>
          </div>
        </section>

        <section>
          <h3>声音</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.sound === 'light' }" @click="choose(() => { draft.sound='light' })">Light</button>
            <button :class="{ selected: draft.sound === 'sport' }" @click="choose(() => { draft.sound='sport' })">Sport</button>
            <button :class="{ selected: draft.sound === 'electric' }" @click="choose(() => { draft.sound='electric' })">Electric</button>
          </div>
        </section>

        <section>
          <h3>电脑对手</h3>
          <div class="preset-row four">
            <button v-for="n in [0,1,2,3]" :key="n" :class="{ selected: draft.opponents === n }" @click="choose(() => { draft.opponents = n as 0|1|2|3 })">{{ n }}</button>
          </div>
        </section>

        <section>
          <h3>难度</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.difficulty === 'easy' }" @click="choose(() => { draft.difficulty='easy' })">Easy</button>
            <button :class="{ selected: draft.difficulty === 'normal' }" @click="choose(() => { draft.difficulty='normal' })">Normal</button>
            <button :class="{ selected: draft.difficulty === 'fast' }" @click="choose(() => { draft.difficulty='fast' })">Fast</button>
          </div>
        </section>
      </div>

      <footer class="race-composer-footer">
        <span>生成后仍然可以继续修改。</span>
        <button class="primary" @click="create">创建比赛</button>
      </footer>
    </section>
  </div>
</template>
