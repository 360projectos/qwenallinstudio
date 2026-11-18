export interface WizardHand { id: string; name: string; hero: string; heroPos: string; villainPos: string; archetype: string; villainRange: string; flop: string; turn: string; river: string; pots: Record<string, number>; stacks: Record<string, number>; facing: Record<string, boolean>; callCost: Record<string, number> }
export const WIZARD_HANDS: WizardHand[] = [
 {
  "id": "w01",
  "name": "BTN SRP \u00b7 top pair + nut flush draw",
  "hero": "AhKh",
  "heroPos": "BTN",
  "villainPos": "BB",
  "archetype": "tag",
  "villainRange": "22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo",
  "flop": "Ks 7h 2h",
  "turn": "Ks 7h 2h 9s",
  "river": "Ks 7h 2h 9s 3d",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": true,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w02",
  "name": "BB defend \u00b7 second pair + gutshot",
  "hero": "QdJd",
  "heroPos": "BB",
  "villainPos": "BTN",
  "archetype": "lag",
  "villainRange": "22+,A2s+,K7s+,Q9s+,J9s+,T8s+,97s+,87s,76s,ATo+,KJo+,QJo,JTo",
  "flop": "Jh 8c 4d",
  "turn": "Jh 8c 4d 2s",
  "river": "Jh 8c 4d 2s 7c",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": false,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w03",
  "name": "3bet pot \u00b7 top pair top kicker",
  "hero": "AsKs",
  "heroPos": "CO",
  "villainPos": "BTN",
  "archetype": "tag",
  "villainRange": "22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo",
  "flop": "Kh 9h 4c",
  "turn": "Kh 9h 4c 7d",
  "river": "Kh 9h 4c 7d 2c",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": false,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w04",
  "name": "Squeeze \u00b7 combo draw",
  "hero": "JcTc",
  "heroPos": "SB",
  "villainPos": "BTN",
  "archetype": "fish",
  "villainRange": "22+,A2s+,K2s+,Q5s+,J6s+,T6s+,96s+,86s+,76s,65s,54s,A2o+,K7o+,Q9o+,J9o+,T9o",
  "flop": "9c 8d 3c",
  "turn": "9c 8d 3c 4h",
  "river": "9c 8d 3c 4h 2d",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": true,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w05",
  "name": "4bet pot \u00b7 bluffcatch river",
  "hero": "AdQd",
  "heroPos": "BTN",
  "villainPos": "SB",
  "archetype": "maniac",
  "villainRange": "22+,A2s+,K2s+,Q2s+,J2s+,T2s+,92s+,82s+,72s+,62s+,52s+,42s+,32s,A2o+,K2o+,Q2o+,J2o+,T2o+,92o+,82o+,72o+,62o+,52o+,42o+,32o",
  "flop": "Qh 7c 2d",
  "turn": "Qh 7c 2d 9s",
  "river": "Qh 7c 2d 9s 3h",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": false,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w06",
  "name": "Set en flop seco",
  "hero": "9d9c",
  "heroPos": "MP",
  "villainPos": "BB",
  "archetype": "tag",
  "villainRange": "22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo",
  "flop": "9h Kd 4c",
  "turn": "9h Kd 4c 2s",
  "river": "9h Kd 4c 2s 7h",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": false,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w07",
  "name": "Open-ended straight draw",
  "hero": "8h7h",
  "heroPos": "CO",
  "villainPos": "BB",
  "archetype": "lag",
  "villainRange": "22+,A2s+,K7s+,Q9s+,J9s+,T8s+,97s+,87s,76s,ATo+,KJo+,QJo,JTo",
  "flop": "6h 5d 2c",
  "turn": "6h 5d 2c Ks",
  "river": "6h 5d 2c Ks 9h",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": true,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w08",
  "name": "Nut flush draw + ace high",
  "hero": "Ac5c",
  "heroPos": "BTN",
  "villainPos": "BB",
  "archetype": "tag",
  "villainRange": "22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo",
  "flop": "Ah 9c 4c",
  "turn": "Ah 9c 4c 7s",
  "river": "Ah 9c 4c 7s 2d",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": false,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w09",
  "name": "Top pair + gutshot OOP",
  "hero": "KdQd",
  "heroPos": "SB",
  "villainPos": "BB",
  "archetype": "fish",
  "villainRange": "22+,A2s+,K2s+,Q5s+,J6s+,T6s+,96s+,86s+,76s,65s,54s,A2o+,K7o+,Q9o+,J9o+,T9o",
  "flop": "Qh Jd 4c",
  "turn": "Qh Jd 4c 8s",
  "river": "Qh Jd 4c 8s 2h",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": false,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w10",
  "name": "Combo draw vs BTN",
  "hero": "Td9d",
  "heroPos": "BB",
  "villainPos": "BTN",
  "archetype": "lag",
  "villainRange": "22+,A2s+,K7s+,Q9s+,J9s+,T8s+,97s+,87s,76s,ATo+,KJo+,QJo,JTo",
  "flop": "8d 7c 3h",
  "turn": "8d 7c 3h Js",
  "river": "8d 7c 3h Js 4d",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": true,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w11",
  "name": "Overpair AA flop seco",
  "hero": "AhAs",
  "heroPos": "UTG",
  "villainPos": "BB",
  "archetype": "nit",
  "villainRange": "77+,ATs+,KJs+,AQo+",
  "flop": "Kd 7c 2h",
  "turn": "Kd 7c 2h 9s",
  "river": "Kd 7c 2h 9s 4d",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": false,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w12",
  "name": "Royal flush draw",
  "hero": "KcQc",
  "heroPos": "BTN",
  "villainPos": "BB",
  "archetype": "tag",
  "villainRange": "22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo",
  "flop": "Jc Tc 4d",
  "turn": "Jc Tc 4d 2s",
  "river": "Jc Tc 4d 2s 8h",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": false,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w13",
  "name": "Straight draw low",
  "hero": "7d6d",
  "heroPos": "CO",
  "villainPos": "BTN",
  "archetype": "fish",
  "villainRange": "22+,A2s+,K2s+,Q5s+,J6s+,T6s+,96s+,86s+,76s,65s,54s,A2o+,K7o+,Q9o+,J9o+,T9o",
  "flop": "5h 4c 2d",
  "turn": "5h 4c 2d Ks",
  "river": "5h 4c 2d Ks 9c",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": true,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w14",
  "name": "Two pair jack-ten",
  "hero": "JsTs",
  "heroPos": "MP",
  "villainPos": "BB",
  "archetype": "tag",
  "villainRange": "22+,A9s+,KTs+,QTs+,JTs,T9s,98s,AJo+,KQo",
  "flop": "Jh Th 4c",
  "turn": "Jh Th 4c 2s",
  "river": "Jh Th 4c 2s 7h",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": false,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w15",
  "name": "Set de damas OOP",
  "hero": "QhQs",
  "heroPos": "SB",
  "villainPos": "BTN",
  "archetype": "lag",
  "villainRange": "22+,A2s+,K7s+,Q9s+,J9s+,T8s+,97s+,87s,76s,ATo+,KJo+,QJo,JTo",
  "flop": "Qd 8c 3h",
  "turn": "Qd 8c 3h 5s",
  "river": "Qd 8c 3h 5s 2d",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": true,
   "turn": false,
   "river": false
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 },
 {
  "id": "w16",
  "name": "AK top pair vs maniac",
  "hero": "AdKd",
  "heroPos": "BTN",
  "villainPos": "BB",
  "archetype": "maniac",
  "villainRange": "22+,A2s+,K2s+,Q2s+,J2s+,T2s+,92s+,82s+,72s+,62s+,52s+,42s+,32s,A2o+,K2o+,Q2o+,J2o+,T2o+,92o+,82o+,72o+,62o+,52o+,42o+,32o",
  "flop": "Kc 7h 2d",
  "turn": "Kc 7h 2d 9s",
  "river": "Kc 7h 2d 9s 4c",
  "pots": {
   "preflop": 6.5,
   "flop": 6.5,
   "turn": 16,
   "river": 34
  },
  "stacks": {
   "preflop": 97,
   "flop": 97,
   "turn": 88,
   "river": 70
  },
  "facing": {
   "preflop": true,
   "flop": false,
   "turn": true,
   "river": true
  },
  "callCost": {
   "preflop": 2.5,
   "flop": 3.2,
   "turn": 8,
   "river": 17
  }
 }
];
