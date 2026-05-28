import { Select, Tooltip } from 'antd';
import { useRef, useEffect, useState } from 'react';
import type { ChatMode } from './types';
import { MODES } from './modeConfig';

interface ModeSelectorProps {
  value: ChatMode;
  onChange: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  const currentMode = MODES.find((m) => m.id === value) ?? MODES[0];
  const selectRef = useRef<any>(null);
  const [dynamicWidth, setDynamicWidth] = useState(120);

  // 动态计算宽度：基于当前选中项的文字长度
  useEffect(() => {
    const label = `${currentMode.icon} ${currentMode.name}`;
    // 中文字符约 14px，英文字符约 7px，加上 icon 和 padding
    let width = 32; // padding
    for (const ch of label) {
      width += ch.charCodeAt(0) > 127 ? 16 : 8;
    }
    setDynamicWidth(Math.max(90, Math.min(width, 180)));
  }, [currentMode]);

  return (
    <Tooltip title={`当前模式：${currentMode.name} — ${currentMode.description}`} placement="top">
      <Select
        ref={selectRef}
        value={value}
        onChange={(v) => onChange(v as ChatMode)}
        disabled={disabled}
        size="small"
        style={{ width: dynamicWidth, transition: 'width 0.2s ease' }}
        popupMatchSelectWidth={false}
        options={MODES.map((m) => ({
          value: m.id,
          label: (
            <span>
              {m.icon} {m.name}
            </span>
          ),
        }))}
        dropdownRender={(menu) => (
          <div style={{ minWidth: 200 }}>
            {menu}
          </div>
        )}
        optionRender={(option) => {
          const mode = MODES.find((m) => m.id === option.value);
          if (!mode) return option.label;
          return (
            <div>
              <div style={{ fontWeight: 500 }}>
                {mode.icon} {mode.name}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {mode.description}
              </div>
            </div>
          );
        }}
      />
    </Tooltip>
  );
}
