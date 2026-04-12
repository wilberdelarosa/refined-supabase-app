

## Plan: Mejoras de Testimonios, About, Responsive y Whop Checkout

### Problemas identificados

1. **Testimonios**: El componente actual es funcional pero básico. Se rediseñará con un estilo más premium.
2. **Botón roto en About**: El botón "Contáctanos" apunta a `/contact` que no existe. También en el Footer.
3. **Avatar no se actualiza en tiempo real**: El Navbar ya escucha cambios de `profiles` vía realtime channel -- esto debería funcionar. Verificaré que el `ProfileEdit` haga un update correcto que dispare el evento.
4. **Whop guest checkout**: Ya está implementado con `WhopCheckoutEmbed` y `skipRedirect` + `hideAddressForm`. El usuario no necesita cuenta Whop. Solo falta asegurar que los textos no mencionen "Whop" de forma confusa y que el flujo sea claro.
5. **Responsive**: Revisar y mejorar el checkout y testimonios en móvil.

### Cambios planificados

#### 1. Rediseño del componente Testimonials
- Nuevo diseño con tarjetas más grandes, fotos de avatar más prominentes
- Mejor tipografía y espaciado
- Animación más suave y profesional
- Diseño responsive mejorado (1 columna en móvil, 2 en tablet, 3 en desktop)

#### 2. Fix del botón "Contáctanos" en About y Footer
- Cambiar `Link to="/contact"` por `Link to="/about"` o un enlace a WhatsApp/email directo, ya que no existe la ruta `/contact`
- Opción: redirigir al footer de la misma página About donde están los datos de contacto

#### 3. Mejoras de UX en el checkout Whop
- Renombrar "Tarjeta con Whop" a simplemente "Pagar con Tarjeta" para que el cliente no vea branding de Whop
- Eliminar texto técnico como "webhook" del mensaje informativo
- Simplificar los mensajes al usuario final
- Asegurar que el embed se muestra correctamente en móvil

#### 4. Responsive general
- Verificar que el checkout, testimonios y About se vean bien en móvil (375px-414px)
- Ajustar paddings y tamaños de fuente para pantallas pequeñas

### Archivos a modificar
- `src/components/home/Testimonials.tsx` -- rediseño completo
- `src/pages/About.tsx` -- fix botón Contáctanos
- `src/components/layout/Footer.tsx` -- fix link Contacto
- `src/pages/TransferCheckout.tsx` -- mejorar UX labels de Whop y responsive

