<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import WorldCanvas from './components/WorldCanvas.vue'
import CarWizard, { type CarWizardResult } from './components/CarWizard.vue'
import { createCar, createEntity, createStarterProject } from './model/factory'
import type { CreatiBoxProject, EntityKind } from './model/types'
import { exportProject, importProject, loadAutosave, saveAutosave } from './storage/projectStorage'

type Snapshot = CreatiBoxProject

const project = ref<CreatiBoxProject>(createStarterProject())
const selectedId = ref<string | null>(null)
const mode = ref<'edit' | 'run'>('edit')
const undoStack = ref<Snapshot[]>([])
const redoStack = ref<Snapshot[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const showCarWizard = ref(false)
let autosaveTimer: number | undefined

const selected = computed(() =>
  project.value.world.entities.find((entity) => entity.id === selectedId.value) ?? null,
)

const palette: { kind: EntityKind; label: string }[] = [
  { kind: 'car', label: '赛车' },
  { kind: 'road', label: '道路' },
  { kind: 'wall', label: '墙' },
  { kind: 'obstacle', label: '障碍' },
  { kind: 'start', label: '起点' },
  { kind: 'finish', label: '终点' },
]

function snapshot() {
  undoStack.value.push(structuredClone(project.value))
  if (undoStack.value.length > 60) undoStack.value.shift()
  redoStack.value = []
}

function addEntity(kind: EntityKind) {
  if (mode.value !== 'edit') return
  if (kind === 'car') {
    showCarWizard.value = true
    return
  }
  snapshot()
  const offset = project.value.world.entities.length * 16
  const entity = createEntity(kind, 180 + (offset % 240), 140 + (offset % 160))
  project.value.world.entities.push(entity)
  selectedId.value = entity.id
}

function createGuidedCar(result: CarWizardResult) {
  snapshot()
  const offset = project.value.world.entities.length * 18
  const car = createCar(result, 180 + (offset % 220), 150 + (offset % 140))
  project.value.world.entities.push(car)
  selectedId.value = car.id
  showCarWizard.value = false
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
  const clone = structuredClone(selected.value)
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
  redoStack.value.push(structuredClone(project.value))
  project.value = previous
  selectedId.value = null
}

function redo() {
  const next = redoStack.value.pop()
  if (!next || mode.value !== 'edit') return
  undoStack.value.push(structuredClone(project.value))
  project.value = next
  selectedId.value = null
}

function newProject() {
  snapshot()
  project.value = createStarterProject()
  selectedId.value = null
}

async function openFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    snapshot()
    project.value = await importProject(file)
    selectedId.value = null
  } catch (error) {
    window.alert(error instanceof Error ? error.message : '无法打开项目。')
  } finally {
    input.value = ''
  }
}

onMounted(async () => {
  const saved = await loadAutosave()
  if (saved) project.value = saved
})

watch(project, () => {
  window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    void saveAutosave(project.value)
  }, 350)
}, { deep: true })

function colorHex(color: number) {
  return `#${color.toString(16).padStart(6, '0')}`
}

function setColor(value: string) {
  if (!selected.value) return
  selected.value.color = Number.parseInt(value.replace('#', ''), 16)
}
</script>

<template>
  <main class="app-shell">
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
        <button :disabled="mode === 'run'" @click="newProject">新建</button>
        <button :disabled="mode === 'run'" @click="fileInput?.click()">打开</button>
        <button :disabled="mode === 'run'" @click="exportProject(project)">导出</button>
        <span class="toolbar-divider" />
        <button :disabled="mode === 'run' || !undoStack.length" @click="undo">↶ 撤销</button>
        <button :disabled="mode === 'run' || !redoStack.length" @click="redo">↷ 重做</button>
        <span class="toolbar-divider" />
        <button v-if="mode === 'edit'" class="primary" @click="mode = 'run'">▶ 运行</button>
        <button v-else class="danger" @click="mode = 'edit'">■ 停止并重置</button>
      </div>

      <input ref="fileInput" class="hidden-input" type="file" accept=".creatibox,application/json" @change="openFile" />
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
          <p v-if="mode === 'edit'">点击“赛车”会进入创建向导。先决定控制方式、速度和外形，再把它放进世界。</p>
          <p v-else>方向键或 WASD 驾驶赛车。碰墙会损伤，抵达绿色终点即完成。</p>
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
        <WorldCanvas
          :project="project"
          :selected-id="selectedId"
          :mode="mode"
          @select="selectedId = $event"
          @move="moveEntity"
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

          <template v-if="selected.kind === 'car'">
            <label>
              最大速度
              <input v-model.number="selected.maxSpeed" type="range" min="80" max="420" step="10" :disabled="mode === 'run'" @pointerdown="beginPropertyEdit" />
              <span class="value">{{ selected.maxSpeed }}</span>
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
            当 {{ rule.sourceKind }} {{ rule.interaction }} {{ rule.targetKind }}
            <span>→ {{ rule.effect }} {{ rule.value ?? '' }}</span>
          </div>
        </div>
      </aside>
    </section>

    <footer class="statusbar">
      <span>对象 {{ project.world.entities.length }}</span>
      <span>规则 {{ project.world.rules.length }}</span>
      <span>自动保存到本机浏览器</span>
      <span class="status-grow" />
      <span>赛车按键由创建者自己定义</span>
    </footer>
  </main>
</template>
