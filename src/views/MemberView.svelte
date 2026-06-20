<script>
  import { onMount, onDestroy } from 'svelte'
  import { 
    bandMembers, currentMemberId, memberConfirmations, memberPayments,
    selectedDate, selectedRoom, selectedSlots, selectedEquipments,
    rooms, timeSlots, equipments, pricePerPerson, recordingNeeded,
    bandName
  } from '../stores/bookingStore.js'

  let countdown = { hours: 0, minutes: 0, seconds: 0 }
  let countdownInterval = null

  $: currentMember = bandMembers.find(m => m.id === $currentMemberId)
  $: memberStatus = $memberConfirmations[$currentMemberId] || 'pending'
  $: hasPaid = $memberPayments[$currentMemberId] || false
  $: myInstruments = (() => {
    if (!currentMember) return []
    const instMap = {
      'vocals': { name: '主唱', icon: '🎤' },
      'guitar': { name: '吉他', icon: '🎸' },
      'bass': { name: '贝斯', icon: '🎻' },
      'drums': { name: '架子鼓', icon: '🥁' },
      'keyboard': { name: '键盘', icon: '🎹' }
    }
    const inst = instMap[currentMember.instrument]
    return inst ? [inst] : []
  })()

  $: borrowedEquipments = getBorrowedEquipments()
  
  function getBorrowedEquipments() {
    if (!currentMember) return []
    const eqMap = {
      'vocals': ['mic-1'],
      'guitar': ['guitar-amp'],
      'bass': ['bass-amp'],
      'drums': ['drum-set'],
      'keyboard': ['keyboard']
    }
    const myEqIds = eqMap[currentMember.instrument] || []
    if ($recordingNeeded) {
      myEqIds.push('audio-interface', 'monitor')
    }
    return myEqIds
      .map(id => equipments.find(e => e.id === id))
      .filter(e => e && $selectedEquipments.includes(e.id))
  }

  function updateCountdown() {
    const now = new Date()
    const rehearsalDate = new Date($selectedDate)
    const firstSlot = timeSlots.find(s => s.id === $selectedSlots[0])
    
    if (firstSlot) {
      const [hours, minutes] = firstSlot.start.split(':')
      rehearsalDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }

    let diff = rehearsalDate - now

    if (diff < 0) diff = 0

    countdown.hours = Math.floor(diff / (1000 * 60 * 60))
    countdown.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    countdown.seconds = Math.floor((diff % (1000 * 60)) / 1000)
  }

  function confirmAttendance() {
    memberConfirmations.update(c => ({ ...c, [$currentMemberId]: 'confirmed' }))
  }

  function declineAttendance() {
    memberConfirmations.update(c => ({ ...c, [$currentMemberId]: 'declined' }))
  }

  function markPaid() {
    memberPayments.update(p => ({ ...p, [$currentMemberId]: !p[$currentMemberId] }))
  }

  function switchMember(memberId) {
    currentMemberId.set(memberId)
  }

  onMount(() => {
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)
  })

  onDestroy(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
  })

  $: roomInfo = rooms.find(r => r.id === $selectedRoom)
</script>

<div class="member-view">
  <header class="member-header">
    <div class="member-switcher">
      {#each bandMembers as member}
        <button
          class="avatar-btn {$currentMemberId === member.id ? 'active' : ''}"
          on:click={() => switchMember(member.id)}
        >
          <span class="avatar">{member.avatar}</span>
        </button>
      {/each}
    </div>
  </header>

  {#if currentMember}
    <div class="profile-card">
      <div class="profile-avatar">{currentMember.avatar}</div>
      <div class="profile-info">
        <h1>{currentMember.name}</h1>
        <p class="role">{currentMember.role}</p>
      </div>
      <div class="status-badge {memberStatus}">
        {#if memberStatus === 'confirmed'}
          ✓ 已确认
        {:else if memberStatus === 'declined'}
          ✗ 已拒绝
        {:else}
          ⏳ 待确认
        {/if}
      </div>
    </div>
  {/if}

  <section class="countdown-section">
    <div class="countdown-label">距离排练开始</div>
    <div class="countdown-timer">
      <div class="time-block">
        <span class="time-num">{String(countdown.hours).padStart(2, '0')}</span>
        <span class="time-label">时</span>
      </div>
      <span class="time-colon">:</span>
      <div class="time-block">
        <span class="time-num">{String(countdown.minutes).padStart(2, '0')}</span>
        <span class="time-label">分</span>
      </div>
      <span class="time-colon">:</span>
      <div class="time-block">
        <span class="time-num">{String(countdown.seconds).padStart(2, '0')}</span>
        <span class="time-label">秒</span>
      </div>
    </div>
  </section>

  <section class="info-card">
    <div class="card-header">
      <h3>🎸 我的乐器</h3>
    </div>
    <div class="instruments-list">
      {#each myInstruments as inst}
        <div class="instrument-item">
          <span class="inst-icon">{inst.icon}</span>
          <span class="inst-name">{inst.name}</span>
          <span class="inst-tag">我负责</span>
        </div>
      {/each}
    </div>
  </section>

  <section class="info-card">
    <div class="card-header">
      <h3>📍 排练信息</h3>
    </div>
    <div class="info-list">
      <div class="info-row">
      <span class="info-label">乐队</span>
      <span class="info-value">{$bandName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">房间</span>
        <span class="info-value">{roomInfo?.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">时间</span>
        <span class="info-value">
          {#if $selectedSlots.length > 0}
            {timeSlots.find(s => s.id === $selectedSlots[0])?.start} - 
            {timeSlots.find(s => s.id === $selectedSlots[$selectedSlots.length - 1])?.end}
          {/if}
        </span>
      </div>
      <div class="info-row">
        <span class="info-label">时长</span>
        <span class="info-value">{$selectedSlots.length} 小时</span>
      </div>
      <div class="info-row">
        <span class="info-label">人数</span>
        <span class="info-value">
          {Object.values($memberConfirmations).filter(s => s === 'confirmed').length} / 
          {Object.keys($memberConfirmations).length} 人已确认</span>
      </div>
    </div>
  </section>

  <section class="info-card">
    <div class="card-header">
      <h3>💰 费用</h3>
      <span class="price">¥{$pricePerPerson}</span>
    </div>
    <div class="payment-status">
      <div class="payment-indicator {hasPaid ? 'paid' : 'unpaid'}">
        <span class="pay-icon">{hasPaid ? '✓' : '!'}</span>
        <span>{hasPaid ? '已付款' : '待付款'}</span>
      </div>
      <button class="pay-btn" on:click={markPaid}>
        {hasPaid ? '取消付款' : '我已付款'}
      </button>
    </div>
  </section>

  {#if $recordingNeeded}
    <section class="info-card recording-card">
      <div class="card-header">
        <h3>🎙️ 录音需求</h3>
        <span class="recording-badge">已开启</span>
      </div>
      <p class="recording-desc">本次排练将进行录音，请提前准备好你的最佳状态！</p>
      <div class="recording-equip">
        <span>🎚️ 录音接口</span>
        <span>🎧 监听耳机</span>
      </div>
    </section>
  {/if}

  <section class="info-card">
    <div class="card-header">
      <h3>👥 成员到场</h3>
    </div>
    <div class="members-attendance">
      {#each bandMembers as member}
      <div class="attend-item">
        <div class="attend-avatar">{member.avatar}</div>
        <div class="attend-info">
          <span class="attend-name">{member.name}</span>
          <span class="attend-role">{member.role}</span>
        </div>
        <div class="attend-status {$memberConfirmations[member.id] || 'pending'}">
          {#if $memberConfirmations[member.id] === 'confirmed'}
            ✓
          {:else if $memberConfirmations[member.id] === 'declined'}
            ✗
          {:else}
            ?
          {/if}
        </div>
      </div>
      {/each}
    </div>
  </section>

  <div class="action-bar">
    <button class="action-btn decline" on:click={declineAttendance}>
      不能参加
    </button>
    <button class="action-btn confirm" on:click={confirmAttendance}>
      确认到场
    </button>
  </div>
</div>

<style>
  .member-view {
    max-width: 480px;
    margin: 0 auto;
    padding: 20px 20px 120px;
  }

  .member-header {
    margin-bottom: 20px;
  }

  .member-switcher {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 8px;
    background: var(--bg-card);
    border-radius: 25px;
  }

  .avatar-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bg-card-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .avatar-btn.active {
    border-color: var(--primary);
    background: rgba(255, 107, 53, 0.2);
  }

  .avatar-btn:hover {
    transform: scale(1.1);
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px;
    background: linear-gradient(135deg, var(--bg-card), var(--bg-card-hover));
    border-radius: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .profile-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 107, 53, 0.1) 0%, transparent 70%);
    border-radius: 50%;
  }

  .profile-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    z-index: 1;
  }

  .profile-info {
    flex: 1;
    z-index: 1;
  }

  .profile-info h1 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .role {
    color: var(--text-muted);
    font-size: 13px;
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    z-index: 1;
  }

  .status-badge.confirmed {
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
  }

  .status-badge.declined {
    background: rgba(255, 71, 87, 0.2);
    color: var(--danger);
  }

  .status-badge.pending {
    background: rgba(255, 170, 0, 0.2);
    color: var(--warning);
  }

  .countdown-section {
    text-align: center;
    padding: 24px;
    background: var(--bg-card);
    border-radius: 20px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }

  .countdown-label {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .countdown-timer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
  }

  .time-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .time-num {
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    min-width: 50px;
  }

  .time-label {
    font-size: 11px;
    color: var(--text-muted);
  }

  .time-colon {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary);
    padding-bottom: 16px;
  }

  .info-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid var(--border);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .card-header h3 {
    font-size: 15px;
    font-weight: 600;
  }

  .price {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary);
  }

  .instruments-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .instrument-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--bg-card-hover);
    border-radius: 10px;
  }

  .inst-icon {
    font-size: 22px;
  }

  .inst-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }

  .inst-tag {
    padding: 3px 8px;
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
    font-size: 11px;
    border-radius: 10px;
  }

  .empty-text {
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    padding: 20px;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--border);
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 13px;
    color: var(--text-muted);
  }

  .info-value {
    font-size: 14px;
    font-weight: 500;
  }

  .payment-status {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .payment-indicator {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
  }

  .payment-indicator.paid {
    background: rgba(0, 214, 143, 0.15);
    color: var(--success);
  }

  .payment-indicator.unpaid {
    background: rgba(255, 170, 0, 0.15);
    color: var(--warning);
  }

  .pay-icon {
    font-size: 16px;
  }

  .pay-btn {
    padding: 8px 16px;
    background: var(--primary);
    color: white;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .pay-btn:hover {
    background: var(--primary-dark);
  }

  .recording-card {
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05));
    border-color: rgba(0, 212, 255, 0.3);
  }

  .recording-badge {
    padding: 4px 10px;
    background: var(--accent);
    color: var(--bg-dark);
    font-size: 11px;
    font-weight: 600;
    border-radius: 10px;
  }

  .recording-desc {
    font-size: 13px;
    color: var(--text-secondary);
    margin-bottom: 12px;
  }

  .recording-equip {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .recording-equip span {
    padding: 6px 12px;
    background: var(--bg-card-hover);
    border-radius: 20px;
    font-size: 12px;
  }

  .members-attendance {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .attend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 10px;
    transition: background 0.2s;
  }

  .attend-item:hover {
    background: var(--bg-card-hover);
  }

  .attend-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--bg-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .attend-info {
    flex: 1;
  }

  .attend-name {
    font-size: 14px;
    font-weight: 500;
    display: block;
  }

  .attend-role {
    font-size: 11px;
    color: var(--text-muted);
  }

  .attend-status {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
  }

  .attend-status.confirmed {
    background: rgba(0, 214, 143, 0.2);
    color: var(--success);
  }

  .attend-status.declined {
    background: rgba(255, 71, 87, 0.2);
    color: var(--danger);
  }

  .attend-status.pending {
    background: rgba(255, 170, 0, 0.2);
    color: var(--warning);
  }

  .action-bar {
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
    gap: 12px;
    z-index: 50;
  }

  .action-btn {
    flex: 1;
    padding: 14px;
    border-radius: 25px;
    font-size: 15px;
    font-weight: 600;
  }

  .action-btn.decline {
    background: var(--bg-card-hover);
    color: var(--text-secondary);
  }

  .action-btn.confirm {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
  }

  .action-btn.confirm:hover {
    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
  }
</style>
