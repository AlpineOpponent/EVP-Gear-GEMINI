import React, { useState, useMemo } from 'react';
import { GearItem, TagHierarchy, ModalState, TagNode, TagPath } from '../types';
import ActionsMenu from './ActionsMenu';
import { BrandLogo } from './BrandLogo';


const GearItemCard: React.FC<{ 
    item: GearItem, 
    openModal: (type: ModalState['type'], data: any) => void;
    showBreadcrumbs?: boolean;
    tagHierarchy: TagHierarchy;
    handleDeleteItem: (itemId: string) => void;
    handleDeleteTag: (path: TagPath) => void;
}> = ({ item, openModal, showBreadcrumbs = false, tagHierarchy, handleDeleteItem, handleDeleteTag }) => {
    const tt = tagHierarchy[item.tt];
    const mt = tt?.children[item.mt];

    return (
        <div className="bg-slate-700/50 rounded-md hover:bg-slate-600/50 transition-colors group p-3">
            {showBreadcrumbs && (
                <div className="flex items-center space-x-1 text-xs mb-2 truncate">
                    <span className="font-bold px-1.5 py-0.5 rounded" style={{backgroundColor: tt?.color ?? '#7f8c8d', color: '#fff'}}>{tt?.emoji} {item.tt}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-300">{mt?.emoji} {item.mt}</span>
                     <span className="text-slate-400">/</span>
                    <span className="text-slate-300">{item.bt}</span>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <BrandLogo brandName={item.brand} className="h-8 w-8" />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{item.name}</p>
                        <p className="text-sm text-slate-400 truncate">{item.brand}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <span className="font-mono text-lg font-bold text-sky-300 px-2 py-1 rounded hidden sm:block">{item.weight}g</span>
                    <ActionsMenu item={item} openModal={openModal} tagInfo={null} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag} />
                </div>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{
    title: string;
    level: number;
    visuals?: { color: string, emoji: string };
    onMenuAction: () => React.ReactNode;
    children: React.ReactNode;
}> = ({ title, level, visuals, onMenuAction, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const headerStyles = [
        "text-2xl font-bold flex items-center", // Level 0 (TT)
        "text-xl font-semibold text-slate-300", // Level 1 (MT)
        "text-lg font-medium text-slate-400"  // Level 2 (BT)
    ];

    return (
        <div className={`my-${4 - level} ${level > 0 ? `ml-${level * 4} md:ml-${level * 6}` : ''}`}>
            <div className="flex items-center justify-between mb-2 group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 text-slate-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <h2 className={headerStyles[level]} style={{ color: visuals?.color }}>
                      {visuals?.emoji && <span className={`mr-3 text-${3-level}xl`}>{visuals.emoji}</span>} {title}
                    </h2>
                </div>
                <div onClick={e => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                   {onMenuAction()}
                </div>
            </div>
            {isOpen && <div className="space-y-2">{children}</div>}
        </div>
    );
};

const ViewView: React.FC<{
  nestedGear: any;
  gearItems: GearItem[];
  tagHierarchy: TagHierarchy;
  openModal: (type: ModalState['type'], data: any) => void;
  handleDeleteItem: (itemId: string) => void;
  handleDeleteTag: (path: TagPath) => void;
}> = ({ nestedGear, gearItems, tagHierarchy, openModal, handleDeleteItem, handleDeleteTag }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchBy, setSearchBy] = useState<'item' | 'brand' | 'tag'>('item');

    const searchResults = useMemo(() => {
        if (!searchQuery) return null;
        const query = searchQuery.toLowerCase();
        return gearItems.filter(item => {
            if (searchBy === 'item') return item.name.toLowerCase().includes(query);
            if (searchBy === 'brand') return item.brand.toLowerCase().includes(query);
            if (searchBy === 'tag') return [item.tt, item.mt, item.bt].some(tag => tag.toLowerCase().includes(query));
            return false;
        });
    }, [searchQuery, searchBy, gearItems]);


  const renderHierarchicalView = () => (
    <div className="space-y-2">
      {Object.keys(tagHierarchy).sort().map(tt => (
        <div key={tt} className="bg-slate-800 p-4 rounded-lg shadow-xl">
          <CollapsibleSection
            title={tt}
            level={0}
            visuals={tagHierarchy[tt]}
            onMenuAction={() => <ActionsMenu item={null} openModal={openModal} tagInfo={{ name: tt, path: [tt] as TagPath, ...tagHierarchy[tt] }} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag} />}
          >
            {Object.keys(tagHierarchy[tt].children).sort().map(mt => (
              <CollapsibleSection
                key={mt}
                title={mt}
                level={1}
                visuals={tagHierarchy[tt].children[mt]}
                onMenuAction={() => <ActionsMenu item={null} openModal={openModal} tagInfo={{ name: mt, path: [tt, mt] as TagPath, ...tagHierarchy[tt].children[mt] }} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag} />}
              >
                {Object.keys(tagHierarchy[tt].children[mt].children).sort().map(bt => (
                  <CollapsibleSection
                    key={bt}
                    title={bt}
                    level={2}
                    onMenuAction={() => <ActionsMenu item={null} openModal={openModal} tagInfo={{ name: bt, path: [tt, mt, bt] as TagPath, ...tagHierarchy[tt].children[mt].children[bt] }} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag} />}
                  >
                    {nestedGear[tt]?.[mt]?.[bt]?.map((item: GearItem) => (
                      <GearItemCard key={item.id} item={item} openModal={openModal} tagHierarchy={tagHierarchy} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag}/>
                    ))}
                  </CollapsibleSection>
                ))}
              </CollapsibleSection>
            ))}
          </CollapsibleSection>
        </div>
      ))}
    </div>
  );

  const renderSearchView = () => (
    <div className="space-y-2">
        {searchResults && searchResults.length > 0 ? (
             searchResults.map(item => <GearItemCard key={item.id} item={item} openModal={openModal} showBreadcrumbs={true} tagHierarchy={tagHierarchy} handleDeleteItem={handleDeleteItem} handleDeleteTag={handleDeleteTag}/>)
        ) : (
            <div className="text-center py-16 bg-slate-800 rounded-lg">
                <h2 className="text-2xl font-bold text-white">No Results Found</h2>
                <p className="text-slate-400 mt-2">Try a different search term or filter.</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="bg-slate-800 p-4 rounded-lg shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-center">
                 <div className="relative flex-grow w-full">
                    <input
                        type="text"
                        placeholder={`Search by ${searchBy}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex-shrink-0 bg-slate-700 rounded-md p-1 flex space-x-1">
                    {(['item', 'brand', 'tag'] as const).map(type => (
                        <button key={type} onClick={() => setSearchBy(type)} className={`px-3 py-1 text-sm font-semibold rounded capitalize transition ${searchBy === type ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>
                            {type}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        {searchQuery ? renderSearchView() : renderHierarchicalView()}

    </div>
  );
};

export default ViewView;