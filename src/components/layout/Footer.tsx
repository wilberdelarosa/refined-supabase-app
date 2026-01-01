import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import barbaroLogo from '@/assets/barbaro-logo.png';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg width="100%" height="100%">
          <pattern id="footer-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      <div className="container py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4 hover-lift">
              <img src={barbaroLogo} alt="Barbaro Nutrition" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Suplementos deportivos premium para potenciar tu rendimiento y alcanzar tus objetivos fitness.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide text-sm">Tienda</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop?category=proteinas" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Proteínas
                </Link>
              </li>
              <li>
                <Link to="/shop?category=creatina" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Creatina
                </Link>
              </li>
              <li>
                <Link to="/shop?category=pre-entrenos" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Pre-Entrenos
                </Link>
              </li>
              <li>
                <Link to="/shop?category=vitaminas" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Vitaminas
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide text-sm">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium inline-flex items-center group">
                  <span className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all">→</span>
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-bold mb-4 uppercase tracking-wide text-sm">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground group">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                <span className="font-medium">Santo Domingo, República Dominicana</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground group">
                <Mail className="h-5 w-5 flex-shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                <a href="mailto:info@barbaronutrition.com" className="hover:text-foreground transition-colors font-medium">
                  info@barbaronutrition.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground group">
                <Phone className="h-5 w-5 flex-shrink-0 text-muted-foreground/70 group-hover:text-foreground transition-colors" />
                <a href="tel:+18095551234" className="hover:text-foreground transition-colors font-medium">
                  +1 (809) 555-1234
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            © {new Date().getFullYear()} Barbaro Nutrition. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
