import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';
import { NutritionistCTA } from '@/components/home/NutritionistCTA';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <Categories />
      <NutritionistCTA />
      <FeaturedProducts />
      <Testimonials />
      <Newsletter />
    </Layout>
  );
};

export default Index;
