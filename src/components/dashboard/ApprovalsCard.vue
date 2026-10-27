<template>
  <!-- Autorizaciones: lo que me toca aprobar y lo que estoy esperando. -->
  <DashCard eyebrow="Autorizaciones" title="Plazos y eliminaciones" icon="fa-user-shield" icon-class="bg-amber-50 text-amber-600">
    <div class="grid gap-2" :class="approvals.canReview ? 'grid-cols-2' : 'grid-cols-1'">
      <router-link v-if="approvals.canReview" to="/aprobaciones" class="card-interactive rounded-xl border px-3 py-2.5 flex items-center gap-3"
        :class="approvals.toReview ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200'">
        <span class="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center relative shrink-0">
          <i class="fas fa-inbox text-[13px]"></i>
          <span v-if="approvals.toReview" class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse"></span>
        </span>
        <span class="min-w-0">
          <span class="block text-xl font-bold leading-none" :class="approvals.toReview ? 'text-amber-700' : 'text-slate-900'">{{ approvals.toReview }}</span>
          <span class="block text-[10.5px] font-semibold text-slate-500 mt-1 leading-tight">Por revisar</span>
        </span>
      </router-link>
      <router-link to="/aprobaciones" class="card-interactive rounded-xl border border-slate-200 px-3 py-2.5 flex items-center gap-3">
        <span class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
          <i class="fas fa-paper-plane text-[13px]"></i>
        </span>
        <span class="min-w-0">
          <span class="block text-xl font-bold text-slate-900 leading-none">{{ approvals.mine }}</span>
          <span class="block text-[10.5px] font-semibold text-slate-500 mt-1 leading-tight">{{ approvals.mine === 1 ? 'Mía en espera' : 'Mías en espera' }}</span>
        </span>
      </router-link>
    </div>
    <p class="text-[11.5px] text-slate-500 mt-3 leading-snug">
      <template v-if="approvals.canReview">La fecha pactada y las eliminaciones las resuelves tú para tu área.</template>
      <template v-else>La fecha pactada la cambia tu líder de área o un administrador.</template>
    </p>
  </DashCard>
</template>

<script setup lang="ts">
import DashCard from './DashCard.vue'
import type { DashboardSummary } from '@/services/dashboardService'

defineProps<{ approvals: DashboardSummary['approvals'] }>()
</script>
