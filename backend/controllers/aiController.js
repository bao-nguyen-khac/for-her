import axios from 'axios';
import productModel from '../models/productModel.js';
import productVariantModel from '../models/productVariantModel.js';
import productImageModel from '../models/productImageModel.js';
import categoryModel from '../models/categoryModel.js';

export const chatWithAI = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, message: 'Lịch sử hội thoại không hợp lệ' });
    }

    const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';
    const modelName = process.env.AI_MODEL_NAME || 'google/gemma-2-9b-it:free';

    if (!apiKey) {
      return res.json({
        success: false,
        message: 'Chưa cấu hình AI_API_KEY hoặc OPENROUTER_API_KEY ở backend. Vui lòng kiểm tra lại file .env',
      });
    }

    // Fetch products
    const rawProducts = await productModel.find({}).lean();

    const productContextList = await Promise.all(
      rawProducts.map(async (p) => {
        const cat = await categoryModel.findById(p.categoryId).lean();
        const variants = await productVariantModel.find({ productId: p._id }).lean();
        const sizes = Array.from(new Set(variants.map((v) => v.size)));

        return {
          id: p._id.toString(),
          name: p.name,
          category: cat ? cat.name : 'Áo dài',
          price: p.price,
          sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
          description: p.description,
        };
      })
    );

    const systemPrompt = `Bạn là "Stylist Áo Dài ForHer" - chuyên gia tư vấn thời trang áo dài hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là tư vấn cho khách hàng chọn áo dài phù hợp với dáng người, màu da, sở thích và đặc biệt là phù hợp với dịp lễ (như Tết, đám cưới, lễ tốt nghiệp, chụp ảnh sen, đi tiệc, đi chùa...).

Dưới đây là danh sách toàn bộ sản phẩm áo dài đang có trong cửa hàng:
${JSON.stringify(productContextList, null, 2)}

Nguyên tắc tư vấn:
1. Luôn lịch sự, thân thiện, xưng hô phù hợp (ví dụ: tư vấn cho bạn, dạ, vâng...).
2. Trả lời bằng tiếng Việt tự nhiên, có cấu trúc rõ ràng. Hãy sử dụng định dạng Markdown (như in đậm **, danh sách gạch đầu dòng, xuống dòng) để câu trả lời sinh động, dễ đọc.
3. Khi khách hàng hỏi hoặc mô tả nhu cầu, hãy giải thích cặn kẽ và đề xuất các sản phẩm phù hợp dựa trên danh sách sản phẩm trên.
4. Chỉ gợi ý những sản phẩm thực sự có trong danh sách trên. Không tự bịa ra sản phẩm.
5. Đối với mỗi sản phẩm gợi ý, hãy nêu rõ lý do tại sao nó phù hợp (về chất liệu như lụa gấm sang trọng, tơ ống bay bổng, chéo Hàn co giãn thoải mái, hay kiểu dáng thêu/đính kết lộng lẫy).
6. Hãy đề xuất thêm cách phối màu sắc quần lụa mặc kèm hoặc mấn phù hợp với chiếc áo đó để tạo thành set đồ hoàn hảo.

CÚ PHÁP ĐỀ XUẤT SẢN PHẨM:
Ở cuối câu trả lời của bạn, bạn BẮT BUỘC phải đính kèm danh sách ID của các sản phẩm bạn đã đề xuất theo đúng cú pháp sau (không viết thêm gì sau phần này):
[RECOMMENDED_IDS: id1, id2]
`;

    const formattedMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: modelName,
        messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
        max_tokens: 2000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ForHer E-commerce',
          'Content-Type': 'application/json',
        },
      }
    );

    const replyContent = response.data.choices[0].message.content;

    let replyText = replyContent;
    let recommendedProductIds = [];

    const tagRegex = /\[RECOMMENDED_IDS:\s*([\s\S]*?)\]/;
    const match = replyText.match(tagRegex);
    if (match) {
      recommendedProductIds = match[1]
        .split(',')
        .map((id) => id.replace(/[\[\]"']/g, '').trim())
        .filter((id) => id.length > 0);

      replyText = replyText.replace(tagRegex, '').trim();
    }

    let recommendedProducts = [];
    if (recommendedProductIds.length > 0) {
      const recRaw = await productModel
        .find({ _id: { $in: recommendedProductIds } })
        .lean();

      recommendedProducts = await Promise.all(
        recRaw.map(async (p) => {
          const imgs = await productImageModel.find({ productId: p._id }).lean();
          return {
            ...p,
            image: imgs.map((i) => i.url),
          };
        })
      );
    }

    res.json({
      success: true,
      reply: replyText,
      recommendedProducts,
    });
  } catch (error) {
    console.error('Lỗi khi gọi API AI:', error.response?.data || error.message);
    res.json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý yêu cầu tư vấn AI: ' + (error.response?.data?.error?.message || error.message),
    });
  }
};
