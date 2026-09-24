<script setup lang="ts">
import { createProjectViewPreferences, isRaceParticipant } from './model/race'
import { cloneData } from './model/clone'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import WorldCanvas from './components/WorldCanvas.vue'
import CarWizard, { type CarWizardResult } from './components/CarWizard.vue'
import CreationModePicker from './components/CreationModePicker.vue'
import RaceComposer from './components/RaceComposer.vue'
import HomeCatalog from './components/HomeCatalog.vue'
import RacingLaunchFlow, { type RacingLaunchOptions } from './components/RacingLaunchFlow.vue'
import { createCar, createEntity, createRandomCar, createStarterProject } from './model/factory'
import { createRaceProject, type RacePresetOptions } from './model/raceGenerator'
import type { CreatiBoxProject, EntityKind } from './model/types'
import { exportProject, importProject, loadAutosave, saveAutosave } from './storage/projectStorage'
import { raceAudio } from './media/sound/audioDirector'

type Snapshot = CreatiBoxProject

const FirstPersonSpike = defineAsyncComponent(() => import('./experiments/firstPerson/FirstPersonSpike.vue'))
const firstPersonSpikeEnabled = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('experiment') === 'first-person'

const project = ref<CreatiBoxProject>(createStarterProject())
const selectedId = ref<string | null>(null)
const mode = ref<'edit' | 'run'>('edit')
const undoStack = ref<Snapshot[]>([])
const redoStack = ref<Snapshot[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const showCarWizard = ref(false)
const showCreationModePicker = ref(false)
const showRaceComposer = ref(false)
const screen = ref<'home' | 'launch' | 'editor'>('home')
const hasRecentProject = ref(false)
const saveError = ref('')
const runViewMode = ref<'top-down' | 'oblique' | 'first-person'>('top-down')
let autosaveTimer: number | undefined

const selected = computed(() =>
  project.value.world.entities.find((entity) => entity.id === selectedId.value) ?? null,
)

const palette: { kind: EntityKind; label: string }[] = [
  { kind: 'car', label: '赛车' },
  { kind: 'horse', label: '马' },
  { kind: 'human', label: '人' },
  { kind: 'sheep', label: '羊' },
  { kind: 'road', label: '道路' },
  { kind: 'wall', label: '墙' },
  { kind: 'obstacle', label: '障碍' },
  { kind: 'tree', label: '树' },
  { kind: 'start', label: '起点' },
  { kind: 'finish', label: '终点' },
]

function snapshot() {
  undoStack.value.push(cloneData(project.value))
  if (undoStack.value.length > 60) undoStack.value.shift()
  redoStack.value = []
}

function addEntity(kind: EntityKind) {
  if (mode.value !== 'edit') return
  if (kind === 'car') {
    showCreationModePicker.value = true
    return
  }
  snapshot()
  const offset = project.value.world.entities.length * 16
  const entity = createEntity(kind, 180 + (offset % 240), 140 + (offset % 160))
  project.value.world.entities.push(entity)
  selectedId.value = entity.id
}

function placeCreatedCar(car: ReturnType<typeof createCar>) {
  snapshot()
  project.value.world.entities.push(car)
  selectedId.value = car.id
}

function chooseCarCreationMode(choice: 'default' | 'random' | 'guided') {
  showCreationModePicker.value = false

  if (choice === 'guided') {
    showCarWizard.value = true
    return
  }

  const offset = project.value.world.entities.length * 18
  const x = 180 + (offset % 220)
  const y = 150 + (offset % 140)

  if (choice === 'random') {
    placeCreatedCar(createRandomCar(x, y))
    return
  }

  placeCreatedCar(createEntity('car', x, y))
}

function createGuidedCar(result: CarWizardResult) {
  const offset = project.value.world.entities.length * 18
  const car = createCar(result, 180 + (offset % 220), 150 + (offset % 140))
  placeCreatedCar(car)
  showCarWizard.value = false
}

function createPresetRace(options: RacePresetOptions) {
  snapshot()
  project.value = createRaceProject(options)
  runViewMode.value = 'top-down'
  selectedId.value = project.value.world.entities.find((entity) => isRaceParticipant(entity) && entity.controlRole === 'player')?.id ?? null
  showRaceComposer.value = false
}

function enterRunMode() {
  raceAudio.unlock()
  mode.value = 'run'
}

function startRacingGame(options: RacingLaunchOptions) {
  snapshot()
  project.value = createRaceProject(options)
  runViewMode.value = 'top-down'
  selectedId.value = project.value.world.entities.find((entity) => isRaceParticipant(entity) && entity.controlRole === 'player')?.id ?? null
  screen.value = 'editor'
  enterRunMode()
}

function goHome() {
  raceAudio.stopAll()
  mode.value = 'edit'
  screen.value = 'home'
}

function continueProject() {
  screen.value = 'editor'
  mode.value = 'edit'
}

function moveEntity(id: string, x: number, y: number) {
  const entity = project.value.world.entities.find((item) => item.id === id)
  if (!entity) return
  entity.position.x = Math.round(x)
  entity.position.y = Math.round(y)
}

function beginPropertyEdit() {
  if (mode.value === 'edit') snapshot()
}

function deleteSelected() {
  if (!selected.value || mode.value !== 'edit') return
  snapshot()
  project.value.world.entities = project.value.world.entities.filter((entity) => entity.id !== selected.value?.id)
  selectedId.value = null
}

function duplicateSelected() {
  if (!selected.value || mode.value !== 'edit') return
  snapshot()
  const clone = cloneData(selected.value)
  clone.id = crypto.randomUUID()
  clone.name = `${clone.name} Copy`
  clone.position.x += 28
  clone.position.y += 28
  project.value.world.entities.push(clone)
  selectedId.value = clone.id
}

function undo() {
  const previous = undoStack.value.pop()
  if (!previous || mode.value !== 'edit') return
  redoStack.value.push(cloneData(project.value))
  project.value = previous
  selectedId.value = null
}

function redo() {
  const next = redoStack.value.pop()
  if (!next || mode.value !== 'edit') return
  undoStack.value.push(cloneData(project.value))
  project.value = next
  selectedId.value = null
}

function newProject() {
  snapshot()
  project.value = createStarterProject()
  runViewMode.value = 'top-down'
  selectedId.value = null
}

async function openFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    snapshot()
    project.value = await importProject(file)
    runViewMode.value = project.value.view?.run.viewMode ?? 'top-down'
    selectedId.value = null
    screen.value = 'editor'
    mode.value = 'edit'
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '无法打开项目。')
  } finally {
    input.value = ''
  }
}

onMounted(async () => {
  const saved = await loadAutosave().catch(() => { saveError.value = '无法读取本机存档，可导入项目继续。'; return undefined })
  if (saved && screen.value === 'home') {
    project.value = saved
    runViewMode.value = saved.view?.run.viewMode ?? 'top-down'
    hasRecentProject.value = true
  }
})

watch(project, () => {
  window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    void saveAutosave(project.value).then(() => { hasRecentProject.value = true }).catch(() => { saveError.value = '自动保存失败，请导出项目备份。' })
  }, 350)
}, { deep: true })

function colorHex(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
}

function setColor(value: string) {
  if (!selected.value) return
  selected.value.color = Number.parseInt(value.replace('#', ''), 16)
}

function setRunViewMode(viewMode: 'top-down' | 'oblique' | 'first-person') {
  if (mode.value !== 'run' || runViewMode.value === viewMode) return
  runViewMode.value = viewMode
  const preferences = createProjectViewPreferences(viewMode)
  if (project.value.view) {
    preferences.edit = { ...project.value.view.edit, viewMode: 'top-down', followMode: 'none' }
    preferences.run = { ...project.value.view.run, viewMode, followMode: 'participant' }
  }
  project.value.view = preferences
}
</script>

<template>
  <FirstPersonSpike v-if="firstPersonSpikeEnabled" />
  <input v-if="!firstPersonSpikeEnabled" ref="fileInput" class="hidden-input" type="file" accept=".creatibox,application/json" @change="openFile" />

  <HomeCatalog
    v-if="!firstPersonSpikeEnabled && screen === 'home'"
    :has-recent-project="hasRecentProject"
    @racing="screen = 'launch'"
    @continue="continueProject"
    @import="fileInput?.click()"
  />

  <RacingLaunchFlow
    v-else-if="screen === 'launch'"
    @cancel="screen = 'home'"
    @start="startRacingGame"
  />

  <main v-else-if="!firstPersonSpikeEnabled" class="app-shell" :class="{ playing: mode === 'run' }">
    <RaceComposer
      v-if="showRaceComposer"
      @close="showRaceComposer = false"
      @create="createPresetRace"
    />
    <CreationModePicker
      v-if="showCreationModePicker"
      @close="showCreationModePicker = false"
      @choose="chooseCarCreationMode"
    />
    <CarWizard
      v-if="showCarWizard"
      @close="showCarWizard = false"
      @create="createGuidedCar"
    />
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">C</span>
        <div>
          <strong>CreatiBox</strong>
          <small>World Creator · MVP 0.1</small>
        </div>
      </div>

      <div class="toolbar">
        <button @click="goHome">首页</button>
        <button :disabled="mode === 'run'" @click="newProject">新建</button>
        <button class="accent" :disabled="mode === 'run'" @click="showRaceComposer = true">🏁 快速比赛</button>
        <button :disabled="mode === 'run'" @click="fileInput?.click()">打开</button>
        <button :disabled="mode === 'run'" @click="exportProject(project)">导出</button>
        <span class="toolbar-divider" />
        <button :disabled="mode === 'run' || !undoStack.length" @click="undo">↶ 撤销</button>
        <button :disabled="mode === 'run' || !redoStack.length" @click="redo">↷ 重做</button>
        <span class="toolbar-divider" />
        <button v-if="mode === 'edit'" class="primary" @click="enterRunMode">▶ 运行</button>
        <button v-else class="danger" @click="mode = 'edit'">■ 停止并重置</button>
      </div>

    </header>

    <section class="workspace">
      <aside class="library panel">
        <div class="panel-heading">
          <strong>对象库</strong>
          <span>拖入世界的积木</span>
        </div>

        <div class="palette">
          <button
            v-for="item in palette"
            :key="item.kind"
            class="palette-item"
            :disabled="mode === 'run'"
            @click="addEntity(item.kind)"
          >
            <span class="palette-icon" :class="`kind-${item.kind}`" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <div class="tip-card">
          <strong>{{ mode === 'edit' ? '编辑模式' : '运行模式' }}</strong>
          <p v-if="mode === 'edit'">点击“赛车”可选默认、随机或指南三种创建方式。所有生成结果都能继续修改。</p>
          <p v-else>方向键控制方向，Space 加速。摄像机会跟随玩家车，电脑车会沿赛道自动比赛。</p>
        </div>
      </aside>

      <section class="canvas-column">
        <div class="canvas-titlebar">
          <div>
            <strong>{{ project.name }}</strong>
            <span>{{ project.world.name }}</span>
          </div>
          <span class="mode-chip" :class="{ running: mode === 'run' }">
            {{ mode === 'edit' ? 'EDIT' : 'RUN' }}
          </span>
        </div>
        <div v-if="mode === 'run'" class="control-hint">
          <strong>驾驶</strong>
          <span>← → 转向</span>
          <span>↑ 前进 · ↓ 刹车</span>
          <span>Space 油门</span>
          <div class="view-switch" role="group" aria-label="运行视角">
            <button type="button" :aria-pressed="runViewMode === 'top-down'" @click="setRunViewMode('top-down')">俯视</button>
            <button type="button" :aria-pressed="runViewMode === 'oblique'" @click="setRunViewMode('oblique')">斜视</button>
            <button type="button" :aria-pressed="runViewMode === 'first-person'" @click="setRunViewMode('first-person')">第一人称</button>
          </div>
        </div>
        <WorldCanvas
          :project="project"
          :selected-id="selectedId"
          :mode="mode"
          :view-mode="mode === 'run' ? runViewMode : 'top-down'"
          @select="selectedId = $event"
          @move="moveEntity"
          @edit="mode = 'edit'"
          @home="goHome"
          @view-fallback="setRunViewMode($event)"
        />
      </section>

      <aside class="properties panel">
        <div class="panel-heading">
          <strong>属性</strong>
          <span>{{ selected ? selected.name : '请选择对象' }}</span>
        </div>

        <template v-if="selected">
          <label>
            名称
            <input v-model="selected.name" :disabled="mode === 'run'" @focus="beginPropertyEdit" />
          </label>

          <div class="field-row">
            <label>
              X
              <input v-model.number="selected.position.x" type="number" :disabled="mode === 'run'" @focus="beginPropertyEdit" />
            </label>
            <label>
              Y
              <input v-model.number="selected.position.y" type="number" :disabled="mode === 'run'" @focus="beginPropertyEdit" />
            </label>
          </div>

          <div class="field-row">
            <label>
              宽度
              <input v-model.number="selected.size.x" type="number" min="8" max="600" :disabled="mode === 'run'" @focus="beginPropertyEdit" />
            </label>
            <label>
              高度
              <input v-model.number="selected.size.y" type="number" min="8" max="600" :disabled="mode === 'run'" @focus="beginPropertyEdit" />
            </label>
          </div>

          <label>
            颜色
            <input
              type="color"
              :value="colorHex(selected.color)"
              :disabled="mode === 'run'"
              @focus="beginPropertyEdit"
              @input="setColor(($event.target as HTMLInputElement).value)"
            />
          </label>

          <template v-if="selected.race">
            <label>
              控制角色
              <select v-model="selected.controlRole" :disabled="mode === 'run'" @focus="beginPropertyEdit">
                <option value="player">玩家控制</option>
                <option value="computer">电脑控制</option>
              </select>
            </label>
            <label>
              最大速度
              <input v-model.number="selected.race.maxSpeed" type="range" min="80" max="420" step="10" :disabled="mode === 'run'" @pointerdown="beginPropertyEdit" />
              <span class="value">{{ selected.race.maxSpeed }}</span>
            </label>
            <label>
              初始耐久
              <input v-model.number="selected.durability" type="range" min="10" max="200" step="5" :disabled="mode === 'run'" @pointerdown="beginPropertyEdit" />
              <span class="value">{{ selected.durability }}</span>
            </label>
          </template>

          <div class="entity-actions">
            <button :disabled="mode === 'run'" @click="duplicateSelected">复制</button>
            <button :disabled="mode === 'run'" class="danger-outline" @click="deleteSelected">删除</button>
          </div>
        </template>

        <div v-else class="empty-state">
          <div class="empty-icon">◇</div>
          <p>点击画布中的对象，在这里修改它。</p>
        </div>

        <div class="rules-card">
          <strong>当前世界规则</strong>
          <div v-for="rule in project.world.rules" :key="rule.id" class="rule-line">
            当 {{ rule.sourceCapability ?? rule.sourceKind }} {{ rule.interaction }} {{ rule.targetCapability ?? rule.targetKind }}
            <span>→ {{ rule.effect }} {{ rule.value ?? '' }}</span>
          </div>
        </div>
      </aside>
    </section>

    <footer class="statusbar">
      <span>对象 {{ project.world.entities.length }}</span>
      <span>规则 {{ project.world.rules.length }}</span>
      <span>{{ saveError || '自动保存到本机浏览器' }}</span>
      <span class="status-grow" />
      <span>{{ project.world.trackPreset ?? 'custom' }} · {{ project.world.trackLength ?? 1 }} km</span>
    </footer>
  </main>
</template>
