"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { db, storage } from "@/app/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const ALL_GENRES = ["ekonomiczna", "przygodowa", "abstrakcyjna", "rodzinna", "towarzyska", "kooperacyjna", "karciana", "zręcznościowa"];

export default function EditProductPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const gameId = params.id;
    const { user } = useAuth();

    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchGame = async () => {
            const docRef = doc(db, "games", gameId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const gameData = docSnap.data();
                setFormData({
                    ...gameData,
                    id: docSnap.id,
                    description: Array.isArray(gameData.description)
                        ? gameData.description.join("\n")
                        : (gameData.description || "")
                });
            } else {
                alert("Nie znaleziono gry w bazie!");
                router.push("/");
            }
            setLoading(false);
        };

        fetchGame();
    }, [gameId, router]);

    if (loading || !formData) return <div className="small-container">Ładowanie...</div>;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    const handleRemoveExistingImage = (indexToRemove) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, index) => index !== indexToRemove)
        });
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title?.trim()) {
            newErrors.title = "Tytuł jest wymagany.";
        }

        const price = parseFloat(formData.price_pln);
        if (isNaN(price) || price < 0) {
            newErrors.price_pln = "Podaj poprawną cenę (liczba >= 0).";
        }

        const minP = parseInt(formData.min_players);
        const maxP = parseInt(formData.max_players);
        if (isNaN(minP) || minP < 1) {
            newErrors.min_players = "Min. graczy musi być >= 1.";
        }
        if (isNaN(maxP) || maxP < minP) {
            newErrors.max_players = "Max. graczy musi być >= min. graczy.";
        }

        const time = parseInt(formData.avg_play_time_minutes);
        if (isNaN(time) || time <= 0) {
            newErrors.avg_play_time_minutes = "Czas gry musi być > 0 minut.";
        }

        return newErrors;
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (formData.ownerId !== user?.uid) {
            alert("Nie masz uprawnień do edycji tej gry!");
            return;
        }

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsUploading(true);
        try {
            let imageUrls = formData.images || [];

            if (files.length > 0) {
                const newUrls = await Promise.all(
                    files.map(async (file) => {
                        const storageRef = ref(storage, `games/${Date.now()}_${file.name}`);
                        const snapshot = await uploadBytes(storageRef, file);
                        return await getDownloadURL(snapshot.ref);
                    })
                );
                imageUrls = [...imageUrls, ...newUrls];
            }

            const docRef = doc(db, "games", gameId);
            await updateDoc(docRef, {
                title: formData.title.trim(),
                price_pln: parseFloat(formData.price_pln),
                type: formData.type,
                min_players: parseInt(formData.min_players),
                max_players: parseInt(formData.max_players),
                avg_play_time_minutes: parseInt(formData.avg_play_time_minutes),
                description: formData.description
                    ? formData.description.split("\n").filter(line => line.trim() !== "")
                    : [],
                is_expansion: formData.is_expansion,
                publisher: formData.publisher?.trim() || "",
                images: imageUrls
            });
            alert("Zmiany zapisane!");
            router.push(`/product/${gameId}`);
        } catch (error) {
            console.error("Błąd zapisu:", error);
            alert("Wystąpił błąd podczas zapisu.");
        } finally {
            setIsUploading(false);
        }
    };

    const inputStyle = (field) => ({
        width: '100%',
        borderColor: errors[field] ? '#e53e3e' : undefined
    });

    const ErrorMsg = ({ field }) => errors[field]
        ? <p style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>{errors[field]}</p>
        : null;

    return (
        <div className="small-container" style={{marginTop: '50px', marginBottom: '50px'}}>
            <h2 className="title">Edytuj grę: {formData.title}</h2>

            <form onSubmit={handleSave} className="edit-form">
                <div className="form-group">
                    <label>Tytuł gry: *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="search-input"
                        style={inputStyle('title')}
                    />
                    <ErrorMsg field="title" />
                </div>

                {formData.images && formData.images.length > 0 && (
                    <div className="form-group">
                        <label>Aktualne zdjęcia (kliknij ✕ aby usunąć):</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                            {formData.images.map((img, index) => (
                                <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                                    <img
                                        src={img.startsWith('http') ? img : `/${img}`}
                                        alt={`Zdjęcie ${index + 1}`}
                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveExistingImage(index)}
                                        style={{
                                            position: 'absolute', top: '-8px', right: '-8px',
                                            background: '#ff0000', color: '#fff',
                                            border: 'none', borderRadius: '50%',
                                            width: '22px', height: '22px',
                                            cursor: 'pointer', fontSize: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Dodaj nowe zdjęcia:</label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files))}
                        className="search-input"
                    />
                    {files.length > 0 && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Wybrano nowych plików: {files.length}
                        </p>
                    )}
                </div>

                <div className="row" style={{justifyContent: 'space-between', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Cena (PLN): *</label>
                        <input
                            type="number"
                            name="price_pln"
                            min="0"
                            step="0.01"
                            value={formData.price_pln}
                            onChange={handleChange}
                            className="search-input"
                            style={inputStyle('price_pln')}
                        />
                        <ErrorMsg field="price_pln" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Gatunek:</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="search-input" style={{width: '100%'}}>
                            {ALL_GENRES.map(genre => (
                                <option key={genre} value={genre}>{genre}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Wydawca:</label>
                    <input
                        type="text"
                        name="publisher"
                        value={formData.publisher || ""}
                        onChange={handleChange}
                        className="search-input"
                        style={{width: '100%'}}
                        placeholder="Nazwa wydawcy"
                    />
                </div>

                <div className="row" style={{justifyContent: 'space-between', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Min. graczy: *</label>
                        <input
                            type="number"
                            name="min_players"
                            min="1"
                            value={formData.min_players}
                            onChange={handleChange}
                            className="search-input"
                            style={inputStyle('min_players')}
                        />
                        <ErrorMsg field="min_players" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Max. graczy: *</label>
                        <input
                            type="number"
                            name="max_players"
                            min="1"
                            value={formData.max_players}
                            onChange={handleChange}
                            className="search-input"
                            style={inputStyle('max_players')}
                        />
                        <ErrorMsg field="max_players" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Czas (min): *</label>
                        <input
                            type="number"
                            name="avg_play_time_minutes"
                            min="1"
                            value={formData.avg_play_time_minutes}
                            onChange={handleChange}
                            className="search-input"
                            style={inputStyle('avg_play_time_minutes')}
                        />
                        <ErrorMsg field="avg_play_time_minutes" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Opis produktu:</label>
                    <textarea
                        name="description"
                        rows="6"
                        value={formData.description}
                        onChange={handleChange}
                        className="search-input"
                        style={{width: '100%', fontFamily: 'inherit'}}
                    ></textarea>
                </div>

                <div className="form-group checkbox-group">
                    <label>
                        <input type="checkbox" name="is_expansion" checked={formData.is_expansion} onChange={handleChange} />
                        To jest dodatek (Expansion)
                    </label>
                </div>

                <div style={{marginTop: '30px', display: 'flex', gap: '10px'}}>
                    <button type="submit" className="btn" disabled={isUploading}>
                        {isUploading ? "Zapisywanie..." : "Zapisz zmiany"}
                    </button>
                    <Link href={`/product/${gameId}`} className="btn" style={{background: '#555'}}>Anuluj</Link>
                </div>
            </form>
        </div>
    );
}