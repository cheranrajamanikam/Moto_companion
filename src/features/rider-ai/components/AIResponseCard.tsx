import React from 'react';
import { AIStructuredCard } from '../types';
import { RouteSafetyCard } from './RouteSafetyCard';
import { HazardCard } from './HazardCard';
import { WeatherCard } from './WeatherCard';
import { FuelCard } from './FuelCard';
import { FoodCard } from './FoodCard';
import { RepairCard } from './RepairCard';
import { RecommendationCard } from './RecommendationCard';
import { BikeSuitabilityCard } from './BikeSuitabilityCard';
import { AlternativeRouteCard } from './AlternativeRouteCard';
import { RidePreparationCard } from './RidePreparationCard';

import { RiderAIErrorBoundary } from './RiderAIErrorBoundary';

interface AIResponseCardProps {
  card: AIStructuredCard;
  onViewMap?: (hazardId?: string) => void;
  onFindSaferRoute?: () => void;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({
  card,
  onViewMap,
  onFindSaferRoute,
}) => {
  if (!card || typeof card !== 'object' || !card.type) {
    return null;
  }

  const renderCardContent = () => {
    switch (card.type) {
      case 'route-safety':
        return <RouteSafetyCard data={card} />;
      case 'hazard':
        return (
          <HazardCard
            data={card}
            onViewMap={onViewMap}
            onFindSaferRoute={onFindSaferRoute}
          />
        );
      case 'weather':
        return <WeatherCard data={card} />;
      case 'fuel':
        return <FuelCard data={card} />;
      case 'food':
        return <FoodCard data={card} />;
      case 'repair':
        return <RepairCard data={card} />;
      case 'bike-suitability':
        return <BikeSuitabilityCard data={card} />;
      case 'alternative-route':
        return (
          <AlternativeRouteCard
            data={card}
            onApplyRoute={onFindSaferRoute}
          />
        );
      case 'ride-preparation':
        return <RidePreparationCard data={card} />;
      case 'recommendation':
        return <RecommendationCard data={card} />;
      default:
        return null;
    }
  };

  return (
    <RiderAIErrorBoundary fallbackTitle="Route Card Advisory">
      {renderCardContent()}
    </RiderAIErrorBoundary>
  );
};
