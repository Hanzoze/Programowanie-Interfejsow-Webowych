"use client";
import { use, useState, useEffect } from "react";
import { BOARD_GAMES } from "../../../data";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditProductPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const gameId = parseInt(params.id);

    const [formData, setFormData] = useState(null);

    const allGenres = [...new Set(BOARD_GAMES.map(g => g.type).filter(Boolean))];

    useEffect(() => {
        const game = BOARD_GAMES.find((g) => g.id === gameId);
        if (game) {
            setFormData({
                ...game,
                description: game.description.join("\n")
            });
        }
    }, [gameId]);

    if (!formData) return <div className="small-container">Ładowanie...</div>;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSave = (e) => {
        e.preventDefault();
        const updatedGame = {
            ...formData,
            description: formData.description.split("\n").filter(line => line.trim() !== ""),
            price_pln: parseFloat(formData.price_pln),
            min_players: parseInt(formData.min_players),
            max_players: parseInt(formData.max_players),
            avg_play_time_minutes: parseInt(formData.avg_play_time_minutes)
        };

        console.log("Zapisano zmiany:", updatedGame);
        alert("Zmiany zostały zapisane (symulacja).");
        router.push(`/product/${gameId}`);
    };

    return (
        <div className="small-container" style={{marginTop: '50px', marginBottom: '50px'}}>
            <h2 className="title">Edytuj grę: {formData.title}</h2>
            
            <form onSubmit={handleSave} className="edit-form">
                <div className="form-group">
                    <label>Tytuł gry:</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="search-input" />
                </div>

                <div className="row" style={{justifyContent: 'space-between', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Cena (PLN):</label>
                        <input type="number" name="price_pln" value={formData.price_pln} onChange={handleChange} className="search-input" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Gatunek:</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="search-input" style={{width: '100%'}}>
                            {allGenres.map(genre => (
                                <option key={genre} value={genre}>{genre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="row" style={{justifyContent: 'space-between', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Min. graczy:</label>
                        <input type="number" name="min_players" value={formData.min_players} onChange={handleChange} className="search-input" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Max. graczy:</label>
                        <input type="number" name="max_players" value={formData.max_players} onChange={handleChange} className="search-input" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Czas (min):</label>
                        <input type="number" name="avg_play_time_minutes" value={formData.avg_play_time_minutes} onChange={handleChange} className="search-input" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Opis produktu:</label>
                    <textarea name="description" rows="6" value={formData.description} onChange={handleChange} className="search-input" style={{width: '100%', fontFamily: 'inherit'}}></textarea>
                </div>

                <div className="form-group checkbox-group">
                    <label>
                        <input type="checkbox" name="is_expansion" checked={formData.is_expansion} onChange={handleChange} />
                        To jest dodatek (Expansion)
                    </label>
                </div>

                <div style={{marginTop: '30px', display: 'flex', gap: '10px'}}>
                    <button type="submit" className="btn">Zapisz zmiany</button>
                    <Link href={`/product/${gameId}`} className="btn" style={{background: '#555'}}>Anuluj</Link>
                </div>
            </form>
        </div>
    );
}