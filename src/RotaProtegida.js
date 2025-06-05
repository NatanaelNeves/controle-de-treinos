// src/RotaProtegida.js
import React from 'react'; // Adicione esta linha
import { Navigate } from 'react-router-dom';

const RotaProtegida = ({ usuario, children }) => {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Clona os componentes filhos e injeta a prop 'usuario' neles
  // Isso é útil se os filhos precisarem diretamente da informação do usuário
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { usuario: usuario });
    }
    return child;
  });
};

export default RotaProtegida;