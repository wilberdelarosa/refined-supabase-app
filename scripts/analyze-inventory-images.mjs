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

// Configuración de imágenes profesionales
const IMAGE_STANDARDS = {
  size: '800x800px',
  backgroundType: 'White background (RGB: 255,255,255)',
  format: 'PNG/WEBP',
  quality: 'High resolution (min 300dpi)',
  style: 'Professional product photography',
  lighting: 'Soft, even lighting',
  angle: 'Front-facing with slight angle for depth',
  shadows: 'Subtle drop shadow or none',
  margin: '10-15% padding around product'
};

const CATEGORY_IMAGE_SPECS = {
  'Proteínas': {
    style: 'Container prominently displayed',
    background: 'Pure white',
    props: 'Optional: protein shake or powder scoop',
    angle: '45-degree angle showing front and side'
  },
  'Creatinas': {
    style: 'Powder or capsule container',
    background: 'Clean white with minimal shadow',
    props: 'Measuring scoop if powder',
    angle: 'Straight front view or slight angle'
  },
  'Pre-Entrenos': {
    style: 'Dynamic container design emphasized',
    background: 'White with subtle energy elements',
    props: 'Shaker bottle optional',
    angle: 'Action-oriented angle'
  },
  'Vitaminas': {
    style: 'Clean bottle/container',
    background: 'Medical-grade clean white',
    props: 'Pills spilled out (few)',
    angle: 'Professional, clinical angle'
  },
  'Accesorios': {
    style: 'Product in use context',
    background: 'White with lifestyle elements',
    props: 'Contextual usage props',
    angle: 'Usage-focused angle'
  }
};

class InventoryImageAnalyzer {
  constructor() {
    this.products = [];
    this.missingImages = [];
    this.imageQualityIssues = [];
    this.recommendations = [];
  }

  async authenticate() {
    console.log('🔐 Autenticando con Supabase...');
    const { error } = await supabase.auth.signInWithPassword({
      email: 'wilber.alitoeirl@gmail.com',
      password: '123456'
    });

    if (error) {
      throw new Error(`Error de autenticación: ${error.message}`);
    }
    console.log('✅ Autenticación exitosa\n');
  }

  async fetchProducts() {
    console.log('📦 Obteniendo productos de la base de datos...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id, 
        name, 
        category, 
        description, 
        price, 
        stock, 
        image_url, 
        created_at,
        featured
      `)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }

    this.products = products || [];
    console.log(`✅ ${this.products.length} productos obtenidos\n`);
  }

  async fetchStorageImages() {
    console.log('📁 Analizando imágenes en Storage...');
    
    const { data: files, error } = await supabase.storage
      .from('products')
      .list('', { limit: 1000 });

    if (error) {
      console.warn(`⚠️ Error accediendo a storage: ${error.message}`);
      return [];
    }

    return files || [];
  }

  analyzeImageStatus() {
    console.log('🔍 Analizando estado de imágenes...\n');
    
    const stats = {
      total: this.products.length,
      withImages: 0,
      withoutImages: 0,
      brokenLinks: 0,
      lowQuality: 0
    };

    this.products.forEach(product => {
      if (!product.image_url || product.image_url.trim() === '') {
        this.missingImages.push({
          ...product,
          issue: 'No image URL'
        });
        stats.withoutImages++;
      } else if (product.image_url.includes('amazon.com') || 
                 product.image_url.includes('walmart') ||
                 product.image_url.includes('media-amazon')) {
        this.imageQualityIssues.push({
          ...product,
          issue: 'External URL (Amazon/Walmart) - likely to break',
          currentUrl: product.image_url
        });
        stats.brokenLinks++;
      } else {
        stats.withImages++;
      }
    });

    this.displayStats(stats);
    return stats;
  }

  displayStats(stats) {
    console.log('📊 ESTADÍSTICAS DE IMÁGENES:');
    console.log('═'.repeat(50));
    console.log(`📦 Total de productos: ${stats.total}`);
    console.log(`✅ Con imagen válida: ${stats.withImages} (${Math.round(stats.withImages/stats.total*100)}%)`);
    console.log(`❌ Sin imagen: ${stats.withoutImages} (${Math.round(stats.withoutImages/stats.total*100)}%)`);
    console.log(`⚠️ Enlaces problemáticos: ${stats.brokenLinks} (${Math.round(stats.brokenLinks/stats.total*100)}%)`);
    console.log('═'.repeat(50));
    console.log('');
  }

  generateRecommendations() {
    console.log('💡 GENERANDO RECOMENDACIONES...\n');

    // Agrupar por categoría
    const categoriesMap = {};
    
    [...this.missingImages, ...this.imageQualityIssues].forEach(product => {
      if (!categoriesMap[product.category]) {
        categoriesMap[product.category] = [];
      }
      categoriesMap[product.category].push(product);
    });

    // Generar recomendaciones por categoría
    Object.entries(categoriesMap).forEach(([category, products]) => {
      const specs = CATEGORY_IMAGE_SPECS[category] || CATEGORY_IMAGE_SPECS['Accesorios'];
      
      this.recommendations.push({
        category,
        productCount: products.length,
        products: products.map(p => ({ id: p.id, name: p.name })),
        imageSpecs: specs,
        standards: IMAGE_STANDARDS,
        priority: this.calculatePriority(products),
        estimatedCost: this.estimatePhotoCost(products.length),
        suggestedFilenames: this.generateFilenames(products)
      });
    });
  }

  calculatePriority(products) {
    const featuredCount = products.filter(p => p.featured).length;
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    
    if (featuredCount > 0) return 'ALTA';
    if (avgPrice > 50) return 'MEDIA';
    return 'BAJA';
  }

  estimatePhotoCost(productCount) {
    const costPerPhoto = 15; // USD por foto profesional
    return {
      professional: productCount * costPerPhoto,
      diy: productCount * 5, // Costo DIY con setup básico
      ai: productCount * 2    // Costo usando AI para generar imágenes
    };
  }

  generateFilenames(products) {
    return products.map(product => {
      const cleanName = product.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      return {
        productId: product.id,
        suggested: `${cleanName}.webp`,
        alternative: `${product.category.toLowerCase()}-${cleanName}.webp`
      };
    });
  }

  async generateReport() {
    const timestamp = new Date().toISOString().split('T')[0];
    const report = {
      metadata: {
        generated: new Date().toISOString(),
        totalProducts: this.products.length,
        analyzer: 'InventoryImageAnalyzer v1.0'
      },
      imageStandards: IMAGE_STANDARDS,
      categorySpecs: CATEGORY_IMAGE_SPECS,
      analysis: {
        products: this.products,
        missingImages: this.missingImages,
        qualityIssues: this.imageQualityIssues,
        recommendations: this.recommendations
      }
    };

    const reportPath = path.join(__dirname, '..', 'docs', `image-analysis-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Reporte completo guardado en: ${reportPath}`);
    return reportPath;
  }

  displayPriorityList() {
    console.log('🎯 LISTA DE PRIORIDADES PARA IMÁGENES:\n');
    
    this.recommendations
      .sort((a, b) => {
        const priorityOrder = { 'ALTA': 3, 'MEDIA': 2, 'BAJA': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .forEach((rec, index) => {
        console.log(`${index + 1}. CATEGORÍA: ${rec.category.toUpperCase()}`);
        console.log(`   Prioridad: ${rec.priority}`);
        console.log(`   Productos: ${rec.productCount}`);
        console.log(`   Costo estimado: $${rec.estimatedCost.professional} USD (profesional)`);
        console.log('   Especificaciones:');
        console.log(`   - Estilo: ${rec.imageSpecs.style}`);
        console.log(`   - Fondo: ${rec.imageSpecs.background}`);
        console.log(`   - Ángulo: ${rec.imageSpecs.angle}`);
        console.log('');
        
        console.log('   Productos requeridos:');
        rec.products.slice(0, 5).forEach(p => {
          console.log(`   • ${p.name}`);
        });
        if (rec.products.length > 5) {
          console.log(`   • ... y ${rec.products.length - 5} más`);
        }
        console.log('\n' + '─'.repeat(60) + '\n');
      });
  }

  async run() {
    try {
      console.log('🏪 ANÁLISIS DE INVENTARIO E IMÁGENES - BARBARO NUTRITION\n');
      console.log('═'.repeat(60));
      
      await this.authenticate();
      await this.fetchProducts();
      
      const storageImages = await this.fetchStorageImages();
      console.log(`📁 ${storageImages.length} imágenes encontradas en Storage\n`);
      
      this.analyzeImageStatus();
      this.generateRecommendations();
      
      // Mostrar resultados
      this.displayPriorityList();
      
      // Generar reporte detallado
      await this.generateReport();
      
      // Resumen final
      console.log('📋 RESUMEN DE ACCIONES REQUERIDAS:');
      console.log('═'.repeat(50));
      console.log(`• ${this.missingImages.length} productos necesitan imagen nueva`);
      console.log(`• ${this.imageQualityIssues.length} productos necesitan reemplazo de imagen`);
      console.log(`• ${this.recommendations.length} categorías identificadas`);
      
      const totalCost = this.recommendations.reduce((sum, rec) => sum + rec.estimatedCost.professional, 0);
      console.log(`• Inversión estimada: $${totalCost} USD (fotografía profesional)`);
      console.log('');
      
      console.log('💡 PRÓXIMOS PASOS RECOMENDADOS:');
      console.log('1. Revisar el reporte detallado generado');
      console.log('2. Priorizar productos featured y alto precio');
      console.log('3. Conseguir fotografía profesional o setup DIY');
      console.log('4. Seguir especificaciones de imagen para cada categoría');
      console.log('5. Usar nombres de archivo sugeridos en el reporte');
      
    } catch (error) {
      console.error('❌ Error en análisis:', error.message);
    }
  }
}

// Ejecutar análisis
const analyzer = new InventoryImageAnalyzer();
analyzer.run();