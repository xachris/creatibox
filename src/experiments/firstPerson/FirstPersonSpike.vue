<script setup lang="ts">
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createRaceProject } from '../../model/raceGenerator'
import { WorldRuntime } from '../../runtime/worldRuntime'
import { firstPersonCameraFrame, toThreeTransform } from './threeMapping'

const host = ref<HTMLDivElement | null>(null)
const elapsed = ref(0)
const phase = ref('loading')
const fps = ref(0)
const drawCalls = ref(0)
const error = ref('')
const keys = new Set<string>()
let animationFrame = 0
let disposed = false
let cleanup = () => {}

const project = createRaceProject({
  playerKind: 'car', opponentKinds: ['horse', 'human', 'sheep'], track: 'curve', length: 1,
  carShape: 'sport', color: 'blue', motion: 'dynamic', sound: 'electric', opponents: 3, difficulty: 'normal',
})
const runtime = new WorldRuntime(project)

function color(value: number) { return new THREE.Color(value) }

onMounted(() => {
  if (!host.value) return
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.value.clientWidth, host.value.clientHeight)
    renderer.setClearColor(0xbfd6ed)
    host.value.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0xbfd6ed, 250, 1400)
    const camera = new THREE.PerspectiveCamera(70, host.value.clientWidth / host.value.clientHeight, 0.5, 2200)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x405c34, 2.2))
    const sun = new THREE.DirectionalLight(0xffffff, 2.4)
    sun.position.set(200, 500, 100)
    scene.add(sun)

    const bounds = project.world.worldBounds ?? { width: 1800, height: 1000 }
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds.width, bounds.height),
      new THREE.MeshLambertMaterial({ color: 0x6fa35a }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.set(bounds.width / 2, -0.08, bounds.height / 2)
    scene.add(ground)

    const track = project.world.trackPath ?? []
    for (let index = 1; index < track.length; index++) {
      const from = track[index - 1]
      const to = track[index]
      const length = Math.hypot(to.x - from.x, to.y - from.y)
      const road = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.18, 170),
        new THREE.MeshLambertMaterial({ color: 0x475569 }),
      )
      road.position.set((from.x + to.x) / 2, 0, (from.y + to.y) / 2)
      road.rotation.y = -Math.atan2(to.y - from.y, to.x - from.x)
      scene.add(road)
    }

    const meshes = new Map<string, THREE.Mesh>()
    for (const entity of runtime.project.world.entities) {
      if (['road', 'start', 'finish'].includes(entity.kind)) continue
      const transform = toThreeTransform(entity)
      const geometry = entity.kind === 'tree'
        ? new THREE.CylinderGeometry(entity.size.x * 0.18, entity.size.x * 0.28, transform.scale.y, 8)
        : new THREE.BoxGeometry(transform.scale.x, transform.scale.y, transform.scale.z)
      const material = new THREE.MeshLambertMaterial({ color: color(entity.color) })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData.entityId = entity.id
      scene.add(mesh)
      meshes.set(entity.id, mesh)
    }

    let previous = performance.now()
    let sampleStarted = previous
    let sampleFrames = 0
    const animate = (now: number) => {
      if (disposed) return
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      runtime.step(delta, keys)
      for (const entity of runtime.project.world.entities) {
        const mesh = meshes.get(entity.id)
        if (!mesh) continue
        const transform = toThreeTransform(entity)
        mesh.position.set(transform.position.x, transform.position.y, transform.position.z)
        mesh.rotation.y = transform.rotationY
      }
      const frame = firstPersonCameraFrame(runtime.player)
      camera.position.set(frame.position.x, frame.position.y, frame.position.z)
      camera.lookAt(frame.target.x, frame.target.y, frame.target.z)
      renderer.render(scene, camera)
      elapsed.value = runtime.elapsed
      phase.value = runtime.phase
      drawCalls.value = renderer.info.render.calls
      sampleFrames += 1
      if (now - sampleStarted >= 1000) {
        fps.value = Math.round(sampleFrames * 1000 / (now - sampleStarted))
        sampleFrames = 0
        sampleStarted = now
      }
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)

    const resize = () => {
      if (!host.value) return
      camera.aspect = host.value.clientWidth / host.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.value.clientWidth, host.value.clientHeight)
    }
    const down = (event: KeyboardEvent) => { keys.add(event.key.toLowerCase()); if (event.key.startsWith('Arrow') || event.key === ' ') event.preventDefault() }
    const up = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase())
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', down, { passive: false })
    window.addEventListener('keyup', up)

    cleanup = () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        for (const material of materials) material.dispose()
      })
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Three.js prototype failed to start.'
  }
})

onBeforeUnmount(() => cleanup())

function exitSpike() {
  window.location.href = window.location.pathname
}
</script>

<template>
  <main class="fp-spike">
    <div ref="host" class="fp-spike-canvas" aria-label="First-Person Three.js 技术验证" tabindex="0" />
    <div class="fp-spike-hud">
      <strong>First-Person Architecture Spike</strong>
      <span>开发实验，不是产品功能</span>
      <span>{{ phase }} · {{ elapsed.toFixed(1) }} 秒 · {{ fps }} fps · {{ drawCalls }} draw calls</span>
      <span>共享 WorldRuntime · 方向键 / Space</span>
      <button type="button" @click="exitSpike">退出实验</button>
      <span v-if="error" role="alert">{{ error }}</span>
    </div>
  </main>
</template>
