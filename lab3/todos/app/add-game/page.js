"use client";
import { useState } from "react";
import { db, storage } from "@/app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AddGamePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        title: "",
        price_pln: "",
        type: "ekonomiczna",
        min_players: 1,
        max_players: 4,
        avg_play_time_minutes: 60,
        description: "",
        is_expansion: false,
        publisher: "",
    });

    const allGenres = ["ekonomiczna", "przygodowa", "abstrakcyjna", "rodzinna", "towarzyska", "kooperacyjna", "karciana", "zręcznościowa"];

    if (!user) return <div className="small-container"><h2>Zaloguj się!</h2></div>;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Tytuł jest wymagany.";
        }

        const price = parseFloat(formData.price_pln);
        if (formData.price_pln === "" || isNaN(price) || price < 0) {
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

        if (!formData.publisher.trim()) {
            newErrors.publisher = "Podaj nazwę wydawcy.";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isUploading) return;

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsUploading(true);
        try {
            const imageUrls = await Promise.all(
                files.map(async (file) => {
                    const storageRef = ref(storage, `games/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return await getDownloadURL(snapshot.ref);
                })
            );

            await addDoc(collection(db, "games"), {
                title: formData.title.trim(),
                price_pln: parseFloat(formData.price_pln),
                type: formData.type,
                min_players: parseInt(formData.min_players),
                max_players: parseInt(formData.max_players),
                avg_play_time_minutes: parseInt(formData.avg_play_time_minutes),
                description: formData.description
                    ? formData.description.split("\n").filter(l => l.trim() !== "")
                    : [],
                is_expansion: formData.is_expansion,
                publisher: formData.publisher.trim(),
                images: imageUrls,
                isAvailable: true,
                ownerId: user.uid,
                createdAt: new Date()
            });

            alert("Dodano grę!");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Błąd: " + error.message);
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
            <h2 className="title">Wystaw nową grę</h2>
            <form onSubmit={handleSubmit} className="edit-form">

                <div className="form-group">
                    <label>Tytuł gry: *</label>
                    <input
                        type="text"
                        name="title"
                        onChange={handleChange}
                        className="search-input"
                        style={inputStyle('title')}
                    />
                    <ErrorMsg field="title" />
                </div>

                <div className="form-group">
                    <label>Zdjęcia gry (możesz wybrać kilka):</label>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} className="search-input" />
                    <p style={{fontSize: '12px', color: '#666'}}>Wybrano plików: {files.length}</p>
                </div>

                <div className="row" style={{justifyContent: 'space-between', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Cena (PLN): *</label>
                        <input
                            type="number"
                            name="price_pln"
                            min="0"
                            step="0.01"
                            onChange={handleChange}
                            className="search-input"
                            style={inputStyle('price_pln')}
                        />
                        <ErrorMsg field="price_pln" />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Czas gry (min): *</label>
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

                <div className="row" style={{justifyContent: 'space-between', gap: '10px'}}>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Gatunek:</label>
                        <select name="type" onChange={handleChange} className="search-input" style={{width: '100%'}}>
                            {allGenres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                        <label>Wydawca: *</label>
                        <input
                            type="text"
                            name="publisher"
                            onChange={handleChange}
                            className="search-input"
                            style={inputStyle('publisher')}
                        />
                        <ErrorMsg field="publisher" />
                    </div>
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
                </div>

                <div className="form-group">
                    <label>Opis (każda linia to nowy akapit):</label>
                    <textarea
                        name="description"
                        rows="5"
                        onChange={handleChange}
                        className="search-input"
                        style={{width: '100%'}}
                    ></textarea>
                </div>

                <div className="form-group checkbox-group">
                    <label>
                        <input type="checkbox" name="is_expansion" checked={formData.is_expansion} onChange={handleChange} />
                        To jest dodatek (Expansion)
                    </label>
                </div>

                <button type="submit" disabled={isUploading} className="btn">
                    {isUploading ? "Wgrywanie..." : "Wystaw grę"}
                </button>
            </form>
        </div>
    );
}