import { BrowserRouter } from "react-router-dom";
import { TrainProvider } from "./context/TrainContext";

<BrowserRouter>
  <TrainProvider>
    <App />
  </TrainProvider>
</BrowserRouter>
