"use client";
import React from "react";
import { useCart } from "../context/CartContext"; 
import { useAuth } from "../context/AuthContext";
import { db } from "@/app/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const { cart, dispatch } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const handleRemove = (id) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: id });
  };

  const handleClearCart = () => {
    if (window.confirm("Czy na pewno chcesz opróżnić koszyk?")) {
      dispatch({ type: "CLEAR_CART" });
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      alert("Musisz się zalogować, aby sfinalizować zakup!");
      router.push("/login");
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        for (const item of cart) {
          const gameRef = doc(db, "games", item.id);
          const gameSnap = await transaction.get(gameRef);

          if (!gameSnap.exists()) {
            throw `Gra "${item.title}" została usunięta ze sklepu!`;
          }

          const gameData = gameSnap.data();

          if (!gameData.isAvailable) {
            throw `Niestety, gra "${item.title}" została już kupiona przez kogoś innego! Spóźniłeś się.`;
          }
        }

        for (const item of cart) {
          const gameRef = doc(db, "games", item.id);
          transaction.update(gameRef, {
            isAvailable: false,
            buyerId: user.uid
          });
        }
      });

      alert("Dziękujemy za zakup! Oferty zostały pomyślnie zamknięte.");
      dispatch({ type: "CLEAR_CART" }); 
      router.push("/"); 

    } catch (error) {
      alert(error); 
    }
  };

  return (
    <div className="small-container cart-page">
      <h2 className="cart-page-title">Twój Koszyk</h2>

      {cart.length === 0 ? (
        <div className="cart-empty-container">
          <i className="fa-solid fa-basket-shopping cart-empty-icon"></i>
          <p className="cart-empty-text">Twój koszyk jest pusty.</p>
          <Link href="/" className="btn">Wróć do sklepu</Link>
        </div>
      ) : (
        <>
          <table className="cart-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th style={{ textAlign: "right" }}>Cena</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id} className="cart-row">
                  <td>
                    <div className="product-cell-wrapper">
                      <img src={item.img} alt={item.title} className="cart-product-img" />
                      <div>
                        <p className="cart-product-title">{item.title}</p>
                        <small className="cart-product-price-info">Cena: {item.price} PLN</small>
                        <button onClick={() => handleRemove(item.id)} className="cart-remove-btn">
                          Usuń
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="cart-price-subtotal">
                    {item.price.toFixed(2)} PLN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="cart-actions-container">
            <button onClick={handleClearCart} className="btn cart-clear-btn">
              Wyczyść koszyk
            </button>

            <div className="cart-summary-box">
              <table className="cart-summary-table">
                <tbody>
                  <tr className="cart-summary-row">
                    <td>Suma częściowa:</td>
                    <td className="cart-summary-total">{totalPrice.toFixed(2)} PLN</td>
                  </tr>
                </tbody>
              </table>
              <button 
                className="btn checkout-btn" 
                onClick={handleCheckout}
              >
                Przejdź do płatności i kup
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}