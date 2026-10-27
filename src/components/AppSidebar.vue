<template>
  <!-- Fondo del drawer en móvil -->
  <transition name="fade">
    <div
      v-if="open && !isDesktop"
      class="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
      @click="emit('close')"
    ></div>
  </transition>

  <aside
    class="app-sidebar fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 lg:translate-x-0"
    :class="[
      !open && !isDesktop ? '-translate-x-full shadow-none' : 'translate-x-0',
      !isDesktop ? 'shadow-float' : '',
      mini ? 'is-mini w-[72px]' : 'w-[248px]'
    ]"
    :aria-hidden="!open && !isDesktop ? 'true' : undefined"
  >
    <!-- Botón colapsar (solo escritorio) -->
    <button
      type="button"
      :title="mini ? 'Expandir menú' : 'Contraer menú'"
      data-tooltip-placement="right"
      @click="emit('update:mini', !mini)"
      class="sidebar-collapse hidden lg:flex absolute -right-3 top-[26px] w-6 h-6 items-center justify-center rounded-full bg-white text-slate-400 border border-slate-200 shadow-sm z-[60] hover:text-primary-600 hover:border-primary-300"
    >
      <svg class="w-3 h-3 transition-transform duration-300 ease-out-expo" :class="mini ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>

    <!-- Cabecera: logo -->
    <div class="sidebar-brand relative flex items-center h-[76px] flex-shrink-0 overflow-hidden" :class="mini ? 'justify-center px-0' : 'px-4'">
      <router-link to="/" class="flex items-center justify-center rounded-lg outline-none" title="Ir al inicio" :data-tooltip-placement="mini ? 'right' : 'bottom'">
        <!-- Marca compacta (modo mini) -->
        <svg v-if="mini" class="w-9 h-9" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M34.5 13.2A15 15 0 1 0 34.5 34.8" fill="none" stroke="#52c2f0" stroke-width="7" stroke-linecap="round"/>
          <circle cx="24" cy="24" r="4.6" fill="#f7ae45"/>
        </svg>
        <img v-else :src="logoCT" alt="Customer CRM" class="h-24 w-auto object-contain -my-6 select-none" draggable="false" />
      </router-link>

      <!-- Cerrar (solo móvil) -->
      <button
        v-if="!isDesktop"
        type="button"
        class="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Cerrar menú"
        @click="emit('close')"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Navegación -->
    <nav class="sidebar-nav flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 pb-3 custom-scrollbar" aria-label="Módulos">
      <template v-for="section in sections" :key="section.id">
        <!-- Título de sección (en mini: línea separadora) -->
        <div class="sidebar-section-label" :class="{ 'is-mini': mini }" :aria-hidden="mini ? 'true' : undefined">
          <span class="sidebar-section-text">{{ section.label }}</span>
        </div>

        <ul class="space-y-0.5">
          <li v-for="module in section.items" :key="module.id">
            <router-link
              :to="module.path"
              class="nav-item"
              :class="{ 'is-active': isActive(module.path), 'is-mini': mini }"
              :title="mini ? module.name : ''"
              data-tooltip-placement="right"
              :aria-current="isActive(module.path) ? 'page' : undefined"
            >
              <span class="nav-indicator" aria-hidden="true"></span>
              <span class="nav-icon">
                <i :class="module.icon" aria-hidden="true"></i>
                <!-- Punto de aviso en modo mini -->
                <span v-if="mini && badgeFor(module) > 0" class="nav-dot"></span>
              </span>
              <span class="nav-text">{{ module.name }}</span>
              <span
                v-if="!mini && badgeFor(module) > 0"
                class="nav-badge"
                :class="{ 'is-active': isActive(module.path) }"
                :title="badgeTitle(module)"
              >{{ badgeFor(module) > 99 ? '99+' : badgeFor(module) }}</span>
            </router-link>
          </li>
        </ul>
      </template>
    </nav>

    <!-- Bloque de usuario -->
    <div class="sidebar-footer relative flex-shrink-0 border-t border-slate-100 bg-white p-3">
      <button
        ref="userBtn"
        type="button"
        class="user-card"
        :class="{ 'is-mini': mini, 'is-open': menuOpen }"
        :title="mini ? (user?.name || 'Usuario') : ''"
        data-tooltip-placement="right"
        aria-haspopup="menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        @click="menuOpen = !menuOpen"
      >
        <UserAvatar
          :name="user?.name || 'Usuario'"
          :avatar="user?.avatar"
          :photo="user?.photo || undefined"
          size="sm"
          class="flex-shrink-0 rounded-lg ring-1 ring-slate-200"
        />
        <span class="user-meta">
          <span class="user-name">{{ user?.name || 'Usuario' }}</span>
          <span class="user-role">{{ roleName }}</span>
        </span>
        <svg class="user-chevron" :class="{ 'rotate-180': menuOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
      </button>

      <!-- Menú de usuario -->
      <transition name="pop">
        <div
          v-if="menuOpen"
          ref="userMenu"
          role="menu"
          class="user-menu"
          :class="mini ? 'is-mini' : ''"
        >
          <div class="px-3 pt-2.5 pb-2 border-b border-slate-100">
            <p class="text-[13px] font-bold text-slate-800 truncate">{{ user?.name || 'Usuario' }}</p>
            <p class="text-[11px] text-slate-400 truncate">{{ user?.email || roleName }}</p>
          </div>
          <div class="p-1.5">
            <router-link to="/profile" role="menuitem" class="user-menu-item" @click="menuOpen = false">
              <i class="fas fa-user-circle w-4 text-center text-slate-400" aria-hidden="true"></i>
              <span>Mi perfil</span>
            </router-link>
            <button type="button" role="menuitem" class="user-menu-item is-danger" @click="onLogout">
              <i class="fas fa-power-off w-4 text-center" aria-hidden="true"></i>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import UserAvatar from './ui/UserAvatar.vue'
import logoCT from '@/assets/logo.png'

interface NavModule { id: string; name: string; icon: string; path: string }
interface NavUser { name?: string; email?: string; role?: string; avatar?: string; photo?: string | null }

const props = defineProps<{
  modules: NavModule[]
  user?: NavUser | null
  open: boolean
  mini: boolean
  isDesktop: boolean
  approvalsToReview?: number
}>()

const emit = defineEmits<{
  (e: 'update:mini', value: boolean): void
  (e: 'close'): void
  (e: 'logout'): void
}>()

const route = useRoute()

// Agrupación visual por secciones (solo presentación; el orden y los permisos
// siguen viniendo del store de auth).
const SECTIONS: { id: string; label: string; ids: string[] }[] = [
  { id: 'main', label: 'Principal', ids: ['dashboard', 'clients', 'prospects'] },
  { id: 'work', label: 'Trabajo', ids: ['activities', 'task-approvals', 'reports'] },
  { id: 'support', label: 'Soporte', ids: ['tickets', 'tickets-public', 'cases'] },
  { id: 'admin', label: 'Administración', ids: ['team'] },
]

const sections = computed(() => {
  const placed = new Set<string>()
  const result = SECTIONS.map(s => {
    const items = props.modules.filter(m => s.ids.includes(m.id))
    items.forEach(m => placed.add(m.id))
    return { id: s.id, label: s.label, items }
  })
  const rest = props.modules.filter(m => !placed.has(m.id))
  if (rest.length) result.push({ id: 'other', label: 'Más', items: rest })
  return result.filter(s => s.items.length > 0)
})

const isActive = (path: string) =>
  path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(path + '/')

const badgeFor = (m: NavModule) => (m.id === 'task-approvals' ? props.approvalsToReview || 0 : 0)
const badgeTitle = (m: NavModule) => (m.id === 'task-approvals' ? 'Solicitudes que requieren tu aprobación' : '')

const ROLE_NAMES: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
  support: 'Soporte Técnico',
  client: 'Cliente',
  viewer: 'Visualizador',
}
const roleName = computed(() => ROLE_NAMES[props.user?.role || ''] || props.user?.role || 'Usuario')

// Menú de usuario: se cierra al hacer clic fuera, con Escape o al navegar
const menuOpen = ref(false)
const userBtn = ref<HTMLElement | null>(null)
const userMenu = ref<HTMLElement | null>(null)

const onDocClick = (e: MouseEvent) => {
  if (!menuOpen.value) return
  const t = e.target as Node
  if (userBtn.value?.contains(t) || userMenu.value?.contains(t)) return
  menuOpen.value = false
}
const onKey = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return
  if (menuOpen.value) menuOpen.value = false
  else if (props.open && !props.isDesktop) emit('close')
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

const onLogout = () => {
  menuOpen.value = false
  emit('logout')
}

// Al navegar: cerrar el menú y, en móvil, el drawer
watch(() => route.fullPath, () => {
  menuOpen.value = false
  if (!props.isDesktop && props.open) emit('close')
})
watch(() => props.mini, () => { menuOpen.value = false })

// Drawer abierto en móvil: bloquear el scroll del fondo
watch(
  () => props.open && !props.isDesktop,
  (locked) => { document.body.style.overflow = locked ? 'hidden' : '' },
  { immediate: true }
)
</script>

<style scoped>
.app-sidebar {
  transition: width var(--dur-base) var(--ease-out-expo), transform var(--dur-base) var(--ease-out-expo), box-shadow var(--dur-base) var(--ease-smooth);
  will-change: width, transform;
}

/* Etiquetas de sección */
.sidebar-section-label {
  padding: 14px 10px 6px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  transition: padding var(--dur-base) var(--ease-out-expo);
}
.sidebar-section-label.is-mini {
  padding: 8px 10px;
}
.sidebar-section-label.is-mini .sidebar-section-text {
  display: block;
  height: 1px;
  background: #e2e8f0;
  color: transparent;
  overflow: hidden;
  font-size: 0;
}
.sidebar-nav > .sidebar-section-label:first-child { padding-top: 6px; }
.sidebar-nav > .sidebar-section-label.is-mini:first-child { padding-top: 4px; }

/* Ítems */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
  outline: none;
  transition: background-color var(--dur-fast) var(--ease-smooth), color var(--dur-fast) var(--ease-smooth), transform var(--dur-fast) var(--ease-smooth), padding var(--dur-base) var(--ease-out-expo);
}
.nav-item:hover { background: #f8fafc; color: #0f172a; transform: translateX(2px); }
.nav-item:active { transform: translateX(2px) scale(0.985); }
.nav-item.is-active { background: #e0f2fe; color: #0369a1; }
.nav-item.is-active:hover { background: #d6eefc; transform: none; }
.nav-item.is-mini { justify-content: center; padding: 0; gap: 0; }
.nav-item.is-mini:hover { transform: none; }
.nav-item:focus-visible { box-shadow: var(--ct-ring); }

/* Indicador lateral del activo */
.nav-indicator {
  position: absolute;
  left: -12px;
  top: 50%;
  width: 3px;
  height: 20px;
  border-radius: 0 3px 3px 0;
  background: var(--ct-accent);
  transform: translateY(-50%) scaleY(0);
  transition: transform var(--dur-base) var(--ease-spring);
}
.nav-item.is-active .nav-indicator { transform: translateY(-50%) scaleY(1); }

.nav-icon {
  position: relative;
  flex: none;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-size: 15px;
  color: #94a3b8;
  transition: color var(--dur-fast) var(--ease-smooth), transform var(--dur-base) var(--ease-spring);
}
.nav-item:hover .nav-icon { color: #0ea5e9; transform: scale(1.08); }
.nav-item.is-active .nav-icon { color: #0284c7; transform: none; }
.nav-dot {
  position: absolute;
  top: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f59e0b;
  box-shadow: 0 0 0 2px #fff;
}

.nav-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 1;
  transition: opacity var(--dur-fast) var(--ease-smooth);
}
.nav-item.is-mini .nav-text { display: none; }

.nav-badge {
  flex: none;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  background: #fef3c7;
  color: #b45309;
  transition: background-color var(--dur-fast) var(--ease-smooth), color var(--dur-fast) var(--ease-smooth);
}
.nav-badge.is-active { background: #fff; color: #0369a1; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08); }

/* Bloque de usuario */
.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px;
  border-radius: 12px;
  text-align: left;
  color: #0f172a;
  border: 1px solid transparent;
  transition: background-color var(--dur-fast) var(--ease-smooth), border-color var(--dur-fast) var(--ease-smooth);
}
.user-card:hover, .user-card.is-open { background: #f8fafc; border-color: #e2e8f0; }
.user-card.is-mini { justify-content: center; padding: 6px 0; }
.user-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; line-height: 1.25; }
.user-name { font-size: 13px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-chevron { flex: none; width: 14px; height: 14px; color: #94a3b8; transition: transform var(--dur-base) var(--ease-out-expo); }
.user-card.is-mini .user-meta, .user-card.is-mini .user-chevron { display: none; }

.user-menu {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: calc(100% - 4px);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: var(--ct-shadow-menu);
  overflow: hidden;
  z-index: 70;
}
.user-menu.is-mini {
  left: calc(100% + 8px);
  right: auto;
  bottom: 12px;
  width: 220px;
}
.user-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  text-align: left;
  transition: background-color var(--dur-fast) var(--ease-smooth), color var(--dur-fast) var(--ease-smooth);
}
.user-menu-item:hover { background: #f1f5f9; color: #0f172a; }
.user-menu-item.is-danger { color: #e11d48; }
.user-menu-item.is-danger:hover { background: #fff1f2; }
.user-menu-item.is-danger i { color: #fb7185; }

/* El menú del modo mini sale hacia el lado: no recortarlo */
.sidebar-footer { overflow: visible; }

/* Transición del pop (definida en motion.css) con origen abajo */
.pop-enter-active, .pop-leave-active { transform-origin: bottom left; }
</style>
