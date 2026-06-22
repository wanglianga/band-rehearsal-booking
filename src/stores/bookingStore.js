import { writable, derived, get } from 'svelte/store'
import { 
  rooms, equipments, bandMembers, timeSlots, aaModes, existingBookings,
  backupMembers, KEY_ROLES, CONFLICT_EQUIPMENT_IDS, premiumPricing
} from '../data/mockData.js'

export const RECORDING_EQUIPMENT_IDS = ['audio-interface', 'monitor']

export const currentView = writable('leader')

export const selectedDate = writable('2026-06-21')
export const selectedRoom = writable('room-a')
export const selectedSlots = writable(['t5', 't6'])
export const selectedEquipments = writable(['drum-set', 'guitar-amp', 'mic-1'])
export const invitedMembers = writable(['m1', 'm2', 'm3', 'm4', 'm5'])
export const selectedAaMode = writable('equal')
export const recordingNeeded = writable(true)

recordingNeeded.subscribe(needRecording => {
  selectedEquipments.update(eqs => {
    let newEqs = [...eqs]
    if (needRecording) {
      RECORDING_EQUIPMENT_IDS.forEach(id => {
        if (!newEqs.includes(id)) {
          newEqs.push(id)
        }
      })
    } else {
      newEqs = newEqs.filter(id => !RECORDING_EQUIPMENT_IDS.includes(id))
    }
    return newEqs
  })
})

export const bandName = writable('银河乐队')
export const memberConfirmations = writable({
  m1: 'confirmed',
  m2: 'confirmed',
  m3: 'pending',
  m4: 'declined',
  m5: 'pending'
})
export const memberPayments = writable({
  m1: true,
  m2: true,
  m3: false,
  m4: false,
  m5: false
})

export const currentMemberId = writable('m2')
export const currentBookingId = writable(null)
export const bookingSubmitted = writable(false)
export const equipmentConflictResolved = writable(false)
export const selectedConflictSolution = writable(null)
export const downgradedToSectional = writable(false)

export const allBookings = writable(existingBookings)

export const totalPrice = derived(
  [selectedRoom, selectedSlots, selectedEquipments, selectedConflictSolution],
  ([$selectedRoom, $selectedSlots, $selectedEquipments, $selectedConflictSolution]) => {
    const room = rooms.find(r => r.id === $selectedRoom)
    const roomCost = room ? room.basePrice * $selectedSlots.length : 0
    let equipCost = $selectedEquipments.reduce((sum, eqId) => {
      const eq = equipments.find(e => e.id === eqId)
      return sum + (eq ? eq.price * $selectedSlots.length : 0)
    }, 0)
    
    if ($selectedConflictSolution && $selectedConflictSolution.type === 'premium') {
      const multiplier = premiumPricing[$selectedConflictSolution.option]?.multiplier || 1
      equipCost = Math.round(equipCost * multiplier)
    }
    
    return roomCost + equipCost
  }
)

export const pricePerPerson = derived(
  [totalPrice, invitedMembers, selectedAaMode],
  ([$totalPrice, $invitedMembers, $selectedAaMode]) => {
    if ($selectedAaMode === 'equal' && $invitedMembers.length > 0) {
      return Math.round($totalPrice / $invitedMembers.length)
    }
    return $totalPrice
  }
)

export const conflictSlots = derived(
  [selectedDate, selectedRoom, allBookings],
  ([$selectedDate, $selectedRoom, $allBookings]) => {
    const conflicts = new Set()
    $allBookings.forEach(booking => {
      if (booking.date === $selectedDate && booking.roomId === $selectedRoom && booking.status !== 'cancelled') {
        booking.slots.forEach(slot => conflicts.add(slot))
      }
    })
    return conflicts
  }
)

export const attendanceAnalysis = derived(
  [invitedMembers, memberConfirmations, recordingNeeded],
  ([$invitedMembers, $memberConfirmations, $recordingNeeded]) => {
    const confirmed = []
    const declined = []
    const pending = []
    
    $invitedMembers.forEach(memberId => {
      const member = bandMembers.find(m => m.id === memberId) || backupMembers.find(m => m.id === memberId)
      if (!member) return
      
      const status = $memberConfirmations[memberId] || 'pending'
      const entry = { ...member, status }
      
      if (status === 'confirmed') confirmed.push(entry)
      else if (status === 'declined') declined.push(entry)
      else pending.push(entry)
    })
    
    const declinedKeyMembers = declined.filter(m => KEY_ROLES.includes(m.instrument))
    const pendingKeyMembers = pending.filter(m => KEY_ROLES.includes(m.instrument))
    const missingKeyRoles = [...new Set(declinedKeyMembers.map(m => m.instrument))]
    
    const riskLevel = declinedKeyMembers.length > 0 ? 'high' 
                    : pendingKeyMembers.length >= 2 ? 'medium' 
                    : pendingKeyMembers.length > 0 ? 'low' 
                    : 'none'
    
    const needBackup = declinedKeyMembers.length > 0
    const backupOptions = missingKeyRoles.map(role => 
      backupMembers.find(b => b.backupFor.includes(role))
    ).filter(Boolean)
    
    const keepRecording = $recordingNeeded && 
                          confirmed.length >= 3 && 
                          declinedKeyMembers.length < 2
    
    const keyMemberMissing = declinedKeyMembers.length > 0
    const suggestReschedule = declinedKeyMembers.length >= 2 || 
                              (declinedKeyMembers.length > 0 && pendingKeyMembers.length > 0)
    const suggestDowngrade = declinedKeyMembers.length === 1 && 
                             pendingKeyMembers.length === 0 && 
                             confirmed.length >= 3
    
    return {
      confirmed,
      declined,
      pending,
      confirmedCount: confirmed.length,
      declinedCount: declined.length,
      pendingCount: pending.length,
      totalInvited: $invitedMembers.length,
      declinedKeyMembers,
      pendingKeyMembers,
      missingKeyRoles,
      riskLevel,
      riskDescription: riskLevel === 'high' ? '高风险：关键成员缺席'
                      : riskLevel === 'medium' ? '中风险：多人待确认'
                      : riskLevel === 'low' ? '低风险：个别成员待确认'
                      : '全员已确认',
      needBackup,
      backupOptions,
      keepRecording,
      keyMemberMissing,
      suggestReschedule,
      suggestDowngrade
    }
  }
)

export const equipmentConflicts = derived(
  [selectedDate, selectedSlots, selectedEquipments, allBookings, selectedRoom, equipmentConflictResolved],
  ([$selectedDate, $selectedSlots, $selectedEquipments, $allBookings, $selectedRoom, $equipmentConflictResolved]) => {
    if ($equipmentConflictResolved) return { hasConflict: false, conflicts: [], solutions: [] }
    
    const conflicts = []
    const selectedConflictEquipments = $selectedEquipments.filter(eqId => 
      CONFLICT_EQUIPMENT_IDS.includes(eqId)
    )
    
    $allBookings.forEach(booking => {
      if (booking.date !== $selectedDate || booking.status === 'cancelled') return
      
      const slotOverlap = booking.slots.some(s => $selectedSlots.includes(s))
      if (!slotOverlap) return
      
      const eqOverlap = booking.equipments.filter(eqId => 
        selectedConflictEquipments.includes(eqId)
      )
      
      eqOverlap.forEach(eqId => {
        const eq = equipments.find(e => e.id === eqId)
        if (eq && !conflicts.find(c => c.eqId === eqId)) {
          conflicts.push({
            eqId,
            eqName: eq.name,
            eqIcon: eq.icon,
            conflictWith: booking.bandName,
            conflictRoom: rooms.find(r => r.id === booking.roomId)?.name,
            conflictSlots: booking.slots
          })
        }
      })
    })
    
    const solutions = []
    
    if (conflicts.length > 0) {
      const availableRooms = rooms.filter(room => {
        if (room.id === $selectedRoom) return true
        const roomConflicts = $allBookings.filter(b => 
          b.date === $selectedDate && 
          b.roomId === room.id && 
          b.status !== 'cancelled' &&
          b.slots.some(s => $selectedSlots.includes(s))
        )
        return roomConflicts.length === 0
      })
      
      if (availableRooms.length > 0) {
        solutions.push({
          type: 'room',
          label: '更换房间',
          options: availableRooms.map(r => ({
            roomId: r.id,
            roomName: r.name,
            priceDiff: r.basePrice - rooms.find(room => room.id === $selectedRoom)?.basePrice || 0
          }))
        })
      }
      
      const earlierSlots = timeSlots.filter(s => {
        const slotIdx = timeSlots.findIndex(ts => ts.id === s.id)
        const firstSelectedIdx = timeSlots.findIndex(ts => ts.id === $selectedSlots[0])
        return slotIdx < firstSelectedIdx
      })
      const laterSlots = timeSlots.filter(s => {
        const slotIdx = timeSlots.findIndex(ts => ts.id === s.id)
        const lastSelectedIdx = timeSlots.findIndex(ts => ts.id === $selectedSlots[$selectedSlots.length - 1])
        return slotIdx > lastSelectedIdx
      })
      
      if (earlierSlots.length > 0 || laterSlots.length > 0) {
        solutions.push({
          type: 'timeslot',
          label: '调换时段',
          earlierOptions: earlierSlots.slice(-3).map(s => ({
            slotId: s.id,
            time: s.label
          })),
          laterOptions: laterSlots.slice(0, 3).map(s => ({
            slotId: s.id,
            time: s.label
          }))
        })
      }
      
      solutions.push({
        type: 'premium',
        label: '加价使用',
        options: [
          { id: 'sameRoom', label: premiumPricing.sameRoom.label, multiplier: premiumPricing.sameRoom.multiplier },
          { id: 'otherRoom', label: premiumPricing.otherRoom.label, multiplier: premiumPricing.otherRoom.multiplier }
        ]
      })
    }
    
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      solutions
    }
  }
)

export function submitBooking() {
  const newBooking = {
    id: 'b' + Date.now(),
    roomId: get(selectedRoom),
    date: get(selectedDate),
    slots: [...get(selectedSlots)],
    bandName: get(bandName),
    members: [...get(invitedMembers)],
    equipments: [...get(selectedEquipments)],
    leaderId: 'm1',
    status: 'pending',
    aaMode: get(selectedAaMode),
    memberConfirmations: { ...get(memberConfirmations) },
    recordingNeeded: get(recordingNeeded),
    downgradedToSectional: get(downgradedToSectional),
    conflictSolution: get(selectedConflictSolution)
  }
  
  allBookings.update(bookings => [...bookings, newBooking])
  currentBookingId.set(newBooking.id)
  bookingSubmitted.set(true)
  currentView.set('member')
}

export function confirmConflictSolution(solution) {
  selectedConflictSolution.set(solution)
  equipmentConflictResolved.set(true)
  
  if (solution.type === 'room' && solution.selectedRoom) {
    selectedRoom.set(solution.selectedRoom)
  } else if (solution.type === 'timeslot' && solution.selectedSlots) {
    selectedSlots.set(solution.selectedSlots)
  }
}

export function rescheduleBooking() {
  bookingSubmitted.set(false)
  equipmentConflictResolved.set(false)
  selectedConflictSolution.set(null)
}

export function downgradeToSectional() {
  downgradedToSectional.set(true)
  recordingNeeded.set(false)
}

export { rooms, equipments, bandMembers, timeSlots, aaModes, backupMembers, KEY_ROLES, CONFLICT_EQUIPMENT_IDS }
