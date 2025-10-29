import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { GearItem, TagHierarchy } from '../../types';

const EditItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: GearItem;
  onSave: (item: GearItem) => void;
  tagHierarchy: TagHierarchy;
}> = ({ isOpen, onClose, item, onSave, tagHierarchy }) => {
  const [formData, setFormData] = useState<GearItem>(item);

  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let newFormData = { ...formData, [name]: name === 'weight' ? parseInt(value, 10) || 0 : value };

    // Reset child tags if a parent tag changes
    if (name === 'tt') {
        newFormData = { ...newFormData, mt: '', bt: '' };
    } else if (name === 'mt') {
        newFormData = { ...newFormData, bt: '' };
    }

    setFormData(newFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const { ttOptions, mtOptions, btOptions } = useMemo(() => {
    const tts = Object.keys(tagHierarchy).sort();
    const mts = formData.tt ? Object.keys(tagHierarchy[formData.tt]?.children || {}).sort() : [];
    const bts = (formData.tt && formData.mt) ? Object.keys(tagHierarchy[formData.tt]?.children[formData.mt]?.children || {}).sort() : [];
    return { ttOptions: tts, mtOptions: mts, btOptions: bts };
  }, [tagHierarchy, formData.tt, formData.mt]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit: ${item.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">Item Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Item Name</label>
                  <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white" />
                </div>
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-slate-300 mb-1">Brand</label>
                  <input id="brand" name="brand" type="text" value={formData.brand} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white" />
                </div>
            </div>
            <div className="mt-4">
                <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Weight (grams)</label>
                <input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} required className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white" />
            </div>
             <div className="mt-4">
                <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white" />
            </div>
        </div>
        
        <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Categorization</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="tt" className="block text-sm font-medium text-slate-300 mb-1">Top Tag</label>
                    <select id="tt" name="tt" value={formData.tt} onChange={handleChange} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                        <option value="">Select...</option>
                        {ttOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="mt" className="block text-sm font-medium text-slate-300 mb-1">Middle Tag</label>
                    <select id="mt" name="mt" value={formData.mt} onChange={handleChange} disabled={!formData.tt} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white disabled:opacity-50">
                        <option value="">Select...</option>
                        {mtOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="bt" className="block text-sm font-medium text-slate-300 mb-1">Base Tag</label>
                    <select id="bt" name="bt" value={formData.bt} onChange={handleChange} disabled={!formData.mt} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white disabled:opacity-50">
                        <option value="">Select...</option>
                        {btOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500">Cancel</button>
          <button type="submit" className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditItemModal;