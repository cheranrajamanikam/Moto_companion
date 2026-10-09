import React from 'react';
import { RecommendationCardData } from '../types';
import { SparklesIcon } from './icons';

interface RecommendationCardProps {
  data: RecommendationCardData;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ data }) => {
  const title = data?.title || 'Route Advisory';
  const confidence = data?.confidence ? String(data.confidence).toUpperCase() : '';
  const recommendation = data?.recommendation || '';

  return (
    <div className="structured-card">
      <div className="structured-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SparklesIcon size={14} style={{ color: 'var(--moto-orange)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {title}
          </span>
        </div>
        {confidence && (
          <span className="structured-card-badge low">
            {confidence} CONFIDENCE
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: '0.88rem',
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.4,
        }}
      >
        {recommendation}
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--moto-text-secondary)', lineHeight: 1.45 }}>
        <strong>Reason:</strong> {data.reason}
      </div>

      {data.whyThisRecommendation && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.025)',
            padding: '8px 10px',
            borderRadius: 'var(--moto-radius-sm)',
            fontSize: '0.78rem',
            color: 'var(--moto-text-muted)',
            lineHeight: 1.4,
          }}
        >
          <strong>Why this recommendation?</strong> {data.whyThisRecommendation}
        </div>
      )}
    </div>
  );
};
