import { Header } from "./components/Header";
import { ProtectionStatus } from "./components/ProtectionStatus";
import { ScanConfig } from "./components/ScanConfig";
import { ReportURL } from "./components/ReportURL";
import { DownloadReport } from "./components/DownloadReport";
import { Toaster } from "sonner";

const App = () => {
  return (
    <>
      <div className="w-80 bg-white shadow-lg rounded-xl overflow-hidden">
        <Toaster richColors position="top-right" expand={false} />
        <Header />
        <div className="space-y-2">
          <ProtectionStatus />
          <div className="space-y-1 divide-y divide-gray-100">
            <ScanConfig />
            <ReportURL />
            <DownloadReport />
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
