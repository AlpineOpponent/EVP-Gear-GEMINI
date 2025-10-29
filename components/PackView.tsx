import React, { useState, useMemo } from 'react';
import { GearItem, TagHierarchy } from '../types';
import { BrandLogo } from './BrandLogo';
import { analyzePack } from '../services/geminiService';
import Modal from './modals/Modal';

const PackItemDisplay: React.FC<{item: GearItem, isSelected: boolean, onToggle: (id: string) => void}> = ({ item, isSelected, onToggle }) => {
    return (
        <label key={item.id} className="flex items-center space-x-3 bg-slate-700/50 p-3 rounded-md cursor-pointer transition hover:bg-slate-600/50">
           <input type="checkbox" checked={isSelected} onChange={() => onToggle(item.id)} className="form-checkbox h-5 w-5 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500 shrink-0"/>
           <div className="flex-grow flex justify-between items-center min-w-0">
                <div className="flex items-center space-x-3 min-w-0">
                    <BrandLogo brandName={item.brand} className="h-6 w-6"/>
                    <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{item.name}</p>
                        <p className="text-sm text-slate-400 truncate">{item.brand}</p>
                    </div>
                </div>
                <span className="font-mono text-lg font-bold text-sky-300 px-2 py-1 rounded shrink-0">{item.weight}g</span>
           </div>
        </label>
    );
};

const PackView: React.FC<{ nestedGear: any, tagHierarchy: TagHierarchy, gearItems: GearItem[] }> = ({ nestedGear, tagHierarchy, gearItems }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'item' | 'brand' | 'tag'>('item');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) newSet.delete(itemId);
        else newSet.add(itemId);
        return newSet;
    });
  };

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

  const { totalWeight, packedGear } = useMemo(() => {
    const packed = gearItems.filter(item => selectedItems.has(item.id));
    const weight = packed.reduce((sum, item) => sum + item.weight, 0);
    return { totalWeight: weight, packedGear: packed.sort((a,b) => b.weight - a.weight) };
  }, [selectedItems, gearItems]);

  const handleAnalyzePack = async () => {
    setIsAnalyzing(true);
    const result = await analyzePack(packedGear);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if(printWindow) {
        printWindow.document.write(`
            <html>
                <head><title>EVP-Gear Pack List</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { font-family: sans-serif; background-color: #1e293b; color: #e2e8f0; padding: 2rem;}
                        h1 { font-size: 2rem; font-weight: bold; }
                        h2 { font-size: 1.5rem; font-weight: bold; margin-top: 1.5rem; border-bottom: 2px solid #334155; padding-bottom: 0.5rem;}
                        .item { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #334155; }
                        .total { font-size: 1.2rem; font-weight: bold; text-align: right; margin-top: 1rem; }
                    </style>
                </head>
                <body>
                    <h1>Pack List</h1>
                    <p class="total">Total Weight: ${totalWeight}g (${(totalWeight / 1000).toFixed(2)}kg)</p>
                    ${Object.keys(tagHierarchy).map(tt => {
                        const itemsInTT = packedGear.filter(i => i.tt === tt);
                        if (itemsInTT.length === 0) return '';
                        return `<h2>${tagHierarchy[tt].emoji} ${tt}</h2>${itemsInTT.map(item => `<div class="item"><span>${item.name} (${item.brand})</span><span>${item.weight}g</span></div>`).join('')}`;
                    }).join('')}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
  };

  const renderHierarchicalList = () => (
    <div className="space-y-4">
        {Object.keys(tagHierarchy).map(tt => (
          <div key={tt}>
            <h3 className="text-xl font-bold flex items-center mb-2" style={{ color: tagHierarchy[tt].color }}>
              <span className="mr-3 text-2xl">{tagHierarchy[tt].emoji}</span> {tt}
            </h3>
            {Object.keys(tagHierarchy[tt].children).map(mt => (
              <div key={mt} className="ml-4 my-2">
                <h4 className="font-semibold text-lg text-slate-300">{tagHierarchy[tt].children[mt].emoji} {mt}</h4>
                {Object.keys(tagHierarchy[tt].children[mt].children).map(bt => (
                  <div key={bt} className="ml-4 my-1">
                    <h5 className="font-medium text-slate-400">{bt}</h5>
                    <div className="space-y-2 mt-2">
                      {nestedGear[tt]?.[mt]?.[bt]?.map((item: GearItem) => (
                        <PackItemDisplay key={item.id} item={item} isSelected={selectedItems.has(item.id)} onToggle={toggleItem} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
    </div>
  );

  const renderSearchList = () => (
    <div className="space-y-2">
      {searchResults?.map((item: GearItem) => (
        <PackItemDisplay key={item.id} item={item} isSelected={selectedItems.has(item.id)} onToggle={toggleItem} />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Selection List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-slate-800 p-4 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Select Gear</h2>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <input type="text" placeholder={`Search by ${searchBy}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="flex-shrink-0 bg-slate-700 rounded-md p-1 flex space-x-1">
                    {(['item', 'brand', 'tag'] as const).map(type => (
                        <button key={type} onClick={() => setSearchBy(type)} className={`px-3 py-1 text-sm font-semibold rounded capitalize transition ${searchBy === type ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>{type}</button>
                    ))}
                </div>
            </div>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg shadow-xl">
          {searchResults ? renderSearchList() : renderHierarchicalList()}
        </div>
      </div>
      
      {/* Right Column: Summary */}
      <div className="lg:col-span-1 space-y-4">
        <div className="sticky top-4 space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg shadow-xl text-center">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Pack Weight</p>
                <p className="text-4xl font-bold text-sky-400 mt-2">{totalWeight}g</p>
                <p className="text-slate-400">({(totalWeight / 1000).toFixed(2)} kg)</p>
                <button onClick={handlePrint} disabled={packedGear.length === 0} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Print Pack List
                </button>
                 <button 
                    onClick={handleAnalyzePack} 
                    disabled={isAnalyzing || packedGear.length === 0} 
                    className="mt-4 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500">
                        {isAnalyzing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            '✨ Analyse Pack'
                        )}
                </button>
            </div>
             <div className="bg-slate-800 p-4 rounded-lg shadow-xl">
                <h3 className="text-lg font-bold mb-2 text-white">Packed Items ({packedGear.length})</h3>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                    {packedGear.length > 0 ? packedGear.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm bg-slate-700/50 p-2 rounded">
                            <span className="text-slate-300 truncate pr-2">{item.name}</span>
                            <span className="font-mono text-slate-400 shrink-0">{item.weight}g</span>
                        </div>
                    )) : <p className="text-slate-400 text-sm">No items packed yet.</p>}
                </div>
            </div>
        </div>
      </div>

       {analysisResult && (
            <Modal
                isOpen={true}
                onClose={() => setAnalysisResult(null)}
                title="Pack Analysis ✨"
            >
                <div className="text-slate-300 whitespace-pre-wrap font-mono bg-slate-900 p-4 rounded-md">
                    {analysisResult}
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setAnalysisResult(null)}
                        className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        )}
    </div>
  );
};

export default PackView;