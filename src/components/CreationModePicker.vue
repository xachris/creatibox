<script setup lang="ts">
const emit = defineEmits<{
  close: []
  choose: [mode: 'default' | 'random' | 'guided']
}>()
</script>

<template>
  <div class="wizard-backdrop" @click.self="emit('close')">
    <section class="creation-mode-card">
      <header class="wizard-header">
        <div>
          <span class="wizard-kicker">创造赛车</span>
          <h2>你想怎样得到这辆车？</h2>
        </div>
        <button class="icon-button" @click="emit('close')">×</button>
      </header>

      <p class="creation-mode-intro">
        三种方式都可以继续修改。区别只是第一辆车从哪里开始。
      </p>

      <div class="creation-mode-grid">
        <button class="creation-mode-option" @click="emit('choose', 'default')">
          <span class="mode-symbol">●</span>
          <strong>默认模式</strong>
          <p>立即放入一辆基础款赛车。最快开始，再慢慢改。</p>
          <small>适合：我先要一辆车</small>
        </button>

        <button class="creation-mode-option" @click="emit('choose', 'random')">
          <span class="mode-symbol">✦</span>
          <strong>随机模式</strong>
          <p>在安全范围内随机生成颜色、速度、车身和轮子。</p>
          <small>适合：给我一点惊喜</small>
        </button>

        <button class="creation-mode-option" @click="emit('choose', 'guided')">
          <span class="mode-symbol">→</span>
          <strong>指南模式</strong>
          <p>一步一步决定名字、控制方式、速度、外形和轮子。</p>
          <small>适合：我想认真设计</small>
        </button>
      </div>
    </section>
  </div>
</template>
