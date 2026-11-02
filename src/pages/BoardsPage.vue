<template>
  <div class="flex flex-col gap-4 h-full min-h-0">
    <!-- Header -->
    <PageHeader icon="fas fa-columns" title="Tableros" subtitle="Gestiona tus proyectos con tableros Kanban y Scrum">
      <button type="button" @click="openCreateModal" class="btn-primary btn-sm">
        <i class="fas fa-plus text-[10px]"></i>
        <span>Nuevo tablero</span>
      </button>
    </PageHeader>

    <!-- Loading -->
    <Skeleton v-if="loading" preset="cards" :rows="6" :cols="3" wrapper-class="opacity-40" />

    <!-- Boards Grid -->
    <div v-else-if="boards.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 motion-stagger">
      <div
        v-for="board in boards"
        :key="board._id"
        @click="openBoard(board._id)"
        class="board-card motion-lift bg-white border border-slate-200 rounded-2xl shadow-sm cursor-pointer p-5 hover:border-primary-200 hover:shadow-md transition-all"
      >
        <!-- Board Type Badge -->
        <div class="flex items-center justify-between mb-3">
          <span
            class="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border"
            :class="getBoardTypeClass(board.type)"
          >
            {{ getBoardTypeLabel(board.type) }}
          </span>
          <button title="Configurar tablero"
            type="button"
            @click.stop="openBoardSettings(board)"
            class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>

        <!-- Board Info -->
        <h3 class="text-sm font-extrabold text-slate-800 mb-1">{{ board.name }}</h3>
        <p class="text-xs text-slate-500 mb-4 line-clamp-2">{{ board.description || 'Sin descripción' }}</p>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2 mb-4 bg-slate-50 border border-slate-100 rounded-xl py-2.5 divide-x divide-slate-100">
          <div class="text-center">
            <div class="text-lg font-black text-slate-800 tabular-nums leading-none">{{ getTaskCount(board._id) }}</div>
            <div class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Tareas</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-black text-slate-800 tabular-nums leading-none">{{ board.members.length }}</div>
            <div class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Miembros</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-black text-slate-800 tabular-nums leading-none">{{ board.sprints?.length || 0 }}</div>
            <div class="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">Sprints</div>
          </div>
        </div>

        <!-- Members Avatars -->
        <div class="flex items-center gap-2">
          <div class="flex -space-x-2">
            <PersonAvatar v-for="member in board.members.slice(0, 5)"
              :key="member.user._id" :name="member.user.name" :photo="member.user.photo" class="w-8 h-8 rounded-full bg-primary-50 text-primary-700 border border-primary-100 text-xs font-bold border-2 border-white" />
            <div
              v-if="board.members.length > 5"
              class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border-2 border-white"
            >
              +{{ board.members.length - 5 }}
            </div>
          </div>

          <!-- GitHub Badge -->
          <div v-if="board.github" class="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-200">
            <i class="fab fa-github text-[10px]"></i>
            <span>Conectado</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__icon"><i class="fas fa-columns"></i></div>
      <p class="empty-state__title">No hay tableros</p>
      <p class="empty-state__text">Crea tu primer tablero para comenzar a gestionar tareas</p>
      <button type="button" @click="openCreateModal" class="btn-primary btn-sm mt-2">
        <i class="fas fa-plus text-[10px]"></i>
        Crear tablero
      </button>
    </div>

    <!-- Create Board Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" @click.self="showCreateModal = false">
      <div class="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg animate-fade-in">
        <div class="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 class="text-sm font-extrabold text-slate-800">Nuevo tablero</h2>
          <button title="Cerrar" type="button" @click="showCreateModal = false" class="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <form @submit.prevent="createBoard" class="p-5 space-y-4">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Nombre</label>
            <input
              v-model="newBoard.name"
              type="text"
              required
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
              placeholder="Mi Proyecto"
            />
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Descripción</label>
            <textarea
              v-model="newBoard.description"
              rows="3"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
              placeholder="Descripción del proyecto..."
            ></textarea>
          </div>

          <div>
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Tipo de Tablero</label>
            <div class="grid grid-cols-2 gap-3">
              <label
                class="relative flex items-center p-3 border rounded-xl cursor-pointer transition-colors"
                :class="newBoard.type === 'kanban' ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'"
              >
                <input
                  v-model="newBoard.type"
                  type="radio"
                  value="kanban"
                  class="sr-only"
                />
                <div class="flex-1">
                  <div class="text-sm font-extrabold text-slate-800">Kanban</div>
                  <div class="text-xs text-slate-500">Flujo continuo</div>
                </div>
              </label>

              <label
                class="relative flex items-center p-3 border rounded-xl cursor-pointer transition-colors"
                :class="newBoard.type === 'scrum' ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'"
              >
                <input
                  v-model="newBoard.type"
                  type="radio"
                  value="scrum"
                  class="sr-only"
                />
                <div class="flex-1">
                  <div class="text-sm font-extrabold text-slate-800">Scrum</div>
                  <div class="text-xs text-slate-500">Con sprints</div>
                </div>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="showCreateModal = false"
              class="btn-secondary btn-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!newBoard.name"
              class="btn-primary btn-sm"
            >
              Crear tablero
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardsStore } from '@/stores/boards'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const boardsStore = useBoardsStore()
const { showError } = useNotifications()

const showCreateModal = ref(false)
const newBoard = ref({
  name: '',
  description: '',
  type: 'kanban' as 'kanban' | 'scrum'
})

const boards = computed(() => boardsStore.myBoards)
const loading = computed(() => boardsStore.loading)

// Debug
function openCreateModal() {
  console.log('Opening create modal...')
  showCreateModal.value = true
  console.log('Modal state:', showCreateModal.value)
}

function getBoardTypeClass(type: string): string {
  const classes: Record<string, string> = {
    'kanban': 'bg-primary-50 text-primary-700 border-primary-100',
    'scrum': 'bg-amber-50 text-amber-700 border-amber-100',
    'custom': 'bg-slate-50 text-slate-600 border-slate-200'
  }
  return classes[type] || 'bg-slate-50 text-slate-600 border-slate-200'
}

function getBoardTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'kanban': 'Kanban',
    'scrum': 'Scrum',
    'custom': 'Personalizado'
  }
  return labels[type] || type
}

function getTaskCount(_boardId: string): number {
  // TODO: Implementar conteo real desde el store
  return 0
}

function openBoard(boardId: string): void {
  router.push(`/boards/${boardId}`)
}

function openBoardSettings(board: any): void {
  // TODO: Implementar modal de configuración
  console.log('Open board settings:', board)
}

async function createBoard(): Promise<void> {
  try {
    console.log('Creating board with data:', newBoard.value)
    const board = await boardsStore.createBoard(newBoard.value)
    console.log('Board created successfully:', board)
    showCreateModal.value = false
    newBoard.value = {
      name: '',
      description: '',
      type: 'kanban'
    }
    router.push(`/boards/${board._id}`)
  } catch (error: any) {
    console.error('Error creating board:', error)
    showError(`Error al crear tablero: ${error.response?.data?.message || error.message || 'Error desconocido'}`)
  }
}

onMounted(async () => {
  console.log('BoardsPage mounted, fetching boards...')
  try {
    await boardsStore.fetchBoards()
    console.log('Boards fetched:', boardsStore.boards)
    console.log('My boards:', boardsStore.myBoards)
  } catch (error) {
    console.error('Error fetching boards:', error)
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
