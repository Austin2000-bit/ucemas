
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useState } from "react";

const SearchFilters = () => {
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      
      <Accordion type="multiple" defaultValue={["price", "accommodation", "activities"]}>
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="pt-2">
              <Slider 
                defaultValue={[0, 1000]} 
                max={5000}
                step={50}
                onValueChange={(value) => setPriceRange(value)}
              />
              <div className="flex justify-between mt-2">
                <span>${priceRange[0]}</span>
                <span>${priceRange[1]}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="accommodation">
          <AccordionTrigger>Accommodation</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Hotels", "Resorts", "Apartments", "Villas", "Hostels"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox id={`accommodation-${type}`} />
                  <Label htmlFor={`accommodation-${type}`}>{type}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="activities">
          <AccordionTrigger>Activities</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["Beach", "Mountain", "City Tour", "Adventure", "Cultural", "Relaxation"].map((activity) => (
                <div key={activity} className="flex items-center space-x-2">
                  <Checkbox id={`activity-${activity}`} />
                  <Label htmlFor={`activity-${activity}`}>{activity}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="rating">
          <AccordionTrigger>Star Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars} className="flex items-center space-x-2">
                  <Checkbox id={`rating-${stars}`} />
                  <Label htmlFor={`rating-${stars}`}>{stars} Stars</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SearchFilters;
