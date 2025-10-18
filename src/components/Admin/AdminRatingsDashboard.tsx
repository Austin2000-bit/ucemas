import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Star, Search, Filter, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AssistantRating, RatingCategory, User } from "@/types";
import { toast } from "@/hooks/use-toast";

interface RatingWithDetails extends AssistantRating {
  assistant_name: string;
  student_name: string;
  category_name: string;
  category_color: string;
}

const AdminRatingsDashboard = () => {
  const [ratings, setRatings] = useState<RatingWithDetails[]>([]);
  const [ratingCategories, setRatingCategories] = useState<RatingCategory[]>([]);
  const [assistants, setAssistants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssistant, setSelectedAssistant] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch ratings with assistant and student details
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('assistant_ratings')
        .select(`
          *,
          assistant:assistant_id (
            first_name,
            last_name
          ),
          student:student_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;

      // Fetch rating categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('rating_categories')
        .select('*')
        .order('min_rating', { ascending: false });

      if (categoriesError) throw categoriesError;

      // Fetch all assistants
      const { data: assistantsData, error: assistantsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'helper')
        .order('first_name');

      if (assistantsError) throw assistantsError;

      // Process ratings data
      const processedRatings = (ratingsData || []).map(rating => {
        const assistant = rating.assistant as any;
        const student = rating.student as any;
        
        // Find the category for this rating
        const category = categoriesData?.find(cat => 
          rating.rating >= cat.min_rating && rating.rating <= cat.max_rating
        );

        return {
          ...rating,
          assistant_name: assistant ? `${assistant.first_name} ${assistant.last_name}` : 'Unknown Assistant',
          student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          category_name: category?.name || 'Uncategorized',
          category_color: category?.color || '#6B7280'
        };
      });

      setRatings(processedRatings);
      setRatingCategories(categoriesData || []);
      setAssistants(assistantsData || []);
    } catch (error) {
      console.error("Error fetching ratings data:", error);
      toast({
        title: "Error",
        description: "Failed to load ratings data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort ratings
  const filteredRatings = ratings
    .filter(rating => {
      const matchesSearch = 
        rating.assistant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rating.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rating.feedback && rating.feedback.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAssistant = selectedAssistant === "all" || rating.assistant_id === selectedAssistant;
      const matchesCategory = selectedCategory === "all" || rating.category_name === selectedCategory;
      
      return matchesSearch && matchesAssistant && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  // Calculate statistics
  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0 
    ? (ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings).toFixed(2)
    : "0.00";

  const categoryStats = ratingCategories.map(category => {
    const count = ratings.filter(rating => rating.category_name === category.name).length;
    const percentage = totalRatings > 0 ? ((count / totalRatings) * 100).toFixed(1) : "0.0";
    return { ...category, count, percentage };
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Assistant Ratings Dashboard</h2>
        <Button onClick={fetchData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-400" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Ratings</p>
                <p className="text-2xl font-bold">{totalRatings}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{averageRating}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Rated Assistants</p>
                <p className="text-2xl font-bold">
                  {new Set(ratings.map(r => r.assistant_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{ratingCategories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryStats.map((category) => (
              <div key={category.id} className="text-center">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.count}
                </div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">{category.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search ratings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assistant</Label>
              <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
                <SelectTrigger>
                  <SelectValue placeholder="All Assistants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assistants</SelectItem>
                  {assistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.first_name} {assistant.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {ratingCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="highest">Highest Rating</SelectItem>
                  <SelectItem value="lowest">Lowest Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ratings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Ratings ({filteredRatings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assistant</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRatings.length > 0 ? (
                  filteredRatings.map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell className="font-medium">
                        {rating.assistant_name}
                      </TableCell>
                      <TableCell>{rating.student_name}</TableCell>
                      <TableCell>{renderStars(rating.rating)}</TableCell>
                      <TableCell>
                        <Badge 
                          style={{ backgroundColor: rating.category_color, color: 'white' }}
                        >
                          {rating.category_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">
                          {rating.feedback || "No feedback provided"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No ratings found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRatingsDashboard;
