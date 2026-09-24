<script setup lang="ts">
import { raceAudio } from '../media/sound/audioDirector'

defineProps<{ hasRecentProject: boolean }>()

const emit = defineEmits<{
  racing: []
  continue: []
  import: []
}>()

function openRacing() {
  raceAudio.playUi('confirm')
  emit('racing')
}

function openContinue() {
  raceAudio.playUi('select')
  emit('continue')
}

function openImport() {
  raceAudio.playUi('select')
  emit('import')
}
</script>

<template>
  <section class="home-screen">
    <header class="home-header">
      <div class="home-brand">
        <span class="brand-mark large">C</span>
        <div>
          <strong>CreatiBox</strong>
          <span>Choose what you want to create and play.</span>
        </div>
      </div>
    </header>

    <main class="home-content">
      <div class="home-copy">
        <span class="home-eyebrow">CREATOR CATALOG</span>
        <h1>今天想创造什么？</h1>
        <p>先选一个世界。我们会给你准备好能玩的基础结构，你只需要做选择和修改。</p>
      </div>

      <div class="catalog-grid">
        <button class="catalog-card racing-card" @click="openRacing">
          <div class="catalog-art">
            <div class="road-preview" />
            <div class="car-preview red" />
            <div class="car-preview blue second" />
          </div>
          <div class="catalog-copy">
            <span class="catalog-status">AVAILABLE</span>
            <strong>Unified Race · 混合竞速</strong>
            <p>选择 Car、Horse、Human 或 Sheep，和混合对手直接开赛。</p>
            <span class="catalog-cta">开始创建 →</span>
          </div>
        </button>

        <div class="catalog-card disabled-card">
          <div class="coming-placeholder">＋</div>
          <div class="catalog-copy">
            <span class="catalog-status muted">LATER</span>
            <strong>更多世界</strong>
            <p>Story、Animals、Architecture 等会从这里继续扩展。</p>
          </div>
        </div>
      </div>

      <div class="home-secondary-actions">
        <button v-if="hasRecentProject" @click="openContinue">继续上次项目</button>
        <button @click="openImport">导入 .creatibox</button>
      </div>
    </main>
  </section>
</template>
