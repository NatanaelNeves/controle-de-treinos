// src/RotaProtegida.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap'; // Importe o Spinner

const RotaProtegida = ({ usuario, authLoading, children }) => {
  // 1. SE A AUTENTICAÇÃO AINDA ESTÁ CARREGANDO, MOSTRA UM SPINNER
  if (authLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  // 2. SE O CARREGAMENTO TERMINOU E NÃO HÁ USUÁRIO, REDIRECIONA
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // 3. SE O CARREGAMENTO TERMINOU E HÁ USUÁRIO, MOSTRA A PÁGINA
  // (Lembre-se que já ajustamos este componente para passar a prop 'usuario' para os filhos)
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { usuario: usuario });
    }
    return child;
  });
};

export default RotaProtegida;