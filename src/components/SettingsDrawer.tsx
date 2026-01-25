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
 * The settings drawer can only be opened by holding the settings icon
 * for 2 seconds. This prevents accidental access by children.
 *
 * Configurable settings:
 * - Corridor width (30-60px): How wide the "acceptable zone" is for tracing
 * - Completion threshold (50-100%): How much coverage needed to complete a letter
 * - Speech enabled: Toggle voice feedback on/off
 */
export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSettings, resetSettings, scores, resetScores } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        {/* Corridor Width */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corridor Width: {settings.corridorWidth}px
          </label>
          <input
            type="range"
            min="30"
            max="60"
            value={settings.corridorWidth}
            onChange={(e) => updateSettings({ corridorWidth: Number(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Harder (30)</span>
            <span>Easier (60)</span>
          </div>
        </div>

        {/* Completion Threshold */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Completion Threshold: {Math.round(settings.completionThreshold * 100)}%
          </label>
          <input
            type="range"
            min="50"
            max="100"
            value={Math.round(settings.completionThreshold * 100)}
            onChange={(e) => updateSettings({ completionThreshold: Number(e.target.value) / 100 })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Easier (50%)</span>
            <span>Harder (100%)</span>
          </div>
        </div>

        {/* Speech Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.speechEnabled}
              onChange={(e) => updateSettings({ speechEnabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Voice Feedback {settings.speechEnabled ? 'On' : 'Off'}
            </span>
          </label>
        </div>

        {/* Reset Settings */}
        <button
          onClick={resetSettings}
          className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium mb-4 hover:bg-gray-300"
        >
          Reset Settings to Default
        </button>

        <hr className="my-6" />

        {/* Lifetime Stats */}
        <h3 className="text-lg font-bold text-gray-800 mb-4">Lifetime Stats</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{scores.letterPoints}</div>
            <div className="text-xs text-gray-600">Letter Points</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{scores.wordPoints}</div>
            <div className="text-xs text-gray-600">Word Points</div>
          </div>
          <div className="col-span-2 bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{scores.wordsCompleted}</div>
            <div className="text-xs text-gray-600">Words Completed</div>
          </div>
        </div>

        {/* Reset Scores */}
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all scores?')) {
              resetScores();
            }
          }}
          className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
        >
          Reset All Scores
        </button>
      </div>
    </div>
  );
}

/**
 * Settings button with hold-to-open gate
 */
interface SettingsButtonProps {
  onOpen: () => void;
}

export function SettingsButton({ onOpen }: SettingsButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const HOLD_DURATION = 2000; // 2 seconds

  const updateProgress = useCallback(() => {
    if (holdStartRef.current === null) return;

    const elapsed = Date.now() - holdStartRef.current;
    const progress = Math.min(elapsed / HOLD_DURATION, 1);
    setHoldProgress(progress);

    if (progress >= 1) {
      // Held long enough - open settings
      holdStartRef.current = null;
      setHoldProgress(0);
      onOpen();
    } else {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [onOpen]);

  const handlePointerDown = useCallback(() => {
    holdStartRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  const handlePointerUp = useCallback(() => {
    holdStartRef.current = null;
    setHoldProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
      className="relative w-10 h-10 flex items-center justify-center text-2xl text-gray-500 hover:text-gray-700"
      aria-label="Hold for 2 seconds to open settings"
    >
      {/* Progress ring */}
      {holdProgress > 0 && (
        <svg
          className="absolute inset-0"
          viewBox="0 0 40 40"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 18}`}
            strokeDashoffset={`${2 * Math.PI * 18 * (1 - holdProgress)}`}
            transform="rotate(-90 20 20)"
          />
        </svg>
      )}
      <span className="relative z-10">⚙️</span>
    </button>
  );
}
