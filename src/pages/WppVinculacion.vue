<template>
  <div class="wpp-vinculacion">
    <h2>Vincular WhatsApp Business</h2>
    <div v-if="loading" class="estado">Cargando QR...</div>
    <div v-else-if="qr">
      <p>Escanea este código QR con tu WhatsApp Business para vincular el dispositivo:</p>
      <qrcode-vue v-if="qr" :value="qr" :size="300" class="qr-img" style="display:block;margin:auto;" />
      <button @click="fetchQR" class="btn">Refrescar QR</button>
      <button @click="resetSession" class="btn" style="background:#e74c3c;margin-left:8px;">Resetear sesión</button>
      <div v-if="errorMsg" class="estado estado-error" style="margin-top:16px;">{{ errorMsg }}</div>
    </div>
    <div v-else-if="ready" class="estado estado-listo">
      <span class="icon-check">✔️</span> Dispositivo vinculado y listo para enviar notificaciones.<br>
      <button @click="resetSession" class="btn" style="background:#e74c3c;margin-top:16px;">Resetear sesión</button>
      <div v-if="errorMsg" class="estado estado-error" style="margin-top:16px;">{{ errorMsg }}</div>
    </div>
    <div v-else class="estado estado-error">
      <span class="icon-error">❌</span> No se pudo obtener el QR. Intenta de nuevo.
      <button @click="fetchQR" class="btn">Reintentar</button>
      <button @click="resetSession" class="btn" style="background:#e74c3c;margin-left:8px;">Resetear sesión</button>
      <div v-if="errorMsg" class="estado estado-error" style="margin-top:16px;">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script>
import QrcodeVue from 'qrcode.vue';
export default {
  name: 'WppVinculacion',
  components: {
    QrcodeVue
  },
  data() {
    return {
      qr: null,
      ready: false,
      loading: true,
      errorMsg: ''
    };
  },
  methods: {
    async fetchQR() {
      this.loading = true;
      this.qr = null;
      this.ready = false;
      this.errorMsg = '';
      try {
  const res = await fetch('https://back-crm-ahcmawg9bnczgad6.canadacentral-01.azurewebsites.net/api/wpp-qr');
        const data = await res.json();
        if (data.qr) {
          this.qr = data.qr;
          this.ready = false;
        } else if (data.status === 'ready') {
          this.qr = null;
          this.ready = true;
        } else {
          this.qr = null;
          this.ready = false;
          this.errorMsg = data.error || 'No se pudo obtener el QR.';
        }
      } catch (e) {
        this.qr = null;
        this.ready = false;
        this.errorMsg = e.message || 'Error de conexión.';
      }
      this.loading = false;
    },
    async resetSession() {
      this.loading = true;
      this.errorMsg = '';
      try {
  const res = await fetch('https://back-crm-ahcmawg9bnczgad6.canadacentral-01.azurewebsites.net/api/wpp-reset', { method: 'POST' });
        const data = await res.json();
        if (data.reset) {
          this.qr = null;
          this.ready = false;
          await this.fetchQR();
        } else if (data.error) {
          this.errorMsg = data.error;
        }
      } catch (e) {
        this.errorMsg = e.message || 'Error al resetear sesión.';
      }
      this.loading = false;
    },
    async pollStatus() {
      try {
  const res = await fetch('https://back-crm-ahcmawg9bnczgad6.canadacentral-01.azurewebsites.net/api/wpp-status');
        const data = await res.json();
        this.ready = !!data.ready;
        // Si la sesión se cae, refrescar QR automáticamente
        if (!data.ready) {
          await this.fetchQR();
        }
      } catch (e) {
        // Si hay error, no cambiar estado
      }
    }
  },
  mounted() {
    this.fetchQR();
    this.statusInterval = setInterval(this.pollStatus, 10000);
  },
  beforeDestroy() {
    if (this.statusInterval) clearInterval(this.statusInterval);
  },
};
</script>

<style scoped>
.wpp-vinculacion {
  max-width: 400px;
  margin: 40px auto;
  padding: 32px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(125,90,238,0.08);
  text-align: center;
}
.qr-img {
  margin: 18px 0;
  width: 300px;
  height: 300px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(125,90,238,0.10);
}
.btn {
  background: #7d5aee;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 22px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
}
.estado {
  margin: 24px 0;
  font-size: 1.1rem;
}
.estado-listo {
  color: #2ecc40;
}
.estado-error {
  color: #e74c3c;
}
.icon-check {
  font-size: 2rem;
}
.icon-error {
  font-size: 2rem;
}
</style>
