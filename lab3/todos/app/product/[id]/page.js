"use client";
import { use, useEffect, useState } from "react";
import { db, storage } from "@/app/lib/firebase";
import { doc, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/context/CartContext"; 
import { runTransaction } from "firebase/firestore";

export default function ProductPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const gameId = params.id;
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user } = useAuth();
    const { cart, dispatch } = useCart(); 
    const [activeImageIndex, setActiveImageIndex] = useState(0);

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

    const handlePurchaseFlow = () => {
        if (!game) return;

        const isAlreadyInCart = cart.some((item) => item.id === game.id);

        if (isAlreadyInCart) {
            router.push("/cart");
            return;
        }

        const primaryImage = game.images?.[0]?.startsWith('http')
            ? game.images[0]
            : `/${game.images?.[0] || 'img/placeholder.webp'}`;

        dispatch({
            type: "ADD_TO_CART",
            payload: {
                id: game.id,
                title: game.title,
                price: game.auction?.current_bid || game.price_pln, 
                img: primaryImage
            }
        });

        router.push("/cart");
    };

    const handleBid = async (bidAmount) => {
        if (!user) return alert("Zaloguj się, aby licytować!");
        if (bidAmount <= (game.auction?.current_bid || game.price_pln)) {
            alert("Twoja oferta musi być wyższa niż obecna cena!");
            return;
        }

        const gameDocRef = doc(db, "games", gameId);

        try {
            await runTransaction(db, async (transaction) => {
                const gameSnap = await transaction.get(gameDocRef);
                if (!gameSnap.exists()) throw "Gra nie istnieje!";

                const gameData = gameSnap.data();
                const currentPrice = gameData.auction?.current_bid || gameData.price_pln;

                if (bidAmount <= currentPrice) {
                    throw "Ktoś Cię ubiegł! Cena właśnie wzrosła. Spróbuj ponownie.";
                }

                transaction.update(gameDocRef, {
                    auction: {
                        current_bid: parseFloat(bidAmount),
                        highest_bidder_uid: user.uid,
                        highest_bidder_name: user.displayName || user.email,
                        last_bid_at: new Date()
                    }
                });
            });
            alert("Gratulacje! Prowadzisz w licytacji.");
        } catch (e) {
            alert(e);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Czy na pewno chcesz usunąć tę grę?")) return;

        try {
            if (game.images && game.images.length > 0) {
                const deletePromises = game.images
                    .filter(url => url.includes("firebasestorage.googleapis.com"))
                    .map(async (url) => {
                        try {
                            const imageRef = ref(storage, url);
                            await deleteObject(imageRef);
                        } catch (err) {
                            console.warn("Nie udało się usunąć zdjęcia:", url, err.code);
                        }
                    });

                await Promise.all(deletePromises);
            }

            await deleteDoc(doc(db, "games", gameId));
            alert("Gra i wszystkie zdjęcia zostały usunięte.");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Błąd podczas usuwania: " + error.message);
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
                    <div className="product-img-container">
                        <img
                            src={
                                game.images?.[activeImageIndex]?.startsWith('http')
                                ? game.images[activeImageIndex]
                                : `/${game.images?.[activeImageIndex] || 'img/placeholder.webp'}`
                            }
                            alt={game.title}
                            className={!game.isAvailable ? "grayscale-img" : ""} 
                            style={!game.isAvailable ? { filter: "grayscale(100%)", opacity: "0.6" } : {}}
                        />
                    </div>

                    {game.images && game.images.length > 1 && (
                        <div className="thumbnail-list">
                            {game.images.map((img, index) => (
                                <img
                                    key={index}
                                    src={img.startsWith('http') ? img : `/${img}`}
                                    className={`thumbnail-item ${activeImageIndex === index ? 'active' : ''}`}
                                    onClick={() => setActiveImageIndex(index)}
                                    alt={`Miniaturka ${index + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <div className="col-2">
                    <p><Link href="/">Home</Link> / {game.type}</p>
                    <h1>{game.title}</h1>
                    <h4>{game.price_pln} PLN</h4>

                    <div className="game-stats product-stats-container">
                        <p><strong>Status:</strong> {game.isAvailable ? "Dostępny" : "SPRZEDANE"}</p>
                        <p><strong>Gracze:</strong> {game.min_players} - {game.max_players}</p>
                        <p><strong>Czas gry:</strong> {game.avg_play_time_minutes} min</p>
                        <p><strong>Wydawca:</strong> {game.publisher}</p>
                    </div>

                    {!game.isAvailable ? (
                        <button className="btn disabled-btn" disabled>
                            Oferta wygasła
                        </button>
                    ) : (
                        <div className="flex-wrap-buttons">
                            <button className="btn" onClick={handlePurchaseFlow}>
                                <i className="fa-solid fa-basket-shopping icon-spacing"></i>
                                Kup Teraz (Dodaj do koszyka)
                            </button>
                        </div>
                    )}

                    {user && game.ownerId === user.uid && (
                        <div className="owner-actions-container">
                            <Link href={`/product/${game.id}/edit`} className="btn owner-btn-edit">Edytuj moją ofertę</Link>
                            <button onClick={handleDelete} className="btn owner-btn-delete">Usuń ofertę</button>
                        </div>
                    )}

                    <h3 className="product-description-title">Opis produktu</h3>
                    <br />
                    {game.description && game.description.map((line, index) => (
                        <p key={index} className="product-description-line">{line}</p>
                    ))}

                    {game.isAvailable && (
                        <div className="bid-section">
                            <h3>Licytacja</h3>
                            <p>Aktualna cena: <strong>{game.auction?.current_bid || game.price_pln} PLN</strong></p>
                            {game.auction?.highest_bidder_name && (
                                <p className="bid-leader-info">Prowadzi: {game.auction.highest_bidder_name}</p>
                            )}
                            <div className="bid-input-container">
                                <input 
                                    type="number" 
                                    id="bidInput" 
                                    placeholder="Twoja oferta" 
                                    className="search-input bid-input-field" 
                                />
                                <button 
                                    className="btn" 
                                    onClick={() => handleBid(document.getElementById('bidInput').value)}
                                >
                                    Podbij stawkę
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}