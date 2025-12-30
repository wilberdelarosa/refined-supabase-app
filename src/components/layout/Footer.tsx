import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="font-display text-2xl font-bold">
              TRIBE
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Productos únicos para personas únicas. Descubre nuestra colección curada.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-semibold mb-4">Tienda</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link to="/shop?category=featured" className="text-muted-foreground hover:text-foreground transition-colors">
                  Destacados
                </Link>
              </li>
              <li>
                <Link to="/shop?category=new" className="text-muted-foreground hover:text-foreground transition-colors">
                  Nuevos
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold mb-4">Ayuda</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Envíos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Devoluciones
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 TRIBE. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Hecho con ♥ para ti</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
