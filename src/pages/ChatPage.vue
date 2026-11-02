<template>
  <div class="h-full min-h-0 flex flex-col">
    <div class="flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-[300px,1fr]">
      <!-- Sidebar (desktop) -->
      <aside class="hidden lg:flex flex-col min-h-0 bg-slate-50/70 border-r border-slate-200">
        <div class="px-4 py-3 border-b border-slate-200">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-extrabold text-slate-800">Conversaciones</h2>
            <div class="flex items-center gap-2">
              <div v-if="!chatStore.isConnected" class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-600"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Conectando…</div>
              <div v-else class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-600"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Conectado</div>
              <button @click="showCreateRoom = true" class="w-7 h-7 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-sm transition-colors shrink-0" title="Nuevo chat">
                <PlusIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar">
          <div v-if="chatStore.isLoading" class="py-2 opacity-60">
            <Skeleton preset="list" :rows="5" />
          </div>

          <div v-else-if="chatStore.chatRooms.length === 0" class="empty-state empty-state--sm">
            <div class="empty-state__icon"><i class="fas fa-comments"></i></div>
            <p class="empty-state__title">No hay conversaciones</p>
            <p class="empty-state__text">Crea la primera para empezar a chatear.</p>
            <button @click="showCreateRoom = true" class="btn-secondary btn-sm mt-1">Crear conversación</button>
          </div>

          <ul v-else class="space-y-1">
            <li v-for="room in chatStore.chatRooms" :key="room._id">
              <button
                @click="selectRoom(room)"
                class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border transition-all"
                :class="[
                  currentRoom?._id === room._id
                    ? 'bg-white shadow-sm border-primary-100'
                    : 'border-transparent hover:bg-white hover:shadow-sm'
                ]"
              >
                <div
                  class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                  :class="room.type === 'direct' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : room.type === 'team' ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-slate-100 border-slate-200 text-slate-600'"
                >
                  <UserIcon v-if="room.type === 'direct'" class="w-4 h-4" />
                  <UsersIcon v-else-if="room.type === 'team'" class="w-4 h-4" />
                  <UserGroupIcon v-else class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-bold text-slate-800 truncate">{{ room.name }}</p>
                    <span class="text-[10px] text-slate-400 shrink-0">{{ formatTime(room.lastActivity) }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-[11px] text-slate-500 whitespace-nowrap"><i class="fas fa-users text-[10px]"></i> {{ room.participants.length }} · <span :class="onlineCount(room) > 0 ? 'text-emerald-600' : 'text-slate-400'"><i class="fas fa-circle text-[6px]"></i> {{ onlineCount(room) }}</span></p>
                    <span v-if="getUnreadCount(room._id) > 0" class="bg-primary-600 text-white text-[10px] font-black rounded-full px-1.5 notification-pulse">{{ getUnreadCount(room._id) }}</span>
                  </div>
                </div>
                <button
                  v-if="authStore.isAdmin"
                  @click.stop="confirmDeleteRoom(room._id)"
                  class="ml-1 w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors shrink-0"
                  title="Eliminar chat"
                >
                  <TrashIcon class="w-4 h-4" />
                </button>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      <!-- Main panel -->
      <section class="flex flex-col min-h-0 min-w-0 bg-white">
        <!-- Room header or empty state header -->
        <div class="px-4 py-3 border-b border-slate-100">
          <div v-if="currentRoom" class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
                :class="currentRoom.type === 'direct' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : currentRoom.type === 'team' ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-slate-100 border-slate-200 text-slate-600'"
              >
                <UserIcon v-if="currentRoom.type === 'direct'" class="w-5 h-5" />
                <UsersIcon v-else-if="currentRoom.type === 'team'" class="w-5 h-5" />
                <UserGroupIcon v-else class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-extrabold text-slate-800 truncate">{{ currentRoom.name }}</h3>
                <div class="text-[11px] text-slate-500 flex items-center gap-2">
                  <span class="whitespace-nowrap"><i class="fas fa-users text-[10px]"></i> {{ currentRoom.participants.length }}</span>
                  <span class="whitespace-nowrap" :class="onlineCount(currentRoom) > 0 ? 'text-emerald-600' : 'text-slate-400'"><i class="fas fa-circle text-[6px]"></i> {{ onlineCount(currentRoom) }}</span>
                  <span v-if="typingUsers.length > 0" class="ml-2 text-primary-600 font-semibold truncate"><i class="fas fa-pen"></i> {{ typingUsers.join(', ') }} escribiendo…</span>
                </div>
              </div>
            </div>
            <button class="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0" @click="showRoomInfo = true" title="Información del chat">
              <InformationCircleIcon class="w-5 h-5" />
            </button>
          </div>
          <div v-else class="flex items-center justify-between">
            <div class="text-sm font-extrabold text-slate-800">Selecciona una conversación</div>
            <button class="lg:hidden w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors" @click="showRoomsMobile = true" title="Abrir conversaciones">
              <ChatBubbleLeftRightIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div
          class="relative flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar"
          ref="messagesContainer"
          @scroll="onMessagesScroll"
        >
          <div v-if="!currentRoom" class="h-full flex items-center justify-center">
            <div class="empty-state w-full max-w-md">
              <div class="empty-state__icon"><i class="fas fa-comments"></i></div>
              <p class="empty-state__title">Elige un chat para empezar</p>
              <p class="empty-state__text">Selecciona una conversación de la lista o crea una nueva.</p>
            </div>
          </div>

          <div v-else>
            <!-- Loading messages -->
            <div v-if="chatStore.isLoading" class="py-4 opacity-60"><Skeleton preset="chat" :rows="6" /></div>

            <!-- Empty state -->
            <div v-else-if="currentMessages.length === 0" class="h-full flex items-center justify-center motion-content-in">
              <div class="empty-state w-full max-w-md">
                <div class="empty-state__icon"><i class="fas fa-comment-dots"></i></div>
                <p class="empty-state__title">Sin mensajes aún</p>
                <p class="empty-state__text">Escribe el primero abajo.</p>
              </div>
            </div>

            <!-- Messages list -->
            <div v-else class="space-y-3">
              <div
                v-for="message in currentMessages"
                :key="message._id"
                class="flex"
                :class="isOwnMessage(message) ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[80%] px-4 py-2.5 text-sm"
                  :class="isOwnMessage(message) ? 'bg-primary-600 text-white rounded-2xl rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-2xl rounded-bl-md'"
                >
                  <div v-if="!isOwnMessage(message)" class="mb-0.5 text-[10px] font-bold text-slate-500">
                    {{ message.sender.name }}
                  </div>
                  <div class="whitespace-pre-wrap break-words">{{ message.content }}</div>
                  <div v-if="message.attachments && message.attachments.length" class="mt-2 space-y-1.5">
                    <a
                      v-for="a in message.attachments"
                      :key="a.filename"
                      :href="a.url"
                      target="_blank"
                      class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors"
                      :class="isOwnMessage(message) ? 'bg-primary-700/60 border-primary-500 text-white hover:bg-primary-700' : 'bg-white border-slate-200 text-slate-700 hover:border-primary-200'"
                    >
                      <DocumentIcon class="w-4 h-4 shrink-0" />
                      <span class="truncate">{{ a.originalname }}</span>
                      <span class="text-[10px] opacity-70 shrink-0">{{ formatFileSize(a.size) }}</span>
                    </a>
                  </div>
                  <div class="mt-1 flex items-center gap-2 text-[10px]" :class="isOwnMessage(message) ? 'text-primary-100' : 'text-slate-400'">
                    <span :title="formatFullDateTime(message.createdAt)"><i class="fas fa-clock"></i> {{ formatTimeShort(message.createdAt) }}</span>
                    <span v-if="message.edited" class="italic">· editado</span>
                    <button
                      v-if="isOwnMessage(message)"
                      @click="startEdit(message)"
                      class="ml-1 opacity-70 hover:opacity-100 p-0.5 rounded hover:bg-primary-700 transition-colors"
                      title="Editar"
                    >
                      <PencilIcon class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Typing indicator -->
              <div v-if="typingUsers.length > 0" class="text-xs font-semibold text-primary-600"><i class="fas fa-pen"></i> {{ typingUsers.join(', ') }} escribiendo…</div>

              <!-- Pending optimistic -->
              <div
                v-for="p in (pendingMessages[currentRoom._id] || [])"
                :key="p.id"
                class="flex justify-end"
              >
                <div class="max-w-[80%] px-4 py-2.5 text-sm bg-primary-500 text-white rounded-2xl rounded-br-md opacity-80">
                  <div class="whitespace-pre-wrap break-words">{{ p.content }}</div>
                  <div class="mt-1 text-[10px] text-primary-100"><i class="fas fa-clock"></i> {{ formatTimeShort(p.createdAt) }} · Enviando…</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Scroll edge overlays -->
          <div v-if="!atTop" class="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-white to-transparent"></div>
          <div v-if="!atBottom" class="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent"></div>

          <!-- Scroll to bottom -->
          <button
            v-if="!atBottom"
            @click="scrollToBottom"
            class="absolute bottom-4 right-4 btn-primary btn-sm !rounded-full shadow-md"
            title="Bajar al final"
          >
            <div class="flex items-center gap-2"><ArrowDownIcon class="w-4 h-4" /><span class="hidden sm:inline">Bajar</span></div>
          </button>
        </div>

        <!-- Input -->
        <div class="border-t border-slate-100 p-3">
          <div v-if="editingMessage" class="mb-2 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-amber-800">
            <div class="text-xs font-semibold"><i class="fas fa-pen"></i> Editando mensaje — Enter para guardar, Esc para cancelar</div>
            <button class="w-7 h-7 rounded-lg hover:bg-amber-100 flex items-center justify-center transition-colors" @click="cancelEdit" title="Cancelar">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>

          <div class="flex items-center gap-2">
            <!-- Emoji picker teleport -->
            <teleport to="body">
              <div
                v-if="showEmojiPicker"
                :style="{ position: 'fixed', top: emojiPos.top + 'px', left: emojiPos.left + 'px', zIndex: 50 }"
                class="rounded-xl border border-slate-200 bg-white p-2 shadow-xl flex flex-wrap gap-1 w-56"
                data-emoji-picker
              >
                <button v-for="e in emojis" :key="e" class="px-1 py-1 hover:bg-slate-100 rounded-md" @click.prevent="insertEmoji(e)">{{ e }}</button>
              </div>
            </teleport>

            <div class="relative flex-1">
              <input
                ref="messageInput"
                v-model="newMessage"
                @keydown.enter.prevent="editingMessage ? saveEdit() : sendMessage()"
                @keydown.escape.prevent="cancelEdit"
                @input="handleTyping"
                :placeholder="editingMessage ? 'Editar mensaje…' : 'Escribe un mensaje…'"
                class="w-full h-9 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary-400 focus:ring-[3px] focus:ring-primary-600/15 transition-all"
              />
            </div>
            <button @click="toggleEmojiPicker" class="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0" title="Emojis"><i class="fas fa-face-smile"></i></button>
            <button
              @click="editingMessage ? saveEdit() : sendMessage()"
              :disabled="!newMessage.trim()"
              class="btn-primary btn-sm !px-3 h-9 shrink-0"
            >
              <PaperAirplaneIcon v-if="!editingMessage" class="w-4 h-4" />
              <CheckIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Mobile drawer for rooms -->
    <div v-if="showRoomsMobile" class="fixed inset-0 z-50 lg:hidden">
      <div class="absolute inset-0 bg-slate-900/40" @click="showRoomsMobile = false"></div>
      <div class="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-white border-r border-slate-200 shadow-xl flex flex-col">
        <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 class="text-sm font-extrabold text-slate-800">Conversaciones</h2>
          <button class="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors" @click="showRoomsMobile = false" title="Cerrar">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar bg-slate-50/70">
          <ul class="space-y-1">
            <li v-for="room in chatStore.chatRooms" :key="room._id">
              <button
                @click="selectRoom(room); showRoomsMobile = false"
                class="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl border border-transparent hover:bg-white hover:shadow-sm transition-all"
              >
                <div
                  class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0"
                  :class="room.type === 'direct' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : room.type === 'team' ? 'bg-primary-50 border-primary-100 text-primary-600' : 'bg-slate-100 border-slate-200 text-slate-600'"
                >
                  <UserIcon v-if="room.type === 'direct'" class="w-4 h-4" />
                  <UsersIcon v-else-if="room.type === 'team'" class="w-4 h-4" />
                  <UserGroupIcon v-else class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-bold text-slate-800 truncate">{{ room.name }}</p>
                    <span class="text-[10px] text-slate-400 shrink-0">{{ formatTime(room.lastActivity) }}</span>
                  </div>
                  <p class="text-[11px] text-slate-500 truncate"><i class="fas fa-users text-[10px]"></i> {{ room.participants.length }} participante{{ room.participants.length !== 1 ? 's' : '' }}</p>
                </div>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Mobile FAB: create room -->
    <button
      class="lg:hidden fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-colors"
      title="Nuevo chat"
      @click="showCreateRoom = true"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
    <!-- Create Room Modal -->
    <CreateRoomModal v-if="showCreateRoom" @close="showCreateRoom = false" @created="handleRoomCreated" />

    <!-- Room Info Modal -->
    <div v-if="showRoomInfo && currentRoom" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/40" @click="showRoomInfo = false"></div>
      <div class="relative bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md mx-4">
        <div class="p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-extrabold text-slate-800">Información del chat</h3>
            <button @click="showRoomInfo = false" class="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"><XMarkIcon class="w-5 h-5" /></button>
          </div>
          <div class="space-y-4 text-sm">
            <div>
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Nombre</div>
              <div class="font-semibold text-slate-800">{{ currentRoom.name }}</div>
            </div>
            <div v-if="currentRoom.description">
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Descripción</div>
              <div class="text-slate-700">{{ currentRoom.description }}</div>
            </div>
            <div>
              <div class="text-[10px] font-black uppercase tracking-wider text-slate-400">Participantes ({{ currentRoom.participants.length }})</div>
              <div class="mt-2 space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                <div v-for="p in currentRoom.participants" :key="p._id" class="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                  <div class="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                    <span class="text-xs font-bold">{{ p.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="min-w-0">
                    <div class="font-semibold text-slate-800 truncate">{{ p.name }}</div>
                    <div class="text-[11px] text-slate-500 truncate">{{ p.position || p.role }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-[11px] text-slate-400">Creado: {{ new Date(currentRoom.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/auth';
import CreateRoomModal from '@/components/CreateRoomModal.vue';
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleLeftEllipsisIcon,
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  InformationCircleIcon,
  DocumentIcon,
  PencilIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckIcon,
  TrashIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline';
import type { ChatRoom, Message } from '@/services/chatService';
import { useNotifications } from '@/composables/useNotifications';

const chatStore = useChatStore();
const authStore = useAuthStore();
const { showError, confirmDelete } = useNotifications();

// State
const currentRoom = ref<ChatRoom | null>(null);
const newMessage = ref('');
const showCreateRoom = ref(false);
const showRoomInfo = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const messageInput = ref<HTMLElement | null>(null);
const editingMessage = ref<Message | null>(null);
const typingUsers = ref<string[]>([]);
const typingTimeout = ref<NodeJS.Timeout | null>(null);
const showEmojiPicker = ref(false);
const emojiPos = ref({ top: 0, left: 0 });
const emojis = ['😀','😂','😍','👍','🔥','✅','🙏','🚀','🎉','💡','❤️','😎','🤔','🙌','✨','🤝','📌','📣','🧠'];
const showRoomsMobile = ref(false);
// Optimistic pending messages per room
const pendingMessages = ref<Record<string, { id: string; content: string; createdAt: string }[]>>({});
// Track first-entry auto-scroll per room
const didInitialScroll = ref<Record<string, boolean>>({});
// Scroll position state
const atBottom = ref(true)
const atTop = ref(true)

// Lightweight send sound using Web Audio API
const playSendSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 660; // high beep
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    o.start(now);
    // quick decay
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    o.stop(now + 0.16);
  } catch {}
};

// Computed
const currentMessages = computed(() => {
  if (!currentRoom.value) return [];
  return chatStore.messages[currentRoom.value._id] || [];
});

// Methods
const selectRoom = async (room: ChatRoom) => {
  if (currentRoom.value?._id === room._id) return;

  currentRoom.value = room;
  // Update store's currentRoom and join socket room
  await chatStore.selectRoom(room);
  // Ensure messages are loaded (store.selectRoom already loads if needed)
  await chatStore.loadMessages(room._id);
  // One-time auto-scroll when entering a room first time in session
  if (!didInitialScroll.value[room._id]) {
    didInitialScroll.value[room._id] = true;
    scrollToBottom();
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentRoom.value) return;

  const content = newMessage.value.trim();
  const roomId = currentRoom.value._id;
  const tempId = `temp_${Date.now()}`;
  const createdAt = new Date().toISOString();
  newMessage.value = '';

  // Add optimistic pending bubble
  if (!pendingMessages.value[roomId]) pendingMessages.value[roomId] = [];
  pendingMessages.value[roomId].push({ id: tempId, content, createdAt });
  playSendSound();
  scrollToBottom();

  try {
    await chatStore.sendMessage(content);
  } catch (error) {
    console.error('Error sending message:', error);
    // Restore message on error
    newMessage.value = content;
  } finally {
    // Remove pending bubble
    const list = pendingMessages.value[roomId] || [];
    pendingMessages.value[roomId] = list.filter(m => m.id !== tempId);
    scrollToBottom();
  }
};

const startEdit = (message: Message) => {
  editingMessage.value = message;
  newMessage.value = message.content;
  nextTick(() => {
    if (messageInput.value) {
      (messageInput.value as HTMLInputElement).focus();
    }
  });
};

const saveEdit = async () => {
  if (!editingMessage.value || !newMessage.value.trim()) return;

  const id = editingMessage.value._id;
  const content = newMessage.value.trim();

  // Optimistic update: update local list immediately
  const roomId = currentRoom.value?._id;
  let previous: Message | null = null;
  if (roomId) {
    const list = chatStore.messages[roomId] || [];
    const idx = list.findIndex(m => m._id === id);
    if (idx !== -1) {
      previous = { ...list[idx] } as Message;
      list[idx] = { ...list[idx], content, edited: true, editedAt: new Date().toISOString() } as Message;
    }
  }

  try {
    await chatStore.editMessage(id, content);
    cancelEdit();
  } catch (error) {
    console.error('Error editing message:', error);
    // Rollback if failed
    if (roomId && previous) {
      const list = chatStore.messages[roomId] || [];
      const idx = list.findIndex(m => m._id === id);
      if (idx !== -1) list[idx] = previous;
    }
  }
};

const cancelEdit = () => {
  editingMessage.value = null;
  newMessage.value = '';
};

const handleTyping = () => {
  if (!currentRoom.value) return;

  chatStore.startTyping();

  // Clear previous timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }

  // Stop typing after 3 seconds of inactivity
  typingTimeout.value = setTimeout(() => {
    if (currentRoom.value) {
      chatStore.stopTyping();
    }
  }, 3000);
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      atBottom.value = true
      atTop.value = false
    }
  });
};

const onMessagesScroll = () => {
  const el = messagesContainer.value
  if (!el) return
  const threshold = 8
  atTop.value = el.scrollTop <= threshold
  atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
}

const handleRoomCreated = (room: ChatRoom) => {
  showCreateRoom.value = false;
  selectRoom(room);
};

const computeEmojiPosition = () => {
  const input = messageInput.value as HTMLInputElement | null;
  if (!input) return;
  const rect = input.getBoundingClientRect();
  const panelHeight = 220; // approx
  const topAbove = rect.top - panelHeight - 8;
  const topBelow = rect.bottom + 8;
  const viewportHeight = window.innerHeight;
  const placeAbove = topAbove >= 0;
  const top = placeAbove ? topAbove : Math.min(topBelow, viewportHeight - panelHeight - 8);
  let left = rect.left; // align left to input
  const viewportWidth = window.innerWidth;
  const panelWidth = 224; // ~w-56
  if (left + panelWidth > viewportWidth - 8) {
    left = Math.max(8, viewportWidth - panelWidth - 8);
  }
  emojiPos.value = { top, left };
};

const onGlobalClick = (ev: MouseEvent) => {
  if (!showEmojiPicker.value) return;
  const inputEl = messageInput.value as HTMLInputElement | null;
  const target = ev.target as Node;
  // Close picker if clicking outside the input or the picker
  const pickerEl = document.elementFromPoint(emojiPos.value.left, emojiPos.value.top);
  const clickedInsideInput = !!inputEl && inputEl.contains(target as Node);
  const pickerContainer = document.querySelector('[data-emoji-picker]');
  const clickedInsidePicker = !!pickerContainer && pickerContainer.contains(target as Node);
  if (!clickedInsideInput && !clickedInsidePicker) {
    showEmojiPicker.value = false;
  }
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
  if (showEmojiPicker.value) {
    nextTick(() => {
      computeEmojiPosition();
      window.addEventListener('resize', computeEmojiPosition);
      window.addEventListener('scroll', computeEmojiPosition, true);
      document.addEventListener('mousedown', onGlobalClick);
      messageInput.value?.focus();
    });
  } else {
    window.removeEventListener('resize', computeEmojiPosition);
    window.removeEventListener('scroll', computeEmojiPosition, true);
    document.removeEventListener('mousedown', onGlobalClick);
  }
};

const insertEmoji = (emoji: string) => {
  const input = messageInput.value as HTMLInputElement | null;
  if (!input) {
    newMessage.value += emoji;
    return;
  }
  const start = (input.selectionStart ?? newMessage.value.length);
  const end = (input.selectionEnd ?? newMessage.value.length);
  const text = newMessage.value;
  newMessage.value = text.slice(0, start) + emoji + text.slice(end);
  nextTick(() => {
    const caret = start + emoji.length;
    input.setSelectionRange(caret, caret);
    input.focus();
  });
};

const confirmDeleteRoom = async (roomId: string) => {
  const result = await confirmDelete('¿Eliminar este chat? Esta acción no se puede deshacer.');
  if (!result.isConfirmed) return;
  try {
    await chatStore.deleteChatRoom(roomId);
  } catch (e) {
    console.error('Error deleting room', e);
    showError('No se pudo eliminar el chat.');
  }
};

const isOwnMessage = (message: Message) => {
  return message.sender._id === authStore.user?._id;
};

const getUnreadCount = (roomId: string) => {
  return chatStore.unreadByRoom[roomId] || 0
};

const onlineCount = (room: ChatRoom | null) => {
  if (!room) return 0
  const online = chatStore.onlineUsers || []
  return room.participants.filter(p => online.includes(p._id)).length
}

const formatTime = (date: string | Date) => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'ahora';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return messageDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};

const formatTimeShort = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

const formatFullDateTime = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Watchers
watch(
  () => chatStore.typingUsers,
  (newTypingUsers) => {
    if (currentRoom.value) {
      typingUsers.value = chatStore.getTypingInRoom(currentRoom.value._id);
    }
  },
  { deep: true }
);

watch(currentRoom, () => {
  if (currentRoom.value) {
    typingUsers.value = chatStore.getTypingInRoom(currentRoom.value._id);
  }
});

// Keep pinned to bottom when messages of current room change
watch(
  () => chatStore.messages[currentRoom.value?._id || ''],
  () => {
    if (!currentRoom.value) return;
    // Only auto-scroll if user is already near the bottom
    const el = messagesContainer.value;
    if (!el) return;
    const threshold = 24;
    const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    if (isNearBottom) scrollToBottom();
  },
  { deep: true }
)

// Lifecycle
onMounted(async () => {
  if (!chatStore.isConnected) {
    await chatStore.initializeChat();
  }
  if (chatStore.chatRooms.length === 0) {
    await chatStore.loadChatRooms();
  }
  // Auto-select first room if available
  if (chatStore.chatRooms.length > 0 && !currentRoom.value) {
    await selectRoom(chatStore.chatRooms[0]);
  }
  onMessagesScroll()
});

onUnmounted(() => {
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
  window.removeEventListener('resize', computeEmojiPosition);
  window.removeEventListener('scroll', computeEmojiPosition, true);
  document.removeEventListener('mousedown', onGlobalClick);
});
</script>



<style scoped>
/* Notification dot animation */
@keyframes notificationPulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.notification-pulse {
  animation: notificationPulse 2s ease-in-out infinite;
}
</style>
