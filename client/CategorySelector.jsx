// client/CategorySelector.jsx

import React, { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import categories from './acount_catagory.json'; // 引入 JSON 資料

// 遞迴渲染每個分類項目的元件
const CategoryItem = ({ item, onSelect, level = 0, parentName = '' }) => {
  const currentName = parentName ? `${parentName} > ${item.name}` : item.name;

  const handleSelect = () => {
    onSelect(currentName);
  };

  if (!item.children || item.children.length === 0) {
    return (
      <button
        onClick={handleSelect}
        className="w-full text-left px-4 py-2 hover:bg-holy-gold-50 hover:text-holy-gold-700 rounded-md transition-colors"
        style={{ paddingLeft: `${1 + level * 1.5}rem` }}
      >
        {item.name}
      </button>
    );
  }

  return (
    <details className="w-full" open>
      <summary 
        className="px-4 py-2 font-semibold cursor-pointer hover:bg-graphite-100 hover:text-glory-red-600 rounded-md flex justify-between items-center transition-colors"
        style={{ paddingLeft: `${1 + level * 1.5}rem` }}
      >
        {item.name}
        <ChevronDown size={16} className="transform transition-transform details-arrow text-graphite-500" />
      </summary>
      <div className="pl-2 border-l-2 border-holy-gold-200 ml-4">
        {item.children.map((child, index) => (
          <CategoryItem key={index} item={child} onSelect={onSelect} level={level + 1} parentName={currentName} />
        ))}
      </div>
    </details>
  );
};

// 主要的選擇器元件
const CategorySelector = ({ value, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsModalOpen(false);
  };

  return (
    <>
      <div>
        <label htmlFor="formAccounting" className="block text-sm font-medium text-graphite-700 mb-2">
          會計類別 (選填)
        </label>
        <div className="relative">
          <input
            id="formAccounting"
            type="text"
            value={value}
            onClick={() => setIsModalOpen(true)}
            placeholder="點擊選擇會計類別..."
            className="w-full border border-graphite-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 focus:border-glory-red-500 cursor-pointer bg-white hover:border-holy-gold-400 transition-colors"
            readOnly
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={20} className="text-graphite-500" />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="bg-glory-red-500 p-4 rounded-t-lg flex justify-between items-center border-b">
              <h2 className="text-lg font-semibold text-white">選擇會計類別</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-glory-red-100 p-1 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              {categories.map((category, index) => (
                <CategoryItem key={index} item={category} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        </div>
      )}
      <style>{`
        details > summary::-webkit-details-marker { display: none; }
        details[open] > summary .details-arrow { transform: rotate(180deg); }
      `}</style>
    </>
  );
};

export default CategorySelector;