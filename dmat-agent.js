(function(){
if (window.__dmatAgentLoaded) return;
window.__dmatAgentLoaded = true;

const CONFIG = window.DMAT_AGENT || {};
const AGENT_NAME_CFG = CONFIG.agentName || "Elena";
const STORE_URL = CONFIG.storeUrl || "https://demoiatoi.com";

// ═══════════════════════════════════════════════════════════════
//  GOOGLE FONTS (global document head, not shadow-scoped)
// ═══════════════════════════════════════════════════════════════
(function injectFonts(){
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap";
  document.head.appendChild(link);
})();

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════
const STYLES = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:host{
  --rose:#4a7fa5;--rose-light:#b8d4e8;--rose-dark:#2c5f7a;
  --cream:#f0f5f9;--sand:#dceaf3;--warm-gray:#6b8fa3;
  --dark:#1a2e3a;--white:#ffffff;
  --shadow:0 8px 32px rgba(45,35,32,.12);
  --radius:18px;--radius-sm:10px;
  --font-display:'Playfair Display',serif;--font-body:'DM Sans',sans-serif;
  all: initial;
}
/* CHAT */
.chat-widget{position:fixed;bottom:20px;right:20px;z-index:999999;width:100%;max-width:420px;background:var(--white);border-radius:var(--radius);box-shadow:var(--shadow),0 2px 8px rgba(232,131,122,.15);flex-direction:column;overflow:hidden;height:620px;display:none;font-family:var(--font-body);color:var(--dark)}
.chat-widget.dmat-open{display:flex}
@media (max-width:480px){
  .chat-widget{width:calc(100vw - 24px);height:calc(100vh - 90px);right:12px;bottom:80px;max-width:none}
}
.chat-header{background:linear-gradient(135deg,var(--rose-dark) 0%,var(--rose) 100%);padding:18px 20px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0}
.avatar-wrap{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:1.25rem;border:2px solid rgba(255,255,255,.4);flex-shrink:0;position:relative}
.avatar-wrap::after{content:'';position:absolute;bottom:1px;right:1px;width:9px;height:9px;background:#4ade80;border-radius:50%;border:2px solid var(--rose)}
.chat-header-info{flex:1;min-width:0}
.chat-header-info strong{display:block;color:var(--white);font-size:.95rem;font-weight:600;font-family:var(--font-display)}
.chat-header-info span{color:rgba(255,255,255,.78);font-size:.75rem}
.header-badge{background:rgba(255,255,255,.2);color:var(--white);font-size:.68rem;padding:3px 9px;border-radius:20px;border:1px solid rgba(255,255,255,.3);flex-shrink:0}
.sound-toggle{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:var(--white);font-size:.95rem;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .2s;line-height:1}
.sound-toggle:hover{background:rgba(255,255,255,.32)}
.dmat-close-btn{background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:var(--white);font-size:.85rem;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .2s;line-height:1}
.dmat-close-btn:hover{background:rgba(255,255,255,.32)}
.messages-area{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:14px;scroll-behavior:smooth}
.messages-area::-webkit-scrollbar{width:4px}
.messages-area::-webkit-scrollbar-thumb{background:var(--rose-light);border-radius:4px}
.bubble-row{display:flex;align-items:flex-end;gap:8px;animation:slideIn .28s ease-out}
@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.bubble-row.user{flex-direction:row-reverse}
.bubble-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--rose-light),var(--rose));display:flex;align-items:center;justify-content:center;font-size:.75rem;flex-shrink:0}
.bubble-row.user .bubble-avatar{background:linear-gradient(135deg,#dde8f5,#a0b4cc)}
.avatar-wrap img,.bubble-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.bubble{max-width:82%;padding:11px 15px;border-radius:18px;font-size:.875rem;line-height:1.55;word-break:break-word}
.bubble-row.agent .bubble{background:var(--sand);color:var(--dark);border-bottom-left-radius:5px}
.bubble-row.user .bubble{background:linear-gradient(135deg,var(--rose-dark),var(--rose));color:var(--white);border-bottom-right-radius:5px}
.bubble-time{font-size:.65rem;color:var(--warm-gray);margin-top:4px}
.bubble-row.agent .bubble-time{text-align:left}
.bubble-row.user .bubble-time{text-align:right}
/* Producto cards */
.product-cards{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.product-card{background:var(--white);border:1.5px solid var(--sand);border-radius:var(--radius-sm);padding:10px 12px;display:flex;gap:10px;align-items:center;cursor:pointer;transition:border-color .2s,box-shadow .2s,transform .15s;text-decoration:none}
.product-card:hover{border-color:var(--rose-light);box-shadow:0 4px 14px rgba(232,131,122,.18);transform:translateY(-1px)}
.product-card img{width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;background:var(--sand)}
.pc-info{flex:1;min-width:0}
.pc-name{font-size:.82rem;font-weight:500;color:var(--dark);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pc-price{font-size:.85rem;font-weight:600;color:var(--rose-dark);margin-top:3px}
.pc-why{font-size:.72rem;color:var(--warm-gray);margin-top:2px;line-height:1.3}
.pc-cta{display:inline-block;margin-top:4px;font-size:.72rem;color:var(--rose);font-weight:500}
/* Botones de enlace en mensajes (ej. estado de pedido) */
.msg-links{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.msg-link-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,var(--rose-dark),var(--rose));color:#fff!important;padding:9px 14px;border-radius:20px;font-size:.8rem;font-weight:600;text-decoration:none;transition:opacity .2s,transform .15s}
.msg-link-btn:hover{opacity:.9;transform:translateY(-1px)}
/* Quick replies */
.quick-replies{display:flex;flex-wrap:wrap;gap:7px;margin-top:2px}
.qr-btn{background:var(--white);border:1.5px solid var(--rose-light);color:var(--rose-dark);padding:6px 13px;border-radius:20px;font-size:.78rem;cursor:pointer;font-family:var(--font-body);font-weight:500;transition:background .18s,border-color .18s,transform .12s;white-space:nowrap}
.qr-btn:hover{background:var(--rose-light);border-color:var(--rose);transform:translateY(-1px)}
/* Typing */
.typing-indicator{display:flex;align-items:center;gap:5px;padding:11px 15px;background:var(--sand);border-radius:18px;border-bottom-left-radius:5px;width:fit-content}
.typing-dot{width:6px;height:6px;background:var(--warm-gray);border-radius:50%;animation:typingBounce 1.2s infinite}
.typing-dot:nth-child(2){animation-delay:.2s}
.typing-dot:nth-child(3){animation-delay:.4s}
@keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
/* Input */
.input-area{padding:14px 16px 16px;background:var(--white);border-top:1.5px solid var(--sand);flex-shrink:0}
.input-row{display:flex;gap:10px;align-items:flex-end}
.chat-input{flex:1;border:1.5px solid var(--sand);border-radius:24px;padding:10px 16px;font-size:.875rem;font-family:var(--font-body);color:var(--dark);background:var(--cream);outline:none;resize:none;max-height:96px;min-height:42px;line-height:1.5;transition:border-color .2s}
.chat-input:focus{border-color:var(--rose)}
.chat-input::placeholder{color:var(--warm-gray)}
.send-btn{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--rose-dark),var(--rose));border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s,opacity .2s;color:white}
.send-btn:hover{transform:scale(1.06)}
.send-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.attach-btn{width:42px;height:42px;border-radius:50%;background:var(--cream);border:1.5px solid var(--sand);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;color:var(--warm-gray);transition:background .15s,border-color .15s,color .15s}
.attach-btn:hover{border-color:var(--rose);color:var(--rose-dark)}
.attach-btn:disabled{opacity:.5;cursor:not-allowed}
.image-preview{display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 10px;background:var(--cream);border-radius:12px;border:1.5px solid var(--sand)}
.image-preview img{width:40px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0}
.image-preview span{font-size:.78rem;color:var(--warm-gray)}
.image-preview button{margin-left:auto;background:none;border:none;color:var(--warm-gray);cursor:pointer;font-size:1rem;padding:4px;line-height:1}
.image-preview button:hover{color:var(--rose-dark)}
.msg-image{max-width:180px;max-height:180px;border-radius:12px;display:block;margin-bottom:6px;object-fit:cover}
.powered-by{text-align:center;font-size:.65rem;color:var(--warm-gray);margin-top:8px;opacity:.7}
/* BOTÓN ANDREA */
.andrea-bar{
  padding:10px 16px;
  background:var(--white);
  border-top:1.5px solid var(--sand);
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:center;
}
.andrea-btn{
  display:flex;
  align-items:center;
  gap:8px;
  background:transparent;
  border:1.5px solid var(--rose);
  color:var(--rose-dark);
  border-radius:20px;
  padding:7px 16px;
  font-size:.78rem;
  font-family:var(--font-body);
  font-weight:600;
  cursor:pointer;
  transition:background .18s, transform .12s;
  width:100%;
  justify-content:center;
}
.andrea-btn:hover{background:var(--rose-light);transform:translateY(-1px)}
.andrea-dot{width:8px;height:8px;background:#f59e0b;border-radius:50%;flex-shrink:0;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

/* MODAL */
.modal-overlay{
  position:absolute;inset:0;
  background:rgba(26,46,58,.55);
  display:flex;align-items:center;justify-content:center;
  z-index:999;
  border-radius:var(--radius);
  animation:fadeIn .2s ease;
}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-box{
  background:var(--white);
  border-radius:var(--radius);
  padding:24px 20px;
  max-width:340px;
  width:90%;
  box-shadow:0 20px 60px rgba(0,0,0,.2);
  text-align:center;
}
.modal-icon{font-size:2.2rem;margin-bottom:12px;display:block}
.modal-box h3{font-family:var(--font-display);font-size:1.1rem;color:var(--dark);margin-bottom:10px}
.modal-box p{font-size:.84rem;color:var(--warm-gray);line-height:1.6;margin-bottom:18px}
.modal-box p strong{color:var(--dark)}
.modal-actions{display:flex;flex-direction:column;gap:8px}
.modal-btn-yes{
  background:linear-gradient(135deg,var(--rose-dark),var(--rose));
  color:white;border:none;border-radius:var(--radius-sm);
  padding:10px;font-size:.85rem;font-weight:600;
  font-family:var(--font-body);cursor:pointer;
  transition:opacity .2s;
}
.modal-btn-yes:hover{opacity:.9}
.modal-btn-no{
  background:transparent;border:1.5px solid var(--sand);
  color:var(--warm-gray);border-radius:var(--radius-sm);
  padding:10px;font-size:.85rem;font-weight:500;
  font-family:var(--font-body);cursor:pointer;
  transition:background .18s;
}
.modal-btn-no:hover{background:var(--sand)}

/* EMAIL GATE */
.email-gate{padding:24px 16px;display:flex;flex-direction:column;gap:16px;flex:1;justify-content:center;overflow-y:auto}
.gate-step{display:none;flex-direction:column;gap:12px;animation:slideIn .25s ease}
.gate-step.active{display:flex}
.gate-logo{text-align:center;font-size:2rem;margin-bottom:4px}
.gate-title{font-family:var(--font-display);font-size:1.1rem;color:var(--dark);text-align:center;line-height:1.4}
.gate-subtitle{font-size:.82rem;color:var(--warm-gray);text-align:center}
.email-field{border:1.5px solid var(--sand);border-radius:24px;padding:11px 18px;font-size:.875rem;font-family:var(--font-body);color:var(--dark);background:var(--cream);outline:none;transition:border-color .2s;text-align:center;width:100%}
.email-field:focus{border-color:var(--rose)}
.email-field::placeholder{color:var(--warm-gray)}
.email-submit{background:linear-gradient(135deg,var(--rose-dark),var(--rose));color:white;border:none;border-radius:24px;padding:11px;font-size:.875rem;font-weight:600;font-family:var(--font-body);cursor:pointer;transition:opacity .2s,transform .15s;width:100%}
.email-submit:hover{opacity:.9;transform:translateY(-1px)}
.email-error{font-size:.75rem;color:#dc2626;text-align:center;display:none}
/* Opciones cómo nos conociste */
.source-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.source-btn{background:var(--white);border:1.5px solid var(--sand);border-radius:12px;padding:10px 8px;font-size:.78rem;font-family:var(--font-body);color:var(--dark);cursor:pointer;transition:all .18s;text-align:center;line-height:1.3}
.source-btn:hover{border-color:var(--rose-light);background:var(--sand)}
.source-btn.selected{border-color:var(--rose);background:var(--rose-light);color:var(--rose-dark);font-weight:600}
/* VALORACIÓN */
.rating-overlay{position:absolute;inset:0;background:rgba(26,46,58,.6);display:none;align-items:center;justify-content:center;z-index:99;border-radius:var(--radius)}
.rating-overlay.show{display:flex}
.rating-box{background:var(--white);border-radius:var(--radius);padding:24px 20px;max-width:320px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.rating-icon{font-size:2rem;margin-bottom:8px}
.rating-title{font-family:var(--font-display);font-size:1rem;color:var(--dark);margin-bottom:6px;line-height:1.4}
.rating-subtitle{font-size:.78rem;color:var(--warm-gray);margin-bottom:16px}
.stars{display:flex;justify-content:center;gap:8px;margin-bottom:14px}
.star{font-size:2rem;cursor:pointer;transition:transform .15s;filter:grayscale(1);opacity:.4}
.star:hover,.star.active{filter:grayscale(0);opacity:1;transform:scale(1.15)}
.rating-comment{width:100%;border:1.5px solid var(--sand);border-radius:10px;padding:10px 12px;font-size:.82rem;font-family:var(--font-body);color:var(--dark);background:var(--cream);outline:none;resize:none;transition:border-color .2s;margin-bottom:12px}
.rating-comment:focus{border-color:var(--rose)}
.rating-submit{width:100%;background:linear-gradient(135deg,var(--rose-dark),var(--rose));color:white;border:none;border-radius:10px;padding:10px;font-size:.85rem;font-weight:600;font-family:var(--font-body);cursor:pointer;transition:opacity .2s}
.rating-submit:hover{opacity:.9}
.rating-skip{background:none;border:none;color:var(--warm-gray);font-size:.75rem;cursor:pointer;margin-top:8px;font-family:var(--font-body);text-decoration:underline}
.rating-thanks{font-size:.9rem;color:var(--dark);padding:8px 0}

/* FAB */
.dmat-fab{
  position:fixed;bottom:20px;right:20px;z-index:999998;
  width:60px;height:60px;border-radius:50%;
  background:linear-gradient(135deg,var(--rose-dark),var(--rose));
  border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  box-shadow:var(--shadow),0 2px 8px rgba(232,131,122,.25);
  font-size:1.6rem;color:white;
  transition:transform .15s;
  font-family:var(--font-body);
  overflow:hidden;
}
.dmat-fab:hover{transform:scale(1.06)}
.dmat-fab img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.dmat-fab.dmat-hidden{display:none}
@media (max-width:480px){
  .dmat-fab{bottom:16px;right:16px;width:54px;height:54px;font-size:1.4rem}
}
`;

// ═══════════════════════════════════════════════════════════════
//  HTML
// ═══════════════════════════════════════════════════════════════
const HTML = `
<div class="dmat-fab" id="dmatFab" title="Chatea con nosotras">💬</div>

<div class="chat-widget" id="chatWidget">
  <div class="chat-header">
    <div class="avatar-wrap" id="agentAvatarWrap">🎁</div>
    <div class="chat-header-info">
      <strong id="agentNameDisplay">Elena · De Moi à Toi</strong>
      <span>Aquí para ayudarte a encontrar el regalo perfecto ✨</span>
    </div>
    <button class="sound-toggle" id="soundToggle" title="Silenciar/activar sonido de notificaciones">🔊</button>
    <button class="dmat-close-btn" id="dmatCloseBtn" title="Cerrar chat">✕</button>
    <div class="header-badge">En línea</div>
  </div>
  <!-- EMAIL GATE -->
  <div class="email-gate" id="emailGate">
    <!-- PASO 1: Email -->
    <div class="gate-step active" id="gateStep1">
      <div class="gate-logo" id="gateLogo1">🎁</div>
      <div class="gate-title">¡Hola! Para poder ayudarte mejor y hacer seguimiento de tu consulta, necesito tu email 😊</div>
      <input class="email-field" type="email" id="emailInput" placeholder="tu@email.com">
      <button class="email-submit" id="gateStep1Submit">Continuar →</button>
      <div class="email-error" id="emailError">Por favor introduce un email válido</div>
    </div>
    <!-- PASO 2: Cómo nos conociste -->
    <div class="gate-step" id="gateStep2">
      <div class="gate-logo">🌟</div>
      <div class="gate-title">¿Cómo nos conociste?</div>
      <div class="gate-subtitle">Nos ayuda a saber dónde encontrarte 😊</div>
      <div class="source-options">
        <button class="source-btn" data-source="Instagram">📸 Instagram</button>
        <button class="source-btn" data-source="Google">🔍 Google</button>
        <button class="source-btn" data-source="Recomendación">💬 Me lo recomendaron</button>
        <button class="source-btn" data-source="Ya era clienta">💛 Ya era clienta</button>
        <button class="source-btn" data-source="Pinterest">📌 Pinterest</button>
        <button class="source-btn" data-source="Otro">✨ Otro</button>
      </div>
      <button class="email-submit" id="sourceSubmit" style="opacity:.5;pointer-events:none">Empezar a chatear →</button>
    </div>
  </div>

  <!-- VALORACIÓN -->
  <div class="rating-overlay" id="ratingOverlay">
    <div class="rating-box">
      <div class="rating-icon">⭐</div>
      <div class="rating-title">Déjanos tu valoración sobre la atención recibida para ayudarnos a mejorar</div>
      <div class="rating-subtitle">¿Cómo ha sido tu experiencia hoy?</div>
      <div class="stars" id="starsRow">
        <span class="star" data-star="1">⭐</span>
        <span class="star" data-star="2">⭐</span>
        <span class="star" data-star="3">⭐</span>
        <span class="star" data-star="4">⭐</span>
        <span class="star" data-star="5">⭐</span>
      </div>
      <textarea class="rating-comment" id="ratingComment" rows="2" placeholder="Comentario opcional..."></textarea>
      <button class="rating-submit" id="ratingSubmitBtn">Enviar valoración</button>
      <br><button class="rating-skip" id="ratingSkipBtn">Omitir</button>
    </div>
  </div>

  <div class="messages-area" id="messagesArea" style="display:none"></div>
  <div class="input-area" id="inputArea" style="display:none">
    <div class="image-preview" id="imagePreview" style="display:none">
      <img id="previewImg" src="" alt="Imagen adjunta">
      <span>Imagen adjunta</span>
      <button id="clearImageBtn" title="Quitar imagen">✕</button>
    </div>
    <div class="input-row">
      <input type="file" id="fileInput" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none">
      <button class="attach-btn" id="attachBtn" title="Adjuntar imagen o captura">📎</button>
      <textarea class="chat-input" id="chatInput" placeholder="Escríbeme lo que necesitas..." rows="1"></textarea>
      <button class="send-btn" id="sendBtn" title="Enviar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
    <p class="powered-by">Asistido por IA · De Moi à Toi Regalos</p>
  </div>
  <div class="andrea-bar">
    <button class="andrea-btn" id="andreaBarBtn">
      <span class="andrea-dot"></span>
      Hablar con Andrea
    </button>
  </div>

  <!-- MODAL ANDREA -->
  <div class="modal-overlay" id="andreaModal" style="display:none">
    <div class="modal-box">
      <span class="modal-icon">👩‍💼</span>
      <h3>¿Quieres hablar con Andrea?</h3>
      <p>Andrea puede demorarse en responder ya que está preparando pedidos urgentes.<br><br>
      Te recomendamos usar <strong>este chat</strong> o escribir a <strong>contacto@demoiatoi.es</strong> para una respuesta más rápida.<br><br>
      ¿Sigues queriendo contactar con ella?</p>
      <div class="modal-actions">
        <button class="modal-btn-yes" id="waitForAndreaBtn">⏳ Esperar a que Andrea se una</button>
        <button class="modal-btn-yes" style="background:linear-gradient(135deg,#1a5276,#2e86c1);margin-top:2px" id="contactAndreaEmailBtn">✉️ Escribir por Email</button>
        <button class="modal-btn-no" id="closeAndreaModalBtn">No, usaré el chat</button>
      </div>
    </div>
  </div>

</div>
`;

// ═══════════════════════════════════════════════════════════════
//  SHADOW DOM SETUP
// ═══════════════════════════════════════════════════════════════
const host = document.createElement('div');
host.id = 'dmat-agent-host';
document.body.appendChild(host);
const root = host.attachShadow({ mode: 'open' });

const styleEl = document.createElement('style');
styleEl.textContent = STYLES;
root.appendChild(styleEl);

const wrapper = document.createElement('div');
wrapper.innerHTML = HTML;
root.appendChild(wrapper);

// DOM query helpers (shadow-scoped)
const $ = (id) => root.getElementById(id);
const $q = (sel) => root.querySelector(sel);
const $qa = (sel) => root.querySelectorAll(sel);

// ═══════════════════════════════════════════════════════════════
//  SUPABASE — para recibir respuestas de Andrea en tiempo real
// ═══════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://tjsvgvcfddwbtnadxbhh.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqc3ZndmNmZGR3YnRuYWR4YmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNTMzMTYsImV4cCI6MjA5MzkyOTMxNn0.GtAOjajdcU1A_bSCGKuE3EyVKe5MTCk2dAytyu2s41g'

let _andreaActive = false
let _waitingTimer = null
let _lastActivityTime = Date.now()
let _pollTimer = null
let _lastUserMsgTime = Date.now()
let _closingStage = 0 // 0=normal, 1=avisado, 2=aviso de cierre, 3=resuelta
let _inactivityTimer = null
let _pausedForAndrea = false
let _andreaWaitActive = false
let _andreaWaitCount = 0

function startPolling() {
  if (_pollTimer) return
  _pollTimer = setInterval(checkAndreaMessages, 5000)
  _lastUserMsgTime = Date.now()
  _inactivityTimer = setInterval(checkInactivity, 20000)
}

async function checkAndreaMessages() {
  if (!window._convId) return
  try {
    // Comprobar estado de la conversación
    const convRes = await fetch(
      `${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${window._convId}&select=status`,
      { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
    )
    const convData = await convRes.json()
    const status = convData?.[0]?.status

    // Detectar si Andrea tomó el control
    if (status === 'andrea_active' && !_andreaActive) {
      _andreaActive = true
      _andreaWaitActive = false
      _andreaWaitCount = 0
      startWaitingMessages()
    }

    // Detectar si Elena retoma
    if (status === 'active' && _andreaActive) {
      _andreaActive = false
      stopWaitingMessages()
    }

    // Buscar cualquier mensaje nuevo del agente o de Andrea en Supabase
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/chat_messages?conversation_id=eq.${window._convId}&role=eq.assistant&order=created_at.desc&limit=1`,
      { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
    )
    const data = await res.json()
    if (data && data.length > 0) {
      const last = data[0]
      if (last.id !== window._lastAndreaId) {
        window._lastAndreaId = last.id
        if (last.content === 'sofia_resume') {
          _andreaActive = false
          stopWaitingMessages()
          renderBubble('agent', 'Hola de nuevo 😊 Andrea me ha pasado el testigo. ¿En qué más puedo ayudarte?')
        } else if (last.is_from_andrea) {
          renderAndreaBubble(last.content)
          _lastActivityTime = Date.now()
        } else if (!window._awaitingReply) {
          // Respuesta de Elena tras sugerencia — mostrar si es nuevo.
          // Si el cliente está esperando su propia respuesta, no la dupliques aquí:
          // callAPI la mostrará en cuanto termine (ver _awaitingReply).
          renderBubble('agent', last.content)
          _lastActivityTime = Date.now()
        }
      }
    }
  } catch(e) {}
}

const waitingMessages = [
  'Seguimos en ello, un momento más 🙏',
  'Estamos consultando tu pregunta, enseguida te respondemos 😊',
  'Gracias por tu paciencia, ya casi estamos 💛',
  'Un segundo más, queremos darte la mejor respuesta 🎁'
]
let _waitingIdx = 0

function startWaitingMessages() {
  stopWaitingMessages()
  _waitingTimer = setInterval(() => {
    if (Date.now() - _lastActivityTime > 55000) {
      renderBubble('agent', waitingMessages[_waitingIdx % waitingMessages.length])
      _waitingIdx++
      _lastActivityTime = Date.now()
    }
  }, 60000)
}

function stopWaitingMessages() {
  if (_waitingTimer) { clearInterval(_waitingTimer); _waitingTimer = null }
}

// ── ESPERA A QUE ANDREA SE INCORPORE (tras derivación automática de Elena) ──
function startAndreaWaitFlow() {
  _pausedForAndrea = true
  _lastActivityTime = Date.now()
  if (_andreaWaitActive) return
  _andreaWaitActive = true
  _andreaWaitCount = 0
  stopWaitingMessages()
  _waitingTimer = setInterval(() => {
    if (_andreaActive || !_andreaWaitActive) return
    if (Date.now() - _lastActivityTime > 55000) {
      _andreaWaitCount++
      if (_andreaWaitCount <= 2) {
        renderBubble('agent', waitingMessages[(_andreaWaitCount - 1) % waitingMessages.length])
        _lastActivityTime = Date.now()
      } else {
        stopWaitingMessages()
        _andreaWaitActive = false
        renderAndreaWaitOptions()
      }
    }
  }, 60000)
}

function renderAndreaWaitOptions() {
  const area = $('messagesArea')
  renderBubble('agent', 'Siento la espera 🙏 Andrea sigue ocupada en el taller. ¿Prefieres que te escriba por email en cuanto pueda, o sigues esperando aquí?')

  const wrap = document.createElement('div')
  wrap.className = 'quick-replies'

  const emailBtn = document.createElement('button')
  emailBtn.className = 'qr-btn'
  emailBtn.textContent = '📧 Que me escriba por email'
  emailBtn.onclick = () => {
    wrap.remove()
    notifyAndreaContact('email')
    window.open('mailto:contacto@demoiatoi.es?subject=Seguimiento%20de%20mi%20consulta&body=Hola%20Andrea%2C%20me%20pongo%20en%20contacto%20de%20nuevo%20sobre%20mi%20conversaci%C3%B3n%20en%20el%20chat.', '_blank')
    renderBubble('agent', '¡Perfecto! En cuanto Andrea esté disponible te escribe por email 💛')
  }

  const waitBtn = document.createElement('button')
  waitBtn.className = 'qr-btn'
  waitBtn.textContent = '⏳ Sigo esperando aquí'
  waitBtn.onclick = () => {
    wrap.remove()
    renderBubble('agent', '¡De acuerdo! En cuanto Andrea esté libre se incorporará a esta conversación 😊')
    startAndreaWaitFlow()
  }

  wrap.appendChild(emailBtn)
  wrap.appendChild(waitBtn)
  area.appendChild(wrap)
  area.scrollTop = area.scrollHeight
}

// ── CIERRE POR INACTIVIDAD ──
async function checkInactivity() {
  if (_andreaActive || _pausedForAndrea || !window._convId) return
  const elapsed = Date.now() - _lastUserMsgTime

  if (_closingStage === 0 && elapsed > 2 * 60 * 1000) {
    _closingStage = 1
    renderBubble('agent', '¿He resuelto tu consulta? 😊 ¿Puedo ayudarte en algo más?')
  } else if (_closingStage === 1 && elapsed > 4 * 60 * 1000) {
    _closingStage = 2
    renderBubble('agent', 'Esta conversación se cerrará en unos minutos por falta de actividad. Si lo prefieres, podemos seguir en contacto de otra forma 🙏')
    renderClosingOptions()
  } else if (_closingStage === 2 && elapsed > 5 * 60 * 1000) {
    _closingStage = 3
    if (_inactivityTimer) { clearInterval(_inactivityTimer); _inactivityTimer = null }
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${window._convId}&select=needs_attention`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
      )
      const data = await res.json()
      if (!data?.[0]?.needs_attention) {
        await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${window._convId}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'resolved', updated_at: new Date().toISOString() })
        })
      }
    } catch(e) {}
    renderBubble('agent', '¡Gracias por contactarnos! Si no tienes más dudas, nos encantaría conocer tu opinión sobre la atención recibida 💛')
    showRating()
  }
}

function renderClosingOptions() {
  const area = $('messagesArea')
  const wrap = document.createElement('div')
  wrap.className = 'quick-replies'

  const emailBtn = document.createElement('button')
  emailBtn.className = 'qr-btn'
  emailBtn.textContent = '📧 Enviarme un email'
  emailBtn.onclick = () => {
    wrap.remove()
    _closingStage = 3
    if (_inactivityTimer) { clearInterval(_inactivityTimer); _inactivityTimer = null }
    notifyAndreaContact('email')
    window.open('mailto:contacto@demoiatoi.es?subject=Seguimiento%20de%20mi%20consulta&body=Hola%2C%20me%20pongo%20en%20contacto%20de%20nuevo%20sobre%20mi%20conversaci%C3%B3n%20en%20el%20chat.', '_blank')
    renderBubble('agent', '¡Perfecto! Te dejamos el email abierto 📧 Si tienes más dudas, podemos seguir hablando aquí cuando quieras.')
  }

  const contactBtn = document.createElement('button')
  contactBtn.className = 'qr-btn'
  contactBtn.textContent = '📲 Prefiero que me contacten'
  contactBtn.onclick = () => {
    wrap.remove()
    renderContactPreference()
  }

  wrap.appendChild(emailBtn)
  wrap.appendChild(contactBtn)
  area.appendChild(wrap)
  area.scrollTop = area.scrollHeight
}

function renderContactPreference() {
  const area = $('messagesArea')
  const wrap = document.createElement('div')
  wrap.className = 'quick-replies'

  ;[['✉️ Por email', 'email'], ['📱 Por WhatsApp', 'whatsapp']].forEach(([label, channel]) => {
    const btn = document.createElement('button')
    btn.className = 'qr-btn'
    btn.textContent = label
    btn.onclick = () => {
      wrap.remove()
      _closingStage = 3
      if (_inactivityTimer) { clearInterval(_inactivityTimer); _inactivityTimer = null }
      notifyAndreaContact(channel)
      if (channel === 'whatsapp') {
        // El email ya lo tenemos siempre, pero el teléfono no: hay que pedirlo
        renderBubble('agent', '¡Perfecto! Para que Andrea pueda escribirte por WhatsApp, indícame tu número de teléfono (con prefijo si no es de España) y se lo paso enseguida 📱')
      } else {
        renderBubble('agent', '¡Perfecto! Andrea se pondrá en contacto contigo por email en breve 💛')
      }
    }
    wrap.appendChild(btn)
  })

  area.appendChild(wrap)
  area.scrollTop = area.scrollHeight
}

function renderAndreaBubble(text) {
  const area = $('messagesArea')
  const row = document.createElement('div')
  row.className = 'bubble-row agent'
  row.innerHTML = `
    <div class="bubble-avatar" style="background:linear-gradient(135deg,#fde8e6,#e8837a)">👩‍💼</div>
    <div>
      <div style="font-size:.65rem;color:var(--warm-gray);margin-bottom:3px">Andrea</div>
      <div class="bubble" style="background:linear-gradient(135deg,#c05a52,#e8837a);color:white">${text.split('\n').join('<br>')}</div>
      <div class="bubble-time">${new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>`
  area.appendChild(row)
  area.scrollTop = area.scrollHeight
  playNotificationSound()
}

// ── SONIDO DE NOTIFICACIÓN ──
let _soundMuted = localStorage.getItem('dmat_sound_muted') === '1'

function updateSoundIcon() {
  const btn = $('soundToggle')
  if (btn) {
    btn.textContent = _soundMuted ? '🔇' : '🔊'
    btn.title = _soundMuted ? 'Sonido silenciado: pulsa para activarlo' : 'Silenciar sonido de notificaciones'
  }
}

function toggleSound() {
  _soundMuted = !_soundMuted
  localStorage.setItem('dmat_sound_muted', _soundMuted ? '1' : '0')
  updateSoundIcon()
}

function playNotificationSound() {
  if (_soundMuted) return
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)()
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = 880; o.type = 'sine'
    g.gain.setValueAtTime(0.16, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + .35)
    o.start(ctx.currentTime); o.stop(ctx.currentTime + .35)
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════
let agentConfig = {
  name: AGENT_NAME_CFG,
  avatar: null,
  shipping: "Tiempo de producción: de 6 a 15 días hábiles (estándar). Tazas y láminas se preparan y envían en 24h. En campañas concretas centralizamos la producción de pedidos urgentes — conviene preguntar siempre para confirmar disponibilidad. Una vez el pedido sale del taller, el envío es siempre urgente (24-48h) con seguimiento de transporte. Si el pedido es muy urgente, se puede contratar un servicio de 10h contactando para abonar la diferencia. Coste de envío: gratis a partir de 90€; para pedidos de menor importe ronda entre 5€ y 6,50€ según destino y volumen. Disponemos de un cupo de pedidos urgentes; una vez cubierto, no se podrán aceptar más urgentes hasta la fecha que indiquemos. Si el cliente necesita algo urgente, dile que vas a consultarlo con Andrea antes de confirmar. Hacemos envíos a toda España. También podemos enviar al extranjero (incluido Portugal) bajo petición.",
  returns: "Aceptamos devoluciones en 14 días si el producto llega defectuoso. Los productos personalizados no admiten devolución salvo error nuestro. Contacta en contacto@demoiatoi.es",
  extra: ""
};
let recommendedProducts = { boda: [], bautizo: [], comunion: [], cumpleanos: [], general: [] };

let conversationHistory = [];
let isTyping = false;

// ═══════════════════════════════════════════════════════════════
//  CATÁLOGO COMPLETO (cargado de Shopify – 200+ productos agrupados por categoría)
//  El agente usa esto como base de conocimiento + puede buscar por nombre
// ═══════════════════════════════════════════════════════════════
const CATALOG = [
  // ── JABONES Y COSMÉTICA ──
  {id:"6245603967127",title:"Jabones personalizados con nombre – Detalle bautizo, comunión y fiestas",price:"1.90",url:"https://demoiatoi.com/products/nombres-jabon-detalle-bautizo",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/nombre_de_jabon_mateo_melocoton.jpg",cat:"Jabones",tags:["bautizo","comunión","jabón","personalizable","detalle","invitados","económico","infantil","fiesta"]},
  {id:"6254322155671",title:"Detalle Original Jabón Invitados Boda Bautizo Comunión",price:"12.50",url:"https://demoiatoi.com/products/detalle-original-cubo-rosa-jabon",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/cubito_jabon_detalle_comunion.jpg",cat:"Jabones",tags:["boda","bautizo","comunión","jabón","detalle","invitados"]},
  {id:"8591995535697",title:"Jaboncitos aromáticos corazón rosa – Detalle natural para invitados",price:"1.50",url:"https://demoiatoi.com/products/jaboncitos-aromaticos-comunion-bautizo",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/IMG_20230426_090759_edit_34575947310868.webp",cat:"Jabones",tags:["boda","bautizo","comunión","jabón","detalle","aroma","natural"]},
  {id:"8890460406097",title:"Jabones artesanos personalizados para invitados",price:"5.50",url:"https://demoiatoi.com/products/jabones-artesanos-personalizados-invitados",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/pastillas_jabon_cesta.png",cat:"Jabones",tags:["boda","bautizo","comunión","jabón","artesanal","personalizado","aceite oliva"]},
  // ── TAZAS ──
  {id:"7777616691417",title:"Taza Madrina / Padrino Personalizada con Nombre",price:"9.90",url:"https://demoiatoi.com/products/taza-personalizada-padrino-madrina",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza_magica_madrina.png",cat:"Tazas",tags:["madrina","padrino","bautizo","comunión","taza","personalizable","cerámica","mágica","cristal"]},
  {id:"7889152377049",title:"Taza personalizada «Testigo» – editable online (boda)",price:"12.90",url:"https://demoiatoi.com/products/taza-personalizada-testigo-boda-nombres-alianzas",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza_magica_testigos.png",cat:"Tazas",tags:["boda","testigo","taza","personalizable","cerámica","mágica"]},
  {id:"7889155457241",title:"Taza personalizada boda «Lo más bonito de tenerte como amig@»",price:"14.90",url:"https://demoiatoi.com/products/taza-de-cristal",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza_testigo_de_boda.png",cat:"Tazas",tags:["boda","taza","testigo","amiga","personalizable","cerámica","cristal"]},
  {id:"7889162076377",title:"Taza Personalizada Madrina Padrino Cristal Cerámica Mágica",price:"14.90",url:"https://demoiatoi.com/products/taza-cristal-padrino-madrina",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza_magica_padrino_madrina.png",cat:"Tazas",tags:["madrina","padrino","taza","cristal","mágica","bautizo","comunión","boda"]},
  {id:"6869114290327",title:"Taza personalizada Regalo maestra fin de curso infantil",price:"22.90",url:"https://demoiatoi.com/products/regalo-maestra-fin-de-curso-infantil",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/TZMA1425-WEB.jpg_turbo.webp",cat:"Tazas",tags:["maestra","profe","fin de curso","taza","personalizada","regalo","alumnos"]},
  {id:"7655524204761",title:"Taza personalizada profesora con nombres – Diseño huellas de colores",price:"17.90",url:"https://demoiatoi.com/products/taza-personalizada-huellas-colores-profesor-equipo",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza-personalizada-huellas-colores-profesor.webp",cat:"Tazas",tags:["profesora","taza","huellas","fin de curso","alumnos","regalo","maestra"]},
  {id:"9110725919057",title:"Taza personalizada profesora fin de curso – Diseño flores silvestres",price:"14.90",url:"https://demoiatoi.com/products/taza-fin-de-curso-personalizada-flores-silvestres",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/1772319333545.png",cat:"Tazas",tags:["profesora","taza","flores","fin de curso","alumnos","regalo","maestra"]},
  {id:"8739721740625",title:"Taza para invitados personalizada - Eucalipto",price:"9.00",url:"https://demoiatoi.com/products/taza-personalizada-para-boda-eucalipto",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza-eucalipto.webp",cat:"Tazas",tags:["boda","bautizo","comunión","taza","eucalipto","natural","invitados"]},
  {id:"7653362827481",title:"Taza personalizada para invitados con nombre y corazón",price:"12.90",url:"https://demoiatoi.com/products/taza-personalizada-corazon-nombre-celebraciones",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza-personalizada-corazon-nombre-celebraciones.webp",cat:"Tazas",tags:["boda","bautizo","comunión","taza","corazón","invitados","económica"]},
  {id:"8902242926929",title:"Pack 2 tazas personalizadas «¡Sois los siguientes!»",price:"20.00",url:"https://demoiatoi.com/products/taza-personalizada-sois-los-siguientes",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/taza-siguientes.webp",cat:"Tazas",tags:["boda","siguientes","taza","pack","pareja","regalo"]},
  // ── TEXTIL Y ROPA ──
  {id:"7014457311383",title:"Calcetines personalizados para padrinos y testigos de boda",price:"12.90",url:"https://demoiatoi.com/products/calcetines-personalizados-boda-algodon-peinado",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/calcetines-personalizados-primo-novia.webp",cat:"Textil",tags:["boda","padrino","madrina","testigo","calcetines","personalizable","hombre"]},
  {id:"7879735017689",title:"Neceser Personalizado para Invitadas, Damas de Honor – Boda",price:"7.90",url:"https://demoiatoi.com/products/neceser-algodon-con-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/neceser-personalizado_con_nombre.webp",cat:"Bolsos y neceseres",tags:["boda","neceser","invitadas","damas de honor","personalizable","mujer","económico"]},
  {id:"7034922631319",title:"Regalo personalizado mujer con nombre y flores artesanales (neceser yute)",price:"8.90",url:"https://demoiatoi.com/products/neceser-natural-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/neceser-personalizado-yute-regalo-boda_a157cb7a-2840-4799-bd5f-bce6eb045f0f.webp",cat:"Bolsos y neceseres",tags:["mujer","neceser","flores","personalizable","boda","madre","amiga","eco"]},
  {id:"8091195900121",title:"Bata personalizada novia IVETTE de satén premium con encaje",price:"79.00",url:"https://demoiatoi.com/products/bata-personalizada-novia-y-equipo",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/avion-web.jpg_turbo_588408ef-92aa-4732-a73c-46607ec56f6c.webp",cat:"Textil novia",tags:["boda","novia","bata","satén","personalizada","equipo novia","damas de honor"]},
  {id:"8646220382545",title:"Zapatillas de estar por casa personalizadas con nombre para novia",price:"16.00",url:"https://demoiatoi.com/products/pantuflas-personalizadas-inicial",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/Zapatillas_de_novia_con_flores.png",cat:"Zapatillas",tags:["boda","novia","zapatillas","pantuflas","personalizada","damas de honor"]},
  // ── ZAPATILLAS CONVERSE ──
  {id:"8096625230041",title:"Zapatillas personalizadas amigas con nombres – Damas de honor",price:"70.00",url:"https://demoiatoi.com/products/zapatillas-de-lona-para-novia-y-damas-de-honor",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/DAMA_DE_HONOR.jpg_turbo_160e4312-899a-42b0-8ed6-4eae1147d46c.webp",cat:"Zapatillas",tags:["boda","amigas","zapatillas","damas de honor","personalizada","novia","regalo"]},
  {id:"8116484997337",title:"Zapatillas Personalizadas para Boda con Nombres y Fecha",price:"70.00",url:"https://demoiatoi.com/products/zapatillas-personalizadas-boda-i-love",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/zapatillas_novia_him.png",cat:"Zapatillas",tags:["boda","zapatillas","personalizada","nombres","fecha","novios","regalo"]},
  {id:"9003765367121",title:"Zapatillas personalizadas cumpleaños – Escuela de Magia",price:"70.00",url:"https://demoiatoi.com/products/zapatillas-personalizadas-escuela-magia-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/zapatillas_harry_con_nombre.png",cat:"Zapatillas",tags:["comunión","cumpleaños","zapatillas","magia","harry potter","niño","niña","personalizada"]},
  // ── MADERA Y GRABADO LASER ──
  {id:"8096565985497",title:"Placa madera Gracias con flores personalizada",price:"22.50",url:"https://demoiatoi.com/products/placa-madera-gracias-personalizada",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/PLACA_DE_MADERA_CON_FLORES_8d8dd9b9-3a57-4457-a10d-ed39be795555.webp",cat:"Madera",tags:["boda","comunión","bautizo","madrina","padrino","placa","madera","flores","personalizada"]},
  {id:"8068460216537",title:"Piedra Pizarra Natural Personalizada con Flores – Boda, Bautizo, Comunión",price:"20.90",url:"https://demoiatoi.com/products/piedra-con-texto-y-flores-naturales",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/piedra-con-texto-y-flores-preservadas-de-moi-a-toi-regalos-548615.jpg_turbo_06aa2849-398f-4d99-862e-e9889eb2e721.webp",cat:"Madera",tags:["boda","bautizo","comunión","flores","piedra","pizarra","personalizada","madrina","padrino","eco"]},
  {id:"8113567629529",title:"Llavero de madera personalizado con inicial grabado a láser",price:"4.90",url:"https://demoiatoi.com/products/llavero-de-madera-inicial-grabada",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/llavero-de-madera-inicial-grabada-de-moi-a-toi-regalos_3ffe8576-132a-4ac4-956f-79de99a55d28.webp",cat:"Madera",tags:["boda","bautizo","comunión","llavero","madera","inicial","personalizado","detalle"]},
  {id:"9038475919697",title:"Llavero de madera personalizado con inicial y nombre grabado",price:"5.99",url:"https://demoiatoi.com/products/llavero-de-madera-personalizado-con-inicial-y-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/llavero_inicial_con_nombre_tallado.webp",cat:"Madera",tags:["boda","bautizo","comunión","llavero","madera","inicial","nombre","personalizado"]},
  {id:"8635984281937",title:"Marcasitio de Madera Circular Personalizado con Nombre",price:"3.50",url:"https://demoiatoi.com/products/marcasitio-madera-circular-personalizado-nombre-invitados",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/1_41767c69-99f6-425c-afd4-2d27a76a8acf.jpg_turbo.webp",cat:"Madera",tags:["boda","bautizo","comunión","marcasitio","madera","personalizado","invitados"]},
  {id:"8888826397009",title:"Abridor personalizado bautizo y comunión – Detalle invitados",price:"4.50",url:"https://demoiatoi.com/products/abridor-madera-recordatorio-bautizo-comunion",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/abridor_macizo_real_2.png",cat:"Madera",tags:["bautizo","comunión","boda","abridor","madera","personalizado","detalle","invitados"]},
  {id:"9308968354129",title:"Espejo de bambú personalizado boda – Detalle invitadas elegante",price:"4.90",url:"https://demoiatoi.com/products/espejo-de-madera-de-madera-invitadas-boda",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/ESPEJO_BODA_invitadas.webp",cat:"Madera",tags:["boda","espejo","bambú","personalizado","detalle","invitadas","mujer"]},
  {id:"9309273194833",title:"Abridor de bambú personalizado con imán – Detalle invitados boda",price:"4.99",url:"https://demoiatoi.com/products/abridor-iman-personalizado-boda",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/abridor-boda-natural-invitados.webp",cat:"Madera",tags:["boda","abridor","bambú","imán","personalizado","detalle","invitados","hombre"]},
  // ── LÁMPARAS LED ──
  {id:"9038193131857",title:"Lámpara LED personalizada para mamá con dedicatoria",price:"29.90",url:"https://demoiatoi.com/products/lampara-led-personalizada-para-regalar-a-madre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/lampara_en_caja_de_regalo_mama.png",cat:"Lámparas LED",tags:["madre","mamá","lámpara","led","personalizada","dedicatoria","día madre","regalo","cumpleaños"]},
  {id:"9252742857041",title:"Lámpara LED corazón personalizada con nombres – Regalo romántico boda",price:"29.90",url:"https://demoiatoi.com/products/lampara-led-corazon-personalizada-nombres",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/lampara-led-grabado-laser-corazon-regalo-original-demoiatoi.webp",cat:"Lámparas LED",tags:["boda","pareja","lámpara","led","corazón","personalizada","romántica","aniversario"]},
  {id:"9252762878289",title:"Lámpara LED Redonda Silueta enamorados para bodas",price:"29.90",url:"https://demoiatoi.com/products/lampara-led-novios-personalizada-iniciales",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/lampara-led-novios-personalizada-iniciales-demoiatoi.webp",cat:"Lámparas LED",tags:["boda","novios","lámpara","led","silueta","personalizada","iniciales"]},
  {id:"9794688090449",title:"Lámpara LED Globo infantil personalizada con nombre",price:"29.90",url:"https://demoiatoi.com/products/lampara-led-personalizada-globo-con-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/LAMPARA_GLOBO_INFANTIL.webp",cat:"Lámparas LED",tags:["bebé","infantil","niño","lámpara","led","globo","personalizada","cumpleaños","comunión","bautizo"]},
  // ── JUEGOS DE MADERA ──
  {id:"8774160482641",title:"Pack juegos de madera personalizados para invitados infantiles",price:"7.00",url:"https://demoiatoi.com/products/pack-detalles-infantiles-personalizados",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/set-regalo-madera-infantil.jpg_turbo.webp",cat:"Juegos de madera",tags:["boda","bautizo","comunión","juegos","madera","infantil","detalle","invitados","personalizado"]},
  {id:"9309441786193",title:"3 en raya personalizado invitados – Juego de madera grabado",price:"4.95",url:"https://demoiatoi.com/products/3-en-raya-personalizado-invitados",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/detalle-boda-3-en-raya-personalizado.webp",cat:"Juegos de madera",tags:["boda","bautizo","comunión","3 en raya","juego","madera","personalizado","detalle"]},
  {id:"9297143103825",title:"Yoyo de madera personalizado para invitados",price:"3.90",url:"https://demoiatoi.com/products/yoyo-personalizado-invitados",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/YOYOS_madera_invitados.webp",cat:"Juegos de madera",tags:["boda","bautizo","comunión","yoyo","juego","madera","personalizado","detalle","niños"]},
  {id:"9445654266193",title:"Imán de madera para colorear infantil – Animalitos",price:"4.20",url:"https://demoiatoi.com/products/iman-de-madera-para-colorear-infantil",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/f97LaKHLMa7LitkP_IuNkAg_1_gps_generated.webp",cat:"Juegos de madera",tags:["bautizo","boda","comunión","imán","colorear","madera","animalitos","infantil","detalle"]},
  // ── ROPA BEBÉ ──
  {id:"7993792495833",title:"Body bebé personalizado boda «Yo estuve» – Animalitos",price:"19.90",url:"https://demoiatoi.com/products/body-personalizado-estuve-boda-animalitos",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/body-yo-estuve-en-la-boda-animalitos-disenos-de-moi-a-toi-regalos-294122.jpg_turbo_67e2930f-ff28-4728-8220-5a549afb19e5.webp",cat:"Ropa bebé",tags:["boda","bebé","body","personalizado","embarazada","infantil","animalitos"]},
  {id:"8602642186577",title:"Babero personalizado «Yo estuve en...» – Animalitos",price:"14.90",url:"https://demoiatoi.com/products/babero-personalizado-yo-estuve",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/babero-yo-estuve-en-la-boda-animalitos-disenos-de-moi-a-toi-regalos-489595.jpg_turbo_c4f5cc93-b314-4ec2-93b0-3cd7dd8238d2.webp",cat:"Ropa bebé",tags:["boda","babero","bebé","personalizado","animalitos","embarazada","invitados"]},
  {id:"8792913150289",title:"Body personalizado «¿Quieres ser mi madrina?» con foto",price:"19.90",url:"https://demoiatoi.com/products/body-quieres-ser-mi-madrina",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/MADRINA-body-regalo-bebe-foto.webp",cat:"Ropa bebé",tags:["bautizo","bebé","body","madrina","personalizado","foto","regalo","infantil"]},
  // ── ESCRITURA Y ECOLÓGICOS ──
  {id:"8095739969753",title:"Bolígrafo bambú grabado a láser – Detalle invitados",price:"2.15",url:"https://demoiatoi.com/products/boligrafo-bambu-personalizado-invitados",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/bol_grafo_de_madera_personalizado.webp",cat:"Escritura",tags:["boda","bautizo","comunión","bolígrafo","bambú","láser","personalizado","detalle","eco"]},
  {id:"8096516833497",title:"Lápices de Madera Personalizados con Nombre de colores",price:"2.75",url:"https://demoiatoi.com/products/lapiz-madera-personalizado-con-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/lapices_turbo_943f6a8e-62a3-4b99-93b7-f531b1b4c255.webp",cat:"Escritura",tags:["boda","bautizo","comunión","lápiz","madera","personalizado","detalle","infantil"]},
  {id:"8621611811153",title:"Libreta personalizada bambú A5 con bolígrafo – Regalo sostenible",price:"19.90",url:"https://demoiatoi.com/products/set-libreta-y-boligrafo-de-bambu-personalizada",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/libreta_de_madera_personalizada.webp",cat:"Escritura",tags:["maestra","profe","fin de curso","libreta","bambú","bolígrafo","sostenible","personalizada","eco"]},
  {id:"7660727927001",title:"Cuaderno corcho personalizado con bolígrafo – Regalo sostenible maestros",price:"24.90",url:"https://demoiatoi.com/products/cuaderno-personalizado-con-nombre-corcho-sostenible-profe",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/1772367016475.png",cat:"Escritura",tags:["maestra","profe","fin de curso","cuaderno","corcho","sostenible","personalizado","eco"]},
  // ── ACEITE DE OLIVA ──
  {id:"9327619309905",title:"Latas de aceite personalizadas con diseño natural – Boda/Bautizo/Comunión",price:"4.90",url:"https://demoiatoi.com/products/latas-aceite-personalizadas-diseno-natural",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/disenos_naturales.png",cat:"Aceite",tags:["boda","bautizo","comunión","aceite","lata","personalizada","detalle","gourmet","natural","invitados"]},
  {id:"9826729623889",title:"Latas de aceite personalizadas comunión niño rezando azul acuarela",price:"4.90",url:"https://demoiatoi.com/products/latas-aceite-personalizadas-comunion-nino-rezando-azul",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/aceite_azul_acuarela_nino.png",cat:"Aceite",tags:["comunión","aceite","lata","personalizada","detalle","niño","gourmet","invitados"]},
  {id:"9844309557585",title:"Latas de aceite personalizadas comunión niña flores SOFT",price:"4.90",url:"https://demoiatoi.com/products/latas-aceite-personalizadas-comunion-nina-flores-suaves",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/aceite_soft.png",cat:"Aceite",tags:["comunión","aceite","lata","personalizada","detalle","niña","flores","gourmet"]},
  // ── SETS REGALO ──
  {id:"8800862667089",title:"Set de regalo comunión – Taza y hucha diseño Marinero",price:"29.90",url:"https://demoiatoi.com/products/kit-regalo-comunion-hucha-y-taza",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/MARINERO1.jpg_turbo.webp",cat:"Sets regalo",tags:["comunión","set","regalo","taza","hucha","marinero","niño","personalizado"]},
  {id:"9148372648273",title:"Set Regalo Profesora – Kit de Fieltro Fin de Curso",price:"69.90",url:"https://demoiatoi.com/products/set-regalo-profesora-personalizado-fin-de-curso-fieltro",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/fieltro-26-profe-flores_2.png",cat:"Sets regalo",tags:["maestra","profe","fin de curso","set","regalo","fieltro","personalizado","flores","premium"]},
  {id:"9217120862545",title:"Set regalo profesor económico – Regalo fin de curso personalizado",price:"29.90",url:"https://demoiatoi.com/products/set-economico-unisex-para-profesores",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/Set_regalo_fieltro_eco.png",cat:"Sets regalo",tags:["maestra","profe","fin de curso","set","regalo","fieltro","personalizado","económico"]},
  {id:"9254992052561",title:"Set de regalo para mujer en fieltro y piel – Personalizado con nombre",price:"42.00",url:"https://demoiatoi.com/products/set-regalo-mujer-fieltro-piel-personalizado",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/set-fieltro-nombre-elegante.webp",cat:"Sets regalo",tags:["mujer","madre","amiga","set","regalo","fieltro","piel","personalizado","bolso","cumpleaños","navidad"]},
  // ── FIGURAS DE TARTA ──
  {id:"6444876857495",title:"Photocall – Figura de Boda para tarta",price:"20.00",url:"https://demoiatoi.com/products/photocall-figura-de-boda",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/photocall-figura-de-boda-de-moi-a-toi-regalos-808448.jpg_turbo.webp",cat:"Figuras de tarta",tags:["boda","figura","tarta","photocall","original","divertida"]},
  {id:"6444895502487",title:"Cigüeña – Figura de bautizo para tarta",price:"3.50",url:"https://demoiatoi.com/products/figura-de-tarta-bebe",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/ciguena-figura-de-bautizo-de-moi-a-toi-regalos-512768.jpg_turbo.webp",cat:"Figuras de tarta",tags:["bautizo","figura","tarta","bebé","infantil","azul","rosa"]},
  // ── JOYAS ARTESANALES ──
  {id:"8106478731481",title:"Conjunto artesanal AMOR – Collar, pendientes y anillo de corazón rojo",price:"24.90",url:"https://demoiatoi.com/products/conjunto-artesanal-amor-corazon-rojo",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/conjunto-artesanal-amor-corazon-rojo-demoiatoi.webp",cat:"Joyas",tags:["amigas","amigo invisible","madre","joyas","collar","pendientes","artesanal","amor","regalo"]},
  {id:"8138674995417",title:"Collar con hoja natural galvanizada – Joya artesanal",price:"7.50",url:"https://demoiatoi.com/products/collar-hoja-natural-galvanizada",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/collar-hoja-natural-galvanizada-demoiatoi.webp",cat:"Joyas",tags:["amigas","amigo invisible","madre","joyas","collar","hoja","natural","artesanal","regalo"]},
  {id:"9477674008913",title:"Joyero portátil personalizado con nombre – Regalo original",price:"10.50",url:"https://demoiatoi.com/products/joyero-portatil-personalizado-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/joyero-turquesa-personalizado-demoiatoi_2b81456b-44f5-4c0e-8859-0088e0f61fd7.webp",cat:"Joyas",tags:["mujer","joyero","portátil","personalizado","regalo","original","adolescente"]},
  // ── AZULEJOS Y FOTOS ──
  {id:"8082277236953",title:"Azulejo personalizado con foto y caballete de madera",price:"12.90",url:"https://demoiatoi.com/products/azulejo-personalizado-foto-caballete-madera",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/azulejo-personalizado-foto-caballete-madera_9b185478-fda6-44dc-af88-c989873a667f.webp",cat:"Regalos con foto",tags:["boda","bautizo","comunión","foto","azulejo","caballete","madera","personalizado","decoración"]},
  // ── VELAS ──
  {id:"8905828041041",title:"Vela personalizada boda invitados – Detalle aromático elegante",price:"7.50",url:"https://demoiatoi.com/products/vela-personalizada-boda",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/VELA_BODA-personalizada-madera-y-foto.jpg",cat:"Velas",tags:["boda","vela","aromática","personalizada","detalle","invitados","elegante","madera"]},
  // ── BOLSAS DE TELA ──
  {id:"7972655104217",title:"Bolsa de Tela Personalizada – Invitados Boda, Bautizo, Comunión",price:"6.00",url:"https://demoiatoi.com/products/bola-tela-personalizada-boda-barata",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/Bolsa_personalizada_nuestro_dia.webp",cat:"Bolsas",tags:["boda","bautizo","comunión","bolsa","tela","personalizada","invitados","económico"]},
  // ── NAVIDAD ──
  {id:"7160445534359",title:"Bola de navidad personalizada con nombre 6cm",price:"3.90",url:"https://demoiatoi.com/products/bola-de-navidad-personalizada-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/bola-de-navidad-personalizada-con-nombre-6cm-de-moi-a-toi-regalos-822925.jpg_turbo.webp",cat:"Navidad",tags:["navidad","bola","personalizada","nombre","decoración","amigo invisible"]},
  {id:"8798178640209",title:"Saco Reyes Magos personalizado con nombre",price:"25.00",url:"https://demoiatoi.com/products/saco-papa-noel-personalizado",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/saco_de_regalos_personalizado_b7d32dac-978b-432b-9b86-9c0e57769be0.webp",cat:"Navidad",tags:["navidad","saco","papá noel","reyes magos","personalizado","niño","niña","nombre"]},
  {id:"8833331757393",title:"Estrella de navidad grabada en piedra pizarra",price:"4.50",url:"https://demoiatoi.com/products/estrella-de-navidad-grabada-en-piedra-pizarra",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/a.jpg_turbo.webp",cat:"Navidad",tags:["navidad","estrella","pizarra","personalizada","amigo invisible","decoración","empresa"]},
  // ── LAPICERO MADERA ──
  {id:"9103601107281",title:"Lapicero de madera con nombre en acrílico infantil",price:"12.50",url:"https://demoiatoi.com/products/lapicero-madera-personalizado-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/lapicero-nombre-tallado_8087679e-bd8b-4d16-a2a9-ebf1fd67385c.webp",cat:"Escritura",tags:["comunión","bautizo","cumpleaños","lapicero","madera","nombre","acrílico","personalizado","infantil","fin de curso"]},
  // ── ALTAVOZ ──
  {id:"7664616669401",title:"Altavoz Bluetooth Personalizado con Nombre – Niños y Adolescentes",price:"9.90",url:"https://demoiatoi.com/products/altavoz-bluetooth-con-nombre",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/ALTAVOZ_PERSONALIZADO_CON_NOMBRE.jpg_turbo.webp",cat:"Originales",tags:["adolescente","niño","comunión","cumpleaños","altavoz","bluetooth","personalizado","original"]},
  // ── RITUAL ARENA ──
  {id:"8740206739793",title:"Ritual de la arena para boda – Personalizado",price:"20.00",url:"https://demoiatoi.com/products/ritual-arena-boda-personalizado",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/ritual-economico-boda.jpg",cat:"Rituales boda",tags:["boda","ritual","arena","personalizado","ceremonia","simbólica","original"]},
  // ── DECORACIÓN CELEBRACIÓN ──
  {id:"9327252046161",title:"Latas de aceite personalizadas boda – diseño natural",price:"4.90",url:"https://demoiatoi.com/products/latas-aceite-personalizadas-diseno-natural",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/disenos_naturales.png",cat:"Decoración",tags:["boda","decoración","lata","aceite","personalizada"]},
  {id:"9368027922769",title:"Cartel candy bar personalizado – Diseño Vichy",price:"14.90",url:"https://demoiatoi.com/products/cartel-candy-bar-personalizado-vichy",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/vichy.jpg_turbo_afdc5fa2-8931-4d2c-915d-1400c424b9da.webp",cat:"Decoración",tags:["boda","bautizo","comunión","cartel","candy bar","vichy","decoración","mesa dulce"]},
  {id:"9309441786193",title:"3 en raya personalizado navidad",price:"4.95",url:"https://demoiatoi.com/products/3-en-raya-grabado-a-laser-para-navidad",img:"https://cdn.shopify.com/s/files/1/0517/6423/2343/files/CAMPER-LUCAS-_3_en_raya_-_juego_de_madera.jpg_turbo.webp",cat:"Navidad",tags:["navidad","3 en raya","juego","madera","personalizado","empresa","detalle"]},
];

// Build keyword index
function searchProducts(query, maxResults = 4) {
  const q = query.toLowerCase().replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
  const words = q.split(/\s+/).filter(w => w.length > 2);

  const scored = CATALOG.map(p => {
    let score = 0;
    const haystack = (p.title + ' ' + p.tags.join(' ') + ' ' + p.cat).toLowerCase()
      .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u');
    for (const w of words) {
      if (haystack.includes(w)) score += w.length; // longer word = more specific match
    }
    return { ...p, score };
  }).filter(p => p.score > 0);

  scored.sort((a,b) => b.score - a.score);
  return scored.slice(0, maxResults);
}

// Build system prompt - pass catalog as structured knowledge
function buildSystemPrompt() {
  // Group catalog by category for the prompt
  const byCategory = {};
  CATALOG.forEach(p => {
    if (!byCategory[p.cat]) byCategory[p.cat] = [];
    byCategory[p.cat].push(`  • "${p.title}" | Desde ${p.price}€ | ID:${p.id}`);
  });

  const catalogText = Object.entries(byCategory).map(([cat, prods]) =>
    `**${cat}:**\n${prods.join('\n')}`
  ).join('\n\n');

  const occasionLabels = { boda: 'Boda', bautizo: 'Bautizo', comunion: 'Comunión', cumpleanos: 'Cumpleaños', general: 'General' };
  const recommendedSections = Object.entries(recommendedProducts)
    .filter(([, list]) => list && list.length)
    .map(([cat, list]) => `**${occasionLabels[cat] || cat}:**\n` + list.map(p => `  • "${p.title}" | Desde ${p.price}€ | ID:${p.id}`).join('\n'))
    .join('\n\n');

  const recommendedBlock = recommendedSections ? `\n\n## PRODUCTOS QUE ANDREA QUIERE QUE PRIORICES (por ocasión)
Andrea ha seleccionado estos productos como prioritarios para recomendar según la ocasión del cliente:

${recommendedSections}

Si identificas la ocasión (boda, bautizo, comunión, cumpleaños), recomienda PRIMERO de la lista de esa ocasión; si la ocasión no está clara o no hay productos para ella, usa la lista "General". Solo si ninguno de estos productos encaja con lo que pide el cliente, recurre al catálogo completo de abajo.` : '';

  return `Eres ${agentConfig.name}, la asistente de ventas de "De Moi à Toi Regalos" (demoiatoi.com), una tienda española especializada en regalos personalizados para celebraciones: bodas, bautizos, comuniones, cumpleaños, fin de curso, Navidad y más.

Tu misión: ayudar al cliente a encontrar el regalo o detalle perfecto de forma natural, honesta y cálida.

## TU PERSONALIDAD
- Cercana y genuina, como una amiga que conoce perfectamente la tienda
- Haces preguntas para entender bien qué necesitan
- Cuando recomiendas, explicas brevemente POR QUÉ ese producto encaja
- No presionas ni usas lenguaje de vendedor agresivo
- Usas emojis con moderación, solo cuando aportan calidez

## NOMBRE DEL CLIENTE Y PRESENTACIÓN
Te presentas como la ayudante asistida por IA de Andrea (la dueña de la tienda), no como una vendedora genérica. Si todavía no sabes cómo se llama el cliente, pregúntaselo de forma natural y cercana en uno de tus primeros mensajes (sin insistir si no responde). En cuanto sepas su nombre, dirígete a él/ella por su nombre con calidez durante el resto de la conversación.
${recommendedBlock}
## CATÁLOGO COMPLETO DE LA TIENDA

${catalogText}

## POLÍTICA DE ENVÍOS
${agentConfig.shipping}

## POLÍTICA DE DEVOLUCIONES
${agentConfig.returns}

## INFORMACIÓN ADICIONAL
${agentConfig.extra}

## CÓMO RECOMENDAR PRODUCTOS
Cuando el cliente te describa su necesidad, recomienda entre 3 y 4 productos que realmente encajen (si hay al menos esos disponibles que tengan sentido — nunca incluyas algo que no encaje solo por completar el número). Dale variedad de opciones para que pueda elegir.

Para mostrar productos, incluye al final de tu respuesta este bloque (sin markdown, sin backticks):
PRODUCTOS_JSON:[{"id":"ID","razon":"Explicación corta de por qué este producto"},{"id":"ID2","razon":"..."},{"id":"ID3","razon":"..."}]

Si no hay productos relevantes, no pongas el JSON. Si el cliente pregunta por algo que no tienes, díselo honestamente y sugiere lo más cercano.

## IMÁGENES QUE ENVÍA EL CLIENTE
El cliente puede adjuntar una foto o una captura de pantalla (por ejemplo, de un producto que ha visto en la web o en redes sociales y por el que pregunta). Cuando recibas una imagen:
- Descríbela brevemente y relaciónala con el catálogo si reconoces un producto parecido o igual (usa PRODUCTOS_JSON si encaja).
- Si es una captura de la web mostrando un error (p.ej. faltan campos de personalización, precio incorrecto, página rota), trátalo según "PERSONALIZACIÓN Y DISEÑO" o deriva a Andrea si hace falta confirmarlo.
- Si no reconoces el producto de la imagen o no tienes certeza, sé honesta y dilo, sin inventar.

## ESTADO DE PEDIDO
Si el cliente pregunta por el estado de su pedido, dile exactamente esto:
"¡Claro! Puedes consultar el estado de tu pedido en tiempo real aquí: https://demoiatoi.com/pages/estado-de-pedido — solo necesitas introducir tu email o número de pedido 📦"

## INCIDENCIAS Y PROBLEMAS
Si el cliente tiene una incidencia (error en el pedido, problema con la entrega, quiere cambiar la dirección de entrega, producto dañado, o cualquier otro problema), sé empático, pídele que te cuente qué ha pasado y luego dile:
"Lamentamos mucho lo ocurrido 😔 Para resolverlo lo antes posible, escríbenos a contacto@demoiatoi.es indicando:
- Tu número de pedido
- El problema concreto
[repite aquí el problema que te ha contado para que lo tenga listo para copiar]
Nuestro equipo te responderá en menos de 24h."

## CÓMO DERIVAR A ANDREA — MUY IMPORTANTE
Cuando necesites que Andrea confirme o se incorpore a la conversación, NO pidas al cliente que escriba un email como primera opción (es un engorro para él). En su lugar, usa SIEMPRE esta fórmula (adáptala ligeramente al contexto pero mantén la idea):

"Le aviso a Andrea para que se incorpore a este chat 👩‍💼 Puede demorarse un poco porque está en el taller, pero si quieres esperar un momento aquí mismo, en cuanto pueda te responde directamente. Si lo prefieres, también puedes escribirnos a contacto@demoiatoi.es."

Si el cliente pide que le contacten por WhatsApp o por teléfono (en vez de esperar en el chat o por email), pídele su número de teléfono antes de cerrar el tema — sin él Andrea no podrá escribirle, ya que el chat no muestra el teléfono del cliente. El email de contacto ya lo tenemos siempre (no hace falta pedirlo).

Esto avisa automáticamente a Andrea (no necesitas hacer nada más) y el cliente puede seguir esperando en el chat sin tener que salir a su correo.

## FECHAS DE ENTREGA — MUY IMPORTANTE
Nunca confirmes una fecha de entrega por tu cuenta. Siempre que un cliente pregunte si algo llega a tiempo, sigue estas reglas:

- **Más de 2 semanas de margen:** Puedes decir que normalmente no hay problema para pedidos estándar, pero que Andrea lo confirmará. Usa la fórmula de "CÓMO DERIVAR A ANDREA".
- **1 semana de margen:** Territorio delicado. Di que necesitas consultarlo con Andrea antes de confirmar, usando la fórmula de "CÓMO DERIVAR A ANDREA".
- **Menos de 2 días:** Explica siempre que el transporte tarda 24h pudiendo demorarse hasta 48h, que en caso de incidencia con el transporte la empresa no puede hacerse responsable ya que no depende de ellos, y usa la fórmula de "CÓMO DERIVAR A ANDREA" para que lo confirme cuanto antes.
- **Cualquier duda sobre plazos:** No confirmes nunca. Di que depende del stock y la producción en ese momento, y usa la fórmula de "CÓMO DERIVAR A ANDREA".

## PERSONALIZACIÓN Y DISEÑO
Cuando alguien pregunte por personalización de un producto, primero revisa el catálogo y explica las opciones disponibles para ese producto (nombre, fecha, texto, colores disponibles en catálogo, etc.). Sé útil y detallada. Explica que la personalización la realiza nuestro propio equipo artesanal en España, y que prácticamente todos los artículos tienen campos de personalización en su página del producto.

Si el cliente dice que NO ve esos campos de personalización en la página de un producto, pregúntale: "¿Has visto algún error en la web?" para confirmarlo. Si confirma que hay un error o que faltan los campos, usa la fórmula de "CÓMO DERIVAR A ANDREA" (adaptada para avisar de un posible fallo en la web, indicando qué producto).

Solo deriva a Andrea si:
- El cliente pide algo que NO está en las opciones del catálogo (diseño completamente a medida, cambiar formas, ilustraciones especiales, etc.)
- El cliente quiere cambiar el diseño de un pedido YA REALIZADO
- El cliente confirma un posible error/fallo en la web (campos de personalización que no aparecen)

En esos casos usa la fórmula de "CÓMO DERIVAR A ANDREA" (adaptada: "...para confirmarte si esto es posible 🎨").

Para todo lo demás de personalización estándar, ayuda tú misma con toda la información del catálogo.

## PACKS DE REGALO CON VARIOS ARTÍCULOS
Si un cliente quiere hacer un pack combinando varios productos de la tienda, no digas que no es posible. Explica que puede añadir cada producto por separado al carrito y en el campo "Notas del pedido" escribir: "Pack regalo: empaquetar juntos por favor". Nuestro equipo lo preparará junto con un packaging especial. Es un servicio que ofrecemos con mucho gusto.

## PEDIDOS GRANDES Y PRESUPUESTOS (MÁS DE 50 UNIDADES)
Si el cliente pide más de 50 unidades de un mismo producto, o pide directamente un presupuesto/cotización para un pedido especial (empresas, eventos, regalos corporativos, etc.), sigue este proceso paso a paso:

1. Pregúntale si la solicitud es para una empresa o para un particular. Incluye al final de tu mensaje, en su propia línea y tal cual, este marcador (sin markdown, sin backticks, no lo menciones ni lo expliques): PRESUPUESTO_BOTONES
2. A continuación (en mensajes siguientes), recopila estos datos — pueden darse todos juntos o uno a uno: ARTÍCULO, CANTIDAD, CELEBRACIÓN, FECHA DE CELEBRACIÓN, FECHA EN QUE NECESITA RECIBIRLO, PERSONALIZACIÓN deseada, y EMAIL DE CONTACTO (si es distinto al que ya tenemos).
3. En cuanto tengas todos los datos, preséntale un resumen visual bonito y fácil de leer, con este formato exacto (rellena cada campo, usa "—" si algo no aplica):

📋 Resumen de tu solicitud de presupuesto
🏢/🙋 Tipo: [Empresa o Particular]
🎁 Artículo: ...
🔢 Cantidad: ...
🎉 Celebración: ...
📅 Fecha de celebración: ...
📦 Fecha en que lo necesita: ...
🎨 Personalización: ...
📧 Email de contacto: ...

4. Justo después del resumen, añade: "El plazo habitual para presupuestos es de 48/72h, aunque puede verse afectado por el volumen de pedidos en temporada alta. Andrea revisará tu solicitud y te responderá lo antes posible 🙏"
5. Al final de ese mismo mensaje (después de todo lo anterior), en su propia línea y tal cual, incluye este marcador (sin markdown, sin backticks, no lo menciones ni lo expliques): PRESUPUESTO_SOLICITADO

No repitas el resumen ni los marcadores en mensajes posteriores — solo se usan una vez, cuando completes el resumen por primera vez.

## CUANDO NO SABES ALGO
Si te preguntan algo que no sabes o no tienes información suficiente para responder con seguridad, NO inventes. Di exactamente: "Espera un momento, voy a consultarlo con Andrea para darte la información correcta 🙏" y nada más. Esto activará una alerta para que Andrea responda directamente.

## SI ANDREA ENTRA EN LA CONVERSACIÓN
Cuando Andrea se una al chat, debes retirarte educadamente. Di: "Os dejo con Andrea, que os atenderá directamente 😊 Si me necesitáis de nuevo, estoy aquí." Y no respondas más en esa conversación hasta que Andrea te ceda el turno escribiendo "Elena, continúa".

## REGLAS IMPORTANTES
- Todo lo que aparece en el CATÁLOGO COMPLETO de arriba está disponible y actualizado. Si tú misma has recomendado un producto, NUNCA digas después que "no está en tu catálogo" o que no tienes información de él — eso contradice tu propia recomendación y confunde al cliente. Si te falta un detalle muy concreto (p.ej. una opción de personalización exacta), dilo de forma específica ("ese detalle en concreto lo confirmo con Andrea") sin negar que el producto existe o esté disponible.
- NUNCA inventes productos o precios que no estén en el catálogo
- NUNCA confirmes fechas de entrega — siempre deriva a Andrea
- NUNCA gestiones cambios de diseño — siempre deriva a Andrea
- Si no sabes algo, di que vas a consultar — NO inventes
- Responde siempre en español
- Tus respuestas son concisas (3-5 frases) salvo que el cliente pida más detalle
- URL de producto siempre: https://demoiatoi.com/products/[handle]`;
}

// ═══════════════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════════════
function getTime() {
  return new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
}

function renderBubble(role, content, imageDataUrl) {
  const area = $("messagesArea");
  const row = document.createElement("div");
  row.className = `bubble-row ${role}`;

  let cleanContent = content;
  let products = [];
  let showBudgetButtons = false;

  if (role === "agent") {
    // Marcadores internos de la solicitud de presupuesto: quitarlos del texto visible
    if (cleanContent.includes('PRESUPUESTO_BOTONES')) {
      showBudgetButtons = true;
      cleanContent = cleanContent.replace(/PRESUPUESTO_BOTONES/g, '').trim();
    }
    if (cleanContent.includes('PRESUPUESTO_SOLICITADO')) {
      cleanContent = cleanContent.replace(/PRESUPUESTO_SOLICITADO/g, '').trim();
    }

    const m = cleanContent.match(/PRODUCTOS_JSON:(\[[\s\S]*?\])/);
    if (m) {
      cleanContent = cleanContent.replace(/PRODUCTOS_JSON:[\s\S]*$/, "").trim();
      try {
        const refs = JSON.parse(m[1]);
        const recommendedFlat = Object.values(recommendedProducts).flat();
        products = refs.map(r => {
          const p = CATALOG.find(x => x.id === r.id) || recommendedFlat.find(x => x.id === r.id);
          return p ? {...p, razon: r.razon} : null;
        }).filter(Boolean);
      } catch(e) {}
    }
  }

  let cardsHtml = "";
  if (products.length) {
    cardsHtml = '<div class="product-cards">' + products.map(p => `
      <a class="product-card" href="${p.url}" target="_blank">
        <img src="${p.img}" alt="${p.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2252%22 height=%2252%22><rect width=%2252%22 height=%2252%22 fill=%22%23f0e6d8%22/><text x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2222%22>🎁</text></svg>'">
        <div class="pc-info">
          <div class="pc-name">${p.title}</div>
          <div class="pc-price">Desde ${p.price}€</div>
          ${p.razon ? `<div class="pc-why">${p.razon}</div>` : ''}
          <span class="pc-cta">Ver producto →</span>
        </div>
      </a>`).join('') + '</div>';
  }

  // Convertir enlaces sueltos del mensaje en botones clicables
  let linksHtml = "";
  if (role === "agent") {
    // Si el modelo escribe enlaces en formato markdown [texto](url), quedarnos solo con la url
    cleanContent = cleanContent.replace(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, "$2");
    const urls = [...new Set(cleanContent.match(/https?:\/\/\S+/g) || [])];
    if (urls.length) {
      cleanContent = cleanContent
        .replace(/https?:\/\/\S+/g, "")
        .replace(/👉/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/:\s*[—–-]\s*/g, ": ")
        .split("\n").map(l => l.replace(/[\s:–—-]+$/, "").trim()).filter(l => l !== "")
        .join("\n").trim();
      linksHtml = '<div class="msg-links">' + urls.map(u => {
        const label = u.includes('estado-de-pedido')
          ? '📦 Consultar estado de mi pedido'
          : /correos|seur|mrw|gls|dhl|ups|fedex|nacex|tourline|envialia|tracking/i.test(u)
            ? '📦 Seguir mi envío'
            : '🔗 Abrir enlace';
        return `<a class="msg-link-btn" href="${u}" target="_blank" rel="noopener">${label}</a>`;
      }).join('') + '</div>';
    }
  }

  const msgHtml = cleanContent
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
  const avatarEmoji = role === "agent" ? getAgentAvatarHtml() : "👤";
  const imageHtml = imageDataUrl ? `<img class="msg-image" src="${imageDataUrl}" alt="Imagen adjunta">` : "";
  row.innerHTML = `
    <div class="bubble-avatar">${avatarEmoji}</div>
    <div>
      <div class="bubble">${imageHtml}${msgHtml}${cardsHtml}${linksHtml}</div>
      <div class="bubble-time">${getTime()}</div>
    </div>`;
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
  if (role === "agent") playNotificationSound();
  if (showBudgetButtons) renderQuickReplies(['🏢 Empresa', '🙋 Particular']);
}

function renderQuickReplies(replies) {
  const area = $("messagesArea");
  const wrap = document.createElement("div");
  wrap.className = "quick-replies";
  wrap.id = "quickReplies";
  replies.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "qr-btn";
    btn.textContent = r;
    btn.onclick = () => {
      wrap.remove();
      if (r === '💬 Hablar con Andrea') { showAndreaModal(); return; }
      sendUserMessage(r);
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
  area.scrollTop = area.scrollHeight;
}

function showTyping() {
  const area = $("messagesArea");
  const row = document.createElement("div");
  row.className = "bubble-row agent";
  row.id = "typingRow";
  row.innerHTML = `<div class="bubble-avatar">${getAgentAvatarHtml()}</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
  area.appendChild(row);
  area.scrollTop = area.scrollHeight;
}
function removeTyping() { $("typingRow")?.remove(); }

// ═══════════════════════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════════════════════
async function callAPI(userMsg) {
  conversationHistory.push({role:"user",content:userMsg});
  // Mientras esperamos esta respuesta, que el polling no la renderice también
  // si llega justo en este intervalo (evita el mensaje duplicado)
  window._awaitingReply = true;
  try {
    const res = await fetch("https://demoiatoi-chat-agent.vercel.app/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:1000,
        system: buildSystemPrompt(),
        messages: conversationHistory,
        conversation_id: window._convId || null,
        customer_email: window._customerEmail || null,
        customer_source: window._customerSource || null
      })
    });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    // Si es una conversación nueva, guardar su id para poder recibir respuestas de Elena/Andrea
    if (data.conversation_id && !window._convId) {
      window._convId = data.conversation_id;
      sessionStorage.setItem('dmat_conv_id', window._convId);
      document.cookie = `dmat_conv=${window._convId};max-age=86400;path=/`;
    }
    // Esta respuesta ya se va a mostrar aquí mismo: que el polling no la repita
    if (data.message_id) window._lastAndreaId = data.message_id;
    // ¿Elena le ha dicho al cliente que va a avisar a Andrea? Activar la espera con mensajes de calma
    window._lastAndreaHandoff = !!data.andrea_handoff;
    const text = data.content?.find(b=>b.type==="text")?.text || "Lo siento, ha habido un problema. ¿Puedes repetirme tu pregunta? 🙏";
    conversationHistory.push({role:"assistant",content:text});
    return text;
  } finally {
    window._awaitingReply = false;
  }
}

// ═══════════════════════════════════════════════════════════════
//  SEND
// ═══════════════════════════════════════════════════════════════
async function sendUserMessage(text) {
  const img = window._pendingImage;
  if ((!text.trim() && !img) || isTyping) return;
  _lastActivityTime = Date.now();
  _lastUserMsgTime = Date.now();
  _closingStage = 0;
  isTyping = true;
  $("quickReplies")?.remove();
  renderBubble("user", text, img ? img.dataUrl : null);
  const inp = $("chatInput");
  inp.value = ""; inp.style.height = "";
  $("sendBtn").disabled = true;
  $("attachBtn").disabled = true;
  clearPendingImage();
  showTyping();
  try {
    let content = text;
    if (img) {
      content = [
        { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 } },
        { type: "text", text: text.trim() || "¿Qué me puedes decir sobre el producto de esta imagen?" }
      ];
    }
    const reply = await callAPI(content);
    removeTyping();
    _lastActivityTime = Date.now();
    // Si Andrea está activa, no mostrar respuesta de Elena
    if (!_andreaActive) renderBubble("agent", reply);
    // Elena ha avisado a Andrea: empezar a esperar con mensajes de calma
    if (window._lastAndreaHandoff) startAndreaWaitFlow();
  } catch(e) {
    removeTyping();
    renderBubble("agent","¡Ups! Problema de conexión. Inténtalo de nuevo o escríbenos a contacto@demoiatoi.es 💛");
  }
  $("sendBtn").disabled = false;
  $("attachBtn").disabled = false;
  isTyping = false;
}

function sendMessage() {
  sendUserMessage($("chatInput").value.trim());
}

// ── ADJUNTAR IMAGEN / CAPTURA ──
function handleFileSelect(e) {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    renderBubble("agent", "Solo puedo recibir imágenes (fotos o capturas de pantalla) 📎");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    renderBubble("agent", "La imagen pesa demasiado (máx. 5MB). ¿Puedes enviarme una más ligera? 📎");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    window._pendingImage = { dataUrl, base64: dataUrl.split(",")[1], mediaType: file.type };
    $("previewImg").src = dataUrl;
    $("imagePreview").style.display = "flex";
  };
  reader.readAsDataURL(file);
}

function clearPendingImage() {
  window._pendingImage = null;
  $("previewImg").src = "";
  $("imagePreview").style.display = "none";
}
function handleKey(e) { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }
function autoResize(el) { el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,96)+"px"; }

// ── CONFIGURACIÓN DEL AGENTE (desde el panel de Andrea) ──
async function loadAgentSettings() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/store_settings?id=eq.1&select=agent_name,agent_avatar,shipping_policy,returns_policy,extra_instructions,recommended_products`,
      { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } });
    const [s] = await res.json();
    if (!s) return;
    if (s.agent_name) agentConfig.name = s.agent_name;
    if (s.agent_avatar) agentConfig.avatar = s.agent_avatar;
    if (s.shipping_policy) agentConfig.shipping = s.shipping_policy;
    if (s.returns_policy) agentConfig.returns = s.returns_policy;
    agentConfig.extra = s.extra_instructions || "";
    if (s.recommended_products) recommendedProducts = Object.assign(recommendedProducts, s.recommended_products);
    $("agentNameDisplay").textContent = `${agentConfig.name} · De Moi à Toi`;
    applyAgentAvatar();
  } catch (e) {}
}

// ── FOTO DEL AGENTE ──
function getAgentAvatarHtml() {
  return agentConfig.avatar ? `<img src="${agentConfig.avatar}" alt="${agentConfig.name}">` : "🎁";
}

function applyAgentAvatar() {
  const html = getAgentAvatarHtml();
  $("agentAvatarWrap").innerHTML = html;
  $("gateLogo1").innerHTML = html;
  const fab = $("dmatFab");
  if (fab && !$("chatWidget").classList.contains('dmat-open')) {
    fab.innerHTML = html === "🎁" ? "💬" : html;
  }
}

// ═══════════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════════
let _selectedSource = null;
let _selectedStar = 0;
let _chatInitialized = false;

function goToStep2() {
  const email = $('emailInput').value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    $('emailError').style.display = 'block';
    return;
  }
  window._customerEmail = email;
  $('gateStep1').classList.remove('active');
  $('gateStep2').classList.add('active');
}

function selectSource(btn, source) {
  _selectedSource = source;
  $qa('.source-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const submitBtn = $('sourceSubmit');
  submitBtn.style.opacity = '1';
  submitBtn.style.pointerEvents = 'auto';
}

function submitSource() {
  const email = window._customerEmail;
  window._customerSource = _selectedSource;
  // Descartar cualquier conversación previa (de otro email) antes de buscar la de este email
  window._convId = null;
  try {
    sessionStorage.removeItem('dmat_conv_id');
    document.cookie = 'dmat_conv=;max-age=0;path=/';
    sessionStorage.setItem('dmat_email', email);
    document.cookie = `dmat_email=${email};max-age=86400;path=/`;
    fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?customer_email=eq.${encodeURIComponent(email)}&status=neq.resolved&order=updated_at.desc&limit=1`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
    }).then(r=>r.json()).then(data => {
      if (data && data.length > 0) {
        window._convId = data[0].id;
        sessionStorage.setItem('dmat_conv_id', window._convId);
        document.cookie = `dmat_conv=${window._convId};max-age=86400;path=/`;
      }
      showChat();
    }).catch(() => showChat());
  } catch(e) { showChat(); }
}

function setStar(n) {
  _selectedStar = n;
  $qa('.star').forEach((s,i) => {
    s.classList.toggle('active', i < n);
  });
}

function submitRating() {
  if (_selectedStar === 0) return;
  const comment = $('ratingComment').value.trim();
  if (window._convId) {
    fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?id=eq.${window._convId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON,
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ rating: _selectedStar, rating_comment: comment, status: 'resolved' })
    });
  }
  $q('.rating-box').innerHTML = '<div class="rating-icon">💛</div><div class="rating-thanks">¡Gracias por tu valoración! Nos ayuda mucho a mejorar.</div>';
  setTimeout(() => { $('ratingOverlay').classList.remove('show'); }, 2000);
}

function skipRating() {
  $('ratingOverlay').classList.remove('show');
}

function showRating() {
  $('ratingOverlay').classList.add('show');
}

async function showChat() {
  $('emailGate').style.display = 'none';
  $('messagesArea').style.display = 'flex';
  $('inputArea').style.display = 'block';
  startPolling();

  // Si hay conversación previa, cargar los últimos mensajes
  if (window._convId) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/chat_messages?conversation_id=eq.${window._convId}&order=created_at.asc&limit=30`,
        { headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` } }
      )
      const msgs = await res.json()
      if (msgs && msgs.length > 0) {
        // Reconstruir historial para el contexto de la IA
        conversationHistory = msgs
          .filter(m => !m.is_from_andrea && m.content !== 'sofia_resume')
          .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

        // Mostrar los últimos 6 mensajes visualmente
        const lastMsgs = msgs.slice(-6)
        const area = $('messagesArea')
        if (lastMsgs.length > 0) {
          const divider = document.createElement('div')
          divider.style.cssText = 'text-align:center;font-size:.72rem;color:var(--warm-gray);padding:8px 0;opacity:.7'
          divider.textContent = '— Conversación anterior —'
          area.appendChild(divider)
        }
        lastMsgs.forEach(m => {
          if (m.content === 'sofia_resume') return
          if (m.is_from_andrea) {
            renderAndreaBubble(m.content)
          } else {
            renderBubble(m.role === 'user' ? 'user' : 'agent', m.content)
          }
        })
        // Guardar ID del último mensaje para que el polling solo muestre mensajes nuevos
        const lastMsg = msgs[msgs.length - 1]
        if (lastMsg) window._lastAndreaId = lastMsg.id
        // No mostrar saludo inicial si hay historial
        return
      }
    } catch(e) {}
  }

  startChat();
}

function initChat() {
  if (window._customerEmail) {
    showChat();
    return;
  }
  $('emailGate').style.display = 'flex';
  $('messagesArea').style.display = 'none';
  $('inputArea').style.display = 'none';
}

function startChat() {
  renderBubble("agent", `¡Hola! 👋 Soy ${agentConfig.name}, ayudante asistida por IA de Andrea en De Moi à Toi Regalos. ¿Cómo te llamas? Así puedo ayudarte de forma más cercana 😊 Y cuéntame, ¿qué andas buscando?`);
  renderQuickReplies([
    "🎁 Busco un regalo o detalle",
    "📦 Estado de mi pedido",
    "⚠️ Tengo una incidencia",
    "💬 Hablar con Andrea"
  ]);
}

function showAndreaModal() {
  const modal = $('andreaModal');
  modal.style.display = 'flex';
}
function closeAndreaModal() {
  $('andreaModal').style.display = 'none';
}
// Avisa al panel de Andrea: marca la conversación como "necesita atención"
function notifyAndreaContact(channel) {
  _pausedForAndrea = true
  fetch("https://demoiatoi-chat-agent.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      is_contact_request: true,
      contact_channel: channel,
      conversation_id: window._convId || null,
      customer_email: window._customerEmail || null,
      customer_source: window._customerSource || null
    })
  }).then(r => r.json()).then(data => {
    if (data?.conversation_id && !window._convId) {
      window._convId = data.conversation_id;
      sessionStorage.setItem('dmat_conv_id', window._convId);
      document.cookie = `dmat_conv=${window._convId};max-age=86400;path=/`;
    }
  }).catch(() => {});
}
function waitForAndrea() {
  closeAndreaModal();
  renderBubble("agent", "¡Perfecto! 👩‍💼 Andrea se unirá a esta conversación en breve. Puedes seguir escribiendo aquí y ella te responderá directamente.");
  notifyAndreaContact('chat');
}
function contactAndreaEmail() {
  closeAndreaModal();
  notifyAndreaContact('email');
  window.open('mailto:contacto@demoiatoi.es?subject=Quiero%20hablar%20con%20Andrea&body=Hola%20Andrea%2C%20me%20pongo%20en%20contacto%20contigo%20desde%20el%20chat%20de%20la%20tienda.', '_blank');
}

// ═══════════════════════════════════════════════════════════════
//  FAB + ABRIR/CERRAR WIDGET
// ═══════════════════════════════════════════════════════════════
function openWidget() {
  $('chatWidget').classList.add('dmat-open');
  $('dmatFab').classList.add('dmat-hidden');
  if (!_chatInitialized) {
    _chatInitialized = true;
    initChat();
  }
}

function closeWidget() {
  $('chatWidget').classList.remove('dmat-open');
  $('dmatFab').classList.remove('dmat-hidden');
}

// ═══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
$('dmatFab').addEventListener('click', openWidget);
$('dmatCloseBtn').addEventListener('click', closeWidget);
$('soundToggle').addEventListener('click', toggleSound);

$('emailInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') goToStep2(); });
$('gateStep1Submit').addEventListener('click', goToStep2);

$qa('.source-btn').forEach(btn => {
  btn.addEventListener('click', () => selectSource(btn, btn.dataset.source));
});
$('sourceSubmit').addEventListener('click', submitSource);

$qa('.star').forEach(star => {
  star.addEventListener('click', () => setStar(parseInt(star.dataset.star, 10)));
});
$('ratingSubmitBtn').addEventListener('click', submitRating);
$('ratingSkipBtn').addEventListener('click', skipRating);

$('clearImageBtn').addEventListener('click', clearPendingImage);
$('fileInput').addEventListener('change', handleFileSelect);
$('attachBtn').addEventListener('click', () => $('fileInput').click());
$('chatInput').addEventListener('keydown', handleKey);
$('chatInput').addEventListener('input', (e) => autoResize(e.target));
$('sendBtn').addEventListener('click', sendMessage);

$('andreaBarBtn').addEventListener('click', showAndreaModal);
$('waitForAndreaBtn').addEventListener('click', waitForAndrea);
$('contactAndreaEmailBtn').addEventListener('click', contactAndreaEmail);
$('closeAndreaModalBtn').addEventListener('click', closeAndreaModal);

// ═══════════════════════════════════════════════════════════════
//  ARRANQUE
// ═══════════════════════════════════════════════════════════════
updateSoundIcon();
loadAgentSettings();

// Recuperar email y conversación anterior si existe
try {
  window._customerEmail = sessionStorage.getItem('dmat_email') ||
    (document.cookie.split(';').find(c=>c.trim().startsWith('dmat_email=')) || '').split('=')[1]?.trim() || null;
  window._convId = sessionStorage.getItem('dmat_conv_id') ||
    (document.cookie.split(';').find(c=>c.trim().startsWith('dmat_conv=')) || '').split('=')[1]?.trim() || null;

  // Si tiene email pero no convId, buscarlo en Supabase
  if (window._customerEmail && !window._convId) {
    fetch(`${SUPABASE_URL}/rest/v1/chat_conversations?customer_email=eq.${encodeURIComponent(window._customerEmail)}&status=neq.resolved&order=updated_at.desc&limit=1`, {
      headers: { 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` }
    }).then(r=>r.json()).then(data => {
      if (data && data.length > 0) {
        window._convId = data[0].id;
        sessionStorage.setItem('dmat_conv_id', window._convId);
        document.cookie = `dmat_conv=${window._convId};max-age=86400;path=/`;
      }
    }).catch(()=>{});
  }
} catch(e) {}

})();
