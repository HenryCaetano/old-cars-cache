import { Link } from "react-router-dom";
import { IconeSeta } from "../components/Icones";
import { useTitulo } from "../useTitulo";

export function NotFoundPage() {
  useTitulo("Página não encontrada");

  return (
    <div className="pagina nao-encontrado">
      <span className="nao-encontrado__numero">404</span>
      <h1>Esta página não está no arquivo</h1>
      <p>O endereço não corresponde a nenhuma rota do quadro: grade, ficha, cadastro ou cache.</p>
      <Link to="/" className="botao botao--primario">
        Voltar à grade <IconeSeta size={14} />
      </Link>
    </div>
  );
}
