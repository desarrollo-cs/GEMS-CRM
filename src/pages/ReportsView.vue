<template>
  <div class="flex flex-col gap-4 h-full min-h-0 motion-page">

    <!-- Barra superior: pestañas + filtros -->
    <div class="flex-shrink-0 flex flex-wrap items-center gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100 shadow-sm">
      <div class="seg">
        <button @click="activePageTab = 'reports'" :aria-pressed="activePageTab === 'reports'" class="flex items-center gap-1.5">
          <i class="fas fa-chart-pie text-[10px]"></i>Reportes
        </button>
        <button @click="activePageTab = 'kpis'" :aria-pressed="activePageTab === 'kpis'" class="flex items-center gap-1.5">
          <i class="fas fa-users text-[10px]"></i>KPIs del equipo
        </button>
      </div>

      <template v-if="activePageTab === 'reports'">
        <div class="flex flex-wrap items-center gap-2 ml-auto">
          <div class="w-36"><CustomSelect v-model="selectedPeriod" @change="loadData" :options="periodOptions" size="sm" /></div>
          <div class="w-40"><CustomSelect v-model="filters.department" @change="loadData" :options="departmentOptions" placeholder="Todos los equipos" size="sm" /></div>
          <div class="w-44"><CustomSelect v-model="filters.clientId" @change="loadData" :options="clientOptions" placeholder="Todos los clientes" size="sm" searchable /></div>
          <div class="w-44"><CustomSelect v-model="filters.assignedTo" @change="loadData" :options="memberOptions" placeholder="Todo el personal" size="sm" searchable /></div>
          <button
            @click="refreshData"
            :disabled="loading"
            title="Actualizar"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 transition-colors"
          >
            <i class="fas fa-rotate text-[10px]" :class="{ 'animate-spin': loading }"></i>
            Actualizar
          </button>
        </div>
      </template>

      <template v-else>
        <div class="flex items-center gap-2 ml-auto">
          <div class="seg">
            <button v-for="p in kpiPeriods" :key="p.value" @click="kpiPeriod = p.value; fetchKPIs()" :aria-pressed="kpiPeriod === p.value">
              {{ p.label }}
            </button>
          </div>
          <button
            title="Actualizar KPIs"
            @click="fetchKPIs"
            :disabled="kpiLoading"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 transition-colors"
          >
            <i class="fas fa-rotate text-[10px]" :class="{ 'animate-spin': kpiLoading }"></i>
            Actualizar
          </button>
        </div>
      </template>
    </div>

    <!-- ══ REPORTES ═══════════════════════════════════════════════════ -->
    <div v-if="activePageTab === 'reports'" class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <!-- Las gráficas se montan desde el inicio (como antes): sólo las cifras muestran skeleton -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 motion-stagger">

        <!-- Columna principal -->
        <div class="xl:col-span-2 flex flex-col gap-4 min-w-0">

          <!-- Cifras del periodo: una sola tarjeta con celdas -->
          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Resumen del periodo</h3>
              <span class="text-[11px] text-slate-400">{{ periodLabel }}</span>
            </header>
            <div v-if="loading && !dashboardStats" class="p-4"><Skeleton preset="stats" :rows="4" /></div>
            <div v-else class="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
              <div v-for="kpi in kpis" :key="kpi.label" class="px-4 py-3.5">
                <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">{{ kpi.label }}</p>
                <div class="mt-1 flex items-baseline gap-2">
                  <span class="text-2xl font-black text-slate-800 tabular-nums leading-none">{{ kpi.value }}</span>
                  <span v-if="kpi.trend" class="text-[11px] font-bold tabular-nums" :class="kpi.trend > 0 ? 'text-emerald-600' : 'text-rose-600'">
                    {{ kpi.trend > 0 ? '+' : '' }}{{ kpi.trend }}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Gráficos -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <header class="px-4 py-3 border-b border-slate-100">
                <h3 class="text-sm font-extrabold text-slate-800">Actividades por estado</h3>
              </header>
              <div class="p-3 h-60">
                <apexchart type="donut" height="100%" width="100%" :options="activitiesChartOptions" :series="activitiesChartSeries"></apexchart>
              </div>
            </section>
            <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <header class="px-4 py-3 border-b border-slate-100">
                <h3 class="text-sm font-extrabold text-slate-800">Carga de trabajo</h3>
              </header>
              <div class="p-3 h-60">
                <apexchart type="bar" height="100%" width="100%" :options="workloadChartOptions" :series="workloadChartSeries"></apexchart>
              </div>
            </section>
          </div>

          <!-- Rendimiento del equipo: tabla -->
          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Rendimiento del equipo</h3>
              <span class="text-[11px] text-slate-400">Completadas / asignadas</span>
            </header>
            <div v-if="teamMembers.length === 0" class="empty-state empty-state--sm">
              <div class="empty-state__icon"><i class="fas fa-users"></i></div>
              <p class="empty-state__title">Sin actividad en el periodo</p>
            </div>
            <table v-else class="w-full text-[13px]">
              <thead>
                <tr class="text-[10.5px] uppercase tracking-[0.07em] text-slate-400 font-semibold">
                  <th class="text-left font-semibold px-4 py-2">Persona</th>
                  <th class="text-right font-semibold px-4 py-2 w-28">Completadas</th>
                  <th class="font-semibold px-4 py-2 w-48">Avance</th>
                  <th class="text-right font-semibold px-4 py-2 w-20">Tasa</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="member in teamMembers" :key="member.name" class="hover:bg-slate-50/60 transition-colors">
                  <td class="px-4 py-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <PersonAvatar :name="member.name" :photo="member.photo" class="w-7 h-7 rounded-lg bg-primary-50 text-[10px] font-black text-primary-600 shrink-0" />
                      <span class="font-semibold text-slate-700 truncate">{{ member.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-right tabular-nums text-slate-700">{{ member.completed }}<span class="text-slate-400"> / {{ member.total }}</span></td>
                  <td class="px-4 py-2">
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700" :class="rateBar(member.rate)" :style="{ width: member.rate + '%' }"></div>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-right tabular-nums font-bold" :class="rateText(member.rate)">{{ member.rate }}%</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <!-- Columna lateral -->
        <div class="flex flex-col gap-4 min-w-0">

          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Frente al periodo anterior</h3>
            </header>
            <table class="w-full text-[13px]">
              <thead>
                <tr class="text-[10.5px] uppercase tracking-[0.07em] text-slate-400 font-semibold">
                  <th class="text-left font-semibold px-4 py-2">Indicador</th>
                  <th class="text-right font-semibold px-3 py-2">Actual</th>
                  <th class="text-right font-semibold px-3 py-2">Previo</th>
                  <th class="text-right font-semibold px-4 py-2">Var.</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="comp in monthlyComparison" :key="comp.label">
                  <td class="px-4 py-2 text-slate-600">{{ comp.label }}</td>
                  <td class="px-3 py-2 text-right tabular-nums font-bold text-slate-800">{{ comp.current }}</td>
                  <td class="px-3 py-2 text-right tabular-nums text-slate-400">{{ comp.previous }}</td>
                  <td class="px-4 py-2 text-right tabular-nums font-bold" :class="comp.growth > 0 ? 'text-emerald-600' : comp.growth < 0 ? 'text-rose-600' : 'text-slate-400'">
                    {{ comp.growth > 0 ? '+' : '' }}{{ comp.growth }}%
                  </td>
                </tr>
                <tr v-for="row in executiveRows.filter(r => r.label === 'Total clientes')" :key="row.label">
                  <td class="px-4 py-2 text-slate-600">{{ row.label }}</td>
                  <td class="px-3 py-2 text-right tabular-nums font-bold text-slate-800">{{ row.value }}</td>
                  <td class="px-3 py-2 text-right text-slate-300">—</td>
                  <td class="px-4 py-2 text-right text-slate-300">—</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Tiempo de resolución</h3>
            </header>
            <div class="grid grid-cols-3 divide-x divide-slate-100">
              <div class="px-4 py-3">
                <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Mínimo</p>
                <p class="mt-1 text-xl font-black text-slate-800 tabular-nums leading-none">{{ resolutionTime.min }}<span class="text-xs font-semibold text-slate-400 ml-0.5">d</span></p>
              </div>
              <div class="px-4 py-3">
                <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Promedio</p>
                <p class="mt-1 text-xl font-black text-primary-700 tabular-nums leading-none">{{ resolutionTime.avg }}<span class="text-xs font-semibold text-slate-400 ml-0.5">d</span></p>
              </div>
              <div class="px-4 py-3">
                <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400">Máximo</p>
                <p class="mt-1 text-xl font-black text-slate-800 tabular-nums leading-none">{{ resolutionTime.max }}<span class="text-xs font-semibold text-slate-400 ml-0.5">d</span></p>
              </div>
            </div>
          </section>

          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Clientes más activos</h3>
              <span class="text-[11px] text-slate-400">Top 5</span>
            </header>
            <div v-if="topClients.length === 0" class="empty-state empty-state--sm">
              <div class="empty-state__icon"><i class="fas fa-building"></i></div>
              <p class="empty-state__title">Sin actividad de clientes</p>
            </div>
            <table v-else class="w-full text-[13px]">
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(client, i) in topClients" :key="client.name" class="hover:bg-slate-50/60 transition-colors">
                  <td class="pl-4 pr-2 py-2 w-8 text-[11px] font-bold text-slate-400 tabular-nums">{{ i + 1 }}</td>
                  <td class="px-2 py-2 min-w-0">
                    <p class="font-semibold text-slate-700 truncate">{{ client.name }}</p>
                    <p class="text-[11px] text-slate-400">{{ client.activities }} actividades</p>
                  </td>
                  <td class="pl-2 pr-4 py-2 text-right tabular-nums font-bold" :class="rateText(client.rate)">{{ client.rate }}%</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Envío por correo -->
          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Enviar reporte por correo</h3>
            </header>
            <div class="px-4 py-3 space-y-3">
              <div class="space-y-1.5">
                <label class="text-[11px] font-semibold text-slate-500">Destinatarios</label>
                <input v-model="reportEmail" type="text" placeholder="correo1@empresa.com, correo2@empresa.com"
                  class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-400 outline-none transition-all" />
              </div>
              <div class="flex items-end gap-2">
                <div class="flex-1 space-y-1.5">
                  <label class="text-[11px] font-semibold text-slate-500">Periodo</label>
                  <CustomSelect
                    v-model="reportPeriod"
                    :options="[{ value: 'week', label: 'Semanal' }, { value: 'month', label: 'Mensual' }, { value: 'quarter', label: 'Trimestral' }]"
                    size="sm"
                  />
                </div>
                <button @click="sendManualReport" :disabled="sendingReport"
                  class="inline-flex items-center gap-1.5 px-3 py-[7px] bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors shrink-0">
                  <i class="fas text-[10px]" :class="sendingReport ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
                  {{ sendingReport ? 'Enviando…' : 'Enviar ahora' }}
                </button>
              </div>
              <p v-if="reportMsg" class="text-[11px] font-semibold" :class="reportMsgType === 'ok' ? 'text-emerald-600' : 'text-rose-600'">{{ reportMsg }}</p>
            </div>

            <div class="border-t border-slate-100 px-4 py-3 space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs font-bold text-slate-700">Envío automático</p>
                  <p class="text-[11px] text-slate-400">Programa el reporte de forma recurrente</p>
                </div>
                <button
                  @click="toggleSchedule"
                  role="switch"
                  :aria-checked="scheduleEnabled"
                  class="relative w-9 h-5 rounded-full transition-colors shrink-0"
                  :class="scheduleEnabled ? 'bg-primary-600' : 'bg-slate-200'"
                >
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform" :class="scheduleEnabled ? 'translate-x-4' : ''"></span>
                </button>
              </div>
              <transition name="expand">
                <div v-if="scheduleEnabled" class="space-y-2.5">
                  <div class="flex gap-2">
                    <div class="flex-1">
                      <CustomSelect
                        v-model="scheduleFrequency"
                        @change="saveSchedule"
                        :options="[{ value: 'daily', label: 'Diario (L-V)' }, { value: 'weekly', label: 'Semanal' }, { value: 'monthly', label: 'Mensual' }]"
                        size="sm"
                      />
                    </div>
                    <div v-if="scheduleFrequency === 'weekly'" class="flex-1">
                      <CustomSelect
                        v-model="scheduleDayOfWeek"
                        @change="saveSchedule"
                        :options="[{ value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' }, { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' }, { value: 5, label: 'Viernes' }]"
                        size="sm"
                      />
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-[11px] font-semibold text-slate-500 shrink-0">Hora</label>
                    <input type="number" v-model.number="scheduleHour" min="0" max="23" @change="saveSchedule"
                      class="w-14 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-center focus:bg-white focus:border-primary-400 tabular-nums" />
                    <span class="text-xs text-slate-400">:</span>
                    <input type="number" v-model.number="scheduleMinute" min="0" max="59" @change="saveSchedule"
                      class="w-14 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none text-center focus:bg-white focus:border-primary-400 tabular-nums" />
                    <span v-if="scheduleLastRun" class="ml-auto text-[11px] text-slate-400">Último envío: {{ new Date(scheduleLastRun).toLocaleString('es-CO') }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- ══ KPIs DEL EQUIPO ════════════════════════════════════════════ -->
    <div v-else class="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-4 motion-stagger">

        <div class="xl:col-span-2 flex flex-col gap-4 min-w-0">

          <!-- Totales del equipo -->
          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Totales del equipo</h3>
              <span class="text-[11px] text-slate-400">{{ kpiPeriodLabel }}</span>
            </header>
            <div class="grid grid-cols-3 lg:grid-cols-6 divide-x divide-slate-100">
              <div v-for="card in kpiStatCards" :key="card.label" class="px-4 py-3">
                <p class="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-slate-400 truncate">{{ card.label }}</p>
                <p class="mt-1 text-xl font-black tabular-nums leading-none" :class="card.valueColor">
                  <template v-if="kpiLoading">—</template>
                  <template v-else>{{ card.value }}<span v-if="card.suffix" class="text-xs font-semibold text-slate-400 ml-0.5">{{ card.suffix }}</span></template>
                </p>
              </div>
            </div>
          </section>

          <!-- Tendencia -->
          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Completadas por periodo</h3>
              <div class="seg">
                <button @click="kpiTrendTab = 'weekly'" :aria-pressed="kpiTrendTab === 'weekly'">Semanal</button>
                <button @click="kpiTrendTab = 'monthly'" :aria-pressed="kpiTrendTab === 'monthly'">Mensual</button>
              </div>
            </header>
            <div class="px-4 py-4">
              <div v-if="kpiTrendsLoading" class="motion-stagger" aria-busy="true">
                <div class="flex items-end gap-2.5 h-40 px-1">
                  <div v-for="n in 7" :key="n" class="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0 h-full">
                    <Skeleton shape="line" width="18" height="10" />
                    <Skeleton shape="block" wrapper-class="w-full max-w-[48px] rounded-t-md" :height="30 + ((n * 41) % 100)" />
                  </div>
                </div>
                <div class="flex gap-2.5 mt-2 px-1">
                  <div v-for="n in 7" :key="'tl' + n" class="flex-1 flex justify-center"><Skeleton width="28" height="8" /></div>
                </div>
              </div>
              <div v-else-if="kpiCurrentTrend.length === 0" class="empty-state empty-state--sm">
                <div class="empty-state__icon"><i class="fas fa-chart-column"></i></div>
                <p class="empty-state__title">Sin datos de tendencia</p>
              </div>
              <div v-else>
                <div class="flex items-end gap-2.5 h-40 px-1">
                  <div v-for="(point, i) in kpiCurrentTrend" :key="i" class="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0 h-full">
                    <span class="text-[10px] font-bold text-slate-500 tabular-nums">{{ point.completed }}</span>
                    <div class="w-full max-w-[48px] rounded-t-md bg-primary-500/90 hover:bg-primary-600 transition-all duration-700 min-h-[3px]"
                      :style="{ height: kpiTrendBarHeight(point.completed) }"></div>
                  </div>
                </div>
                <div class="flex gap-2.5 mt-2 px-1 border-t border-slate-100 pt-2">
                  <div v-for="(point, i) in kpiCurrentTrend" :key="'tl'+i" class="flex-1 text-center text-[10px] text-slate-400 truncate min-w-0">
                    {{ point.label }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Por persona: tabla -->
          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Rendimiento por persona</h3>
              <span class="text-[11px] text-slate-400">Cumplimiento, carga y vencidas</span>
            </header>
            <div v-if="kpiLoading" class="p-4"><Skeleton preset="table" :rows="5" /></div>
            <div v-else-if="kpiData.kpis.length === 0" class="empty-state">
              <div class="empty-state__icon"><i class="fas fa-users"></i></div>
              <p class="empty-state__title">Sin datos para el periodo</p>
              <p class="empty-state__text">Prueba con otro rango de fechas o actualiza los KPIs.</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-[13px] min-w-[560px]">
                <thead>
                  <tr class="text-[10.5px] uppercase tracking-[0.07em] text-slate-400 font-semibold">
                    <th class="text-left font-semibold px-4 py-2">Persona</th>
                    <th class="font-semibold px-3 py-2 w-40">Cumplimiento</th>
                    <th class="text-right font-semibold px-3 py-2">Hechas</th>
                    <th class="text-right font-semibold px-3 py-2">Pendientes</th>
                    <th class="text-right font-semibold px-3 py-2">Vencidas</th>
                    <th class="text-right font-semibold px-4 py-2">Resolución</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="kpi in kpiData.kpis" :key="kpi.user._id" class="hover:bg-slate-50/60 transition-colors">
                    <td class="px-4 py-2">
                      <div class="flex items-center gap-2.5 min-w-0">
                        <PersonAvatar :name="kpi.user.name" :photo="kpi.user.photo" class="w-7 h-7 rounded-lg bg-primary-50 text-[10px] font-black text-primary-600 shrink-0" />
                        <div class="min-w-0">
                          <p class="font-semibold text-slate-700 truncate">{{ kpi.user.name }}</p>
                          <p class="text-[11px] text-slate-400 truncate">{{ kpi.user.department || kpi.user.role }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-700" :class="rateBar(kpi.complianceRate, 70, 40)" :style="{ width: kpi.complianceRate + '%' }"></div>
                        </div>
                        <span class="w-10 text-right text-xs font-bold tabular-nums" :class="rateText(kpi.complianceRate, 70, 40)">{{ kpi.complianceRate }}%</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-right tabular-nums text-slate-700">{{ kpi.totalCompleted }}</td>
                    <td class="px-3 py-2 text-right tabular-nums text-slate-700">{{ kpi.currentWorkload }}</td>
                    <td class="px-3 py-2 text-right tabular-nums font-bold" :class="kpi.overdueCount > 0 ? 'text-rose-600' : 'text-slate-300'">{{ kpi.overdueCount }}</td>
                    <td class="px-4 py-2 text-right tabular-nums text-slate-500">{{ kpi.avgResolutionDays }} d</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div class="flex flex-col gap-4 min-w-0">

          <section v-if="kpiOverloaded.length > 0" class="bg-amber-50/60 border border-amber-200 rounded-2xl">
            <header class="flex items-center gap-2 px-4 py-3 border-b border-amber-100">
              <i class="fas fa-triangle-exclamation text-amber-600 text-xs"></i>
              <h3 class="text-sm font-extrabold text-amber-900">Sobrecarga</h3>
              <span class="ml-auto text-[11px] text-amber-700">{{ kpiOverloaded.length }}</span>
            </header>
            <ul class="divide-y divide-amber-100">
              <li v-for="m in kpiOverloaded" :key="m.user._id" class="flex items-center justify-between gap-2 px-4 py-2 text-[13px]">
                <span class="font-semibold text-amber-900 truncate">{{ m.user.name }}</span>
                <span class="shrink-0 text-[11px] tabular-nums text-amber-800">
                  {{ m.currentWorkload }} pend.<template v-if="m.overdueCount > 0"> · <span class="text-rose-600 font-bold">{{ m.overdueCount }} venc.</span></template>
                </span>
              </li>
            </ul>
          </section>

          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Carga pendiente</h3>
              <span class="text-[11px] text-slate-400">Tareas abiertas</span>
            </header>
            <div v-if="kpiSortedByWorkload.length === 0" class="empty-state empty-state--sm">
              <div class="empty-state__icon"><i class="fas fa-list-check"></i></div>
              <p class="empty-state__title">Sin carga registrada</p>
            </div>
            <table v-else class="w-full text-[13px]">
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(kpi, i) in kpiSortedByWorkload" :key="kpi.user._id">
                  <td class="pl-4 pr-2 py-2 w-8 text-[11px] font-bold text-slate-400 tabular-nums">{{ i + 1 }}</td>
                  <td class="px-2 py-2 min-w-0">
                    <p class="font-semibold text-slate-700 truncate">{{ kpi.user.name }}</p>
                    <div class="h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div class="h-full rounded-full bg-primary-500 transition-all duration-700" :style="{ width: workloadWidth(kpi.currentWorkload) }"></div>
                    </div>
                  </td>
                  <td class="pl-2 pr-4 py-2 text-right tabular-nums font-bold text-slate-700">{{ kpi.currentWorkload }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 class="text-sm font-extrabold text-slate-800">Horas registradas</h3>
              <span class="text-[11px] text-slate-400">{{ kpiPeriodLabel }}</span>
            </header>
            <div v-if="kpiSortedByHours.length === 0" class="empty-state empty-state--sm">
              <div class="empty-state__icon"><i class="fas fa-stopwatch"></i></div>
              <p class="empty-state__title">Sin horas registradas</p>
            </div>
            <table v-else class="w-full text-[13px]">
              <tbody class="divide-y divide-slate-100">
                <tr v-for="kpi in kpiSortedByHours" :key="'h'+kpi.user._id">
                  <td class="px-4 py-2 font-semibold text-slate-700 truncate">{{ kpi.user.name }}</td>
                  <td class="px-4 py-2 text-right tabular-nums font-bold text-slate-700 w-20">{{ kpi.hoursWorked }} h</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import Skeleton from '@/components/ui/Skeleton.vue'
import PersonAvatar from '../components/ui/PersonAvatar.vue'
import CustomSelect from '@/components/ui/CustomSelect.vue'
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { reportsService } from '../services/reportsService'
import { useNotifications } from '../composables/useNotifications'
import type {
  DashboardStats,
  FinancialData,
  ActivityStats,
  ClientStats,
  TeamPerformance,
  ExecutiveSummary
} from '../services/reportsService'
import { teamService } from '../services/teamService'
import { clientService } from '../services/clientService'
import { useTeamStore } from '../stores'
import { teamReportsService, type KPIResponse, type TrendPoint } from '../services/reportsService'

const { showError, showSuccess } = useNotifications()
const teamStore = useTeamStore()

// ── Page Tab ──
const activePageTab = ref<'reports' | 'kpis'>('reports')

// Register apexchart component globally in script setup isn't strictly needed if we just use the imported component
const apexchart = VueApexCharts

// State
const loading = ref(false)
const selectedPeriod = ref<'month' | 'quarter' | 'year'>('month')

const filters = ref({
  department: '',
  clientId: '',
  assignedTo: ''
})

const availableMembers = ref<any[]>([])
const clients = ref<any[]>([])
const departments = computed(() => {
  const depts = new Set(availableMembers.value.map(m => m.department).filter(Boolean))
  return Array.from(depts).sort()
})

const periods = [
  { value: 'month', label: 'Este Mes' },
  { value: 'quarter', label: 'Este Trimestre' },
  { value: 'year', label: 'Este Año' }
]

const periodOptions = computed(() => periods.map(p => ({ value: p.value, label: p.label })))
const periodLabel = computed(() => periods.find(p => p.value === selectedPeriod.value)?.label ?? '')

// Semáforo de cumplimiento: verde / ámbar / rojo según umbrales
const rateBar = (rate: number, good = 80, ok = 60) =>
  rate >= good ? 'bg-emerald-500' : rate >= ok ? 'bg-amber-500' : 'bg-rose-500'
const rateText = (rate: number, good = 80, ok = 60) =>
  rate >= good ? 'text-emerald-600' : rate >= ok ? 'text-amber-600' : 'text-rose-600'
const departmentOptions = computed(() => [
  { value: '', label: 'Todos los Equipos' },
  ...departments.value.map((dept: string) => ({ value: dept, label: dept }))
])
const clientOptions = computed(() => [
  { value: '', label: 'Todos los Clientes' },
  ...clients.value.map(client => ({ value: client._id, label: client.name }))
])
const memberOptions = computed(() => [
  { value: '', label: 'Todo el Personal' },
  ...availableMembers.value.map(member => ({ value: member._id, label: member.name }))
])

// API Data
const dashboardStats = ref<DashboardStats | null>(null)
const financialData = ref<FinancialData | null>(null)
const activityStats = ref<ActivityStats | null>(null)
const clientStats = ref<ClientStats | null>(null)
const teamPerformance = ref<TeamPerformance | null>(null)
const executiveSummary = ref<ExecutiveSummary | null>(null)

// Formatters
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return '$0'
  return '$' + new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

// --- Computed UI Data ---
const kpis = computed(() => [
  {
    label: 'Total Equipo',
    value: String(dashboardStats.value?.totals?.teamMembers ?? 0),
    icon: 'fas fa-id-badge',
    iconBg: 'bg-primary-50 border-primary-100',
    iconColor: 'text-primary-600',
    trend: 0
  },
  {
    label: 'Clientes Activos',
    value: String(dashboardStats.value?.totals?.clients ?? 0),
    icon: 'fas fa-users',
    iconBg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
    trend: executiveSummary.value?.growth?.clients ?? 0
  },
  {
    label: 'Actividades',
    value: String(dashboardStats.value?.monthly?.completedActivities ?? 0),
    icon: 'fas fa-check-circle',
    iconBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
    trend: executiveSummary.value?.growth?.activities ?? 0
  },
  {
    label: 'Casos Activos',
    value: String(dashboardStats.value?.totals?.cases ?? 0),
    icon: 'fas fa-folder-open',
    iconBg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600',
    trend: 0
  }
])

const executiveRows = computed(() => [
  { label: 'Nuevos clientes', value: String(executiveSummary.value?.kpis?.newClientsThisMonth ?? 0), growth: executiveSummary.value?.growth?.clients ?? 0, icon: 'fas fa-user-plus', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  { label: 'Actividades completadas', value: String(executiveSummary.value?.kpis?.completedThisMonth ?? 0), growth: executiveSummary.value?.growth?.activities ?? 0, icon: 'fas fa-check', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  { label: 'Total clientes', value: String(executiveSummary.value?.kpis?.totalClients ?? 0), growth: 0, icon: 'fas fa-building', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
])

const topClients = computed(() => {
  if (clientStats.value?.topActive?.length) {
    return clientStats.value.topActive.slice(0, 5).map((c: any) => ({
      name: c.clientName || 'Cliente sin nombre',
      activities: c.totalActivities,
      rate: Math.round(c.completionRate * 100)
    }))
  }
  return []
})

const teamMembers = computed(() => {
  if (teamPerformance.value?.performance?.length) {
    return teamPerformance.value.performance.map((m: any) => {
      // Improved fallback taking first name from availableMembers array
      const found = availableMembers.value.find(user => user._id === m._id) as any
      let name = m.teamMember?.name || m.teamMember?.nombre
      if (!name) {
        name = found?.name || `Miembro ${String(m._id).slice(-4)}`
      }
      const photo: string = m.teamMember?.photo || found?.photo || ""
      const parts = name.split(' ').filter(Boolean)
      const initials = parts.length >= 2 
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase()
        
      return {
        name,
        initials,
        photo,
        completed: m.completedActivities,
        total: m.totalActivities,
        rate: Math.round(m.completionRate || 0)
      }
    })
  }
  return []
})

const resolutionTime = computed(() => ({
  min: activityStats.value?.resolutionTime?.minResolutionTime ? Math.round(activityStats.value.resolutionTime.minResolutionTime) : 0,
  avg: activityStats.value?.resolutionTime?.avgResolutionTime ? Math.round(activityStats.value.resolutionTime.avgResolutionTime) : 0,
  max: activityStats.value?.resolutionTime?.maxResolutionTime ? Math.round(activityStats.value.resolutionTime.maxResolutionTime) : 0,
}))

const monthlyComparison = computed(() => [
  {
    label: 'Nuevos Clientes',
    current: executiveSummary.value?.kpis?.newClientsThisMonth ?? 0,
    previous: executiveSummary.value?.kpis?.newClientsLastMonth ?? 0,
    growth: executiveSummary.value?.growth?.clients ?? 0
  },
  {
    label: 'Actividades Completadas',
    current: executiveSummary.value?.kpis?.completedThisMonth ?? 0,
    previous: executiveSummary.value?.kpis?.completedLastMonth ?? 0,
    growth: executiveSummary.value?.growth?.activities ?? 0
  },
])

// -- ApexCharts Configuration --
// Paleta de la app: sky como acento, slate para lo neutro
const CHART_COLORS = {
  emerald: '#10b981',
  primary: '#0ea5e9',
  amber: '#f59e0b',
  red: '#ef4444',
  text: '#64748b'
}

// Donut Chart for Activities
const activitiesChartSeries = computed(() => {
  let completed = 142, inProgress = 28, pending = 34
  if (activityStats.value?.statusDistribution?.length) {
    completed = 0; inProgress = 0; pending = 0
    activityStats.value.statusDistribution.forEach((s: any) => {
      const id = (s._id || '').toLowerCase()
      if (id.includes('complet') || id.includes('finaliz')) completed += s.count
      else if (id.includes('progress') || id.includes('progreso')) inProgress += s.count
      else pending += s.count
    })
  }
  return [completed, inProgress, pending]
})

const activitiesChartOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: ['Completadas', 'En proceso', 'Pendientes'],
  colors: [CHART_COLORS.primary, '#7dd3fc', '#cbd5e1'],
  plotOptions: {
    pie: { donut: { size: '72%', labels: { show: true, name: { fontSize: '11px', color: CHART_COLORS.text }, value: { fontSize: '20px', fontWeight: 800, color: '#1e293b' } } } }
  },
  dataLabels: { enabled: false },
  stroke: { width: 2, colors: ['#fff'] },
  legend: { position: 'bottom', fontSize: '11px', fontWeight: 600, labels: { colors: CHART_COLORS.text }, markers: { radius: 12 } }
}))

// Bar Chart for Workload
const workloadChartSeries = computed(() => {
  let data = [5, 8, 4]
  if (teamPerformance.value?.currentWorkload?.length) {
    data = teamPerformance.value.currentWorkload.map((m: any) => m.activeWorkload)
  }
  return [{ name: 'Tareas Activas', data }]
})

const workloadChartOptions = computed(() => {
  let categories = ['Miembro 1', 'Miembro 2', 'Miembro 3']
  if (teamPerformance.value?.currentWorkload?.length) {
    categories = teamPerformance.value.currentWorkload.map((m: any) => {
      let name = m.teamMember?.name || m.teamMember?.nombre
      if (!name) {
        const found = availableMembers.value.find(user => user._id === m._id)
        name = found?.name || `U ${String(m._id).slice(-4)}`
      }
      return name
    })
  }
  return {
    chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: '42%' }
    },
    colors: [CHART_COLORS.primary],
    dataLabels: { enabled: false },
    tooltip: { y: { title: { formatter: () => 'Tareas activas' } } },
    legend: { show: false },
    xaxis: {
      categories,
      labels: { style: { colors: CHART_COLORS.text, fontSize: '10px', fontWeight: 600 } },
      axisBorder: { show: false }, axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: CHART_COLORS.text, fontSize: '10px', fontWeight: 600 } }
    },
    grid: { strokeDashArray: 4, borderColor: '#e2e8f0' }
  }
})

const loadData = async () => {
  loading.value = true
  try {
    if (availableMembers.value.length === 0) {
      const [, clientsData] = await Promise.all([
        teamStore.members.length === 0 ? teamStore.fetchTeam(1, 500) : Promise.resolve(),
        clientService.getAll()
      ])
      availableMembers.value = teamStore.members.length > 0
        ? teamStore.members
        : await teamService.getAll()
      clients.value = clientsData
    }

    const query = {
      period: selectedPeriod.value,
      ...filters.value
    }

    const [dash, fin, act, cli, team, exec] = await Promise.all([
      reportsService.getDashboardStats(query).catch(() => null),
      reportsService.getFinancialData(selectedPeriod.value).catch(() => null),
      reportsService.getActivityStats(query).catch(() => null),
      reportsService.getClientStats(query).catch(() => null),
      reportsService.getTeamPerformance(query).catch(() => null),
      reportsService.getExecutiveSummary(query).catch(() => null)
    ])
    dashboardStats.value = dash
    financialData.value = fin
    activityStats.value = act
    clientStats.value = cli
    teamPerformance.value = team
    executiveSummary.value = exec
  } catch (error) {
    console.error('Error loading reports:', error)
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadData()
  showSuccess('Reportes actualizados')
}

// ═══════════════════════════════════════════════════════════════════════════
// KPIs Tab
// ═══════════════════════════════════════════════════════════════════════════

const kpiPeriod = ref('month')
const kpiLoading = ref(false)
const kpiData = ref<KPIResponse>({ kpis: [], teamTotals: { totalItems: 0, totalCompleted: 0, avgCompliance: 0, avgResolution: 0, totalWorkload: 0, totalOverdue: 0, totalHours: 0 }, period: 'month', since: '' })
const weeklyTrends = ref<TrendPoint[]>([])
const monthlyTrends = ref<TrendPoint[]>([])
const kpiTrendsLoading = ref(false)
const kpiTrendTab = ref<'weekly' | 'monthly'>('weekly')

const kpiPeriods = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Año' },
]
const kpiPeriodLabel = computed(() => {
  const labels: Record<string, string> = { week: 'Esta semana', month: 'Este mes', quarter: 'Este trimestre', year: 'Este año' }
  return labels[kpiPeriod.value] ?? ''
})

const kpiStatCards = computed(() => {
  const t = kpiData.value.teamTotals
  return [
    { label: 'Completadas', value: t.totalCompleted, valueColor: 'text-slate-900', icon: 'fa-check-circle', iconBg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-600' },
    { label: 'Cumplimiento', value: t.avgCompliance + '%', valueColor: t.avgCompliance >= 70 ? 'text-emerald-600' : t.avgCompliance >= 40 ? 'text-amber-600' : 'text-red-600', icon: 'fa-bullseye', iconBg: 'bg-blue-50 border-blue-100', iconColor: 'text-blue-600' },
    { label: 'Resolución', value: t.avgResolution, suffix: 'días', valueColor: 'text-slate-900', icon: 'fa-clock', iconBg: 'bg-slate-100 border-slate-200', iconColor: 'text-slate-600' },
    { label: 'Pendientes', value: t.totalWorkload, valueColor: 'text-slate-900', icon: 'fa-clipboard-list', iconBg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-600' },
    { label: 'Vencidas', value: t.totalOverdue, valueColor: t.totalOverdue > 0 ? 'text-red-600' : 'text-slate-900', icon: 'fa-exclamation-triangle', iconBg: t.totalOverdue > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-100 border-slate-200', iconColor: t.totalOverdue > 0 ? 'text-red-600' : 'text-slate-400' },
    { label: 'Horas', value: t.totalHours, suffix: 'h', valueColor: 'text-slate-900', icon: 'fa-stopwatch', iconBg: 'bg-purple-50 border-purple-100', iconColor: 'text-purple-600' },
  ]
})

const kpiOverloaded = computed(() => kpiData.value.kpis.filter(k => k.currentWorkload > 10 || k.overdueCount > 3))
const kpiSortedByWorkload = computed(() => [...kpiData.value.kpis].sort((a, b) => b.currentWorkload - a.currentWorkload).slice(0, 8))
const kpiSortedByHours = computed(() => [...kpiData.value.kpis].filter(k => k.hoursWorked > 0).sort((a, b) => b.hoursWorked - a.hoursWorked).slice(0, 8))
const kpiCurrentTrend = computed(() => kpiTrendTab.value === 'weekly' ? weeklyTrends.value : monthlyTrends.value)

function workloadWidth(value: number) {
  const max = Math.max(...kpiSortedByWorkload.value.map(k => k.currentWorkload), 1)
  return Math.min((value / max) * 100, 100) + '%'
}

function kpiTrendBarHeight(value: number) {
  const max = Math.max(...kpiCurrentTrend.value.map(p => p.completed), 1)
  return Math.max((value / max) * 100, 3) + '%'
}

async function fetchKPIs() {
  kpiLoading.value = true
  try {
    kpiData.value = await teamReportsService.getKPIs(kpiPeriod.value)
  } catch (e) { console.error('Error fetching KPIs:', e) }
  finally { kpiLoading.value = false }
}

async function fetchKPITrends() {
  kpiTrendsLoading.value = true
  try {
    const [w, m] = await Promise.all([
      teamReportsService.getWeeklyTrends(),
      teamReportsService.getMonthlyTrends(),
    ])
    weeklyTrends.value = w
    monthlyTrends.value = m
  } catch (e) { console.error('Error fetching trends:', e) }
  finally { kpiTrendsLoading.value = false }
}

// ── Email Report Panel ──
const reportEmail = ref('')
const reportPeriod = ref('week')
const sendingReport = ref(false)
const reportMsg = ref('')
const reportMsgType = ref<'ok' | 'err'>('ok')

const scheduleEnabled = ref(false)
const scheduleFrequency = ref('weekly')
const scheduleDayOfWeek = ref(1)
const scheduleHour = ref(8)
const scheduleMinute = ref(0)
const scheduleLastRun = ref<string | null>(null)

async function loadScheduleConfig() {
  try {
    const cfg = await teamReportsService.getScheduleConfig()
    scheduleEnabled.value = cfg.enabled
    scheduleFrequency.value = cfg.frequency
    scheduleDayOfWeek.value = cfg.dayOfWeek
    scheduleHour.value = cfg.hour
    scheduleMinute.value = cfg.minute
    scheduleLastRun.value = cfg.lastRun
  } catch {}
}

async function sendManualReport() {
  sendingReport.value = true
  reportMsg.value = ''
  try {
    const recipients = reportEmail.value.split(',').map(e => e.trim()).filter(Boolean)
    const result = await teamReportsService.sendTeamReport({
      recipients: recipients.length > 0 ? recipients : undefined,
      period: reportPeriod.value
    })
    reportMsg.value = result.success ? 'Reporte enviado correctamente' : (result.error || 'Error al enviar')
    reportMsgType.value = result.success ? 'ok' : 'err'
  } catch (e: any) {
    reportMsg.value = e.message || 'Error al enviar el reporte'
    reportMsgType.value = 'err'
  } finally {
    sendingReport.value = false
    setTimeout(() => { reportMsg.value = '' }, 5000)
  }
}

async function toggleSchedule() {
  scheduleEnabled.value = !scheduleEnabled.value
  await saveSchedule()
}

async function saveSchedule() {
  try {
    await teamReportsService.updateScheduleConfig({
      enabled: scheduleEnabled.value,
      frequency: scheduleFrequency.value as any,
      dayOfWeek: scheduleDayOfWeek.value,
      hour: scheduleHour.value,
      minute: scheduleMinute.value,
      period: reportPeriod.value,
    })
  } catch (e) {
    console.error('Error saving schedule:', e)
  }
}

watch(activePageTab, (tab) => {
  if (tab === 'kpis') {
    if (kpiData.value.kpis.length === 0) fetchKPIs()
    if (weeklyTrends.value.length === 0 && monthlyTrends.value.length === 0) fetchKPITrends()
  }
})

onMounted(() => { loadData(); loadScheduleConfig() })
</script>
