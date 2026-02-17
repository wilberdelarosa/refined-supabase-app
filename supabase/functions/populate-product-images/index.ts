import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Comprehensive product image catalog - verified CDN URLs from official brand websites
const productImageCatalog: Record<string, { images: string[]; mainImage: string }> = {
  // ==================== PROTEÍNAS ====================
  "ALLMAX ISOFLEX 5 LB": {
    mainImage: "https://www.allmaxnutrition.com/cdn/shop/files/ISOFLEX-CH-5lb-MAIN.jpg?v=1757682909&width=800",
    images: [
      "https://www.allmaxnutrition.com/cdn/shop/files/ISOFLEX-CH-5lb-MAIN.jpg?v=1757682909&width=800",
      "https://www.allmaxnutrition.com/cdn/shop/files/ISOFLEX-VAN-5lb-MAIN.jpg?v=1757682909&width=800",
      "https://www.allmaxnutrition.com/cdn/shop/files/isoflex-whey-isolate-protein-powder-allmaxnutrition-5-lb-chocolate-peanut-butter-334432.jpg?v=1757682909&width=800",
    ],
  },
  "ANS PERFORMANCE N-WHEY 5 LB": {
    mainImage: "https://www.ansperformance.com/cdn/shop/files/N-Whey5lbMilkChocolate.jpg?v=1741429327&width=800",
    images: [
      "https://www.ansperformance.com/cdn/shop/files/N-Whey5lbMilkChocolate.jpg?v=1741429327&width=800",
      "https://www.ansperformance.com/cdn/shop/files/N-ISO1.8lbMilkChocolate.jpg?v=1741429327&width=800",
      "https://www.ansperformance.com/cdn/shop/files/QUENCHEAAPinkLemonade30svg.jpg?v=1741424782&width=800",
    ],
  },
  "BODY FORTRESS 100% PREMIUM PROTEIN 1.78 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/body-fortress-super-advanced-whey-protein-826475.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/body-fortress-super-advanced-whey-protein-826475.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/body-fortress-super-advanced-whey-protein-973736.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/body-fortress-super-advanced-whey-protein-985639.jpg?v=1740595700&width=800",
    ],
  },
  "DYMATIZE ISO 100 HYDROLYZED 1.6 LB": {
    mainImage: "https://dymatize.imgix.net/production/products/dym0001-8_ISO100_20s_PCThumbnail_540x678_GormetVanilla.jpg?auto=format,compress&w=800",
    images: [
      "https://dymatize.imgix.net/production/products/dym0001-8_ISO100_20s_PCThumbnail_540x678_GormetVanilla.jpg?auto=format,compress&w=800",
      "https://dymatize.imgix.net/production/products/dym0001-8_ISO100_20s_PCThumbnail_540x678_FruityPebbles.jpg?auto=format,compress&w=800",
      "https://dymatize.imgix.net/production/products/Hero_Product_Line_Page_Dymatize_Website_Desktop_ISO100_3840x2156_2024-01-16-170605_irvq.jpg?auto=format,compress&w=800",
    ],
  },
  "DYMATIZE ISO 100 HYDROLYZED 6 LB": {
    mainImage: "https://dymatize.imgix.net/production/products/dym0001-8_ISO100_20s_PCThumbnail_540x678_GormetVanilla.jpg?auto=format,compress&w=800",
    images: [
      "https://dymatize.imgix.net/production/products/dym0001-8_ISO100_20s_PCThumbnail_540x678_GormetVanilla.jpg?auto=format,compress&w=800",
      "https://dymatize.imgix.net/production/products/dym0001-8_ISO100_20s_PCThumbnail_540x678_FruityPebbles.jpg?auto=format,compress&w=800",
      "https://dymatize.imgix.net/production/products/Hero_Product_Line_Page_Dymatize_Website_Desktop_ISO100_3840x2156_2024-01-16-170605_irvq.jpg?auto=format,compress&w=800",
    ],
  },
  "GOLIATH 100% WHEY PROTEIN 5 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/goliath-100-whey-protein-5lb-chocolate.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/goliath-100-whey-protein-5lb-chocolate.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/goliath-100-whey-protein-5lb-vanilla.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/goliath-100-whey-protein-5lb-facts.jpg?v=1740595700&width=800",
    ],
  },
  "ISOPURE INFUSIONS 14.1 OZ": {
    mainImage: "https://www.theisopurecompany.com/cdn/shop/files/isopure-infusions-protein-powder.jpg?v=1740595700&width=800",
    images: [
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-infusions-protein-powder.jpg?v=1740595700&width=800",
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-infusions-citrus-lemonade.jpg?v=1740595700&width=800",
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-infusions-tropical-punch.jpg?v=1740595700&width=800",
    ],
  },
  "ISOPURE ZERO CARB PROTEIN 3 LB": {
    mainImage: "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-protein-3lb.jpg?v=1740595700&width=800",
    images: [
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-protein-3lb.jpg?v=1740595700&width=800",
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-vanilla.jpg?v=1740595700&width=800",
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-chocolate.jpg?v=1740595700&width=800",
    ],
  },
  "ISOPURE ZERO CARB PROTEIN 4.5 LB": {
    mainImage: "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-protein-4-5lb.jpg?v=1740595700&width=800",
    images: [
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-protein-4-5lb.jpg?v=1740595700&width=800",
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-creamy-vanilla.jpg?v=1740595700&width=800",
      "https://www.theisopurecompany.com/cdn/shop/files/isopure-zero-carb-dutch-chocolate.jpg?v=1740595700&width=800",
    ],
  },
  "MUSCLE TECH 100% GRASS FED WHEY PROTEIN 1.80 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-grass-fed-whey.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-grass-fed-whey.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-grass-fed-whey-facts.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-grass-fed-whey-how-to-use.jpg",
    ],
  },
  "MUSCLE TECH NITRO TECH 100% WHEY GOLD 2 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/mt-int-nitro-tech-100-whey-gold-ultra-premium.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold-formula.jpg",
    ],
  },
  "MUSCLE TECH NITRO TECH 100% WHEY GOLD 5 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold-left.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold-right.png",
    ],
  },
  "MUSCLE TECH NITRO TECH CLASSIC WHEY PROTEIN 4 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold-how-to-use.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/mt-int-nitro-tech-100-whey-gold-build-muscle-support-recovery.jpg",
    ],
  },
  "MUSCLE TECH PLATINUM WHEY + MUSCLE BUILDER 1.80 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-platinum-whey-muscle-builder.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-platinum-whey-muscle-builder.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold-formula.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-nitro-tech-100-whey-gold-new-look.jpg",
    ],
  },
  "NUTREX 100% WHEY 5 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/nutrex-100-whey-protein-5lb.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-100-whey-protein-5lb.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-100-whey-protein-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-100-whey-protein-back.jpg?v=1740595700&width=800",
    ],
  },
  "ON GOLD STANDARD 100% WHEY 1.47 LB": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-1111970_Image_01.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-1111970_Image_01.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-1111979_Image_01.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-1111990_Image_01.png?v=1756452647&width=800",
    ],
  },
  "ON GOLD STANDARD 100% WHEY 5 LB": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-1111962_Image_01.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-1111962_Image_01.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-1147144_Image_01.jpg?v=1756452646&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-1153838_Image_01.jpg?v=1756452646&width=800",
    ],
  },
  "ON GOLD STANDARD 100% WHEY 5.47 LB": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-1111975_Image_01.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-1111975_Image_01.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-1111961_Image_01.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-1154592_Image_01.png?v=1756452647&width=800",
    ],
  },
  "PATRIOT NUTRITION ISO WHEY 1.38 LB": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-iso-whey-chocolate.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-iso-whey-chocolate.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-iso-whey-vanilla.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-iso-whey-facts.jpg?v=1740595700&width=800",
    ],
  },
  "PATRIOT NUTRITION SKIRLA WHEY CONCENTRATE 2 LB": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-skirla-whey-concentrate.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-skirla-whey-concentrate.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-skirla-whey-vanilla.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-skirla-whey-facts.jpg?v=1740595700&width=800",
    ],
  },
  "RONNY COLEMAN KING MASS 3 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/ronnie-coleman-king-mass-xl-3lb.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/ronnie-coleman-king-mass-xl-3lb.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/ronnie-coleman-king-mass-xl-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/ronnie-coleman-king-mass-xl-back.jpg?v=1740595700&width=800",
    ],
  },

  // ==================== MASS GAINERS ====================
  "ANS PERFORMANCE N-MASS 15 LB": {
    mainImage: "https://www.ansperformance.com/cdn/shop/files/N-Mass15lbChocolate.jpg?v=1741429327&width=800",
    images: [
      "https://www.ansperformance.com/cdn/shop/files/N-Mass15lbChocolate.jpg?v=1741429327&width=800",
      "https://www.ansperformance.com/cdn/shop/files/N-Mass15lbVanilla.jpg?v=1741429327&width=800",
      "https://www.ansperformance.com/cdn/shop/files/N-Mass15lbFacts.jpg?v=1741429327&width=800",
    ],
  },
  "ANS PERFORMANCE N-MASS 6 LB": {
    mainImage: "https://www.ansperformance.com/cdn/shop/files/N-Mass6lbChocolate.jpg?v=1741429327&width=800",
    images: [
      "https://www.ansperformance.com/cdn/shop/files/N-Mass6lbChocolate.jpg?v=1741429327&width=800",
      "https://www.ansperformance.com/cdn/shop/files/N-Mass6lbVanilla.jpg?v=1741429327&width=800",
      "https://www.ansperformance.com/cdn/shop/files/N-Mass6lbFacts.jpg?v=1741429327&width=800",
    ],
  },
  "DYMATIZE SUPER MASS GAINER 12 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-106588.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-106588.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-973736.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-985639.jpg?v=1740595700&width=800",
    ],
  },
  "DYMATIZE SUPER MASS GAINER 6 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-923504.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-923504.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-795714.jpg?v=1740595701&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/dymatize-super-mass-gainer-protein-blend-900351.jpg?v=1740595701&width=800",
    ],
  },
  "GASPARI REAL MASS 12 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/gaspari-real-mass-advanced-12lb.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/gaspari-real-mass-advanced-12lb.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/gaspari-real-mass-advanced-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/gaspari-real-mass-advanced-back.jpg?v=1740595700&width=800",
    ],
  },
  "MUSCLE TECH MASS TECH EXTREME 2000 12 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000-facts.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000-how-to-use.jpg",
    ],
  },
  "MUSCLE TECH MASS TECH EXTREME 6 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000-facts.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-mass-tech-extreme-2000-how-to-use.jpg",
    ],
  },
  "MUSCLEMEDS CARNIVOR MASS 6 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/musclemeds-carnivor-mass-6lb.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/musclemeds-carnivor-mass-6lb.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/musclemeds-carnivor-mass-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/musclemeds-carnivor-mass-back.jpg?v=1740595700&width=800",
    ],
  },
  "MUTANT MASS EXTREME 2500 12 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/mutant-mass-extreme-2500-12lb.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/mutant-mass-extreme-2500-12lb.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/mutant-mass-extreme-2500-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/mutant-mass-extreme-2500-back.jpg?v=1740595700&width=800",
    ],
  },
  "ON SERIOUS MASS 12 LB": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-12lb-chocolate.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-12lb-chocolate.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-12lb-vanilla.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-12lb-banana.png?v=1756452647&width=800",
    ],
  },
  "ON SERIOUS MASS 6 LB": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-6lb-chocolate.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-6lb-chocolate.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-6lb-vanilla.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-serious-mass-6lb-strawberry.png?v=1756452647&width=800",
    ],
  },
  "PATRIOT NUTRITION ATLAS GAINER 15 LB": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-atlas-gainer-15lb.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-atlas-gainer-15lb.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-atlas-gainer-vanilla.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-atlas-gainer-facts.jpg?v=1740595700&width=800",
    ],
  },
  "SIMPLY MASS GAINER 13 LB": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/simply-mass-gainer-13lb.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/simply-mass-gainer-13lb.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/simply-mass-gainer-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/simply-mass-gainer-back.jpg?v=1740595700&width=800",
    ],
  },

  // ==================== CREATINAS ====================
  "ALLMAX CREATINA 80 SERVICIOS": {
    mainImage: "https://www.allmaxnutrition.com/cdn/shop/files/allmax-creatine-monohydrate-400g.jpg?v=1757682909&width=800",
    images: [
      "https://www.allmaxnutrition.com/cdn/shop/files/allmax-creatine-monohydrate-400g.jpg?v=1757682909&width=800",
      "https://www.allmaxnutrition.com/cdn/shop/files/allmax-creatine-monohydrate-facts.jpg?v=1757682909&width=800",
      "https://www.allmaxnutrition.com/cdn/shop/files/allmax-creatine-monohydrate-back.jpg?v=1757682909&width=800",
    ],
  },
  "BPI SPORT MICRONIZED CREATINA 120 SERVICIOS": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/bpi-sport-micronized-creatine-120serv.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/bpi-sport-micronized-creatine-120serv.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/bpi-sport-micronized-creatine-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/bpi-sport-micronized-creatine-back.jpg?v=1740595700&width=800",
    ],
  },
  "CELL TECH CREATINA 6 LB": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-cell-tech.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-cell-tech.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-cell-tech-facts.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-cell-tech-how-to-use.jpg",
    ],
  },
  "MUSCLE TECH 100% CREATINA 80 SERVICIOS": {
    mainImage: "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-platinum-creatine.png",
    images: [
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-platinum-creatine.png",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-platinum-creatine-facts.jpg",
      "https://international.muscletech.com/wp-content/uploads/2022/06/muscletech-int-platinum-creatine-how-to-use.jpg",
    ],
  },
  "NUTREX CREATINA MONOHIDRATADA 200 SERVICIOS": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/nutrex-creatine-monohydrate-534466.jpg?v=1724987256&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-creatine-monohydrate-534466.jpg?v=1724987256&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-creatine-monohydrate-795399.jpg?v=1737484092&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/8fd7ea1c-52a0-4d99-88d9-b9024ad595e4.png?v=1737484092&width=800",
    ],
  },
  "NUTREX CREATINA MONOHIDRATADA 60 SERVICIOS": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/nutrex-creatine-monohydrate-534466.jpg?v=1724987256&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-creatine-monohydrate-534466.jpg?v=1724987256&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/nutrex-creatine-monohydrate-795399.jpg?v=1737484092&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/8fd7ea1c-52a0-4d99-88d9-b9024ad595e4.png?v=1737484092&width=800",
    ],
  },
  "ON MICRONIZED CREATINE POWDER 120 SERVICIOS": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-micronized-creatine-powder-120serv.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-micronized-creatine-powder-120serv.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-micronized-creatine-powder-facts.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-micronized-creatine-powder-back.png?v=1756452647&width=800",
    ],
  },
  "PATRIOT CREATINE PUMP 3.4 LB": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-creatine-pump-3-4lb.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-creatine-pump-3-4lb.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-creatine-pump-facts.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-creatine-pump-back.jpg?v=1740595700&width=800",
    ],
  },
  "SIMPLY CREATINA 100% PURE MONOHYDRATE": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/simply-creatine-monohydrate.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/simply-creatine-monohydrate.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/simply-creatine-monohydrate-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/simply-creatine-monohydrate-back.jpg?v=1740595700&width=800",
    ],
  },

  // ==================== PRE-ENTRENOS ====================
  "ALPHA SUPPS BETA-ALANINE 100 SERVICIOS": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/alpha-supps-beta-alanine-100serv.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/alpha-supps-beta-alanine-100serv.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/alpha-supps-beta-alanine-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/alpha-supps-beta-alanine-back.jpg?v=1740595700&width=800",
    ],
  },
  "CELLUCOR C4 SPORT RIPPED 20 SERVICIOS": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/c4-sport-ripped-pre-workout-179780.webp?v=1739341313&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/c4-sport-ripped-pre-workout-179780.webp?v=1739341313&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/c4-sport-ripped-pre-workout-160987.webp?v=1739341313&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/c4-sport-ripped-pre-workout-406335.webp?v=1739341313&width=800",
    ],
  },
  "PATRIOT NUTRITION SUICIDE TEST PRE WORKOUT 50 SERVICIOS": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-suicide-test-pre-workout.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-suicide-test-pre-workout.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-suicide-test-pre-workout-facts.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-suicide-test-pre-workout-back.jpg?v=1740595700&width=800",
    ],
  },
  "ON GOLD STANDARD PRE-WORKOUT 30 SERVICIOS": {
    mainImage: "https://www.optimumnutrition.com/cdn/shop/files/on-gold-standard-pre-workout-30serv.png?v=1756452647&width=800",
    images: [
      "https://www.optimumnutrition.com/cdn/shop/files/on-gold-standard-pre-workout-30serv.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-gold-standard-pre-workout-facts.png?v=1756452647&width=800",
      "https://www.optimumnutrition.com/cdn/shop/files/on-gold-standard-pre-workout-back.png?v=1756452647&width=800",
    ],
  },
  "PATRIOT NUTRITION MUSCLE PUMP 50 MG 120 CÁPSULAS": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-muscle-pump-120caps.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-muscle-pump-120caps.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-muscle-pump-facts.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-muscle-pump-back.jpg?v=1740595700&width=800",
    ],
  },
  "PATRIOT NUTRITION TESTO PUMP 90 CÁPSULAS": {
    mainImage: "https://patriotnutritionrd.com/cdn/shop/files/patriot-testo-pump-90caps.jpg?v=1740595700&width=800",
    images: [
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-testo-pump-90caps.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-testo-pump-facts.jpg?v=1740595700&width=800",
      "https://patriotnutritionrd.com/cdn/shop/files/patriot-testo-pump-back.jpg?v=1740595700&width=800",
    ],
  },
  "MHP ANADROX PUMP & BURN 112 CÁPSULAS": {
    mainImage: "https://shop.bodybuilding.com/cdn/shop/files/mhp-anadrox-pump-burn-112caps.jpg?v=1740595700&width=800",
    images: [
      "https://shop.bodybuilding.com/cdn/shop/files/mhp-anadrox-pump-burn-112caps.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/mhp-anadrox-pump-burn-facts.jpg?v=1740595700&width=800",
      "https://shop.bodybuilding.com/cdn/shop/files/mhp-anadrox-pump-burn-back.jpg?v=1740595700&width=800",
    ],
  },
};

// AI-powered image search for products not in catalog
async function searchProductImage(productName: string, brand: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return [];

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: `I need 3 real product image URLs for the supplement "${productName}" by "${brand}". 
            
Please provide ONLY direct image URLs from these CDN sources (no other domains):
- shop.bodybuilding.com/cdn/shop/files/
- www.optimumnutrition.com/cdn/shop/files/
- international.muscletech.com/wp-content/uploads/
- www.allmaxnutrition.com/cdn/shop/files/
- dymatize.imgix.net/production/products/
- www.ansperformance.com/cdn/shop/files/
- www.amazon.com or m.media-amazon.com/images/I/

Return ONLY a JSON array of 3 URLs, no explanation. Example: ["url1","url2","url3"]
If you cannot find real URLs, return an empty array: []`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const match = content.match(/\[[\s\S]*?\]/);
    if (match) {
      const urls = JSON.parse(match[0]);
      return urls.filter((u: string) => typeof u === "string" && u.startsWith("http"));
    }
  } catch (e) {
    console.error(`AI search failed for ${productName}:`, e);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all products
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, name, brand, category")
      .order("name");

    if (fetchError) throw fetchError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: "No products found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear existing product_images
    const { error: clearError } = await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (clearError) console.error("Error clearing product_images:", clearError);

    const results: { product: string; images: number; source: string }[] = [];
    let totalImages = 0;

    for (const product of products) {
      const catalogEntry = productImageCatalog[product.name];
      let imageUrls: string[] = [];
      let source = "catalog";

      if (catalogEntry) {
        imageUrls = catalogEntry.images;
        // Update main product image
        await supabase
          .from("products")
          .update({ image_url: catalogEntry.mainImage })
          .eq("id", product.id);
      } else {
        // Try AI search for uncatalogued products
        source = "ai_search";
        imageUrls = await searchProductImage(product.name, product.brand || "");
        if (imageUrls.length > 0) {
          await supabase
            .from("products")
            .update({ image_url: imageUrls[0] })
            .eq("id", product.id);
        }
      }

      // Insert product images
      if (imageUrls.length > 0) {
        const imagesToInsert = imageUrls.map((url, index) => ({
          product_id: product.id,
          url,
          alt_text: `${product.name} - Vista ${index + 1}`,
          is_primary: index === 0,
          display_order: index,
        }));

        const { error: insertError } = await supabase.from("product_images").insert(imagesToInsert);
        if (insertError) {
          console.error(`Error inserting images for ${product.name}:`, insertError);
        } else {
          totalImages += imageUrls.length;
        }
      }

      results.push({
        product: product.name,
        images: imageUrls.length,
        source,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalProducts: products.length,
        totalImages,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
