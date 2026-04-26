import { Provider } from "react-redux";
import { store } from "./store/index";
import DashboardPage from "./Pages/DashboardPage";

export default function App() {
  return (
    <Provider store={store}>
      <DashboardPage />
    </Provider>
  );
}
