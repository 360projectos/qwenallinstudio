export interface AcademyCategory { id: string; name: string; description: string }
export const ACADEMY_CATEGORIES: AcademyCategory[] = [
  { id: 'rfi', name: 'RFI (Raise First In)', description: 'Rangos de apertura por posicion.' },
  { id: 'bbdef', name: 'Defensa BB', description: 'Defender vs opens con pot odds y equidad.' },
  { id: 'vs3bet', name: 'vs 3bet', description: 'Fold/call/4bet tras abrir y recibir 3bet.' },
  { id: 'cbet_ip', name: 'Cbet IP', description: 'Continuation bet en posicion.' },
  { id: 'cbet_oop', name: 'Cbet OOP', description: 'Continuation bet fuera de posicion.' },
  { id: 'probe', name: 'Probe bet', description: 'Apostar turn tras check del agresor.' },
  { id: 'checkraise', name: 'Check-raise', description: 'Check-raise con draws y valor.' },
  { id: 'turnbarrel', name: 'Turn barrel', description: 'Segundo barril selectivo.' },
  { id: 'riverbluff', name: 'River bluff', description: 'Faroles con bloqueadores.' },
  { id: 'bluffcatch', name: 'Bluffcatch', description: 'Pagar faroles con manos medias.' },
  { id: 'squeeze', name: 'Squeeze', description: '3bet tras open + call.' },
  { id: '3betpot_oop', name: '3bet pot OOP', description: 'Jugar pots 3bet fuera de posicion.' },
];
export interface AcademySpot { id: string; category: string; question: string; options: string[]; correct: number; explanation: string; difficulty: 1 | 2 | 3 }
export const ACADEMY_SPOTS: AcademySpot[] = [
  { id: 'rfi-utg', category: 'rfi', question: 'UTG 6-max, 100bb. ¿Con que rango abres 2.5bb?', options: ['22+,ATs+,KJs+,QJs,JTs,T9s,98s,AQo+,KQo (~15%)', 'Any two cards', 'Solo AA/KK', '72o+'], correct: 0, explanation: 'UTG es la posicion mas temprana: rango tight ~15% con pairs, broadways suited y connectors altos.', difficulty: 1 },
  { id: 'rfi-btn', category: 'rfi', question: 'BTN vs BB, todos foldean. ¿Rango de open?', options: ['Solo premiums', '~42% amplio (22+,A2s+,K2s+,Q4s+,...)', 'Solo suited', 'Nunca abres'], correct: 1, explanation: 'BTN abre muy amplio (~42%) porque tienes posicion y solo quedan 2 ciegas.', difficulty: 1 },
  { id: 'bbdef-1', category: 'bbdef', question: 'BB vs BTN open 2.5bb. Tienes 76s. ¿Accion?', options: ['Fold', 'Call (defender)', '3bet all-in', 'Raise 100bb'], correct: 1, explanation: '76s tiene buena equidad y jugabilidad; pagas por pot odds y posicion relativa del board.', difficulty: 2 },
  { id: 'vs3bet-1', category: 'vs3bet', question: 'Abres CO con AQo, BB 3bet a 11bb. ¿Accion?', options: ['Fold', 'Call', '4bet a 24bb', 'Limp'], correct: 1, explanation: 'AQo vs 3bet BB: call para mantener rango ancho y jugar postflop; 4bet solo vs rangos muy anchos.', difficulty: 2 },
  { id: 'cbetip-1', category: 'cbet_ip', question: 'BTN abriste, BB pago. Flop A72 rainbow. ¿Cbet?', options: ['Check siempre', 'Cbet small (~33%) con rango amplio', 'All-in', 'Fold'], correct: 1, explanation: 'Flop seco A-high favorece al agresor IP: cbet pequena con casi todo el rango.', difficulty: 2 },
  { id: 'cbetoop-1', category: 'cbet_oop', question: 'SB abriste, BTN pago. Flop K94 two-tone. ¿Cbet OOP?', options: ['Cbet 100% rango', 'Cbet selectiva (~50%) con tamano medio', 'Check siempre', 'All-in'], correct: 1, explanation: 'OOP cbet menos frecuente y mas grande para proteger equidad y negar realizacion.', difficulty: 3 },
  { id: 'probe-1', category: 'probe', question: 'BB defendiste, BTN cbet flop, tu pagaste. Turn BTN check. ¿Probe?', options: ['Check back siempre', 'Probe ~50% con draws y manos medias', 'All-in', 'Fold'], correct: 1, explanation: 'Probe turn cuando el agresor muestra debilidad (check): apuestas draws y valor fino.', difficulty: 3 },
  { id: 'cr-1', category: 'checkraise', question: 'BB vs BTN cbet flop 9c8d3c. Tienes JcTc. ¿Check-raise?', options: ['Fold', 'Call', 'Check-raise (combo draw)', 'Limp'], correct: 2, explanation: 'Combo draw (flush+straight) es candidato ideal de check-raise: fold equity + equidad.', difficulty: 2 },
  { id: 'barrel-1', category: 'turnbarrel', question: 'Cbet flop, BB pago. Turn es brick. ¿Segundo barril?', options: ['Siempre', 'Selectivo: con equidad/blockers y scare cards', 'Nunca', 'All-in cualquier'], correct: 1, explanation: 'Turn barrel selectivo: continua con draws fuertes, blockers y cartas que favorecen tu rango.', difficulty: 3 },
  { id: 'rbluff-1', category: 'riverbluff', question: 'River, tienes missed flush draw con blocker al nut flush. ¿Bluff?', options: ['Check siempre', 'Bluff si bloqueas nuts y villain puede foldear', 'All-in any', 'Fold'], correct: 1, explanation: 'Bluff river con blockers a nuts: reduces combos de call del villano.', difficulty: 3 },
  { id: 'bluffcatch-1', category: 'bluffcatch', question: 'River, tienes second pair. Villano apuesta grande. ¿Bluffcatch?', options: ['Siempre pago', 'Depende de pot odds y su frecuencia de farol', 'Fold siempre', 'Raise'], correct: 1, explanation: 'Bluffcatch = pagar si tu equidad vs su rango de farol supera pot odds.', difficulty: 3 },
  { id: 'sqz-1', category: 'squeeze', question: 'CO abre, BTN paga. SB con A5s. ¿Squeeze?', options: ['Fold', 'Call', 'Squeeze 3bet grande (~4x)', 'Limp'], correct: 2, explanation: 'A5s es buen squeeze (blocker a AA, equidad, fold equity vs 2 jugadores).', difficulty: 2 },
];
