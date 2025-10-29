import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { TagPath } from '../../types';

interface EditTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  tagInfo: {
    name: string;
    path: TagPath;
  };
  onSave: (path: TagPath, newName: string) => void;
}

const EditTagModal: React.FC<EditTagModalProps> = ({ isOpen, onClose, tagInfo, onSave }) => {
  const [name, setName] = useState(tagInfo.name);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setName(tagInfo.name);
    setShowConfirm(false);
  }, [tagInfo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name === tagInfo.name) {
        onClose();
        return;
    }
    // Require confirmation for TT and MT changes
    if (tagInfo.path.length < 3) {
      setShowConfirm(true);
    } else {
      handleConfirmSave();
    }
  };

  const handleConfirmSave = () => {
    onSave(tagInfo.path, name);
  };
  
  const isBroadCategory = tagInfo.path.length < 3;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Tag: ${tagInfo.name}`}>
      {!showConfirm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tagName" className="block text-sm font-medium text-slate-300 mb-1">Tag Name</label>
            <input
              id="tagName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
              required
            />
          </div>
          {isBroadCategory && (
             <p className="text-sm text-amber-400 bg-amber-900/50 p-2 rounded-md">
                Warning: Renaming this tag will update its name for all sub-tags and gear items within it.
            </p>
          )}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white">
                {isBroadCategory ? 'Next...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div>
            <p className="text-slate-300">
                Are you sure you want to rename <strong className="text-white">{tagInfo.name}</strong> to <strong className="text-white">{name}</strong>?
            </p>
            <p className="mt-2 text-sm text-slate-400">This will affect all items and sub-categories within it.</p>
            <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500">Back</button>
                <button type="button" onClick={handleConfirmSave} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white">Confirm & Save</button>
            </div>
        </div>
      )}
    </Modal>
  );
};

export default EditTagModal;