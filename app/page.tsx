import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import UserTypeSection from "./components/UserTypeSection";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <UserTypeSection />
      <FAQ />
      <Footer />
    </main>
  );
}
