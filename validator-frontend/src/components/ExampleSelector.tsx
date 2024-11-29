import { examples } from '@/data/examples';

export default function ExampleSelector({ onSelect }: { onSelect: (cpp: string, rust: string) => void }) {
  return (
    <div className="relative w-64 mx-auto mb-8">
      <label className="block text-center text-sm font-medium text-gray-500 mb-3 font-fira-sans">
        Try an example
      </label>
      <div className="relative">
        <select 
          onChange={(e) => {
            if (e.target.value) {
              const example = examples[e.target.value as keyof typeof examples];
              onSelect(example.cpp, example.rust);
            }
          }}
          className="block w-full rounded-md border-0 pl-4 pr-8 py-2.5 text-sm 
                   focus:ring-2 focus:ring-blue-500 appearance-none
                   bg-gradient-to-b from-gray-50 to-white shadow-md transition-all duration-200
                   hover:from-white hover:to-gray-50 cursor-pointer font-fira-sans
                   text-gray-700"
        >
          <option value="">Select an example...</option>
          <option value="simple_struct">Simple Struct</option>
          <option value="simple_enum">Simple Enum</option>
          <option value="switch_case">Switch Case</option>
          <option value="add_u32">Add Unsigned Integers</option>
          <option value="simple_generic">Simple Generic</option>
          <option value="deref">Dereference</option>
          <option value="binary_search">Binary Search</option>
          <option value="access_array">Access Array</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
