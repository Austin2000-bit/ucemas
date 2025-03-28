
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

// Mock data for destinations
const destinations = [
  {
    id: 1,
    name: "Bali, Indonesia",
    image: "/placeholder.svg",
    price: 849,
    rating: 4.8,
    tags: ["Beach", "Cultural"],
    description: "Experience tropical paradise with stunning beaches and rich cultural heritage"
  },
  {
    id: 2,
    name: "Paris, France",
    image: "/placeholder.svg",
    price: 1249,
    rating: 4.7,
    tags: ["City Tour", "Cultural"],
    description: "Explore the city of lights with its iconic landmarks and exquisite cuisine"
  },
  {
    id: 3,
    name: "Santorini, Greece",
    image: "/placeholder.svg",
    price: 1099,
    rating: 4.9,
    tags: ["Beach", "Relaxation"],
    description: "Enjoy breathtaking views of white buildings and blue domes overlooking the sea"
  },
  {
    id: 4,
    name: "Tokyo, Japan",
    image: "/placeholder.svg",
    price: 1349,
    rating: 4.6,
    tags: ["City Tour", "Cultural"],
    description: "Discover the perfect blend of traditional culture and futuristic technology"
  }
];

const SearchResults = () => {
  return (
    <div className="space-y-6">
      {destinations.map((destination) => (
        <Card key={destination.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 h-48 md:h-auto bg-gray-200">
              <img 
                src={destination.image} 
                alt={destination.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="flex-1 p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">{destination.name}</h3>
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm font-medium">{destination.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-600 mt-2">{destination.description}</p>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {destination.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <div>
                  <span className="text-sm text-gray-500">Starting from</span>
                  <p className="text-xl font-bold text-blue-600">${destination.price}</p>
                </div>
                <Button>View Details</Button>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SearchResults;
