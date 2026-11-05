// Datos del sitio que se cambian a mano (sin tocar componentes).
export const site = {
  /** Plazas por grupo */
  cap: 10,
  /** Plazas ya ocupadas en el grupo actual. Con 3 o menos libres la web entra en modo «quedan pocas»; con 0, «cupo completo». */
  taken: 7,
  /** Cierre del grupo 2027 (hora de Madrid). La cuenta atrás nunca se reinicia. */
  deadline: '2026-11-15T23:59:59+01:00',
  /** PENDIENTE: número español (+34). Mientras tanto, el de siempre. */
  phone: '+51 903 300 422',
  phoneE164: '51903300422',
  /** Grupo que se abre después del actual (texto del cupo completo) */
  nextGroup: 'mayo 2027',
};

/** Enlace de WhatsApp con el mensaje ya escrito */
export const wa = (text: string) => `https://wa.me/${site.phoneE164}?text=${encodeURIComponent(text)}`;
