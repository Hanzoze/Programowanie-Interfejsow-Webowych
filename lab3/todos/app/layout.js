import "./globals.css";
import Link from 'next/link';

export const metadata = {
  title: "Warscythe 50k",
  description: "Najlepsze gry planszowe",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Fjalla+One&family=Roboto+Condensed:wght@300;400;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" />
      </head>
      <body>
        <div className="header">
          <div className="container">
            <div className="navbar">
              <div className="logo">
                <Link href="/"><img src="/img/logo.png" width="125px" alt="logo" /></Link>
              </div>
              <nav>
                <ul id="MenuItems">
                  <li><Link href="/">Home</Link></li>
                  <li><Link href="/#products">Products</Link></li>
                  <li><Link href="/login" id="AuthLink">Login</Link></li>
                </ul>
              </nav>
              <Link href="/cart">
                <img src="/img/cart.png" width="30px" height="30px" alt="cart" />
              </Link>
            </div>
          </div>
        </div>

        {children}

        <div className="footer">
          <div className="container">
            <div className="row">
              <div className="footer-col-1">
                <h3>Download our app</h3>
                <p>Download our app for Android and iOS</p>
                <div className="app-logo">
                  <img src="/img/play-store.png" alt="play store" />
                  <img src="/img/app-store.png" alt="app store" />
                </div>
              </div>
              <div className="footer-col-2">
                <img src="/img/logo.png" alt="logo footer" />
                <p>Our purpose is to spread joy and laughter across the globe</p>
              </div>
              <div className="footer-col-3">
                <h3>Useful Links</h3>
                <ul>
                  <li>Coupons</li>
                  <li>Blog Post</li>
                  <li>Return Policy</li>
                  <li>Join Affiliate</li>
                </ul>
              </div>
              <div className="footer-col-4">
                <h3>Follow us</h3>
                <ul>
                  <li>Facebook</li>
                  <li>Twitter</li>
                  <li>Instagram</li>
                  <li>YouTube</li>
                </ul>
              </div>
            </div>
            <hr />
            <p className="copyright">For study purposes only</p>
          </div>
        </div>
      </body>
    </html>
  );
}