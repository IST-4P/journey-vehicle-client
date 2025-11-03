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
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  authorBio: string;
  category: string;
  tags: string[];
  coverImage: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  views: number;
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

  useEffect(() => {
    fetchArticle();
    fetchRelatedArticles();
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockArticle: Article = {
        id: id || "1",
        title: "Top 10 Địa Điểm Du Lịch Phượt Đẹp Nhất Việt Nam",
        excerpt:
          "Khám phá những địa điểm tuyệt vời cho người yêu phượt tại Việt Nam với cảnh đẹp hoang sơ và văn hóa độc đáo.",
        content: `
          <p>Việt Nam là một đất nước tuyệt đẹp với nhiều địa điểm du lịch hấp dẫn dành cho những người yêu thích phượt. Từ những con đường đèo uốn lượn đến những bãi biển hoang sơ, từ những thửa ruộng bậc thang xanh mướt đến những đỉnh núi cao vút, Việt Nam có tất cả.</p>

          <h2>1. Hà Giang - Vùng đất của những cung đường đèo</h2>
          <p>Hà Giang nổi tiếng với cung đường Mã Pì Lèng hùng vĩ, những cánh đồng hoa tam giác mạch rực rỡ vào mùa thu, và văn hóa đa dạng của các dân tộc thiểu số. Đây là điểm đến không thể bỏ qua đối với bất kỳ ai yêu thích phượt.</p>

          <h2>2. Đà Lạt - Thành phố ngàn hoa</h2>
          <p>Với khí hậu mát mẻ quanh năm, Đà Lạt là điểm đến lý tưởng cho những chuyến phượt thư giãn. Bạn có thể khám phá những đồi thông, thác nước, và các vườn hoa đẹp mắt.</p>

          <h2>3. Mù Cang Chải - Ruộng bậc thang đẹp nhất Việt Nam</h2>
          <p>Mù Cang Chải nổi tiếng với những thửa ruộng bậc thang được xếp tầng như những bức tranh thiên nhiên tuyệt đẹp. Thời điểm đẹp nhất để đến đây là vào tháng 9-10 khi lúa chín vàng.</p>

          <h2>4. Phong Nha - Kẻ Bàng</h2>
          <p>Quần thể hang động Phong Nha - Kẻ Bàng là di sản thiên nhiên thế giới với hệ thống hang động kỳ vĩ, trong đó có Sơn Đoòng - hang động lớn nhất thế giới.</p>

          <h2>5. Pù Luông - Thiên đường xanh</h2>
          <p>Pù Luông là một khu bảo tồn thiên nhiên với cảnh quan núi non hùng vĩ, thung lũng xanh mướt và các bản làng của người Thái trắng mộc mạc, thân thiện.</p>

          <h2>6. Sapa - Thị trấn sương mù</h2>
          <p>Sapa không chỉ đẹp với những thửa ruộng bậc thang mà còn là nơi bạn có thể chinh phục đỉnh Fansipan - nóc nhà Đông Dương cao 3143m.</p>

          <h2>7. Ninh Bình - Vịnh Hạ Long trên cạn</h2>
          <p>Ninh Bình với Tràng An, Tam Cốc - Bích Động là những điểm đến lý tưởng để khám phá vẻ đẹp của thiên nhiên núi non trùng điệp, sông nước hữu tình.</p>

          <h2>8. Quy Nhơn - Bình Định</h2>
          <p>Quy Nhơn là một trong những thành phố biển yên bình nhất Việt Nam với những bãi biển hoang sơ, đẹp như tranh vẽ và giá cả phải chăng.</p>

          <h2>9. Côn Đảo</h2>
          <p>Côn Đảo không chỉ mang ý nghĩa lịch sử mà còn là thiên đường nhiệt đới với những bãi biển xanh trong vắt, rừng nguyên sinh và hệ sinh thái biển phong phú.</p>

          <h2>10. Tây Nguyên - Đất đỏ bazan</h2>
          <p>Tây Nguyên với các tỉnh như Đắk Lắk, Lâm Đồng, Gia Lai là vùng đất của những đồi chè xanh mướt, những thác nước hùng vĩ và văn hóa Tây Nguyên đặc sắc.</p>

          <h2>Kết luận</h2>
          <p>Việt Nam có rất nhiều địa điểm du lịch tuyệt đẹp đang chờ bạn khám phá. Mỗi vùng miền có một vẻ đẹp riêng, nét văn hóa độc đáo và món ăn đặc trưng. Hãy chuẩn bị hành trang và bắt đầu hành trình khám phá Việt Nam của bạn!</p>
        `,
        author: "Nguyễn Văn An",
        authorAvatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64",
        authorBio:
          "Travel blogger với 5 năm kinh nghiệm khám phá Việt Nam và Đông Nam Á. Yêu thích phượt và nhiếp ảnh du lịch.",
        category: "Du lịch",
        tags: ["Phượt", "Việt Nam", "Cẩm nang", "Top 10"],
        coverImage:
          "https://images.unsplash.com/photo-1593168098026-10d982cb9055?w=1200",
        publishedAt: "2024-01-25",
        updatedAt: "2024-01-26",
        readTime: 8,
        views: 1523,
      };

      setArticle(mockArticle);
      setLikes(Math.floor(Math.random() * 100) + 50);
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error("Không thể tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      // Mock data
      const mockRelated: RelatedArticle[] = [
        {
          id: "2",
          title: "Hướng Dẫn Cắm Trại An Toàn Cho Người Mới Bắt Đầu",
          coverImage:
            "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400",
          publishedAt: "2024-01-22",
        },
        {
          id: "3",
          title: "Checklist Đồ Đi Biển Đầy Đủ Nhất",
          coverImage:
            "https://images.unsplash.com/photo-1754491749176-2993a73e2f68?w=400",
          publishedAt: "2024-01-20",
        },
        {
          id: "5",
          title: "Kinh Nghiệm Leo Núi Fansipan Cho Người Mới",
          coverImage:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
          publishedAt: "2024-01-15",
        },
      ];
      setRelatedArticles(mockRelated);
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl mb-2">Không tìm thấy bài viết</h2>
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
                  src={article.authorAvatar}
                  alt={article.author}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {article.author}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(article.publishedAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-10" />

              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{article.readTime} phút đọc</span>
              </div>

              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{article.views} lượt xem</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
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
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Author Bio */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={article.authorAvatar}
                  alt={article.author}
                  className="w-16 h-16 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">
                      Về tác giả: {article.author}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{article.authorBio}</p>
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
