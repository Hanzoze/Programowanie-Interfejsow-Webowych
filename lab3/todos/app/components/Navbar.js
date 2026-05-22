"use client";
import Link from 'next/link';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // 1. Importujemy hook koszyka

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart(); // 2. Wyciągamy łączną liczbę przedmiotów

  return (
    <div className="navbar">
      <div className="logo">
        <Link href="/"><img src="/img/logo.png" width="125px" alt="logo" /></Link>
      </div>
      <nav>
        <ul id="MenuItems">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/#products">Products</Link></li>
          <li><Link href="/add-game">Dodaj grę</Link></li>
          
          {user ? (
            <>
              <li>
                <span onClick={logout} className="nav-link" style={{ cursor: 'pointer' }}>
                  Wyloguj
                </span>
              </li>
            </>
          ) : (
            <li><Link href="/login">Login</Link></li>
          )}
        </ul>
      </nav>
      <Link href="/cart" className="cart-icon-container" style={{ position: 'relative' }}>
        <img src="/img/cart.png" width="30px" height="30px" alt="cart" />
        {/* 3. Jeśli w koszyku coś jest, pokazujemy czerwoną kropkę/licznik */}
        {totalItems > 0 && (
          <span className="cart-badge" style={{
            position: 'absolute',
            top: '-5px',
            right: '-10px',
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px'
          }}>
            {totalItems}
          </span>
        )}
      </Link>
    </div>
  );
}