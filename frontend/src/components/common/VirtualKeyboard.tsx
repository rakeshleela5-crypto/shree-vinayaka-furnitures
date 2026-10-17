import React, { useState } from 'react';

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  isOpen,
  onClose,
  onKeyPress,
  onBackspace,
  onClear,
  onEnter
}) => {
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);

  if (!isOpen) return null;

  const row1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  const row1Shift = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+'];

  const row2 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'];
  const row3 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];
  const row4 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'];

  const getChar = (char: string) => {
    const isUpper = (isShift && !isCaps) || (!isShift && isCaps);
    return isUpper ? char.toUpperCase() : char.toLowerCase();
  };

  const handleKeyClick = (char: string) => {
    onKeyPress(char);
    if (isShift) {
      setIsShift(false); // Shift is one-shot
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        backgroundColor: '#1e293b',
        border: '2px solid #38bdf8',
        borderRadius: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 15px rgba(56,189,248,0.4)',
        padding: '12px',
        width: '680px',
        maxWidth: '96vw',
        userSelect: 'none',
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }}
    >
      {/* Title bar / Drag Handle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          borderBottom: '1px solid #334155',
          paddingBottom: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>
          <span>⌨️</span>
          <span>SVF - On-Screen Touch Virtual Keyboard</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#ef4444',
            border: 'none',
            color: '#fff',
            borderRadius: '4px',
            width: '24px',
            height: '24px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          title="Close Keyboard"
        >
          ✕
        </button>
      </div>

      {/* Row 1 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {(isShift ? row1Shift : row1).map((key, i) => (
          <button
            key={i}
            onClick={() => handleKeyClick(key)}
            style={{
              flex: 1,
              height: '38px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {key}
          </button>
        ))}
        <button
          onClick={onBackspace}
          style={{
            flex: 1.8,
            height: '38px',
            backgroundColor: '#dc2626',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ⌫ Back
        </button>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        <button
          onClick={() => onKeyPress('\t')}
          style={{
            flex: 1.3,
            height: '38px',
            backgroundColor: '#475569',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Tab
        </button>
        {row2.map((key, i) => (
          <button
            key={i}
            onClick={() => handleKeyClick(getChar(key))}
            style={{
              flex: 1,
              height: '38px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {getChar(key)}
          </button>
        ))}
      </div>

      {/* Row 3 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        <button
          onClick={() => setIsCaps(!isCaps)}
          style={{
            flex: 1.6,
            height: '38px',
            backgroundColor: isCaps ? '#0284c7' : '#475569',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Caps {isCaps ? '●' : '○'}
        </button>
        {row3.map((key, i) => (
          <button
            key={i}
            onClick={() => handleKeyClick(getChar(key))}
            style={{
              flex: 1,
              height: '38px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {getChar(key)}
          </button>
        ))}
        <button
          onClick={onEnter}
          style={{
            flex: 1.8,
            height: '38px',
            backgroundColor: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ↵ Enter
        </button>
      </div>

      {/* Row 4 */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        <button
          onClick={() => setIsShift(!isShift)}
          style={{
            flex: 2,
            height: '38px',
            backgroundColor: isShift ? '#eab308' : '#475569',
            color: isShift ? '#000' : '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ⇧ Shift {isShift ? '▲' : ''}
        </button>
        {row4.map((key, i) => (
          <button
            key={i}
            onClick={() => handleKeyClick(getChar(key))}
            style={{
              flex: 1,
              height: '38px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: '1px solid #475569',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {getChar(key)}
          </button>
        ))}
        <button
          onClick={onClear}
          style={{
            flex: 1.5,
            height: '38px',
            backgroundColor: '#b91c1c',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      {/* Row 5 */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => handleKeyClick('@')}
          style={{
            flex: 1,
            height: '38px',
            backgroundColor: '#334155',
            color: '#f8fafc',
            border: '1px solid #475569',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          @
        </button>
        <button
          onClick={() => handleKeyClick('.com')}
          style={{
            flex: 1.4,
            height: '38px',
            backgroundColor: '#334155',
            color: '#f8fafc',
            border: '1px solid #475569',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          .com
        </button>
        <button
          onClick={() => handleKeyClick(' ')}
          style={{
            flex: 6,
            height: '38px',
            backgroundColor: '#475569',
            color: '#f8fafc',
            border: '1px solid #64748b',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ␣ Space
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1.5,
            height: '38px',
            backgroundColor: '#64748b',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Hide ⌨
        </button>
      </div>
    </div>
  );
};
