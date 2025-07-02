import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface RatingComponentProps {
  driverId: string;
  rideId: string;
}

const RatingComponent = ({ driverId, rideId }: RatingComponentProps) => {
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    const { error } = await supabase.from('ride_ratings').insert([
      { driver_id: driverId, ride_id: rideId, rating }
    ]);
    if (error) {
      setError("Failed to submit rating.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return <div className="text-green-600 font-bold">Thank you for rating your driver!</div>;
  }

  return (
    <div className="my-4 p-4 bg-gray-100 rounded-lg">
      <div className="mb-2 font-semibold">Rate your driver:</div>
      <div className="flex gap-2 mb-2">
        {[1,2,3,4,5].map((star) => (
          <span
            key={star}
            className={`cursor-pointer text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <Button onClick={handleSubmit} disabled={submitted || !rating}>
        Submit Rating
      </Button>
    </div>
  );
};

export default RatingComponent; 