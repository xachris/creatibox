/** Projects are JSON data. JSON cloning also unwraps nested Vue proxies. */
export function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
