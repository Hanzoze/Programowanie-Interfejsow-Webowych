"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { db } from "@/app/lib/firebase";
import { collection, query, limit, startAfter, getDocs, where, orderBy } from "firebase/firestore";

const ALL_GENRES = ["ekonomiczna", "przygodowa", "abstrakcyjna", "rodzinna", "towarzyska", "kooperacyjna", "karciana", "zręcznościowa"];
const PAGE_LIMIT = 6;

export default function Home() {
    const [lastDoc, setLastDoc] = useState(null);
    const [boardGames, setBoardGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [playerCount, setPlayerCount] = useState("all");
    const [isExpansion, setIsExpansion] = useState("all");
    const [maxPrice, setMaxPrice] = useState(1000);

    const buildQuery = useCallback((lastVisible = null) => {
        const constraints = [collection(db, "games")];

        if (category !== "all") {
            constraints.push(where("type", "==", category));
        } else if (isExpansion !== "all") {
            constraints.push(where("is_expansion", "==", isExpansion === "expansion"));
        } else {
            constraints.push(orderBy("createdAt", "desc"));
        }

        if (lastVisible) {
            constraints.push(startAfter(lastVisible));
        }

        constraints.push(limit(PAGE_LIMIT));
        return query(...constraints);
    }, [category, isExpansion]);

    useEffect(() => {
        const fetchInitial = async () => {
            setLoading(true);
            setBoardGames([]);
            setLastDoc(null);
            setHasMore(true);

            try {
                const q = buildQuery();
                const snapshot = await getDocs(q);
                const games = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

                setBoardGames(games);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
                setHasMore(snapshot.docs.length === PAGE_LIMIT);
            } catch (error) {
                console.error("Błąd pobierania:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitial();
    }, [buildQuery]);

    const fetchMoreGames = async () => {
        if (!lastDoc || loadingMore || !hasMore) return;
        setLoadingMore(true);

        try {
            const q = buildQuery(lastDoc);
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setHasMore(false);
            } else {
                const newGames = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setBoardGames(prev => [...prev, ...newGames]);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === PAGE_LIMIT);
            }
        } catch (error) {
            console.error("Błąd doczytywania:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredItems = boardGames.filter(game => {
        const matchesSearch = (game.title || "").toLowerCase().includes(search.toLowerCase());
        const matchesPrice = game.price_pln <= Number(maxPrice);
        const matchesPlayers = playerCount === "all" || (
            Number(playerCount) >= game.min_players &&
            Number(playerCount) <= game.max_players
        );
        const matchesExpansion = isExpansion === "all" || (
            isExpansion === "expansion" ? game.is_expansion === true : game.is_expansion === false
        );
        return matchesSearch && matchesPrice && matchesPlayers && matchesExpansion;
    });

    return (
        <main className="small-container">
            <div className="main-layout">
                <aside className="sidebar">
                    <h3>Filtry</h3>

                    <div className="filter-group">
                        <h4>Gatunek</h4>
                        <label className="radio-container">
                            <input type="radio" name="genre" checked={category === "all"} onChange={() => setCategory("all")} />
                            <span className="checkmark"></span> Wszystkie
                        </label>
                        {ALL_GENRES.map(gen => (
                            <label key={gen} className="radio-container">
                                <input type="radio" name="genre" checked={category === gen} onChange={() => setCategory(gen)} />
                                <span className="checkmark"></span> {gen}
                            </label>
                        ))}
                    </div>

                    <div className="filter-group">
                        <h4>Typ produktu</h4>
                        <select className="search-input" style={{width: '100%'}} value={isExpansion} onChange={(e) => setIsExpansion(e.target.value)}>
                            <option value="all">Wszystko</option>
                            <option value="base">Gry podstawowe</option>
                            <option value="expansion">Dodatki</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <h4>Liczba graczy</h4>
                        <select className="search-input" style={{width: '100%'}} value={playerCount} onChange={(e) => setPlayerCount(e.target.value)}>
                            <option value="all">Dowolna</option>
                            <option value="1">1 gracz</option>
                            <option value="2">2 graczy</option>
                            <option value="3">3 graczy</option>
                            <option value="4">4+ graczy</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <h4>Cena do: {maxPrice} PLN</h4>
                        <input type="range" min="0" max="1000" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{width: '100%'}} />
                    </div>
                </aside>

                <section style={{ flex: '3' }}>
                    <input
                        type="text"
                        placeholder="Szukaj gry po tytule..."
                        className="search-input"
                        style={{width: '100%', marginBottom: '20px'}}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {loading ? (
                        <p>Ładowanie gier...</p>
                    ) : filteredItems.length === 0 ? (
                        <p style={{color: '#888', marginTop: '20px'}}>Brak gier spełniających kryteria.</p>
                    ) : (
                        <div className="row">
                            {filteredItems.map(game => (
                                <div key={game.id} className="col-4">
                                    <Link href={`/product/${game.id}`}>
                                        <div className="card">
                                            <img
                                                src={game.images?.[0]?.startsWith('http') ? game.images[0] : `/${game.images?.[0] || 'img/placeholder.webp'}`}
                                                alt={game.title}
                                                style={{ objectFit: 'cover', height: '200px', width: '100%' }}
                                            />
                                            <h4>{game.title}</h4>
                                            <p className="price">{game.price_pln} PLN</p>
                                            <small>{game.min_players}-{game.max_players} os. | {game.is_expansion ? "Dodatek" : "Gra"}</small>
                                            {!game.isAvailable && <p style={{color: 'red', fontWeight: 'bold'}}>SPRZEDANE</p>}
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasMore && !loading && (
                        <div style={{textAlign: 'center', marginTop: '30px'}}>
                            <button className="btn" onClick={fetchMoreGames} disabled={loadingMore}>
                                {loadingMore ? "Ładowanie..." : "Pokaż więcej"}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}