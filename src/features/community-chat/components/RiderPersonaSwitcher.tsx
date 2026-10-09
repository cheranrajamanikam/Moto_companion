import React from 'react';
import { ChatUser } from '../types';
import { DEMO_PERSONAS } from '../constants/demo-personas';

interface Props {
  activePersona: ChatUser;
  onSelectPersona: (persona: ChatUser) => void;
}

export const RiderPersonaSwitcher: React.FC<Props> = ({
  activePersona,
  onSelectPersona,
}) => {
  return (
    <div className="chat-dev-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="chat-dev-badge">DEV / DEMO MODE</span>
        <span style={{ color: 'var(--moto-text-secondary)' }}>
          Active Rider Persona:
        </span>
      </div>

      <div className="chat-persona-pills">
        {DEMO_PERSONAS.map((p) => {
          const isSelected = p.id === activePersona.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPersona(p)}
              className={`chat-persona-btn ${isSelected ? 'active' : ''}`}
              title={`Switch active persona to ${p.name}`}
            >
              <strong>{p.name}</strong>{' '}
              <span style={{ opacity: 0.8, fontSize: '0.7rem' }}>
                ({p.bike ? p.bike.replace('Royal Enfield ', '') : ''})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
