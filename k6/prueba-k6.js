import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    carga_concurrente: {
      executor: 'per-vu-iterations',
      vus: 5,          // 5 usuarios virtuales concurrentes
      iterations: 2,   // 2 iteraciones por usuario
      maxDuration: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'], // RNF-01 / RNF-02: < 3 segundos
    http_req_failed: ['rate<0.01'],    // Sin errores críticos
  },
};

const SUPABASE_URL = 'https://czafdbsfagyewfhvujjk.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_wFP8zlLKA8rs-LS5RglnCA_IfG6TVaM';

const headers = {
  'apikey': SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Accept-Profile': 'public',
};

export default function () {
  // 1. Consulta de paciente por DNI (RF-02)
  const resPaciente = http.get(
    `${SUPABASE_URL}/pacientes?select=*&dni=eq.12345678`,
    { headers }
  );

  check(resPaciente, {
    'Consulta paciente status 200': (r) => r.status === 200,
    'Tiempo paciente < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(0.5);

  // 2. Consulta de citas programadas (RF-05)
  const resCitas = http.get(
    `${SUPABASE_URL}/citas?select=*&estado=eq.PROGRAMADA`,
    { headers }
  );

  check(resCitas, {
    'Consulta citas status 200': (r) => r.status === 200,
    'Tiempo citas < 3s': (r) => r.timings.duration < 3000,
  });

  sleep(0.5);
}