import React, { useState, useEffect } from 'react';
import type { Bike } from "@/types/rider";
import { X, Edit3, Save } from 'lucide-react';

interface EditBikeModalProps {
  isOpen: boolean;
  bike: Bike | null;
  onClose: () => void;
  onUpdate: (bikeId: string, updates: Partial<Bike>) => void;
}

export const EditBikeModal: React.FC<EditBikeModalProps> = ({
  isOpen,
  bike,
  onClose,
  onUpdate,
}) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [engineCC, setEngineCC] = useState<number>(350);
  const [fuelType, setFuelType] = useState<'Petrol' | 'Electric' | 'Hybrid'>('Petrol');
  const [year, setYear] = useState<number>(2023);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [image, setImage] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (bike) {
      setBrand(bike.brand);
      setModel(bike.model);
      setEngineCC(bike.engineCC);
      setFuelType(bike.fuelType);
      setYear(bike.year);
      setRegistrationNumber(bike.registrationNumber);
      setImage(bike.image);
      setIsPrimary(bike.isPrimary);
    }
  }, [bike]);

  if (!isOpen || !bike) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(bike.bikeId, {
      brand,
      model,
      engineCC: Number(engineCC),
      fuelType,
      year: Number(year),
      registrationNumber: registrationNumber.toUpperCase(),
      image,
      isPrimary,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121827] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Edit Bike Details</h2>
            <p className="text-xs text-slate-400">Update specification for {bike.brand} {bike.model}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Engine CC</label>
              <input
                type="number"
                value={engineCC}
                onChange={(e) => setEngineCC(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Registration Number
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors uppercase font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Photo URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPrimaryEdit"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="isPrimaryEdit" className="text-xs text-slate-300 cursor-pointer">
              Set as my Primary Bike
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
