import { createContext, useContext, useState } from "react";

const TrainContext = createContext();

export function TrainProvider({ children }) {
  const [trains, setTrains] = useState([]);

  return (
    <TrainContext.Provider value={{ trains, setTrains }}>
      {children}
    </TrainContext.Provider>
  );
}

export function useTrains() {
  return useContext(TrainContext);
}
