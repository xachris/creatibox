import * as THREE from 'three'
import type { CreatiBoxProject, Entity } from '../model/types'
import { firstPersonCameraFrame, toThreeTransform } from '../experiments/firstPerson/threeMapping'

export interface FirstPersonStats {
  drawCalls: number
  triangles: number
}

/** Display-only Three.js adapter. WorldRuntime remains the only simulation owner. */
export class FirstPersonRenderer {
  readonly viewMode = 'first-person' as const
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly meshes = new Map<string, THREE.Mesh>()
  private readonly resizeObserver: ResizeObserver
  private disposed = false

  constructor(private readonly host: HTMLElement, project: Readonly<CreatiBoxProject>) {
    if (!globalThis.WebGLRenderingContext) throw new Error('当前浏览器不支持 WebGL。')
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0xbfd6ed)
    this.renderer.domElement.className = 'first-person-canvas'
    this.renderer.domElement.dataset.renderer = 'first-person'
    this.host.appendChild(this.renderer.domElement)

    this.scene.fog = new THREE.Fog(0xbfd6ed, 250, 1400)
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.5, 2200)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x405c34, 2.2))
    const sun = new THREE.DirectionalLight(0xffffff, 2.4)
    sun.position.set(200, 500, 100)
    this.scene.add(sun)
    this.buildStaticWorld(project)
    this.buildEntities(project.world.entities)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(this.host)
    this.resize()
  }

  private buildStaticWorld(project: Readonly<CreatiBoxProject>) {
    const bounds = project.world.worldBounds ?? { width: 1800, height: 1000 }
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds.width, bounds.height),
      new THREE.MeshLambertMaterial({ color: 0x6fa35a }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.set(bounds.width / 2, -0.08, bounds.height / 2)
    this.scene.add(ground)

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
      this.scene.add(road)
    }
  }

  private buildEntities(entities: readonly Entity[]) {
    for (const entity of entities) {
      if (['road', 'start', 'finish'].includes(entity.kind)) continue
      const transform = toThreeTransform(entity)
      const geometry = entity.kind === 'tree'
        ? new THREE.CylinderGeometry(entity.size.x * 0.18, entity.size.x * 0.28, transform.scale.y, 8)
        : new THREE.BoxGeometry(transform.scale.x, transform.scale.y, transform.scale.z)
      const material = new THREE.MeshLambertMaterial({ color: entity.color })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData.entityId = entity.id
      this.scene.add(mesh)
      this.meshes.set(entity.id, mesh)
    }
  }

  render(project: Readonly<CreatiBoxProject>, player: Readonly<Entity>): FirstPersonStats {
    if (this.disposed) return { drawCalls: 0, triangles: 0 }
    for (const entity of project.world.entities) {
      const mesh = this.meshes.get(entity.id)
      if (!mesh) continue
      const transform = toThreeTransform(entity)
      mesh.position.set(transform.position.x, transform.position.y, transform.position.z)
      mesh.rotation.y = transform.rotationY
      const material = mesh.material as THREE.MeshLambertMaterial
      material.opacity = entity.state === 'Broken' ? 0.48 : 1
      material.transparent = material.opacity < 1
      material.emissive.setHex(entity.state === 'Damaged' || entity.state === 'Broken' ? 0x451111 : 0x000000)
    }
    const frame = firstPersonCameraFrame(player)
    this.camera.position.set(frame.position.x, frame.position.y, frame.position.z)
    this.camera.lookAt(frame.target.x, frame.target.y, frame.target.z)
    this.renderer.render(this.scene, this.camera)
    return { drawCalls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles }
  }

  private resize() {
    if (this.disposed) return
    const width = Math.max(1, this.host.clientWidth)
    const height = Math.max(1, this.host.clientHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.resizeObserver.disconnect()
    this.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      for (const material of materials) material.dispose()
    })
    this.meshes.clear()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
  }
}
