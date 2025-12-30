import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Categories } from '@/components/home/Categories';
import { Newsletter } from '@/components/home/Newsletter';

const Index = () => {
  return (
    <Layout>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <Newsletter />
    </Layout>
  );
};

export default Index;
