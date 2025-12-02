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
  excerpt?: string;
  content?: string;
  author?: string;
  authorAvatar?: string;
  category?: string;
  tags: string[];
  coverImage?: string;
  publishedAt?: string;
  readTime?: number;
  views?: number;
  type?: string;
  region?: string;
}

export function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const articlesPerPage = 9;

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      if (!apiBase) {
        throw new Error("Chưa cấu hình API");
      }
      const response = await fetch(`${apiBase}/blog`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      const payload = json.data ?? json;
      const blogs = Array.isArray(payload.blogs)
        ? payload.blogs
        : Array.isArray(payload.items)
        ? payload.items
        : [];
      const mapped: Article[] = blogs.map((blog: any) => ({
        id: blog.id,
        title: blog.title,
        excerpt: blog.type
          ? `${blog.type}${blog.region ? ` · ${blog.region}` : ""}`
          : undefined,
        author: blog.authorName ?? "HacMieu Journey",
        category: blog.type,
        tags: blog.tags ?? [],
        coverImage: blog.thumbnail,
        publishedAt: blog.createdAt,
        type: blog.type,
        region: blog.region,
      }));
      setArticles(mapped);
      setFilteredArticles(mapped);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setArticles([]);
      setFilteredArticles([]);
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
      filtered = filtered.filter((article) => {
        const titleMatch = article.title?.toLowerCase().includes(query);
        const excerptMatch = article.excerpt?.toLowerCase().includes(query);
        const tagsMatch = (article.tags ?? []).some((tag) =>
          tag.toLowerCase().includes(query)
        );
        return Boolean(titleMatch || excerptMatch || tagsMatch);
      });
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    setFilteredArticles(filtered);
  };

  const categories = Array.from(
    new Set(articles.map((a) => a.category).filter(Boolean))
  ) as string[];

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
                      </div>

                      <div className="pt-3 border-t text-sm text-gray-700">
                        {article.author || ' '}
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

