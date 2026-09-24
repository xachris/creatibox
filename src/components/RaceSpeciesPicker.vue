<script setup lang="ts">
import type { RaceSpecies } from '../model/types'
import { RACE_SPECIES } from '../model/race'
defineProps<{ modelValue: RaceSpecies; label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: RaceSpecies] }>()
const labels = { car: 'Car 赛车', horse: 'Horse 马', human: 'Human 人', sheep: 'Sheep 羊' }
</script>
<template>
  <div class="species-picker" role="group" :aria-label="label">
    <strong>{{ label }}</strong>
    <div class="preset-row four">
      <button v-for="kind in RACE_SPECIES" :key="kind" :class="{selected: modelValue === kind}" :aria-pressed="modelValue === kind" @click="emit('update:modelValue', kind)">{{ labels[kind] }}</button>
    </div>
  </div>
</template>
