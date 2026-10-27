<template>
  <!-- Salud de la organización (admin / gerencia): fila de indicadores con enlace a cada módulo. -->
  <div>
    <div class="flex items-center gap-2 mb-2">
      <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Salud de la organización</span>
      <span class="h-px flex-1 bg-slate-200/70"></span>
    </div>
    <div class="grid gap-2.5 motion-stagger" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
      <StatTile label="Clientes activos" :value="org.clients.active" icon="fa-users" tone="primary" :hint="`de ${org.clients.total}`" to="/clients" />
      <StatTile label="Proyectos activos" :value="org.projects.active" icon="fa-diagram-project" tone="violet" :hint="`de ${org.projects.total}`" to="/clients" />
      <StatTile label="Vencidas (todas)" :value="org.activities.overdue" icon="fa-triangle-exclamation" tone="danger" :hint="org.activities.overdue ? 'atender' : 'al día'" to="/activities" />
      <StatTile label="Cerradas 7 días" :value="org.activities.completedWeek" icon="fa-circle-check" tone="success" :hint="`${org.activities.active} activas`" to="/activities" />
      <StatTile label="Tickets abiertos" :value="org.tickets.open" icon="fa-ticket" tone="warning" to="/tickets" />
      <StatTile label="Autorizaciones" :value="org.approvals.pending" icon="fa-user-shield" tone="warning" :hint="org.approvals.pending ? 'pendientes' : 'sin pendientes'" to="/aprobaciones" />
    </div>
  </div>
</template>

<script setup lang="ts">
import StatTile from './StatTile.vue'
import type { DashboardSummary } from '@/services/dashboardService'

defineProps<{ org: NonNullable<DashboardSummary['org']> }>()
</script>
