import React from 'react';
import { useStatesQuery, useCitiesQuery } from '../hooks/useGeography';

interface Props {
  stateValue: string;
  cityValue: string;
  onStateChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
}

// Shared geography selector used identically in signup and profile for both portals.
// Resets city when state changes so we never hold a stale city/state combination.
export function StateCityPicker({ stateValue, cityValue, onStateChange, onCityChange, disabled }: Props) {
  const { data: states = [], isLoading: statesLoading } = useStatesQuery();
  const selectedState = states.find((s) => s.name === stateValue);
  const { data: cities = [], isLoading: citiesLoading } = useCitiesQuery(selectedState?.id);

  function handleStateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onStateChange(e.target.value);
    onCityChange(''); // reset city whenever state changes
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <select
          value={stateValue}
          onChange={handleStateChange}
          disabled={disabled || statesLoading}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <select
          value={cityValue}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled || !stateValue || citiesLoading}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
