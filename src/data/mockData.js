export const rooms = [
  {
    id: 'room-a',
    name: 'A 室 · 主排练厅',
    capacity: 8,
    size: '40㎡',
    basePrice: 120,
    noiseLimit: 85,
    image: 'room-a'
  },
  {
    id: 'room-b',
    name: 'B 室 · 小型练习室',
    capacity: 4,
    size: '20㎡',
    basePrice: 60,
    noiseLimit: 75,
    image: 'room-b'
  },
  {
    id: 'room-c',
    name: 'C 室 · 录音棚',
    capacity: 6,
    size: '30㎡',
    basePrice: 200,
    noiseLimit: 65,
    image: 'room-c'
  }
]

export const equipments = [
  { id: 'drum-set', name: '架子鼓', category: 'percussion', icon: '🥁', price: 0, included: true },
  { id: 'bass-amp', name: '贝斯音箱', category: 'amplifier', icon: '🔊', price: 30, included: false },
  { id: 'guitar-amp', name: '吉他音箱', category: 'amplifier', icon: '🎸', price: 25, included: false },
  { id: 'mic-1', name: '人声麦 SM58', category: 'microphone', icon: '🎤', price: 15, included: false },
  { id: 'mic-2', name: '动圈麦 x2', category: 'microphone', icon: '🎙️', price: 20, included: false },
  { id: 'keyboard', name: '电子键盘', category: 'keyboard', icon: '🎹', price: 40, included: false },
  { id: 'audio-interface', name: '录音接口', category: 'recording', icon: '🎚️', price: 50, included: false },
  { id: 'monitor', name: '监听耳机 x4', category: 'recording', icon: '🎧', price: 25, included: false }
]

export const bandMembers = [
  { id: 'm1', name: '阿凯', role: '主唱 / 队长', instrument: 'vocals', avatar: '👨‍🎤', isLeader: true },
  { id: 'm2', name: '小宇', role: '吉他手', instrument: 'guitar', avatar: '🎸', isLeader: false },
  { id: 'm3', name: '阿哲', role: '贝斯手', instrument: 'bass', avatar: '🎻', isLeader: false },
  { id: 'm4', name: '豆豆', role: '鼓手', instrument: 'drums', avatar: '🥁', isLeader: false },
  { id: 'm5', name: '晓晓', role: '键盘手', instrument: 'keyboard', avatar: '🎹', isLeader: false }
]

export const timeSlots = [
  { id: 't1', start: '09:00', end: '10:00', label: '09:00 - 10:00' },
  { id: 't2', start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { id: 't3', start: '11:00', end: '12:00', label: '11:00 - 12:00' },
  { id: 't4', start: '13:00', end: '14:00', label: '13:00 - 14:00' },
  { id: 't5', start: '14:00', end: '15:00', label: '14:00 - 15:00' },
  { id: 't6', start: '15:00', end: '16:00', label: '15:00 - 16:00' },
  { id: 't7', start: '16:00', end: '17:00', label: '16:00 - 17:00' },
  { id: 't8', start: '18:00', end: '19:00', label: '18:00 - 19:00' },
  { id: 't9', start: '19:00', end: '20:00', label: '19:00 - 20:00' },
  { id: 't10', start: '20:00', end: '21:00', label: '20:00 - 21:00' },
  { id: 't11', start: '21:00', end: '22:00', label: '21:00 - 22:00' }
]

export const aaModes = [
  { id: 'equal', name: '人均 AA', description: '所有成员平摊费用' },
  { id: 'instrument', name: '按设备分摊', description: '使用设备的成员承担对应费用' },
  { id: 'leader', name: '队长垫付', description: '队长先垫付，事后结算' }
]

export const existingBookings = [
  {
    id: 'b1',
    roomId: 'room-a',
    date: '2026-06-20',
    slots: ['t5', 't6', 't7'],
    bandName: '银河乐队',
    members: ['m1', 'm2', 'm3', 'm4'],
    equipments: ['drum-set', 'bass-amp', 'guitar-amp', 'mic-1'],
    leaderId: 'm1',
    status: 'confirmed',
    aaMode: 'equal'
  },
  {
    id: 'b2',
    roomId: 'room-b',
    date: '2026-06-20',
    slots: ['t8', 't9'],
    bandName: '午后阳光',
    members: ['m5', 'm2'],
    equipments: ['keyboard', 'guitar-amp'],
    leaderId: 'm5',
    status: 'pending',
    aaMode: 'equal'
  },
  {
    id: 'b3',
    roomId: 'room-c',
    date: '2026-06-21',
    slots: ['t4', 't5', 't6', 't7'],
    bandName: '银河乐队',
    members: ['m1', 'm2', 'm3', 'm4', 'm5'],
    equipments: ['drum-set', 'bass-amp', 'guitar-amp', 'mic-1', 'mic-2', 'keyboard', 'audio-interface', 'monitor'],
    leaderId: 'm1',
    status: 'confirmed',
    aaMode: 'instrument'
  }
]
