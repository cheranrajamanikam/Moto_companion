import React from 'react';
import { Check } from 'lucide-react';

export const PARTNER_QUALITIES_OPTIONS = [
  { id: 'interactive', label: 'Friendly & Interactive' },
  { id: 'cooperative', label: 'Cooperative' },
  { id: 'good-communication', label: 'Good Communication' },
  { id: 'punctual', label: 'Punctual' },
  { id: 'safety-conscious', label: 'Safety Conscious' },
  { id: 'respectful', label: 'Respectful' },
  { id: 'calm-patient', label: 'Calm & Patient' },
  { id: 'easygoing', label: 'Easygoing' },
  { id: 'responsible', label: 'Responsible' },
  { id: 'long-rides', label: 'Comfortable with Long Rides' },
];

export const RIDE_TYPES_OPTIONS = [
  { id: 'city-short', label: 'City / Short Rides' },
  { id: 'long-distance', label: 'Long-Distance Rides' },
  { id: 'weekend', label: 'Weekend Rides' },
  { id: 'regular-commuting', label: 'Regular Commuting' },
  { id: 'casual', label: 'Casual Rides' },
  { id: 'adventure-touring', label: 'Adventure / Touring' },
];

interface PreferenceSelectorProps {
  selectedPartnerPreferences: string[];
  selectedRidePreferences: string[];
  partnerDescription: string;
  onPartnerPreferencesChange?: (prefs: string[]) => void;
  onRidePreferencesChange?: (prefs: string[]) => void;
  onDescriptionChange?: (desc: string) => void;
  onChangePartnerPreferences?: (prefs: string[]) => void;
  onChangeRidePreferences?: (prefs: string[]) => void;
  onChangePartnerDescription?: (desc: string) => void;
}

export const PreferenceSelector: React.FC<PreferenceSelectorProps> = ({
  selectedPartnerPreferences,
  selectedRidePreferences,
  partnerDescription,
  onPartnerPreferencesChange,
  onRidePreferencesChange,
  onDescriptionChange,
  onChangePartnerPreferences,
  onChangeRidePreferences,
  onChangePartnerDescription,
}) => {
  const handlePartnerChange = onChangePartnerPreferences || onPartnerPreferencesChange || (() => {});
  const handleRideChange = onChangeRidePreferences || onRidePreferencesChange || (() => {});
  const handleDescChange = onChangePartnerDescription || onDescriptionChange || (() => {});
  const togglePartnerPref = (id: string) => {
    if (selectedPartnerPreferences.includes(id)) {
      handlePartnerChange(selectedPartnerPreferences.filter((p) => p !== id));
    } else {
      handlePartnerChange([...selectedPartnerPreferences, id]);
    }
  };

  const toggleRidePref = (id: string) => {
    if (selectedRidePreferences.includes(id)) {
      handleRideChange(selectedRidePreferences.filter((p) => p !== id));
    } else {
      handleRideChange([...selectedRidePreferences, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Partner Qualities Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            What are you looking for in a ride partner?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Select qualities you value most when matching with riders or pillions (Multiple allowed)
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {PARTNER_QUALITIES_OPTIONS.map((item) => {
            const isSelected = selectedPartnerPreferences.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePartnerPref(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500 text-orange-400 shadow-md shadow-orange-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isSelected
                      ? 'bg-orange-500 border-orange-400 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ride Types Section */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">Preferred Ride Types</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            What kind of trips do you like to take together?
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {RIDE_TYPES_OPTIONS.map((item) => {
            const isSelected = selectedRidePreferences.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleRidePref(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    isSelected
                      ? 'bg-amber-500 border-amber-400 text-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Freeform Partner Note */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-3">
        <div>
          <label className="block text-base font-bold text-slate-100">
            Tell us anything else you'd like your ride partner to know
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Mention preferred cruising speeds, gear expectations, rest stop habits, or route styles.
          </p>
        </div>

        <textarea
          rows={3}
          value={partnerDescription}
          onChange={(e) => handleDescChange(e.target.value)}
          placeholder="e.g. I prefer a friendly and cooperative ride partner who communicates well, follows safety rules and enjoys weekend or long-distance rides."
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
        />
      </div>
    </div>
  );
};
