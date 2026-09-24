<script setup lang="ts">
import RaceSpeciesPicker from './RaceSpeciesPicker.vue'
import { computed, reactive, ref } from 'vue'
import type { RacePresetOptions } from '../model/raceGenerator'
import { raceAudio } from '../media/sound/audioDirector'

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
  playerKind: 'car',
  opponentKinds: ['car', 'horse', 'human'],
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
  '选参赛者',
  '选一个车手',
  '选赛道',
  '选电脑对手',
  '选择驾驶感觉',
  '准备开赛',
][step.value - 1])
const visibleSteps = computed(() => draft.playerKind === 'car' ? [1, 2, 3, 4, 5, 6] : [1, 3, 4, 5, 6])
const visibleStepNumber = computed(() => visibleSteps.value.indexOf(step.value) + 1)

const driverNames = {
  'driver-a': 'Alex',
  'driver-b': 'Mia',
  'driver-c': 'Kai',
}

function choose(action: () => void) {
  raceAudio.playUi('select')
  action()
}

function next() {
  raceAudio.playUi('step')
  step.value = Math.min(6, step.value === 1 && draft.playerKind !== 'car' ? 3 : step.value + 1)
}

function previous() {
  raceAudio.playUi('step')
  step.value = Math.max(1, step.value === 3 && draft.playerKind !== 'car' ? 1 : step.value - 1)
}

function cancel() {
  raceAudio.playUi('select')
  emit('cancel')
}

function startRace() {
  raceAudio.playUi('confirm')
  emit('start', { ...draft })
}
</script>

<template>
  <section class="launch-screen">
    <header class="launch-topbar">
      <button class="ghost-button" @click="cancel">← 返回目录</button>
      <div class="launch-progress-copy">
        <strong>Unified Race · 混合竞速</strong>
        <span>步骤 {{ visibleStepNumber }} / {{ visibleSteps.length }}</span>
      </div>
      <span />
    </header>

    <div class="launch-progress">
      <span v-for="n in visibleSteps" :key="n" :class="{ active: n <= step }" />
    </div>

    <main class="launch-content">
      <div class="launch-heading">
        <span class="wizard-kicker">QUICK RACE</span>
        <h1>{{ stepTitle }}</h1>
      </div>

      <section v-if="step === 1" class="launch-step">
        <RaceSpeciesPicker :model-value="draft.playerKind!" label="你的参赛者" @update:model-value="kind => choose(() => { draft.playerKind = kind })" />
        <div v-if="draft.playerKind === 'car'" class="big-choice-grid">
          <button
            v-for="shape in ['classic','sport','boxy']"
            :key="shape"
            :class="{ selected: draft.carShape === shape }"
            @click="choose(() => { draft.carShape = shape as 'classic'|'sport'|'boxy' })"
          >
            <div class="car-choice-preview" :class="shape">
              <div class="car-choice-body" :style="{ background: draft.color === 'red' ? '#b91c1c' : draft.color === 'blue' ? '#2563eb' : '#f59e0b' }" />
              <span class="wheel left" />
              <span class="wheel right" />
            </div>
            <strong>{{ shape === 'classic' ? 'Classic' : shape === 'sport' ? 'Sport' : 'Boxy' }}</strong>
          </button>
        </div>

        <div v-if="draft.playerKind === 'car'" class="color-picker-row">
          <span>颜色</span>
          <button class="color-dot red" :class="{ selected: draft.color === 'red' }" @click="choose(() => { draft.color='red' })" />
          <button class="color-dot blue" :class="{ selected: draft.color === 'blue' }" @click="choose(() => { draft.color='blue' })" />
          <button class="color-dot yellow" :class="{ selected: draft.color === 'yellow' }" @click="choose(() => { draft.color='yellow' })" />
        </div>
      </section>

      <section v-else-if="step === 2 && draft.playerKind === 'car'" class="launch-step">
        <div class="driver-grid">
          <button
            v-for="(name, key) in driverNames"
            :key="key"
            :class="{ selected: draft.driver === key }"
            @click="choose(() => { draft.driver = key as DriverPreset })"
          >
            <div class="driver-avatar" :class="key">
              <span class="driver-head" />
              <span class="driver-body" />
            </div>
            <strong>{{ name }}</strong>
            <span>Driver</span>
          </button>
        </div>
        <p class="step-note">昵称头像仅作为比赛身份，不是骑手或实体组合。</p>
      </section>

      <section v-else-if="step === 3" class="launch-step">
        <div class="track-grid">
          <button :class="{ selected: draft.track === 'straight' }" @click="choose(() => { draft.track='straight' })">
            <div class="track-mini straight"><span /></div>
            <strong>直道</strong>
            <span>最简单，专注速度</span>
          </button>
          <button :class="{ selected: draft.track === 'curve' }" @click="choose(() => { draft.track='curve' })">
            <div class="track-mini curve"><span /></div>
            <strong>缓弯</strong>
            <span>需要真正转向</span>
          </button>
          <button :class="{ selected: draft.track === 'circuit' }" @click="choose(() => { draft.track='circuit' })">
            <div class="track-mini circuit"><span /></div>
            <strong>环形</strong>
            <span>更像完整比赛</span>
          </button>
        </div>
        <div class="length-row">
          <span>赛道长度</span>
          <button :class="{ selected: draft.length === 1 }" @click="choose(() => { draft.length=1 })">1 km</button>
          <button :class="{ selected: draft.length === 2 }" @click="choose(() => { draft.length=2 })">2 km</button>
        </div>
      </section>

      <section v-else-if="step === 4" class="launch-step">
        <div class="opponent-picker">
          <span>电脑对手</span>
          <div class="number-pills">
            <button v-for="n in [0,1,2,3]" :key="n" :class="{ selected: draft.opponents === n }" @click="choose(() => { draft.opponents=n as 0|1|2|3 })">{{ n }}</button>
          </div>
        </div>
        <RaceSpeciesPicker v-for="(_, i) in draft.opponentKinds!.slice(0, draft.opponents)" :key="i" :model-value="draft.opponentKinds![i]" :label="`CPU ${i + 1}`" @update:model-value="kind => choose(() => { draft.opponentKinds![i] = kind })" />
        <div class="difficulty-grid">
          <button :class="{ selected: draft.difficulty === 'easy' }" @click="choose(() => { draft.difficulty='easy' })">
            <strong>Easy</strong><span>比较慢，适合第一次</span>
          </button>
          <button :class="{ selected: draft.difficulty === 'normal' }" @click="choose(() => { draft.difficulty='normal' })">
            <strong>Normal</strong><span>速度和转向比较均衡</span>
          </button>
          <button :class="{ selected: draft.difficulty === 'fast' }" @click="choose(() => { draft.difficulty='fast' })">
            <strong>Fast</strong><span>电脑车更快</span>
          </button>
        </div>
      </section>

      <section v-else-if="step === 5" class="launch-step">
        <div class="feel-grid">
          <div>
            <h3>动效</h3>
            <button :class="{ selected: draft.motion === 'clean' }" @click="choose(() => { draft.motion='clean' })">Clean</button>
            <button :class="{ selected: draft.motion === 'dynamic' }" @click="choose(() => { draft.motion='dynamic' })">Dynamic</button>
          </div>
          <div>
            <h3>声音</h3>
            <p v-if="draft.playerKind !== 'car'">{{ draft.playerKind === 'human' ? '脚步声 · 随速度变化' : '蹄声 · 随速度变化' }}</p>
            <template v-else>
            <button :class="{ selected: draft.sound === 'light' }" @click="choose(() => { draft.sound='light' })">Light</button>
            <button :class="{ selected: draft.sound === 'sport' }" @click="choose(() => { draft.sound='sport' })">Sport</button>
            <button :class="{ selected: draft.sound === 'electric' }" @click="choose(() => { draft.sound='electric' })">Electric</button>
            </template>
          </div>
        </div>
      </section>

      <section v-else class="launch-step review-step">
        <div class="review-hero">
          <span>READY</span>
          <h2>{{ draft.playerKind?.toUpperCase() }}<template v-if="draft.playerKind === 'car'"> · {{ draft.carShape.toUpperCase() }} · {{ draft.color.toUpperCase() }}</template></h2>
        <p>{{ draft.playerKind === 'car' ? `${driverNames[draft.driver]} 驾驶` : '独立参赛' }} · {{ draft.track }} · {{ draft.length }} km</p>
        </div>
        <div class="review-grid">
          <div><span>对手</span><strong>{{ draft.opponentKinds!.slice(0, draft.opponents).join(' / ') || '无' }}</strong></div>
          <div><span>难度</span><strong>{{ draft.difficulty }}</strong></div>
          <div><span>动效</span><strong>{{ draft.motion }}</strong></div>
          <div><span>声音</span><strong>{{ draft.playerKind === 'car' ? draft.sound : draft.playerKind === 'human' ? 'footstep' : 'hoofbeat' }}</strong></div>
          <div><span>碰撞</span><strong>实体碰撞已开启</strong></div>
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
      <button v-else class="primary start-race-button" @click="startRace">🏁 直接开赛</button>
    </footer>
  </section>
</template>
