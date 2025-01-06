import { Header } from "./components/Header";
import { ProtectionStatus } from "./components/ProtectionStatus";
import { ScanConfig } from "./components/ScanConfig";
import { ReportURL } from "./components/ReportURL";
import { DownloadReport } from "./components/DownloadReport";
import { Toaster } from "sonner";
import { useEffect } from "react";
import { uiNotifications } from "./services/ui-notifications.service";

const App = () => {
  useEffect(() => {
    // Mostrar notificaciones pendientes al abrir la extensión
    uiNotifications.showPendingNotifications();

    // Escuchar nuevas notificaciones
    const handleMessage = (message) => {
      if (message.action === "new_notification") {
        toast.error(message.notification.message, {
          description: message.notification.description,
          duration: 0,
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

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
