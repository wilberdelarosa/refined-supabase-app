import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Truck, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: Shield, label: '100% Originales', desc: 'Productos certificados' },
  { icon: Truck, label: 'Envío Gratis', desc: 'En pedidos +$3,000' },
  { icon: Award, label: 'Garantía', desc: 'Satisfacción total' },
];

export function Newsletter() {
  return (
    <section className="py-20 md:py-28 bg-foreground text-background relative overflow-hidden">
      {/* Abstract background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-background blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-background blur-3xl" />
      </div>

      <div className="container relative z-10">
        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mb-20">
          {features.map((f, idx) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-background/10 mb-4">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-sm md:text-base mb-1">{f.label}</h3>
              <p className="text-xs md:text-sm text-background/50">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-background/40 mb-6">
            Únete a la tribu
          </span>
          <h2 className="text-3xl md:text-6xl font-black mb-6 leading-[0.9]">
            ¿Listo para tu
            <br />
            <span className="text-background/40">transformación?</span>
          </h2>
          <p className="text-lg md:text-xl text-background/60 mb-10 max-w-xl mx-auto leading-relaxed font-medium">
            Descubre nuestra selección premium de suplementos y comienza hoy mismo.
          </p>
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-background/90 font-bold uppercase tracking-wide shadow-2xl px-10 py-7 text-base rounded-full group"
            asChild
          >
            <Link to="/shop">
              Explorar Productos
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
