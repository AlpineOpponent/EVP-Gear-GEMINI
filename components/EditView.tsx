import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GearItem, TagHierarchy, BrandInfo } from '../types';
import { suggestTagsForLevel } from '../services/geminiService';
import { BRANDS } from '../utils/brandData';
import { BrandLogo } from './BrandLogo';

interface EditViewProps {
  onAddItem: (item: Omit<GearItem, 'id'>) => void;
  tagHierarchy: TagHierarchy;
}

type Suggestion = { tag: string; matchPercentage: number };

const BrandSuggestionItem: React.FC<{ brand: BrandInfo, onSelect: (brand: BrandInfo) => void }> = ({ brand, onSelect }) => {
    return (
        <button
            type="button"
            onClick={() => onSelect(brand)}
            className="w-full text-left px-3 py-2 hover:bg-sky-600 transition-colors flex items-center space-x-3"
        >
            <BrandLogo brandName={brand.name} className="h-6 w-8"/>
            <span>{brand.name}</span>
        </button>
    );
};

const InputField: React.FC<{
    label: string;
    name: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    autoComplete?: string;
}> = ({ label, name, value, onChange, onKeyDown, type = 'text', required = false, placeholder='', autoComplete="off" }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            required={required}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
        />
    </div>
);

const TextAreaField: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
}> = ({ label, name, value, onChange, placeholder='' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={3}
            placeholder={placeholder}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
        />
    </div>
);

const SuggestionDropdown: React.FC<{
    suggestions: Suggestion[];
    onSelect: (value: string) => void;
    isNewCheck: (value: string) => boolean;
}> = ({ suggestions, onSelect, isNewCheck }) => {
    if (suggestions.length === 0) return null;
    return (
        <div className="absolute z-10 w-full mt-1 bg-slate-600 border border-slate-500 rounded-md shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((s, i) => {
                const isNew = isNewCheck(s.tag);
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onSelect(s.tag)}
                        className="w-full text-left px-3 py-2 hover:bg-sky-600 transition-colors flex justify-between items-center"
                    >
                        <span>{s.tag}</span>
                        <div className="flex items-center space-x-2">
                             <span className="text-xs text-slate-400 font-mono bg-slate-700 px-1.5 py-0.5 rounded-md">
                                {s.matchPercentage}%
                            </span>
                            {isNew && (
                                <span className="text-xs font-bold text-green-900 bg-green-300 px-2 py-0.5 rounded-full">
                                    NEW
                                </span>
                            )}
                        </div>
                    </button>
                )
            })}
        </div>
    );
};

const TagInputWithSuggestions: React.FC<{
    level: 'tt' | 'mt' | 'bt';
    label: string;
    value: string;
    isLoading: boolean;
    suggestions: Suggestion[];
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelect: (level: 'tt' | 'mt' | 'bt', value: string) => void;
    isNewCheck: (level: 'tt' | 'mt' | 'bt', value: string) => boolean;
}> = ({ level, label, value, isLoading, suggestions, onChange, onSelect, isNewCheck }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            const currentValue = e.currentTarget.value;
            if (currentValue) {
              onSelect(level, currentValue);
            }
        }
    };

    return (
        <div className="relative">
            <InputField 
              label={label} 
              name={level} 
              value={value} 
              onChange={onChange} 
              onKeyDown={handleKeyDown}
              required 
              placeholder="Type or select... (Enter to confirm)" />
            {isLoading && <div className="absolute top-8 right-2 h-5 w-5 border-2 border-slate-400 border-t-sky-500 rounded-full animate-spin"></div>}
            {!isLoading && <SuggestionDropdown suggestions={suggestions} onSelect={(val) => onSelect(level, val)} isNewCheck={(val) => isNewCheck(level, val)} />}
        </div>
    );
};


const EditView: React.FC<EditViewProps> = ({ onAddItem, tagHierarchy }) => {
  const [item, setItem] = useState<Omit<GearItem, 'id'>>({
    name: '', brand: '', weight: 0, notes: '', tt: '', mt: '', bt: '',
  });
  const [suggestions, setSuggestions] = useState<{ tt: Suggestion[], mt: Suggestion[], bt: Suggestion[] }>({ tt: [], mt: [], bt: [] });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState<{tt: boolean, mt: boolean, bt: boolean}>({ tt: false, mt: false, bt: false });
  const [brandSuggestions, setBrandSuggestions] = useState<BrandInfo[]>([]);
  const brandInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fix: Corrected typo from `brandInputref` to `brandInputRef`.
      if (brandInputRef.current && !brandInputRef.current.contains(event.target as Node)) {
        setBrandSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setItem(prev => ({
      ...prev,
      [name]: name === 'weight' ? parseInt(value, 10) || 0 : value,
    }));

    if (name === 'brand') {
      if (value) {
        const filtered = BRANDS.filter(b => b.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5);
        setBrandSuggestions(filtered);
      } else {
        setBrandSuggestions([]);
      }
    }
  };

  const handleBrandSelect = (brand: BrandInfo) => {
    setItem(prev => ({ ...prev, brand: brand.name }));
    setBrandSuggestions([]);
  };

  const itemDetails = { name: item.name, brand: item.brand, notes: item.notes };
  
  const processSuggestions = (sugs: Suggestion[] | null): Suggestion[] => {
      if (!sugs) return [];
      return sugs.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  const handleSuggestTags = useCallback(async () => {
    if (!item.name) {
      alert('Please enter an item name to get suggestions.');
      return;
    }
    setIsSuggesting(true);
    setLoadingSuggestions({ tt: true, mt: true, bt: true });
    setSuggestions({ tt: [], mt: [], bt: [] });
    try {
      const [ttSugs, mtSugs, btSugs] = await Promise.all([
        suggestTagsForLevel('tt', itemDetails, tagHierarchy, {}),
        suggestTagsForLevel('mt', itemDetails, tagHierarchy, { tt: '' }),
        suggestTagsForLevel('bt', itemDetails, tagHierarchy, { tt: '', mt: '' })
      ]);
      setSuggestions({ 
          tt: processSuggestions(ttSugs), 
          mt: processSuggestions(mtSugs), 
          bt: processSuggestions(btSugs) 
      });
    } catch (error) {
        console.error("Failed to get tag suggestions:", error);
        alert("Could not fetch tag suggestions.");
    } finally {
        setIsSuggesting(false);
        setLoadingSuggestions({ tt: false, mt: false, bt: false });
    }
  }, [item.name, item.brand, item.notes, tagHierarchy]);

  const handleSelect = useCallback(async (level: 'tt' | 'mt' | 'bt', value: string) => {
    if (level === 'tt') {
        setItem(prev => ({ ...prev, tt: value, mt: '', bt: '' }));
        setSuggestions(prev => ({ ...prev, tt: [], mt: [], bt: [] }));
        setLoadingSuggestions({ tt: false, mt: true, bt: true });
        const [mtSugs, btSugs] = await Promise.all([
            suggestTagsForLevel('mt', itemDetails, tagHierarchy, { tt: value }),
            suggestTagsForLevel('bt', itemDetails, tagHierarchy, { tt: value, mt: '' })
        ]);
        setSuggestions(prev => ({ 
            ...prev, 
            mt: processSuggestions(mtSugs), 
            bt: processSuggestions(btSugs)
        }));
        setLoadingSuggestions(prev => ({ ...prev, mt: false, bt: false }));

    } else if (level === 'mt') {
        setItem(prev => ({ ...prev, mt: value, bt: '' }));
        setSuggestions(prev => ({ ...prev, mt: [], bt: [] }));
        setLoadingSuggestions(prev => ({ ...prev, bt: true }));
        const btSugs = await suggestTagsForLevel('bt', itemDetails, tagHierarchy, { tt: item.tt, mt: value });
        setSuggestions(prev => ({ ...prev, bt: processSuggestions(btSugs) }));
        setLoadingSuggestions(prev => ({ ...prev, bt: false }));

    } else { // level === 'bt'
        setItem(prev => ({ ...prev, bt: value }));
        setSuggestions(prev => ({ ...prev, bt: [] }));
    }
  }, [item.tt, itemDetails, tagHierarchy]);


  const isNewTag = useCallback((level: 'tt' | 'mt' | 'bt', value: string): boolean => {
    if (level === 'tt') {
        return !tagHierarchy[value];
    }
    if (level === 'mt') {
        return !tagHierarchy[item.tt]?.children[value];
    }
    if (level === 'bt') {
        return !tagHierarchy[item.tt]?.children[item.mt]?.children[value];
    }
    return false;
  }, [tagHierarchy, item.tt, item.mt]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (item.name && item.tt && item.mt && item.bt && item.weight > 0) {
      onAddItem(item);
    } else {
      alert('Please fill in required fields: Name, Weight (>0), and all three Tags.');
    }
  };

  return (
    <div className="bg-slate-800 p-4 md:p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-white">Add New Gear Item</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">Item Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Item Name" name="name" value={item.name} onChange={handleItemChange} required placeholder="e.g., Hubba Hubba NX"/>
                <div className="relative" ref={brandInputRef}>
                  <InputField label="Brand" name="brand" value={item.brand} onChange={handleItemChange} placeholder="e.g., MSR"/>
                  {brandSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-600 border border-slate-500 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {brandSuggestions.map((brand) => (
                           <BrandSuggestionItem key={brand.name} brand={brand} onSelect={handleBrandSelect} />
                        ))}
                    </div>
                  )}
                </div>
            </div>
             <div className="mt-4">
                 <InputField label="Weight (grams)" name="weight" type="number" value={item.weight === 0 ? '' : item.weight} onChange={handleItemChange} required placeholder="e.g., 1720"/>
            </div>
            <div className="mt-4">
                <TextAreaField label="Notes" name="notes" value={item.notes} onChange={handleItemChange} placeholder="e.g., Reliable 2-person tent."/>
            </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-slate-300">Categorization</h3>
            <button
              type="button"
              onClick={handleSuggestTags}
              disabled={isSuggesting || !item.name}
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 w-full sm:w-auto"
            >
              {isSuggesting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </>
              ) : (
                '✨ Suggest Tags with AI'
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TagInputWithSuggestions 
                level="tt" 
                label="Top Tag (TT)" 
                value={item.tt}
                isLoading={loadingSuggestions.tt}
                suggestions={suggestions.tt}
                onChange={handleItemChange}
                onSelect={handleSelect}
                isNewCheck={isNewTag}
            />
            <TagInputWithSuggestions 
                level="mt" 
                label="Middle Tag (MT)"
                value={item.mt}
                isLoading={loadingSuggestions.mt}
                suggestions={suggestions.mt}
                onChange={handleItemChange}
                onSelect={handleSelect}
                isNewCheck={isNewTag}
            />
            <TagInputWithSuggestions 
                level="bt" 
                label="Base Tag (BT)"
                value={item.bt}
                isLoading={loadingSuggestions.bt}
                suggestions={suggestions.bt}
                onChange={handleItemChange}
                onSelect={handleSelect}
                isNewCheck={isNewTag}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors"
            >
              Save Item
            </button>
        </div>
      </form>
    </div>
  );
};

export default EditView;