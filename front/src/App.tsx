import { Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { GradePage } from "./pages/GradePage";
import { CarPage } from "./pages/CarPage";
import { CarFormPage } from "./pages/CarFormPage";
import { CachePage } from "./pages/CachePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<GradePage />} />
        <Route path="carros/novo" element={<CarFormPage />} />
        <Route path="carros/:id" element={<CarPage />} />
        <Route path="carros/:id/editar" element={<CarFormPage />} />
        <Route path="cache" element={<CachePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
