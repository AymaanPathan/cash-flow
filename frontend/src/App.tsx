import { Provider } from "react-redux";
import { store } from "./store/store";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Provider store={store}>
      <DashboardPage />
    </Provider>
  );
}
