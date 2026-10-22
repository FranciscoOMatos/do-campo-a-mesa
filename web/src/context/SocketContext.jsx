import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import { io } from 'socket.io-client';

import { API_URL } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const novoSocket = io(
      API_URL,
      {
        auth: {
          token
        }
      }
    );

    setSocket(novoSocket);

    return () => {
      novoSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={socket}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}