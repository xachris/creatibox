// @vitest-environment jsdom
import { expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RacingLaunchFlow from './RacingLaunchFlow.vue'

vi.mock('../media/sound/audioDirector', () => ({
  raceAudio: { playUi: vi.fn() },
}))

it('skips the car driver step for independent animal and human participants', async () => {
  const wrapper = mount(RacingLaunchFlow)
  await wrapper.get('[aria-label="你的参赛者"]').get('button:nth-of-type(2)').trigger('click')
  await wrapper.get('.launch-footer .primary').trigger('click')
  expect(wrapper.text()).toContain('选赛道')
  expect(wrapper.text()).toContain('步骤 2 / 5')
  expect(wrapper.text()).not.toContain('选一个车手')
  await wrapper.get('.launch-footer button').trigger('click')
  expect(wrapper.text()).toContain('选参赛者')
})

it('keeps the driver step for cars and labels collision behavior in review', async () => {
  const wrapper = mount(RacingLaunchFlow)
  await wrapper.get('.launch-footer .primary').trigger('click')
  expect(wrapper.text()).toContain('选一个车手')
  for (let i = 0; i < 4; i++) await wrapper.get('.launch-footer .primary').trigger('click')
  expect(wrapper.text()).toContain('实体碰撞已开启')
  expect(wrapper.text()).toContain('Alex 驾驶')
})
