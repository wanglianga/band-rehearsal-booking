import { writable, derived } from 'svelte/store'
import { rooms, equipments, bandMembers, timeSlots, aaModes, existingBookings } from '../data/mockData.js'

export const currentView = writable('leader')

export const selectedDate = writable('2026-06-20')
export const selectedRoom = writable('room-a')
export const selectedSlots = writable(['t5', 't6'])
export const selectedEquipments = writable(['drum-set', 'mic-1'])
export const invitedMembers = writable(['m1', 'm2', 'm3', 'm4'])
export const selectedAaMode = writable('equal')
export const recordingNeeded = writable(false)
export const bandName = writable('银河乐队')
export const memberConfirmations = writable({
  m1: 'confirmed',
  m2: 'confirmed',
  m3: 'pending',
  m4: 'declined'
})
export const memberPayments = writable({
  m1: true,
  m2: true,
  m3: false,
  m4: false
})

export const currentMemberId = writable('m2')

export const allBookings = writable(existingBookings)

export const totalPrice = derived(
  [selectedRoom, selectedSlots, selectedEquipments],
  ([$selectedRoom, $selectedSlots, $selectedEquipments]) => {
    const room = rooms.find(r => r.id === $selectedRoom)
    const roomCost = room ? room.basePrice * $selectedSlots.length : 0
    const equipCost = $selectedEquipments.reduce((sum, eqId) => {
      const eq = equipments.find(e => e.id === eqId)
      return sum + (eq ? eq.price * $selectedSlots.length : 0)
    }, 0)
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

export { rooms, equipments, bandMembers, timeSlots, aaModes }
