import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import barbaroLogo from '@/assets/barbaro-logo.png';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img src={barbaroLogo} alt="Barbaro Nutrition" className="h-12 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Suplementos deportivos premium para potenciar tu rendimiento y alcanzar tus objetivos fitness.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wide text-sm">Tienda</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/shop?category=proteinas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Proteínas
                </Link>
              </li>
              <li>
                <Link to="/shop?category=creatina" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Creatina
                </Link>
              </li>
              <li>
                <Link to="/shop?category=pre-entrenos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pre-Entrenos
                </Link>
              </li>
              <li>
                <Link to="/shop?category=vitaminas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Vitaminas
                </Link>
              </li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wide text-sm">Empresa</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wide text-sm">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Santo Domingo, República Dominicana</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:info@barbaronutrition.com" className="hover:text-foreground transition-colors">
                  info@barbaronutrition.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+18095551234" className="hover:text-foreground transition-colors">
                  +1 (809) 555-1234
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Barbaro Nutrition. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
