<template>
  <div class="h-full min-h-0 bg-white text-slate-900 flex overflow-hidden">

    <!-- Panel lateral: Workspace -->
    <aside class="w-64 md:w-72 bg-slate-50/70 border-r border-slate-200 flex flex-col h-full min-h-0 shrink-0">
      <!-- Cabecera del panel -->
      <div class="px-3 pt-3 pb-2 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-lg bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center shrink-0">
            <i class="fas fa-layer-group text-[11px]"></i>
          </div>
          <span class="text-sm font-extrabold text-slate-800 truncate">Workspace</span>
        </div>
        <button
          type="button"
          :title="viewMode === 'cases' ? 'Nuevo caso' : 'Nuevo artículo'"
          @click="openCreateModal"
          class="w-7 h-7 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shadow-sm transition-colors shrink-0"
        >
          <i class="fas fa-plus text-[10px]"></i>
        </button>
      </div>

      <!-- Pestañas Casos / Wiki -->
      <div class="px-3 pb-2">
        <div class="seg w-full">
          <button type="button" class="flex-1 flex items-center justify-center gap-1.5" @click="viewMode = 'cases'" :aria-pressed="viewMode === 'cases'">
            <i class="fas fa-folder text-[10px]"></i> Casos
            <span class="badge badge-slate">{{ cases.length }}</span>
          </button>
          <button type="button" class="flex-1 flex items-center justify-center gap-1.5" @click="viewMode = 'wiki'" :aria-pressed="viewMode === 'wiki'">
            <i class="fas fa-book text-[10px]"></i> Wiki
            <span class="badge badge-slate">{{ wikiArticles.length }}</span>
          </button>
        </div>
      </div>

      <!-- Buscador + Árbol / Tabla -->
      <div class="px-3 pb-2 flex items-center gap-1.5">
        <div class="relative flex-1 min-w-0">
          <i class="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
          <input
            v-model="searchTerm"
            type="search"
            :placeholder="viewMode === 'cases' ? 'Buscar caso' : 'Buscar artículo'"
            class="w-full h-8 pl-7 pr-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 transition-colors"
          />
        </div>
        <div class="seg shrink-0" role="group" aria-label="Modo de lista">
          <button type="button" title="Ver como árbol" class="!px-2" @click="listDisplayMode = 'tree'" :aria-pressed="listDisplayMode === 'tree'">
            <i class="fas fa-sitemap text-[10px]"></i>
          </button>
          <button type="button" title="Ver como tabla" class="!px-2" @click="listDisplayMode = 'grid'" :aria-pressed="listDisplayMode === 'grid'">
            <i class="fas fa-table text-[10px]"></i>
          </button>
        </div>
      </div>

      <!-- Árbol -->
      <nav class="flex-1 overflow-y-auto px-2 py-1 custom-scrollbar">
        <div v-if="listLoading" class="px-1 py-2">
          <Skeleton preset="list" :rows="6" />
        </div>

        <template v-else-if="viewMode === 'cases'">
          <div v-if="Object.keys(groupedCases).length === 0" class="empty-state empty-state--sm">
            <div class="empty-state__icon"><i class="fas fa-folder-open"></i></div>
            <p class="empty-state__title">{{ searchTerm ? 'Sin coincidencias' : 'Aún no hay casos' }}</p>
            <p class="empty-state__text">{{ searchTerm ? 'Prueba con otro término.' : 'Crea el primero con el botón +.' }}</p>
          </div>
          <div v-for="(group, clientName) in groupedCases" :key="clientName" class="mb-1">
            <button
              type="button"
              @click="toggleGroup(clientName)"
              :title="String(clientName)"
              class="w-full flex items-center gap-1.5 px-2 h-8 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <i :class="expandedGroups.includes(clientName) ? 'fa-chevron-down' : 'fa-chevron-right'" class="fas text-[8px] w-3 text-slate-400"></i>
              <i class="fas fa-building text-[10px] text-slate-400"></i>
              <span class="truncate">{{ clientName }}</span>
              <span class="ml-auto badge badge-slate">{{ group.length }}</span>
            </button>
            <transition name="expand">
              <div v-if="expandedGroups.includes(clientName)" class="ml-[13px] pl-2 border-l border-slate-200 space-y-px py-0.5">
                <button
                  v-for="c in group" :key="c._id"
                  type="button"
                  @click="selectCase(c)"
                  :title="c.titulo"
                  class="group relative w-full text-left pl-2.5 pr-2 h-8 rounded-lg text-xs transition-colors flex items-center gap-2"
                  :class="selectedCase?._id === c._id && listDisplayMode === 'tree'
                    ? 'bg-primary-50 text-primary-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'"
                >
                  <span
                    class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary-500 transition-opacity"
                    :class="selectedCase?._id === c._id && listDisplayMode === 'tree' ? 'opacity-100' : 'opacity-0'"
                  ></span>
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="getStatusDot(c.estado)" :title="c.estado?.replace('_', ' ')"></span>
                  <span class="truncate flex-1">{{ c.titulo }}</span>
                  <i class="fas fa-chevron-right text-[8px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </button>
              </div>
            </transition>
          </div>
        </template>

        <template v-else>
          <div v-if="Object.keys(groupedWiki).length === 0" class="empty-state empty-state--sm">
            <div class="empty-state__icon"><i class="fas fa-book"></i></div>
            <p class="empty-state__title">{{ searchTerm ? 'Sin coincidencias' : 'Aún no hay artículos' }}</p>
            <p class="empty-state__text">{{ searchTerm ? 'Prueba con otro término.' : 'Documenta un proceso con el botón +.' }}</p>
          </div>
          <div v-for="(group, cat) in groupedWiki" :key="cat" class="mb-1">
            <button
              type="button"
              @click="toggleGroup(cat)"
              class="w-full flex items-center gap-1.5 px-2 h-8 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <i :class="expandedGroups.includes(cat) ? 'fa-chevron-down' : 'fa-chevron-right'" class="fas text-[8px] w-3 text-slate-400"></i>
              <i :class="getWikiIcon(cat)" class="text-[10px] text-slate-400"></i>
              <span class="capitalize truncate">{{ cat }}</span>
              <span class="ml-auto badge badge-slate">{{ group.length }}</span>
            </button>
            <transition name="expand">
              <div v-if="expandedGroups.includes(cat)" class="ml-[13px] pl-2 border-l border-slate-200 space-y-px py-0.5">
                <button
                  v-for="w in group" :key="w._id"
                  type="button"
                  @click="selectedWiki = w"
                  :title="w.titulo"
                  class="group relative w-full text-left pl-2.5 pr-2 h-8 rounded-lg text-xs transition-colors flex items-center gap-2"
                  :class="selectedWiki?._id === w._id && listDisplayMode === 'tree'
                    ? 'bg-primary-50 text-primary-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-800'"
                >
                  <span
                    class="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary-500 transition-opacity"
                    :class="selectedWiki?._id === w._id && listDisplayMode === 'tree' ? 'opacity-100' : 'opacity-0'"
                  ></span>
                  <i class="far fa-file-alt text-[10px] text-slate-400 shrink-0"></i>
                  <span class="truncate flex-1">{{ w.titulo }}</span>
                  <i class="fas fa-chevron-right text-[8px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </button>
              </div>
            </transition>
          </div>
        </template>
      </nav>
    </aside>

    <!-- Contenido principal -->
    <main class="flex-1 min-w-0 overflow-y-auto relative bg-white custom-scrollbar">

      <!-- Vista de tabla -->
      <div v-if="listDisplayMode === 'grid'" class="max-w-6xl mx-auto px-4 md:px-8 py-6 motion-page">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-base font-black text-slate-800 tracking-tight">{{ viewMode === 'cases' ? 'Todos los casos' : 'Todos los artículos' }}</h2>
            <p class="text-xs text-slate-500">{{ viewMode === 'cases' ? casesGridRows.length : wikiGridRows.length }} resultados</p>
          </div>
          <div class="flex flex-wrap items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-sm">
            <template v-if="viewMode === 'cases'">
              <div class="w-40">
                <CustomSelect v-model="gridFilterEstado" size="sm" placeholder="Todos los estados" :options="[{ value: null, label: 'Todos los estados' }, { value: 'abierto', label: 'Abierto' }, { value: 'en_progreso', label: 'En progreso' }, { value: 'resuelto', label: 'Resuelto' }, { value: 'cerrado', label: 'Cerrado' }]" />
              </div>
              <div class="w-44">
                <CustomSelect v-model="gridFilterPrioridad" size="sm" placeholder="Todas las prioridades" :options="[{ value: null, label: 'Todas las prioridades' }, { value: 'baja', label: 'Baja' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }, { value: 'critica', label: 'Crítica' }]" />
              </div>
            </template>
            <div v-else class="w-44">
              <CustomSelect v-model="gridFilterCategoria" size="sm" placeholder="Todas las categorías" :options="[{ value: null, label: 'Todas las categorías' }, { value: 'proceso', label: 'Proceso' }, { value: 'codigo', label: 'Código' }, { value: 'manual', label: 'Manual' }, { value: 'otros', label: 'Otros' }]" />
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <DataGridTable
            v-if="viewMode === 'cases'"
            :columns="casesGridColumns"
            :items="casesGridRows"
            :row-key="(c: Case) => c._id!"
            :sort-key="casesSortKey"
            :sort-dir="casesSortDir"
            @sort="toggleCasesSort"
            @row-click="selectCaseFromGrid"
          >
            <template #cell-titulo="{ item }"><span class="font-bold text-slate-800">{{ item.titulo }}</span></template>
            <template #cell-estado="{ item }">
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" :class="getStatusDot(item.estado)"></span><span class="capitalize text-xs font-medium">{{ item.estado?.replace('_', ' ') }}</span></span>
            </template>
            <template #cell-prioridad="{ item }"><span class="badge capitalize" :class="getPriorityClass(item.prioridad)">{{ item.prioridad }}</span></template>
            <template #cell-cliente="{ item }"><span class="text-xs text-slate-600">{{ getClientName(item.cliente_id) }}</span></template>
            <template #cell-updatedAt="{ item }"><span class="text-xs text-slate-400">{{ formatDateRelative(item.updatedAt) }}</span></template>
            <template #empty>No hay casos que coincidan con los filtros.</template>
          </DataGridTable>

          <DataGridTable
            v-else
            :columns="wikiGridColumns"
            :items="wikiGridRows"
            :row-key="(w: WikiArticle) => w._id!"
            :sort-key="wikiSortKey"
            :sort-dir="wikiSortDir"
            @sort="toggleWikiSort"
            @row-click="selectWikiFromGrid"
          >
            <template #cell-titulo="{ item }"><span class="font-bold text-slate-800">{{ item.titulo }}</span></template>
            <template #cell-categoria="{ item }"><span class="badge capitalize" :class="getWikiCatClass(item.categoria)">{{ item.categoria }}</span></template>
            <template #cell-vistas="{ item }"><span class="text-xs text-slate-500">{{ item.vistas || 0 }}</span></template>
            <template #cell-updatedAt="{ item }"><span class="text-xs text-slate-400">{{ formatDateRelative(item.updatedAt) }}</span></template>
            <template #empty>No hay artículos que coincidan con los filtros.</template>
          </DataGridTable>
        </div>
      </div>

      <!-- Detalle de caso -->
      <template v-else-if="viewMode === 'cases'">
        <div v-if="selectedCase" class="max-w-4xl mx-auto px-4 md:px-8 py-6 motion-page">

          <!-- Cabecera plana -->
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4 no-print">
            <div class="flex items-start gap-3 min-w-[260px] flex-1">
              <div class="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                <i :class="getCaseIcon(selectedCase.tipo)" class="text-sm"></i>
              </div>
              <div class="min-w-0">
                <h1 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">{{ selectedCase.titulo }}</h1>
                <p class="text-xs text-slate-500 mt-0.5 capitalize">
                  {{ selectedCase.tipo }}<template v-if="selectedCase.categoria"> · {{ selectedCase.categoria }}</template>
                </p>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" @click="exportToPDF" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-800 transition-colors">
                <i class="fas fa-file-pdf text-[10px]"></i> Exportar
              </button>
              <button type="button" @click="openEditCase" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors">
                <i class="fas fa-pen text-[10px]"></i> Editar
              </button>
              <button type="button" @click="deleteCurrentCase" title="Eliminar caso" class="w-8 h-[30px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors">
                <i class="fas fa-trash-alt text-[11px]"></i>
              </button>
            </div>
          </div>

          <!-- Metadatos -->
          <div class="grid grid-cols-2 xl:grid-cols-4 bg-white border border-slate-200 rounded-2xl shadow-sm mb-4 no-print [&>*]:border-slate-100 [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t xl:[&>*:not(:first-child)]:border-l xl:[&>*]:border-t-0">
            <div class="px-4 py-3">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Estado</p>
              <div class="mt-1 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="getStatusDot(selectedCase.estado)"></span>
                <span class="text-sm font-bold text-slate-800 capitalize">{{ selectedCase.estado?.replace('_', ' ') }}</span>
              </div>
            </div>
            <div class="px-4 py-3">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Prioridad</p>
              <span class="badge capitalize mt-1.5" :class="getPriorityClass(selectedCase.prioridad)">{{ selectedCase.prioridad }}</span>
            </div>
            <div class="px-4 py-3">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Cliente</p>
              <div class="mt-1 flex items-center gap-1.5 min-w-0">
                <span class="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">{{ getClientInitials(selectedCase.cliente_id) }}</span>
                <span class="text-sm font-bold text-slate-800 truncate">{{ getClientName(selectedCase.cliente_id) }}</span>
              </div>
            </div>
            <div class="px-4 py-3">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Actualizado</p>
              <p class="mt-1 text-sm font-bold text-slate-800">{{ formatDateRelative(selectedCase.updatedAt) }}</p>
            </div>
          </div>

          <!-- Pestañas del caso -->
          <div class="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 no-print">
            <button
              v-for="tab in tabs" :key="tab.id"
              type="button"
              @click="activeViewTab = tab.id"
              :class="activeViewTab === tab.id ? 'text-primary-700 border-primary-500' : 'text-slate-500 border-transparent hover:text-slate-800'"
              class="-mb-px px-3 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <i :class="tab.icon" class="text-[10px]"></i>
              {{ tab.label }}
              <span v-if="tab.count" class="badge" :class="activeViewTab === tab.id ? 'badge-primary' : 'badge-slate'">{{ tab.count }}</span>
            </button>
          </div>

          <!-- Contenido de pestañas -->
          <div class="prose prose-slate max-w-none">
            <!-- Documentación -->
            <div v-if="activeViewTab === 'wiki'" class="animate-content-in">
              <div v-if="isEditingWiki" class="space-y-3">
                <WikiEditor
                  v-model="selectedCase.wikiContent"
                  placeholder="Escribe la documentación del caso aquí..."
                />
                <div class="flex justify-end gap-2">
                  <button type="button" @click="isEditingWiki = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                  <button type="button" @click="saveWiki" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">Guardar cambios</button>
                </div>
              </div>
              <div v-else class="group relative">
                <WikiContent
                  v-if="selectedCase.wikiContent"
                  :content="selectedCase.wikiContent"
                />
                <button v-else type="button" @click="isEditingWiki = true" class="w-full empty-state border border-dashed border-slate-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                  <div class="empty-state__icon"><i class="fas fa-feather-alt"></i></div>
                  <p class="empty-state__title">Documentar este caso</p>
                  <p class="empty-state__text">Escribe el contexto, los acuerdos y los pasos a seguir.</p>
                </button>
                <button
                  v-if="selectedCase.wikiContent"
                  type="button"
                  title="Editar documentación"
                  @click="isEditingWiki = true"
                  class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                >
                  <i class="fas fa-pen text-[11px]"></i>
                </button>
              </div>
            </div>

            <!-- Bitácora -->
            <div v-if="activeViewTab === 'dailies'" class="animate-content-in space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-extrabold text-slate-800 m-0">Registro de actividad</h3>
                <button type="button" @click="showAddDailyLog = true" class="inline-flex items-center gap-1.5 px-3 py-[7px] bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                  <i class="fas fa-plus text-[10px]"></i> Nueva entrada
                </button>
              </div>
              <div v-if="!sortedDailyLogs.length" class="empty-state empty-state--sm border border-dashed border-slate-200 rounded-2xl">
                <div class="empty-state__icon"><i class="fas fa-history"></i></div>
                <p class="empty-state__title">Sin entradas todavía</p>
                <p class="empty-state__text">Registra qué se hizo hoy en este caso.</p>
              </div>
              <div v-else class="space-y-3 relative pl-5 border-l border-slate-200">
                <div v-for="log in sortedDailyLogs" :key="log._id" class="bg-white px-4 py-3 rounded-xl border border-slate-200 relative group">
                  <div class="absolute -left-[25px] top-4 w-2.5 h-2.5 bg-white rounded-full border-2 border-slate-300 group-hover:border-primary-500 transition-colors"></div>
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="text-base leading-none">{{ log.sentimiento }}</span>
                    <span class="text-[11px] font-semibold text-slate-400">{{ formatDateRelative(log.fecha) }}</span>
                  </div>
                  <p class="text-sm text-slate-700 m-0 leading-relaxed">{{ log.que_se_hizo }}</p>
                </div>
              </div>
            </div>

            <!-- Adjuntos -->
            <div v-if="activeViewTab === 'files'" class="animate-content-in space-y-5">
              <h3 class="text-sm font-extrabold text-slate-800 m-0">Documentos adjuntos</h3>
              <FileDropzone label="Subir archivos al caso" @files-selected="uploadFilesToCase" />
              <div v-if="selectedCase.archivos?.length" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="(file, idx) in selectedCase.archivos" :key="idx" class="bg-white px-3 py-2.5 rounded-xl border border-slate-200 flex items-center gap-3 hover:border-primary-200 transition-colors group">
                  <div class="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <i :class="getFileIcon(file.nombre)" class="text-base text-slate-400 group-hover:text-primary-500"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-slate-800 truncate m-0" :title="file.nombre">{{ file.nombre }}</p>
                    <a :href="file.url" target="_blank" download class="text-[11px] text-primary-600 font-semibold m-0 no-underline hover:underline">Descargar</a>
                  </div>
                </div>
              </div>

              <!-- Enlaces externos -->
              <div class="pt-4 border-t border-slate-100 space-y-3">
                <h4 class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400 m-0">Enlaces externos</h4>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input v-model="newLinkName" placeholder="Nombre (ej: Manual en Drive)" class="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
                  <input v-model="newLinkUrl" placeholder="https://..." class="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
                  <button type="button" @click="addLinkToCase" :disabled="!newLinkName || !newLinkUrl" class="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Agregar</button>
                </div>
                <div v-if="selectedCase.enlacesExternos?.length" class="space-y-1.5">
                  <div v-for="link in selectedCase.enlacesExternos" :key="link._id" class="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <a :href="link.url" target="_blank" class="text-xs font-bold text-primary-600 hover:underline truncate mr-2 no-underline"><i class="fas fa-external-link-alt mr-1.5 text-[10px]"></i>{{ link.nombre }}</a>
                    <button type="button" title="Quitar enlace del caso" @click="removeLinkFromCase(link._id!)" class="text-slate-300 hover:text-rose-500 transition-colors shrink-0"><i class="fas fa-times-circle text-xs"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vinculados -->
            <div v-if="activeViewTab === 'links'" class="animate-content-in space-y-6">
              <div>
                <h3 class="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2 m-0"><i class="fas fa-ticket-alt text-slate-400 text-xs"></i>Tickets</h3>
                <LinkedItemsSelector
                  :model-value="linkedTicketIds"
                  :items="ticketLinkItems"
                  :loading="loadingLinkCatalog.tickets"
                  icon="fas fa-ticket-alt"
                  placeholder="Buscar ticket..."
                  empty-label="No hay tickets disponibles"
                  @update:model-value="(ids) => onToggleLinked('tickets', ids)"
                />
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2 m-0"><i class="fas fa-calendar-check text-slate-400 text-xs"></i>Actividades</h3>
                <LinkedItemsSelector
                  :model-value="linkedActivityIds"
                  :items="activityLinkItems"
                  :loading="loadingLinkCatalog.activities"
                  icon="fas fa-calendar-check"
                  placeholder="Buscar actividad..."
                  empty-label="No hay actividades disponibles"
                  @update:model-value="(ids) => onToggleLinked('activities', ids)"
                />
              </div>
            </div>

            <!-- Hoja de cálculo -->
            <div v-if="activeViewTab === 'spreadsheet'" class="animate-content-in">
              <EmbeddedSpreadsheet
                v-if="selectedCase._id"
                :key="selectedCase._id"
                entity-type="cases"
                :entity-id="selectedCase._id"
                :active="activeViewTab === 'spreadsheet'"
              />
            </div>
          </div>
        </div>

        <!-- Sin caso seleccionado -->
        <div v-else class="h-full flex items-center justify-center p-8">
          <div class="empty-state max-w-sm">
            <div class="empty-state__icon"><i class="fas fa-folder-open"></i></div>
            <p class="empty-state__title">Selecciona un caso</p>
            <p class="empty-state__text">Elige uno en el panel lateral para ver su documentación, bitácora y adjuntos.</p>
            <button type="button" @click="openCreateModal" class="mt-3 inline-flex items-center gap-1.5 px-3 py-[7px] bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
              <i class="fas fa-plus text-[10px]"></i> Nuevo caso
            </button>
          </div>
        </div>
      </template>

      <!-- Detalle de wiki -->
      <template v-else>
        <div v-if="selectedWiki" class="max-w-4xl mx-auto px-4 md:px-8 py-6 motion-page no-print">

          <!-- Cabecera -->
          <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div class="flex items-start gap-3 min-w-[260px] flex-1">
              <div class="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                <i :class="getWikiIcon(selectedWiki.categoria)" class="text-sm"></i>
              </div>
              <div class="min-w-0 flex-1">
                <template v-if="isEditingWikiItem">
                  <input
                    v-model="selectedWiki.titulo"
                    class="w-full text-xl md:text-2xl font-black text-slate-800 tracking-tight bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-300"
                    placeholder="Sin título"
                  />
                  <textarea
                    v-model="selectedWiki.descripcion"
                    rows="2"
                    class="w-full mt-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-slate-300"
                    placeholder="Añade una descripción..."
                  ></textarea>
                </template>
                <template v-else>
                  <h1 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-tight">{{ selectedWiki.titulo || 'Sin título' }}</h1>
                  <p class="text-sm text-slate-500 mt-1 leading-relaxed">{{ selectedWiki.descripcion || 'Sin descripción' }}</p>
                </template>
              </div>
            </div>
            <div v-if="!isEditingWikiItem" class="flex items-center gap-1.5 shrink-0">
              <button type="button" @click="exportToPDF" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-800 transition-colors">
                <i class="fas fa-file-pdf text-[10px]"></i> Exportar
              </button>
              <button type="button" @click="isEditingWikiItem = true" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-primary-700 bg-primary-50 border border-primary-100 rounded-lg hover:bg-primary-100 transition-colors">
                <i class="fas fa-pen text-[10px]"></i> Editar
              </button>
              <button type="button" @click="deleteWikiItem" title="Eliminar artículo" class="w-8 h-[30px] flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors">
                <i class="fas fa-trash-alt text-[11px]"></i>
              </button>
            </div>
          </div>

          <!-- Metadatos -->
          <div class="grid grid-cols-2 xl:grid-cols-3 bg-white border border-slate-200 rounded-2xl shadow-sm mb-5 [&>*]:border-slate-100 [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t xl:[&>*:not(:first-child)]:border-l xl:[&>*]:border-t-0">
            <div class="px-4 py-3">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Categoría</p>
              <div v-if="isEditingWikiItem" class="mt-1.5">
                <CustomSelect v-model="selectedWiki.categoria" size="sm" :options="[{ value: 'proceso', label: 'Proceso' }, { value: 'codigo', label: 'Código' }, { value: 'manual', label: 'Manual' }]" />
              </div>
              <span v-else class="badge capitalize mt-1.5" :class="getWikiCatClass(selectedWiki.categoria)">{{ selectedWiki.categoria }}</span>
            </div>
            <div class="px-4 py-3">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Lectura</p>
              <p class="mt-1 text-sm font-bold text-slate-800 flex items-center gap-1.5"><i class="fas fa-eye text-slate-300 text-xs"></i>{{ selectedWiki.vistas || 0 }} vistas</p>
            </div>
            <div class="px-4 py-3 col-span-2 md:col-span-1">
              <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Actualizado</p>
              <p class="mt-1 text-sm font-bold text-slate-800">{{ formatDateRelative(selectedWiki.updatedAt) || '—' }}</p>
            </div>
          </div>

          <!-- Contenido -->
          <div class="prose prose-slate max-w-none min-h-[320px]">
            <template v-if="isEditingWikiItem">
              <div class="space-y-3">
                <WikiEditor
                  v-model="selectedWiki.contenido"
                  placeholder="Comienza a escribir tu documentación..."
                />
                <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <label class="mr-auto cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors">
                    <i class="fas fa-paperclip text-[10px]"></i>
                    Adjuntar archivos
                    <input type="file" multiple class="hidden" @change="(e: any) => selectedWiki!.archivos = [...(selectedWiki!.archivos || []), ...Array.from(e.target.files)]">
                  </label>
                  <button type="button" @click="isEditingWikiItem = false" class="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">Cancelar</button>
                  <button type="button" @click="handleUpdateWiki" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">Guardar página</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="selectedWiki.categoria === 'codigo' && !isHtmlContent(selectedWiki.contenido)" class="relative">
                <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200 overflow-x-auto">
                  <pre class="font-mono text-xs leading-relaxed text-slate-700 m-0 bg-transparent p-0">{{ selectedWiki.contenido }}</pre>
                </div>
              </div>
              <WikiContent v-else :content="selectedWiki.contenido" />

              <!-- Archivos adjuntos -->
              <div v-if="selectedWiki.archivos && selectedWiki.archivos.length > 0" class="mt-8 pt-6 border-t border-slate-100">
                <h4 class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400 m-0 mb-3">Archivos adjuntos</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <a v-for="(file, idx) in selectedWiki.archivos" :key="idx"
                     :href="file.url"
                     target="_blank"
                     download
                     class="bg-white px-3 py-2.5 rounded-xl border border-slate-200 flex items-center gap-3 hover:border-primary-200 transition-colors no-underline group"
                  >
                    <div class="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      <i :class="getFileIcon(file.nombre)" class="text-base text-slate-400 group-hover:text-primary-500"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-bold text-slate-800 truncate m-0" :title="file.nombre">{{ file.nombre }}</p>
                      <p class="text-[11px] text-primary-600 font-semibold m-0">Descargar</p>
                    </div>
                  </a>
                </div>
              </div>

              <!-- Enlaces externos -->
              <div v-if="!isEditingWikiItem" class="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <h4 class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400 m-0">Enlaces externos</h4>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input v-model="newLinkName" placeholder="Nombre (ej: Manual en Drive)" class="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
                  <input v-model="newLinkUrl" placeholder="https://..." class="flex-1 h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors" />
                  <button type="button" @click="addLinkToWiki" :disabled="!newLinkName || !newLinkUrl" class="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Agregar</button>
                </div>
                <div v-if="selectedWiki.enlacesExternos?.length" class="space-y-1.5">
                  <div v-for="link in selectedWiki.enlacesExternos" :key="link._id" class="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <a :href="link.url" target="_blank" class="text-xs font-bold text-primary-600 hover:underline truncate mr-2 no-underline"><i class="fas fa-external-link-alt mr-1.5 text-[10px]"></i>{{ link.nombre }}</a>
                    <button type="button" title="Quitar enlace de la wiki" @click="removeLinkFromWiki(link._id!)" class="text-slate-300 hover:text-rose-500 transition-colors shrink-0"><i class="fas fa-times-circle text-xs"></i></button>
                  </div>
                </div>
              </div>

              <!-- Vinculados -->
              <div v-if="!isEditingWikiItem" class="mt-8 pt-6 border-t border-slate-100 space-y-6">
                <div>
                  <h3 class="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2 m-0"><i class="fas fa-ticket-alt text-slate-400 text-xs"></i>Tickets</h3>
                  <LinkedItemsSelector
                    :model-value="linkedTicketIds"
                    :items="ticketLinkItems"
                    :loading="loadingLinkCatalog.tickets"
                    icon="fas fa-ticket-alt"
                    placeholder="Buscar ticket..."
                    empty-label="No hay tickets disponibles"
                    @update:model-value="(ids) => onToggleLinked('tickets', ids)"
                  />
                </div>
                <div>
                  <h3 class="text-sm font-extrabold text-slate-800 mb-2 flex items-center gap-2 m-0"><i class="fas fa-calendar-check text-slate-400 text-xs"></i>Actividades</h3>
                  <LinkedItemsSelector
                    :model-value="linkedActivityIds"
                    :items="activityLinkItems"
                    :loading="loadingLinkCatalog.activities"
                    icon="fas fa-calendar-check"
                    placeholder="Buscar actividad..."
                    empty-label="No hay actividades disponibles"
                    @update:model-value="(ids) => onToggleLinked('activities', ids)"
                  />
                </div>
              </div>

              <!-- Hoja de cálculo (plegable) -->
              <div v-if="!isEditingWikiItem" class="mt-8 pt-6 border-t border-slate-100">
                <button type="button" @click="showWikiSpreadsheet = !showWikiSpreadsheet" class="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary-700 transition-colors">
                  <i class="fas fa-table text-[10px]"></i> Hoja de cálculo
                  <i :class="showWikiSpreadsheet ? 'fa-chevron-up' : 'fa-chevron-down'" class="fas text-[8px] text-slate-400"></i>
                </button>
                <div v-if="showWikiSpreadsheet" class="mt-3">
                  <EmbeddedSpreadsheet
                    v-if="selectedWiki._id"
                    :key="selectedWiki._id"
                    entity-type="wiki"
                    :entity-id="selectedWiki._id"
                    :active="showWikiSpreadsheet"
                  />
                </div>
              </div>

              <!-- Página vacía -->
              <button v-if="!selectedWiki.contenido" type="button" @click="isEditingWikiItem = true" class="w-full mt-4 empty-state empty-state--sm border border-dashed border-slate-200 rounded-2xl hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                <div class="empty-state__icon"><i class="fas fa-feather-alt"></i></div>
                <p class="empty-state__title">Esta página está vacía</p>
                <p class="empty-state__text">Pulsa para empezar a escribir.</p>
              </button>
            </template>
          </div>
        </div>

        <!-- Sin artículo seleccionado -->
        <div v-else class="h-full flex items-center justify-center p-8">
          <div class="empty-state max-w-sm">
            <div class="empty-state__icon"><i class="fas fa-book"></i></div>
            <p class="empty-state__title">Base de conocimiento</p>
            <p class="empty-state__text">Documenta procesos, fragmentos de código y manuales para estandarizar la operación del equipo.</p>
            <button type="button" @click="openCreateWiki" class="mt-3 inline-flex items-center gap-1.5 px-3 py-[7px] bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
              <i class="fas fa-plus text-[10px]"></i> Nuevo artículo
            </button>
          </div>
        </div>
      </template>

    </main>

    <!-- Modal crear / editar (caso o artículo) -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300"
      @click="showCreateModal = false"
    >
      <div
        class="bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        @click.stop
      >
        <div class="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 shrink-0">
              <i :class="viewMode === 'cases' ? 'fas fa-folder-plus' : 'fas fa-book'" class="text-primary-500 text-sm"></i>
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-black text-slate-800 tracking-tight leading-tight">
                {{ modalMode === 'create' ? (viewMode === 'cases' ? 'Nuevo caso' : 'Nuevo artículo') : (viewMode === 'cases' ? 'Editar caso' : 'Editar artículo') }}
              </h2>
              <p class="text-[11px] text-slate-400 truncate">
                {{ viewMode === 'cases' ? 'Seguimiento, incidencia o documento de un cliente.' : 'Proceso, fragmento de código o manual para el equipo.' }}
              </p>
            </div>
          </div>
          <button type="button" title="Cerrar" @click="showCreateModal = false" class="w-9 h-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>

        <div class="px-5 py-4 overflow-y-auto custom-scrollbar">
          <template v-if="viewMode === 'cases'">
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Título *</label>
                <input v-model="newCase.titulo" placeholder="Ej: Implementación API v2" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Cliente</label>
                  <CustomSelect v-model="newCase.cliente_id" size="md" searchable placeholder="Seleccionar cliente" :options="newCaseClientOptions" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoría</label>
                  <input v-model="newCase.categoria" placeholder="Ej: Backend, Legal" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Prioridad</label>
                  <div class="seg w-full">
                    <button v-for="p in ['baja', 'media', 'alta', 'critica']" :key="p" type="button" @click="newCase.prioridad = p" :aria-pressed="newCase.prioridad === p" class="flex-1 capitalize !px-1">{{ p }}</button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tipo</label>
                  <div class="seg w-full">
                    <button v-for="t in ['seguimiento', 'incidencia', 'documento']" :key="t" type="button" @click="newCase.tipo = t" :aria-pressed="newCase.tipo === t" class="flex-1 capitalize !px-1">{{ t }}</button>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Descripción breve</label>
                <textarea v-model="newCase.descripcion" rows="3" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm resize-none"></textarea>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Adjuntos <span class="normal-case font-medium text-slate-400 tracking-normal">(opcional)</span></label>
                <FileDropzone
                  :label="newCase.archivos?.length ? `${newCase.archivos.length} seleccionados` : 'Subir archivos'"
                  @files-selected="(files) => newCase.archivos = [...(newCase.archivos || []), ...files]"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Título *</label>
                <input v-model="newWiki.titulo" placeholder="Síntoma exacto o pregunta del usuario. Ej: No puedo iniciar sesión - error 401" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoría</label>
                  <CustomSelect :model-value="newWiki.categoria ?? ''" @update:model-value="newWiki.categoria = $event" size="md" :options="[{ value: 'proceso', label: 'Proceso estándar' }, { value: 'codigo', label: 'Fragmento de código' }, { value: 'manual', label: 'Manual de usuario' }]" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Etiquetas</label>
                  <input v-model="wikiTagsRaw" placeholder="login, 401, credenciales" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
                </div>
              </div>

              <!-- Posibles duplicados -->
              <div v-if="wikiDuplicates.length > 0" class="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div class="flex items-start gap-2 mb-2">
                  <i class="fas fa-triangle-exclamation text-amber-600 mt-0.5 text-xs"></i>
                  <div class="flex-1">
                    <p class="text-xs font-bold text-amber-900">Posibles artículos similares</p>
                    <p class="text-[11px] text-amber-700">Antes de crear, revisa si ya existe documentación sobre esto.</p>
                  </div>
                </div>
                <div class="space-y-1.5 pl-5">
                  <button
                    v-for="dup in wikiDuplicates"
                    :key="dup._id"
                    type="button"
                    @click="openDuplicate(dup)"
                    class="w-full text-left bg-white hover:bg-amber-100/50 border border-amber-200 rounded-lg px-3 py-2 transition-colors"
                  >
                    <p class="text-xs font-bold text-slate-800 truncate">{{ dup.titulo }}</p>
                    <p v-if="dup.tags?.length" class="text-[11px] text-slate-500 mt-0.5">
                      <span v-for="t in dup.tags.slice(0, 4)" :key="t" class="inline-block mr-1.5">#{{ t }}</span>
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Resumen</label>
                <input v-model="newWiki.descripcion" placeholder="¿De qué trata este artículo? (una línea)" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Adjuntos <span class="normal-case font-medium text-slate-400 tracking-normal">(opcional)</span></label>
                <FileDropzone
                  :label="newWiki.archivos?.length ? `${newWiki.archivos.length} seleccionados` : 'Subir documentos'"
                  @files-selected="(files) => newWiki.archivos = [...(newWiki.archivos || []), ...files]"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contenido</label>
                <WikiEditor
                  v-model="newWiki.contenido"
                  placeholder="Comienza a escribir tu documentación..."
                />
              </div>
            </div>
          </template>
        </div>

        <div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/30 shrink-0">
          <button type="button" @click="showCreateModal = false" class="px-5 py-2 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors font-bold text-sm">Cancelar</button>
          <button
            type="button"
            @click="modalMode === 'create' ? (viewMode === 'cases' ? handleCreateCase() : handleCreateWiki()) : (viewMode === 'cases' ? handleUpdateCase() : handleUpdateWiki())"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-bold text-sm flex items-center gap-2"
          >
            <i class="fas fa-check"></i>
            {{ modalMode === 'create' ? (viewMode === 'cases' ? 'Crear caso' : 'Publicar artículo') : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal bitácora -->
    <div
      v-if="showAddDailyLog"
      class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300"
      @click="showAddDailyLog = false"
    >
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300" @click.stop>
        <div class="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/30">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 shrink-0">
              <i class="fas fa-history text-primary-500 text-sm"></i>
            </div>
            <div>
              <h2 class="text-lg font-black text-slate-800 tracking-tight leading-tight">Nueva entrada</h2>
              <p class="text-[11px] text-slate-400">¿Qué se hizo hoy en este caso?</p>
            </div>
          </div>
          <button type="button" title="Cerrar" @click="showAddDailyLog = false" class="w-9 h-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        <div class="px-5 py-4 space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Actividad</label>
            <textarea v-model="newLog.que_se_hizo" rows="3" class="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors text-sm resize-none" placeholder="Describe brevemente..."></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Ánimo</label>
            <div class="seg w-full">
              <button v-for="s in ['😊', '😐', '😟', '🔥']" :key="s" type="button" @click="newLog.sentimiento = s" :aria-pressed="newLog.sentimiento === s" class="flex-1 text-lg leading-none !py-1.5">{{ s }}</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/30">
          <button type="button" @click="showAddDailyLog = false" class="px-5 py-2 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors font-bold text-sm">Cancelar</button>
          <button type="button" @click="handleAddDailyLog" class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm font-bold text-sm flex items-center gap-2">
            <i class="fas fa-check"></i> Registrar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { casesService, type Case } from '../services/casesService'
import { clientService, type ClientData } from '../services/clientService'
import { wikiService, type WikiArticle, type WikiArticleInput } from '../services/wikiService'
import { useNotifications } from '../composables/useNotifications'
import { useAuthStore } from '../stores/auth'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import WikiEditor from './wiki/WikiEditor.vue'
import WikiContent from './wiki/WikiContent.vue'
import FileDropzone from './ui/FileDropzone.vue'
import LinkedItemsSelector from './forms/LinkedItemsSelector.vue'
import EmbeddedSpreadsheet from './EmbeddedSpreadsheet.vue'
import DataGridTable, { type DataGridColumn } from './ui/DataGridTable.vue'
import CustomSelect from './ui/CustomSelect.vue'
import Skeleton from './ui/Skeleton.vue'
import { useSortableFilterableList } from '../composables/useSortableFilterableList'

const { showSuccess, showError, showLoading, closeLoading, confirmDelete } = useNotifications()
const authStore = useAuthStore()

// View State
const viewMode = ref<'cases' | 'wiki'>('cases')
const searchTerm = ref('')
const expandedGroups = ref<string[]>([])
/** 'tree' = árbol lateral de siempre. 'grid' = tabla ordenable/filtrable de todo el catálogo. */
const listDisplayMode = ref<'tree' | 'grid'>('tree')
const listLoading = ref(true) // skeleton del árbol mientras llega la primera carga
const gridFilterEstado = ref<string | null>(null)
const gridFilterPrioridad = ref<string | null>(null)
const gridFilterCategoria = ref<string | null>(null)

// Data State
const cases = ref<Case[]>([])
const clients = ref<ClientData[]>([])
const wikiArticles = ref<WikiArticle[]>([])
const selectedCase = ref<Case | null>(null)
const selectedWiki = ref<WikiArticle | null>(null)

// UI State
const activeViewTab = ref<'wiki' | 'dailies' | 'files' | 'links' | 'spreadsheet'>('wiki')
const isEditingWiki = ref(false)
const isEditingWikiItem = ref(false)
const showCreateModal = ref(false)
const showAddDailyLog = ref(false)
const wikiTagsRaw = ref('')
const modalMode = ref<'create' | 'edit'>('create')

import { ticketService } from '../services/ticketService'
import { useTasksStore } from '../stores/tasks'
import { activityService } from '../services/activityService'

// Form State
const newCase = ref({ titulo: '', tipo: 'seguimiento' as any, prioridad: 'media' as any, descripcion: '', cliente_id: '', categoria: '', tags: [] as string[], archivos: [] as File[] })
const newWiki = ref<WikiArticleInput>({ titulo: '', categoria: 'proceso', contenido: '', descripcion: '', tags: [], archivos: [] })
const newCaseClientOptions = computed(() => [
  { value: '', label: 'Seleccionar cliente...' },
  ...clients.value.map((c) => ({ value: c._id ?? '', label: c.name }))
])
const newLog = ref({ que_se_hizo: '', sentimiento: '😐' as any })

// Enlaces externos
const newLinkName = ref('')
const newLinkUrl = ref('')

// Hoja de cálculo (Wiki — sección plegable, se monta solo al abrirla)
const showWikiSpreadsheet = ref(false)

// Vinculación múltiple (tickets / tareas / actividades)
const tasksStore = useTasksStore()
const loadingLinkCatalog = ref({ tickets: false, tasks: false, activities: false })
const ticketCatalog = ref<any[]>([])
const taskCatalog = ref<any[]>([])
const activityCatalog = ref<any[]>([])
const linkCatalogLoaded = ref(false)

const loadLinkCatalogs = async () => {
  if (linkCatalogLoaded.value) return
  linkCatalogLoaded.value = true
  loadingLinkCatalog.value = { tickets: true, tasks: true, activities: true }
  try {
    const [ticketsRes] = await Promise.all([ticketService.getAll({ limit: 100 })])
    ticketCatalog.value = ticketsRes.data || []
  } catch (err) { console.error('Error cargando tickets:', err) }
  finally { loadingLinkCatalog.value.tickets = false }

  try {
    await tasksStore.fetchTasks()
    taskCatalog.value = tasksStore.tasks
  } catch (err) { console.error('Error cargando tareas:', err) }
  finally { loadingLinkCatalog.value.tasks = false }

  try {
    activityCatalog.value = await activityService.getAll()
  } catch (err) { console.error('Error cargando actividades:', err) }
  finally { loadingLinkCatalog.value.activities = false }
}

const currentLinkedEntity = computed(() => (viewMode.value === 'cases' ? selectedCase.value : selectedWiki.value))

const linkedTicketIds = computed(() => (currentLinkedEntity.value?.linkedTickets || []).map((t: any) => t._id || t))
const linkedTaskIds = computed(() => (currentLinkedEntity.value?.linkedTasks || []).map((t: any) => t._id || t))
const linkedActivityIds = computed(() => (currentLinkedEntity.value?.linkedActivities || []).map((a: any) => a._id || a))

const ticketLinkItems = computed(() => ticketCatalog.value.map((t: any) => ({
  _id: t._id,
  label: t.subject || t.titulo || 'Sin asunto',
  sublabel: `#${t.ticketNumber || t._id.slice(-6).toUpperCase()} · ${t.status || ''}`
})))
const activityLinkItems = computed(() => activityCatalog.value.map((a: any) => ({
  _id: a._id,
  label: a.title,
  sublabel: a.status || ''
})))

/** Compara el array de ids nuevo contra el actual y llama al endpoint de link/unlink
 *  por cada diferencia — LinkedItemsSelector emite la lista completa, no un toggle. */
const onToggleLinked = async (type: 'tickets' | 'tasks' | 'activities', newIds: string[]) => {
  const entity = currentLinkedEntity.value
  if (!entity?._id) return
  const currentIds = type === 'tickets' ? linkedTicketIds.value : type === 'tasks' ? linkedTaskIds.value : linkedActivityIds.value
  const added = newIds.filter(id => !currentIds.includes(id))
  const removed = currentIds.filter((id: string) => !newIds.includes(id))
  if (!added.length && !removed.length) return

  const svc = viewMode.value === 'cases' ? casesService : wikiService
  // Envueltos en closures para preservar el `this` del servicio — svc.linkTicket
  // como referencia suelta pierde el binding y rompe `this.apiUrl` internamente.
  const linkFn = (id: string) => type === 'tickets' ? svc.linkTicket(entity._id!, id) : type === 'tasks' ? svc.linkTask(entity._id!, id) : svc.linkActivity(entity._id!, id)
  const unlinkFn = (id: string) => type === 'tickets' ? svc.unlinkTicket(entity._id!, id) : type === 'tasks' ? svc.unlinkTask(entity._id!, id) : svc.unlinkActivity(entity._id!, id)

  try {
    let updated: any = entity
    for (const id of added) updated = await linkFn(id)
    for (const id of removed) updated = await unlinkFn(id)

    if (viewMode.value === 'cases') {
      selectedCase.value = updated
      const idx = cases.value.findIndex(c => c._id === updated._id)
      if (idx !== -1) cases.value[idx] = updated
    } else {
      selectedWiki.value = updated
      const idx = wikiArticles.value.findIndex(w => w._id === updated._id)
      if (idx !== -1) wikiArticles.value[idx] = updated
    }
  } catch (err: any) {
    showError('Error', err.message || 'No se pudo actualizar el vínculo')
  }
}

// Enlaces externos
const addLinkToCase = async () => {
  if (!selectedCase.value?._id || !newLinkName.value || !newLinkUrl.value) return
  try {
    const link = await casesService.addExternalLink(selectedCase.value._id, { nombre: newLinkName.value, url: newLinkUrl.value })
    selectedCase.value.enlacesExternos = [...(selectedCase.value.enlacesExternos || []), link]
    newLinkName.value = ''; newLinkUrl.value = ''
  } catch (err: any) { showError('Error', err.message) }
}
const removeLinkFromCase = async (linkId: string) => {
  if (!selectedCase.value?._id) return
  try {
    await casesService.removeExternalLink(selectedCase.value._id, linkId)
    selectedCase.value.enlacesExternos = (selectedCase.value.enlacesExternos || []).filter(l => l._id !== linkId)
  } catch (err: any) { showError('Error', err.message) }
}
const addLinkToWiki = async () => {
  if (!selectedWiki.value?._id || !newLinkName.value || !newLinkUrl.value) return
  try {
    const link = await wikiService.addExternalLink(selectedWiki.value._id, { nombre: newLinkName.value, url: newLinkUrl.value })
    selectedWiki.value.enlacesExternos = [...(selectedWiki.value.enlacesExternos || []), link]
    newLinkName.value = ''; newLinkUrl.value = ''
  } catch (err: any) { showError('Error', err.message) }
}
const removeLinkFromWiki = async (linkId: string) => {
  if (!selectedWiki.value?._id) return
  try {
    await wikiService.removeExternalLink(selectedWiki.value._id, linkId)
    selectedWiki.value.enlacesExternos = (selectedWiki.value.enlacesExternos || []).filter(l => l._id !== linkId)
  } catch (err: any) { showError('Error', err.message) }
}

// Grouping Logic
const groupedCases = computed(() => {
  const result: Record<string, Case[]> = {}
  const filtered = cases.value.filter(c => 
    !searchTerm.value || 
    c.titulo.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    c.categoria?.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
  
  filtered.forEach(c => {
    const clientName = getClientName(c.cliente_id)
    if (!result[clientName]) result[clientName] = []
    result[clientName].push(c)
  })
  return result
})

const groupedWiki = computed(() => {
  const result: Record<string, WikiArticle[]> = {}
  const filtered = wikiArticles.value.filter(w => 
    !searchTerm.value || 
    w.titulo.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    w.descripcion?.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
  
  filtered.forEach(w => {
    const cat = w.categoria || 'otros'
    if (!result[cat]) result[cat] = []
    result[cat].push(w)
  })
  return result
})

// ── Vista de tabla (grid ordenable/filtrable) — adicional al árbol, no lo reemplaza ──
const estadoFilterFn = computed(() => (gridFilterEstado.value ? (c: Case) => c.estado === gridFilterEstado.value : null))
const prioridadFilterFn = computed(() => (gridFilterPrioridad.value ? (c: Case) => c.prioridad === gridFilterPrioridad.value : null))
const categoriaFilterFn = computed(() => (gridFilterCategoria.value ? (w: WikiArticle) => w.categoria === gridFilterCategoria.value : null))

const {
  sortKey: casesSortKey, sortDir: casesSortDir, toggleSort: toggleCasesSort, filteredSorted: casesGridRows
} = useSortableFilterableList(cases, {
  filters: { estado: estadoFilterFn, prioridad: prioridadFilterFn },
  sortAccessors: {
    titulo: (c: Case) => c.titulo,
    estado: (c: Case) => c.estado,
    prioridad: (c: Case) => c.prioridad,
    cliente: (c: Case) => getClientName(c.cliente_id),
    updatedAt: (c: Case) => new Date(c.updatedAt)
  },
  defaultSortKey: 'updatedAt',
  defaultSortDir: 'desc'
})

const {
  sortKey: wikiSortKey, sortDir: wikiSortDir, toggleSort: toggleWikiSort, filteredSorted: wikiGridRows
} = useSortableFilterableList(wikiArticles, {
  filters: { categoria: categoriaFilterFn },
  sortAccessors: {
    titulo: (w: WikiArticle) => w.titulo,
    categoria: (w: WikiArticle) => w.categoria,
    vistas: (w: WikiArticle) => w.vistas || 0,
    updatedAt: (w: WikiArticle) => (w.updatedAt ? new Date(w.updatedAt) : null)
  },
  defaultSortKey: 'updatedAt',
  defaultSortDir: 'desc'
})

const casesGridColumns: DataGridColumn[] = [
  { key: 'titulo', label: 'Título' },
  { key: 'estado', label: 'Estado' },
  { key: 'prioridad', label: 'Prioridad' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'updatedAt', label: 'Actualizado' }
]

const wikiGridColumns: DataGridColumn[] = [
  { key: 'titulo', label: 'Título' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'vistas', label: 'Vistas', align: 'right' },
  { key: 'updatedAt', label: 'Actualizado' }
]

const selectCaseFromGrid = (c: Case) => {
  selectCase(c)
  listDisplayMode.value = 'tree'
}
const selectWikiFromGrid = (w: WikiArticle) => {
  selectedWiki.value = w
  listDisplayMode.value = 'tree'
}

const tabs = computed(() => [
  { id: 'wiki', label: 'Documentación', icon: 'fas fa-book-open' },
  {
    id: 'links', label: 'Vinculados', icon: 'fas fa-link',
    count: (selectedCase.value?.linkedTickets?.length || 0) + (selectedCase.value?.linkedTasks?.length || 0) + (selectedCase.value?.linkedActivities?.length || 0)
  },
  { id: 'dailies', label: 'Actividad', icon: 'fas fa-history', count: selectedCase.value?.dailyLogs?.length },
  { id: 'files', label: 'Adjuntos', icon: 'fas fa-paperclip', count: (selectedCase.value?.archivos?.length || 0) + (selectedCase.value?.enlacesExternos?.length || 0) },
  { id: 'spreadsheet', label: 'Hoja de cálculo', icon: 'fas fa-table' }
])

const sortedDailyLogs = computed(() => {
  if (!selectedCase.value?.dailyLogs) return []
  return [...selectedCase.value.dailyLogs].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
})

// Methods
const loadData = async () => {
  try {
    listLoading.value = true
    const [casesData, clientsData, wikiData] = await Promise.all([
      casesService.getAll(),
      clientService.getAll(),
      wikiService.getAll()
    ])
    cases.value = casesData
    clients.value = clientsData
    wikiArticles.value = wikiData
    
    // Auto-expand first groups
    if (Object.keys(groupedCases.value).length > 0) expandedGroups.value.push(Object.keys(groupedCases.value)[0])
    if (Object.keys(groupedWiki.value).length > 0) expandedGroups.value.push(Object.keys(groupedWiki.value)[0])
    
    if (cases.value.length && !selectedCase.value) selectedCase.value = cases.value[0]
    if (wikiArticles.value.length && !selectedWiki.value) selectedWiki.value = wikiArticles.value[0]
  } catch (err) { showError('Error', 'Fallo al sincronizar datos.') }
  finally { listLoading.value = false }
}

const toggleGroup = (name: string) => {
  const idx = expandedGroups.value.indexOf(name)
  if (idx === -1) expandedGroups.value.push(name)
  else expandedGroups.value.splice(idx, 1)
}

const openCreateModal = () => {
  modalMode.value = 'create'
  resetForm()
  showCreateModal.value = true
}

const resetForm = () => {
  newCase.value = { titulo: '', tipo: 'seguimiento', prioridad: 'media', descripcion: '', cliente_id: '', categoria: '', tags: [], archivos: [] }
  newWiki.value = { titulo: '', categoria: 'proceso', contenido: WIKI_TEMPLATE, descripcion: '', tags: [], archivos: [] }
  wikiTagsRaw.value = ''
}

const WIKI_TEMPLATE = `<h2>Síntomas</h2>
<p><em>Describe los mensajes de error, comportamiento observado, logs o códigos HTTP que permiten identificar este problema.</em></p>
<p></p>
<h2>Causa raíz</h2>
<p><em>Explica el origen del fallo: configuración incorrecta, bug conocido, dependencia caída, etc.</em></p>
<p></p>
<h2>Solución</h2>
<ol>
  <li>Paso 1: …</li>
  <li>Paso 2: …</li>
  <li>Paso 3: …</li>
</ol>
<p></p>
<h2>Tags / palabras clave</h2>
<p><em>Añádelas en el campo "Tags" del formulario para facilitar la búsqueda.</em></p>`

const openCreateWiki = () => {
  viewMode.value = 'wiki'
  // Pre-llena con plantilla solo si está vacío (no pisa contenido en edición)
  if (!newWiki.value.contenido) newWiki.value.contenido = WIKI_TEMPLATE
  showCreateModal.value = true
}

// Detector de duplicados de Wiki
const wikiDuplicates = computed(() => {
  const title = (newWiki.value.titulo || '').trim().toLowerCase()
  const tags = (wikiTagsRaw.value || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  if (title.length < 4 && tags.length === 0) return []

  return wikiArticles.value
    .filter((w) => {
      // No incluir la wiki que estamos editando
      if (modalMode.value === 'edit' && selectedWiki.value?._id === w._id) return false

      const wTitle = (w.titulo || '').toLowerCase()
      const wTags = (w.tags || []).map((t) => t.toLowerCase())

      // Match por título (substring de 4+ chars)
      const titleMatch = title.length >= 4 && (wTitle.includes(title) || title.includes(wTitle))
      // Match por tags (al menos 1 tag en común)
      const tagMatch = tags.length > 0 && tags.some((t) => wTags.includes(t))

      return titleMatch || tagMatch
    })
    .slice(0, 3)
})

const exportToPDF = () => {
  const content = viewMode.value === 'cases' ? selectedCase.value?.wikiContent : selectedWiki.value?.contenido
  const title = viewMode.value === 'cases' ? selectedCase.value?.titulo : selectedWiki.value?.titulo
  
  if (!content) return showError('Error', 'No hay contenido para exportar.')

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          h1 { font-size: 24px; margin-bottom: 8px; color: #0f172a; }
          .metadata { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: bold; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
          .content { font-size: 14px; white-space: pre-wrap; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="metadata">Documento Generado por GEMS CRM • ${new Date().toLocaleDateString()}</div>
        <div class="content">${content}</div>
      </body>
    </html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
}

const selectCase = (c: Case) => {
  selectedCase.value = c
  activeViewTab.value = 'wiki'
  isEditingWiki.value = false
}

const handleCreateCase = async () => {
  if (!newCase.value.titulo) return showError('Requerido', 'El título es obligatorio.')
  showLoading('Creando página...')
  try {
    const created = await casesService.createCase(newCase.value);
    cases.value.unshift(created); selectedCase.value = created; showCreateModal.value = false
    closeLoading(); showSuccess('¡Éxito!', 'Proyecto creado.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}

const openDuplicate = (dup: WikiArticle) => {
  selectedWiki.value = dup
  showCreateModal.value = false
}

const saveWiki = async () => {
  if (!selectedCase.value?._id) return
  showLoading('Guardando...')
  try {
    const updated = await casesService.updateCase(selectedCase.value._id, { wikiContent: selectedCase.value.wikiContent });
    const idx = cases.value.findIndex(c => c._id === updated._id);
    if (idx !== -1) cases.value[idx] = updated;
    selectedCase.value = updated; // Actualizar referencia local
    isEditingWiki.value = false;
    closeLoading(); showSuccess('Éxito', 'Documentación actualizada.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}

const handleCreateWiki = async () => {
  if (!newWiki.value.titulo) return showError('Requerido', 'El título es obligatorio.')
  newWiki.value.tags = wikiTagsRaw.value.split(',').map(t => t.trim()).filter(t => t)
  showLoading('Publicando...')
  try {
    const created = await wikiService.create(newWiki.value);
    wikiArticles.value.unshift(created); selectedWiki.value = created; showCreateModal.value = false
    closeLoading(); showSuccess('¡Éxito!', 'Artículo publicado.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}

const handleUpdateWiki = async () => {
  if (!selectedWiki.value?._id) return
  showLoading('Actualizando...')
  try {
    const updated = await wikiService.update(selectedWiki.value._id, selectedWiki.value);
    const idx = wikiArticles.value.findIndex(w => w._id === updated._id);
    if (idx !== -1) wikiArticles.value[idx] = updated;
    selectedWiki.value = updated; // Actualizar referencia local
    isEditingWikiItem.value = false;
    closeLoading(); showSuccess('Éxito', 'Wiki actualizada.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}

const deleteWikiItem = async () => {
  if (!selectedWiki.value?._id) return; const result = await confirmDelete(selectedWiki.value.titulo); if (result.isConfirmed) {
    showLoading('Eliminando...')
    try { await wikiService.delete(selectedWiki.value._id); wikiArticles.value = wikiArticles.value.filter(w => w._id !== selectedWiki.value?._id); selectedWiki.value = wikiArticles.value[0] || null; closeLoading(); showSuccess('Eliminado', 'Artículo removido.') } catch (err: any) { closeLoading(); showError('Error', err.message) }
  }
}

const handleAddDailyLog = async () => {
  if (!selectedCase.value?._id || !newLog.value.que_se_hizo) return
  showLoading('Registrando...')
  try {
    const updated = await casesService.addDailyLog(selectedCase.value._id, { 
      que_se_hizo: newLog.value.que_se_hizo, 
      sentimiento: newLog.value.sentimiento,
      autor: authStore.user?._id
    })
    
    // Actualizar el caso seleccionado con los nuevos logs
    selectedCase.value = updated
    
    // También actualizar en la lista general
    const idx = cases.value.findIndex(c => c._id === updated._id)
    if (idx !== -1) cases.value[idx] = updated
    
    showAddDailyLog.value = false
    newLog.value = { que_se_hizo: '', sentimiento: '😐' }
    closeLoading(); showSuccess('Registrado', 'Actividad añadida correctamente.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}

// Helpers
const getClientName = (id?: string) => clients.value.find(c => c._id === id)?.name || 'Interno'
const getClientInitials = (id?: string) => getClientName(id).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
const getStatusDot = (s?: string) => ({ abierto: 'bg-emerald-500', en_progreso: 'bg-amber-500', resueltos: 'bg-blue-500', cerrado: 'bg-slate-900' }[s || ''] || 'bg-slate-300')
const getPriorityClass = (p?: string) => ({ baja: 'badge-success', media: 'badge-warning', alta: 'badge-warning', critica: 'badge-danger' }[p || ''] || 'badge-slate')
const getCoverGradient = (p?: string) => ({ baja: 'bg-gradient-to-br from-emerald-400 to-teal-600', media: 'bg-gradient-to-br from-amber-400 to-orange-500', alta: 'bg-gradient-to-br from-orange-400 to-rose-600', critica: 'bg-gradient-to-br from-rose-500 to-slate-900' }[p || ''] || 'bg-gradient-to-br from-slate-400 to-slate-600')
const getWikiCoverGradient = (cat?: string) => ({ proceso: 'bg-gradient-to-br from-blue-400 to-indigo-600', codigo: 'bg-gradient-to-br from-emerald-400 to-cyan-600', manual: 'bg-gradient-to-br from-purple-400 to-fuchsia-600' }[cat || ''] || 'bg-gradient-to-br from-slate-400 to-slate-600')
const getCaseIcon = (t?: string) => ({ documento: 'fas fa-file-contract', incidencia: 'fas fa-bug', seguimiento: 'fas fa-project-diagram' }[t || ''] || 'fas fa-folder')
const getWikiIcon = (cat?: string) => ({ proceso: 'fas fa-cogs', codigo: 'fas fa-code', manual: 'fas fa-book' }[cat || ''] || 'fas fa-file-alt')
const getWikiCatClass = (cat?: string) => ({ proceso: 'badge-primary', codigo: 'badge-success', manual: 'badge-violet' }[cat || ''] || 'badge-slate')
const formatDateRelative = (date: any) => date ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: es }) : ''
const getFileIcon = (name: string) => casesService.getFileIcon(name)
const isHtmlContent = (content?: string) => !!content && /<[a-z][\s\S]*>/i.test(content)
const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); showSuccess('Copiado', 'Contenido en el portapapeles.') }

const openEditCase = () => {
  if (!selectedCase.value) return
  modalMode.value = 'edit'
  newCase.value = { ...selectedCase.value, archivos: [] } // No enviamos archivos previos por ahora
  showCreateModal.value = true
}

const handleUpdateCase = async () => {
  if (!selectedCase.value?._id) return
  showLoading('Actualizando caso...')
  try {
    const updated = await casesService.updateCase(selectedCase.value._id, newCase.value as any)
    const idx = cases.value.findIndex(c => c._id === updated._id)
    if (idx !== -1) cases.value[idx] = updated
    selectedCase.value = updated
    showCreateModal.value = false
    closeLoading(); showSuccess('Éxito', 'Caso actualizado correctamente.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}
const deleteCurrentCase = async () => {
  if (!selectedCase.value?._id) return
  const result = await confirmDelete(selectedCase.value.titulo)
  if (result.isConfirmed) {
    showLoading('Eliminando...')
    try {
      await casesService.deleteCase(selectedCase.value._id)
      cases.value = cases.value.filter(c => c._id !== selectedCase.value?._id)
      selectedCase.value = cases.value[0] || null
      closeLoading(); showSuccess('Eliminado', 'El caso ha sido removido.')
    } catch (err: any) { closeLoading(); showError('Error', err.message) }
  }
}

const uploadFilesToCase = async (e: any) => {
  if (!selectedCase.value?._id) return
  const files = Array.from(e.target.files)
  if (!files.length) return
  
  showLoading('Subiendo archivos...')
  try {
    const updated = await casesService.updateCase(selectedCase.value._id, { archivos: files } as any)
    const idx = cases.value.findIndex(c => c._id === updated._id)
    if (idx !== -1) cases.value[idx] = updated
    selectedCase.value = updated
    closeLoading(); showSuccess('Éxito', 'Archivos añadidos correctamente.')
  } catch (err: any) { closeLoading(); showError('Error', err.message) }
}
onMounted(() => {
  loadData()
  loadLinkCatalogs()
})
watch(viewMode, () => { searchTerm.value = ''; expandedGroups.value = [] })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #EFEFEF; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #E2E8F0; }

@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes scale-up { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
.animate-scale-up { animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes content-in { from { opacity: 0; filter: blur(4px); transform: translateY(5px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
.animate-content-in { animation: content-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

.document-content {
  line-height: 1.8;
  letter-spacing: -0.01em;
}
.prose-xs { font-size: 0.75rem; line-height: 1.6; }

@media print {
  aside, .no-print, button, .actions-overlay, .tabs-header, .metadata-grid, .cover-image, .page-header-actions {
    display: none !important;
  }
  main {
    margin: 0 !important;
    padding: 2cm !important;
    width: 100% !important;
    background: white !important;
  }
  .max-w-4xl {
    max-width: 100% !important;
    box-shadow: none !important;
    border: none !important;
  }
  h1 {
    font-size: 24pt !important;
    margin-top: 0 !important;
  }
  .document-content {
    font-size: 11pt !important;
    line-height: 1.6 !important;
    color: black !important;
  }
  /* Show header emoji/icon in print */
  .text-6xl {
    font-size: 40pt !important;
  }
}
</style>