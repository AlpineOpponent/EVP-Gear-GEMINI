import React, { useState, useRef, useEffect } from 'react';
import { GearItem, ModalState, TagPath } from '../types';

interface ActionsMenuProps {
  item: GearItem | null;
  tagInfo: { name: string; path: TagPath } | null;
  openModal: (type: ModalState['type'], data: any) => void;
  handleDeleteItem: (itemId: string) => void;
  handleDeleteTag: (path: TagPath) => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({ item, tagInfo, openModal, handleDeleteItem, handleDeleteTag }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = () => {
    if (item) {
      openModal('editItem', { item });
    } else if (tagInfo) {
      openModal('editTag', { tagInfo });
    }
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (item) {
      openModal('delete', {
        onConfirm: () => handleDeleteItem(item.id),
        title: 'Delete Item',
        description: <>Are you sure you want to permanently delete <strong className="text-white">{item.name}</strong>?</>
      });
    } else if (tagInfo) {
       openModal('delete', {
        onConfirm: () => handleDeleteTag(tagInfo.path),
        title: 'Delete Tag',
        description: <>Are you sure you want to delete <strong className="text-white">{tagInfo.name}</strong>? <strong className="text-red-400 block mt-2">This will also delete all sub-tags and gear items within it.</strong></>
       });
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-20">
          <ul className="py-1">
            <li>
              <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">
                Edit {item ? 'Item' : 'Tag'}
              </button>
            </li>
            <li>
              <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600">
                Delete {item ? 'Item' : 'Tag'}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActionsMenu;