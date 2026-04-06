// Get the API base URL - default to localhost for development
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  
  // Default fallback based on current location
  if (typeof window !== "undefined") {
    const port = window.location.port ? `:${window.location.port}` : "";
    const protocol = window.location.protocol;
    // For localhost/127.0.0.1, default to port 3000
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `${protocol}//localhost:3000`;
    }
    // For other hosts, use the same host with default port
    return `${protocol}//${window.location.hostname}:8080`;
  }
  
  return "http://localhost:3000";
};

const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;
  
  // Default fallback based on current location
  if (typeof window !== "undefined") {
    const isSecure = window.location.protocol === "https:";
    const hostname = window.location.hostname;
    const wsProtocol = isSecure ? "wss:" : "ws:";
    
    // For localhost, use port 3000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${wsProtocol}//localhost:3000`;
    }
    // For other hosts, use the same host with port 8080
    return `${wsProtocol}//${hostname}:8080`;
  }
  
  return "ws://localhost:3000";
};

export const env = {
  apiBaseUrl: getApiBaseUrl(),
  socketUrl: getSocketUrl(),
};

