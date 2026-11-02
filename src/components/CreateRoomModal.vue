<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        @click="$emit('close')"
      ></div>
      
  <!-- Modal -->
  <div class="relative bg-white rounded-2xl border border-slate-100 shadow-xl w-full max-w-sm p-5 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-extrabold text-slate-800">Crear nuevo chat</h3>
          <button
            @click="$emit('close')"
            class="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="createRoom" class="space-y-4">
          <!-- Chat Type -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Tipo de chat
            </label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                v-for="type in chatTypes"
                :key="type.value"
                @click="formData.type = type.value"
                :class="[
                  'p-3 rounded-xl border transition-all text-center',
                  formData.type === type.value
                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-white'
                ]"
              >
                <component :is="type.icon" class="w-5 h-5 mx-auto mb-1" />
                <span class="text-xs font-medium">{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- Chat Name -->
          <div>
            <label for="chatName" class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Nombre del chat
            </label>
            <input
              id="chatName"
              v-model="formData.name"
              type="text"
              required
              :placeholder="getNamePlaceholder()"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
            />
          </div>

          <!-- Description -->
          <div v-if="formData.type !== 'direct'">
            <label for="chatDescription" class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              id="chatDescription"
              v-model="formData.description"
              rows="3"
              placeholder="Describe el propósito de este chat..."
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all resize-none"
            ></textarea>
          </div>

          <!-- Participants -->
          <div>
            <label class="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              {{ formData.type === 'direct' ? 'Seleccionar usuario' : 'Seleccionar participantes' }}
            </label>
            
            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-4">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
            
            <!-- Users List -->
            <div v-else class="max-h-40 overflow-y-auto custom-scrollbar space-y-1 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <div
                v-for="user in users"
                :key="user._id"
                @click="toggleUser(user._id)"
                :class="[
                  'flex items-center p-2 rounded-lg cursor-pointer transition-colors',
                  selectedUsers.includes(user._id)
                    ? 'bg-white shadow-sm border border-primary-100'
                    : 'hover:bg-white'
                ]"
              >
                <div class="flex items-center flex-1">
                  <!-- Avatar -->
                  <div class="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center mr-3">
                    <span class="text-primary-700 text-xs font-black">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  
                  <!-- User Info -->
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-slate-800 truncate">{{ user.name }}</p>
                    <p class="text-xs text-slate-500 truncate">
                      {{ user.position || user.role }}
                    </p>
                  </div>
                </div>
                
                <!-- Checkbox -->
                <div
                  :class="[
                    'w-4 h-4 rounded border flex items-center justify-center',
                    selectedUsers.includes(user._id)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-slate-300 bg-white'
                  ]"
                >
                  <CheckIcon
                    v-if="selectedUsers.includes(user._id)"
                    class="w-3 h-3 text-white"
                  />
                </div>
              </div>
              
              <div v-if="users.length === 0" class="text-center text-xs text-slate-400 py-4">
                No hay usuarios disponibles
              </div>
            </div>
            
            <!-- Selected count -->
            <p v-if="selectedUsers.length > 0" class="text-xs text-slate-500 mt-2">
              {{ selectedUsers.length }} usuario{{ selectedUsers.length !== 1 ? 's' : '' }} seleccionado{{ selectedUsers.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="btn-secondary btn-sm flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="!canCreate"
              class="btn-primary btn-sm flex-1"
            >
              {{ creating ? 'Creando...' : 'Crear chat' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '../stores/chatStore'
import type { User } from '../services/chatService'
import {
  XMarkIcon,
  CheckIcon,
  UserIcon,
  UsersIcon,
  UserGroupIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  close: []
  created: [room: any]
}>()

const chatStore = useChatStore()

const loading = ref(false)
const creating = ref(false)
const users = ref<User[]>([])
const selectedUsers = ref<string[]>([])

const formData = ref({
  type: 'team' as 'team' | 'direct' | 'group',
  name: '',
  description: ''
})

const chatTypes = [
  {
    value: 'direct',
    label: 'Directo',
    icon: UserIcon
  },
  {
    value: 'team',
    label: 'Equipo',
    icon: UsersIcon
  },
  {
    value: 'group',
    label: 'Grupo',
    icon: UserGroupIcon
  }
]

const canCreate = computed(() => {
  if (!formData.value.name.trim()) return false
  if (formData.value.type === 'direct') return selectedUsers.value.length === 1
  return selectedUsers.value.length > 0
})

const getNamePlaceholder = () => {
  switch (formData.value.type) {
    case 'direct':
      return 'Se generará automáticamente'
    case 'team':
      return 'Ej: Desarrollo, Marketing, Ventas'
    case 'group':
      return 'Ej: Proyecto Alpha, Cliente XYZ'
    default:
      return 'Nombre del chat'
  }
}

const toggleUser = (userId: string) => {
  if (formData.value.type === 'direct') {
    // For direct chats, only allow one user
    selectedUsers.value = selectedUsers.value.includes(userId) ? [] : [userId]
  } else {
    // For team/group chats, allow multiple users
    const index = selectedUsers.value.indexOf(userId)
    if (index > -1) {
      selectedUsers.value.splice(index, 1)
    } else {
      selectedUsers.value.push(userId)
    }
  }
}

const createRoom = async () => {
  if (!canCreate.value) return

  creating.value = true

  try {
    let roomData: any = {
      participants: selectedUsers.value,
      type: formData.value.type
    }

    if (formData.value.type === 'direct') {
      // For direct chats, generate name from selected user
      const selectedUser = users.value.find(u => u._id === selectedUsers.value[0])
      roomData.name = selectedUser ? `Chat con ${selectedUser.name}` : 'Chat directo'
    } else {
      roomData.name = formData.value.name.trim()
      if (formData.value.description.trim()) {
        roomData.description = formData.value.description.trim()
      }
    }

    const room = await chatStore.createChatRoom(roomData)
    emit('created', room)
  } catch (error) {
    console.error('Error creating chat room:', error)
    // TODO: Show error message to user
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await chatStore.loadUsers()
    users.value = chatStore.users
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    loading.value = false
  }
})
</script>
