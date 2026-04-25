"use client";
import { use } from "react";
import { BOARD_GAMES } from "../../data";
import Link from "next/link";

export default function ProductPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const gameId = parseInt(params.id);

    const game = BOARD_GAMES.find((g) => g.id === gameId);

    if (!game) {
        return (
            <div className="small-container">
                <h2>No such game found</h2>
                <Link href="/" className="btn">Return home</Link>
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
                    />
                </div>
                <div className="col-2">
                    <p><Link href="/">Home</Link> / {game.type}</p>
                    <h1>{game.title}</h1>
                    <h4>{game.price_pln} PLN</h4>
                    
                    <div className="game-stats" style={{margin: '20px 0'}}>
                        <p><strong>Gracze:</strong> {game.min_players} - {game.max_players}</p>
                        <p><strong>Czas gry:</strong> {game.avg_play_time_minutes} min</p>
                        <p><strong>Wydawca:</strong> {game.publisher}</p>
                    </div>

                    <button className="btn">Dodaj do koszyka</button>
                    <h3>Opis produktu</h3>
                    <br />
                    {game.description.map((line, index) => (
                        <p key={index} style={{marginBottom: '10px'}}>{line}</p>
                    ))}
                </div>
            </div>
        </div>
    );
}