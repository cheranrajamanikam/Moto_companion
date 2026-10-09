import React, { useState } from 'react';
import type { Bike } from "@/types/rider";
import { BikeCard } from './BikeCard';
import { AddBikeModal } from './AddBikeModal';
import { EditBikeModal } from './EditBikeModal';
import { bikeService } from "@/services/bikeService";
import { Plus, Bike as BikeIcon } from 'lucide-react';

interface BikeGarageProps {
  userId: string;
  bikes: Bike[];
  isOwner?: boolean;
  onBikesChange?: () => void;
}

export const BikeGarage: React.FC<BikeGarageProps> = ({
  userId,
  bikes,
  isOwner = true,
  onBikesChange,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);

  const handleAddBike = (bikeData: Omit<Bike, 'bikeId' | 'userId'>) => {
    bikeService.addBike(userId, bikeData);
    if (onBikesChange) onBikesChange();
  };

  const handleUpdateBike = (bikeId: string, updates: Partial<Bike>) => {
    bikeService.updateBike(userId, bikeId, updates);
    if (onBikesChange) onBikesChange();
  };

  const handleDeleteBike = (bikeId: string) => {
    if (window.confirm('Are you sure you want to remove this motorcycle from your garage?')) {
      bikeService.deleteBike(userId, bikeId);
      if (onBikesChange) onBikesChange();
    }
  };

  const handleSetPrimary = (bikeId: string) => {
    bikeService.setPrimaryBike(userId, bikeId);
    if (onBikesChange) onBikesChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BikeIcon className="w-5 h-5 text-orange-400" />
            Motorcycle Garage
          </h3>
          <p className="text-xs text-slate-400">
            {bikes.length} {bikes.length === 1 ? 'bike' : 'bikes'} registered
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Bike
          </button>
        )}
      </div>

      {bikes.length === 0 ? (
        <div className="p-8 text-center glass-card rounded-2xl border border-dashed border-slate-800">
          <BikeIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No bikes added yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add your motorcycle details so the matching engine can find compatible riding partners.
          </p>
          {isOwner && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold rounded-xl border border-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add First Bike
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bikes.map((bike) => (
            <BikeCard
              key={bike.bikeId}
              bike={bike}
              isOwner={isOwner}
              onSetPrimary={handleSetPrimary}
              onEdit={(b) => setEditingBike(b)}
              onDelete={handleDeleteBike}
            />
          ))}
        </div>
      )}

      <AddBikeModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddBike}
      />

      <EditBikeModal
        isOpen={!!editingBike}
        bike={editingBike}
        onClose={() => setEditingBike(null)}
        onUpdate={handleUpdateBike}
      />
    </div>
  );
};
