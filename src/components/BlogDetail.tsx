import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Facebook,
  Heart,
  Link as LinkIcon,
  Tag,
  Twitter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  author?: string;
  authorAvatar?: string;
  authorBio?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  publishedAt?: string;
  updatedAt?: string;
  readTime?: number;
  views?: number;
}

interface RelatedArticle {
  id: string;
  title: string;
  coverImage: string;
  publishedAt: string;
}

export function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticle();
    fetchRelatedArticles();
  }, [id, apiBase]);

  const fetchArticle = async () => {
    if (!id || !apiBase) {
      setError("Không thể tải bài viết");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/blog/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      const payload = json.data ?? json;
      const mapped: Article = {
        id: payload.id,
        title: payload.title,
        excerpt: payload.type,
        content: payload.content ?? payload.description ?? "",
        author: payload.authorName ?? "HacMieu Journey",
        authorAvatar: payload.authorAvatar,
        authorBio: payload.authorBio ?? "",
        category: payload.type,
        tags: payload.tags ?? [],
        coverImage: payload.thumbnail,
        publishedAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        readTime: payload.readTime ?? 5,
        views: payload.views ?? 0,
      };
      setArticle(mapped);
    } catch (error) {
      console.error("Error fetching article:", error);
      setArticle(null);
      setError(error instanceof Error ? error.message : "Không thể tải bài viết");
    } finally {
      setLoading(false);
    }
  };
  const fetchRelatedArticles = async () => {
    if (!apiBase) return;
    try {
      const response = await fetch(`${apiBase}/blog?page=1&limit=4`, {
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
      const related = blogs
        .filter((blog: any) => blog.id !== id)
        .slice(0, 3)
        .map((blog: any) => ({
          id: blog.id,
          title: blog.title,
          coverImage: blog.thumbnail,
          publishedAt: blog.createdAt,
        }));
      setRelatedArticles(related);
    } catch (error) {
      console.error("Error fetching related articles:", error);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article?.title || "";

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(text)}`,
          "_blank"
        );
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast.success("Đã sao chép link bài viết!");
        break;
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-3">
        <BookOpen className="h-16 w-16 text-gray-400 mb-2" />
        <h2 className="text-2xl font-semibold">Không tìm thấy bài viết</h2>
        {error && <p className="text-sm text-gray-500 max-w-md">{error}</p>}
        <Button onClick={() => navigate("/blog")}>Quay lại blog</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Trang chủ
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/blog" className="text-gray-600 hover:text-blue-600">
              Blog
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 line-clamp-1">{article.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại blog
        </Button>

        {/* Article Header */}
        <article>
          <header className="mb-6">
            <Badge className="mb-3">{article.category}</Badge>
            <h1 className="text-3xl md:text-4xl mb-4">{article.title}</h1>
            <p className="text-xl text-gray-600 mb-6">{article.excerpt}</p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center space-x-2">
                <img
                  src={
                    article.authorAvatar ??
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64"
                  }
                  alt={article.author ?? "Tác giả"}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {article.author ?? "HacMieu Journey"}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString(
                            "vi-VN"
                          )
                        : "Đang cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10" />

              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{article.readTime ?? 0} phút đọc</span>
              </div>

              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{article.views ?? 0} lượt xem</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(article.tags ?? []).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                </Badge>
              ))}
            </div>

            {/* Social Actions */}
            <div className="flex items-center space-x-2 pb-6 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className={isLiked ? "text-red-600 border-red-600" : ""}
              >
                <Heart
                  className={`h-4 w-4 mr-1 ${isLiked ? "fill-red-600" : ""}`}
                />
                {likes}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="h-4 w-4 mr-1" />
                Chia sẻ
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="h-4 w-4 mr-1" />
                Tweet
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare("copy")}
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
          </header>

          {/* Cover Image */}
          <div className="mb-8 rounded-lg overflow-hidden">
            <ImageWithFallback
              src={article.coverImage}
              alt={article.title}
              className="w-full h-auto"
            />
          </div>

          {/* Article Content */}
          <div
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.content || "" }}
          />

          {/* Author Bio */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={
                    article.authorAvatar ??
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64"
                  }
                  alt={article.author ?? "Tác giả"}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      Về tác giả: {article.author ?? "HacMieu Journey"}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {article.authorBio || "Thông tin đang được cập nhật."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div>
            <h2 className="text-2xl mb-6">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  to={`/blog/${related.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40 overflow-hidden">
                      <ImageWithFallback
                        src={related.coverImage}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        {related.title}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(related.publishedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


