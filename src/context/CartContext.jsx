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
    const stockMax = producto.stock !== undefined ? parseInt(producto.stock, 10) : 50;
    if (stockMax <= 0) return false;

    let alcanzadoLimite = false;
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.producto.id === producto.id);
      if (index > -1) {
        const actual = prevCart[index].cantidad;
        const deseado = Math.min(stockMax, actual + cantidad);
        if (deseado === actual) alcanzadoLimite = true;

        const updated = [...prevCart];
        updated[index] = {
          ...updated[index],
          cantidad: deseado,
          notas: notas || updated[index].notas,
        };
        return updated;
      }
      const inicial = Math.min(stockMax, cantidad);
      return [...prevCart, { producto, cantidad: inicial, notas }];
    });
    return !alcanzadoLimite;
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
      prevCart.map((item) => {
        if (item.producto.id === productoId) {
          const stockMax = item.producto.stock !== undefined ? parseInt(item.producto.stock, 10) : 50;
          return { ...item, cantidad: Math.min(stockMax, nuevaCantidad) };
        }
        return item;
      })
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
