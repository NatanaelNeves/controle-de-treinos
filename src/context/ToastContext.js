// src/context/ToastContext.js
import React, { createContext, useState, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext({});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant = 'light', delay = 5000) => {
    const id = Date.now();
    // Adiciona um novo toast ao array de toasts
    setToasts(prevToasts => [...prevToasts, { id, message, variant, delay }]);
  };

  const removeToast = (id) => {
    // Remove o toast do array quando ele é fechado
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 1056 }} // zIndex alto para ficar sobre outros elementos como modais
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            onClose={() => removeToast(toast.id)}
            show={true}
            delay={toast.delay}
            autohide
            bg={toast.variant} // Define a cor de fundo (success, danger, warning, info, light, dark)
          >
            <Toast.Body className={toast.variant === 'light' ? 'text-dark' : 'text-white'}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

// Hook customizado para usar o toast facilmente em outros componentes
export const useToast = () => useContext(ToastContext);