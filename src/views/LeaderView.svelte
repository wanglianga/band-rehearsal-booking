<script>
  import { 
    rooms, equipments, bandMembers, timeSlots, aaModes, backupMembers,
    selectedDate, selectedRoom, selectedSlots, selectedEquipments,
    invitedMembers, selectedAaMode, recordingNeeded, bandName,
    totalPrice, pricePerPerson, conflictSlots, RECORDING_EQUIPMENT_IDS,
    attendanceAnalysis, equipmentConflicts, memberConfirmations, KEY_ROLES, CONFLICT_EQUIPMENT_IDS,
    submitBooking, confirmConflictSolution, downgradeToSectional, rescheduleBooking,
    equipmentConflictResolved, selectedConflictSolution, downgradedToSectional,
    currentBookingId
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

  function isRecordingEquipment(equipId) {
    return RECORDING_EQUIPMENT_IDS.includes(equipId)
  }

  function toggleEquipment(equipId) {
    if ($recordingNeeded && isRecordingEquipment(equipId)) {
      return
    }
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
          class="equip-card {$selectedEquipments.includes(eq.id) ? 'selected' : ''} {$recordingNeeded && isRecordingEquipment(eq.id) ? 'locked' : ''}"
          on:click={() => toggleEquipment(eq.id)}
          disabled={$recordingNeeded && isRecordingEquipment(eq.id)}
        >
          {#if $recordingNeeded && isRecordingEquipment(eq.id)}
            <span class="lock-badge">🔒 录音必需</span>
          {/if}
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
      <h2>⚡ 设备占用检测</h2>
      {#if $equipmentConflicts.hasConflict}
        <span class="conflict-badge">冲突 {$equipmentConflicts.conflicts.length} 项</span>
      {:else}
        <span class="conflict-badge resolved">无冲突</span>
      {/if}
    </div>

    {#if $equipmentConflicts.hasConflict}
      <div class="conflict-list">
        <div class="conflict-title">⚠️ 与其他乐队存在设备冲突</div>
        {#each $equipmentConflicts.conflicts as conflict}
          <div class="conflict-item">
            <span class="conflict-icon">{conflict.eqIcon}</span>
            <div class="conflict-info">
              <div class="conflict-eq">{conflict.eqName}</div>
              <div class="conflict-with">与「{conflict.conflictWith}」冲突 · {conflict.conflictRoom}</div>
            </div>
            <span class="conflict-tag">冲突</span>
          </div>
        {/each}
      </div>

      <div class="solutions-section">
        <div class="solutions-title">💡 解决方案</div>
        
        {#each $equipmentConflicts.solutions as solution}
          <div class="solution-group">
            <div class="solution-label">{solution.label}</div>
            
            {#if solution.type === 'room'}
              <div class="solution-options">
                {#each solution.options as opt}
                  <button 
                    class="solution-option"
                    on:click={() => confirmConflictSolution({ type: 'room', selectedRoom: opt.roomId, option: opt.roomId })}
                  >
                    <span class="option-name">{opt.roomName}</span>
                    <span class="option-price">
                      {#if opt.priceDiff > 0}
                        +¥{opt.priceDiff}/时
                      {:else if opt.priceDiff < 0}
                        ¥{opt.priceDiff}/时
                      {:else}
                        同价
                      {/if}
                    </span>
                  </button>
                {/each}
              </div>
            {/if}

            {#if solution.type === 'timeslot'}
              <div class="solution-options">
                {#if solution.earlierOptions && solution.earlierOptions.length > 0}
                  <div class="timeslot-group">
                    <span class="timeslot-label">更早时段</span>
                    <div class="timeslot-buttons">
                      {#each solution.earlierOptions as opt}
                        <button 
                          class="timeslot-btn"
                          on:click={() => {
                            const startIdx = timeSlots.findIndex(s => s.id === opt.slotId)
                            const newSlots = timeSlots.slice(startIdx, startIdx + $selectedSlots.length).map(s => s.id)
                            confirmConflictSolution({ type: 'timeslot', selectedSlots: newSlots })
                          }}
                        >
                          {opt.time}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
                {#if solution.laterOptions && solution.laterOptions.length > 0}
                  <div class="timeslot-group">
                    <span class="timeslot-label">更晚时段</span>
                    <div class="timeslot-buttons">
                      {#each solution.laterOptions as opt}
                        <button 
                          class="timeslot-btn"
                          on:click={() => {
                            const startIdx = timeSlots.findIndex(s => s.id === opt.slotId)
                            const newSlots = timeSlots.slice(startIdx, startIdx + $selectedSlots.length).map(s => s.id)
                            confirmConflictSolution({ type: 'timeslot', selectedSlots: newSlots })
                          }}
                        >
                          {opt.time}
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            {#if solution.type === 'premium'}
              <div class="solution-options">
                {#each solution.options as opt}
                  <button 
                    class="solution-option premium"
                    on:click={() => confirmConflictSolution({ type: 'premium', option: opt.id })}
                  >
                    <span class="option-name">{opt.label}</span>
                    <span class="option-price">x{opt.multiplier}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else if $equipmentConflictResolved && $selectedConflictSolution}
      <div class="conflict-resolved">
        <span class="resolved-icon">✓</span>
        <span class="resolved-text">
          冲突已解决：
          {#if $selectedConflictSolution.type === 'room'}
            已更换至 {rooms.find(r => r.id === $selectedRoom)?.name}
          {:else if $selectedConflictSolution.type === 'timeslot'}
            已调换至 {timeSlots.find(s => s.id === $selectedSlots[0])?.start} 开始
          {:else if $selectedConflictSolution.type === 'premium'}
            已选择加价方案
          {/if}
        </span>
        <button class="reset-btn" on:click={() => { equipmentConflictResolved.set(false); selectedConflictSolution.set(null); }}>
          重新选择
        </button>
      </div>
    {:else}
      <div class="no-conflict">
        <span class="no-conflict-icon">✓</span>
        <span>所选设备在该时段无冲突</span>
      </div>
    {/if}
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
      <h2>✅ 成员到场确认</h2>
      <span class="risk-badge {$attendanceAnalysis.riskLevel}">{$attendanceAnalysis.riskDescription}</span>
    </div>
    
    <div class="attendance-summary">
      <div class="attendance-stat confirmed">
        <span class="stat-num">{$attendanceAnalysis.confirmedCount}</span>
        <span class="stat-label">已确认</span>
      </div>
      <div class="attendance-stat pending">
        <span class="stat-num">{$attendanceAnalysis.pendingCount}</span>
        <span class="stat-label">待确认</span>
      </div>
      <div class="attendance-stat declined">
        <span class="stat-num">{$attendanceAnalysis.declinedCount}</span>
        <span class="stat-label">已拒绝</span>
      </div>
      <div class="attendance-stat total">
        <span class="stat-num">{$attendanceAnalysis.totalInvited}</span>
        <span class="stat-label">总计</span>
      </div>
    </div>

    {#if $attendanceAnalysis.declined.length > 0}
      <div class="declined-list">
        <div class="list-title">缺席成员</div>
        {#each $attendanceAnalysis.declined as member}
          <div class="declined-item">
            <span class="member-avatar">{member.avatar}</span>
            <span class="member-name">{member.name}</span>
            <span class="member-role">{member.role}</span>
            {#if KEY_ROLES.includes(member.instrument)}
              <span class="key-badge">关键</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if $attendanceAnalysis.pending.length > 0}
      <div class="pending-list">
        <div class="list-title">待确认</div>
        {#each $attendanceAnalysis.pending as member}
          <div class="pending-item">
            <span class="member-avatar">{member.avatar}</span>
            <span class="member-name">{member.name}</span>
            <span class="member-role">{member.role}</span>
            {#if KEY_ROLES.includes(member.instrument)}
              <span class="key-badge">关键</span>
            {/if}
            <span class="pending-icon">⏳</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if $attendanceAnalysis.needBackup && $attendanceAnalysis.backupOptions.length > 0}
      <div class="backup-section">
        <div class="backup-title">🔄 替补推荐</div>
        <div class="backup-list">
          {#each $attendanceAnalysis.backupOptions as backup}
            <button 
              class="backup-item"
              on:click={() => {
                invitedMembers.update(m => [...m, backup.id])
                memberConfirmations.update(c => ({ ...c, [backup.id]: 'pending' }))
              }}
            >
              <span class="backup-avatar">{backup.avatar}</span>
              <span class="backup-name">{backup.name}</span>
              <span class="backup-role">{backup.role}</span>
              <span class="backup-add">+ 邀请</span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="recording-advice">
      <div class="advice-title">🎙️ 录音接口建议</div>
      <div class="advice-content {$attendanceAnalysis.keepRecording ? 'keep' : 'cancel'}">
        {#if $attendanceAnalysis.keepRecording}
          <span class="advice-icon">✓</span>
          <span>建议保留录音接口，已确认成员足够支撑高质量录音</span>
        {:else if $recordingNeeded}
          <span class="advice-icon">⚠</span>
          <span>录音质量可能受影响，{#if $attendanceAnalysis.declinedKeyMembers.length > 0}关键成员缺席{:else}确认人数不足{/if}，建议取消录音或改期</span>
        {:else}
          <span class="advice-icon">○</span>
          <span>未开启录音需求</span>
        {/if}
      </div>
    </div>

    {#if $attendanceAnalysis.keyMemberMissing}
      <div class="action-alert">
        <div class="alert-title">🚨 关键成员缺席</div>
        <div class="alert-content">
          {#if $attendanceAnalysis.suggestReschedule}
            <p>建议改期：{$attendanceAnalysis.declinedKeyMembers.length} 名关键成员缺席，且 {$attendanceAnalysis.pendingKeyMembers.length} 人待确认，排练质量难以保证。</p>
            <div class="alert-actions">
              <button class="alert-btn primary" on:click={rescheduleBooking}>
                重新选择时间
              </button>
            </div>
          {/if}
          {#if $attendanceAnalysis.suggestDowngrade && !$downgradedToSectional}
            <p>可降级为分声部练习：仅 {$attendanceAnalysis.declinedKeyMembers.length} 名关键成员缺席，其余成员可进行专项练习。</p>
            <div class="alert-actions">
              <button class="alert-btn secondary" on:click={downgradeToSectional}>
                降级成分声部练习
              </button>
            </div>
          {/if}
          {#if $downgradedToSectional}
            <div class="downgrade-badge">已降级为分声部练习 · 录音已自动关闭</div>
          {/if}
        </div>
      </div>
    {/if}
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
        {#if $downgradedToSectional}
          <span class="sectional-tag">分声部练习</span>
        {/if}
        {#if $selectedAaMode === 'equal'}
          人均 ¥{$pricePerPerson}
        {:else if $selectedAaMode === 'leader'}
          队长垫付
        {:else}
          按设备分摊
        {/if}
      </div>
    </div>
    <button 
      class="book-btn" 
      on:click={submitBooking}
      disabled={$equipmentConflicts.hasConflict && !$equipmentConflictResolved}
    >
      {#if $equipmentConflicts.hasConflict && !$equipmentConflictResolved}
        请先解决设备冲突
      {:else}
        提交预约
      {/if}
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

  .equip-card.locked {
    position: relative;
    border-color: var(--accent);
    background: rgba(0, 212, 255, 0.1);
    cursor: not-allowed;
    opacity: 0.95;
  }

  .equip-card.locked:hover {
    transform: none;
  }

  .lock-badge {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 2px 6px;
    background: var(--accent);
    color: var(--bg-dark);
    font-size: 9px;
    font-weight: 600;
    border-radius: 8px;
    white-space: nowrap;
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

  .book-btn:disabled {
    background: var(--text-muted);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .risk-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }

  .risk-badge.high {
    background: rgba(255, 71, 87, 0.2);
    color: var(--danger);
  }

  .risk-badge.medium {
    background: rgba(255, 170, 0, 0.2);
    color: var(--warning);
  }

  .risk-badge.low {
    background: rgba(0, 212, 255, 0.2);
    color: var(--accent);
  }

  .risk-badge.none {
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
  }

  .attendance-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .attendance-stat {
    text-align: center;
    padding: 12px 8px;
    background: var(--bg-card-hover);
    border-radius: 12px;
  }

  .attendance-stat .stat-num {
    display: block;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .attendance-stat.confirmed .stat-num { color: var(--success); }
  .attendance-stat.pending .stat-num { color: var(--warning); }
  .attendance-stat.declined .stat-num { color: var(--danger); }
  .attendance-stat.total .stat-num { color: var(--accent); }

  .attendance-stat .stat-label {
    font-size: 11px;
    color: var(--text-muted);
  }

  .declined-list, .pending-list {
    margin-bottom: 12px;
  }

  .list-title {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .declined-item, .pending-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--bg-card-hover);
    border-radius: 10px;
    margin-bottom: 6px;
  }

  .declined-item {
    background: rgba(255, 71, 87, 0.08);
  }

  .declined-item .member-name,
  .pending-item .member-name {
    font-size: 14px;
    font-weight: 500;
    flex: 1;
  }

  .declined-item .member-role,
  .pending-item .member-role {
    font-size: 11px;
    color: var(--text-muted);
  }

  .member-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .key-badge {
    padding: 2px 8px;
    background: var(--primary);
    color: white;
    font-size: 10px;
    border-radius: 10px;
    font-weight: 600;
  }

  .pending-icon {
    font-size: 16px;
  }

  .backup-section {
    margin-bottom: 12px;
  }

  .backup-title {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .backup-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .backup-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(0, 212, 255, 0.08);
    border-radius: 10px;
    text-align: left;
    color: var(--text-primary);
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .backup-item:hover {
    border-color: var(--accent);
    background: rgba(0, 212, 255, 0.15);
  }

  .backup-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .backup-name {
    font-size: 14px;
    font-weight: 500;
    flex: 1;
  }

  .backup-role {
    font-size: 11px;
    color: var(--text-muted);
  }

  .backup-add {
    padding: 4px 10px;
    background: var(--accent);
    color: var(--bg-dark);
    font-size: 11px;
    border-radius: 12px;
    font-weight: 600;
  }

  .recording-advice {
    margin-bottom: 12px;
  }

  .advice-title {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .advice-content {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
  }

  .advice-content.keep {
    background: rgba(0, 214, 143, 0.1);
    color: var(--success);
  }

  .advice-content.cancel {
    background: rgba(255, 170, 0, 0.1);
    color: var(--warning);
  }

  .advice-icon {
    font-size: 18px;
    font-weight: 700;
  }

  .action-alert {
    background: rgba(255, 71, 87, 0.08);
    border: 1px solid rgba(255, 71, 87, 0.2);
    border-radius: 12px;
    padding: 16px;
  }

  .alert-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--danger);
    margin-bottom: 8px;
  }

  .alert-content p {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .alert-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .alert-btn {
    padding: 10px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .alert-btn.primary {
    background: var(--danger);
    color: white;
  }

  .alert-btn.primary:hover {
    background: #ff3b4f;
  }

  .alert-btn.secondary {
    background: var(--warning);
    color: white;
  }

  .alert-btn.secondary:hover {
    background: #e69500;
  }

  .downgrade-badge {
    padding: 8px 16px;
    background: rgba(0, 212, 255, 0.2);
    color: var(--accent);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    text-align: center;
  }

  .sectional-tag {
    display: inline-block;
    padding: 2px 8px;
    background: var(--accent);
    color: var(--bg-dark);
    font-size: 10px;
    border-radius: 8px;
    margin-right: 8px;
    font-weight: 600;
  }

  .conflict-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(255, 71, 87, 0.2);
    color: var(--danger);
  }

  .conflict-badge.resolved {
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
  }

  .conflict-list {
    margin-bottom: 16px;
  }

  .conflict-title {
    font-size: 13px;
    color: var(--danger);
    font-weight: 600;
    margin-bottom: 10px;
  }

  .conflict-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 71, 87, 0.08);
    border-radius: 10px;
    margin-bottom: 6px;
  }

  .conflict-icon {
    font-size: 24px;
  }

  .conflict-info {
    flex: 1;
  }

  .conflict-eq {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .conflict-with {
    font-size: 11px;
    color: var(--text-muted);
  }

  .conflict-tag {
    padding: 4px 10px;
    background: var(--danger);
    color: white;
    font-size: 10px;
    border-radius: 10px;
    font-weight: 600;
  }

  .solutions-section {
    background: var(--bg-card-hover);
    border-radius: 12px;
    padding: 12px;
  }

  .solutions-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--accent);
  }

  .solution-group {
    margin-bottom: 12px;
  }

  .solution-group:last-child {
    margin-bottom: 0;
  }

  .solution-label {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 8px;
    font-weight: 500;
  }

  .solution-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .solution-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background: var(--bg-dark);
    border-radius: 10px;
    text-align: left;
    color: var(--text-primary);
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .solution-option:hover {
    border-color: var(--primary);
    transform: translateX(4px);
  }

  .solution-option.premium {
    background: rgba(255, 170, 0, 0.1);
  }

  .solution-option.premium:hover {
    border-color: var(--warning);
  }

  .option-name {
    font-size: 13px;
    font-weight: 500;
  }

  .option-price {
    font-size: 12px;
    color: var(--primary);
    font-weight: 600;
  }

  .solution-option.premium .option-price {
    color: var(--warning);
  }

  .timeslot-group {
    margin-bottom: 8px;
  }

  .timeslot-group:last-child {
    margin-bottom: 0;
  }

  .timeslot-label {
    font-size: 11px;
    color: var(--text-muted);
    display: block;
    margin-bottom: 4px;
  }

  .timeslot-buttons {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .timeslot-btn {
    padding: 6px 12px;
    background: var(--bg-dark);
    color: var(--text-primary);
    border-radius: 8px;
    font-size: 12px;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .timeslot-btn:hover {
    border-color: var(--accent);
    background: rgba(0, 212, 255, 0.1);
  }

  .conflict-resolved {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    background: rgba(0, 214, 143, 0.1);
    border-radius: 10px;
  }

  .resolved-icon {
    width: 28px;
    height: 28px;
    background: var(--success);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
  }

  .resolved-text {
    flex: 1;
    font-size: 13px;
    color: var(--success);
    font-weight: 500;
  }

  .reset-btn {
    padding: 6px 12px;
    background: var(--bg-card-hover);
    color: var(--text-secondary);
    border-radius: 8px;
    font-size: 12px;
  }

  .reset-btn:hover {
    background: var(--bg-dark);
  }

  .no-conflict {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    background: rgba(0, 214, 143, 0.08);
    border-radius: 10px;
    color: var(--success);
    font-size: 13px;
  }

  .no-conflict-icon {
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
</style>
