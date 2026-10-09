import React from 'react';
import type { Bike } from "@/types/rider";
import { CheckCircle2, Edit3, Trash2, Fuel, Calendar, Gauge } from 'lucide-react';

interface BikeCardProps {
  bike: Bike;
  onSetPrimary?: (bikeId: string) => void;
  onEdit?: (bike: Bike) => void;
  onDelete?: (bikeId: string) => void;
  isOwner?: boolean;
}

export const BikeCard: React.FC<BikeCardProps> = ({
  bike,
  onSetPrimary,
  onEdit,
  onDelete,
  isOwner = true,
}) => {
  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 transition-all duration-200 hover:border-slate-700">
      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
        <img
          src={bike.image}
          alt={`${bike.brand} ${bike.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-transparent"></div>

        {bike.isPrimary && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Primary Bike
          </div>
        )}

        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-amber-400 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
          <Gauge className="w-3.5 h-3.5" />
          {bike.engineCC} CC
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-orange-400 font-semibold uppercase tracking-wider">
              {bike.brand}
            </span>
            <h3 className="text-lg font-bold text-slate-100">{bike.model}</h3>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {bike.registrationNumber}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-slate-500" />
            <span>{bike.fuelType}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{bike.year} Model</span>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60 gap-2">
            {!bike.isPrimary && onSetPrimary && (
              <button
                onClick={() => onSetPrimary(bike.bikeId)}
                className="text-xs text-orange-400 hover:text-orange-300 font-medium px-2 py-1 rounded hover:bg-orange-500/10 transition-colors"
              >
                Set as Primary
              </button>
            )}
            <div className="flex items-center gap-1 ml-auto">
              {onEdit && (
                <button
                  onClick={() => onEdit(bike)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit bike"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDelete && !bike.isPrimary && (
                <button
                  onClick={() => onDelete(bike.bikeId)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete bike"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
