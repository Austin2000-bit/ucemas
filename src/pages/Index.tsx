
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SearchResults from "@/components/SearchResults";
import SearchFilters from "@/components/SearchFilters";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useState } from "react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Perfect Travel Destination</h1>
            <p className="text-xl mb-8">Discover amazing places around the world with the best deals</p>
            
            <div className="relative">
              <Input
                className="w-full h-14 pl-12 pr-4 rounded-full text-black"
                placeholder="Search destinations, hotels, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                className="absolute right-1 top-1 h-12 rounded-full px-8 bg-blue-600 hover:bg-blue-700"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <div className="w-full md:w-1/4">
            <SearchFilters />
          </div>
          
          {/* Results */}
          <div className="w-full md:w-3/4">
            <h2 className="text-2xl font-bold mb-6">Popular Destinations</h2>
            <SearchResults />
          </div>
        </div>
      </section>
      
      {/* Featured Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Featured Travel Packages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="overflow-hidden">
                <div className="h-48 bg-blue-200"></div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg">Exclusive {item} Week Package</h3>
                  <p className="text-gray-600 mt-2">Starting from $999</p>
                  <Button className="mt-4 w-full">View Details</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
