"use client";
import { use, useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function ProductPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const gameId = params.id;
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        const docRef = doc(db, "games", gameId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setGame({ id: docSnap.id, ...docSnap.data() });
            } else {
                setGame(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [gameId]);

    const handlePurchase = async () => {
        if (!user) {
            alert("Musisz się zalogować, aby kupić produkt!");
            router.push("/login");
            return;
        }

        if (!game) return;

        try {
            const docRef = doc(db, "games", gameId);
            await updateDoc(docRef, {
                isAvailable: false,
                buyerId: user.uid 
            });
            
            alert("Dziękujemy za zakup!");
            router.push("/");
        } catch (error) {
            console.error("Błąd zakupu:", error);
        }
    };

    if (loading) return <div className="small-container">Ładowanie...</div>;

    if (!game) {
        return (
            <div className="small-container">
                <h2>Nie znaleziono takiej gry</h2>
                <Link href="/" className="btn">Powrót do strony głównej</Link>
            </div>
        );
    }

    return (
        <div className="small-container single-product">
            <div className="row">
                <div className="col-2">
                    <img 
                        src={(game.images && game.images.length > 0) 
                            ? `/${game.images[0]}` 
                            : "/img/placeholder.webp"} 
                        width="100%" 
                        alt={game.title} 
                        style={!game.isAvailable ? { filter: "grayscale(100%)", opacity: "0.6" } : {}}
                    />
                </div>
                <div className="col-2">
                    <p><Link href="/">Home</Link> / {game.type}</p>
                    <h1>{game.title}</h1>
                    <h4>{game.price_pln} PLN</h4>
                    
                    <div className="game-stats" style={{margin: '20px 0'}}>
                        <p><strong>Status:</strong> {game.isAvailable ? "Dostępny" : "SPRZEDANE"}</p>
                        <p><strong>Gracze:</strong> {game.min_players} - {game.max_players}</p>
                        <p><strong>Czas gry:</strong> {game.avg_play_time_minutes} min</p>
                        <p><strong>Wydawca:</strong> {game.publisher}</p>
                    </div>

                    {!game.isAvailable ? (
                        <button className="btn" disabled style={{ background: "#ccc", cursor: "not-allowed" }}>
                            Oferta wygasła
                        </button>
                    ) : user ? (
                        <button className="btn" onClick={handlePurchase}>Kup Teraz</button>
                    ) : (
                        <div style={{ marginTop: "20px" }}>
                            <p style={{ color: "#ff523b", marginBottom: "10px" }}>
                                Zaloguj się, aby dokonać zakupu.
                            </p>
                            <Link href="/login" className="btn">Zaloguj się</Link>
                        </div>
                    )}

                    <h3 style={{marginTop: "20px"}}>Opis produktu</h3>
                    <br />
                    {game.description && game.description.map((line, index) => (
                        <p key={index} style={{marginBottom: '10px'}}>{line}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}