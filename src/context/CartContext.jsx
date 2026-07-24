import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem("restaurante_pablito_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("restaurante_pablito_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Error guardando el carrito:", e);
    }
  }, [cart]);

  const addToCart = (producto, cantidad = 1, notas = "") => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.producto.id === producto.id);
      if (index > -1) {
        const updated = [...prevCart];
        updated[index] = {
          ...updated[index],
          cantidad: updated[index].cantidad + cantidad,
          notas: notas || updated[index].notas,
        };
        return updated;
      }
      return [...prevCart, { producto, cantidad, notas }];
    });
  };

  const removeFromCart = (productoId) => {
    setCart((prevCart) => prevCart.filter((item) => item.producto.id !== productoId));
  };

  const updateQuantity = (productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      removeFromCart(productoId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  const subtotal = cart.reduce((sum, item) => sum + item.producto.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
}
