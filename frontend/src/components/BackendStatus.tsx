import { useEffect, useState } from "react";
import { getBackendHealth } from "../utils/api";

type ApiStatus = "checking" | "connected" | "offline";

function BackendStatus() {
  const [status, setStatus] = useState<ApiStatus>("checking");

  useEffect(() => {
    let active = true;

    getBackendHealth()
      .then((health) => {
        if (!active) return;
        setStatus(health.status === "ok" ? "connected" : "offline");
      })
      .catch(() => {
        if (!active) return;
        setStatus("offline");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={`backend-status ${status}`}>
      <span aria-hidden="true" />
      <strong>Backend</strong>
      <small>
        {status === "checking" && "Checking connection"}
        {status === "connected" && "Connected locally"}
        {status === "offline" && "Offline"}
      </small>
    </div>
  );
}

export default BackendStatus;
