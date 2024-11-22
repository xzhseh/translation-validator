import { examples } from '@/data/examples';

export default function ExampleSelector({ onSelect }: { onSelect: (cpp: string, rust: string) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Try an example:
      </label>
      <select 
        onChange={(e) => {
          if (e.target.value) {
            const example = examples[e.target.value as keyof typeof examples];
            onSelect(example.cpp, example.rust);
          }
        }}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Select an example...</option>
        <option value="simple_struct">Simple Struct</option>
        <option value="simple_enum">Simple Enum</option>
        <option value="switch_case">Switch Case</option>
      </select>
    </div>
  );
}
