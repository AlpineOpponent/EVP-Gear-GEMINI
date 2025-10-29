import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import EditView from './components/EditView';
import ViewView from './components/ViewView';
import PackView from './components/PackView';
import { GearItem, TagHierarchy, View, ModalState, TagNode, TagPath } from './types';
import { INITIAL_GEAR_ITEMS, INITIAL_TAG_HIERARCHY } from './utils/initialData';
import { generateTagVisuals } from './services/geminiService';
import EditItemModal from './components/modals/EditItemModal';
import EditTagModal from './components/modals/EditTagModal';
import ConfirmDeleteModal from './components/modals/ConfirmDeleteModal';

const App: React.FC = () => {
  const [gearItems, setGearItems] = useState<GearItem[]>(() => {
    try {
      const saved = localStorage.getItem('gearItems');
      return saved ? JSON.parse(saved) : INITIAL_GEAR_ITEMS;
    } catch {
      return INITIAL_GEAR_ITEMS;
    }
  });
  const [tagHierarchy, setTagHierarchy] = useState<TagHierarchy>(() => {
    try {
      const saved = localStorage.getItem('tagHierarchy');
      return saved ? JSON.parse(saved) : INITIAL_TAG_HIERARCHY;
    } catch {
      return INITIAL_TAG_HIERARCHY;
    }
  });
  
  const [activeView, setView] = useState<View>('view');
  const [modal, setModal] = useState<ModalState>({ type: null, data: null });

  useEffect(() => {
    localStorage.setItem('gearItems', JSON.stringify(gearItems));
  }, [gearItems]);

  useEffect(() => {
    localStorage.setItem('tagHierarchy', JSON.stringify(tagHierarchy));
  }, [tagHierarchy]);

  const nestedGear = useMemo(() => {
    const nested: any = {};
    gearItems.forEach(item => {
      if (!nested[item.tt]) nested[item.tt] = {};
      if (!nested[item.tt][item.mt]) nested[item.tt][item.mt] = {};
      if (!nested[item.tt][item.mt][item.bt]) nested[item.tt][item.mt][item.bt] = [];
      nested[item.tt][item.mt][item.bt].push(item);
    });
    return nested;
  }, [gearItems]);

  const addTagToHierarchy = async (hierarchy: TagHierarchy, tt: string, mt: string, bt: string): Promise<TagHierarchy> => {
    let newHierarchy = JSON.parse(JSON.stringify(hierarchy));

    const createTagNode = async (name: string, isMt: boolean = false): Promise<TagNode> => {
        const visuals = await generateTagVisuals(name) || { color: '#7f8c8d', emoji: '📦' };
        if (isMt && visuals.emoji === '📦') { // Add more specific emoji for MTs
             const visualsWithMtEmoji = await generateTagVisuals(`${name} (backpacking gear category)`) || visuals;
             return { name, ...visualsWithMtEmoji, children: {} };
        }
        return { name, ...visuals, children: {} };
    }

    if (!newHierarchy[tt]) newHierarchy[tt] = await createTagNode(tt);
    if (!newHierarchy[tt].children[mt]) newHierarchy[tt].children[mt] = await createTagNode(mt, true);
    if (!newHierarchy[tt].children[mt].children[bt]) newHierarchy[tt].children[mt].children[bt] = await createTagNode(bt);

    return newHierarchy;
  };

  const handleAddItem = async (item: Omit<GearItem, 'id'>) => {
    const isDuplicate = gearItems.some(
      existingItem =>
        existingItem.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
        existingItem.brand.trim().toLowerCase() === item.brand.trim().toLowerCase() &&
        existingItem.weight === item.weight
    );

    if (isDuplicate) {
      alert('This exact item (same name, brand, and weight) already exists.');
      return;
    }

    const newHierarchy = await addTagToHierarchy(tagHierarchy, item.tt, item.mt, item.bt);
    setTagHierarchy(newHierarchy);

    const newItem: GearItem = { ...item, id: crypto.randomUUID() };
    setGearItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    setView('view');
  };
  
  const handleEditItem = async (updatedItem: GearItem) => {
    const originalItem = gearItems.find(i => i.id === updatedItem.id);
    if (!originalItem) return;

    const tagsChanged = originalItem.tt !== updatedItem.tt || originalItem.mt !== updatedItem.mt || originalItem.bt !== updatedItem.bt;
    
    if (tagsChanged) {
        const newHierarchy = await addTagToHierarchy(tagHierarchy, updatedItem.tt, updatedItem.mt, updatedItem.bt);
        setTagHierarchy(newHierarchy);
    }

    setGearItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name)));
    closeModal();
  };
  
  const handleDeleteItem = (itemId: string) => {
    setGearItems(prev => prev.filter(item => item.id !== itemId));
    closeModal();
  };
  
  const handleEditTag = (path: TagPath, newName: string) => {
    const [tt, mt, bt] = path;
    
    setTagHierarchy(currentHierarchy => {
        const newHierarchy = JSON.parse(JSON.stringify(currentHierarchy));
        if (path.length === 1) {
            if (newHierarchy[newName]) { alert("A tag with that name already exists."); return currentHierarchy; }
            const node = newHierarchy[tt];
            delete newHierarchy[tt];
            node.name = newName;
            newHierarchy[newName] = node;
        } else if (path.length === 2) {
            if (newHierarchy[tt].children[newName]) { alert("A tag with that name already exists."); return currentHierarchy; }
            const node = newHierarchy[tt].children[mt];
            delete newHierarchy[tt].children[mt];
            node.name = newName;
            newHierarchy[tt].children[newName] = node;
        } else if (path.length === 3) {
            if (newHierarchy[tt].children[mt].children[newName]) { alert("A tag with that name already exists."); return currentHierarchy; }
            const node = newHierarchy[tt].children[mt].children[bt];
            delete newHierarchy[tt].children[mt].children[bt];
            node.name = newName;
            newHierarchy[tt].children[mt].children[newName] = node;
        }
        return newHierarchy;
    });

    setGearItems(currentItems => currentItems.map(item => {
        if (path.length === 1 && item.tt === tt) return { ...item, tt: newName };
        if (path.length === 2 && item.tt === tt && item.mt === mt) return { ...item, mt: newName };
        if (path.length === 3 && item.tt === tt && item.mt === mt && item.bt === bt) return { ...item, bt: newName };
        return item;
    }));

    closeModal();
  };

  const handleDeleteTag = (path: TagPath) => {
    const [tt, mt] = path;

    setGearItems(currentItems => currentItems.filter(item => {
        if (path.length === 1 && item.tt === path[0]) return false;
        if (path.length === 2 && item.tt === path[0] && item.mt === path[1]) return false;
        if (path.length === 3 && item.tt === path[0] && item.mt === path[1] && item.bt === path[2]) return false;
        return true;
    }));

    setTagHierarchy(currentHierarchy => {
        const newHierarchy = JSON.parse(JSON.stringify(currentHierarchy));
        if (path.length === 1) delete newHierarchy[path[0]];
        if (path.length === 2) delete newHierarchy[path[0]].children[path[1]];
        if (path.length === 3) delete newHierarchy[path[0]].children[path[1]].children[path[2]];
        return newHierarchy;
    });

    closeModal();
  };

  const openModal = (type: ModalState['type'], data: any) => setModal({ type, data });
  const closeModal = () => setModal({ type: null, data: null });

  return (
    <div className="bg-slate-900 min-h-screen text-slate-200 font-sans">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <Header activeView={activeView} setView={setView} />
        <main className="mt-8">
          {activeView === 'edit' && <EditView onAddItem={handleAddItem} tagHierarchy={tagHierarchy} />}
          {activeView === 'view' && <ViewView nestedGear={nestedGear} gearItems={gearItems} tagHierarchy={tagHierarchy} openModal={openModal} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag} />}
          {activeView === 'pack' && <PackView nestedGear={nestedGear} tagHierarchy={tagHierarchy} gearItems={gearItems} />}
        </main>
        
        {modal.type === 'editItem' && (
          <EditItemModal
            isOpen={true}
            onClose={closeModal}
            item={modal.data.item}
            onSave={handleEditItem}
            tagHierarchy={tagHierarchy}
          />
        )}
        
        {modal.type === 'editTag' && (
           <EditTagModal
            isOpen={true}
            onClose={closeModal}
            tagInfo={modal.data.tagInfo}
            onSave={handleEditTag}
          />
        )}
        
        {modal.type === 'delete' && (
          <ConfirmDeleteModal
            isOpen={true}
            onClose={closeModal}
            onConfirm={modal.data.onConfirm}
            title={modal.data.title}
            description={modal.data.description}
          />
        )}
      </div>
    </div>
  );
};

export default App;