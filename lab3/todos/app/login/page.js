"use client";

import { useState } from "react";
import { auth } from "@/app/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error) {
      alert("Błąd Google: " + error.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!isLogin && password !== confirmPassword) {
      alert("Hasła nie są identyczne!");
      return;
    }
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (error) {
      alert("Błąd: " + error.message);
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="row">
          <div className="col-2">
            <div className="form-container" style={{ height: isLogin ? "400px" : "480px" }}>
              <div className="form-btn">
                <span 
                  className={isLogin ? "active" : ""} 
                  onClick={() => setIsLogin(true)}
                >
                  Logowanie
                </span>
                <span 
                  className={!isLogin ? "active" : ""} 
                  onClick={() => setIsLogin(false)}
                >
                  Rejestracja
                </span>
              </div>

              <form onSubmit={handleAuth} className="auth-form">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="search-input" 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
                <input 
                  type="password" 
                  placeholder="Hasło" 
                  className="search-input" 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
                
                {!isLogin && (
                  <input 
                    type="password" 
                    placeholder="Powtórz hasło" 
                    className="search-input" 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required
                  />
                )}

                <button type="submit" className="page-btn active btn-submit">
                  {isLogin ? "Zaloguj się" : "Zarejestruj się"}
                </button>
              </form>

              <div className="social-login">
                <p>LUB</p>
                <button onClick={handleGoogleLogin} className="page-btn google-btn">
                  <i className="fa-brands fa-google" style={{ color: '#db4437' }}></i> Zaloguj przez Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}