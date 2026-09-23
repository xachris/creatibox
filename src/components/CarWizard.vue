<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { CarShape, ControlScheme } from '../model/types'

export interface CarWizardResult {
  name: string
  color: number
  width: number
  height: number
  maxSpeed: number
  wheelCount: number
  carShape: CarShape
  controls: ControlScheme
}

const emit = defineEmits<{
  close: []
  create: [result: CarWizardResult]
}>()

const step = ref(1)
const draft = reactive({
  name: 'My Car',
  controlPreset: 'wasd' as 'wasd' | 'arrows' | 'custom',
  accelerate: 'w',
  brake: 's',
  left: 'a',
  right: 'd',
  maxSpeed: 220,
  color: '#b91c1c',
  carShape: 'classic' as CarShape,
  width: 72,
  height: 42,
  wheelCount: 4,
})

const titles = [
  '给你的车起个名字',
  '你想怎么控制它？',
  '你希望它有多快？',
  '它应该长什么样？',
  '最后调整车身和轮子',
]

const canNext = computed(() => {
  if (step.value === 1) return draft.name.trim().length > 0
  if (step.value === 2) return [draft.accelerate, draft.brake, draft.left, draft.right].every(Boolean)
  return true
})

function applyPreset(value: 'wasd' | 'arrows' | 'custom') {
  draft.controlPreset = value
  if (value === 'wasd') {
    Object.assign(draft, { accelerate: 'w', brake: 's', left: 'a', right: 'd' })
  }
  if (value === 'arrows') {
    Object.assign(draft, { accelerate: 'arrowup', brake: 'arrowdown', left: 'arrowleft', right: 'arrowright' })
  }
}

function finish() {
  emit('create', {
    name: draft.name.trim(),
    color: Number.parseInt(draft.color.slice(1), 16),
    width: draft.width,
    height: draft.height,
    maxSpeed: draft.maxSpeed,
    wheelCount: draft.wheelCount,
    carShape: draft.carShape,
    controls: {
      accelerate: draft.accelerate.toLowerCase(),
      brake: draft.brake.toLowerCase(),
      left: draft.left.toLowerCase(),
      right: draft.right.toLowerCase(),
    },
  })
}
</script>

<template>
  <div class="wizard-backdrop" @click.self="emit('close')">
    <section class="wizard-card">
      <header class="wizard-header">
        <div>
          <span class="wizard-kicker">创建赛车 · {{ step }}/5</span>
          <h2>{{ titles[step - 1] }}</h2>
        </div>
        <button class="icon-button" @click="emit('close')">×</button>
      </header>

      <div class="wizard-progress">
        <span v-for="n in 5" :key="n" :class="{ active: n <= step }" />
      </div>

      <div class="wizard-body">
        <template v-if="step === 1">
          <p>这是你的作品。先给它一个名字，以后在规则和场景里都会看到这个名字。</p>
          <input v-model="draft.name" class="wizard-text-input" maxlength="30" autofocus />
        </template>

        <template v-else-if="step === 2">
          <p>选择最顺手的操控方式。运行世界以后，这些按键会真正控制赛车。</p>
          <div class="choice-grid">
            <button :class="{ selected: draft.controlPreset === 'wasd' }" @click="applyPreset('wasd')">
              <strong>WASD</strong>
              <span>W 前进 · S 刹车 · A/D 转向</span>
            </button>
            <button :class="{ selected: draft.controlPreset === 'arrows' }" @click="applyPreset('arrows')">
              <strong>方向键</strong>
              <span>↑ 前进 · ↓ 刹车 · ←/→ 转向</span>
            </button>
            <button :class="{ selected: draft.controlPreset === 'custom' }" @click="applyPreset('custom')">
              <strong>自定义</strong>
              <span>自己决定四个按键</span>
            </button>
          </div>
          <div v-if="draft.controlPreset === 'custom'" class="key-grid">
            <label>前进<input v-model="draft.accelerate" maxlength="12" /></label>
            <label>刹车<input v-model="draft.brake" maxlength="12" /></label>
            <label>左转<input v-model="draft.left" maxlength="12" /></label>
            <label>右转<input v-model="draft.right" maxlength="12" /></label>
          </div>
        </template>

        <template v-else-if="step === 3">
          <p>速度会影响驾驶感。先选一个你觉得有意思的速度，之后仍然可以在属性面板里修改。</p>
          <div class="speed-display">{{ draft.maxSpeed }}</div>
          <input v-model.number="draft.maxSpeed" class="wizard-range" type="range" min="80" max="420" step="10" />
          <div class="range-labels"><span>稳一点</span><span>很快</span></div>
        </template>

        <template v-else-if="step === 4">
          <p>先决定颜色和车身风格。我们以后还会把几何图形组合能力接进来。</p>
          <label class="wizard-color-row">
            车身颜色
            <input v-model="draft.color" type="color" />
          </label>
          <div class="choice-grid shape-grid">
            <button :class="{ selected: draft.carShape === 'classic' }" @click="draft.carShape = 'classic'">经典</button>
            <button :class="{ selected: draft.carShape === 'sport' }" @click="draft.carShape = 'sport'">跑车</button>
            <button :class="{ selected: draft.carShape === 'boxy' }" @click="draft.carShape = 'boxy'">方盒</button>
          </div>
        </template>

        <template v-else>
          <p>最后决定比例和轮子。它们会直接改变画布里的车，而不是只写在说明书里。</p>
          <div class="field-row wizard-fields">
            <label>车身长度<input v-model.number="draft.width" type="number" min="44" max="150" /></label>
            <label>车身宽度<input v-model.number="draft.height" type="number" min="28" max="100" /></label>
          </div>
          <label class="wheel-row">
            轮子数量
            <select v-model.number="draft.wheelCount">
              <option :value="2">2</option>
              <option :value="4">4</option>
              <option :value="6">6</option>
              <option :value="8">8</option>
            </select>
          </label>
          <div class="wizard-summary">
            <strong>{{ draft.name }}</strong>
            <span>速度 {{ draft.maxSpeed }}</span>
            <span>{{ draft.wheelCount }} 个轮子</span>
          </div>
        </template>
      </div>

      <footer class="wizard-footer">
        <button v-if="step > 1" @click="step--">上一步</button>
        <span />
        <button v-if="step < 5" class="primary" :disabled="!canNext" @click="step++">下一步</button>
        <button v-else class="primary" @click="finish">创造这辆车</button>
      </footer>
    </section>
  </div>
</template>
