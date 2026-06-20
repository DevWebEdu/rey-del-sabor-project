import { createContext, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const DEFAULT_CONFIG = {
  nombre_local:    'El Rey del Sabor',
  whatsapp:        '51999999999',
  telefono:        '+51 999 999 999',
  direccion:       'Av. Principal 123, Lima, Perú',
  horario_semana:  '11:00 am – 10:00 pm',
  horario_sabado:  '11:00 am – 11:00 pm',
  horario_domingo: '11:00 am – 10:00 pm',
  horario_resumen: 'Lun–Dom · 11am–10pm',
  delivery_tiempo: '30–40 min',
  delivery_radio:  '2 km',
  pedido_minimo:   '24',
};

const ConfigContext = createContext(DEFAULT_CONFIG);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setConfig(c => ({ ...c, ...data })); })
      .catch(() => {});
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);
