export interface RaycastHit {
  distance: number
  cellX: number
  cellY: number
  side: 'x' | 'y'
}

/** Restricted grid-corridor experiment. It is intentionally not a general World renderer. */
export function castGridRay(
  grid: readonly (readonly number[])[],
  origin: Readonly<{ x: number; y: number }>,
  angle: number,
  maxDistance = 64,
): RaycastHit | null {
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  let cellX = Math.floor(origin.x)
  let cellY = Math.floor(origin.y)
  const deltaX = Math.abs(1 / (dirX || Number.EPSILON))
  const deltaY = Math.abs(1 / (dirY || Number.EPSILON))
  const stepX = dirX < 0 ? -1 : 1
  const stepY = dirY < 0 ? -1 : 1
  let sideX = dirX < 0 ? (origin.x - cellX) * deltaX : (cellX + 1 - origin.x) * deltaX
  let sideY = dirY < 0 ? (origin.y - cellY) * deltaY : (cellY + 1 - origin.y) * deltaY

  while (Math.min(sideX, sideY) <= maxDistance) {
    let side: RaycastHit['side']
    let distance: number
    if (sideX < sideY) {
      cellX += stepX
      distance = sideX
      sideX += deltaX
      side = 'x'
    } else {
      cellY += stepY
      distance = sideY
      sideY += deltaY
      side = 'y'
    }
    if (grid[cellY]?.[cellX]) return { distance, cellX, cellY, side }
    if (!grid[cellY] || grid[cellY]?.[cellX] === undefined) return null
  }
  return null
}

export function castCorridorView(
  grid: readonly (readonly number[])[],
  origin: Readonly<{ x: number; y: number }>,
  heading: number,
  rayCount = 80,
  fieldOfView = Math.PI / 3,
) {
  return Array.from({ length: rayCount }, (_, index) => {
    const offset = rayCount === 1 ? 0 : index / (rayCount - 1) - 0.5
    const angle = heading + offset * fieldOfView
    const hit = castGridRay(grid, origin, angle)
    return hit ? { ...hit, correctedDistance: hit.distance * Math.cos(angle - heading) } : null
  })
}
