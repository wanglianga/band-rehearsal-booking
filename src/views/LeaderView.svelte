<script>
  import { 
    rooms, equipments, bandMembers, timeSlots, aaModes,
    selectedDate, selectedRoom, selectedSlots, selectedEquipments,
    invitedMembers, selectedAaMode, recordingNeeded, bandName,
    totalPrice, pricePerPerson, conflictSlots
  } from '../stores/bookingStore.js'

  let dragStartSlot = null
  let isDragging = false

  function toggleSlot(slotId) {
    if ($conflictSlots.has(slotId)) return
    
    const idx = $selectedSlots.indexOf(slotId)
    if (idx >= 0) {
      selectedSlots.update(slots => {
        const newSlots = [...slots]
        newSlots.splice(idx, 1)
        return newSlots.sort((a, b) => {
          return timeSlots.findIndex(s => s.id === a) - timeSlots.findIndex(s => s.id === b)
        })
      })
    } else {
      selectedSlots.update(slots => {
        return [...slots, slotId].sort((a, b) => {
          return timeSlots.findIndex(s => s.id === a) - timeSlots.findIndex(s => s.id === b)
        })
      })
    }
  }

  function handleDragStart(slotId) {
    if ($conflictSlots.has(slotId)) return
    dragStartSlot = slotId
    isDragging = true
    selectedSlots.set([slotId])
  }

  function handleDragEnter(slotId) {
    if (!isDragging || $conflictSlots.has(slotId)) return
    
    const startIdx = timeSlots.findIndex(s => s.id === dragStartSlot)
    const endIdx = timeSlots.findIndex(s => s.id === slotId)
    
    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)
    
    const newSlots = []
    for (let i = minIdx; i <= maxIdx; i++) {
      if (!$conflictSlots.has(timeSlots[i].id)) {
        newSlots.push(timeSlots[i].id)
      }
    }
    selectedSlots.set(newSlots)
  }

  function handleDragEnd() {
    isDragging = false
    dragStartSlot = null
  }

  function toggleEquipment(equipId) {
    const idx = $selectedEquipments.indexOf(equipId)
    if (idx >= 0) {
      selectedEquipments.update(eqs => {
        const newEqs = [...eqs]
        newEqs.splice(idx, 1)
        return newEqs
      })
    } else {
      selectedEquipments.update(eqs => [...eqs, equipId])
    }
  }

  function toggleMember(memberId) {
    const idx = $invitedMembers.indexOf(memberId)
    if (idx >= 0) {
      invitedMembers.update(members => {
        const newMembers = [...members]
        newMembers.splice(idx, 1)
        return newMembers
      })
    } else {
      invitedMembers.update(members => [...members, memberId])
    }
  }

  function getSlotStatus(slotId) {
    if ($conflictSlots.has(slotId)) return 'conflict'
    if ($selectedSlots.includes(slotId)) return 'selected'
    return 'available'
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
  }

  function prevDay() {
    const date = new Date($selectedDate)
    date.setDate(date.getDate() - 1)
    selectedDate.set(date.toISOString().split('T')[0])
  }

  function nextDay() {
    const date = new Date($selectedDate)
    date.setDate(date.getDate() + 1)
    selectedDate.set(date.toISOString().split('T')[0])
  }
</script>

<div class="leader-view" role="application" on:mouseup={handleDragEnd} on:mouseleave={handleDragEnd}>
  <header class="page-header">
    <h1>🎸 预约排练</h1>
    <p class="subtitle">选个时间，带上你的乐器，开躁！</p>
  </header>

  <section class="section">
    <div class="section-header">
      <h2>📅 选择日期</h2>
    </div>
    <div class="date-picker">
      <button class="date-nav" on:click={prevDay}>‹</button>
      <div class="date-display">
        <span class="date-main">{formatDate($selectedDate)}</span>
      </div>
      <button class="date-nav" on:click={nextDay}>›</button>
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2>🏠 选择房间</h2>
    </div>
    <div class="room-list">
      {#each rooms as room}
        <button
          class="room-card {$selectedRoom === room.id ? 'selected' : ''}"
          on:click={() => selectedRoom.set(room.id)}
        >
          <div class="room-name">{room.name}</div>
          <div class="room-info">
            <span>{room.size}</span>
            <span>·</span>
            <span>{room.capacity}人</span>
          </div>
          <div class="room-footer">
            <span class="room-price">¥{room.basePrice}/时</span>
            <span class="room-noise">🔊 {room.noiseLimit}dB</span>
          </div>
        </button>
      {/each}
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2>⏰ 选择时段</h2>
      <span class="hint">拖拽选择连续时段</span>
    </div>
    <div class="time-slots-grid">
      {#each timeSlots as slot}
        <button
          class={`time-slot {getSlotStatus(slot.id)}`}
          on:mousedown={() => handleDragStart(slot.id)}
          on:mouseenter={() => handleDragEnter(slot.id)}
          on:click={() => toggleSlot(slot.id)}
          disabled={getSlotStatus(slot.id) === 'conflict'}
        >
          <span class="slot-time">{slot.start}</span>
          {#if getSlotStatus(slot.id) === 'conflict'}
            <span class="slot-tag">已占用</span>
          {/if}
          {#if getSlotStatus(slot.id) === 'selected'}
            <span class="slot-tag">已选</span>
          {/if}
        </button>
      {/each}
    </div>
    {#if $selectedSlots.length > 0}
      <div class="selected-summary">
        已选 {$selectedSlots.length} 小时 · 
        {timeSlots.find(s => s.id === $selectedSlots[0])?.start} - 
        {timeSlots.find(s => s.id === $selectedSlots[$selectedSlots.length - 1])?.end}
      </div>
    {/if}
  </section>

  <section class="section">
    <div class="section-header">
      <h2>🎵 设备借用</h2>
    </div>
    <div class="equipment-grid">
      {#each equipments as eq}
        <button
          class="equip-card {$selectedEquipments.includes(eq.id) ? 'selected' : ''}"
          on:click={() => toggleEquipment(eq.id)}
        >
          <div class="equip-icon">{eq.icon}</div>
          <div class="equip-name">{eq.name}</div>
          <div class="equip-price">
            {#if eq.price === 0}
              <span class="free">免费</span>
            {:else}
              ¥{eq.price}/时
            {/if}
          </div>
        </button>
      {/each}
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2>👥 邀请成员</h2>
      <span class="hint">{$invitedMembers.length} 人参加</span>
    </div>
    <div class="member-list">
      {#each bandMembers as member}
        <button
          class="member-item {$invitedMembers.includes(member.id) ? 'selected' : ''}"
          on:click={() => toggleMember(member.id)}
        >
          <div class="member-avatar">{member.avatar}</div>
          <div class="member-info">
            <div class="member-name">{member.name}</div>
            <div class="member-role">{member.role}</div>
          </div>
          {#if member.isLeader}
            <span class="leader-badge">队长</span>
          {/if}
          <div class="member-check">
            {$invitedMembers.includes(member.id) ? '✓' : ''}
          </div>
        </button>
      {/each}
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2>💰 费用分摊</h2>
    </div>
    <div class="aa-modes">
      {#each aaModes as mode}
        <button
          class="aa-card {$selectedAaMode === mode.id ? 'selected' : ''}"
          on:click={() => selectedAaMode.set(mode.id)}
        >
          <div class="aa-name">{mode.name}</div>
          <div class="aa-desc">{mode.description}</div>
        </button>
      {/each}
    </div>
  </section>

  <section class="section">
    <div class="section-header">
      <h2>🎙️ 录音需求</h2>
    </div>
    <button 
      class="recording-toggle {$recordingNeeded ? 'active' : ''}"
      on:click={() => recordingNeeded.update(v => !v)}
    >
      <div class="toggle-icon">{$recordingNeeded ? '🎚️' : '⏺️'}</div>
      <div class="toggle-text">
        <div class="toggle-title">{$recordingNeeded ? '需要录音' : '不需要录音'}</div>
        <div class="toggle-sub">
          {$recordingNeeded ? '录音接口已自动添加' : '点击开启录音需求'}
        </div>
      </div>
      <div class="toggle-switch">{$recordingNeeded ? '●' : '○'}</div>
    </button>
  </section>

  <div class="price-bar">
    <div class="price-info">
      <div class="price-total">
        ¥{$totalPrice}
        <span class="price-unit">/ 总计</span>
      </div>
      <div class="price-per-person">
        {#if $selectedAaMode === 'equal'}
          人均 ¥{$pricePerPerson}
        {:else if $selectedAaMode === 'leader'}
          队长垫付
        {:else}
          按设备分摊
        {/if}
      </div>
    </div>
    <button class="book-btn">
      提交预约
    </button>
  </div>
</div>

<style>
  .leader-view {
    max-width: 480px;
    margin: 0 auto;
    padding: 20px 20px 120px;
  }

  .page-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .page-header h1 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    color: var(--text-muted);
    font-size: 14px;
  }

  .section {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .section-header h2 {
    font-size: 16px;
    font-weight: 600;
  }

  .hint {
    font-size: 12px;
    color: var(--text-muted);
  }

  .date-picker {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .date-nav {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-card-hover);
    color: var(--text-primary);
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .date-nav:hover {
    background: var(--primary);
  }

  .date-display {
    text-align: center;
  }

  .date-main {
    font-size: 18px;
    font-weight: 600;
  }

  .room-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .room-card {
    padding: 14px;
    background: var(--bg-card-hover);
    border-radius: 12px;
    text-align: left;
    color: var(--text-primary);
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .room-card:hover {
    transform: translateX(4px);
  }

  .room-card.selected {
    border-color: var(--primary);
    background: rgba(255, 107, 53, 0.1);
  }

  .room-name {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .room-info {
    font-size: 12px;
    color: var(--text-secondary);
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }

  .room-footer {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
  }

  .room-price {
    color: var(--primary);
    font-weight: 600;
  }

  .room-noise {
    color: var(--text-muted);
  }

  .time-slots-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .time-slot {
    padding: 12px 8px;
    background: var(--bg-card-hover);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 13px;
    text-align: center;
    border: 2px solid transparent;
    transition: all 0.15s;
    user-select: none;
  }

  .time-slot:hover:not(:disabled) {
    border-color: var(--primary);
  }

  .time-slot.selected {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .time-slot.conflict {
    background: rgba(255, 71, 87, 0.15);
    color: var(--danger);
    cursor: not-allowed;
  }

  .slot-time {
    display: block;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .slot-tag {
    font-size: 10px;
    opacity: 0.8;
  }

  .selected-summary {
    margin-top: 12px;
    padding: 10px;
    background: rgba(0, 212, 255, 0.1);
    border-radius: 8px;
    font-size: 13px;
    color: var(--accent);
    text-align: center;
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .equip-card {
    padding: 14px 10px;
    background: var(--bg-card-hover);
    border-radius: 12px;
    text-align: center;
    color: var(--text-primary);
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .equip-card:hover {
    transform: translateY(-2px);
  }

  .equip-card.selected {
    border-color: var(--primary);
    background: rgba(255, 107, 53, 0.1);
  }

  .equip-icon {
    font-size: 28px;
    margin-bottom: 6px;
  }

  .equip-name {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .equip-price {
    font-size: 11px;
    color: var(--text-muted);
  }

  .equip-price .free {
    color: var(--success);
  }

  .member-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .member-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--bg-card-hover);
    border-radius: 12px;
    text-align: left;
    color: var(--text-primary);
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .member-item:hover {
    transform: translateX(4px);
  }

  .member-item.selected {
    border-color: var(--primary);
    background: rgba(255, 107, 53, 0.1);
  }

  .member-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .member-info {
    flex: 1;
  }

  .member-name {
    font-size: 14px;
    font-weight: 600;
  }

  .member-role {
    font-size: 12px;
    color: var(--text-muted);
  }

  .leader-badge {
    padding: 2px 8px;
    background: var(--primary);
    color: white;
    font-size: 10px;
    border-radius: 10px;
  }

  .member-check {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: var(--success);
  }

  .aa-modes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .aa-card {
    padding: 12px 14px;
    background: var(--bg-card-hover);
    border-radius: 12px;
    text-align: left;
    color: var(--text-primary);
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .aa-card:hover {
    transform: translateX(4px);
  }

  .aa-card.selected {
    border-color: var(--primary);
    background: rgba(255, 107, 53, 0.1);
  }

  .aa-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .aa-desc {
    font-size: 12px;
    color: var(--text-muted);
  }

  .recording-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px;
    background: var(--bg-card-hover);
    border-radius: 12px;
    color: var(--text-primary);
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .recording-toggle.active {
    border-color: var(--accent);
    background: rgba(0, 212, 255, 0.1);
  }

  .toggle-icon {
    font-size: 32px;
  }

  .toggle-text {
    flex: 1;
    text-align: left;
  }

  .toggle-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .toggle-sub {
    font-size: 12px;
    color: var(--text-muted);
  }

  .toggle-switch {
    font-size: 24px;
    color: var(--primary);
  }

  .price-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    padding: 16px 20px;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 50;
  }

  .price-info {
    flex: 1;
  }

  .price-total {
    font-size: 22px;
    font-weight: 700;
    color: var(--primary);
  }

  .price-unit {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 400;
  }

  .price-per-person {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .book-btn {
    padding: 14px 32px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  }

  .book-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
  }
</style>
