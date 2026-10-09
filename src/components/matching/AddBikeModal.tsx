import React, { useState } from 'react';
import type { Bike } from "@/types/rider";
import { X, Bike as BikeIcon, Plus } from 'lucide-react';

interface AddBikeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bikeData: Omit<Bike, 'bikeId' | 'userId'>) => void;
}

export const AddBikeModal: React.FC<AddBikeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [engineCC, setEngineCC] = useState<number>(350);
  const [fuelType, setFuelType] = useState<'Petrol' | 'Electric' | 'Hybrid'>('Petrol');
  const [year, setYear] = useState<number>(2023);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [image, setImage] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !model.trim() || !registrationNumber.trim()) {
      setError('Please fill in all required bike fields.');
      return;
    }

    onAdd({
      brand: brand.trim(),
      model: model.trim(),
      engineCC: Number(engineCC),
      fuelType,
      year: Number(year),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      image:
        image.trim() ||
        'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=600',
      isPrimary,
    });

    // Reset
    setBrand('');
    setModel('');
    setEngineCC(350);
    setRegistrationNumber('');
    setImage('');
    setIsPrimary(false);
    setError('');
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
            <BikeIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Add Motorcycle to Garage</h2>
            <p className="text-xs text-slate-400">Register your bike for ride matching compatibility</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand *</label>
              <input
                type="text"
                placeholder="e.g. Royal Enfield, KTM, BMW"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                placeholder="e.g. Classic 350, Duke 390"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Engine CC *</label>
              <input
                type="number"
                min="50"
                max="2500"
                value={engineCC}
                onChange={(e) => setEngineCC(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model Year *</label>
              <input
                type="number"
                min="1990"
                max="2027"
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
              Registration Number (e.g. KA-01-EQ-9876) *
            </label>
            <input
              type="text"
              placeholder="KA-01-AB-1234"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors uppercase font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Motorcycle Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isPrimaryAdd"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-orange-500"
            />
            <label htmlFor="isPrimaryAdd" className="text-xs text-slate-300 cursor-pointer">
              Set as my Primary Bike for Ride Matching
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
              className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add to Garage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
