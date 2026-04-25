"use client";
import { useState } from 'react';
import Link from 'next/link';
import { BOARD_GAMES } from './data';

export default function Home() {
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [playerCount, setPlayerCount] = useState("all"); 
    const [isExpansion, setIsExpansion] = useState("all"); 
    const [maxPrice, setMaxPrice] = useState(500);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    const genres = ["all", ...new Set(BOARD_GAMES.map(g => g.type).filter(Boolean))];

    const filtered = BOARD_GAMES.filter(game => {
      const matchesSearch = (game.title || "").toLowerCase().includes(search.toLowerCase());
      const matchesGenre = category === "all" || game.type === category;
      const matchesPrice = game.price_pln <= Number(maxPrice);
      
      const matchesPlayers = playerCount === "all" || (
          Number(playerCount) >= game.min_players && 
          Number(playerCount) <= game.max_players
      );
      
      const matchesType = isExpansion === "all" || (
          isExpansion === "expansion" ? game.is_expansion === true : game.is_expansion === false
      );

      return matchesSearch && matchesGenre && matchesPrice && matchesPlayers && matchesType;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <main className="small-container">
            <div className="main-layout">
                <aside className="sidebar">
                    <h3>Filtry</h3>
                    
                    <div className="filter-group">
                        <h4>Gatunek</h4>
                        {genres.map(gen => (
                            <label key={gen} className="radio-container">
                                <input type="radio" name="genre" checked={category === gen} onChange={() => { setCategory(gen); setCurrentPage(1); }} />
                                <span className="checkmark"></span>
                                {gen === 'all' ? 'Wszystkie' : gen}
                            </label>
                        ))}
                    </div>

                    <div className="filter-group">
                        <h4>Typ produktu</h4>
                        <label className="radio-container">
                            <input type="radio" name="type" checked={isExpansion === "all"} onChange={() => {setIsExpansion("all"); setCurrentPage(1)}} />
                            <span className="checkmark"></span> Wszystko
                        </label>
                        <label className="radio-container">
                            <input type="radio" name="type" checked={isExpansion === "base"} onChange={() => {setIsExpansion("base"); setCurrentPage(1)}} />
                            <span className="checkmark"></span> Gry podstawowe
                        </label>
                        <label className="radio-container">
                            <input type="radio" name="type" checked={isExpansion === "expansion"} onChange={() => {setIsExpansion("expansion"); setCurrentPage(1)}} />
                            <span className="checkmark"></span> Dodatki
                        </label>
                    </div>

                    <div className="filter-group">
                        <h4>Liczba graczy</h4>
                        <select className="search-input" style={{width: '100%'}} onChange={(e) => {setPlayerCount(e.target.value); setCurrentPage(1)}}>
                            <option value="all">Dowolna</option>
                            <option value="1">1 gracz</option>
                            <option value="2">2 graczy</option>
                            <option value="3">3 graczy</option>
                            <option value="4">4+ graczy</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <h4>Cena do: {maxPrice} PLN</h4>
                        <input type="range" min="0" max="500" value={maxPrice} onChange={(e) => {setMaxPrice(e.target.value); setCurrentPage(1)}} style={{width: '100%'}} />
                    </div>
                </aside>

                <section style={{ flex: '3' }}>
                    <input 
                        type="text" 
                        placeholder="Szukaj..." 
                        className="search-input" 
                        style={{width: '100%', marginBottom: '20px'}}
                        onChange={(e) => {setSearch(e.target.value); setCurrentPage(1)}}/>
                    
                    <div className="row">
                        {currentItems.map(game => (
                            <div key={game.id} className="col-4">
                                <Link href={`/product/${game.id}`}>
                                    <div className="card">
                                        <img src={game.images[0] ? `/${game.images[0]}` : "/img/placeholder.webp"} alt={game.title} />
                                        <h4>{game.title}</h4>
                                        <p className="price">{game.price_pln} PLN</p>
                                        <small>{game.min_players}-{game.max_players} os. | {game.is_expansion ? "Dodatek" : "Gra"}</small>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button 
                                onClick={() => goToPage(currentPage - 1)} 
                                disabled={currentPage === 1}
                                className="page-btn">
                                &#8592;
                            </button>

                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index + 1}
                                    onClick={() => goToPage(index + 1)}
                                    className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                                >
                                    {index + 1}
                                </button>
                            ))}

                            <button 
                                onClick={() => goToPage(currentPage + 1)} 
                                disabled={currentPage === totalPages}
                                className="page-btn"
                            >
                                &#8594;
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}