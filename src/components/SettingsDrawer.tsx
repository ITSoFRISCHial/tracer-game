'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Dev Notes: Settings Drawer with Parent Gate
 *
 * The settings drawer can only be opened by holding the settings button
 * for 2 seconds (see SettingsButton below). This prevents accidental access
 * by children.
 *
 * Configurable settings:
 * - Corridor width (30-60px): How wide the "acceptable zone" is for tracing
 * - Completion threshold (50-100%): How much coverage needed to complete a letter
 * - Speech enabled: Toggle voice feedback on/off
 * - Show tracing zone: draws the faint green corridor (debug aid, off by default)
 *
 * Accessibility: the drawer is a modal dialog (role="dialog", Escape closes,
 * focus moves to the Close button on open) and every slider is tied to its
 * label with htmlFor/id. It scrolls internally (overflow-y-auto) so it also
 * fits short iPad viewports.
 */
export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings, resetSettings, scores, resetScores } = useSettings();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes the drawer; move focus into it when it opens.
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="absolute right-0 top-0 h-full w-[26rem] max-w-full bg-paper border-l-4 border-line shadow-2xl p-6 overflow-y-auto text-ink"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold">Settings</h2>
          <button ref={closeRef} onClick={onClose} className="btn btn-quiet btn-stack">
            <span className="btn-icon" aria-hidden>✖️</span>
            <span>Close</span>
          </button>
        </div>

        <section className="bg-white rounded-3xl border-2 border-line p-4 mb-5">
          <h3 className="text-xl font-extrabold mb-4">Tracing</h3>

          {/* Corridor Width */}
          <div className="mb-5">
            <label htmlFor="corridor-width" className="block font-bold mb-2">
              Corridor Width: {settings.corridorWidth}px
            </label>
            <input
              id="corridor-width"
              type="range"
              min="30"
              max="60"
              value={settings.corridorWidth}
              onChange={(e) => updateSettings({ corridorWidth: Number(e.target.value) })}
              className="w-full h-10 cursor-pointer accent-[#2b6cdf]"
            />
            <div className="flex justify-between text-sm font-semibold text-ink-soft">
              <span>Harder (30)</span>
              <span>Easier (60)</span>
            </div>
          </div>

          {/* Completion Threshold */}
          <div className="mb-5">
            <label htmlFor="completion-threshold" className="block font-bold mb-2">
              Completion Threshold: {Math.round(settings.completionThreshold * 100)}%
            </label>
            <input
              id="completion-threshold"
              type="range"
              min="50"
              max="100"
              value={Math.round(settings.completionThreshold * 100)}
              onChange={(e) => updateSettings({ completionThreshold: Number(e.target.value) / 100 })}
              className="w-full h-10 cursor-pointer accent-[#2b6cdf]"
            />
            <div className="flex justify-between text-sm font-semibold text-ink-soft">
              <span>Easier (50%)</span>
              <span>Harder (100%)</span>
            </div>
          </div>

          {/* Speech Toggle */}
          <label className="flex items-center gap-3 min-h-14 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.speechEnabled}
              onChange={(e) => updateSettings({ speechEnabled: e.target.checked })}
              className="w-7 h-7 accent-[#178246]"
            />
            <span className="font-bold">
              <span aria-hidden>🔊 </span>Voice Feedback {settings.speechEnabled ? 'On' : 'Off'}
            </span>
          </label>

          {/* Corridor visibility (debug aid) */}
          <label className="flex items-center gap-3 min-h-14 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showCorridor}
              onChange={(e) => updateSettings({ showCorridor: e.target.checked })}
              className="w-7 h-7 accent-[#178246]"
            />
            <span className="font-bold">
              <span aria-hidden>🟢 </span>Show tracing zone
              <span className="block text-sm font-semibold text-ink-soft">For grown-ups, to tune the corridor</span>
            </span>
          </label>
        </section>

        {/* Reset Settings */}
        <button onClick={resetSettings} className="btn btn-quiet w-full mb-6 gap-2">
          <span aria-hidden>↺</span> Reset Settings to Default
        </button>

        {/* Lifetime Stats */}
        <h3 className="text-xl font-extrabold mb-3">Lifetime Stats</h3>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white border-2 border-line p-3 rounded-2xl text-center">
            <div className="text-3xl font-extrabold"><span aria-hidden>⭐</span> {scores.letterPoints}</div>
            <div className="text-sm font-bold text-ink-soft">Letter Points</div>
          </div>
          <div className="bg-white border-2 border-line p-3 rounded-2xl text-center">
            <div className="text-3xl font-extrabold"><span aria-hidden>🏆</span> {scores.wordPoints}</div>
            <div className="text-sm font-bold text-ink-soft">Word Points</div>
          </div>
          <div className="col-span-2 bg-white border-2 border-line p-3 rounded-2xl text-center">
            <div className="text-3xl font-extrabold"><span aria-hidden>📝</span> {scores.wordsCompleted}</div>
            <div className="text-sm font-bold text-ink-soft">Words Completed</div>
          </div>
        </div>

        {/* Reset Scores */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all scores?')) {
              resetScores();
            }
          }}
          className="btn w-full gap-2 border-2 border-[#e9a7a7]"
          style={{ '--btn': '#fde2e2', '--btn-lip': '#e9a7a7', '--btn-fg': '#8f1d1d' } as React.CSSProperties}
        >
          <span aria-hidden>🗑️</span> Reset All Scores
        </button>
      </div>
    </div>
  );
}

interface SettingsButtonProps {
  onOpen: () => void;
}

/**
 * Settings button with hold-to-open gate (parent gate).
 *
 * Press and hold for HOLD_DURATION ms; a fill sweeps across the button as
 * progress. Releasing, leaving or cancelling the pointer aborts. A plain tap
 * does nothing, so a child cannot open settings by accident. Icon (gear) plus
 * the label "Settings" follow the app-wide icon+label convention.
 * The animation loop lives in a ref (`tickRef`) so it can reschedule itself
 * without referencing its own const (react-hooks/immutability).
 */
export function SettingsButton({ onOpen }: SettingsButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {});

  const HOLD_DURATION = 2000; // 2 seconds

  useEffect(() => {
    tickRef.current = () => {
      if (holdStartRef.current === null) return;
      const progress = Math.min((Date.now() - holdStartRef.current) / HOLD_DURATION, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        // Held long enough - open settings
        holdStartRef.current = null;
        setHoldProgress(0);
        onOpen();
      } else {
        animationFrameRef.current = requestAnimationFrame(() => tickRef.current());
      }
    };
  }, [onOpen]);

  const handlePointerDown = useCallback(() => {
    holdStartRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(() => tickRef.current());
  }, []);

  const handlePointerUp = useCallback(() => {
    holdStartRef.current = null;
    setHoldProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const fill = `${Math.round(holdProgress * 100)}%`;

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      className="btn btn-quiet btn-stack no-select"
      style={{
        // Progress fill sweeping left to right while held.
        backgroundImage: `linear-gradient(90deg, #bfdcff ${fill}, transparent ${fill})`,
        fontSize: '0.95rem',
      }}
      aria-label="Settings. Hold for 2 seconds to open."
    >
      <span className="btn-icon" aria-hidden>⚙️</span>
      <span>Settings</span>
    </button>
  );
}
