import * as THREE from 'three'
import type { CreatiBoxProject, Entity } from '../model/types'
import { firstPersonCameraFrame } from '../experiments/firstPerson/threeMapping'
import { chooseFirstPersonQuality, isFirstPersonStaticKind, isWithinFirstPersonRange } from './firstPersonPresentation'

export interface FirstPersonStats { drawCalls: number; triangles: number; visibleEntities: number; qualityTier: 'low' | 'standard' }
type DeviceNavigator = Navigator & { deviceMemory?: number }

/** Display-only Three.js adapter. WorldRuntime remains the only simulation owner. */
export class FirstPersonRenderer {
  readonly viewMode = 'first-person' as const
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly models = new Map<string, THREE.Group>()
  private readonly geometries = new Map<string, THREE.BufferGeometry>()
  private readonly materials = new Map<string, THREE.MeshLambertMaterial>()
  private readonly staticTreeIds: string[] = []
  private readonly staticSolidIds: string[] = []
  private treeTrunks: THREE.InstancedMesh | null = null
  private treeCrowns: THREE.InstancedMesh | null = null
  private staticSolids: THREE.InstancedMesh | null = null
  private readonly resizeObserver: ResizeObserver
  private readonly quality
  private disposed = false

  constructor(private readonly host: HTMLElement, project: Readonly<CreatiBoxProject>) {
    if (!globalThis.WebGLRenderingContext) throw new Error('当前浏览器不支持 WebGL。')
    const device = navigator as DeviceNavigator
    this.quality = chooseFirstPersonQuality(window.devicePixelRatio, device.hardwareConcurrency, device.deviceMemory ?? 8)
    this.renderer = new THREE.WebGLRenderer({ antialias: this.quality.tier === 'standard', powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(this.quality.pixelRatio)
    this.renderer.setClearColor(0xbfd6ed)
    this.renderer.domElement.className = 'first-person-canvas'
    this.renderer.domElement.dataset.renderer = 'first-person'
    this.renderer.domElement.dataset.qualityTier = this.quality.tier
    this.host.appendChild(this.renderer.domElement)
    this.scene.fog = new THREE.Fog(0xbfd6ed, 250, this.quality.farDistance)
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.5, this.quality.farDistance + 200)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x405c34, 2.2))
    const sun = new THREE.DirectionalLight(0xffffff, 2.4)
    sun.position.set(200, 500, 100)
    this.scene.add(sun)
    this.buildStaticWorld(project)
    this.buildStaticEntities(project)
    for (const entity of project.world.entities) {
      if (entity.kind === 'road' || isFirstPersonStaticKind(entity.kind)) continue
      const model = this.createModel(entity)
      model.userData.entityId = entity.id
      this.scene.add(model)
      this.models.set(entity.id, model)
    }
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)
    this.resize()
  }

  private material(color: number, state: Entity['state'] = 'Idle') {
    const key = `${color}:${state}`
    let material = this.materials.get(key)
    if (!material) {
      const broken = state === 'Broken'
      material = new THREE.MeshLambertMaterial({
        color,
        emissive: state === 'Damaged' || broken ? 0x451111 : 0,
        opacity: broken ? .48 : 1,
        transparent: broken,
      })
      this.materials.set(key, material)
    }
    return material
  }
  private geometry(key: 'box' | 'cylinder' | 'sphere') {
    let geometry = this.geometries.get(key)
    if (!geometry) {
      geometry = key === 'box'
        ? new THREE.BoxGeometry(1, 1, 1)
        : key === 'cylinder'
          ? new THREE.CylinderGeometry(1, 1, 1, 8)
          : new THREE.SphereGeometry(1, 8, 6)
      this.geometries.set(key, geometry)
    }
    return geometry
  }
  private box(group: THREE.Group, size: [number, number, number], position: [number, number, number], color: number) {
    const mesh = new THREE.Mesh(this.geometry('box'), this.material(color)); mesh.scale.set(...size); mesh.position.set(...position); mesh.userData.baseColor = color; group.add(mesh)
  }
  private cylinder(group: THREE.Group, radius: number, height: number, position: [number, number, number], color: number, rotationX = 0) {
    const mesh = new THREE.Mesh(this.geometry('cylinder'), this.material(color)); mesh.scale.set(radius, height, radius); mesh.position.set(...position); mesh.rotation.x = rotationX; mesh.userData.baseColor = color; group.add(mesh)
  }
  private sphere(group: THREE.Group, radius: number, position: [number, number, number], color: number, scale: [number, number, number] = [1, 1, 1]) {
    const mesh = new THREE.Mesh(this.geometry('sphere'), this.material(color)); mesh.position.set(...position); mesh.scale.set(radius * scale[0], radius * scale[1], radius * scale[2]); mesh.userData.baseColor = color; group.add(mesh)
  }

  private buildStaticWorld(project: Readonly<CreatiBoxProject>) {
    const bounds = project.world.worldBounds ?? { width: 1800, height: 1000 }
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material(0x6fa35a))
    ground.scale.set(bounds.width, bounds.height, 1); ground.rotation.x = -Math.PI / 2; ground.position.set(bounds.width / 2, -0.12, bounds.height / 2); this.scene.add(ground)
    const track = project.world.trackPath ?? []
    const segmentCount = Math.max(0, track.length - 1)
    const roads = new THREE.InstancedMesh(this.geometry('box'), this.material(0x475569), segmentCount)
    const edges = new THREE.InstancedMesh(this.geometry('box'), this.material(0xf8fafc), segmentCount * 2)
    const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0)
    for (let index = 1; index < track.length; index++) {
      const from = track[index - 1], to = track[index]
      const length = Math.hypot(to.x - from.x, to.y - from.y) + 3
      const angle = -Math.atan2(to.y - from.y, to.x - from.x), x = (from.x + to.x) / 2, z = (from.y + to.y) / 2
      quaternion.setFromAxisAngle(yAxis, angle)
      matrix.compose(position.set(x, 0, z), quaternion, scale.set(length, .18, 170)); roads.setMatrixAt(index - 1, matrix)
      for (const side of [-1, 1]) {
        matrix.compose(position.set(x + Math.sin(angle) * side * 80, .12, z + Math.cos(angle) * side * 80), quaternion, scale.set(length, .2, 3))
        edges.setMatrixAt((index - 1) * 2 + (side === -1 ? 0 : 1), matrix)
      }
    }
    roads.instanceMatrix.needsUpdate = true; edges.instanceMatrix.needsUpdate = true
    this.scene.add(roads, edges)
  }

  private instanceBatch(count: number, material: THREE.Material) {
    const mesh = new THREE.InstancedMesh(this.geometry('box'), material, count)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    return mesh
  }

  private buildStaticEntities(project: Readonly<CreatiBoxProject>) {
    const trees = project.world.entities.filter(entity => entity.kind === 'tree')
    const solids = project.world.entities.filter(entity => entity.kind === 'wall' || entity.kind === 'obstacle')
    this.staticTreeIds.push(...trees.map(entity => entity.id))
    this.staticSolidIds.push(...solids.map(entity => entity.id))
    if (trees.length) {
      this.treeTrunks = new THREE.InstancedMesh(this.geometry('cylinder'), this.material(0x7c4a2d), trees.length)
      this.treeCrowns = new THREE.InstancedMesh(this.geometry('sphere'), this.material(0xffffff), trees.length)
      this.treeTrunks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.treeCrowns.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      this.treeTrunks.frustumCulled = false; this.treeCrowns.frustumCulled = false
      trees.forEach((entity, index) => this.treeCrowns!.setColorAt(index, new THREE.Color(entity.color)))
      if (this.treeCrowns.instanceColor) this.treeCrowns.instanceColor.needsUpdate = true
      this.scene.add(this.treeTrunks, this.treeCrowns)
    }
    if (solids.length) {
      this.staticSolids = this.instanceBatch(solids.length, this.material(0xffffff))
      solids.forEach((entity, index) => this.staticSolids!.setColorAt(index, new THREE.Color(entity.color)))
      if (this.staticSolids.instanceColor) this.staticSolids.instanceColor.needsUpdate = true
      this.scene.add(this.staticSolids)
    }
  }

  private updateStaticEntities(project: Readonly<CreatiBoxProject>, player: Readonly<Entity>, frustum: THREE.Frustum) {
    const entities = new Map(project.world.entities.map(entity => [entity.id, entity]))
    const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), quaternion = new THREE.Quaternion(), scale = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0)
    const sphere = new THREE.Sphere(new THREE.Vector3(), 1), instanceColor = new THREE.Color()
    let visible = 0
    const inView = (entity: Readonly<Entity>) => {
      const radius = Math.max(entity.size.x, entity.size.y)
      sphere.center.set(entity.position.x, radius * .5, entity.position.y); sphere.radius = radius
      return frustum.intersectsSphere(sphere)
    }
    const setMatrix = (mesh: THREE.InstancedMesh, index: number, entity: Readonly<Entity>, part: 'trunk' | 'crown' | 'solid', shown: boolean) => {
      if (!shown) {
        matrix.makeScale(0, 0, 0); mesh.setMatrixAt(index, matrix); return
      }
      const length = Math.max(12, entity.size.x), width = Math.max(8, entity.size.y)
      quaternion.setFromAxisAngle(yAxis, -entity.rotation)
      if (part === 'trunk') matrix.compose(position.set(entity.position.x, width * .28, entity.position.y), quaternion, scale.set(Math.max(4, width * .1), Math.max(25, width * .55), Math.max(4, width * .1)))
      else if (part === 'crown') matrix.compose(position.set(entity.position.x, width * .72, entity.position.y), quaternion, scale.set(width * .42, width * .504, width * .42))
      else matrix.compose(position.set(entity.position.x, Math.max(5, width * .225), entity.position.y), quaternion, scale.set(length, Math.max(10, width * .45), width))
      mesh.setMatrixAt(index, matrix)
    }
    let visibleTreeCount = 0
    this.staticTreeIds.forEach(id => {
      const entity = entities.get(id); if (!entity || !this.treeTrunks || !this.treeCrowns) return
      const shown = isWithinFirstPersonRange(entity, player.position, this.quality.farDistance)
      if (!shown) return
      visible += 1
      if (!inView(entity)) return
      setMatrix(this.treeTrunks, visibleTreeCount, entity, 'trunk', true); setMatrix(this.treeCrowns, visibleTreeCount, entity, 'crown', true)
      this.treeCrowns.setColorAt(visibleTreeCount, instanceColor.setHex(entity.color))
      visibleTreeCount += 1
    })
    let visibleSolidCount = 0
    this.staticSolidIds.forEach(id => {
      const entity = entities.get(id); if (!entity || !this.staticSolids) return
      const shown = isWithinFirstPersonRange(entity, player.position, this.quality.farDistance)
      if (!shown) return
      visible += 1
      if (!inView(entity)) return
      setMatrix(this.staticSolids, visibleSolidCount, entity, 'solid', true)
      this.staticSolids.setColorAt(visibleSolidCount, instanceColor.setHex(entity.color))
      visibleSolidCount += 1
    })
    if (this.treeTrunks && this.treeCrowns) { this.treeTrunks.count = visibleTreeCount; this.treeCrowns.count = visibleTreeCount }
    if (this.staticSolids) this.staticSolids.count = visibleSolidCount
    for (const mesh of [this.treeTrunks, this.treeCrowns, this.staticSolids]) if (mesh) mesh.instanceMatrix.needsUpdate = true
    if (this.treeCrowns?.instanceColor) this.treeCrowns.instanceColor.needsUpdate = true
    if (this.staticSolids?.instanceColor) this.staticSolids.instanceColor.needsUpdate = true
    return visible
  }

  private createModel(entity: Readonly<Entity>) {
    const group = new THREE.Group(), length = Math.max(12, entity.size.x), width = Math.max(8, entity.size.y), color = entity.color
    if (entity.kind === 'car') {
      this.box(group, [length, 9, width], [0, 8, 0], color); this.box(group, [length * .42, 8, width * .72], [-length * .05, 16, 0], 0xb9d8ed)
      for (const x of [-length * .3, length * .3]) for (const z of [-width * .54, width * .54]) this.cylinder(group, 4, 3, [x, 5, z], 0x111827, Math.PI / 2)
      this.box(group, [2, 3, width * .75], [length * .51, 8, 0], 0xfef3c7)
    } else if (entity.kind === 'horse') {
      this.box(group, [length * .72, 18, width * .72], [-length * .05, 20, 0], color); this.box(group, [length * .16, 20, width * .28], [length * .3, 34, 0], color); this.box(group, [length * .28, 13, width * .35], [length * .45, 45, 0], color)
      for (const x of [-length * .27, length * .22]) for (const z of [-width * .24, width * .24]) this.box(group, [5, 22, 5], [x, 6, z], 0x5b3523)
    } else if (entity.kind === 'human') {
      this.box(group, [width * .5, 22, width * .32], [0, 27, 0], color); this.sphere(group, width * .22, [0, 45, 0], 0xf2c7a5)
      for (const z of [-width * .2, width * .2]) this.box(group, [5, 22, 5], [0, 10, z], 0x334155)
      for (const z of [-width * .42, width * .42]) this.box(group, [5, 20, 5], [0, 28, z], color)
    } else if (entity.kind === 'sheep') {
      this.sphere(group, length * .34, [-length * .05, 24, 0], 0xf1f5f9, [1.25, .8, .72]); this.box(group, [length * .2, 15, width * .4], [length * .38, 27, 0], 0x3f3f46)
      for (const x of [-length * .22, length * .18]) for (const z of [-width * .2, width * .2]) this.box(group, [4, 18, 4], [x, 8, z], 0x3f3f46)
    } else if (entity.kind === 'tree') {
      this.cylinder(group, Math.max(4, width * .1), Math.max(25, width * .55), [0, width * .28, 0], 0x7c4a2d); this.sphere(group, width * .42, [0, width * .72, 0], color, [1, 1.2, 1])
    } else if (entity.kind === 'start' || entity.kind === 'finish') {
      const marker = entity.kind === 'finish' ? 0xffffff : 0x2563eb
      this.box(group, [4, 42, 4], [0, 21, -width / 2], marker); this.box(group, [4, 42, 4], [0, 21, width / 2], marker); this.box(group, [4, 4, width], [0, 42, 0], marker)
    } else this.box(group, [length, Math.max(10, width * .45), width], [0, Math.max(5, width * .225), 0], color)
    return group
  }

  render(project: Readonly<CreatiBoxProject>, player: Readonly<Entity>): FirstPersonStats {
    if (this.disposed) return { drawCalls: 0, triangles: 0, visibleEntities: 0, qualityTier: this.quality.tier }
    const frame = firstPersonCameraFrame(player); this.camera.position.set(frame.position.x, frame.position.y, frame.position.z); this.camera.lookAt(frame.target.x, frame.target.y, frame.target.z)
    this.camera.updateMatrixWorld()
    const frustum = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse))
    let visibleEntities = this.updateStaticEntities(project, player, frustum)
    for (const entity of project.world.entities) {
      if (isFirstPersonStaticKind(entity.kind)) continue
      const model = this.models.get(entity.id); if (!model) continue
      model.visible = entity.id !== player.id && isWithinFirstPersonRange(entity, player.position, this.quality.farDistance); if (!model.visible) continue
      visibleEntities += 1; model.position.set(entity.position.x, 0, entity.position.y); model.rotation.y = -entity.rotation
      model.traverse(object => { if (!(object instanceof THREE.Mesh)) return; object.material = this.material(object.userData.baseColor as number, entity.state) })
    }
    this.renderer.render(this.scene, this.camera)
    return { drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, visibleEntities, qualityTier: this.quality.tier }
  }

  private resize() { if (this.disposed) return; const width = Math.max(1, this.host.clientWidth), height = Math.max(1, this.host.clientHeight); this.camera.aspect = width / height; this.camera.updateProjectionMatrix(); this.renderer.setSize(width, height, false) }
  dispose() {
    if (this.disposed) return; this.disposed = true; this.resizeObserver.disconnect()
    const sharedGeometries = new Set(this.geometries.values())
    this.scene.traverse(object => { if (object instanceof THREE.Mesh && !sharedGeometries.has(object.geometry)) object.geometry.dispose() })
    for (const geometry of this.geometries.values()) geometry.dispose()
    for (const material of this.materials.values()) material.dispose()
    this.geometries.clear(); this.materials.clear()
    this.models.clear(); this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove()
  }
}
