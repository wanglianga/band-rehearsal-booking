<script>
  import { currentView } from './stores/bookingStore.js'
  import LeaderView from './views/LeaderView.svelte'
  import MemberView from './views/MemberView.svelte'
  import WallDisplayView from './views/WallDisplayView.svelte'
</script>

<div class="app-container">
  <nav class="view-switcher">
    <button
      class="view-btn {$currentView === 'leader' ? 'active' : ''}"
      on:click={() => $currentView = 'leader'}
    >
      <span class="icon">🎸</span>
      <span>队长端</span>
    </button>
    <button
      class="view-btn {$currentView === 'member' ? 'active' : ''}"
      on:click={() => $currentView = 'member'}
    >
      <span class="icon">👤</span>
      <span>成员端</span>
    </button>
    <button
      class="view-btn {$currentView === 'wall' ? 'active' : ''}"
      on:click={() => $currentView = 'wall'}
    >
      <span class="icon">🖥️</span>
      <span>墙面屏</span>
    </button>
  </nav>

  <main class="view-content">
    {#if $currentView === 'leader'}
      <LeaderView />
    {:else if $currentView === 'member'}
      <MemberView />
    {:else}
      <WallDisplayView />
    {/if}
  </main>
</div>

<style>
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .view-switcher {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .view-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .view-btn:hover {
    background: var(--bg-card-hover);
    color: var(--text-primary);
  }

  .view-btn.active {
    background: var(--primary);
    color: white;
  }

  .icon {
    font-size: 16px;
  }

  .view-content {
    flex: 1;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
