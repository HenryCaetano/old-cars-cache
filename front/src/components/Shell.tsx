import { NavLink, Outlet, Link } from "react-router-dom";
import { CacheMeter } from "./CacheMeter";
import { LastReadStrip } from "./LastReadStrip";
import { ToastHost } from "./ToastHost";
import { IconeExterno } from "./Icones";

export function Shell() {
  return (
    <div className="app">
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>

      <aside className="rail">
        <Link to="/" className="marca" aria-label="Carros Clássicos — grade de entrada">
          <span className="marca__tag">Nº 001—100</span>
          <span className="marca__nome">
            Carros
            <br />
            Clássicos
          </span>
          <span className="marca__sub">Arquivo SPTech</span>
        </Link>

        <nav className="rail-nav" aria-label="Navegação principal">
          <NavLink to="/" end className={({ isActive }) => `rail-nav__item ${isActive ? "is-ativo" : ""}`}>
            <span className="rail-nav__marca" aria-hidden="true" />
            <span>Grade de entrada</span>
          </NavLink>
          <NavLink to="/carros/novo" className={({ isActive }) => `rail-nav__item ${isActive ? "is-ativo" : ""}`}>
            <span className="rail-nav__marca" aria-hidden="true" />
            <span>Nova entrada</span>
          </NavLink>
          <NavLink to="/cache" className={({ isActive }) => `rail-nav__item ${isActive ? "is-ativo" : ""}`}>
            <span className="rail-nav__marca" aria-hidden="true" />
            <span>Quadro do cache</span>
          </NavLink>
        </nav>

        <div className="rail__rodape">
          <CacheMeter />
          <a
            className="rail__link"
            href="http://localhost:8080/swagger-ui.html"
            target="_blank"
            rel="noreferrer"
          >
            Swagger da API <IconeExterno size={12} />
          </a>
          <p className="rail__assinatura">ProgWeb · SPTech</p>
        </div>
      </aside>

      <div className="principal">
        <LastReadStrip />
        <main className="conteudo" id="conteudo">
          <Outlet />
        </main>
        <footer className="rodape">
          <span>Carros Clássicos · arquivo de 100 exemplares</span>
          <span>
            API local <code>localhost:8080</code>
          </span>
        </footer>
      </div>

      <ToastHost />
    </div>
  );
}
