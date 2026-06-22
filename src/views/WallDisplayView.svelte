<script>
  import { onMount, onDestroy } from 'svelte'
  import { 
    allBookings, rooms, equipments, bandMembers, timeSlots, selectedDate,
    equipmentConflicts, selectedConflictSolution, CONFLICT_EQUIPMENT_IDS,
    downgradedToSectional, attendanceAnalysis, selectedRoom, selectedSlots
  } from '../stores/bookingStore.js'

  let currentTime = new Date()
  let timeInterval = null

  $: todayBookings = $allBookings.filter(b => b.date === $selectedDate && b.status !== 'cancelled')
  
  $: nextBooking = (() => {
    const sortedBookings = [...todayBookings].sort((a, b) => {
      const aStart = timeSlots.find(s => s.id === a.slots[0])?.start || '00:00'
      const bStart = timeSlots.find(s => s.id === b.slots[0])?.start || '00:00'
      return aStart.localeCompare(bStart)
    })
    return sortedBookings[0] || null
  })()

  $: allEquipmentsInUse = (() => {
    const eqSet = new Set()
    todayBookings.forEach(booking => {
      booking.equipments.forEach(eq => eqSet.add(eq))
    })
    return eqSet
  })()

  $: freeSlots = (() => {
    const result = {}
    rooms.forEach(room => {
      const occupiedSlots = new Set()
      todayBookings
        .filter(b => b.roomId === room.id)
        .forEach(b => b.slots.forEach(s => occupiedSlots.add(s)))
      
      const free = timeSlots.filter(s => !occupiedSlots.has(s.id))
      result[room.id] = free
    })
    return result
  })()

  function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  function formatDate(date) {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
  }

  function getBookingTimeRange(booking) {
    if (!booking || booking.slots.length === 0) return ''
    const start = timeSlots.find(s => s.id === booking.slots[0])?.start || ''
    const end = timeSlots.find(s => s.id === booking.slots[booking.slots.length - 1])?.end || ''
    return `${start} - ${end}`
  }

  function getMemberById(id) {
    return bandMembers.find(m => m.id === id)
  }

  function getRoomById(id) {
    return rooms.find(r => r.id === id)
  }

  function getEquipmentById(id) {
    return equipments.find(e => e.id === id)
  }

  onMount(() => {
    timeInterval = setInterval(() => {
      currentTime = new Date()
    }, 1000)
  })

  onDestroy(() => {
    if (timeInterval) {
      clearInterval(timeInterval)
    }
  })
</script>

<div class="wall-display">
  <header class="wall-header">
    <div class="header-left">
      <h1>🎸 社区乐队排练室</h1>
      <p class="subtitle">Band Rehearsal Studio</p>
    </div>
    <div class="header-right">
      <div class="current-date">{formatDate(currentTime)}</div>
      <div class="current-time">{formatTime(currentTime)}</div>
    </div>
  </header>

  <main class="wall-content">
    <section class="main-panel next-band-panel">
      <div class="panel-header">
        <h2>🎵 下一场排练</h2>
        <span class="live-badge">LIVE</span>
      </div>
      
      {#if nextBooking}
        <div class="next-band-info">
          <div class="band-name">{nextBooking.bandName}</div>
          {#if nextBooking.downgradedToSectional || $downgradedToSectional}
            <div class="sectional-badge">🎼 分声部练习</div>
          {/if}
          <div class="band-time">{getBookingTimeRange(nextBooking)}</div>
          <div class="band-room">{getRoomById(nextBooking.roomId)?.name}</div>
          
          {#if nextBooking.conflictSolution || $selectedConflictSolution}
            <div class="solution-badge">
              {#if nextBooking.conflictSolution?.type === 'premium' || $selectedConflictSolution?.type === 'premium'}
                💰 加价使用
              {:else if nextBooking.conflictSolution?.type === 'room' || $selectedConflictSolution?.type === 'room'}
                🔄 更换房间
              {:else if nextBooking.conflictSolution?.type === 'timeslot' || $selectedConflictSolution?.type === 'timeslot'}
                ⏰ 调换时段
              {/if}
            </div>
          {/if}
          
          <div class="band-members">
            {#each nextBooking.members as memberId}
              {#if getMemberById(memberId)}
                <div class="member-avatar" title={getMemberById(memberId).name}>
                  <span>{getMemberById(memberId).avatar}</span>
                </div>
              {/if}
            {/each}
          </div>
          
          {#if $equipmentConflicts.hasConflict}
            <div class="wall-conflict-alert">
              <span class="alert-icon">⚡</span>
              <span class="alert-text">设备冲突待处理：{$equipmentConflicts.conflicts.map(c => c.eqName).join('、')}</span>
            </div>
          {/if}
        </div>
      {:else}
        <div class="no-booking">
          <div class="empty-icon">🎶</div>
          <p>暂无安排</p>
        </div>
      {/if}
    </section>

    <section class="side-panels">
      <div class="panel equip-panel">
        <div class="panel-header">
          <h3>🎛️ 设备借用</h3>
          <span class="count">{allEquipmentsInUse.size}/{equipments.length}</span>
        </div>
        <div class="equip-grid">
          {#each equipments as eq}
            <div class="equip-item {allEquipmentsInUse.has(eq.id) ? 'in-use' : 'available'} {CONFLICT_EQUIPMENT_IDS.includes(eq.id) ? 'conflict-type' : ''}">
              {#if CONFLICT_EQUIPMENT_IDS.includes(eq.id)}
                <span class="conflict-type-badge">热门</span>
              {/if}
              <span class="equip-icon">{eq.icon}</span>
              <span class="equip-name">{eq.name}</span>
              <span class="equip-status">
                {allEquipmentsInUse.has(eq.id) ? '使用中' : '空闲'}
              </span>
              {#if $equipmentConflicts.conflicts.some(c => c.eqId === eq.id)}
                <span class="conflict-indicator">⚡</span>
              {/if}
            </div>
          {/each}
        </div>
        
        {#if $selectedConflictSolution}
          <div class="solution-banner">
            <span class="solution-icon">✓</span>
            <span class="solution-text">
              冲突解决方案：
              {#if $selectedConflictSolution.type === 'premium'}
                选择加价方案
              {:else if $selectedConflictSolution.type === 'room'}
                已更换至 {rooms.find(r => r.id === $selectedConflictSolution.selectedRoom)?.name || rooms.find(r => r.id === $selectedRoom)?.name}
              {:else if $selectedConflictSolution.type === 'timeslot'}
                已调换至 {timeSlots.find(s => s.id === $selectedSlots[0])?.start} 开始
              {/if}
            </span>
          </div>
        {/if}
        
        {#if $downgradedToSectional}
          <div class="sectional-banner">
            <span>🎼 本场已降级为分声部练习</span>
          </div>
        {/if}
      </div>

      <div class="panel today-panel">
        <div class="panel-header">
          <h3>📅 今日排期</h3>
          <span class="count">{todayBookings.length} 场</span>
        </div>
        <div class="today-list">
          {#each todayBookings as booking}
            <div class="today-item">
              <div class="today-time">{getBookingTimeRange(booking)}</div>
              <div class="today-info">
                <span class="today-band">{booking.bandName}</span>
                <span class="today-room">{getRoomById(booking.roomId)?.name}</span>
              </div>
              <div class="today-status {booking.status}">
                {booking.status === 'confirmed' ? '已确认' : '待确认'}
              </div>
            </div>
          {:else}
            <div class="empty-list">今日暂无排练</div>
          {/each}
        </div>
      </div>
    </section>

    <section class="bottom-panel free-slots-panel">
      <div class="panel-header">
        <h3>⏳ 空闲时段</h3>
      </div>
      <div class="free-rooms">
        {#each rooms as room}
          <div class="free-room-card">
            <div class="free-room-header">
              <h4>{room.name}</h4>
              <span class="free-count">{freeSlots[room.id]?.length || 0} 个时段空闲</span>
            </div>
            <div class="free-timeline">
              {#each timeSlots as slot}
                <div 
                  class="timeline-slot {todayBookings.some(b => b.roomId === room.id && b.slots.includes(slot.id)) ? 'occupied' : 'free'}"
                  title={slot.label}
                >
                  <span class="slot-time">{slot.start}</span>
                </div>
              {/each}
            </div>
            <div class="timeline-legend">
              <span><span class="legend-dot free"></span> 空闲</span>
              <span><span class="legend-dot occupied"></span> 已预约</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </main>

  <footer class="wall-footer">
    <div class="footer-left">
      <span>🎸 欢迎来排练 · 让音乐在社区回响</span>
    </div>
    <div class="footer-right">
      <span>噪音限制 · 晚上10点后请降低音量</span>
    </div>
  </footer>
</div>

<style>
  .wall-display {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(180deg, var(--bg-dark) 0%, #1a1a2e 100%);
  }

  .wall-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 40px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
  }

  .header-left h1 {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 14px;
    margin-top: 2px;
  }

  .header-right {
    text-align: right;
  }

  .current-date {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .current-time {
    font-size: 32px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    color: var(--accent);
  }

  .wall-content {
    flex: 1;
    padding: 30px 40px;
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    grid-template-rows: auto 1fr;
    gap: 24px;
  }

  .main-panel {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 28px;
    border: 1px solid var(--border);
  }

  .next-band-panel {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .panel-header h2 {
    font-size: 22px;
    font-weight: 700;
  }

  .panel-header h3 {
    font-size: 16px;
    font-weight: 600;
  }

  .live-badge {
    padding: 6px 14px;
    background: var(--danger);
    color: white;
    font-size: 12px;
    font-weight: 700;
    border-radius: 20px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .next-band-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .band-name {
    font-size: 42px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .band-time {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .band-room {
    font-size: 16px;
    color: var(--text-secondary);
    padding: 8px 20px;
    background: var(--bg-card-hover);
    border-radius: 20px;
  }

  .band-members {
    display: flex;
    gap: 12px;
    margin-top: 20px;
  }

  .member-avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    transition: transform 0.3s;
  }

  .member-avatar:hover {
    transform: scale(1.1);
  }

  .no-booking {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 64px;
    opacity: 0.5;
  }

  .side-panels {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .panel {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid var(--border);
  }

  .count {
    font-size: 13px;
    color: var(--text-muted);
    background: var(--bg-card-hover);
    padding: 4px 10px;
    border-radius: 12px;
  }

  .equip-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .equip-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    background: var(--bg-card-hover);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .equip-item.in-use {
    background: rgba(255, 107, 53, 0.15);
    border: 1px solid rgba(255, 107, 53, 0.3);
  }

  .equip-item.available {
    opacity: 0.7;
  }

  .equip-icon {
    font-size: 24px;
  }

  .equip-name {
    font-size: 12px;
    font-weight: 500;
  }

  .equip-status {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .equip-item.in-use .equip-status {
    background: var(--primary);
    color: white;
  }

  .equip-item.available .equip-status {
    background: var(--success);
    color: white;
  }

  .today-panel {
    flex: 1;
    overflow: hidden;
  }

  .today-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
  }

  .today-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--bg-card-hover);
    border-radius: 10px;
  }

  .today-time {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    min-width: 90px;
  }

  .today-info {
    flex: 1;
  }

  .today-band {
    display: block;
    font-size: 14px;
    font-weight: 600;
  }

  .today-room {
    font-size: 11px;
    color: var(--text-muted);
  }

  .today-status {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 10px;
    font-weight: 500;
  }

  .today-status.confirmed {
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
  }

  .today-status.pending {
    background: rgba(255, 170, 0, 0.2);
    color: var(--warning);
  }

  .empty-list {
    text-align: center;
    color: var(--text-muted);
    padding: 30px;
    font-size: 14px;
  }

  .free-slots-panel {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .free-rooms {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .free-room-card {
    background: var(--bg-card-hover);
    border-radius: 12px;
    padding: 16px;
  }

  .free-room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .free-room-header h4 {
    font-size: 14px;
    font-weight: 600;
  }

  .free-count {
    font-size: 12px;
    color: var(--success);
  }

  .free-timeline {
    display: flex;
    gap: 4px;
    margin-bottom: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .timeline-slot {
    flex: 1;
    min-width: 40px;
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.2s;
  }

  .timeline-slot.free {
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
  }

  .timeline-slot.occupied {
    background: rgba(255, 107, 53, 0.2);
    color: var(--primary);
  }

  .timeline-slot:hover {
    transform: scaleY(1.1);
  }

  .slot-time {
    font-weight: 500;
  }

  .timeline-legend {
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .legend-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 3px;
    margin-right: 4px;
    vertical-align: middle;
  }

  .legend-dot.free {
    background: var(--success);
  }

  .legend-dot.occupied {
    background: var(--primary);
  }

  .wall-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 40px;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    font-size: 13px;
    color: var(--text-muted);
  }

  .sectional-badge {
    padding: 6px 16px;
    background: rgba(0, 212, 255, 0.2);
    color: var(--accent);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  .solution-badge {
    padding: 6px 16px;
    background: rgba(255, 170, 0, 0.2);
    color: var(--warning);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  .wall-conflict-alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: rgba(255, 71, 87, 0.15);
    border: 1px solid rgba(255, 71, 87, 0.3);
    border-radius: 12px;
    margin-top: 16px;
    animation: pulse 2s infinite;
  }

  .alert-icon {
    font-size: 24px;
  }

  .alert-text {
    flex: 1;
    font-size: 14px;
    color: var(--danger);
    font-weight: 500;
  }

  .equip-item.conflict-type {
    position: relative;
  }

  .conflict-type-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px 6px;
    background: var(--primary);
    color: white;
    font-size: 9px;
    border-radius: 8px;
    font-weight: 600;
  }

  .conflict-indicator {
    position: absolute;
    top: 4px;
    left: 4px;
    font-size: 14px;
    animation: flash 1s infinite;
  }

  @keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .solution-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(0, 214, 143, 0.15);
    border: 1px solid rgba(0, 214, 143, 0.3);
    border-radius: 10px;
    margin-top: 12px;
  }

  .solution-icon {
    width: 24px;
    height: 24px;
    background: var(--success);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  .solution-text {
    flex: 1;
    font-size: 13px;
    color: var(--success);
    font-weight: 500;
  }

  .sectional-banner {
    padding: 10px 14px;
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.3);
    border-radius: 10px;
    margin-top: 12px;
    text-align: center;
    font-size: 13px;
    color: var(--accent);
    font-weight: 600;
  }

  @media (max-width: 1024px) {
    .wall-content {
      grid-template-columns: 1fr;
    }
    
    .side-panels {
      grid-column: 1;
      grid-row: auto;
      flex-direction: row;
    }
    
    .free-rooms {
      grid-template-columns: 1fr;
    }
  }
</style>
