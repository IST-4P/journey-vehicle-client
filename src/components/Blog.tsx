import { BookOpen, Calendar, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  category: string;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  readTime: number;
  views: number;
}

export function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const articlesPerPage = 9;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockArticles: Article[] = [
        {
          id: "1",
          title: "Top 10 Địa Điểm Du Lịch Phượt Đẹp Nhất Việt Nam",
          excerpt:
            "Khám phá những địa điểm tuyệt vời cho người yêu phượt tại Việt Nam với cảnh đẹp hoang sơ và văn hóa độc đáo.",
          content: "Full article content here...",
          author: "Nguyễn Văn An",
          authorAvatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64",
          category: "Du lịch",
          tags: ["Phượt", "Việt Nam", "Cẩm nang"],
          coverImage:
            "https://images.unsplash.com/photo-1593168098026-10d982cb9055?w=800",
          publishedAt: "2024-01-25",
          readTime: 8,
          views: 1523,
        },
        {
          id: "2",
          title: "Hướng Dẫn Cắm Trại An Toàn Cho Người Mới Bắt Đầu",
          excerpt:
            "Tất cả những gì bạn cần biết để có một chuyến cắm trại an toàn và thú vị, từ thiết bị đến kỹ năng sinh tồn cơ bản.",
          content: "Full article content here...",
          author: "Trần Thị Bình",
          authorAvatar:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64",
          category: "Hướng dẫn",
          tags: ["Camping", "An toàn", "Kỹ năng"],
          coverImage:
            "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800",
          publishedAt: "2024-01-22",
          readTime: 10,
          views: 2341,
        },
        {
          id: "3",
          title: "Checklist Đồ Đi Biển Đầy Đủ Nhất",
          excerpt:
            "Danh sách chi tiết những món đồ cần thiết cho chuyến đi biển hoàn hảo, đừng quên bất kỳ thứ gì!",
          content: "Full article content here...",
          author: "Lê Minh Cường",
          authorAvatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64",
          category: "Cẩm nang",
          tags: ["Biển", "Checklist", "Du lịch"],
          coverImage:
            "https://images.unsplash.com/photo-1754491749176-2993a73e2f68?w=800",
          publishedAt: "2024-01-20",
          readTime: 6,
          views: 1876,
        },
        {
          id: "4",
          title: "5 Lý Do Bạn Nên Thuê Xe Máy Khi Du Lịch",
          excerpt:
            "Khám phá sự tự do và linh hoạt khi di chuyển bằng xe máy trong các chuyến du lịch của bạn.",
          content: "Full article content here...",
          author: "Phạm Thu Dung",
          authorAvatar:
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64",
          category: "Du lịch",
          tags: ["Xe máy", "Thuê xe", "Mẹo hay"],
          coverImage:
            "https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800",
          publishedAt: "2024-01-18",
          readTime: 5,
          views: 1234,
        },
        {
          id: "5",
          title: "Kinh Nghiệm Leo Núi Fansipan Cho Người Mới",
          excerpt:
            "Hướng dẫn chi tiết về cách chuẩn bị và chinh phục nóc nhà Đông Dương một cách an toàn.",
          content: "Full article content here...",
          author: "Hoàng Văn Em",
          authorAvatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64",
          category: "Hướng dẫn",
          tags: ["Leo núi", "Fansipan", "Kinh nghiệm"],
          coverImage:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          publishedAt: "2024-01-15",
          readTime: 12,
          views: 3421,
        },
        {
          id: "6",
          title: "Bí Quyết Chụp Ảnh Du Lịch Đẹp Như Photographer",
          excerpt:
            "Những mẹo và kỹ thuật giúp bạn có những bức ảnh du lịch ấn tượng mà không cần máy ảnh chuyên nghiệp.",
          content: "Full article content here...",
          author: "Vũ Thị Phương",
          authorAvatar:
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64",
          category: "Kỹ năng",
          tags: ["Chụp ảnh", "Photography", "Mẹo hay"],
          coverImage:
            "https://images.unsplash.com/photo-1606318834502-c3127255246c?w=800",
          publishedAt: "2024-01-12",
          readTime: 7,
          views: 2156,
        },
        {
          id: "7",
          title: "Du Lịch Tiết Kiệm: 10 Mẹo Cắt Giảm Chi Phí",
          excerpt:
            "Cách để có một chuyến du lịch tuyệt vời mà không phải lo lắng về ví tiền của bạn.",
          content: "Full article content here...",
          author: "Đặng Minh Giang",
          authorAvatar:
            "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=64",
          category: "Cẩm nang",
          tags: ["Tiết kiệm", "Budget", "Mẹo hay"],
          coverImage:
            "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
          publishedAt: "2024-01-10",
          readTime: 9,
          views: 2876,
        },
        {
          id: "8",
          title: "Khám Phá Ẩm Thực Đường Phố Hà Nội",
          excerpt:
            "Một hành trình khám phá những món ăn đường phố đặc trưng và hấp dẫn nhất của thủ đô.",
          content: "Full article content here...",
          author: "Ngô Thu Hà",
          authorAvatar:
            "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64",
          category: "Ẩm thực",
          tags: ["Hà Nội", "Ẩm thực", "Street food"],
          coverImage:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
          publishedAt: "2024-01-08",
          readTime: 6,
          views: 1654,
        },
        {
          id: "9",
          title: "Chuẩn Bị Gì Cho Chuyến Trekking Nhiều Ngày",
          excerpt:
            "Danh sách thiết bị và kỹ năng cần thiết để sẵn sàng cho một chuyến trekking dài ngày thành công.",
          content: "Full article content here...",
          author: "Phan Văn Khoa",
          authorAvatar:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64",
          category: "Hướng dẫn",
          tags: ["Trekking", "Thiết bị", "Chuẩn bị"],
          coverImage:
            "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800",
          publishedAt: "2024-01-05",
          readTime: 11,
          views: 1987,
        },
      ];

      setArticles(mockArticles);
      setFilteredArticles(mockArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, articles]);

  const applyFilters = () => {
    let filtered = [...articles];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    setFilteredArticles(filtered);
  };

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <BookOpen className="h-10 w-10" />
            <h1 className="text-4xl md:text-5xl">Blog Du Lịch</h1>
          </div>
          <p className="text-xl text-blue-100">
            Chia sẻ kinh nghiệm, cẩm nang và mẹo hay cho chuyến đi của bạn
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm bài viết..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value: any) =>
                  setSelectedCategory(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Tìm thấy{" "}
            <span className="font-semibold">{filteredArticles.length}</span> bài
            viết
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="bg-gray-300 h-48"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : paginatedArticles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Không tìm thấy bài viết</h3>
            <p className="text-gray-600 mb-4">Thử tìm kiếm với từ khóa khác</p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("");
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={article.coverImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-2 left-2 bg-white text-blue-700">
                        {article.category}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        {article.title}
                      </h3>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {article.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center space-x-3 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(article.publishedAt).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                        <span>•</span>
                        <span>{article.readTime} phút đọc</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          <img
                            src={article.authorAvatar}
                            alt={article.author}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="text-sm text-gray-700">
                            {article.author}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {article.views} lượt xem
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
