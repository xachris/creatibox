<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { RacePresetOptions } from '../model/raceGenerator'

export type DriverPreset = 'driver-a' | 'driver-b' | 'driver-c'

export interface RacingLaunchOptions extends RacePresetOptions {
  driver: DriverPreset
}

const emit = defineEmits<{
  cancel: []
  start: [options: RacingLaunchOptions]
}>()

const step = ref(1)
const draft = reactive<RacingLaunchOptions>({
  track: 'curve',
  length: 1,
  carShape: 'sport',
  color: 'red',
  motion: 'dynamic',
  sound: 'sport',
  opponents: 2,
  difficulty: 'normal',
  driver: 'driver-a',
})

const stepTitle = computed(() => [
  '选一辆车',
  '选一个车手',
  '选赛道',
  '选电脑对手',
  '选择驾驶感觉',
  '准备开赛',
][step.value - 1])

const driverNames = {
  'driver-a': 'Alex',
  'driver-b': 'Mia',
  'driver-c': 'Kai',
}

function next() {
  step.value = Math.min(6, step.value + 1)
}

function previous() {
  step.value = Math.max(1, step.value - 1)
}
</script>

<template>
  <section class="launch-screen">
    <header class="launch-topbar">
      <button class="ghost-button" @click="emit('cancel')">← 返回目录</button>
      <div class="launch-progress-copy">
        <strong>赛车游戏</strong>
        <span>步骤 {{ step }} / 6</span>
      </div>
      <span />
    </header>

    <div class="launch-progress">
      <span v-for="n in 6" :key="n" :class="{ active: n <= step }" />
    </div>

    <main class="launch-content">
      <div class="launch-heading">
        <span class="wizard-kicker">QUICK RACE</span>
        <h1>{{ stepTitle }}</h1>
      </div>

      <section v-if="step === 1" class="launch-step">
        <div class="big-choice-grid">
          <button
            v-for="shape in ['classic','sport','boxy']"
            :key="shape"
            :class="{ selected: draft.carShape === shape }"
            @click="draft.carShape = shape as 'classic'|'sport'|'boxy'"
          >
            <div class="car-choice-preview" :class="shape">
              <div class="car-choice-body" :style="{ background: draft.color === 'red' ? '#b91c1c' : draft.color === 'blue' ? '#2563eb' : '#f59e0b' }" />
              <span class="wheel left" />
              <span class="wheel right" />
            </div>
            <strong>{{ shape === 'classic' ? 'Classic' : shape === 'sport' ? 'Sport' : 'Boxy' }}</strong>
          </button>
        </div>

        <div class="color-picker-row">
          <span>颜色</span>
          <button class="color-dot red" :class="{ selected: draft.color === 'red' }" @click="draft.color='red'" />
          <button class="color-dot blue" :class="{ selected: draft.color === 'blue' }" @click="draft.color='blue'" />
          <button class="color-dot yellow" :class="{ selected: draft.color === 'yellow' }" @click="draft.color='yellow'" />
        </div>
      </section>

      <section v-else-if="step === 2" class="launch-step">
        <div class="driver-grid">
          <button
            v-for="(name, key) in driverNames"
            :key="key"
            :class="{ selected: draft.driver === key }"
            @click="draft.driver = key as DriverPreset"
          >
            <div class="driver-avatar" :class="key">
              <span class="driver-head" />
              <span class="driver-body" />
            </div>
            <strong>{{ name }}</strong>
            <span>Driver</span>
          </button>
        </div>
        <p class="step-note">车手目前只作为你的比赛身份。以后人物系统会从这里继续扩展。</p>
      </section>

      <section v-else-if="step === 3" class="launch-step">
        <div class="track-grid">
          <button :class="{ selected: draft.track === 'straight' }" @click="draft.track='straight'">
            <div class="track-mini straight"><span /></div>
            <strong>直道</strong>
            <span>最简单，专注速度</span>
          </button>
          <button :class="{ selected: draft.track === 'curve' }" @click="draft.track='curve'">
            <div class="track-mini curve"><span /></div>
            <strong>缓弯</strong>
            <span>需要真正转向</span>
          </button>
          <button :class="{ selected: draft.track === 'circuit' }" @click="draft.track='circuit'">
            <div class="track-mini circuit"><span /></div>
            <strong>环形</strong>
            <span>更像完整比赛</span>
          </button>
        </div>
        <div class="length-row">
          <span>赛道长度</span>
          <button :class="{ selected: draft.length === 1 }" @click="draft.length=1">1 km</button>
          <button :class="{ selected: draft.length === 2 }" @click="draft.length=2">2 km</button>
        </div>
      </section>

      <section v-else-if="step === 4" class="launch-step">
        <div class="opponent-picker">
          <span>电脑对手</span>
          <div class="number-pills">
            <button v-for="n in [0,1,2,3]" :key="n" :class="{ selected: draft.opponents === n }" @click="draft.opponents=n as 0|1|2|3">{{ n }}</button>
          </div>
        </div>
        <div class="difficulty-grid">
          <button :class="{ selected: draft.difficulty === 'easy' }" @click="draft.difficulty='easy'">
            <strong>Easy</strong><span>比较慢，适合第一次</span>
          </button>
          <button :class="{ selected: draft.difficulty === 'normal' }" @click="draft.difficulty='normal'">
            <strong>Normal</strong><span>速度和转向比较均衡</span>
          </button>
          <button :class="{ selected: draft.difficulty === 'fast' }" @click="draft.difficulty='fast'">
            <strong>Fast</strong><span>电脑车更快</span>
          </button>
        </div>
      </section>

      <section v-else-if="step === 5" class="launch-step">
        <div class="feel-grid">
          <div>
            <h3>动效</h3>
            <button :class="{ selected: draft.motion === 'clean' }" @click="draft.motion='clean'">Clean</button>
            <button :class="{ selected: draft.motion === 'dynamic' }" @click="draft.motion='dynamic'">Dynamic</button>
          </div>
          <div>
            <h3>声音</h3>
            <button :class="{ selected: draft.sound === 'light' }" @click="draft.sound='light'">Light</button>
            <button :class="{ selected: draft.sound === 'sport' }" @click="draft.sound='sport'">Sport</button>
            <button :class="{ selected: draft.sound === 'electric' }" @click="draft.sound='electric'">Electric</button>
          </div>
        </div>
      </section>

      <section v-else class="launch-step review-step">
        <div class="review-hero">
          <span>READY</span>
          <h2>{{ draft.carShape.toUpperCase() }} · {{ draft.color.toUpperCase() }}</h2>
          <p>{{ driverNames[draft.driver] }} · {{ draft.track }} · {{ draft.length }} km</p>
        </div>
        <div class="review-grid">
          <div><span>对手</span><strong>{{ draft.opponents }}</strong></div>
          <div><span>难度</span><strong>{{ draft.difficulty }}</strong></div>
          <div><span>动效</span><strong>{{ draft.motion }}</strong></div>
          <div><span>声音</span><strong>{{ draft.sound }}</strong></div>
        </div>
        <div class="control-preview">
          <strong>默认控制</strong>
          <span>← → 转向</span>
          <span>↑ 前进 · ↓ 刹车</span>
          <span>Space 油门</span>
        </div>
      </section>
    </main>

    <footer class="launch-footer">
      <button v-if="step > 1" @click="previous">上一步</button>
      <span />
      <button v-if="step < 6" class="primary big-primary" @click="next">继续</button>
      <button v-else class="primary start-race-button" @click="emit('start', { ...draft })">🏁 直接开赛</button>
    </footer>
  </section>
</template>
