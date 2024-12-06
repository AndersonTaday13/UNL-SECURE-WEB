import { DownloadIcon } from "lucide-react";

export const DownloadReport = () => {
  return (
    <div className="px-4 py-3 w-full">
      <button
        className="w-full flex items-center justify-center gap-2 p-2 text-sm 
      text-gray-600 hover:bg-gray-100 rounded-md shadow-sm transition-colors"
        onClick={() => handleClick()}
      >
        <span>Informe del día</span>
        <DownloadIcon size={16} />
      </button>
    </div>
  );
};
