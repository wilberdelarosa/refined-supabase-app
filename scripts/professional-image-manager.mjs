import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase credentials
const supabaseUrl = 'https://xuhvlomytegdbifziilf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1aHZsb215dGVnZGJpZnppaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjk5NDQsImV4cCI6MjA4MjcwNTk0NH0.5nHV3dmXMV6IS9ZcXRd_VUX5R9sLJW8fuXxc0pgPiF4';

const supabase = createClient(supabaseUrl, supabaseKey);

class ProfessionalImageManager {
  constructor() {
    this.imagesDir = path.join(__dirname, '..', 'public', 'products');
    this.templatesDir = path.join(__dirname, '..', 'image-templates');
    this.setupDirectories();
  }

  setupDirectories() {
    // Crear directorios si no existen
    [this.imagesDir, this.templatesDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      }
    });
  }

  generateImageTemplate(category, productName, productId) {
    const specs = this.getCategorySpecs(category);
    const filename = this.generateFilename(productName);
    
    return {
      productId,
      filename,
      localPath: path.join(this.imagesDir, filename),
      uploadPath: filename,
      specifications: {
        ...specs,
        dimensions: '800x800px',
        format: 'WebP (preferred) or PNG',
        quality: '85% compression for WebP, lossless for PNG',
        fileSize: 'Max 200KB for optimal loading'
      },
      shootingGuide: this.generateShootingGuide(category, productName),
      postProcessing: this.generatePostProcessingSteps()
    };
  }

  getCategorySpecs(category) {
    const specs = {
      'Proteínas': {
        background: 'Pure white (RGB: 255,255,255)',
        lighting: 'Soft box lighting from 45° angles',
        angle: '30° rotation showing front and side panel',
        props: 'Protein shake or powder scoop (optional)',
        focus: 'Brand label and nutritional info clearly visible',
        shadows: 'Soft drop shadow 15px blur, 30% opacity'
      },
      'Creatinas': {
        background: 'Clean white with subtle gradient',
        lighting: 'Even diffused lighting to avoid reflection',
        angle: 'Straight front view or slight 15° tilt',
        props: 'Measuring scoop if powder form',
        focus: 'Product name and serving size prominent',
        shadows: 'Minimal shadow, clinical look'
      },
      'Pre-Entrenos': {
        background: 'Dynamic white with energy burst elements',
        lighting: 'High-contrast lighting for energy feel',
        angle: '45° dynamic angle suggesting motion',
        props: 'Shaker bottle or gym equipment (subtle)',
        focus: 'Bold branding and "energy" messaging',
        shadows: 'Strong directional shadow for impact'
      },
      'Vitaminas': {
        background: 'Medical-grade clean white',
        lighting: 'Uniform lighting, no harsh shadows',
        angle: 'Professional straight-on or slight angle',
        props: '3-4 pills artistically spilled',
        focus: 'Health claims and dosage information',
        shadows: 'Very light shadow for depth only'
      },
      'Accesorios': {
        background: 'White with lifestyle context hints',
        lighting: 'Natural-looking studio lighting',
        angle: 'Usage-focused angle showing functionality',
        props: 'Related gym/fitness equipment',
        focus: 'Product in use or ready-to-use state',
        shadows: 'Natural shadows that enhance usability'
      }
    };

    return specs[category] || specs['Accesorios'];
  }

  generateShootingGuide(category, productName) {
    const baseGuide = [
      '📋 PREPARACIÓN:',
      '• Limpia el producto completamente',
      '• Verifica que etiquetas estén perfectas',
      '• Configura fondo blanco de papel/tela',
      '• Prepara iluminación de 2-3 puntos',
      '',
      '📸 CONFIGURACIÓN DE CÁMARA:',
      '• Modo manual (M)',
      '• ISO: 100-200 para mínimo ruido',
      '• Apertura: f/8-f/11 para nitidez total',
      '• Velocidad: 1/60s o más rápida', 
      '• Formato: RAW + JPEG',
      '',
      '🎯 COMPOSICIÓN:',
      '• Centrar producto en frame',
      '• Dejar 15% de margen alrededor',
      '• Verificar que texto sea legible',
      '• Tomar múltiples ángulos',
      ''
    ];

    const categorySpecific = this.getCategorySpecs(category);
    const specificGuide = [
      '🎨 ESPECÍFICO PARA ESTA CATEGORÍA:',
      `• Fondo: ${categorySpecific.background}`,
      `• Iluminación: ${categorySpecific.lighting}`,
      `• Ángulo: ${categorySpecific.angle}`,
      `• Props: ${categorySpecific.props}`,
      `• Enfoque: ${categorySpecific.focus}`,
      ''
    ];

    return [...baseGuide, ...specificGuide];
  }

  generatePostProcessingSteps() {
    return [
      '🎨 POST-PROCESAMIENTO:',
      '',
      '1. AJUSTES BÁSICOS:',
      '   • Exposición: Balancear para fondo blanco puro',
      '   • Contraste: +15 a +25 para definición',
      '   • Sombras: +20 para revelar detalles',
      '   • Blancos: +10 para fondo limpio',
      '',
      '2. COLOR Y SATURACIÓN:',
      '   • Vibrance: +10 para colores naturales',
      '   • Saturación: +5 para etiquetas vibrantes',
      '   • Balance de blancos: Temperatura neutra',
      '',
      '3. NITIDEZ Y DETALLES:',
      '   • Clarity: +15 para definición de texto',
      '   • Texture: +10 para detalles del packaging',
      '   • Masking de enfoque para etiquetas',
      '',
      '4. LIMPIEZA:',
      '   • Remover polvo y imperfecciones',
      '   • Corregir distorsiones de perspectiva',
      '   • Crop a proporción exacta 1:1',
      '',
      '5. EXPORTACIÓN:',
      '   • Formato: WebP calidad 85%',
      '   • Tamaño: 800x800px',
      '   • Backup: PNG lossless',
      '   • Verificar peso < 200KB'
    ];
  }

  generateFilename(productName) {
    const clean = productName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s-]/g, '')        // Solo letras, números, espacios, guiones
      .replace(/\s+/g, '-')            // Espacios a guiones
      .replace(/-+/g, '-')             // Múltiples guiones a uno
      .substring(0, 50)                // Máximo 50 caracteres
      .replace(/^-|-$/g, '');          // Remover guiones al inicio/final
    
    // Agregar timestamp para unicidad
    const timestamp = Date.now().toString().slice(-6);
    return `${clean}-${timestamp}.webp`;
  }

  async uploadToStorage(localPath, uploadPath) {
    try {
      const fileBuffer = fs.readFileSync(localPath);
      
      const { data, error } = await supabase.storage
        .from('products')
        .upload(uploadPath, fileBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000' // 1 año de cache
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(uploadPath);

      return publicUrl;
    } catch (error) {
      throw new Error(`Error uploading ${uploadPath}: ${error.message}`);
    }
  }

  async updateProductImageUrl(productId, imageUrl) {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (error) {
      throw new Error(`Error updating product ${productId}: ${error.message}`);
    }
  }

  async batchGenerateTemplates(products = null) {
    console.log('📋 GENERANDO TEMPLATES PARA FOTOGRAFÍA PROFESIONAL\n');

    // Autenticar
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'wilber.alitoeirl@gmail.com',
      password: '123456'
    });

    if (authError) {
      throw new Error(`Error de autenticación: ${authError.message}`);
    }

    // Obtener productos si no se proporcionan
    if (!products) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category, image_url')
        .or('image_url.is.null,image_url.eq.,image_url.like.*amazon*,image_url.like.*walmart*');

      if (error) throw new Error(`Error obteniendo productos: ${error.message}`);
      products = data || [];
    }

    console.log(`📦 Generando templates para ${products.length} productos\n`);

    const templates = [];
    const summaryByCategory = {};

    products.forEach(product => {
      const template = this.generateImageTemplate(product.category, product.name, product.id);
      templates.push(template);

      // Agrupar por categoría para resumen
      if (!summaryByCategory[product.category]) {
        summaryByCategory[product.category] = [];
      }
      summaryByCategory[product.category].push(product.name);
    });

    // Generar archivos de template
    const templatesPath = path.join(this.templatesDir, `photo-templates-${Date.now()}.json`);
    fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));

    // Generar guía de fotografía
    await this.generatePhotoGuide(summaryByCategory, templates);

    console.log(`✅ Templates generados: ${templatesPath}`);
    console.log('📋 Resumen por categoría:');
    Object.entries(summaryByCategory).forEach(([category, productNames]) => {
      console.log(`   ${category}: ${productNames.length} productos`);
    });

    return { templates, summaryByCategory };
  }

  async generatePhotoGuide(summaryByCategory, templates) {
    const guideContent = [
      '# 📸 GUÍA DE FOTOGRAFÍA PROFESIONAL - BARBARO NUTRITION',
      '',
      '## 🎯 Objetivo',
      'Crear imágenes profesionales tipo tienda con fondo blanco para productos de suplementos.',
      '',
      '## 📋 Estándares Generales',
      '- **Tamaño:** 800x800px',
      '- **Formato:** WebP (preferido) o PNG',
      '- **Fondo:** Blanco puro (RGB: 255,255,255)',
      '- **Calidad:** 85% compresión WebP, lossless PNG',
      '- **Peso máximo:** 200KB',
      '',
      '## 🏷️ Especificaciones por Categoría',
      ''
    ];

    // Agregar especificaciones por categoría
    Object.keys(summaryByCategory).forEach(category => {
      const specs = this.getCategorySpecs(category);
      guideContent.push(`### ${category}`);
      guideContent.push(`**Productos:** ${summaryByCategory[category].length}`);
      guideContent.push(`**Fondo:** ${specs.background}`);
      guideContent.push(`**Iluminación:** ${specs.lighting}`);
      guideContent.push(`**Ángulo:** ${specs.angle}`);
      guideContent.push(`**Props:** ${specs.props}`);
      guideContent.push(`**Enfoque:** ${specs.focus}`);
      guideContent.push('');
    });

    // Agregar lista de productos por categoría
    guideContent.push('## 📦 Lista de Productos por Categoría', '');
    
    Object.entries(summaryByCategory).forEach(([category, productNames]) => {
      guideContent.push(`### ${category} (${productNames.length} productos)`);
      productNames.forEach((name, index) => {
        guideContent.push(`${index + 1}. ${name}`);
      });
      guideContent.push('');
    });

    // Agregar guía de shooting
    const sampleTemplate = templates[0];
    guideContent.push('## 📸 Guía de Fotografía');
    guideContent.push(...sampleTemplate.shootingGuide);
    guideContent.push('## 🎨 Post-procesamiento');
    guideContent.push(...sampleTemplate.postProcessing);

    // Guardar guía
    const guidePath = path.join(this.templatesDir, `PHOTO-GUIDE-${Date.now()}.md`);
    fs.writeFileSync(guidePath, guideContent.join('\n'));
    
    console.log(`📋 Guía de fotografía generada: ${guidePath}`);
  }

  async processImageBatch(imageDirectory) {
    console.log(`📁 Procesando imágenes desde: ${imageDirectory}\n`);
    
    if (!fs.existsSync(imageDirectory)) {
      throw new Error(`Directorio no encontrado: ${imageDirectory}`);
    }

    const imageFiles = fs.readdirSync(imageDirectory)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

    console.log(`🖼️ ${imageFiles.length} imágenes encontradas`);

    const results = [];

    for (const file of imageFiles) {
      try {
        console.log(`📤 Procesando: ${file}`);
        
        const localPath = path.join(imageDirectory, file);
        const webpFilename = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        // Upload to storage
        const publicUrl = await this.uploadToStorage(localPath, webpFilename);
        
        results.push({
          originalFile: file,
          uploadedAs: webpFilename,
          publicUrl,
          status: 'success'
        });

        console.log(`   ✅ Subido: ${publicUrl}`);
        
      } catch (error) {
        results.push({
          originalFile: file,
          status: 'error',
          error: error.message
        });
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    // Generar reporte de subida
    const reportPath = path.join(this.templatesDir, `upload-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log(`\n📊 Reporte de subida: ${reportPath}`);
    console.log(`✅ Exitosos: ${results.filter(r => r.status === 'success').length}`);
    console.log(`❌ Errores: ${results.filter(r => r.status === 'error').length}`);

    return results;
  }
}

// Funciones de utilidad para usar desde línea de comandos
const manager = new ProfessionalImageManager();

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  console.log('🔧 DEBUG: Script iniciado');
  console.log('🔧 DEBUG: Argumentos:', args);
  console.log('🔧 DEBUG: Acción:', action);

  try {
    switch (action) {
      case 'templates':
        console.log('🔧 DEBUG: Ejecutando templates');
        await manager.batchGenerateTemplates();
        break;
        
      case 'upload':
        const imageDir = args[1];
        if (!imageDir) {
          console.error('❌ Especifica el directorio de imágenes: npm run upload /path/to/images');
          return;
        }
        await manager.processImageBatch(imageDir);
        break;
        
      default:
        console.log(`
🏪 PROFESSIONAL IMAGE MANAGER - BARBARO NUTRITION

Uso:
  node professional-image-manager.mjs templates  - Generar templates de fotografía
  node professional-image-manager.mjs upload <dir>  - Subir imágenes desde directorio

Ejemplos:
  node professional-image-manager.mjs templates
  node professional-image-manager.mjs upload ./product-photos
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar siempre
console.log('🔧 Script iniciando...');
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

export { ProfessionalImageManager };