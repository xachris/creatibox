<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FirstPersonRenderer, type FirstPersonStats } from '../../render/firstPersonRenderer'
import { isRaceParticipant } from '../../model/race'
import { createFirstPersonPressureProject, type FirstPersonPressureCount } from './pressureProject'

const host = ref<HTMLDivElement | null>(null)
const fps = ref(0)
const loadMs = ref(0)
const stats = ref<FirstPersonStats>({ drawCalls: 0, triangles: 0, visibleEntities: 0, qualityTier: 'standard' })
const error = ref('')
const rawCount = Number(new URLSearchParams(window.location.search).get('entities'))
const count: FirstPersonPressureCount = rawCount === 500 ? 500 : 1000
const project = createFirstPersonPressureProject(count)
const player = project.world.entities.find(entity => isRaceParticipant(entity) && entity.controlRole === 'player')!
let animationFrame = 0
let renderer: FirstPersonRenderer | null = null

onMounted(() => {
  if (!host.value) return
  try {
    const startedAt = performance.now()
    renderer = new FirstPersonRenderer(host.value, project)
    loadMs.value = performance.now() - startedAt
    let sampleStarted = performance.now(), sampleFrames = 0
    const animate = (now: number) => {
      if (!renderer) return
      stats.value = renderer.render(project, player)
      sampleFrames += 1
      if (now - sampleStarted >= 1000) {
        fps.value = Math.round(sampleFrames * 1000 / (now - sampleStarted))
        sampleFrames = 0; sampleStarted = now
      }
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'First-Person pressure fixture failed to start.'
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrame)
  renderer?.dispose()
  renderer = null
})

function exitPressure() { window.location.href = window.location.pathname }
</script>

<template>
  <main class="fp-spike">
    <div ref="host" class="fp-spike-canvas" aria-label="First-Person WebGL 压力场景" />
    <div class="fp-spike-hud" data-testid="first-person-pressure-stats">
      <strong>First-Person WebGL Pressure</strong>
      <span>开发验收入口 · {{ count }} 个静态 Entity</span>
      <span>{{ stats.qualityTier }} · {{ fps }} fps · {{ stats.drawCalls }} draw calls · {{ stats.triangles }} triangles</span>
      <span>{{ stats.visibleEntities }} range-visible · {{ loadMs.toFixed(1) }} ms init</span>
      <button type="button" @click="exitPressure">退出压力场景</button>
      <span v-if="error" role="alert">{{ error }}</span>
    </div>
  </main>
</template>
