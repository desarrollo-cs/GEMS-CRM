<template>
  <router-link
    v-if="clientId"
    :to="to"
    :title="label"
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100 text-[10px] font-black uppercase tracking-wider hover:bg-primary-100 transition-colors max-w-full"
    @click.stop
  >
    <i class="fas fa-diagram-project text-[9px]"></i>
    <span class="truncate">{{ label }}</span>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LinkedClientRef } from '@/services/casesService'
import type { ClientData } from '@/services/clientService'

// Chip "Empresa · Proyecto" → /clients/:id[/projects/:pid]. Resuelve nombres desde
// la lista de clientes si se pasa; si no, desde el cliente_id populado por el backend.
const props = defineProps<{
  clienteId?: LinkedClientRef | null
  proyectoId?: string | null
  clients?: ClientData[]
}>()

const clientId = computed(() => (typeof props.clienteId === 'object' ? props.clienteId?._id : props.clienteId) || '')

const client = computed<any>(() =>
  props.clients?.find(c => c._id === clientId.value) || (typeof props.clienteId === 'object' ? props.clienteId : null)
)

const label = computed(() => {
  const name = client.value?.company || client.value?.name || 'Cliente'
  const project = props.proyectoId ? client.value?.projects?.find((p: any) => p._id === props.proyectoId)?.name : ''
  return project ? `${name} · ${project}` : name
})

const to = computed(() => props.proyectoId ? `/clients/${clientId.value}/projects/${props.proyectoId}` : `/clients/${clientId.value}`)
</script>
