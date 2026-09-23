<script setup lang="ts">
import { reactive } from 'vue'
import type { RacePresetOptions } from '../model/raceGenerator'

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
</script>

<template>
  <div class="wizard-backdrop" @click.self="emit('close')">
    <section class="race-composer-card">
      <header class="wizard-header">
        <div>
          <span class="wizard-kicker">快速创建比赛</span>
          <h2>拼一场可以马上开的赛车</h2>
        </div>
        <button class="icon-button" @click="emit('close')">×</button>
      </header>

      <div class="race-composer-body">
        <section>
          <h3>赛道</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.track === 'straight' }" @click="draft.track='straight'">直道</button>
            <button :class="{ selected: draft.track === 'curve' }" @click="draft.track='curve'">缓弯</button>
            <button :class="{ selected: draft.track === 'circuit' }" @click="draft.track='circuit'">环形</button>
          </div>
        </section>

        <section>
          <h3>长度</h3>
          <div class="preset-row two">
            <button :class="{ selected: draft.length === 1 }" @click="draft.length=1">1 km</button>
            <button :class="{ selected: draft.length === 2 }" @click="draft.length=2">2 km</button>
          </div>
        </section>

        <section>
          <h3>赛车</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.carShape === 'classic' }" @click="draft.carShape='classic'">Classic</button>
            <button :class="{ selected: draft.carShape === 'sport' }" @click="draft.carShape='sport'">Sport</button>
            <button :class="{ selected: draft.carShape === 'boxy' }" @click="draft.carShape='boxy'">Boxy</button>
          </div>
        </section>

        <section>
          <h3>颜色</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.color === 'red' }" @click="draft.color='red'">红</button>
            <button :class="{ selected: draft.color === 'blue' }" @click="draft.color='blue'">蓝</button>
            <button :class="{ selected: draft.color === 'yellow' }" @click="draft.color='yellow'">黄</button>
          </div>
        </section>

        <section>
          <h3>动效</h3>
          <div class="preset-row two">
            <button :class="{ selected: draft.motion === 'clean' }" @click="draft.motion='clean'">Clean</button>
            <button :class="{ selected: draft.motion === 'dynamic' }" @click="draft.motion='dynamic'">Dynamic</button>
          </div>
        </section>

        <section>
          <h3>声音</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.sound === 'light' }" @click="draft.sound='light'">Light</button>
            <button :class="{ selected: draft.sound === 'sport' }" @click="draft.sound='sport'">Sport</button>
            <button :class="{ selected: draft.sound === 'electric' }" @click="draft.sound='electric'">Electric</button>
          </div>
        </section>

        <section>
          <h3>电脑对手</h3>
          <div class="preset-row four">
            <button v-for="n in [0,1,2,3]" :key="n" :class="{ selected: draft.opponents === n }" @click="draft.opponents = n as 0|1|2|3">{{ n }}</button>
          </div>
        </section>

        <section>
          <h3>难度</h3>
          <div class="preset-row">
            <button :class="{ selected: draft.difficulty === 'easy' }" @click="draft.difficulty='easy'">Easy</button>
            <button :class="{ selected: draft.difficulty === 'normal' }" @click="draft.difficulty='normal'">Normal</button>
            <button :class="{ selected: draft.difficulty === 'fast' }" @click="draft.difficulty='fast'">Fast</button>
          </div>
        </section>
      </div>

      <footer class="race-composer-footer">
        <span>生成后仍然可以继续修改。</span>
        <button class="primary" @click="emit('create', { ...draft })">创建比赛</button>
      </footer>
    </section>
  </div>
</template>
