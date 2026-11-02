<template>
  <div class="flex flex-col gap-4">
    <!-- Cabecera compacta -->
    <PageHeader icon="fas fa-user" title="Mi perfil" subtitle="Tu información personal y la seguridad de tu cuenta.">
      <button
        @click="toggleEditMode"
        class="btn-sm"
        :class="isEditing ? 'btn-secondary' : 'btn-primary'"
      >
        <i :class="isEditing ? 'fas fa-times' : 'fas fa-pen-nib'" class="text-[10px]"></i>
        {{ isEditing ? 'Cancelar' : 'Editar perfil' }}
      </button>
    </PageHeader>

    <!-- Identidad -->
    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <div class="flex flex-col sm:flex-row items-center gap-5">
        <!-- Profile Avatar -->
        <button
          type="button"
          @click="showPhotoEditor = true"
          class="relative group shrink-0 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-200"
          title="Cambiar foto de perfil"
        >
          <PersonAvatar
            :name="profileData?.name || 'U'"
            :photo="profileData.photo"
            title=""
            class="w-20 h-20 rounded-full bg-primary-100 text-primary-700 text-2xl font-black border-2 border-white shadow-sm"
          />
          <!-- Overlay al pasar el mouse -->
          <span class="absolute inset-0 rounded-full bg-slate-900/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
            <i class="fas fa-camera text-base"></i>
            <span class="text-[9px] font-black uppercase tracking-wider">Cambiar</span>
          </span>
          <!-- Botón cámara siempre visible -->
          <span class="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-500 text-white border-2 border-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <i class="fas fa-camera text-[10px]"></i>
          </span>
        </button>

        <!-- Basic Info -->
        <div class="text-center sm:text-left flex-1 min-w-0">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h2 class="text-lg font-black text-slate-800 tracking-tight leading-tight">{{ profileData?.name || 'Cargando...' }}</h2>
            <span class="inline-flex items-center w-fit mx-auto sm:mx-0 bg-primary-50 text-primary-600 border border-primary-100 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              {{ getRoleDisplayName(profileData?.role || '') }}
            </span>
          </div>
          <p class="text-xs text-slate-500 mb-3">{{ profileData?.email || '' }}</p>

          <div class="flex flex-wrap gap-2 justify-center sm:justify-start">
            <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <i class="fas fa-check-circle"></i>
              Activo
            </span>
            <span class="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              <i class="fas fa-calendar-alt"></i>
              Miembro desde {{ formatDate(profileData?.createdAt || '') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Personal Information (Left Column) -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 h-full">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-sm font-extrabold text-slate-800 flex items-center">
              <div class="w-8 h-8 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-id-card text-primary-600 text-xs"></i>
              </div>
              Información Personal
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <!-- Name -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Nombre Completo
              </label>
              <div v-if="isEditing" class="relative group">
                <i class="fas fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-primary-500 transition-colors"></i>
                <input
                  v-model="editForm.name"
                  type="text"
                  class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                  placeholder="Tu nombre completo"
                />
              </div>
              <div v-else class="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <p class="text-slate-700 font-bold text-sm">{{ profileData?.name || 'No especificado' }}</p>
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Correo Electrónico
              </label>
              <div v-if="isEditing" class="relative group">
                <i class="fas fa-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-primary-500 transition-colors"></i>
                <input
                  v-model="editForm.email"
                  type="email"
                  class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                  placeholder="tu@email.com"
                />
              </div>
              <div v-else class="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <p class="text-slate-700 font-bold text-sm">{{ profileData?.email || 'No especificado' }}</p>
              </div>
            </div>

            <!-- Phone -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Teléfono
              </label>
              <div v-if="isEditing" class="relative group">
                <i class="fas fa-phone absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-primary-500 transition-colors"></i>
                <input
                  v-model="editForm.phone"
                  type="tel"
                  class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div v-else class="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <p class="text-slate-700 font-bold text-sm">{{ profileData?.phone || 'No especificado' }}</p>
              </div>
            </div>

            <!-- Department -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Departamento
              </label>
              <div v-if="isEditing" class="relative group">
                <i class="fas fa-building absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-primary-500 transition-colors"></i>
                <input
                  v-model="editForm.department"
                  type="text"
                  class="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                  placeholder="Tu departamento"
                />
              </div>
              <div v-else class="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <p class="text-slate-700 font-bold text-sm">{{ profileData?.department || 'No especificado' }}</p>
              </div>
            </div>

            <!-- Metadata (Read Only) -->
            <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-1">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                  <i class="fas fa-calendar-plus"></i>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Registrado el</p>
                  <p class="text-slate-700 font-bold text-sm">{{ formatDate(profileData?.createdAt || '') }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                  <i class="fas fa-history"></i>
                </div>
                <div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Última actualización</p>
                  <p class="text-slate-700 font-bold text-sm">{{ formatDate(profileData?.updatedAt || '') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Edit Action Buttons -->
          <div v-if="isEditing" class="flex gap-2 mt-5 justify-end pt-4 border-t border-slate-100">
            <button
              @click="toggleEditMode"
              class="btn-ghost btn-sm"
            >
              Cancelar
            </button>
            <button
              @click="updateProfile"
              :disabled="loading"
              class="btn-primary btn-sm"
            >
              <i class="fas fa-save text-[10px]"></i>
              {{ loading ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Security / Password (Right Column) -->
      <div class="flex flex-col gap-4">
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 class="text-sm font-extrabold text-slate-800 mb-5 flex items-center">
            <div class="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-shield-alt text-amber-500 text-xs"></i>
            </div>
            Seguridad
          </h2>

          <form @submit.prevent="updatePassword" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Contraseña Actual
              </label>
              <input
                v-model="passwordForm.currentPassword"
                type="password"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Nueva Contraseña
              </label>
              <input
                v-model="passwordForm.newPassword"
                type="password"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                v-model="passwordForm.confirmPassword"
                type="password"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              :disabled="loading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword"
              class="btn-primary btn-sm w-full mt-2"
            >
              <i class="fas fa-key text-[10px]"></i>
              {{ loading ? 'Actualizando...' : 'Actualizar contraseña' }}
            </button>
          </form>
        </div>

        <!-- Help Box -->
        <div class="bg-primary-50 rounded-2xl p-4 border border-primary-100">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 text-xs">
              <i class="fas fa-lightbulb text-primary-500"></i>
            </div>
            <div>
              <h4 class="font-black text-primary-900 text-sm uppercase tracking-tight mb-1">Dato curioso</h4>
              <p class="text-primary-700/80 text-xs leading-relaxed font-medium">
                Tu avatar representa tu identidad en Customer Touch. Puedes cambiarlo en cualquier momento para reflejar tu enfoque de trabajo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProfilePhotoEditor
      v-if="showPhotoEditor"
      :current-photo="profileData.photo"
      @close="showPhotoEditor = false"
      @update="handlePhotoUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { userService } from '@/services/userService'
import { AvatarService } from '@/services/avatarService'
import { useNotifications } from '@/composables/useNotifications'
import AvatarSelector from '@/components/AvatarSelector.vue'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader.vue'
import ProfilePhotoEditor from '@/components/ProfilePhotoEditor.vue'
import PersonAvatar from '@/components/ui/PersonAvatar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { getAvatarById, getDefaultAvatar } from '@/utils/avatarConfig'
import { API_CONFIG } from '@/config/api'

const authStore = useAuthStore()
const { showSuccess, showError } = useNotifications()

// State
const loading = ref(false)
const isEditing = ref(false)
const showAvatarSelector = ref(false)
const showPhotoUploader = ref(false)
const showPhotoEditor = ref(false)
const tempSelectedAvatar = ref<string>('')
const photoErrored = ref(false)

const profileData = ref({
  name: '',
  email: '',
  role: '',
  phone: '',
  department: '',
  avatar: null as string | null,
  photo: null as string | null,
  createdAt: '',
  updatedAt: ''
})

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  department: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed
const selectedAvatarData = computed(() => {
  const avatarId = profileData.value?.avatar
  return avatarId ? getAvatarById(avatarId) : null
})

const resolvedPhotoUrl = computed(() => {
  const url = profileData.value.photo
  if (!url || photoErrored.value) return ''
  if (/^https?:\/\//i.test(url)) return url
  const origin = String(API_CONFIG.BASE_URL).replace(/\/?api\/?$/i, '')
  return `${origin.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
})

// Methods
const getInitials = (name: string) => {
  if (!name) return 'U'
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2)
}

const getRoleDisplayName = (role: string) => {
  const roles: { [key: string]: string } = {
    'admin': 'Administrador',
    'manager': 'Gerente',
    'user': 'Usuario',
    'employee': 'Empleado',
    'support': 'Soporte',
    'client': 'Cliente'
  }
  return roles[role] || role || 'Miembro'
}

const onPhotoError = () => {
  photoErrored.value = true
}

const togglePhotoUploader = () => {
  showPhotoUploader.value = !showPhotoUploader.value
  if (showPhotoUploader.value) showAvatarSelector.value = false
}

const handlePhotoUpdate = (data: { photo: string | null, avatar: string | null }) => {
  profileData.value.photo = data.photo
  profileData.value.avatar = data.avatar
  
  if (authStore.user) {
    authStore.user.photo = data.photo
    authStore.user.avatar = data.avatar
    localStorage.setItem('user', JSON.stringify(authStore.user))
  }
  
  showPhotoUploader.value = false
  photoErrored.value = false
  showSuccess('Foto actualizada correctamente')
}

const formatDate = (dateString: string) => {
  if (!dateString) return '...'
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return '---'
  }
}

const selectAvatar = (avatarId: string) => {
  tempSelectedAvatar.value = avatarId
}

const openAvatarSelector = () => {
  tempSelectedAvatar.value = profileData.value.avatar || getDefaultAvatar().id
  showAvatarSelector.value = true
}

const confirmAvatarSelection = async () => {
  if (!tempSelectedAvatar.value) return

  try {
    loading.value = true
    const result = await AvatarService.updateUserAvatar(tempSelectedAvatar.value)

    if (result.success) {
      profileData.value.avatar = tempSelectedAvatar.value
      profileData.value.photo = null

      if (authStore.user) {
        (authStore.user as any).avatar = tempSelectedAvatar.value
        (authStore.user as any).photo = null
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }

      showAvatarSelector.value = false
      tempSelectedAvatar.value = ''
      showSuccess('Avatar actualizado correctamente')
    } else {
      showError(result.message || 'Error al actualizar el avatar')
    }
  } catch (error) {
    showError('Error al actualizar el avatar')
  } finally {
    loading.value = false
  }
}

const toggleEditMode = () => {
  if (!profileData.value) return
  
  if (isEditing.value) {
    editForm.value = {
      name: profileData.value.name || '',
      email: profileData.value.email || '',
      phone: profileData.value.phone || '',
      department: profileData.value.department || ''
    }
  } else {
    editForm.value = {
      name: profileData.value.name || '',
      email: profileData.value.email || '',
      phone: profileData.value.phone || '',
      department: profileData.value.department || ''
    }
  }
  isEditing.value = !isEditing.value
}

const updateProfile = async () => {
  try {
    loading.value = true
    const result = await authStore.updateProfile(editForm.value)
    
    if (result.success) {
      Object.assign(profileData.value, editForm.value)
      isEditing.value = false
      showSuccess('Perfil actualizado correctamente')
    } else {
      showError(result.message || 'Error al actualizar el perfil')
    }
  } catch (error) {
    showError('Error al actualizar el perfil')
  } finally {
    loading.value = false
  }
}

const updatePassword = async () => {
  try {
    loading.value = true
    await userService.updatePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    showSuccess('Contraseña actualizada correctamente')
  } catch (error) {
    showError('Error al cambiar la contraseña')
  } finally {
    loading.value = false
  }
}

const loadProfile = async () => {
  try {
    loading.value = true
    
    if (authStore.user) {
      profileData.value = {
        name: authStore.user.name || '',
        email: authStore.user.email || '',
        role: authStore.user.role || '',
        phone: (authStore.user as any).phone || '',
        department: authStore.user.department || '',
        avatar: (authStore.user as any).avatar || null,
        photo: (authStore.user as any).photo || null,
        createdAt: (authStore.user as any).createdAt || '',
        updatedAt: (authStore.user as any).updatedAt || ''
      }
    }
    
    try {
      const profile = await userService.getProfile()
      profileData.value = {
        name: profile.name || '',
        email: profile.email || '',
        role: profile.role || '',
        phone: profile.phone || '',
        department: profile.department || '',
        avatar: profile.avatar || null,
        photo: profile.photo || null,
        createdAt: profile.createdAt || '',
        updatedAt: profile.updatedAt || ''
      }
      photoErrored.value = false
    } catch (serverError) {
      // Fallback already set from store
    }
    
    try {
      const avatarInfo = await AvatarService.getUserAvatar()
      if (avatarInfo) {
        profileData.value.avatar = avatarInfo.avatar
        profileData.value.photo = avatarInfo.photo
        if (authStore.user) {
          (authStore.user as any).avatar = avatarInfo.avatar
          (authStore.user as any).photo = avatarInfo.photo
          localStorage.setItem('user', JSON.stringify(authStore.user))
        }
      }
    } catch (avatarError) {
      // Silent fail
    }
    
  } catch (error) {
    showError('Error al cargar el perfil')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.animate__faster {
  --animate-duration: 0.3s;
}
</style>
