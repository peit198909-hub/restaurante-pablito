import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Componente de paginación reutilizable para tablas y listas de Restaurante Pablito.
 */
export default function Pagination({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 5,
  onPageChange,
  onLimitChange,
}) {
  if (total <= 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Opciones permitidas de límite por página
  const limitOptions = [5, 10, 20, 50];

  // Generar lista de números de páginas
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="glass-card p-3 mt-3 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-dark small border-glass">
      {/* Resumen de conteo */}
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted">
          Mostrando <strong className="text-dark">{startItem}</strong> -{" "}
          <strong className="text-dark">{endItem}</strong> de{" "}
          <strong className="text-gold">{total}</strong> registros
        </span>

        {/* Selector de límite por página */}
        {onLimitChange && (
          <div className="d-flex align-items-center gap-1 ms-2">
            <span className="text-muted">Por página:</span>
            <select
              className="form-select form-select-sm bg-white text-dark border-glass fw-bold"
              style={{ width: "70px", cursor: "pointer" }}
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de navegación */}
      <div className="d-flex align-items-center gap-1">
        <button
          className="btn btn-sm btn-outline-gold d-flex align-items-center px-2 py-1"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title="Página anterior"
        >
          <ChevronLeft size={16} me={1} />
          Anterior
        </button>

        {getPageNumbers().map((pNum) => (
          <button
            key={pNum}
            className={`btn btn-sm px-3 py-1 fw-bold ${
              pNum === page
                ? "btn-gold"
                : "btn-outline-secondary text-dark border-glass"
            }`}
            onClick={() => onPageChange(pNum)}
          >
            {pNum}
          </button>
        ))}

        <button
          className="btn btn-sm btn-outline-gold d-flex align-items-center px-2 py-1"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title="Página siguiente"
        >
          Siguiente
          <ChevronRight size={16} ms={1} />
        </button>
      </div>
    </div>
  );
}
