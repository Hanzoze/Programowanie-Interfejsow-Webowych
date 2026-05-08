"use client";
import Link from 'next/link';
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <div className="navbar">
      <div className="logo">
        <Link href="/"><img src="/img/logo.png" width="125px" alt="logo" /></Link>
      </div>
      <nav>
        <ul id="MenuItems">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/#products">Products</Link></li>
          
          {user ? (
            <>
                <li>
                <span onClick={logout} className="nav-link">
                    Wyloguj
                </span>
                </li>
            </>
            ) : (
            <li><Link href="/login">Login</Link></li>
            )}
        </ul>
      </nav>
      <Link href="/cart">
        <img src="/img/cart.png" width="30px" height="30px" alt="cart" />
      </Link>
    </div>
  );
}